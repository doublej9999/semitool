
/**
 * Statistics for a list of measurements, in the form the uniformity tools need.
 *
 * Three different numbers are called "uniformity", and they are not equal:
 *
 *   range / mean            (max - min) / mean
 *   half range / mean       (max - min) / (2 * mean)
 *   coefficient of variation  sigma / mean
 *
 * All three are reported here with their own names, so the reader can match
 * whichever convention their spec or supplier uses instead of guessing which one
 * a single "uniformity" number meant. The standard deviation is the sample
 * standard deviation (n - 1 divisor), which is what a finite set of sites
 * deserves; with n = 1 it is not defined and is reported as null.
 */

export interface SeriesSummary {
  n: number;
  mean: number;
  min: number;
  max: number;
  range: number;
  halfRange: number;
  /** Sample standard deviation (n - 1). Null when fewer than two values. */
  sigma: number | null;
  threeSigma: number | null;
  /** (max - min) / mean * 100 */
  rangePercent: number | null;
  /** (max - min) / (2 * mean) * 100 */
  halfRangePercent: number | null;
  /** sigma / mean * 100 */
  cvPercent: number | null;
}

export interface ParsedSeries {
  values: number[];
  errors: string[];
}

/**
 * Reads a pasted list of numbers separated by commas, spaces, tabs, semicolons
 * or newlines. Anything that is not a number is named in the errors rather than
 * silently skipped, so a stray label cannot quietly change the result.
 */
export function parseSeries(text: string): ParsedSeries {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token !== '');

  const values: number[] = [];
  const bad: string[] = [];

  for (const token of tokens) {
    const value = Number(token);
    if (Number.isFinite(value)) {
      values.push(value);
    } else {
      bad.push(token);
    }
  }

  const errors: string[] = [];
  if (bad.length > 0) {
    errors.push(`These entries are not numbers: ${bad.join(', ')}.`);
  }
  if (values.length === 0) {
    errors.push('Enter at least one measurement.');
  }

  return { values, errors };
}

export function summariseSeries(values: number[]): SeriesSummary {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((total, value) => total + value, 0) / n;
  const range = max - min;

  let sigma: number | null = null;
  if (n > 1) {
    const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / (n - 1);
    sigma = Math.sqrt(variance);
  }

  const scale = (value: number) => (mean === 0 ? null : (value / mean) * 100);

  return {
    n,
    mean,
    min,
    max,
    range,
    halfRange: range / 2,
    sigma,
    threeSigma: sigma === null ? null : sigma * 3,
    rangePercent: scale(range),
    halfRangePercent: scale(range / 2),
    cvPercent: sigma === null ? null : scale(sigma),
  };
}
