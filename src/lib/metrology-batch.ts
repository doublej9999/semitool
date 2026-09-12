/**
 * Fab Metrology Batch Processing & SPC/Monte Carlo Linkage.
 *
 * Provides high-throughput parsing and statistical characterization for semiconductor
 * metrology datasets (CD-SEM, Spectroscopic Ellipsometry, CMP Thickness, 4-Point Probe Rs, etc.):
 * - Multi-format tabular parsing (Subgroup matrix, Long wafer-site table, Unstructured stream)
 * - Metadata & limit auto-detection (# Target, LSL, USL, Unit)
 * - Rigorous parametric & non-parametric statistics (Mean, StdDev, Quartiles, IQR)
 * - Statistical outlier detection (Tukey IQR and 3-Sigma Shewhart criteria)
 * - Subgroup aggregation for SPC Control Charts (X-bar & R)
 * - Seamless URL & parameter bridge to SPC and Process Capability Monte Carlo tools
 * - Factory sample generators for standard semiconductor process modules
 */

export interface MetrologyDataRow {
  waferId?: string;
  site?: string | number;
  value: number;
  isOutlier?: boolean;
}

export interface MetrologyLimits {
  target?: number;
  lsl?: number;
  usl?: number;
  unit?: string;
}

export interface MetrologyStatistics {
  count: number;
  mean: number;
  stdDev: number; // Sample standard deviation (N - 1 divisor)
  popStdDev: number; // Population standard deviation (N divisor)
  median: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  outlierIndices: number[];
  outliers: number[];
  cleanMean: number; // Mean excluding outliers
  cleanStdDev: number; // StdDev excluding outliers
}

export interface MetrologyDataset {
  rawValues: number[];
  rows: MetrologyDataRow[];
  subgroups: number[][];
  subgroupSize: number;
  statistics: MetrologyStatistics;
  limits: MetrologyLimits;
  format: 'subgroup_matrix' | 'long_table' | 'number_stream';
}

export interface MetrologyParseOptions {
  subgroupSize?: number; // Default 5 (valid 2..10 for Shewhart charts)
  outlierMethod?: 'tukey' | 'three_sigma' | 'none';
  target?: number;
  lsl?: number;
  usl?: number;
  unit?: string;
}

/**
 * Calculates quantile value using linear interpolation between closest ranks (Type 7 / R default).
 */
export function calculateQuantile(sortedNumbers: number[], q: number): number {
  if (sortedNumbers.length === 0) return 0;
  if (sortedNumbers.length === 1) return sortedNumbers[0];
  if (q <= 0) return sortedNumbers[0];
  if (q >= 1) return sortedNumbers[sortedNumbers.length - 1];

  const pos = (sortedNumbers.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (base + 1 < sortedNumbers.length) {
    return sortedNumbers[base] + rest * (sortedNumbers[base + 1] - sortedNumbers[base]);
  }
  return sortedNumbers[base];
}

/**
 * Computes summary statistics, quartiles, and identifies outliers.
 */
export function computeMetrologyStatistics(
  values: number[],
  outlierMethod: 'tukey' | 'three_sigma' | 'none' = 'tukey',
): MetrologyStatistics {
  const n = values.length;
  if (n === 0) {
    return {
      count: 0,
      mean: 0,
      stdDev: 0,
      popStdDev: 0,
      median: 0,
      min: 0,
      max: 0,
      range: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outlierIndices: [],
      outliers: [],
      cleanMean: 0,
      cleanStdDev: 0,
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  const median = calculateQuantile(sorted, 0.5);
  const q1 = calculateQuantile(sorted, 0.25);
  const q3 = calculateQuantile(sorted, 0.75);
  const iqr = q3 - q1;

  // Variances
  const varianceSum = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const popStdDev = Math.sqrt(varianceSum / n);
  const stdDev = n > 1 ? Math.sqrt(varianceSum / (n - 1)) : 0;

  // Outlier detection
  const outlierIndices: number[] = [];
  const outliers: number[] = [];

  if (outlierMethod === 'tukey' && iqr > 0) {
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    values.forEach((v, idx) => {
      if (v < lowerFence || v > upperFence) {
        outlierIndices.push(idx);
        outliers.push(v);
      }
    });
  } else if (outlierMethod === 'three_sigma' && stdDev > 0) {
    const lowerBound = mean - 3 * stdDev;
    const upperBound = mean + 3 * stdDev;
    values.forEach((v, idx) => {
      if (v < lowerBound || v > upperBound) {
        outlierIndices.push(idx);
        outliers.push(v);
      }
    });
  }

  // Clean metrics excluding outliers
  const cleanValues = values.filter((_, idx) => !outlierIndices.includes(idx));
  const cleanCount = cleanValues.length;
  const cleanMean = cleanCount > 0 ? cleanValues.reduce((acc, v) => acc + v, 0) / cleanCount : mean;
  const cleanVariance =
    cleanCount > 1
      ? cleanValues.reduce((acc, v) => acc + (v - cleanMean) ** 2, 0) / (cleanCount - 1)
      : 0;
  const cleanStdDev = Math.sqrt(cleanVariance);

  return {
    count: n,
    mean,
    stdDev,
    popStdDev,
    median,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
    outlierIndices,
    outliers,
    cleanMean,
    cleanStdDev,
  };
}

/**
 * Extracts metadata header comments like `# LSL=90, USL=110, Target=100, Unit=nm`
 */
function extractLimitsFromComments(text: string): MetrologyLimits {
  const limits: MetrologyLimits = {};
  const commentLines = text
    .split(/\r?\n/)
    .filter((l) => /^\s*[#;/]/.test(l));

  for (const line of commentLines) {
    const targetMatch = line.match(/(?:target|center|nominal)\s*[:=]\s*([0-9.-]+)/i);
    if (targetMatch) limits.target = Number(targetMatch[1]);

    const lslMatch = line.match(/(?:lsl|lower|min_spec)\s*[:=]\s*([0-9.-]+)/i);
    if (lslMatch) limits.lsl = Number(lslMatch[1]);

    const uslMatch = line.match(/(?:usl|upper|max_spec)\s*[:=]\s*([0-9.-]+)/i);
    if (uslMatch) limits.usl = Number(uslMatch[1]);

    const unitMatch = line.match(/(?:unit)\s*[:=]\s*([a-zA-Zµμ%°/]+)/i);
    if (unitMatch) limits.unit = unitMatch[1].trim();
  }

  return limits;
}

/**
 * Main parser: takes arbitrary fab metrology CSV / TSV / text input and returns a structured dataset.
 */
export function parseMetrologyCsv(text: string, options: MetrologyParseOptions = {}): MetrologyDataset {
  const commentLimits = extractLimitsFromComments(text);
  const effectiveLimits: MetrologyLimits = {
    target: options.target ?? commentLimits.target,
    lsl: options.lsl ?? commentLimits.lsl,
    usl: options.usl ?? commentLimits.usl,
    unit: options.unit ?? commentLimits.unit ?? 'nm',
  };

  const defaultSubgroupSize = options.subgroupSize && options.subgroupSize >= 2 && options.subgroupSize <= 10
    ? options.subgroupSize
    : 5;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\s*[#;/]/.test(l));

  if (lines.length === 0) {
    return {
      rawValues: [],
      rows: [],
      subgroups: [],
      subgroupSize: defaultSubgroupSize,
      statistics: computeMetrologyStatistics([]),
      limits: effectiveLimits,
      format: 'number_stream',
    };
  }

  // Tokenize rows
  const parsedRows: string[][] = lines.map((line) => {
    // Delimiter detection: Tab, Comma, Semicolon, or Whitespace
    if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
    if (line.includes(',')) return line.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    if (line.includes(';')) return line.split(';').map((c) => c.trim());
    return line.split(/\s+/).map((c) => c.trim());
  });

  // Determine if header row is present
  let hasHeader = false;
  let waferColIdx = -1;
  let siteColIdx = -1;
  let valueColIdx = -1;
  let lslColIdx = -1;
  let uslColIdx = -1;
  let targetColIdx = -1;

  const firstRow = parsedRows[0];
  const containsAlpha = firstRow.some((cell) => /[a-zA-Z_]/.test(cell));

  if (containsAlpha) {
    hasHeader = true;
    firstRow.forEach((colName, idx) => {
      const lower = colName.toLowerCase();
      if (/^(wafer|lot|slot|wafer_id|w_id|sample)/.test(lower)) waferColIdx = idx;
      else if (/^(site|point|die|pos|location|site_id)/.test(lower)) siteColIdx = idx;
      else if (/^(value|val|reading|measurement|meas|thickness|thk|cd|rs|width|bias)/.test(lower)) valueColIdx = idx;
      else if (/^(lsl|lower)/.test(lower)) lslColIdx = idx;
      else if (/^(usl|upper)/.test(lower)) uslColIdx = idx;
      else if (/^(target|nominal|center)/.test(lower)) targetColIdx = idx;
    });
  }

  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;

  // Case 1: Long table with Wafer & Value columns detected
  if (hasHeader && waferColIdx !== -1 && valueColIdx !== -1) {
    const rows: MetrologyDataRow[] = [];
    const waferSubgroupsMap: Map<string, number[]> = new Map();

    dataRows.forEach((tokens) => {
      const valStr = tokens[valueColIdx];
      const val = Number(valStr);
      if (!Number.isFinite(val)) return;

      const waferId = tokens[waferColIdx] || 'W01';
      const site = siteColIdx !== -1 ? tokens[siteColIdx] : undefined;

      rows.push({ waferId, site, value: val });

      if (!waferSubgroupsMap.has(waferId)) {
        waferSubgroupsMap.set(waferId, []);
      }
      waferSubgroupsMap.get(waferId)!.push(val);

      // Check for inline limits
      if (lslColIdx !== -1 && effectiveLimits.lsl === undefined) {
        const parsed = Number(tokens[lslColIdx]);
        if (Number.isFinite(parsed)) effectiveLimits.lsl = parsed;
      }
      if (uslColIdx !== -1 && effectiveLimits.usl === undefined) {
        const parsed = Number(tokens[uslColIdx]);
        if (Number.isFinite(parsed)) effectiveLimits.usl = parsed;
      }
      if (targetColIdx !== -1 && effectiveLimits.target === undefined) {
        const parsed = Number(tokens[targetColIdx]);
        if (Number.isFinite(parsed)) effectiveLimits.target = parsed;
      }
    });

    const rawValues = rows.map((r) => r.value);
    const statistics = computeMetrologyStatistics(rawValues, options.outlierMethod);

    // Flag outliers
    statistics.outlierIndices.forEach((idx) => {
      if (rows[idx]) rows[idx].isOutlier = true;
    });

    // Subgroups grouped by Wafer ID
    const subgroups: number[][] = [];
    waferSubgroupsMap.forEach((pts) => {
      if (pts.length >= 2) {
        subgroups.push(pts.slice(0, 10)); // Cap to max Shewhart 10
      }
    });

    const subgroupSize = subgroups.length > 0 ? subgroups[0].length : defaultSubgroupSize;

    return {
      rawValues,
      rows,
      subgroups,
      subgroupSize,
      statistics,
      limits: effectiveLimits,
      format: 'long_table',
    };
  }

  // Case 2: Subgroup matrix format (each row has multiple numeric columns, e.g. 5 sites per row)
  const numericMatrix: number[][] = [];
  const flatNumbers: number[] = [];

  dataRows.forEach((tokens, rIdx) => {
    // If first column looks like a label (e.g. W01, LotA), skip it
    let startIdx = 0;
    if (tokens.length > 1 && isNaN(Number(tokens[0])) && !isNaN(Number(tokens[1]))) {
      startIdx = 1;
    }

    const rowNums: number[] = [];
    for (let i = startIdx; i < tokens.length; i++) {
      const n = Number(tokens[i]);
      if (Number.isFinite(n)) {
        rowNums.push(n);
        flatNumbers.push(n);
      }
    }

    if (rowNums.length > 0) {
      numericMatrix.push(rowNums);
    }
  });

  const isMatrixFormat = numericMatrix.length >= 2 && numericMatrix[0].length >= 2;

  if (isMatrixFormat) {
    const rawValues = flatNumbers;
    const statistics = computeMetrologyStatistics(rawValues, options.outlierMethod);

    const rows: MetrologyDataRow[] = [];
    let globalIdx = 0;

    numericMatrix.forEach((row, wIdx) => {
      row.forEach((val, sIdx) => {
        rows.push({
          waferId: `W${String(wIdx + 1).padStart(2, '0')}`,
          site: `Site_${sIdx + 1}`,
          value: val,
          isOutlier: statistics.outlierIndices.includes(globalIdx++),
        });
      });
    });

    // Standardize subgroup sizes
    const firstLen = numericMatrix[0].length;
    const allSameLen = numericMatrix.every((r) => r.length === firstLen);
    const effectiveSubgroups = allSameLen
      ? numericMatrix.map((r) => r.slice(0, 10))
      : chunkNumbers(flatNumbers, defaultSubgroupSize);

    return {
      rawValues,
      rows,
      subgroups: effectiveSubgroups,
      subgroupSize: effectiveSubgroups[0]?.length || defaultSubgroupSize,
      statistics,
      limits: effectiveLimits,
      format: 'subgroup_matrix',
    };
  }

  // Case 3: Single column or stream of numbers
  const statistics = computeMetrologyStatistics(flatNumbers, options.outlierMethod);
  const rows: MetrologyDataRow[] = flatNumbers.map((val, idx) => ({
    waferId: `W${String(Math.floor(idx / defaultSubgroupSize) + 1).padStart(2, '0')}`,
    site: (idx % defaultSubgroupSize) + 1,
    value: val,
    isOutlier: statistics.outlierIndices.includes(idx),
  }));

  const subgroups = chunkNumbers(flatNumbers, defaultSubgroupSize);

  return {
    rawValues: flatNumbers,
    rows,
    subgroups,
    subgroupSize: defaultSubgroupSize,
    statistics,
    limits: effectiveLimits,
    format: 'number_stream',
  };
}

/**
 * Splits a flat array of numbers into fixed-size subgroups.
 */
function chunkNumbers(nums: number[], size: number): number[][] {
  const result: number[][] = [];
  const s = Math.max(2, Math.min(10, size));
  for (let i = 0; i + s <= nums.length; i += s) {
    result.push(nums.slice(i, i + s));
  }
  return result;
}

/**
 * Converts dataset subgroups into SPC text format (comma-separated rows).
 */
export function formatSubgroupsForSpc(subgroups: number[][]): string {
  return subgroups.map((subgroup) => subgroup.map((v) => Number(v.toFixed(4))).join(', ')).join('\n');
}

/**
 * Builds URL to open SPC Control Chart with the parsed subgroup data.
 */
export function buildSpcCalculatorUrl(dataset: MetrologyDataset): string {
  const text = formatSubgroupsForSpc(dataset.subgroups);
  const params = new URLSearchParams();
  params.set('subgroups', text);
  return `/tools/spc-control-chart-calculator?${params.toString()}`;
}

/**
 * Builds URL to open Process Capability Calculator with calculated Mean, Sigma, and limits.
 */
export function buildCapabilityCalculatorUrl(dataset: MetrologyDataset, excludeOutliers = false): string {
  const mean = excludeOutliers ? dataset.statistics.cleanMean : dataset.statistics.mean;
  const sigma = excludeOutliers ? dataset.statistics.cleanStdDev : dataset.statistics.stdDev;

  const params = new URLSearchParams();
  params.set('mean', mean.toFixed(4));
  params.set('sigma', (sigma || 0.001).toFixed(4));

  if (dataset.limits.lsl !== undefined) {
    params.set('lower', dataset.limits.lsl.toString());
  }
  if (dataset.limits.usl !== undefined) {
    params.set('upper', dataset.limits.usl.toString());
  }
  if (dataset.limits.unit) {
    params.set('unit', dataset.limits.unit);
  }

  return `/tools/process-capability-calculator?${params.toString()}`;
}

/**
 * Realistic Fab preset data generator for testing and cleanroom demonstrations.
 */
export function generateFabSampleCsv(
  preset: 'gate_cd' | 'oxide_thickness' | 'cmp_erosion' | 'sheet_resistance',
): string {
  switch (preset) {
    case 'gate_cd': {
      // 20 Wafers, 5 sites per wafer (Center, Top, Bottom, Left, Right). Target: 28.0 nm, LSL: 26.5, USL: 29.5
      const header = '# Fab Process: Gate Poly-Si Etch Critical Dimension (CD-SEM)\n# Target=28.0, LSL=26.5, USL=29.5, Unit=nm\nWafer,Site_Center,Site_North,Site_South,Site_West,Site_East';
      const rows: string[] = [];
      const base = 28.0;
      for (let w = 1; w <= 20; w++) {
        // Slight drift across lot
        const lotDrift = (w - 10) * 0.03;
        const c = (base + lotDrift + (Math.sin(w) * 0.2)).toFixed(2);
        const n = (base + lotDrift + 0.15 + (Math.cos(w) * 0.25)).toFixed(2);
        const s = (base + lotDrift + 0.12 + (Math.sin(w * 1.5) * 0.2)).toFixed(2);
        const we = (base + lotDrift - 0.10 + (Math.cos(w * 0.8) * 0.18)).toFixed(2);
        const ea = (base + lotDrift - 0.08 + (Math.sin(w * 2.1) * 0.22)).toFixed(2);
        rows.push(`W${String(w).padStart(2, '0')},${c},${n},${s},${we},${ea}`);
      }
      return `${header}\n${rows.join('\n')}`;
    }

    case 'oxide_thickness': {
      // Spectroscopic Ellipsometry Thermal Oxide, 25 wafers, 5 sites. Target: 100.0 nm, LSL: 95.0, USL: 105.0
      const header = '# Fab Process: Furnace Gate Oxide Ellipsometry\n# Target=100.0, LSL=95.0, USL=105.0, Unit=nm\nWafer,Center,North,South,West,East';
      const rows: string[] = [];
      for (let w = 1; w <= 25; w++) {
        const boatPos = (w - 13) * 0.08; // Boat thermal gradient
        const c = (100.1 + boatPos + ((w % 3) * 0.15)).toFixed(2);
        const n = (99.8 + boatPos + ((w % 4) * 0.12)).toFixed(2);
        const s = (99.9 + boatPos + ((w % 5) * 0.14)).toFixed(2);
        const we = (100.3 + boatPos - ((w % 3) * 0.1)).toFixed(2);
        const ea = (100.2 + boatPos - ((w % 4) * 0.12)).toFixed(2);
        rows.push(`W${String(w).padStart(2, '0')},${c},${n},${s},${we},${ea}`);
      }
      return `${header}\n${rows.join('\n')}`;
    }

    case 'cmp_erosion': {
      // Copper CMP oxide erosion, Target: 15.0 nm, LSL: 5.0, USL: 25.0
      const header = '# Fab Process: Dual Damascene Cu CMP Dishing/Erosion\n# Target=15.0, LSL=5.0, USL=25.0, Unit=nm\nWafer,Center,Mid_Radius,Edge';
      const rows: string[] = [];
      for (let w = 1; w <= 16; w++) {
        const padLifeEffect = (w / 16) * 1.5;
        const c = (14.2 + padLifeEffect + Math.sin(w) * 0.8).toFixed(2);
        const m = (15.0 + padLifeEffect + Math.cos(w) * 0.9).toFixed(2);
        const e = (16.8 + padLifeEffect * 1.3 + Math.sin(w * 1.2) * 1.1).toFixed(2);
        rows.push(`W${String(w).padStart(2, '0')},${c},${m},${e}`);
      }
      return `${header}\n${rows.join('\n')}`;
    }

    case 'sheet_resistance': {
      // 4-Point Probe Rs for Source/Drain Boron Implant, Target: 120.0 Ohm/sq, LSL: 110.0, USL: 130.0
      const header = '# Fab Process: Source/Drain Boron Implant Rs (4-Point Probe)\n# Target=120.0, LSL=110.0, USL=130.0, Unit=ohm/sq\nWafer,Site_1,Site_2,Site_3,Site_4,Site_5';
      const rows: string[] = [];
      for (let w = 1; w <= 18; w++) {
        const doseDrift = Math.cos(w * 0.5) * 1.2;
        const s1 = (119.5 + doseDrift + ((w % 2) * 0.4)).toFixed(2);
        const s2 = (120.2 + doseDrift - ((w % 3) * 0.3)).toFixed(2);
        const s3 = (120.8 + doseDrift + ((w % 4) * 0.5)).toFixed(2);
        const s4 = (119.9 + doseDrift - ((w % 2) * 0.2)).toFixed(2);
        const s5 = (120.4 + doseDrift + ((w % 5) * 0.3)).toFixed(2);
        rows.push(`W${String(w).padStart(2, '0')},${s1},${s2},${s3},${s4},${s5}`);
      }
      return `${header}\n${rows.join('\n')}`;
    }
  }
}
