/**
 * Western Electric (WECO) & Nelson 8 Rules SPC (Statistical Process Control) Engine
 * & Metrology Run/Audit Report Generator.
 *
 * Implements:
 * - Full 8 Nelson rules detection on metrology run sequences
 * - Process capability indices (Cp, Cpk, Pp, Ppk)
 * - Self-contained SVG Control Chart generator for offline cleanroom audit printing
 */

export interface SpcDataPoint {
  index: number;
  value: number;
  timestamp?: string | number;
  lotId?: string;
  waferId?: string;
}

export interface SpcLimits {
  mean: number;
  sigma: number;
  ucl: number; // Mean + 3*sigma
  lcl: number; // Mean - 3*sigma
  uwl: number; // Mean + 2*sigma (Warning limit)
  lwl: number; // Mean - 2*sigma (Warning limit)
  ucl1: number; // Mean + 1*sigma
  lcl1: number; // Mean - 1*sigma
  usl?: number; // Upper Spec Limit
  lsl?: number; // Lower Spec Limit
  target?: number;
}

export interface SpcRuleViolation {
  pointIndex: number;
  sampleId?: string;
  ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  ruleName: string;
  severity: 'Critical' | 'Warning';
  description: string;
}

export interface ProcessCapability {
  cp: number | null;
  cpk: number | null;
  cpu: number | null;
  cpl: number | null;
  pp?: number | null;
  ppk?: number | null;
  status: 'In Control' | 'Capable' | 'Marginal' | 'Incapable';
}

export interface SpcAnalysisResult {
  limits: SpcLimits;
  points: SpcDataPoint[];
  violations: SpcRuleViolation[];
  violationsByRule: Record<number, number>;
  capability: ProcessCapability;
  outOfControlIndices: Set<number>;
}

/**
 * Calculates SPC limits from raw data points, or uses given baseline mean & sigma
 */
export function calculateSpcLimits(
  values: number[],
  options?: { target?: number; usl?: number; lsl?: number; baselineMean?: number; baselineSigma?: number }
): SpcLimits {
  if (values.length === 0) {
    return {
      mean: 0,
      sigma: 0,
      ucl: 0,
      lcl: 0,
      uwl: 0,
      lwl: 0,
      ucl1: 0,
      lcl1: 0,
      target: options?.target,
      usl: options?.usl,
      lsl: options?.lsl,
    };
  }

  const mean = options?.baselineMean ?? values.reduce((sum, v) => sum + v, 0) / values.length;
  let sigma = options?.baselineSigma;
  if (sigma === undefined) {
    if (values.length <= 1) {
      sigma = 0;
    } else {
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
      sigma = Math.sqrt(variance);
    }
  }

  return {
    mean: Number(mean.toFixed(4)),
    sigma: Number(sigma.toFixed(4)),
    ucl: Number((mean + 3 * sigma).toFixed(4)),
    lcl: Number((mean - 3 * sigma).toFixed(4)),
    uwl: Number((mean + 2 * sigma).toFixed(4)),
    lwl: Number((mean - 2 * sigma).toFixed(4)),
    ucl1: Number((mean + 1 * sigma).toFixed(4)),
    lcl1: Number((mean - 1 * sigma).toFixed(4)),
    target: options?.target,
    usl: options?.usl,
    lsl: options?.lsl,
  };
}

/**
 * Calculates Cp and Cpk capability metrics given spec limits
 */
export function calculateProcessCapability(mean: number, sigma: number, usl?: number, lsl?: number): ProcessCapability {
  if (sigma <= 0 || (usl === undefined && lsl === undefined)) {
    return { cp: null, cpk: null, cpu: null, cpl: null, status: 'In Control' };
  }

  let cpu: number | null = null;
  let cpl: number | null = null;
  let cp: number | null = null;
  let cpk: number | null = null;

  if (usl !== undefined) {
    cpu = (usl - mean) / (3 * sigma);
  }
  if (lsl !== undefined) {
    cpl = (mean - lsl) / (3 * sigma);
  }

  if (usl !== undefined && lsl !== undefined) {
    cp = (usl - lsl) / (6 * sigma);
    cpk = Math.min(cpu!, cpl!);
  } else if (usl !== undefined) {
    cpk = cpu;
  } else if (lsl !== undefined) {
    cpk = cpl;
  }

  let status: ProcessCapability['status'] = 'In Control';
  if (cpk !== null) {
    if (cpk >= 1.67) status = 'Capable'; // Six sigma level
    else if (cpk >= 1.33) status = 'Capable'; // Standard fab threshold
    else if (cpk >= 1.0) status = 'Marginal';
    else status = 'Incapable';
  }

  return {
    cp: cp !== null ? Number(cp.toFixed(3)) : null,
    cpk: cpk !== null ? Number(cpk.toFixed(3)) : null,
    cpu: cpu !== null ? Number(cpu.toFixed(3)) : null,
    cpl: cpl !== null ? Number(cpl.toFixed(3)) : null,
    status,
  };
}

/**
 * Evaluates Nelson & WECO 8 rules on a continuous metrology run sequence
 */
export function evaluateNelsonRules(
  data: SpcDataPoint[] | number[],
  customLimits?: Partial<SpcLimits>
): SpcAnalysisResult {
  const points: SpcDataPoint[] = data.map((d, i) => (typeof d === 'number' ? { index: i, value: d } : d));
  const rawValues = points.map((p) => p.value);
  const calculated = calculateSpcLimits(rawValues, {
    usl: customLimits?.usl,
    lsl: customLimits?.lsl,
    target: customLimits?.target,
    baselineMean: customLimits?.mean,
    baselineSigma: customLimits?.sigma,
  });
  const limits: SpcLimits = { ...calculated, ...customLimits };

  const { mean, sigma, ucl, lcl } = limits;
  const violations: SpcRuleViolation[] = [];
  const outOfControlIndices = new Set<number>();
  const violationsByRule: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

  if (sigma <= 0 || points.length === 0) {
    return {
      limits,
      points,
      violations,
      violationsByRule,
      capability: calculateProcessCapability(mean, sigma, limits.usl, limits.lsl),
      outOfControlIndices,
    };
  }

  const addViolation = (
    index: number,
    ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    ruleName: string,
    severity: 'Critical' | 'Warning',
    description: string
  ) => {
    violations.push({
      pointIndex: index,
      sampleId: points[index].lotId || points[index].waferId || `#${index + 1}`,
      ruleNumber,
      ruleName,
      severity,
      description,
    });
    outOfControlIndices.add(index);
    violationsByRule[ruleNumber]++;
  };

  // Rule 1: One point beyond 3 sigma (outside UCL or LCL)
  for (let i = 0; i < points.length; i++) {
    const val = points[i].value;
    if (val > ucl || val < lcl) {
      addViolation(
        i,
        1,
        'Rule 1: Beyond 3σ Outlier',
        'Critical',
        `Point ${i + 1} (${val.toFixed(2)}) is outside 3-sigma control limits [${lcl.toFixed(2)}, ${ucl.toFixed(2)}]`
      );
    }
  }

  // Rule 2: Nine consecutive points on same side of center line (Mean Shift)
  let consecutiveSameSide = 0;
  let lastSide = 0; // +1 for above mean, -1 for below
  for (let i = 0; i < points.length; i++) {
    const side = points[i].value > mean ? 1 : points[i].value < mean ? -1 : 0;
    if (side !== 0 && side === lastSide) {
      consecutiveSameSide++;
    } else {
      lastSide = side;
      consecutiveSameSide = side !== 0 ? 1 : 0;
    }
    if (consecutiveSameSide >= 9) {
      addViolation(
        i,
        2,
        'Rule 2: Nine Consecutive Points on Same Side',
        'Warning',
        `9 or more consecutive points on the ${side > 0 ? 'upper' : 'lower'} side of the center line (Process Shift)`
      );
    }
  }

  // Rule 3: Six consecutive points steadily increasing or steadily decreasing (Trend)
  let trendCount = 1;
  let trendDirection = 0; // +1 strictly increasing, -1 strictly decreasing
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].value - points[i - 1].value;
    const dir = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (dir !== 0 && dir === trendDirection) {
      trendCount++;
    } else {
      trendDirection = dir;
      trendCount = dir !== 0 ? 2 : 1;
    }
    if (trendCount >= 6) {
      addViolation(
        i,
        3,
        'Rule 3: Six Consecutive Increasing or Decreasing',
        'Warning',
        `6 or more consecutive points steadily ${trendDirection > 0 ? 'increasing' : 'decreasing'} (Tool Drift)`
      );
    }
  }

  // Rule 4: Fourteen consecutive points alternating up and down (Oscillation)
  let alternateCount = 1;
  let lastDeltaSign = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].value - points[i - 1].value;
    const sign = delta > 0 ? 1 : delta < 0 ? -1 : 0;
    if (sign !== 0 && lastDeltaSign !== 0 && sign === -lastDeltaSign) {
      alternateCount++;
    } else {
      alternateCount = sign !== 0 ? 2 : 1;
    }
    lastDeltaSign = sign;
    if (alternateCount >= 14) {
      addViolation(
        i,
        4,
        'Rule 4: Fourteen Points Alternating Up and Down',
        'Warning',
        '14 points alternating up and down in direction (Systematic Oscillation)'
      );
    }
  }

  // Rule 5: 2 out of 3 consecutive points > 2 sigma on the same side
  for (let i = 2; i < points.length; i++) {
    const window = [points[i - 2].value, points[i - 1].value, points[i].value];
    const upper2Sig = window.filter((v) => v > mean + 2 * sigma).length;
    const lower2Sig = window.filter((v) => v < mean - 2 * sigma).length;
    if (upper2Sig >= 2 || lower2Sig >= 2) {
      addViolation(
        i,
        5,
        'Rule 5: 2 of 3 Points Beyond 2σ',
        'Warning',
        `2 out of 3 consecutive points in Zone A (> 2σ on ${upper2Sig >= 2 ? 'upper' : 'lower'} side)`
      );
    }
  }

  // Rule 6: 4 out of 5 consecutive points > 1 sigma on the same side
  for (let i = 4; i < points.length; i++) {
    const window = [points[i - 4].value, points[i - 3].value, points[i - 2].value, points[i - 1].value, points[i].value];
    const upper1Sig = window.filter((v) => v > mean + 1 * sigma).length;
    const lower1Sig = window.filter((v) => v < mean - 1 * sigma).length;
    if (upper1Sig >= 4 || lower1Sig >= 4) {
      addViolation(
        i,
        6,
        'Rule 6: 4 of 5 Points Beyond 1σ',
        'Warning',
        `4 out of 5 consecutive points in Zone B or beyond (> 1σ on ${upper1Sig >= 4 ? 'upper' : 'lower'} side)`
      );
    }
  }

  // Rule 7: 15 consecutive points in Zone C (within ±1 sigma on either side) - Stratification
  let zoneCCount = 0;
  for (let i = 0; i < points.length; i++) {
    const inZoneC = Math.abs(points[i].value - mean) <= 1 * sigma;
    if (inZoneC) {
      zoneCCount++;
    } else {
      zoneCCount = 0;
    }
    if (zoneCCount >= 15) {
      addViolation(
        i,
        7,
        'Rule 7: 15 Points in Zone C',
        'Warning',
        '15 consecutive points within ±1σ of center line (Stratification / Artificially Reduced Variation)'
      );
    }
  }

  // Rule 8: 8 consecutive points with none in Zone C (all outside ±1 sigma on either side) - Mixture
  let outZoneCCount = 0;
  for (let i = 0; i < points.length; i++) {
    const outsideZoneC = Math.abs(points[i].value - mean) > 1 * sigma;
    if (outsideZoneC) {
      outZoneCCount++;
    } else {
      outZoneCCount = 0;
    }
    if (outZoneCCount >= 8) {
      addViolation(
        i,
        8,
        'Rule 8: 8 Points Outside Zone C',
        'Warning',
        '8 consecutive points with none in Zone C (Mixture / Bimodal Process Distribution)'
      );
    }
  }

  const capability = calculateProcessCapability(mean, sigma, limits.usl, limits.lsl);

  return {
    limits,
    points,
    violations,
    violationsByRule,
    capability,
    outOfControlIndices,
  };
}

/**
 * Generates an SVG Control Chart string with control limits, data series,
 * and flagged violation markers, suitable for offline printing and report embedding.
 */
export function generateSpcControlChartSvg(
  analysis: SpcAnalysisResult,
  options?: { width?: number; height?: number; title?: string }
): string {
  const width = options?.width || 800;
  const height = options?.height || 420;
  const title = options?.title || 'Metrology Run Statistical Process Control (SPC) Chart';

  const margin = { top: 50, right: 60, bottom: 40, left: 65 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const { limits, points, outOfControlIndices, capability } = analysis;
  if (points.length === 0) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#999">No SPC data</text></svg>`;
  }

  const allY = points.map((p) => p.value);
  allY.push(limits.ucl, limits.lcl, limits.mean);
  if (limits.usl !== undefined) allY.push(limits.usl);
  if (limits.lsl !== undefined) allY.push(limits.lsl);

  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const yPadding = (maxY - minY) * 0.1 || 1;
  const yDomainMin = minY - yPadding;
  const yDomainMax = maxY + yPadding;

  const scaleX = (i: number) => margin.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const scaleY = (val: number) => margin.top + plotH - ((val - yDomainMin) / (yDomainMax - yDomainMin)) * plotH;

  const yUcl = scaleY(limits.ucl);
  const yLcl = scaleY(limits.lcl);
  const yMean = scaleY(limits.mean);
  const yUwl = scaleY(limits.uwl);
  const yLwl = scaleY(limits.lwl);

  // Line path
  const linePoints = points.map((p, i) => `${scaleX(i).toFixed(1)},${scaleY(p.value).toFixed(1)}`).join(' ');

  // Dot elements
  const dotsSvg = points
    .map((p, i) => {
      const cx = scaleX(i).toFixed(1);
      const cy = scaleY(p.value).toFixed(1);
      const isOoc = outOfControlIndices.has(i);
      const color = isOoc ? '#dc2626' : '#0d9488';
      const r = isOoc ? 5.5 : 3.5;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="1.5"><title>Pt ${i + 1}: ${p.value}</title></circle>`;
    })
    .join('\n  ');

  // Capability text
  const capInfo = capability.cpk !== null ? ` | Cp=${capability.cp} Cpk=${capability.cpk} (${capability.status})` : '';

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <!-- Header -->
  <text x="${margin.left}" y="28" font-size="16" font-weight="600" fill="#1e293b">${title}</text>
  <text x="${margin.left}" y="44" font-size="11" fill="#64748b">Mean=${limits.mean} | σ=${limits.sigma} | UCL=${limits.ucl} | LCL=${limits.lcl}${capInfo}</text>

  <!-- Plot background & Zone A/B/C Bands -->
  <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="#f8fafc" stroke="#cbd5e1" />

  <!-- Limit Lines -->
  <!-- UCL -->
  <line x1="${margin.left}" y1="${yUcl}" x2="${margin.left + plotW}" y2="${yUcl}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" />
  <text x="${margin.left + plotW + 5}" y="${yUcl + 4}" font-size="10" fill="#ef4444" font-weight="600">UCL ${limits.ucl}</text>

  <!-- UWL -->
  <line x1="${margin.left}" y1="${yUwl}" x2="${margin.left + plotW}" y2="${yUwl}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2" />

  <!-- Mean (CL) -->
  <line x1="${margin.left}" y1="${yMean}" x2="${margin.left + plotW}" y2="${yMean}" stroke="#0f766e" stroke-width="1.5" />
  <text x="${margin.left + plotW + 5}" y="${yMean + 4}" font-size="10" fill="#0f766e" font-weight="600">CL ${limits.mean}</text>

  <!-- LWL -->
  <line x1="${margin.left}" y1="${yLwl}" x2="${margin.left + plotW}" y2="${yLwl}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2" />

  <!-- LCL -->
  <line x1="${margin.left}" y1="${yLcl}" x2="${margin.left + plotW}" y2="${yLcl}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" />
  <text x="${margin.left + plotW + 5}" y="${yLcl + 4}" font-size="10" fill="#ef4444" font-weight="600">LCL ${limits.lcl}</text>

  <!-- Data Series Line -->
  <polyline fill="none" stroke="#0d9488" stroke-width="1.8" points="${linePoints}" />

  <!-- Data Series Dots -->
  ${dotsSvg}
</svg>`;
}
