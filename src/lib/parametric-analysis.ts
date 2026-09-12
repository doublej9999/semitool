/**
 * Parametric analysis over STDF PTR (Parametric Test Record) data.
 *
 * Pure, dependency-light functions that turn `StdfParametricTestRecord[]` /
 * `StdfPartRecord[]` (as produced by `parseStdfV4`) into the statistics an
 * test / product engineer needs: per-test distribution summaries with Cpk,
 * sparkline-ready trend series and bin distributions.
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
