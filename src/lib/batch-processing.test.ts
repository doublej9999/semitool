import { describe, expect, it } from 'vitest';
import {
  parseDelimitedText,
  escapeCsvField,
  buildCsv,
  parseReadingNumbers,
  processFilmUniformityBatch,
  exportFilmUniformityBatchCsv,
  getFilmUniformitySampleCsv,
  processCdUniformityBatch,
  exportCdUniformityBatchCsv,
  getCdUniformitySampleCsv,
  processArrheniusBatch,
  exportArrheniusBatchCsv,
  getArrheniusSampleCsv,
} from './batch-processing';
import { BOLTZMANN_EV_PER_K, celsiusToKelvin } from './arrhenius';

describe('CSV Parsing and Utilities', () => {
  it('parses standard comma-separated lines', () => {
    const csv = 'A,B,C\n1,2,3\n4,5,6';
    const parsed = parseDelimitedText(csv);
    expect(parsed).toEqual([
      ['A', 'B', 'C'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]);
  });

  it('parses tab-separated lines', () => {
    const tsv = 'Sample\tTarget\tReadings\nW1\t100\t100.5\t101.2';
    const parsed = parseDelimitedText(tsv);
    expect(parsed).toEqual([
      ['Sample', 'Target', 'Readings'],
      ['W1', '100', '100.5', '101.2'],
    ]);
  });

  it('parses semicolon-separated lines', () => {
    const ssv = 'Sample;Target;Readings\nW1;100;100.5';
    const parsed = parseDelimitedText(ssv);
    expect(parsed).toEqual([
      ['Sample', 'Target', 'Readings'],
      ['W1', '100', '100.5'],
    ]);
  });

  it('handles quotes with commas and escaped quotes', () => {
    const csv = 'ID,Target,Readings\n"W,1",100,"10.1, 10.2, 10.3"\n"W""2""",200,"20.0"';
    const parsed = parseDelimitedText(csv);
    expect(parsed).toEqual([
      ['ID', 'Target', 'Readings'],
      ['W,1', '100', '10.1, 10.2, 10.3'],
      ['W"2"', '200', '20.0'],
    ]);
  });

  it('skips blank and whitespace-only lines and trims fields', () => {
    const csv = ' \n  A , B  \n\n  1 , 2  \r\n   \r\n';
    const parsed = parseDelimitedText(csv);
    expect(parsed).toEqual([
      ['A', 'B'],
      ['1', '2'],
    ]);
  });

  it('returns empty array on empty or falsy text', () => {
    expect(parseDelimitedText('')).toEqual([]);
    expect(parseDelimitedText('   \n  \t  \n')).toEqual([]);
  });

  it('properly escapes fields according to RFC 4180', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
    expect(escapeCsvField('hello "world"')).toBe('"hello ""world"""');
    expect(escapeCsvField('hello\nworld')).toBe('"hello\nworld"');
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('builds CSV text correctly', () => {
    const headers = ['ID', 'Value', 'Note'];
    const rows = [
      ['W1', 10.5, 'Normal'],
      ['W2', 20.0, 'Has "quotes" and, comma'],
    ];
    const csv = buildCsv(headers, rows);
    expect(csv).toContain('ID,Value,Note');
    expect(csv).toContain('W1,10.5,Normal');
    expect(csv).toContain('W2,20,"Has ""quotes"" and, comma"');
  });

  it('parses reading numbers from space, comma, tab, or semicolon separated strings', () => {
    expect(parseReadingNumbers('10.1 10.2 10.3')).toEqual([10.1, 10.2, 10.3]);
    expect(parseReadingNumbers('10.1, 10.2, 10.3')).toEqual([10.1, 10.2, 10.3]);
    expect(parseReadingNumbers('10.1; 10.2\t10.3')).toEqual([10.1, 10.2, 10.3]);
    expect(parseReadingNumbers(['10.1, 10.2', '10.3 10.4'])).toEqual([10.1, 10.2, 10.3, 10.4]);
    expect(parseReadingNumbers('10.1, invalid, 10.3, NaN')).toEqual([10.1, 10.3]);
  });
});

describe('Film Uniformity Batch Processing', () => {
  it('processes Option A format (readings in single quoted column)', () => {
    const csv = [
      'Sample_ID, Target_nm, Readings',
      'Wafer_01, 100, "100.0, 102.0, 98.0"',
    ].join('\n');

    const res = processFilmUniformityBatch(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);

    const row = res.rows[0];
    expect(row.sampleId).toBe('Wafer_01');
    expect(row.id).toBe('Wafer_01');
    expect(row.target).toBe(100);
    expect(row.n).toBe(3);
    expect(row.mean).toBeCloseTo(100.0, 5);
    expect(row.min).toBe(98.0);
    expect(row.max).toBe(102.0);
    expect(row.range).toBe(4.0);
    // sigma of [100, 102, 98]: mean=100, dev=[0, 4, 4], sum=8, variance=8/2=4, sigma=2
    expect(row.sigma).toBeCloseTo(2.0, 5);
    expect(row.threeSigma).toBeCloseTo(6.0, 5);
    // rangePercent = range / mean * 100 = 4 / 100 * 100 = 4%
    expect(row.rangePercent).toBeCloseTo(4.0, 5);
    // halfRangePercent = 4 / 200 * 100 = 2%
    expect(row.halfRangePercent).toBeCloseTo(2.0, 5);
    // targetDelta = mean - target = 100 - 100 = 0
    expect(row.targetDelta).toBeCloseTo(0.0, 5);
    expect(row.error).toBeNull();
  });

  it('processes Option B format (readings across multiple columns)', () => {
    const csv = [
      'Sample_ID, Target_nm, P1, P2, P3',
      'Wafer_01, 100, 100.0, 102.0, 98.0',
    ].join('\n');

    const res = processFilmUniformityBatch(csv);
    expect(res.rows).toHaveLength(1);
    const row = res.rows[0];
    expect(row.n).toBe(3);
    expect(row.mean).toBeCloseTo(100.0, 5);
    expect(row.sigma).toBeCloseTo(2.0, 5);
  });

  it('handles optional target correctly when omitted or empty', () => {
    const csv = [
      'Sample_ID, Target_nm, Readings',
      'Wafer_01, , "100.0, 102.0"',
    ].join('\n');

    const res = processFilmUniformityBatch(csv);
    expect(res.rows[0].target).toBeNull();
    expect(res.rows[0].targetDelta).toBeNull();
  });

  it('handles edge case: fewer than 2 points', () => {
    const csv = [
      'Sample_ID, Target_nm, Readings',
      'Wafer_One, 100, 105.0',
      'Wafer_Zero, 100, ',
    ].join('\n');

    const res = processFilmUniformityBatch(csv);
    expect(res.rows).toHaveLength(2);

    expect(res.rows[0].n).toBe(1);
    expect(res.rows[0].sigma).toBeNull();
    expect(res.rows[0].threeSigma).toBeNull();
    expect(res.rows[0].rangePercent).toBeNull();
    expect(res.rows[0].halfRangePercent).toBeNull();
    expect(res.rows[0].error).toContain('At least 2 points');

    expect(res.rows[1].n).toBe(0);
    expect(res.rows[1].error).toContain('No numeric readings');
  });

  it('calculates batch summary with best and worst uniformity', () => {
    const csv = [
      'Sample_ID, Target_nm, P1, P2, P3',
      'W1, 100, 100, 100.5, 99.5', // range = 1, mean = 100, halfRange% = 0.5% (best)
      'W2, 100, 100, 105, 95',     // range = 10, mean = 100, halfRange% = 5% (worst)
      'W3, 100, 100, 102, 98',     // range = 4, mean = 100, halfRange% = 2%
      'W_Bad, 100, 100',           // invalid, n < 2
    ].join('\n');

    const res = processFilmUniformityBatch(csv);
    expect(res.summary.totalSamples).toBe(4);
    expect(res.summary.validSamples).toBe(3);
    expect(res.summary.averageMean).toBeCloseTo(100.0, 5);
    expect(res.summary.bestUniformity).toEqual({
      sampleId: 'W1',
      halfRangePercent: 0.5,
    });
    expect(res.summary.worstUniformity).toEqual({
      sampleId: 'W2',
      halfRangePercent: 5.0,
    });
  });

  it('exports valid CSV and provides sample CSV', () => {
    const sample = getFilmUniformitySampleCsv();
    expect(sample).toContain('Sample_ID');
    const res = processFilmUniformityBatch(sample);
    expect(res.rows.length).toBeGreaterThan(0);

    const exported = exportFilmUniformityBatchCsv(res.rows);
    expect(exported).toContain('Sample_ID,N,Target_nm,Mean_nm');
    expect(exported).toContain('Wafer_01');
  });

  it('handles empty input gracefully', () => {
    const res = processFilmUniformityBatch('');
    expect(res.rows).toEqual([]);
    expect(res.summary.totalSamples).toBe(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});

describe('CD Uniformity Batch Processing', () => {
  it('processes CD batch with single string or multiple columns', () => {
    const csv = [
      'Sample_ID, Target_nm, CD1, CD2, CD3',
      'Die_1, 40.0, 40.0, 41.0, 39.0',
    ].join('\n');

    const res = processCdUniformityBatch(csv);
    expect(res.rows).toHaveLength(1);
    const r = res.rows[0];
    expect(r.sampleId).toBe('Die_1');
    expect(r.n).toBe(3);
    expect(r.mean).toBeCloseTo(40.0, 5);
    expect(r.min).toBe(39.0);
    expect(r.max).toBe(41.0);
    expect(r.range).toBe(2.0);
    // sigma = 1.0, threeSigma = 3.0
    expect(r.sigma).toBeCloseTo(1.0, 5);
    expect(r.threeSigma).toBeCloseTo(3.0, 5);
    // cvPercent = sigma / mean * 100 = 1 / 40 * 100 = 2.5%
    expect(r.cvPercent).toBeCloseTo(2.5, 5);
    // halfRangePercent = 2 / 80 * 100 = 2.5%
    expect(r.halfRangePercent).toBeCloseTo(2.5, 5);
    // targetDelta = 40.0 - 40.0 = 0
    expect(r.targetDelta).toBeCloseTo(0.0, 5);
  });

  it('calculates CD summary correctly identifying best and worst 3-sigma', () => {
    const csv = [
      'Sample_ID, Target_nm, CD1, CD2, CD3',
      'Die_Tight, 40.0, 40.0, 40.2, 39.8', // sigma ~ 0.2, 3sigma ~ 0.6 (best)
      'Die_Loose, 40.0, 40.0, 42.0, 38.0', // sigma = 2.0, 3sigma = 6.0 (worst)
    ].join('\n');

    const res = processCdUniformityBatch(csv);
    expect(res.summary.totalSamples).toBe(2);
    expect(res.summary.validSamples).toBe(2);
    expect(res.summary.bestCdUniformity?.sampleId).toBe('Die_Tight');
    expect(res.summary.worstCdUniformity?.sampleId).toBe('Die_Loose');
    expect(res.summary.averageThreeSigma).toBeCloseTo((res.rows[0].threeSigma! + res.rows[1].threeSigma!) / 2, 5);
  });

  it('handles CD edge case when n < 2', () => {
    const csv = 'Sample_ID, Target_nm, CD1\nDie_Solo, 40.0, 40.1';
    const res = processCdUniformityBatch(csv);
    expect(res.rows[0].error).toContain('At least 2 points');
    expect(res.rows[0].sigma).toBeNull();
    expect(res.rows[0].cvPercent).toBeNull();
  });

  it('exports CD uniformity CSV and verifies sample CSV', () => {
    const sample = getCdUniformitySampleCsv();
    const res = processCdUniformityBatch(sample);
    expect(res.summary.validSamples).toBeGreaterThan(0);
    const exported = exportCdUniformityBatchCsv(res.rows);
    expect(exported).toContain('CV_Percent,HalfRange_Percent');
    expect(exported).toContain('Field_A');
  });
});

describe('Arrhenius Extrapolation Batch Processing', () => {
  it('extracts activation energy, prefactor, and extrapolates rate correctly', () => {
    // Exact Arrhenius formula test:
    // Rate = A * exp(-Ea / (k * T))
    // Suppose Ea = 1.0 eV, A = 100
    const k = BOLTZMANN_EV_PER_K;
    const t1C = 1000;
    const t2C = 1100;
    const t1K = celsiusToKelvin(t1C);
    const t2K = celsiusToKelvin(t2C);
    const eaExpected = 1.0;
    const aExpected = 100;

    const rate1 = aExpected * Math.exp(-eaExpected / (k * t1K));
    const rate2 = aExpected * Math.exp(-eaExpected / (k * t2K));
    const tExtrapC = 1200;
    const tExtrapK = celsiusToKelvin(tExtrapC);
    const expectedExtrapRate = aExpected * Math.exp(-eaExpected / (k * tExtrapK));

    const csv = [
      'Sample_ID, T1_C, Rate1, T2_C, Rate2, Extrapolate_T_C',
      `Test_Reaction, ${t1C}, ${rate1}, ${t2C}, ${rate2}, ${tExtrapC}`,
    ].join('\n');

    const res = processArrheniusBatch(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);

    const row = res.rows[0];
    expect(row.sampleId).toBe('Test_Reaction');
    expect(row.activationEnergyEv).toBeCloseTo(eaExpected, 8);
    expect(row.prefactorA).toBeCloseTo(aExpected, 6);
    expect(row.extrapolatedRate).toBeCloseTo(expectedExtrapRate, 10);
    expect(row.error).toBeNull();
  });

  it('handles optional extrapolate temperature when omitted', () => {
    const csv = [
      'Sample_ID, T1_C, Rate1, T2_C, Rate2, Extrapolate_T_C',
      'No_Extrap, 900, 1e-4, 1000, 1e-3, ',
    ].join('\n');

    const res = processArrheniusBatch(csv);
    expect(res.rows[0].activationEnergyEv).not.toBeNull();
    expect(res.rows[0].extrapolateTC).toBeNull();
    expect(res.rows[0].extrapolatedRate).toBeNull();
    expect(res.rows[0].error).toBeNull();
  });

  it('validates invalid temperatures, negative rates, and equal temperatures', () => {
    const csv = [
      'Sample_ID, T1_C, Rate1, T2_C, Rate2, Extrapolate_T_C',
      'Equal_T, 500, 1e-3, 500, 2e-3, 600',       // T1 == T2
      'Negative_Rate, 500, -1e-3, 600, 1e-3, 700', // Rate1 <= 0
      'Below_Zero, -280, 1e-3, 500, 2e-3, 600',    // T1 <= -273.15
      'Invalid_Extrap, 500, 1e-3, 600, 2e-3, -300', // Extrap <= -273.15
    ].join('\n');

    const res = processArrheniusBatch(csv);
    expect(res.rows).toHaveLength(4);
    expect(res.rows[0].error).toContain('distinct');
    expect(res.rows[1].error).toContain('Rate1 must be > 0');
    expect(res.rows[2].error).toContain('T1 must be > -273.15');
    expect(res.rows[3].error).toContain('Extrapolate_T_C must be > -273.15');
    expect(res.summary.validSamples).toBe(0);
  });

  it('calculates Arrhenius batch summary correctly (min/max Ea)', () => {
    const k = BOLTZMANN_EV_PER_K;
    const calcRates = (ea: number) => {
      const r1 = Math.exp(-ea / (k * celsiusToKelvin(500)));
      const r2 = Math.exp(-ea / (k * celsiusToKelvin(600)));
      return { r1, r2 };
    };

    const s1 = calcRates(0.8);
    const s2 = calcRates(1.5);
    const s3 = calcRates(2.2);

    const csv = [
      'Sample_ID, T1_C, Rate1, T2_C, Rate2',
      `Process_LowEa, 500, ${s1.r1}, 600, ${s1.r2}`,
      `Process_MidEa, 500, ${s2.r1}, 600, ${s2.r2}`,
      `Process_HighEa, 500, ${s3.r1}, 600, ${s3.r2}`,
    ].join('\n');

    const res = processArrheniusBatch(csv);
    expect(res.summary.totalSamples).toBe(3);
    expect(res.summary.validSamples).toBe(3);
    expect(res.summary.averageEa).toBeCloseTo((0.8 + 1.5 + 2.2) / 3, 5);
    expect(res.summary.minEa?.sampleId).toBe('Process_LowEa');
    expect(res.summary.minEa?.eaEv).toBeCloseTo(0.8, 5);
    expect(res.summary.maxEa?.sampleId).toBe('Process_HighEa');
    expect(res.summary.maxEa?.eaEv).toBeCloseTo(2.2, 5);
  });

  it('exports Arrhenius CSV and verifies sample CSV', () => {
    const sample = getArrheniusSampleCsv();
    const res = processArrheniusBatch(sample);
    expect(res.rows.length).toBeGreaterThan(0);
    const exported = exportArrheniusBatchCsv(res.rows);
    expect(exported).toContain('Ea_eV,Prefactor_A,Extrapolated_Rate');
    expect(exported).toContain('Boron_Diff');
  });
});
