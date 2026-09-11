/**
 * Acceptance sampling: what a lot inspection plan actually accepts.
 *
 * A plan of "sample n, accept on c or fewer defectives" is judged by its
 * operating characteristic: the probability of accepting a lot whose true
 * defect rate is p. That curve is what says whether a plan discriminates
 * between a good lot and a bad one.
 *
 * The binomial is used while the sample is a small part of the lot, and the
 * hypergeometric once the sample is more than a tenth of the lot. The two
 * share a mean but not a spread: drawing without replacement from a finite lot
 * is less variable, so the tail is pulled in. That makes the hypergeometric
 * stricter than the binomial when the acceptance number sits below the mean
 * and more forgiving when it sits above, which is why the choice of
 * distribution is reported rather than left implicit.
 */

import { logGamma } from './weibull';

/** Sampling fraction above which the finite population is accounted for. */
export const FINITE_POPULATION_THRESHOLD = 0.1;

export function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return Number.NEGATIVE_INFINITY;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a whole number of 0 or more.`);
  }
}

/** P(X ≤ acceptNumber) for X ~ Binomial(sampleSize, defectFraction). */
export function binomialAcceptProbability(
  sampleSize: number,
  acceptNumber: number,
  defectFraction: number,
): number {
  assertInteger(sampleSize, 'The sample size');
  assertInteger(acceptNumber, 'The acceptance number');
  if (sampleSize < 1) throw new Error('The sample size must be at least 1.');
  if (!Number.isFinite(defectFraction) || defectFraction < 0 || defectFraction > 1) {
    throw new Error('The defect fraction must be between 0 and 1.');
  }

  let total = 0;
  for (let k = 0; k <= acceptNumber && k <= sampleSize; k += 1) {
    const logTerm =
      logChoose(sampleSize, k) + k * Math.log(defectFraction || Number.MIN_VALUE) +
      (sampleSize - k) * Math.log(1 - defectFraction || Number.MIN_VALUE);
    total += Math.exp(logTerm);
  }
  return Math.min(total, 1);
}

/** P(X ≤ acceptNumber) for X ~ Hypergeometric(lot, defectives, sample). */
export function hypergeometricAcceptProbability(
  lotSize: number,
  sampleSize: number,
  acceptNumber: number,
  defectivesInLot: number,
): number {
  assertInteger(lotSize, 'The lot size');
  assertInteger(sampleSize, 'The sample size');
  assertInteger(acceptNumber, 'The acceptance number');
  assertInteger(defectivesInLot, 'The number of defectives');
  if (lotSize < 1) throw new Error('The lot size must be at least 1.');
  if (sampleSize > lotSize) throw new Error('The sample cannot be larger than the lot.');
  if (defectivesInLot > lotSize) {
    throw new Error('There cannot be more defectives than units in the lot.');
  }

  const denominator = logChoose(lotSize, sampleSize);
  let total = 0;
  const lowest = Math.max(0, sampleSize - (lotSize - defectivesInLot));
  for (let k = lowest; k <= acceptNumber && k <= sampleSize; k += 1) {
    if (k > defectivesInLot) break;
    const logTerm =
      logChoose(defectivesInLot, k) + logChoose(lotSize - defectivesInLot, sampleSize - k) - denominator;
    total += Math.exp(logTerm);
  }
  return Math.min(total, 1);
}

export interface AcceptancePlan {
  /** Lot size, or null when the lot is treated as infinite. */
  lotSize: number | null;
  sampleSize: number;
  acceptNumber: number;
}

export interface AcceptanceResult {
  probability: number;
  method: 'binomial' | 'hypergeometric';
  expectedDefectives: number;
  defectivesInLot: number | null;
}

/** Probability of accepting a lot at a given defect fraction. */
export function acceptProbability(plan: AcceptancePlan, defectFraction: number): AcceptanceResult {
  const { lotSize, sampleSize, acceptNumber } = plan;
  if (!Number.isFinite(defectFraction) || defectFraction < 0 || defectFraction > 1) {
    throw new Error('The defect fraction must be between 0 and 1.');
  }
  const expectedDefectives = sampleSize * defectFraction;

  if (lotSize === null) {
    return {
      probability: binomialAcceptProbability(sampleSize, acceptNumber, defectFraction),
      method: 'binomial',
      expectedDefectives,
      defectivesInLot: null,
    };
  }

  const defectivesInLot = Math.round(lotSize * defectFraction);
  const finite = sampleSize / lotSize > FINITE_POPULATION_THRESHOLD;
  return {
    probability: finite
      ? hypergeometricAcceptProbability(lotSize, sampleSize, acceptNumber, defectivesInLot)
      : binomialAcceptProbability(sampleSize, acceptNumber, defectFraction),
    method: finite ? 'hypergeometric' : 'binomial',
    expectedDefectives,
    defectivesInLot,
  };
}

/**
 * Smallest zero-acceptance sample that drives the acceptance probability at a
 * defect fraction down to the consumer risk, i.e. the sample needed to reject
 * a lot that is as bad as the given fraction.
 */
export function solveZeroAcceptSample(input: {
  defectFraction: number;
  consumerRisk: number;
  lotSize?: number | null;
}): { sampleSize: number; achievedProbability: number } {
  const { defectFraction, consumerRisk, lotSize = null } = input;
  if (!Number.isFinite(defectFraction) || defectFraction <= 0 || defectFraction >= 1) {
    throw new Error('The defect fraction must be greater than 0 and less than 1.');
  }
  if (!Number.isFinite(consumerRisk) || consumerRisk <= 0 || consumerRisk >= 1) {
    throw new Error('The consumer risk must be greater than 0 and less than 1.');
  }

  if (lotSize === null) {
    const exact = Math.log(consumerRisk) / Math.log(1 - defectFraction);
    const sampleSize = Math.max(1, Math.ceil(exact));
    return {
      sampleSize,
      achievedProbability: binomialAcceptProbability(sampleSize, 0, defectFraction),
    };
  }

  if (!Number.isInteger(lotSize) || lotSize < 2) {
    throw new Error('The lot size must be a whole number of 2 or more.');
  }
  const defectivesInLot = Math.round(lotSize * defectFraction);
  for (let sampleSize = 1; sampleSize <= lotSize; sampleSize += 1) {
    const probability = hypergeometricAcceptProbability(lotSize, sampleSize, 0, defectivesInLot);
    if (probability <= consumerRisk) {
      return { sampleSize, achievedProbability: probability };
    }
  }
  throw new Error('No sample size within this lot reaches that risk; the lot is too small.');
}

/** Points of the operating characteristic curve. */
export function ocCurve(
  plan: AcceptancePlan,
  fractions: number[],
): { defectFraction: number; probability: number }[] {
  return fractions.map((defectFraction) => ({
    defectFraction,
    probability: acceptProbability(plan, defectFraction).probability,
  }));
}
