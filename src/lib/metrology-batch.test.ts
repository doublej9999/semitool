import { describe, it, expect } from 'vitest';
import {
  computeMetrologyStatistics,
  parseMetrologyCsv,
  formatSubgroupsForSpc,
  buildSpcCalculatorUrl,
  buildCapabilityCalculatorUrl,
  generateFabSampleCsv,
  calculateQuantile,
} from './metrology-batch';

describe('calculateQuantile', () => {
  it('computes exact quantiles for ordered data', () => {
    const nums = [10, 20, 30, 40, 50];
    expect(calculateQuantile(nums, 0)).toBe(10);
    expect(calculateQuantile(nums, 0.5)).toBe(30);
    expect(calculateQuantile(nums, 1)).toBe(50);
    expect(calculateQuantile(nums, 0.25)).toBe(20);
    expect(calculateQuantile(nums, 0.75)).toBe(40);
  });
});

describe('computeMetrologyStatistics', () => {
  it('computes mean, sample stdDev, median and IQR correctly', () => {
    const data = [10, 12, 14, 16, 18];
    const stats = computeMetrologyStatistics(data, 'tukey');
    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(14);
    expect(stats.median).toBe(14);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(18);
    expect(stats.range).toBe(8);
    expect(stats.q1).toBe(12);
    expect(stats.q3).toBe(16);
    expect(stats.iqr).toBe(4);
    expect(stats.outliers).toEqual([]);
  });

  it('detects outliers using Tukey IQR fence rule', () => {
    const data = [10, 10.2, 10.1, 9.9, 10.3, 10.0, 9.8, 10.1, 25.0]; // 25.0 is an extreme spike
    const stats = computeMetrologyStatistics(data, 'tukey');
    expect(stats.outliers).toContain(25.0);
    expect(stats.cleanMean).toBeCloseTo(10.05, 1);
    expect(stats.cleanStdDev).toBeLessThan(0.5);
  });

  it('detects outliers using 3-sigma rule', () => {
    const normalish = [
      100, 100, 101, 99, 100, 101, 100, 99, 100, 101,
      100, 99, 100, 101, 99, 100, 100, 101, 99, 200,
    ];
    const stats = computeMetrologyStatistics(normalish, 'three_sigma');
    expect(stats.outliers).toContain(200);
  });
});

describe('parseMetrologyCsv', () => {
  it('parses Subgroup Matrix format with header comments', () => {
    const csv = `
      # Target=28.0, LSL=26.5, USL=29.5, Unit=nm
      Wafer, Site1, Site2, Site3, Site4, Site5
      W01, 28.1, 27.9, 28.0, 28.2, 27.8
      W02, 28.0, 28.3, 27.7, 28.1, 28.0
    `;
    const dataset = parseMetrologyCsv(csv);
    expect(dataset.format).toBe('subgroup_matrix');
    expect(dataset.subgroups.length).toBe(2);
    expect(dataset.subgroupSize).toBe(5);
    expect(dataset.limits.target).toBe(28.0);
    expect(dataset.limits.lsl).toBe(26.5);
    expect(dataset.limits.usl).toBe(29.5);
    expect(dataset.limits.unit).toBe('nm');
    expect(dataset.statistics.count).toBe(10);
    expect(dataset.statistics.mean).toBeCloseTo(28.01, 1);
  });

  it('parses Long Table format with Wafer and Site columns', () => {
    const csv = `
      Wafer,Site,Thickness
      W01,Center,100.2
      W01,North,99.8
      W01,South,100.5
      W02,Center,101.0
      W02,North,100.8
      W02,South,101.2
    `;
    const dataset = parseMetrologyCsv(csv);
    expect(dataset.format).toBe('long_table');
    expect(dataset.subgroups.length).toBe(2);
    expect(dataset.subgroups[0].length).toBe(3);
    expect(dataset.statistics.count).toBe(6);
    expect(dataset.statistics.min).toBe(99.8);
    expect(dataset.statistics.max).toBe(101.2);
  });

  it('parses raw unstructured number streams', () => {
    const text = '10.5 10.6 10.4 10.7 10.5 10.8 10.9 10.3 10.4 10.6';
    const dataset = parseMetrologyCsv(text, { subgroupSize: 5 });
    expect(dataset.format).toBe('number_stream');
    expect(dataset.subgroups.length).toBe(2);
    expect(dataset.subgroups[0]).toHaveLength(5);
    expect(dataset.statistics.count).toBe(10);
  });

  it('formats subgroups for SPC text input', () => {
    const subgroups = [
      [10.1, 10.2, 10.0],
      [10.3, 10.1, 10.2],
    ];
    const spcText = formatSubgroupsForSpc(subgroups);
    expect(spcText).toBe('10.1, 10.2, 10\n10.3, 10.1, 10.2');
  });

  it('builds SPC navigation URL with encoded subgroups', () => {
    const dataset = parseMetrologyCsv('10.1, 10.2\n10.3, 10.4');
    const url = buildSpcCalculatorUrl(dataset);
    expect(url).toContain('/tools/spc-control-chart-calculator?');
    expect(url).toContain('subgroups=');
  });

  it('builds Capability Monte Carlo URL with process limits', () => {
    const dataset = parseMetrologyCsv('# Target=50, LSL=45, USL=55, Unit=nm\n49, 50, 51\n50, 52, 48');
    const url = buildCapabilityCalculatorUrl(dataset);
    expect(url).toContain('/tools/process-capability-calculator?');
    expect(url).toContain('mean=50');
    expect(url).toContain('lower=45');
    expect(url).toContain('upper=55');
    expect(url).toContain('unit=nm');
  });

  it('generates fab sample CSV presets without crashing', () => {
    const gateCd = generateFabSampleCsv('gate_cd');
    expect(gateCd).toContain('Gate Poly-Si Etch');
    const parsedGate = parseMetrologyCsv(gateCd);
    expect(parsedGate.subgroups.length).toBe(20);
    expect(parsedGate.limits.target).toBe(28.0);

    const oxide = generateFabSampleCsv('oxide_thickness');
    const parsedOxide = parseMetrologyCsv(oxide);
    expect(parsedOxide.subgroups.length).toBe(25);
    expect(parsedOxide.limits.target).toBe(100.0);

    const cmp = generateFabSampleCsv('cmp_erosion');
    const parsedCmp = parseMetrologyCsv(cmp);
    expect(parsedCmp.subgroups.length).toBe(16);

    const rs = generateFabSampleCsv('sheet_resistance');
    const parsedRs = parseMetrologyCsv(rs);
    expect(parsedRs.subgroups.length).toBe(18);
    expect(parsedRs.limits.unit).toBe('ohm/sq');
  });
});
