/**
 * Process capability: Cp, Cpk and the out-of-spec fraction.
 *
 * Everything here is derived from the four numbers the user supplies: a lower
 * spec limit, an upper spec limit, the process mean and the process standard
 * deviation. LSL/USL/mean/sigma must all be in the same unit of measure.
 *
 * Definitions used (the usual capability indices):
 *
 *   Cp  = (USL - LSL) / (6 sigma)
 *   CPU = (USL - mean) / (3 sigma)
 *   CPL = (mean - LSL) / (3 sigma)
 *   Cpk = min(CPU, CPL)
 *
 * Cp needs both limits; Cpk can be computed from a single limit (one-sided
 * specification), in which case it equals that side's index.
 *
 * NOTE: Cp/Cpk computed from a *short-term* (within-subgroup) sigma are the Cp/Cpk
 * proper, while the same formulas applied to a *long-term* (overall) sigma give
 * Pp/Ppk. This calculator does not guess which sigma you have: it uses the sigma
 * you enter and names the results Cp/Cpk. Feed it the sigma you mean.
 */

export interface CapabilityInput {
  lowerLimit: number | null;
  upperLimit: number | null;
  mean: number;
  sigma: number;
}

export interface CapabilitySuccess {
  ok: true;
  /** null when only one spec limit is supplied. */
  cp: number | null;
  cpu: number | null;
  cpl: number | null;
  cpk: number;
  /** (USL - mean) / sigma, null when there is no USL. */
  zUpper: number | null;
  /** (mean - LSL) / sigma, null when there is no LSL. */
  zLower: number | null;
  belowPercent: number;
  abovePercent: number;
  outOfSpecPpm: number;
  /** 3 x Cpk, the "sigma level" convention. */
  sigmaLevel: number;
}

export type CapabilityResult = { ok: false; errors: string[] } | CapabilitySuccess;

/**
 * Complementary error function, Numerical Recipes' Chebyshev approximation.
 * Relative error is at the 1e-15 level over the range used here.
 */
const ERFC_COF = [
  -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
  -9.46595344482036e-4, 3.66839497852761e-4, 4.2523324806907e-5, -2.0278578112534e-5,
  -1.624290004647e-6, 1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
  5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12,
  8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15,
];

export function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x);
  let d = 0;
  let dd = 0;
  const t = 2 / (2 + x);
  const ty = 4 * t - 2;
  for (let j = ERFC_COF.length - 1; j > 0; j -= 1) {
    const tmp = d;
    d = ty * d - dd + ERFC_COF[j];
    dd = tmp;
  }
  return t * Math.exp(-x * x + 0.5 * (ERFC_COF[0] + ty * d) - dd);
}

/** Standard normal cumulative distribution function, Phi(z). */
export function normalCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

function hasLimit(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function calculateCapability(input: CapabilityInput): CapabilityResult {
  const errors: string[] = [];
  const { lowerLimit, upperLimit, mean, sigma } = input;

  if (!Number.isFinite(mean)) errors.push('Process mean must be a number.');
  if (!Number.isFinite(sigma)) errors.push('Process standard deviation must be a number.');
  else if (sigma <= 0) errors.push('Process standard deviation must be greater than 0.');

  const lowerGiven = lowerLimit !== null;
  const upperGiven = upperLimit !== null;
  if (lowerGiven && !Number.isFinite(lowerLimit as number)) errors.push('Lower spec limit must be a number.');
  if (upperGiven && !Number.isFinite(upperLimit as number)) errors.push('Upper spec limit must be a number.');

  if (!lowerGiven && !upperGiven) {
    errors.push('Enter an upper or a lower spec limit (or both).');
  } else if (hasLimit(lowerLimit) && hasLimit(upperLimit) && lowerLimit >= upperLimit) {
    errors.push('Lower spec limit must be smaller than the upper spec limit.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const lo = hasLimit(lowerLimit) ? lowerLimit : null;
  const hi = hasLimit(upperLimit) ? upperLimit : null;

  const cpu = hi !== null ? (hi - mean) / (3 * sigma) : null;
  const cpl = lo !== null ? (mean - lo) / (3 * sigma) : null;
  const cp = hi !== null && lo !== null ? (hi - lo) / (6 * sigma) : null;
  const cpk = Math.min(cpu ?? Number.POSITIVE_INFINITY, cpl ?? Number.POSITIVE_INFINITY);

  const zUpper = hi !== null ? (hi - mean) / sigma : null;
  const zLower = lo !== null ? (mean - lo) / sigma : null;

  const abovePercent = zUpper !== null ? (1 - normalCdf(zUpper)) * 100 : 0;
  const belowPercent = zLower !== null ? normalCdf(-zLower) * 100 : 0;

  return {
    ok: true,
    cp,
    cpu,
    cpl,
    cpk,
    zUpper,
    zLower,
    belowPercent,
    abovePercent,
    outOfSpecPpm: ((abovePercent + belowPercent) / 100) * 1e6,
    sigmaLevel: 3 * cpk,
  };
}
