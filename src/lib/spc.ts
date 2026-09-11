/**
 * X-bar and R control charts.
 *
 * A control chart separates the routine spread of a process from a shift that
 * has a cause. The limits come from the short-term variation inside the
 * subgroups, not from the specification: a process can be perfectly in control
 * and still out of specification, and a capability calculation is the tool for
 * that question. This module answers the other one - is the process still
 * behaving the same way as when the limits were set.
 *
 * The A2, D3 and D4 constants are the standard Shewhart table values for
 * subgroup sizes 2 to 10, taken from the tabulated distribution of the range.
 * They are tabulated rather than derived here because they come from the
 * expected value and standard deviation of the relative range.
 */

export interface XbarRConstants {
  /** Converts the mean range to the 3 sigma X-bar limits. */
  a2: number;
  /** Lower limit factor for R. */
  d3: number;
  /** Upper limit factor for R. */
  d4: number;
  /** Mean-to-sigma divisor for the range, used for the sigma estimate. */
  d2: number;
}

export const XBAR_R_CONSTANTS: Record<number, XbarRConstants> = {
  2: { a2: 1.88, d3: 0, d4: 3.267, d2: 1.128 },
  3: { a2: 1.023, d3: 0, d4: 2.574, d2: 1.693 },
  4: { a2: 0.729, d3: 0, d4: 2.282, d2: 2.059 },
  5: { a2: 0.577, d3: 0, d4: 2.114, d2: 2.326 },
  6: { a2: 0.483, d3: 0, d4: 2.004, d2: 2.534 },
  7: { a2: 0.419, d3: 0.076, d4: 1.924, d2: 2.704 },
  8: { a2: 0.373, d3: 0.136, d4: 1.864, d2: 2.847 },
  9: { a2: 0.337, d3: 0.184, d4: 1.816, d2: 2.97 },
  10: { a2: 0.308, d3: 0.223, d4: 1.777, d2: 3.078 },
};

export const MIN_SUBGROUP_SIZE = 2;
export const MAX_SUBGROUP_SIZE = 10;
/** A run of this many points on one side of the centre line is a signal. */
export const RUN_LENGTH = 7;

export interface XbarRResult {
  subgroupSize: number;
  subgroupCount: number;
  means: number[];
  ranges: number[];
  grandMean: number;
  meanRange: number;
  xbarUcl: number;
  xbarLcl: number;
  rangeUcl: number;
  rangeLcl: number;
  sigmaHat: number;
  /** Subgroup indices (0 based) whose mean is outside the X-bar limits. */
  meansOutOfControl: number[];
  /** Subgroup indices whose range is outside the R limits. */
  rangesOutOfControl: number[];
  /** Subgroup indices where a run of seven on one side is broken. */
  runs: { startIndex: number; endIndex: number; side: 'above' | 'below' }[];
}

/**
 * Parse one subgroup per line, values separated by a comma, space or tab.
 * Blank lines and lines starting with # are ignored.
 */
export function parseSubgroups(text: string): number[][] {
  const subgroups: number[][] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const parts = trimmed.split(/[\s,]+/);
    const values = parts.map((part) => Number(part));
    if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Line ${index + 1} is not a list of numbers: "${trimmed}".`);
    }
    subgroups.push(values);
  });
  if (subgroups.length === 0) {
    throw new Error('Enter at least two subgroups, one per line.');
  }
  return subgroups;
}

/** Compute the X-bar and R chart for a set of subgroups. */
export function xbarRChart(subgroups: number[][]): XbarRResult {
  if (!Array.isArray(subgroups) || subgroups.length === 0) {
    throw new Error('Enter at least two subgroups, one per line.');
  }
  if (subgroups.length < 2) {
    throw new Error('A control chart needs at least two subgroups to establish limits.');
  }

  const subgroupSize = subgroups[0].length;
  subgroups.forEach((subgroup, index) => {
    if (subgroup.length !== subgroupSize) {
      throw new Error(
        `Subgroup ${index + 1} has ${subgroup.length} readings while subgroup 1 has ${subgroupSize}; every subgroup must be the same size.`,
      );
    }
    if (subgroup.some((value) => !Number.isFinite(value))) {
      throw new Error(`Subgroup ${index + 1} contains a value that is not a number.`);
    }
  });

  if (subgroupSize < MIN_SUBGROUP_SIZE || subgroupSize > MAX_SUBGROUP_SIZE) {
    throw new Error(
      `The X-bar and R chart covers subgroup sizes ${MIN_SUBGROUP_SIZE} to ${MAX_SUBGROUP_SIZE}; this data has ${subgroupSize}. For single readings use an individuals chart instead.`,
    );
  }

  const constants = XBAR_R_CONSTANTS[subgroupSize];
  const means = subgroups.map(
    (subgroup) => subgroup.reduce((total, value) => total + value, 0) / subgroup.length,
  );
  const ranges = subgroups.map((subgroup) => Math.max(...subgroup) - Math.min(...subgroup));

  const grandMean = means.reduce((total, value) => total + value, 0) / means.length;
  const meanRange = ranges.reduce((total, value) => total + value, 0) / ranges.length;

  const xbarUcl = grandMean + constants.a2 * meanRange;
  const xbarLcl = grandMean - constants.a2 * meanRange;
  const rangeUcl = constants.d4 * meanRange;
  const rangeLcl = constants.d3 * meanRange;

  const meansOutOfControl = means
    .map((mean, index) => (mean > xbarUcl || mean < xbarLcl ? index : -1))
    .filter((index) => index >= 0);
  const rangesOutOfControl = ranges
    .map((range, index) => (range > rangeUcl || range < rangeLcl ? index : -1))
    .filter((index) => index >= 0);

  const runs = findRuns(means, grandMean);

  return {
    subgroupSize,
    subgroupCount: subgroups.length,
    means,
    ranges,
    grandMean,
    meanRange,
    xbarUcl,
    xbarLcl,
    rangeUcl,
    rangeLcl,
    sigmaHat: meanRange / constants.d2,
    meansOutOfControl,
    rangesOutOfControl,
    runs,
  };
}

/** Runs of at least RUN_LENGTH points on one side of the centre line. */
function findRuns(
  means: number[],
  centre: number,
): { startIndex: number; endIndex: number; side: 'above' | 'below' }[] {
  const runs: { startIndex: number; endIndex: number; side: 'above' | 'below' }[] = [];
  let start = 0;
  let side: 'above' | 'below' | null = null;

  const close = (endIndex: number) => {
    if (side !== null && endIndex - start + 1 >= RUN_LENGTH) {
      runs.push({ startIndex: start, endIndex, side });
    }
  };

  for (let index = 0; index <= means.length; index += 1) {
    const current = index < means.length ? (means[index] > centre ? 'above' : means[index] < centre ? 'below' : null) : null;
    if (current !== side) {
      close(index - 1);
      start = index;
      side = current;
    }
  }
  return runs;
}

/** Western Electric run rule: at least seven points on one side of the centre line. */
export function violatesRunRule(means: number[], centre: number): boolean {
  return findRuns(means, centre).length > 0;
}
