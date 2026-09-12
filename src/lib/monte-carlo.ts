/**
 * Monte Carlo Tolerance & Sensitivity Simulation for Semiconductor Processes.
 *
 * Simulates process variations (film thickness, etch bias, implant energy/dose,
 * thermal budget, optical critical dimensions) and performs:
 * - Statistical distribution sampling (Normal, Uniform, Triangular, LogNormal)
 * - Process capability indices (Cp, Cpk) against Upper/Lower Spec Limits (USL, LSL)
 * - Yield estimation (%) and Defect PPM (parts per million)
 * - Sensitivity analysis using Pearson correlation coefficients and Sobol-like variance contribution
 * - Histogram distribution binning for SVG charting
 */

export type DistributionType = 'normal' | 'uniform' | 'triangular' | 'lognormal';

export interface ParameterSpec {
  name: string;
  unit?: string;
  type: DistributionType;
  /** Mean or center value (or min for uniform) */
  nominal: number;
  /** Standard deviation for normal/lognormal, half-width for uniform, left/right spread for triangular */
  spread: number;
  /** Optional lower physical bound (e.g. non-negative) */
  minBound?: number;
  /** Optional upper physical bound */
  maxBound?: number;
}

export interface MonteCarloConfig {
  parameters: ParameterSpec[];
  evaluate: (values: Record<string, number>) => number;
  sampleSize?: number;
  lsl?: number;
  usl?: number;
  target?: number;
  randomSeed?: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  count: number;
  frequency: number;
}

export interface SensitivityItem {
  name: string;
  correlation: number;
  varianceContributionPercent: number;
}

export interface MonteCarloResult {
  sampleSize: number;
  mean: number;
  stdDev: number;
  median: number;
  min: number;
  max: number;
  p1: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  p99: number;
  skewness: number;
  kurtosis: number;
  cp: number | null;
  cpk: number | null;
  yieldPercent: number | null;
  defectPpm: number | null;
  sensitivities: SensitivityItem[];
  histogram: HistogramBin[];
}

/**
 * Seedable linear congruential generator (LCG) for reproducible Monte Carlo runs
 */
export function createRng(seed = 123456789): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Box-Muller transform for generating standard normal random variables ~ N(0, 1)
 */
export function sampleStandardNormal(rng: () => number = Math.random): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng(); // Avoid log(0)
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Samples a random value from a specified process parameter distribution
 */
export function sampleParameter(spec: ParameterSpec, rng: () => number = Math.random): number {
  let val: number;

  switch (spec.type) {
    case 'normal': {
      val = spec.nominal + spec.spread * sampleStandardNormal(rng);
      break;
    }
    case 'uniform': {
      // spread is half-width around nominal: [nominal - spread, nominal + spread]
      const min = spec.nominal - spec.spread;
      const max = spec.nominal + spec.spread;
      val = min + rng() * (max - min);
      break;
    }
    case 'triangular': {
      // mode = nominal, lower = nominal - spread, upper = nominal + spread
      const a = spec.nominal - spec.spread;
      const b = spec.nominal + spec.spread;
      const c = spec.nominal;
      const u = rng();
      const fc = (c - a) / (b - a || 1);
      if (u < fc) {
        val = a + Math.sqrt(u * (b - a) * (c - a));
      } else {
        val = b - Math.sqrt((1 - u) * (b - a) * (b - c));
      }
      break;
    }
    case 'lognormal': {
      // nominal is median, spread is shape parameter sigma of underlying normal
      const normalVal = sampleStandardNormal(rng);
      const mu = Math.log(Math.max(1e-12, spec.nominal));
      val = Math.exp(mu + spec.spread * normalVal);
      break;
    }
    default:
      val = spec.nominal;
  }

  if (spec.minBound !== undefined && val < spec.minBound) val = spec.minBound;
  if (spec.maxBound !== undefined && val > spec.maxBound) val = spec.maxBound;

  return val;
}

/**
 * Calculates Pearson correlation coefficient between two numeric arrays
 */
export function calculatePearsonCorrelation(x: number[], y: number[], meanX: number, meanY: number): number {
  const n = x.length;
  if (n < 2) return 0;

  let sumNumerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumNumerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;
  return Math.max(-1, Math.min(1, sumNumerator / denominator));
}

/**
 * Computes histogram bins from sample values
 */
export function computeHistogram(values: number[], numBins = 25): HistogramBin[] {
  if (values.length === 0) return [];

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  if (min === max) {
    return [
      {
        binStart: min - 0.5,
        binEnd: max + 0.5,
        binCenter: min,
        count: values.length,
        frequency: 1,
      },
    ];
  }

  const range = max - min;
  const binWidth = range / numBins;
  const counts = new Array<number>(numBins).fill(0);

  for (let i = 0; i < values.length; i += 1) {
    let index = Math.floor((values[i] - min) / binWidth);
    if (index >= numBins) index = numBins - 1;
    if (index < 0) index = 0;
    counts[index] += 1;
  }

  return counts.map((count, i) => ({
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
    binCenter: min + (i + 0.5) * binWidth,
    count,
    frequency: count / values.length,
  }));
}

/**
 * Runs a complete Monte Carlo tolerance simulation
 */
export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const { parameters, evaluate, sampleSize = 5000, lsl, usl, randomSeed } = config;
  const rng = randomSeed !== undefined ? createRng(randomSeed) : Math.random;

  const n = Math.max(10, Math.min(50000, sampleSize));
  const parameterSamples: Record<string, number[]> = {};
  for (const p of parameters) {
    parameterSamples[p.name] = new Array<number>(n);
  }

  const outputSamples = new Array<number>(n);

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < n; i += 1) {
    const inputValues: Record<string, number> = {};
    for (const p of parameters) {
      const sampledVal = sampleParameter(p, rng);
      inputValues[p.name] = sampledVal;
      parameterSamples[p.name][i] = sampledVal;
    }

    const y = evaluate(inputValues);
    outputSamples[i] = y;
    sum += y;
    sumSq += y * y;
  }

  const mean = sum / n;
  const variance = Math.max(0, (sumSq - (sum * sum) / n) / (n - 1));
  const stdDev = Math.sqrt(variance);

  // Sorted output for percentiles & median
  const sorted = [...outputSamples].sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low];
    return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
  };

  const median = getPercentile(50);
  const min = sorted[0];
  const max = sorted[n - 1];
  const p1 = getPercentile(1);
  const p5 = getPercentile(5);
  const p25 = getPercentile(25);
  const p75 = getPercentile(75);
  const p95 = getPercentile(95);
  const p99 = getPercentile(99);

  // Skewness and Kurtosis
  let m3 = 0;
  let m4 = 0;
  for (let i = 0; i < n; i += 1) {
    const d = outputSamples[i] - mean;
    const d2 = d * d;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  const s3 = Math.pow(stdDev, 3) || 1e-12;
  const s4 = Math.pow(stdDev, 4) || 1e-12;
  const skewness = (m3 / n) / s3;
  const kurtosis = (m4 / n) / s4 - 3; // excess kurtosis

  // Capability indices Cp and Cpk
  let cp: number | null = null;
  let cpk: number | null = null;
  let yieldPercent: number | null = null;
  let defectPpm: number | null = null;

  if (stdDev > 0 && (lsl !== undefined || usl !== undefined)) {
    if (lsl !== undefined && usl !== undefined) {
      cp = (usl - lsl) / (6 * stdDev);
      const cpl = (mean - lsl) / (3 * stdDev);
      const cpu = (usl - mean) / (3 * stdDev);
      cpk = Math.min(cpl, cpu);
    } else if (usl !== undefined) {
      cpk = (usl - mean) / (3 * stdDev);
    } else if (lsl !== undefined) {
      cpk = (mean - lsl) / (3 * stdDev);
    }

    let passCount = 0;
    for (let i = 0; i < n; i += 1) {
      const y = outputSamples[i];
      let pass = true;
      if (lsl !== undefined && y < lsl) pass = false;
      if (usl !== undefined && y > usl) pass = false;
      if (pass) passCount += 1;
    }
    yieldPercent = (passCount / n) * 100;
    defectPpm = ((n - passCount) / n) * 1e6;
  }

  // Sensitivity Analysis
  const sensitivities: SensitivityItem[] = [];
  let sumSqCorr = 0;

  for (const p of parameters) {
    const pSamples = parameterSamples[p.name];
    let pSum = 0;
    for (let i = 0; i < n; i += 1) pSum += pSamples[i];
    const pMean = pSum / n;

    const r = calculatePearsonCorrelation(pSamples, outputSamples, pMean, mean);
    const r2 = r * r;
    sumSqCorr += r2;

    sensitivities.push({
      name: p.name,
      correlation: r,
      varianceContributionPercent: 0, // filled in next step
    });
  }

  // Normalize variance contributions
  for (const item of sensitivities) {
    item.varianceContributionPercent = sumSqCorr > 0 ? ((item.correlation * item.correlation) / sumSqCorr) * 100 : 0;
  }

  // Sort sensitivities by impact descending
  sensitivities.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const histogram = computeHistogram(outputSamples, 30);

  return {
    sampleSize: n,
    mean,
    stdDev,
    median,
    min,
    max,
    p1,
    p5,
    p25,
    p75,
    p95,
    p99,
    skewness,
    kurtosis,
    cp,
    cpk,
    yieldPercent,
    defectPpm,
    sensitivities,
    histogram,
  };
}
