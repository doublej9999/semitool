/**
 * Parametric analysis over STDF PTR (Parametric Test Record) data.
 *
 * Pure, dependency-light functions that turn `StdfParametricTestRecord[]` /
 * `StdfPartRecord[]` (as produced by `parseStdfV4`) into the statistics a
 * test / product engineer needs: per-test distribution summaries with Cpk,
 * sparkline-ready trend series, bin distributions and PTR-vs-PTR correlation
 * (Pearson r / Spearman ρ) between pairs of tests.
 *
 * Numerics are null-safe: records whose `result` is NaN / ±Infinity /
 * undefined are filtered out before any statistic is computed.
 */

import type { StdfParametricTestRecord, StdfPartRecord } from './stdf-parser';

/** Quantile helper reused so p95 matches the rest of the site's statistics. */
import { calculateQuantile } from './metrology-batch';

/**
 * Stable identity for a group of PTR records that measure the same thing.
 *
 * STDF repeats one PTR per part per site, so records are grouped by the
 * combination of test text and units. When the tester did not write a
 * `TEST_TXT`, the test number is used as the name so unnamed tests do not
 * all collapse into a single bucket.
 */
export function testGroupKey(record: Pick<StdfParametricTestRecord, 'testText' | 'units' | 'testNumber'>): string {
  const name = record.testText?.trim() || `Test ${record.testNumber}`;
  const units = record.units?.trim() ?? '';
  return `${name}|${units}`;
}

/** Splits a `testGroupKey` back into its display name and unit label. */
export function splitTestGroupKey(key: string): { name: string; units: string } {
  const separator = key.lastIndexOf('|');
  if (separator < 0) return { name: key, units: '' };
  return { name: key.slice(0, separator), units: key.slice(separator + 1) };
}

/**
 * Groups parametric test records by test text + units.
 *
 * Insertion order follows the first appearance of each test in the file,
 * which is the order a datalogger typically emits them in.
 */
export function groupByTest(records: StdfParametricTestRecord[]): Map<string, StdfParametricTestRecord[]> {
  const groups = new Map<string, StdfParametricTestRecord[]>();

  for (const record of records) {
    if (!Number.isFinite(record?.result)) continue;

    const key = testGroupKey(record);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  return groups;
}

export interface TestSummaryOptions {
  /** Lower specification limit. Omitted for one-sided upper-spec tests. */
  lsl?: number;
  /** Upper specification limit. Omitted for one-sided lower-spec tests. */
  usl?: number;
  /** Nominal / target value. Informational only — Cpk does not use it. */
  target?: number;
}

export interface TestSummary {
  /** Number of finite results analysed. */
  n: number;
  mean: number;
  median: number;
  /** Sample standard deviation (n − 1 divisor); 0 when n < 2. */
  stdDev: number;
  min: number;
  max: number;
  /** 95th percentile, linear interpolation between closest ranks (Type 7). */
  p95: number;
  /** Results outside the provided limits (only counted on provided sides). */
  outOfSpec: number;
  /**
   * Process capability index: min((USL − μ) / 3σ, (μ − LSL) / 3σ).
   * Computed only when at least one limit is provided and the sample
   * standard deviation σ > 0 — a σ of 0 cannot bound the tail behaviour,
   * so reporting a finite (infinite) Cpk would be misleading.
   */
  cpk?: number;
}

const ZERO_SUMMARY: TestSummary = {
  n: 0,
  mean: 0,
  median: 0,
  stdDev: 0,
  min: 0,
  max: 0,
  p95: 0,
  outOfSpec: 0,
};

/**
 * Distribution summary for one test's results.
 *
 * σ handling: Cpk uses the *sample* standard deviation (n − 1 divisor),
 * which is the conventional estimator for a finite datalog sample.
 */
export function summarizeTest(
  records: StdfParametricTestRecord[],
  options: TestSummaryOptions = {},
): TestSummary {
  const values = (records ?? [])
    .map((record) => record?.result)
    .filter((result): result is number => Number.isFinite(result));

  if (values.length === 0) {
    return { ...ZERO_SUMMARY };
  }

  const n = values.length;
  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  const mean = sum / n;

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = calculateQuantile(sorted, 0.5);
  const p95 = calculateQuantile(sorted, 0.95);

  const varianceSum = values.reduce((accumulator, value) => accumulator + (value - mean) ** 2, 0);
  const stdDev = n > 1 ? Math.sqrt(varianceSum / (n - 1)) : 0;

  let outOfSpec = 0;
  if (options.lsl !== undefined && Number.isFinite(options.lsl)) {
    outOfSpec += values.filter((value) => value < options.lsl!).length;
  }
  if (options.usl !== undefined && Number.isFinite(options.usl)) {
    outOfSpec += values.filter((value) => value > options.usl!).length;
  }

  let cpk: number | undefined;
  const hasLsl = options.lsl !== undefined && Number.isFinite(options.lsl);
  const hasUsl = options.usl !== undefined && Number.isFinite(options.usl);
  if ((hasLsl || hasUsl) && stdDev > 0) {
    const sigma = 3 * stdDev;
    const upper = hasUsl ? (options.usl! - mean) / sigma : Infinity;
    const lower = hasLsl ? (mean - options.lsl!) / sigma : Infinity;
    cpk = Math.min(upper, lower);
  }

  return { n, mean, median, stdDev, min, max, p95, outOfSpec, cpk };
}

/**
 * Results in part/site order, ready for sparkline plotting.
 *
 * PTR records appear in a datalog in test-execution order (per part, per
 * site), so the original record order is preserved; non-finite results
 * (NaN / ±Infinity) are dropped.
 */
export function trendValues(records: StdfParametricTestRecord[]): number[] {
  return (records ?? [])
    .map((record) => record?.result)
    .filter((result): result is number => Number.isFinite(result));
}

export interface BinEntry {
  /** Bin number (soft bin when present, otherwise the hard bin). */
  bin: number;
  count: number;
  /** Share of parts in this bin, 0–100. */
  percent: number;
}

/**
 * Bin distribution from part records.
 *
 * Uses the soft bin when the part has one (STDF soft bin 0 means "not
 * specified") and falls back to the hard bin otherwise. Entries are sorted
 * by bin number ascending.
 */
export function binSummary(parts: StdfPartRecord[]): BinEntry[] {
  const counts = new Map<number, number>();
  let total = 0;

  for (const part of parts ?? []) {
    if (!part) continue;
    const bin = part.softBin !== 0 ? part.softBin : part.hardBin;
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
    total += 1;
  }

  if (total === 0) return [];

  return [...counts.entries()]
    .map(([bin, count]) => ({ bin, count, percent: (count / total) * 100 }))
    .sort((a, b) => a.bin - b.bin);
}

/**
 * One aligned PTR pair: the same physical part measured by two tests.
 */
export interface AlignedPartPair {
  headNum: number;
  siteNum: number;
  /** Result of the first test for this part occurrence. */
  resultA: number;
  /** Result of the second test for the same part occurrence. */
  resultB: number;
}

/**
 * Aligns two tests' PTR streams part-by-part.
 *
 * STDF datalogs repeat one PTR per part per site and parts arrive in
 * execution order, so the k-th PTR seen for a given (headNum, siteNum) pair
 * in each stream is the k-th part tested on that site — not necessarily the
 * same wall-clock part across sites, which is why alignment never merges
 * different sites. Occurrence indexes are counted on *every* record (before
 * any filtering) so one invalid reading cannot shift the part numbering;
 * pairs where either result is non-finite are then dropped, and occurrences
 * that only exist in one stream are unmatched and dropped as well.
 */
export function alignByPart(
  recordsA: StdfParametricTestRecord[],
  recordsB: StdfParametricTestRecord[],
): AlignedPartPair[] {
  const siteKey = (record: StdfParametricTestRecord) => `${record?.headNum}:${record?.siteNum}`;

  // Pass 1: count part occurrences per (head, site) in both streams, in
  // execution order, without dropping anything.
  const countOccurrences = (records: StdfParametricTestRecord[]) => {
    const counts = new Map<string, number>();
    const occurrences: number[] = [];
    for (const record of records ?? []) {
      const key = siteKey(record);
      const occurrence = counts.get(key) ?? 0;
      counts.set(key, occurrence + 1);
      occurrences.push(occurrence);
    }
    return occurrences;
  };

  const occurrencesA = countOccurrences(recordsA ?? []);
  const occurrencesB = countOccurrences(recordsB ?? []);

  // Pass 2: index stream B by (head, site, occurrence), then walk stream A.
  const resultsB = new Map<string, number>();
  (recordsB ?? []).forEach((record, index) => {
    resultsB.set(`${siteKey(record)}#${occurrencesB[index]}`, record?.result);
  });

  const pairs: AlignedPartPair[] = [];
  (recordsA ?? []).forEach((record, index) => {
    const resultB = resultsB.get(`${siteKey(record)}#${occurrencesA[index]}`);
    if (resultB === undefined) return; // unmatched part occurrence
    const resultA = record?.result;
    if (!Number.isFinite(resultA) || !Number.isFinite(resultB)) return;
    pairs.push({ headNum: record.headNum, siteNum: record.siteNum, resultA, resultB });
  });

  return pairs;
}

/**
 * Pearson product-moment correlation coefficient of two aligned samples.
 *
 * Returns null when there are fewer than 3 pairs, when either side has zero
 * variance (a constant cannot correlate) or when any pair is non-finite so
 * the coefficient would be undefined. The result is clamped to [-1, 1] to
 * absorb floating-point drift.
 */
export function pearson(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;

  let sumX = 0;
  let sumY = 0;
  for (let index = 0; index < n; index++) {
    sumX += x[index];
    sumY += y[index];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covarianceSum = 0;
  let varianceXSum = 0;
  let varianceYSum = 0;
  for (let index = 0; index < n; index++) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    covarianceSum += dx * dy;
    varianceXSum += dx * dx;
    varianceYSum += dy * dy;
  }

  if (varianceXSum === 0 || varianceYSum === 0) return null;

  const r = covarianceSum / Math.sqrt(varianceXSum * varianceYSum);
  if (!Number.isFinite(r)) return null;
  return Math.max(-1, Math.min(1, r));
}

/** 1-based average ranks (ties share the mean of their rank positions). */
function averageRanks(values: number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let start = 0;
  while (start < order.length) {
    let end = start;
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end++;
    const averageRank = (start + end) / 2 + 1;
    for (let position = start; position <= end; position++) {
      ranks[order[position].index] = averageRank;
    }
    start = end + 1;
  }
  return ranks;
}

/**
 * Spearman rank correlation coefficient of two aligned samples.
 *
 * Computed as the Pearson coefficient of the average ranks, which is the
 * conventional definition and handles ties without the shortcut formula.
 * Same guards as `pearson`: null for n < 3, non-finite input or zero rank
 * variance (which includes constant inputs).
 */
export function spearman(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  // NaN would silently corrupt the rank sort, so reject up front.
  if (xs.some((value) => !Number.isFinite(value)) || ys.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return pearson(averageRanks(xs), averageRanks(ys));
}

export interface TestCorrelation {
  /** Number of aligned part pairs the coefficients are computed over. */
  n: number;
  /** Pearson r; null when undefined (e.g. a constant test). */
  pearson: number | null;
  /** Spearman ρ; null when undefined (e.g. non-finite inputs). */
  spearman: number | null;
  /** Group key of the first test (see `testGroupKey`). */
  testA: string;
  /** Group key of the second test. */
  testB: string;
}

/**
 * Correlates two tests' PTR streams over the parts they share.
 *
 * Returns null when fewer than 3 part pairs survive alignment — the
 * coefficients would be meaningless. The per-coefficient guards (constant
 * test, non-finite readings) surface as null fields instead.
 */
export function correlateTests(
  recordsA: StdfParametricTestRecord[],
  recordsB: StdfParametricTestRecord[],
): TestCorrelation | null {
  const pairs = alignByPart(recordsA, recordsB);
  if (pairs.length < 3) return null;

  const xs = pairs.map((pair) => pair.resultA);
  const ys = pairs.map((pair) => pair.resultB);

  return {
    n: pairs.length,
    pearson: pearson(xs, ys),
    spearman: spearman(xs, ys),
    testA: recordsA?.[0] ? testGroupKey(recordsA[0]) : '',
    testB: recordsB?.[0] ? testGroupKey(recordsB[0]) : '',
  };
}

/** Upper bound on how many largest groups `topCorrelations` compares. */
export const CORRELATION_GROUP_CAP = 12;

/**
 * Strongest pairwise correlations across a grouped datalog.
 *
 * Only the `CORRELATION_GROUP_CAP` largest groups (by record count) are
 * compared pairwise — O(k²) correlations on a datalog with hundreds of
 * tests is neither useful nor cheap. Returns up to `limit` pairs sorted by
 * |r| descending, preserving the sign so anti-correlations surface too.
 * Pairs whose Pearson coefficient is undefined are not rankable and skipped.
 */
export function topCorrelations(
  groups: Map<string, StdfParametricTestRecord[]>,
  limit = 8,
): TestCorrelation[] {
  const largest = [...(groups?.entries() ?? [])]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, CORRELATION_GROUP_CAP);

  const correlations: TestCorrelation[] = [];
  for (let i = 0; i < largest.length; i++) {
    for (let j = i + 1; j < largest.length; j++) {
      const [keyA, recordsA] = largest[i];
      const [keyB, recordsB] = largest[j];
      const correlation = correlateTests(recordsA, recordsB);
      if (correlation && correlation.pearson !== null) {
        correlations.push({ ...correlation, testA: keyA, testB: keyB });
      }
    }
  }

  return correlations
    .sort((a, b) => Math.abs(b.pearson!) - Math.abs(a.pearson!))
    .slice(0, limit);
}
