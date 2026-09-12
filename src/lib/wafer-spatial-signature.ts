/**
 * Wafer Spatial Defect Signatures & Yield Modeling Loop
 *
 * Implements advanced wafer spatial pattern recognition:
 * - Annular radial binning for ring/donut edge patterns (CMP overpolish, etch edge roll-off)
 * - Scratch / line detection via linear regression aspect ratio & spatial continuity
 * - Localized cluster hotspot / particle burst detection
 * - Clark-Evans aggregation index R for spatial clustering vs randomness
 * - Radial die yield gradient modeling: Y(r) = Y0 * exp(-alpha * r^2)
 * - Yield model comparison loop (Poisson, Murphy, Seeds, Negative Binomial)
 */

export type SpatialPatternType =
  | 'random'
  | 'ring'
  | 'scratch'
  | 'hotspot'
  | 'edge_exclusion'
  | 'checkerboard'
  | 'center_hotspot';

export interface SpatialSignature {
  pattern: SpatialPatternType;
  confidence: number; // 0 to 1
  description: string;
  rootCauses: string[];
}

export interface RadialBin {
  rMinMm: number;
  rMaxMm: number;
  totalDies: number;
  defectiveDies: number;
  defectRate: number;
}

export interface RadialYieldFit {
  y0: number; // Center yield (0 to 1)
  alpha: number; // Radial decay coefficient (mm^-2)
  rSquared: number;
  bins: RadialBin[];
}

export interface YieldModelFitResult {
  observedYield: number;
  defectDensityPerCm2: number;
  poissonYield: number;
  murphyYield: number;
  seedsYield: number;
  negativeBinomialYield: number; // alpha = 2.0 default cluster parameter
  clusterParameterAlpha: number;
}

export interface WaferDieInput {
  x: number;
  y: number;
  status: 'Good' | 'Defect' | 'Skip' | 'Edge';
}

/**
 * Calculates Clark-Evans nearest neighbor index R:
 * R = mean(r_obs) / mean(r_exp)
 * R < 1: Clustered (hotspots, scratches)
 * R ~ 1: Completely Random Poisson
 * R > 1: Dispersed / Regular / Checkerboard
 */
export function calculateClarkEvansIndex(
  defects: { x: number; y: number }[],
  areaMm2: number,
): { rIndex: number; zScore: number } {
  const n = defects.length;
  if (n < 4 || areaMm2 <= 0) {
    return { rIndex: 1.0, zScore: 0 };
  }

  // Mean observed nearest neighbor distance
  let sumMinDist = 0;
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = Math.hypot(defects[i].x - defects[j].x, defects[i].y - defects[j].y);
      if (d < minDist) minDist = d;
    }
    sumMinDist += minDist;
  }
  const meanObsDist = sumMinDist / n;

  // Expected distance for random Poisson point process: r_exp = 1 / (2 * sqrt(density))
  const density = n / areaMm2;
  const meanExpDist = 1 / (2 * Math.sqrt(density));
  const rIndex = meanExpDist > 0 ? Number((meanObsDist / meanExpDist).toFixed(3)) : 1.0;

  // Standard error of expected distance
  const se = 0.26136 / Math.sqrt(n * density);
  const zScore = se > 0 ? Number(((meanObsDist - meanExpDist) / se).toFixed(2)) : 0;

  return { rIndex, zScore };
}

/**
 * Analyzes radial yield decay across concentric annular rings
 */
export function analyzeRadialYield(
  dies: WaferDieInput[],
  waferRadiusMm = 150,
  binCount = 6,
): RadialYieldFit {
  const validDies = dies.filter((d) => d.status === 'Good' || d.status === 'Defect');
  if (validDies.length === 0) {
    return { y0: 1, alpha: 0, rSquared: 0, bins: [] };
  }

  const binWidth = waferRadiusMm / binCount;
  const bins: RadialBin[] = [];

  for (let b = 0; b < binCount; b++) {
    const rMin = b * binWidth;
    const rMax = (b + 1) * binWidth;
    const inBin = validDies.filter((d) => {
      const r = Math.hypot(d.x, d.y);
      return r >= rMin && r < rMax;
    });

    const defective = inBin.filter((d) => d.status === 'Defect').length;
    bins.push({
      rMinMm: Number(rMin.toFixed(1)),
      rMaxMm: Number(rMax.toFixed(1)),
      totalDies: inBin.length,
      defectiveDies: defective,
      defectRate: inBin.length > 0 ? Number((defective / inBin.length).toFixed(4)) : 0,
    });
  }

  // Fit Y(r) = Y0 * exp(-alpha * r^2)
  // ln(Y) = ln(Y0) - alpha * r^2
  const fitPoints = bins
    .filter((b) => b.totalDies >= 3 && b.defectRate < 0.99)
    .map((b) => {
      const rMid = (b.rMinMm + b.rMaxMm) / 2;
      const yieldVal = Math.max(0.01, 1 - b.defectRate);
      return { r2: rMid * rMid, lnY: Math.log(yieldVal) };
    });

  if (fitPoints.length < 2) {
    const overallGood = validDies.filter((d) => d.status === 'Good').length;
    return {
      y0: Number((overallGood / validDies.length).toFixed(4)),
      alpha: 0,
      rSquared: 0,
      bins,
    };
  }

  const n = fitPoints.length;
  const sumX = fitPoints.reduce((acc, p) => acc + p.r2, 0);
  const sumY = fitPoints.reduce((acc, p) => acc + p.lnY, 0);
  const sumXY = fitPoints.reduce((acc, p) => acc + p.r2 * p.lnY, 0);
  const sumX2 = fitPoints.reduce((acc, p) => acc + p.r2 * p.r2, 0);

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const alpha = Math.max(0, -slope);
  const y0 = Math.min(1.0, Math.max(0.1, Math.exp(intercept)));

  // R² coefficient
  const meanY = sumY / n;
  const ssTot = fitPoints.reduce((acc, p) => acc + Math.pow(p.lnY - meanY, 2), 0);
  const ssRes = fitPoints.reduce((acc, p) => {
    const pred = intercept + slope * p.r2;
    return acc + Math.pow(p.lnY - pred, 2);
  }, 0);
  const rSquared = ssTot > 0 ? Number(Math.max(0, 1 - ssRes / ssTot).toFixed(3)) : 0;

  return {
    y0: Number(y0.toFixed(4)),
    alpha: Number(alpha.toExponential(3)),
    rSquared,
    bins,
  };
}

/**
 * Classifies spatial signatures on a wafer die map
 */
export function classifySpatialSignatures(
  dies: WaferDieInput[],
  waferRadiusMm = 150,
): SpatialSignature[] {
  const defectDies = dies.filter((d) => d.status === 'Defect');
  const validDies = dies.filter((d) => d.status === 'Good' || d.status === 'Defect');

  if (defectDies.length === 0 || validDies.length === 0) {
    return [
      {
        pattern: 'random',
        confidence: 0.99,
        description: 'Zero or minimal defectivity observed across entire wafer field.',
        rootCauses: ['Normal baseline operation.'],
      },
    ];
  }

  const signatures: SpatialSignature[] = [];
  const waferAreaMm2 = Math.PI * waferRadiusMm * waferRadiusMm;

  // 1. Clark-Evans spatial aggregation
  const { rIndex } = calculateClarkEvansIndex(defectDies, waferAreaMm2);

  // 2. Radial yield check (Ring / Edge Exclusion / Center)
  const radial = analyzeRadialYield(dies, waferRadiusMm, 6);
  const outerBin = radial.bins[radial.bins.length - 1];
  const innerBin = radial.bins[0];
  const baselineDefectRate = defectDies.length / validDies.length;

  // Check outer ring pattern (e.g. CMP edge overpolish, bevel flaking)
  if (outerBin && outerBin.defectRate > Math.max(0.25, baselineDefectRate * 2.2)) {
    signatures.push({
      pattern: 'ring',
      confidence: Number(Math.min(0.95, (outerBin.defectRate / baselineDefectRate) * 0.4).toFixed(2)),
      description: `Elevated defectivity (${(outerBin.defectRate * 100).toFixed(1)}%) localized along wafer outer periphery (> ${(radial.bins[radial.bins.length - 1].rMinMm).toFixed(0)} mm).`,
      rootCauses: [
        'CMP retaining ring over-polishing / edge roll-off',
        'Plasma etch edge focus ring (FR) erosion or gas recirculation',
        'Spin-coater edge bead removal (EBR) solvent splashing',
      ],
    });
  }

  // Check center hotspot
  if (innerBin && innerBin.defectRate > Math.max(0.3, baselineDefectRate * 2.5)) {
    signatures.push({
      pattern: 'center_hotspot',
      confidence: 0.85,
      description: `Localized defect cluster detected at wafer center core (< ${(innerBin.rMaxMm).toFixed(0)} mm).`,
      rootCauses: [
        'Showerhead nozzle condensation or particulate dripping',
        'Chuck center pin vacuum suction mark or thermal hot spot',
        'Developer nozzle dispense puddle accumulation',
      ],
    });
  }

  // 3. Scratch line check via principal component axis aspect ratio
  if (defectDies.length >= 6) {
    let meanX = 0, meanY = 0;
    defectDies.forEach((d) => { meanX += d.x; meanY += d.y; });
    meanX /= defectDies.length;
    meanY /= defectDies.length;

    let varX = 0, varY = 0, covXY = 0;
    defectDies.forEach((d) => {
      const dx = d.x - meanX;
      const dy = d.y - meanY;
      varX += dx * dx;
      varY += dy * dy;
      covXY += dx * dy;
    });

    const trace = varX + varY;
    const det = varX * varY - covXY * covXY;
    const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));
    const eig1 = (trace + disc) / 2;
    const eig2 = Math.max(1e-6, (trace - disc) / 2);
    const pcaRatio = Math.sqrt(eig1 / eig2);

    if (pcaRatio >= 3.0 && rIndex < 0.85) {
      signatures.push({
        pattern: 'scratch',
        confidence: Number(Math.min(0.96, 0.5 + pcaRatio * 0.08).toFixed(2)),
        description: `Defects align along a linear trajectory (aspect ratio ${pcaRatio.toFixed(1)}:1).`,
        rootCauses: [
          'Wafer handler robot end-effector blade abrasion',
          'Front Opening Unified Pod (FOUP) cassette slot misalignment / pinching',
          'CMP pad conditioning diamond disk scratch debris',
        ],
      });
    }
  }

  // 4. Clustered hotspot (general non-linear cluster)
  if (rIndex < 0.65 && !signatures.some((s) => s.pattern === 'scratch')) {
    signatures.push({
      pattern: 'hotspot',
      confidence: Number((1.0 - rIndex).toFixed(2)),
      description: `Dense spatial defect aggregation (Clark-Evans R = ${rIndex}).`,
      rootCauses: [
        'Chamber wall flaking / arc discharge burst',
        'Slurry agglomeration or particulate burst during dispense',
      ],
    });
  }

  // If no specific signature triggered, evaluate random Poisson distribution
  if (signatures.length === 0) {
    signatures.push({
      pattern: 'random',
      confidence: 0.88,
      description: `Defects exhibit spatially random Poisson distribution (Clark-Evans R = ${rIndex}).`,
      rootCauses: [
        'Stochastic airborne cleanroom airborne particulate baseline',
        'Intrinsic substrate gate dielectric micro-defects',
      ],
    });
  }

  return signatures;
}

/**
 * Fits wafer inspection data to standard semiconductor yield models:
 * - Poisson: Y = exp(-A * D0)
 * - Murphy: Y = ((1 - exp(-A * D0)) / (A * D0))^2
 * - Seeds: Y = exp(-sqrt(A * D0))
 * - Negative Binomial: Y = (1 + A * D0 / alpha)^(-alpha)
 */
export function fitWaferYieldModels(
  totalDies: number,
  defectiveDies: number,
  dieAreaMm2: number,
  clusterParameterAlpha = 2.0,
): YieldModelFitResult {
  if (totalDies <= 0) {
    return {
      observedYield: 1.0,
      defectDensityPerCm2: 0,
      poissonYield: 1.0,
      murphyYield: 1.0,
      seedsYield: 1.0,
      negativeBinomialYield: 1.0,
      clusterParameterAlpha,
    };
  }

  const goodDies = Math.max(0, totalDies - defectiveDies);
  const observedYield = Number((goodDies / totalDies).toFixed(4));

  // Die Area in cm²
  const dieAreaCm2 = dieAreaMm2 / 100;

  // Defect density D0 estimate from observed yield:
  // In classic Poisson: Y = exp(-A * D0) => D0 = -ln(Y) / A
  const safeYield = Math.max(0.001, Math.min(0.999, observedYield));
  const d0Poisson = -Math.log(safeYield) / dieAreaCm2;
  const defectDensityPerCm2 = Number(d0Poisson.toFixed(3));

  const lambda = dieAreaCm2 * defectDensityPerCm2;

  // 1. Poisson
  const poissonYield = Number(Math.exp(-lambda).toFixed(4));

  // 2. Murphy model
  const murphyYield =
    lambda > 0.001
      ? Number(Math.pow((1 - Math.exp(-lambda)) / lambda, 2).toFixed(4))
      : 1.0;

  // 3. Seeds model
  const seedsYield = Number(Math.exp(-Math.sqrt(lambda)).toFixed(4));

  // 4. Negative Binomial (Stapper model)
  const nbYield = Number(
    Math.pow(1 + lambda / clusterParameterAlpha, -clusterParameterAlpha).toFixed(4),
  );

  return {
    observedYield,
    defectDensityPerCm2,
    poissonYield,
    murphyYield,
    seedsYield,
    negativeBinomialYield: nbYield,
    clusterParameterAlpha,
  };
}
