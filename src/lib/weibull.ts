/**
 * Weibull life-data fits.
 *
 * Failure times are fitted by least squares on the median-rank line: the i-th
 * of n sorted failures gets the rank (i - 0.3) / (n + 0.4), which is the usual
 * approximation to the median rank and is what makes the fit usable with a
 * handful of samples. The slope of ln(t) against ln(-ln(1 - F)) is the shape
 * beta and the intercept gives the scale eta.
 *
 * Two honest limits come with the method. A handful of failures gives a line
 * through few points, so the correlation coefficient is reported next to the
 * fit: a low value means the Weibull assumption is not supported by the data
 * and B10 is not a number to trust. And the failures are treated as complete,
 * with no suspended units, because a censored fit needs a different estimator.
 */

export const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

/** Natural log of the gamma function, Lanczos approximation. */
export function logGamma(z: number): number {
  if (!Number.isFinite(z)) return Number.NaN;
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const shifted = z - 1;
  // g = 7 uses the nine coefficients as cof[0] plus cof[1..8], with the
  // denominators (z + 1) .. (z + 8).
  let sum = LANCZOS_COEFFICIENTS[0];
  for (let i = 0; i < LANCZOS_G + 1; i += 1) {
    sum += LANCZOS_COEFFICIENTS[i + 1] / (shifted + i + 1);
  }
  const t = shifted + LANCZOS_G + 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(sum)
  );
}

export interface WeibullFit {
  /** Number of failures fitted. */
  count: number;
  /** Shape parameter beta. */
  beta: number;
  /** Scale parameter eta, in hours. */
  etaHours: number;
  /** Correlation coefficient of the fit; near 1 supports the Weibull assumption. */
  rSquared: number;
  /** Mean time between failures, eta · Γ(1 + 1/beta). */
  mtbfHours: number;
  /** Time by which 1 % of the population has failed. */
  b1Hours: number;
  /** Time by which 10 % of the population has failed, the usual B10 life. */
  b10Hours: number;
  /** Median life, the time by which half the population has failed. */
  b50Hours: number;
}

const MINIMUM_POINTS = 3;

/**
 * Fit a Weibull distribution to complete failure times.
 *
 * Throws when fewer than three distinct positive failure times are given,
 * because a line through two points is not a fit.
 */
export function fitWeibull(times: number[]): WeibullFit {
  if (!Array.isArray(times) || times.length === 0) {
    throw new Error('Enter at least three failure times, one per line.');
  }
  if (times.some((time) => !Number.isFinite(time) || time <= 0)) {
    throw new Error('Every failure time must be greater than 0 hours.');
  }
  const sorted = [...times].sort((a, b) => a - b);
  const distinct = new Set(sorted.map((time) => time.toString()));
  if (sorted.length < MINIMUM_POINTS || distinct.size < MINIMUM_POINTS) {
    throw new Error(
      `A Weibull fit needs at least ${MINIMUM_POINTS} distinct failure times; ${distinct.size} were given.`,
    );
  }

  const n = sorted.length;
  const xs = sorted.map((time) => Math.log(time));
  const ys = sorted.map((_, index) => {
    const medianRank = (index + 1 - 0.3) / (n + 0.4);
    return Math.log(-Math.log(1 - medianRank));
  });

  const meanX = xs.reduce((total, value) => total + value, 0) / n;
  const meanY = ys.reduce((total, value) => total + value, 0) / n;
  const sxx = xs.reduce((total, value) => total + (value - meanX) ** 2, 0);
  const sxy = xs.reduce((total, value, index) => total + (value - meanX) * (ys[index] - meanY), 0);
  const syy = ys.reduce((total, value) => total + (value - meanY) ** 2, 0);

  if (sxx === 0 || sxy === 0) {
    throw new Error('The failure times are too alike to fit a slope.');
  }

  const beta = sxy / sxx;
  const intercept = meanY - beta * meanX;
  const etaHours = Math.exp(-intercept / beta);
  const rSquared = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);

  return {
    count: n,
    beta,
    etaHours,
    rSquared,
    mtbfHours: etaHours * Math.exp(logGamma(1 + 1 / beta)),
    b1Hours: weibullBLife(0.01, beta, etaHours),
    b10Hours: weibullBLife(0.1, beta, etaHours),
    b50Hours: weibullBLife(0.5, beta, etaHours),
  };
}

/** Fitted unreliability F(t) at a time, as a fraction in 0..1. */
export function weibullUnreliability(hours: number, beta: number, etaHours: number): number {
  return -Math.expm1(-Math.pow(hours / etaHours, beta));
}

/** Fitted reliability R(t) at a time, as a fraction in 0..1. */
export function weibullReliability(hours: number, beta: number, etaHours: number): number {
  return Math.exp(-Math.pow(hours / etaHours, beta));
}

/** Time by which a given fraction of the population has failed, i.e. B(p) life. */
export function weibullBLife(fraction: number, beta: number, etaHours: number): number {
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction >= 1) {
    throw new Error('The failed fraction must be greater than 0 and less than 1.');
  }
  return etaHours * Math.pow(-Math.log(1 - fraction), 1 / beta);
}
