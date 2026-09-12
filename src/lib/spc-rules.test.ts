import { describe, it, expect } from 'vitest';
import {
  calculateSpcLimits,
  calculateProcessCapability,
  evaluateNelsonRules,
  generateSpcControlChartSvg,
} from './spc-rules';

describe('WECO & Nelson 8 SPC Rules Engine', () => {
  it('calculates SPC limits and process capability correctly', () => {
    const data = [100, 102, 98, 101, 99, 100, 103, 97, 100, 100];
    const limits = calculateSpcLimits(data, { usl: 110, lsl: 90, target: 100 });

    expect(limits.mean).toBeCloseTo(100, 1);
    expect(limits.sigma).toBeGreaterThan(1);
    expect(limits.ucl).toBeCloseTo(limits.mean + 3 * limits.sigma, 2);
    expect(limits.lcl).toBeCloseTo(limits.mean - 3 * limits.sigma, 2);

    const cap = calculateProcessCapability(limits.mean, limits.sigma, limits.usl, limits.lsl);
    expect(cap.cp).toBeGreaterThan(1.0);
    expect(cap.cpk).toBeGreaterThan(1.0);
    expect(['Capable', 'In Control', 'Marginal']).toContain(cap.status);
  });

  it('detects Rule 1: Point outside 3-sigma outlier', () => {
    // 20 normal points around 100, and one massive spike at 150
    const normal = Array(20).fill(100).map((v, i) => v + (i % 2 === 0 ? 1 : -1));
    const data = [...normal, 150];
    const res = evaluateNelsonRules(data);

    expect(res.violationsByRule[1]).toBeGreaterThanOrEqual(1);
    const v1 = res.violations.find((v) => v.ruleNumber === 1);
    expect(v1).toBeDefined();
    expect(v1?.severity).toBe('Critical');
  });

  it('detects Rule 2: Nine consecutive points on same side of center line', () => {
    // Mean is 100. Provide 10 points at 105 (> mean)
    const data = [100, 95, 105, 95, 105, 95, 105, 95, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105];
    const res = evaluateNelsonRules(data, { mean: 100, sigma: 5 });

    expect(res.violationsByRule[2]).toBeGreaterThanOrEqual(1);
    const v2 = res.violations.find((v) => v.ruleNumber === 2);
    expect(v2).toBeDefined();
    expect(v2?.description).toContain('side of the center line');
  });

  it('detects Rule 3: Six consecutive increasing or decreasing points (Trend)', () => {
    const data = [10, 12, 14, 16, 18, 20, 22]; // 7 increasing
    const res = evaluateNelsonRules(data);

    expect(res.violationsByRule[3]).toBeGreaterThanOrEqual(1);
  });

  it('detects Rule 4: Fourteen consecutive alternating points', () => {
    // Alternating up and down 15 times
    const data = [10, 12, 10, 12, 10, 12, 10, 12, 10, 12, 10, 12, 10, 12, 10, 12];
    const res = evaluateNelsonRules(data);

    expect(res.violationsByRule[4]).toBeGreaterThanOrEqual(1);
  });

  it('detects Rule 5: 2 of 3 points beyond 2 sigma', () => {
    // mean=100, sigma=10 -> 2-sigma is 120
    const data = [100, 100, 100, 122, 115, 124];
    const res = evaluateNelsonRules(data, { mean: 100, sigma: 10 });

    expect(res.violationsByRule[5]).toBeGreaterThanOrEqual(1);
  });

  it('detects Rule 6: 4 of 5 points beyond 1 sigma', () => {
    // mean=100, sigma=10 -> 1-sigma is 110
    const data = [100, 100, 112, 114, 105, 113, 115];
    const res = evaluateNelsonRules(data, { mean: 100, sigma: 10 });

    expect(res.violationsByRule[6]).toBeGreaterThanOrEqual(1);
  });

  it('detects Rule 7: 15 points in Zone C (Stratification)', () => {
    // mean=100, sigma=10 -> within 90-110 for 16 points
    const data = Array(16).fill(101);
    const res = evaluateNelsonRules(data, { mean: 100, sigma: 10 });

    expect(res.violationsByRule[7]).toBeGreaterThanOrEqual(1);
  });

  it('detects Rule 8: 8 consecutive points outside Zone C (Mixture)', () => {
    // mean=100, sigma=10 -> outside 90-110 (e.g. 115 or 85) for 9 points
    const data = [115, 85, 116, 84, 115, 85, 116, 84, 115];
    const res = evaluateNelsonRules(data, { mean: 100, sigma: 10 });

    expect(res.violationsByRule[8]).toBeGreaterThanOrEqual(1);
  });

  it('generates offline printable SVG control chart', () => {
    const data = [100, 102, 99, 101, 150, 100];
    const res = evaluateNelsonRules(data);
    const svg = generateSpcControlChartSvg(res, { title: 'Fab Etch CD SPC' });

    expect(svg).toContain('<svg');
    expect(svg).toContain('Fab Etch CD SPC');
    expect(svg).toContain('UCL');
    expect(svg).toContain('LCL');
    expect(svg).toContain('circle');
    expect(svg).toContain('polyline');
  });
});
