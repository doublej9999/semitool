
import { inverseNormalCdf } from './confidence';

/**
 * Reliability metrics from a life test.
 *
 * The model is the exponential (constant failure rate) one, which is the
 * standard assumption behind FIT and MTBF. Under it the chance a part
 * survives t hours is exp(-lambda t), so the fractions below are exact for
 * that model and only for it.
 */

export interface LifeTestInput {
  /** Number of failures observed. */
  failures: number;
  /** Number of devices on test. */
  devices: number;
  /** Test duration in hours. */
  hours: number;
}

export interface ReliabilityResult {
  /** Failures per device-hour. */
  failureRate: number;
  /** Failures per billion (1e9) device-hours. */
  fit: number;
  /** Mean time between failures in hours. */
  mtbfHours: number;
  /** MTBF expressed in years at 8760 hours per year. */
  mtbfYears: number;
  /** Total device-hours accumulated. */
  deviceHours: number;
}

export const HOURS_PER_YEAR = 8760;

/** Reject inputs that cannot describe a life test. */
export function validateLifeTest(input: LifeTestInput): string | null {
  const { failures, devices, hours } = input;
  if (![failures, devices, hours].every((n) => Number.isFinite(n))) {
    return 'Every input must be a number.';
  }
  if (devices <= 0) return 'The number of devices must be greater than 0.';
  if (hours <= 0) return 'The test duration must be greater than 0 hours.';
  if (failures < 0) return 'The number of failures cannot be negative.';
  if (failures > devices) return 'More failures than devices were reported; check the inputs.';
  return null;
}

export function reliability(input: LifeTestInput): ReliabilityResult {
  const deviceHours = input.devices * input.hours;
  const failureRate = input.failures / deviceHours;
  const fit = failureRate * 1e9;
  const mtbfHours = failureRate > 0 ? 1 / failureRate : Infinity;
  return {
    failureRate,
    fit,
    mtbfHours,
    mtbfYears: mtbfHours / HOURS_PER_YEAR,
    deviceHours,
  };
}

/**
 * Defective parts per million implied by a FIT rate over a given time.
 *
 * 1 - exp(-x) written as -expm1(-x) so that a small rate keeps its
 * significant digits instead of cancelling to zero.
 */
export function dppmFromFit(fit: number, hours: number): number {
  return -Math.expm1(-(fit / 1e9) * hours) * 1e6;
}

/** The FIT rate that produces a given DPPM over a given time. */
export function fitFromDppm(dppm: number, hours: number): number {
  if (dppm < 0 || dppm >= 1e6) {
    throw new Error('DPPM must be at least 0 and below 1,000,000.');
  }
  return (-Math.log1p(-dppm / 1e6) / hours) * 1e9;
}

/** Time for a given fraction of a population to fail under a constant rate. */
export function timeToFractionFailures(failureRate: number, fraction: number): number {
  if (!(fraction > 0 && fraction < 1)) {
    throw new Error('The failing fraction must be greater than 0 and less than 1.');
  }
  if (!(failureRate > 0)) {
    throw new Error('The failure rate must be greater than 0.');
  }
  return -Math.log1p(-fraction) / failureRate;
}

/** Fraction of the population failed after t hours, as a number in [0, 1). */
export function fractionFailed(fit: number, hours: number): number {
  return -Math.expm1(-(fit / 1e9) * hours);
}

/**
 * z (sigma) value equivalent to a given one-sided yield. Used only for
 * reporting a failure rate as an equivalent sigma, so it reuses the
 * inverse normal already in lib/confidence.ts rather than re-deriving it.
 */
export function sigmaFromYield(yieldFraction: number): number {
  if (!(yieldFraction > 0 && yieldFraction < 1)) {
    throw new Error('The yield must be greater than 0 and less than 1.');
  }
  return inverseNormalCdf(yieldFraction);
}
