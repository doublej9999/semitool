
import { normalCdf } from './capability';
import { inverseNormalCdf } from './confidence';

/** One-sided probability of exceeding `sigma`, P(Z > sigma). */
const normalUpperTail = (sigma: number) => normalCdf(-sigma);

/**
 * Yield and defect-rate conversions.
 *
 * A yield of 99.865% and 1350 DPPM are the same statement, and both are
 * often quoted as "3 sigma". The arithmetic is exact; the sigma column is
 * a normal-tail conversion and reuses the erfc / normal CDF from
 * lib/capability.ts and the inverse normal from lib/confidence.ts rather
 * than carrying a fourth copy of them.
 */

export interface YieldDppmResult {
  /** Passing fraction, 0 to 1. */
  yieldFraction: number;
  /** Passing percentage, 0 to 100. */
  yieldPercent: number;
  /** Defective parts per million. */
  dppm: number;
  /** Defective parts per billion. */
  dpb: number;
  /** One-sided sigma-equivalent of the defect fraction, if computable. */
  sigma: number | null;
  /** Cpk-equivalent of that sigma, sigma / 3, if computable. */
  cpkEquivalent: number | null;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/** Conversion from a yield expressed as a fraction in [0, 1]. */
export function fromYieldFraction(fraction: number): YieldDppmResult {
  const y = clamp01(fraction);
  const dppm = (1 - y) * 1e6;
  return {
    yieldFraction: y,
    yieldPercent: y * 100,
    dppm,
    dpb: (1 - y) * 1e9,
    sigma: y > 0 && y < 1 ? inverseNormalCdf(y) : null,
    cpkEquivalent: y > 0 && y < 1 ? inverseNormalCdf(y) / 3 : null,
  };
}

/** Conversion from a yield expressed in percent. */
export function fromYieldPercent(percent: number): YieldDppmResult {
  return fromYieldFraction(percent / 100);
}

/** Conversion from a defect rate in parts per million. */
export function fromDppm(dppm: number): YieldDppmResult {
  if (dppm < 0 || dppm > 1e6) {
    throw new Error('DPPM must be between 0 and 1,000,000.');
  }
  return fromYieldFraction(1 - dppm / 1e6);
}

/** Conversion from a one-sided sigma level. */
export function fromSigma(sigma: number): YieldDppmResult {
  if (!Number.isFinite(sigma)) {
    throw new Error('The sigma level must be a finite number.');
  }
  return fromYieldFraction(1 - normalUpperTail(sigma));
}

/** Fraction of a normal population beyond `sigma`, one-sided. */
export function tailFraction(sigma: number): number {
  return normalUpperTail(sigma);
}

export { normalUpperTail };
