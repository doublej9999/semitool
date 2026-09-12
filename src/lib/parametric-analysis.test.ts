import { describe, expect, it } from 'vitest';
import { parseStdfV4, generateSyntheticStdfV4, type StdfParametricTestRecord, type StdfPartRecord } from './stdf-parser';
import {
  binSummary,
  groupByTest,
  splitTestGroupKey,
  summarizeTest,
  testGroupKey,
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
