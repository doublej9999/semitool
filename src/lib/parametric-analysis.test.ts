import { describe, expect, it } from 'vitest';
import { parseStdfV4, generateSyntheticStdfV4, type StdfParametricTestRecord, type StdfPartRecord } from './stdf-parser';
import {
  alignByPart,
  binSummary,
  correlateTests,
  groupByTest,
  pearson,
  spearman,
  splitTestGroupKey,
  summarizeTest,
  testGroupKey,
  topCorrelations,
  trendValues,
} from './parametric-analysis';

/**
 * Builds one STDF V4 PTR (15, 10) record matching the wire format the
 * parser in `stdf-parser.ts` expects (little-endian):
 * TEST_NUM U4, HEAD_NUM U1, SITE_NUM U1, TEST_FLG U1, PARM_FLG U1,
 * RESULT R4, TEST_TXT Cn, ALARM_ID Cn, OPT_FLAG U1, RES_SCAL I1,
 * LLM_SCAL I1, HLM_SCAL I1, LOW_LIMIT R4, HIGH_LIMIT R4, UNITS Cn.
 */
function buildPtrRecord(test: {
  testNumber: number;
  headNum: number;
  siteNum: number;
  result: number;
  testText: string;
  lowLimit?: number;
  highLimit?: number;
  units: string;
  passed: boolean;
}): Uint8Array {
  const payload: number[] = [];

  const u4 = (value: number) => {
    payload.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff);
  };
  const u1 = (value: number) => payload.push(value & 0xff);
  const r4 = (value: number) => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, value, true);
    payload.push(...new Uint8Array(buffer));
  };
  const cn = (value: string) => {
    payload.push(value.length);
    for (let i = 0; i < value.length; i++) payload.push(value.charCodeAt(i) & 0xff);
  };

  // OPT_FLAG: bit 6 (0x40) = no low limit, bit 7 (0x80) = no high limit.
  let optFlag = 0x00;
  if (test.lowLimit === undefined) optFlag |= 0x40;
  if (test.highLimit === undefined) optFlag |= 0x80;

  u4(test.testNumber);
  u1(test.headNum);
  u1(test.siteNum);
  u1(test.passed ? 0x00 : 0x40); // TEST_FLG: bit 6/7 set = failed
  u1(0x00); // PARM_FLG
  r4(test.result);
  cn(test.testText);
  cn(''); // ALARM_ID
  u1(optFlag);
  u1(0); // RES_SCAL
  u1(0); // LLM_SCAL
  u1(0); // HLM_SCAL
  r4(test.lowLimit ?? 0);
  r4(test.highLimit ?? 0);
  cn(test.units);

  const record = new Uint8Array(4 + payload.length);
  record[0] = payload.length & 0xff;
  record[1] = (payload.length >> 8) & 0xff;
  record[2] = 15; // REC_TYP
  record[3] = 10; // REC_SUB
  record.set(payload, 4);
  return record;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((accumulator, chunk) => accumulator + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** Deterministic pseudo-random generator so round-trip expectations are stable. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAND_RECORDS: StdfParametricTestRecord[] = [1, 2, 3, 4, 5].map((value, index) => ({
  testNumber: 100,
  headNum: 1,
  siteNum: (index % 2) + 1,
  result: value,
  testText: 'VTH_READ',
  units: 'V',
  passed: true,
}));

describe('summarizeTest', () => {
  it('computes distribution statistics for a known sample', () => {
    const summary = summarizeTest(HAND_RECORDS);

    expect(summary.n).toBe(5);
    expect(summary.mean).toBeCloseTo(3, 10);
    expect(summary.median).toBe(3);
    // Sample standard deviation (n - 1 divisor) of [1..5] = sqrt(2.5)
    expect(summary.stdDev).toBeCloseTo(Math.sqrt(2.5), 10);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(5);
    // Type-7 quantile: position (5-1)*0.95 = 3.8 -> 4 + 0.8 * (5 - 4)
    expect(summary.p95).toBeCloseTo(4.8, 10);
    expect(summary.outOfSpec).toBe(0);
    expect(summary.cpk).toBeUndefined();
  });

  it('computes two-sided Cpk as min of both spec distances', () => {
    const summary = summarizeTest(HAND_RECORDS, { lsl: 0, usl: 6 });
    const sigma = Math.sqrt(2.5);
    const expected = Math.min((6 - 3) / (3 * sigma), (3 - 0) / (3 * sigma));

    expect(summary.cpk).toBeCloseTo(expected, 10);
    expect(summary.outOfSpec).toBe(0);
  });

  it('supports one-sided limits and counts out-of-spec only on provided sides', () => {
    const upperOnly = summarizeTest(HAND_RECORDS, { usl: 4.5 });
    expect(upperOnly.cpk).toBeCloseTo((4.5 - 3) / (3 * Math.sqrt(2.5)), 10);
    expect(upperOnly.outOfSpec).toBe(1); // only the 5 exceeds usl

    const lowerOnly = summarizeTest(HAND_RECORDS, { lsl: 1.5 });
    expect(lowerOnly.cpk).toBeCloseTo((3 - 1.5) / (3 * Math.sqrt(2.5)), 10);
    expect(lowerOnly.outOfSpec).toBe(1); // only the 1 is below lsl
  });

  it('returns undefined Cpk when sigma is zero or no limits are given', () => {
    const constant: StdfParametricTestRecord[] = HAND_RECORDS.map((record) => ({ ...record, result: 3 }));
    expect(summarizeTest(constant, { lsl: 2, usl: 4 }).cpk).toBeUndefined();
    expect(summarizeTest(HAND_RECORDS).cpk).toBeUndefined();
  });

  it('is null-safe: NaN / Infinity results are filtered out', () => {
    const dirty: StdfParametricTestRecord[] = [
      ...HAND_RECORDS,
      { ...HAND_RECORDS[0], result: NaN },
      { ...HAND_RECORDS[0], result: Infinity },
      { ...HAND_RECORDS[0], result: -Infinity },
    ];

    const summary = summarizeTest(dirty);
    expect(summary.n).toBe(5);
    expect(summary.mean).toBeCloseTo(3, 10);
  });

  it('returns a zeroed summary for empty input', () => {
    const summary = summarizeTest([]);
    expect(summary.n).toBe(0);
    expect(summary.mean).toBe(0);
    expect(summary.stdDev).toBe(0);
    expect(summary.p95).toBe(0);
    expect(summary.outOfSpec).toBe(0);
    expect(summary.cpk).toBeUndefined();
  });

  it('ignores non-finite limits', () => {
    const summary = summarizeTest(HAND_RECORDS, { lsl: NaN, usl: Number.NaN });
    expect(summary.cpk).toBeUndefined();
    expect(summary.outOfSpec).toBe(0);
  });
});

describe('trendValues', () => {
  it('returns results in record (part/site) order and drops non-finite values', () => {
    const records: StdfParametricTestRecord[] = [
      { ...HAND_RECORDS[0], result: 4 },
      { ...HAND_RECORDS[0], result: NaN },
      { ...HAND_RECORDS[0], result: 2 },
    ];

    expect(trendValues(records)).toEqual([4, 2]);
    expect(trendValues([])).toEqual([]);
  });
});

describe('groupByTest', () => {
  it('groups by test text + units and separates identical text with different units', () => {
    const records: StdfParametricTestRecord[] = [
      { ...HAND_RECORDS[0], testText: 'VDD', units: 'V', result: 1 },
      { ...HAND_RECORDS[0], testText: 'VDD', units: 'V', result: 2 },
      { ...HAND_RECORDS[0], testText: 'VDD', units: 'mV', result: 3 },
    ];

    const groups = groupByTest(records);
    expect(groups.size).toBe(2);
    expect(groups.get('VDD|V')?.length).toBe(2);
    expect(groups.get('VDD|mV')?.length).toBe(1);
  });

  it('falls back to the test number when TEST_TXT is empty and filters non-finite results', () => {
    const records: StdfParametricTestRecord[] = [
      { ...HAND_RECORDS[0], testText: '', testNumber: 77, units: 'A', result: 1 },
      { ...HAND_RECORDS[0], testText: '', testNumber: 77, units: 'A', result: NaN },
    ];

    const groups = groupByTest(records);
    expect(groups.size).toBe(1);
    expect(groups.has('Test 77|A')).toBe(true);
    expect(groups.get('Test 77|A')?.length).toBe(1);
  });

  it('round-trips its own keys through splitTestGroupKey', () => {
    const key = testGroupKey({ testText: 'CONT continu ity', units: 'ohm', testNumber: 5 });
    const { name, units } = splitTestGroupKey(key);
    expect(name).toBe('CONT continu ity');
    expect(units).toBe('ohm');
  });
});

describe('binSummary', () => {
  it('summarizes soft bins with percentages sorted by bin number', () => {
    const parts: StdfPartRecord[] = [
      { softBin: 100, hardBin: 1 },
      { softBin: 100, hardBin: 1 },
      { softBin: 20, hardBin: 2 },
      { softBin: 20, hardBin: 2 },
      { softBin: 30, hardBin: 3 },
    ].map((partial) => ({
      ...partial,
      headNum: 1,
      siteNum: 1,
      passed: partial.softBin === 100,
      xCoord: 0,
      yCoord: 0,
      testTimeMs: 10,
      partId: '',
    }));

    const bins = binSummary(parts);
    expect(bins.map((entry) => entry.bin)).toEqual([20, 30, 100]);
    expect(bins.map((entry) => entry.count)).toEqual([2, 1, 2]);
    expect(bins.map((entry) => entry.percent)).toEqual([40, 20, 40]);
    expect(bins.reduce((accumulator, entry) => accumulator + entry.percent, 0)).toBeCloseTo(100, 10);
  });

  it('falls back to the hard bin when the soft bin is 0 (not specified)', () => {
    const parts: StdfPartRecord[] = [
      { softBin: 0, hardBin: 1 },
      { softBin: 0, hardBin: 4 },
      { softBin: 0, hardBin: 4 },
    ].map((partial) => ({
      ...partial,
      headNum: 1,
      siteNum: 1,
      passed: partial.hardBin === 1,
      xCoord: 0,
      yCoord: 0,
      testTimeMs: 10,
      partId: '',
    }));

    const bins = binSummary(parts);
    expect(bins.map((entry) => entry.bin)).toEqual([1, 4]);
    expect(bins.map((entry) => entry.count)).toEqual([1, 2]);
    expect(bins[0].percent).toBeCloseTo(100 / 3, 10);
    expect(bins[1].percent).toBeCloseTo(200 / 3, 10);
  });

  it('returns an empty list for no parts', () => {
    expect(binSummary([])).toEqual([]);
  });
});

describe('STDF round trip (generate -> parse -> analyze)', () => {
  it('parses synthetic STDF plus PTR records into sane per-test statistics', () => {
    const random = mulberry32(20260913);
    const lotDieCount = 200;

    // 5 parametric tests measured once per die (site 1), with specs.
    const testDefs = [
      { testNumber: 1100, testText: 'VDD_CORE', units: 'V', lowLimit: 0.7, highLimit: 0.8, nominal: 0.75, noise: 0.012 },
      { testNumber: 1200, testText: 'FREQ_MAX', units: 'MHz', lowLimit: 750, highLimit: 880, nominal: 815, noise: 15 },
      { testNumber: 1300, testText: 'LEAKAGE', units: 'uA', lowLimit: undefined, highLimit: 5, nominal: 2.2, noise: 0.9 },
    ];

    const generated: StdfParametricTestRecord[][] = [[], [], []];
    for (let die = 0; die < lotDieCount; die++) {
      testDefs.forEach((def, index) => {
        const result = def.nominal + (random() - 0.5) * 2 * def.noise;
        const lowLimit = def.lowLimit;
        const highLimit = def.highLimit;
        const passed =
          (lowLimit === undefined || result >= lowLimit) && (highLimit === undefined || result <= highLimit);
        generated[index].push({
          testNumber: def.testNumber,
          headNum: 1,
          siteNum: 1,
          result,
          testText: def.testText,
          lowLimit,
          highLimit,
          units: def.units,
          passed,
        });
      });
    }

    // Interleave one PTR per die (test-major would not match a real datalog).
    const ptrStream = concatBytes(
      Array.from({ length: lotDieCount }, (_, die) =>
        concatBytes(generated.map((records) => buildPtrRecord(records[die]))),
      ),
    );
    const stdf = concatBytes([
      generateSyntheticStdfV4({ lotId: 'LOT-EXP', dieCount: lotDieCount, yieldPercent: 92 }),
      ptrStream,
    ]);

    const parsed = parseStdfV4(stdf);

    // PRR round trip: part and bin data survive the binary encoding.
    expect(parsed.mir?.lotId).toBe('LOT-EXP');
    expect(parsed.totalParts).toBe(lotDieCount);
    expect(parsed.parts.length).toBe(lotDieCount);
    expect(Object.values(parsed.softBins).reduce((a, b) => a + b, 0)).toBe(lotDieCount);
    expect(parsed.yieldPercent).toBeGreaterThan(0);
    expect(parsed.yieldPercent).toBeLessThanOrEqual(100);

    // PTR round trip: every record decoded with its text, units and limits.
    expect(parsed.parametricTests.length).toBe(lotDieCount * testDefs.length);
    expect(parsed.parametricTests.every((record) => Number.isFinite(record.result))).toBe(true);

    const groups = groupByTest(parsed.parametricTests);
    expect(groups.size).toBe(testDefs.length);

    testDefs.forEach((def, index) => {
      const key = `${def.testText}|${def.units}`;
      const records = groups.get(key);
      expect(records, key).toBeDefined();
      expect(records!.length).toBe(lotDieCount);
      expect(records![0].testNumber).toBe(def.testNumber);
      // Limits are encoded as float32, so compare with R4 precision.
      if (def.lowLimit !== undefined) {
        expect(records![0].lowLimit).toBeCloseTo(def.lowLimit, 5);
      } else {
        expect(records![0].lowLimit).toBeUndefined();
      }
      if (def.highLimit !== undefined) {
        expect(records![0].highLimit).toBeCloseTo(def.highLimit, 5);
      } else {
        expect(records![0].highLimit).toBeUndefined();
      }

      const summary = summarizeTest(records!, { lsl: def.lowLimit, usl: def.highLimit });
      const expectedMean = records!.reduce((a, r) => a + r.result, 0) / records!.length;

      expect(summary.n).toBe(lotDieCount);
      expect(summary.mean).toBeCloseTo(expectedMean, 10);
      expect(summary.min).toBeLessThanOrEqual(summary.mean);
      expect(summary.max).toBeGreaterThanOrEqual(summary.mean);
      expect(summary.median).toBeGreaterThanOrEqual(summary.min);
      expect(summary.median).toBeLessThanOrEqual(summary.max);
      expect(summary.stdDev).toBeGreaterThan(0);
      expect(summary.p95).toBeGreaterThanOrEqual(summary.median);
      // All three demo tests sit mostly inside their spec window.
      expect(summary.outOfSpec).toBeLessThan(lotDieCount / 2);
      expect(summary.cpk).not.toBeUndefined();
      expect(summary.cpk!).toBeGreaterThan(0);

      // Sparkline series has one finite point per result, in file order.
      const trend = trendValues(records!);
      expect(trend.length).toBe(lotDieCount);
      expect(trend[0]).toBeCloseTo(parsed.parametricTests[index].result, 6);
    });
  });
});

/** Builds a minimal in-memory PTR record for the correlation fixtures. */
function ptr(partial: Partial<StdfParametricTestRecord> & { result: number }): StdfParametricTestRecord {
  return { testNumber: 100, headNum: 1, siteNum: 1, testText: 'T', units: 'V', passed: true, ...partial };
}

/** Site-1 stream from raw values, one part per record. */
function siteStream(testText: string, values: number[]): StdfParametricTestRecord[] {
  return values.map((result) => ptr({ testText, result }));
}

describe('pearson', () => {
  it('is 1 for perfectly correlated samples', () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3, 4, 5], [3, 5, 7, 9, 11])).toBeCloseTo(1, 10);
  });

  it('is -1 for perfectly anti-correlated samples', () => {
    expect(pearson([1, 2, 3, 4, 5], [-2, -4, -6, -8, -10])).toBeCloseTo(-1, 10);
  });

  it('matches a hand-computed coefficient for a noisy sample', () => {
    // x=[1..5], y=[3,1,4,2,5]: cov=5, varX=varY=10 -> r = 0.5
    expect(pearson([1, 2, 3, 4, 5], [3, 1, 4, 2, 5])).toBeCloseTo(0.5, 10);
  });

  it('returns null below 3 pairs, on zero variance, or with non-finite pairs', () => {
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([5, 5, 5], [1, 2, 3])).toBeNull();
    expect(pearson([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3], [1, 2, NaN])).toBeNull();
    expect(pearson([1, 2, 3], [1, 2, Infinity])).toBeNull();
    expect(pearson([], [])).toBeNull();
  });
});

describe('spearman', () => {
  it('is 1 for any monotonic relationship, even when pearson is not', () => {
    const x = [1, 2, 3, 4, 5];
    const quadratic = [1, 4, 9, 16, 25];
    expect(spearman(x, quadratic)).toBeCloseTo(1, 10);
    expect(pearson(x, quadratic)!).toBeLessThan(0.999);
  });

  it('is -1 for perfectly inverted ranks', () => {
    expect(spearman([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 10);
  });

  it('averages ranks for ties (hand-computed case)', () => {
    // x ranks: 1, 2.5, 2.5, 4; y ranks: 1, 2, 3, 4
    // cov(rx, ry) = 4.5, var(rx) = 4.5, var(ry) = 5 -> r = 4.5 / sqrt(22.5)
    expect(spearman([1, 2, 2, 3], [10, 20, 30, 40])).toBeCloseTo(0.9486832980505138, 10);
  });

  it('returns null below 3 pairs, on constant input, or with non-finite values', () => {
    expect(spearman([1, 2], [1, 2])).toBeNull();
    expect(spearman([7, 7, 7], [1, 2, 3])).toBeNull();
    expect(spearman([1, 2, 3], [1, 2, NaN])).toBeNull();
    expect(spearman([], [])).toBeNull();
  });
});

describe('alignByPart', () => {
  it('aligns interleaved multi-site streams by (head, site, execution order)', () => {
    const a = [
      ptr({ testText: 'A', headNum: 1, siteNum: 1, result: 1 }),
      ptr({ testText: 'A', headNum: 1, siteNum: 2, result: 2 }),
      ptr({ testText: 'A', headNum: 1, siteNum: 1, result: 3 }),
      ptr({ testText: 'A', headNum: 1, siteNum: 2, result: 4 }),
    ];
    const b = [
      ptr({ testText: 'B', headNum: 1, siteNum: 1, result: 10 }),
      ptr({ testText: 'B', headNum: 1, siteNum: 2, result: 20 }),
      ptr({ testText: 'B', headNum: 1, siteNum: 1, result: 30 }),
      ptr({ testText: 'B', headNum: 1, siteNum: 2, result: 40 }),
    ];

    expect(alignByPart(a, b)).toEqual([
      { headNum: 1, siteNum: 1, resultA: 1, resultB: 10 },
      { headNum: 1, siteNum: 2, resultA: 2, resultB: 20 },
      { headNum: 1, siteNum: 1, resultA: 3, resultB: 30 },
      { headNum: 1, siteNum: 2, resultA: 4, resultB: 40 },
    ]);
  });

  it('pairs occurrences even when the two streams interleave sites differently', () => {
    const a = [
      ptr({ testText: 'A', siteNum: 1, result: 1 }), // A (1,1)#0
      ptr({ testText: 'A', siteNum: 2, result: 2 }), // A (1,2)#0
      ptr({ testText: 'A', siteNum: 1, result: 3 }), // A (1,1)#1
      ptr({ testText: 'A', siteNum: 2, result: 4 }), // A (1,2)#1
    ];
    const b = [
      ptr({ testText: 'B', siteNum: 2, result: 20 }), // B (1,2)#0
      ptr({ testText: 'B', siteNum: 1, result: 10 }), // B (1,1)#0
      ptr({ testText: 'B', siteNum: 2, result: 40 }), // B (1,2)#1
      ptr({ testText: 'B', siteNum: 1, result: 30 }), // B (1,1)#1
    ];

    const pairs = alignByPart(a, b);
    expect(pairs.map((pair) => [pair.resultA, pair.resultB])).toEqual([
      [1, 10],
      [2, 20],
      [3, 30],
      [4, 40],
    ]);
  });

  it('does not shift alignment across invalid readings and drops those pairs', () => {
    const a = siteStream('A', [1, NaN, 3]);
    const b = siteStream('B', [10, 20, 30]);

    const pairs = alignByPart(a, b);
    expect(pairs).toEqual([
      { headNum: 1, siteNum: 1, resultA: 1, resultB: 10 },
      { headNum: 1, siteNum: 1, resultA: 3, resultB: 30 },
    ]);
  });

  it('drops occurrences that only exist in one stream', () => {
    const a = [
      ptr({ testText: 'A', siteNum: 1, result: 1 }),
      ptr({ testText: 'A', siteNum: 2, result: 2 }),
      ptr({ testText: 'A', siteNum: 1, result: 3 }),
      ptr({ testText: 'A', siteNum: 2, result: 4 }),
    ];
    const b = [
      ptr({ testText: 'B', siteNum: 1, result: 10 }),
      ptr({ testText: 'B', siteNum: 1, result: 30 }),
      ptr({ testText: 'B', headNum: 2, siteNum: 9, result: 99 }),
    ];

    const pairs = alignByPart(a, b);
    expect(pairs.map((pair) => [pair.siteNum, pair.resultA, pair.resultB])).toEqual([
      [1, 1, 10],
      [1, 3, 30],
    ]);
  });

  it('returns an empty list for empty or missing inputs', () => {
    expect(alignByPart([], [])).toEqual([]);
    expect(alignByPart(siteStream('A', [1, 2, 3]), [])).toEqual([]);
  });
});

describe('correlateTests', () => {
  it('correlates two tests over their shared parts and reports the group keys', () => {
    const a = siteStream('VTH', [1, 2, 3, 4, 5]);
    const b = siteStream('IDSS', [2, 4, 6, 8, 10]);

    const correlation = correlateTests(a, b);
    expect(correlation).not.toBeNull();
    expect(correlation!.n).toBe(5);
    expect(correlation!.pearson).toBeCloseTo(1, 10);
    expect(correlation!.spearman).toBeCloseTo(1, 10);
    expect(correlation!.testA).toBe('VTH|V');
    expect(correlation!.testB).toBe('IDSS|V');
  });

  it('returns null when fewer than 3 part pairs survive alignment', () => {
    expect(correlateTests(siteStream('A', [1, 2]), siteStream('B', [1, 2]))).toBeNull();
    expect(correlateTests([], siteStream('B', [1, 2, 3]))).toBeNull();
  });

  it('keeps the result with null coefficients when a test is constant', () => {
    const correlation = correlateTests(siteStream('A', [1, 2, 3, 4]), siteStream('B', [5, 5, 5, 5]));
    expect(correlation).not.toBeNull();
    expect(correlation!.n).toBe(4);
    expect(correlation!.pearson).toBeNull();
    expect(correlation!.spearman).toBeNull();
  });
});

describe('topCorrelations', () => {
  const groups = new Map<string, StdfParametricTestRecord[]>([
    ['A|V', siteStream('A', [1, 2, 3, 4, 5])],
    ['B|V', siteStream('B', [2, 4, 6, 8, 10])], // r(A,B) = +1
    ['C|V', siteStream('C', [-1, -2, -3, -4, -5])], // r(A,C) = r(B,C) = -1
    ['D|V', siteStream('D', [1, 3, 2, 5, 4])], // r(A,D) = r(B,D) = r(C,D) = ±0.8
  ]);

  it('ranks pairs by |r| descending while preserving both signs', () => {
    const top = topCorrelations(groups);
    expect(top.map((entry) => [entry.testA, entry.testB, Number(entry.pearson!.toFixed(6))])).toEqual([
      ['A|V', 'B|V', 1],
      ['A|V', 'C|V', -1],
      ['B|V', 'C|V', -1],
      ['A|V', 'D|V', 0.8],
      ['B|V', 'D|V', 0.8],
      ['C|V', 'D|V', -0.8],
    ]);
  });

  it('honours the limit', () => {
    const top = topCorrelations(groups, 2);
    expect(top).toHaveLength(2);
    expect(top[0].pearson).toBeCloseTo(1, 10);
    expect(top[1].pearson).toBeCloseTo(-1, 10);
  });

  it('compares only the CORRELATION_GROUP_CAP largest groups', () => {
    const many = new Map<string, StdfParametricTestRecord[]>();
    for (let index = 0; index < 11; index++) {
      many.set(`G${index}|V`, siteStream(`G${index}`, [index, -index, index * 2, 0, 1]));
    }
    many.set('G11|V', siteStream('G11', [1, 2, 3, 4, 5]));
    // Smallest group (4 records) falls outside the 12-group cap, so the
    // otherwise-perfect (G11, G12) pair must never be considered.
    many.set('G12|V', siteStream('G12', [1, 2, 3, 4]));

    const top = topCorrelations(many);
    expect(top.every((entry) => entry.testA !== 'G12|V' && entry.testB !== 'G12|V')).toBe(true);
  });

  it('returns an empty list when there is nothing to correlate', () => {
    expect(topCorrelations(new Map())).toEqual([]);
    expect(topCorrelations(new Map([['A|V', siteStream('A', [1, 2, 3])]]))).toEqual([]);
  });
});
