
/**
 * Time units and the RC time constant.
 *
 * Time units are pure scale factors. The time constant, rise and settling
 * figures all come from the first-order step response
 *   v(t) = 1 - exp(-t / tau):
 *   10-90% rise     t = tau ln(9)
 *   1% settling     t = tau ln(100)
 *   0.1% settling   t = tau ln(1000)
 * The same tau sets the -3 dB corner, f = 1 / (2 pi tau), which is why a
 * 50 ohm / 1 pF node is a few gigahertz wide.
 */
export type TimeUnit = 's' | 'ms' | 'us' | 'ns' | 'ps' | 'min' | 'h' | 'day';

export const TIME_UNITS: TimeUnit[] = ['s', 'ms', 'us', 'ns', 'ps', 'min', 'h', 'day'];

export const TIME_LABELS: Record<TimeUnit, string> = {
  s: 's',
  ms: 'ms',
  us: 'µs',
  ns: 'ns',
  ps: 'ps',
  min: 'min',
  h: 'h',
  day: 'day',
};

/** Seconds per one unit. Every entry is an exact definition. */
export const SECONDS_PER_UNIT: Record<TimeUnit, number> = {
  s: 1,
  ms: 1e-3,
  us: 1e-6,
  ns: 1e-9,
  ps: 1e-12,
  min: 60,
  h: 3600,
  day: 86400,
};

/** One time, in every supported unit. */
export function convertTime(value: number, from: TimeUnit): Record<TimeUnit, number> {
  const seconds = value * SECONDS_PER_UNIT[from];
  const converted = {} as Record<TimeUnit, number>;
  for (const unit of TIME_UNITS) {
    converted[unit] = seconds / SECONDS_PER_UNIT[unit];
  }
  return converted;
}

/** RC time constant in seconds. */
export function timeConstantSeconds(ohms: number, farads: number): number {
  return ohms * farads;
}

/** 10-90% rise time of a first-order step: tau ln(9). */
export function riseTime10to90Seconds(tau: number): number {
  return tau * Math.log(9);
}

/** Time to settle within 1% of the final value: tau ln(100). */
export function settleToOnePercentSeconds(tau: number): number {
  return tau * Math.log(100);
}

/** Time to settle within 0.1% of the final value: tau ln(1000). */
export function settleToPointOnePercentSeconds(tau: number): number {
  return tau * Math.log(1000);
}

/** -3 dB corner frequency of a first-order response: 1 / (2 pi tau). */
export function cornerFrequencyHz(tau: number): number {
  return 1 / (2 * Math.PI * tau);
}

/** Frequency for a period in seconds. */
export function frequencyHzFromPeriod(periodSeconds: number): number {
  return 1 / periodSeconds;
}
