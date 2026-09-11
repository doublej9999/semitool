import { describe, expect, it } from 'vitest';
import {
  clopperPearsonInterval,
  incompleteBeta,
  inverseIncompleteBeta,
  inverseNormalCdf,
  sampleSizeForHalfWidth,
  validateIntervalInputs,
  validateSampleSizeInputs,
  wilsonInterval,
  zForConfidence,
} from './confidence';

describe('zForConfidence', () => {
  it('matches the standard two-sided z values', () => {
    expect(zForConfidence(0.8)).toBeCloseTo(1.2815515655, 8);
    expect(zForConfidence(0.9)).toBeCloseTo(1.644853627, 8);
    expect(zForConfidence(0.95)).toBeCloseTo(1.9599639845, 8);
    expect(zForConfidence(0.99)).toBeCloseTo(2.5758293035, 8);
    expect(zForConfidence(0.999)).toBeCloseTo(3.2905267315, 8);
  });

  it('inverts the normal CDF', () => {
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.9599639845, 8);
    expect(inverseNormalCdf(0.5)).toBeCloseTo(0, 10);
    expect(inverseNormalCdf(0.025)).toBeCloseTo(-1.9599639845, 8);
  });
});

describe('incompleteBeta', () => {
  it('reduces to x for a = b = 1', () => {
    for (const x of [0.1, 0.37, 0.9]) expect(incompleteBeta(1, 1, x)).toBeCloseTo(x, 12);
  });

  it('is inverted by inverseIncompleteBeta', () => {
    for (const [a, b] of [[2, 3], [50, 51], [1, 10]] as const) {
      const x = inverseIncompleteBeta(0.4, a, b);
      expect(incompleteBeta(a, b, x)).toBeCloseTo(0.4, 9);
    }
  });
});

describe('wilsonInterval', () => {
  it('matches the published 50/100 95% interval', () => {
    const { low, high } = wilsonInterval(50, 100, 0.95);
    expect(low).toBeCloseTo(0.4038, 4);
    expect(high).toBeCloseTo(0.5962, 4);
  });

  it('is symmetric around the estimate for a balanced sample', () => {
    const { low, high } = wilsonInterval(50, 100, 0.95);
    expect((low + high) / 2).toBeCloseTo(0.5, 12);
  });

  it('stays inside [0, 1] for extreme yields', () => {
    const none = wilsonInterval(0, 10, 0.95);
    const all = wilsonInterval(10, 10, 0.95);
    expect(none.low).toBe(0);
    expect(none.high).toBeGreaterThan(0);
    expect(none.high).toBeLessThan(1);
    expect(all.high).toBe(1);
    expect(all.low).toBeGreaterThan(0);
  });

  it('narrows as the sample grows', () => {
    const small = wilsonInterval(500, 1000, 0.95);
    const large = wilsonInterval(5000, 10000, 0.95);
    expect(large.high - large.low).toBeLessThan(small.high - small.low);
  });
});

describe('clopperPearsonInterval', () => {
  it('matches the published 50/100 95% interval', () => {
    const { low, high } = clopperPearsonInterval(50, 100, 0.95);
    expect(low).toBeCloseTo(0.3983, 4);
    expect(high).toBeCloseTo(0.6017, 4);
  });

  it('returns [0, 1 - (alpha/2)^(1/n)] for zero passes', () => {
    const { low, high } = clopperPearsonInterval(0, 10, 0.95);
    expect(low).toBe(0);
    expect(high).toBeCloseTo(0.30850, 5);
  });

  it('returns [(alpha/2)^(1/n), 1] for all passes', () => {
    const { low, high } = clopperPearsonInterval(10, 10, 0.95);
    expect(low).toBeCloseTo(0.69150, 5);
    expect(high).toBe(1);
  });

  it('is wider than the Wilson interval', () => {
    const cp = clopperPearsonInterval(697, 720, 0.95);
    const w = wilsonInterval(697, 720, 0.95);
    expect(cp.high - cp.low).toBeGreaterThan(w.high - w.low);
    expect(cp.low).toBeLessThan(w.low);
    expect(cp.high).toBeGreaterThan(w.high);
  });

  it('brackets the point estimate', () => {
    const { low, high } = clopperPearsonInterval(697, 720, 0.95);
    expect(low).toBeLessThan(697 / 720);
    expect(high).toBeGreaterThan(697 / 720);
  });
});

describe('sampleSizeForHalfWidth', () => {
  it('reproduces the textbook 385 for 5 points at 95% with p = 0.5', () => {
    expect(sampleSizeForHalfWidth(0.5, 0.05, 0.95)).toBe(385);
  });

  it('needs fewer units for a smaller expected yield or a looser target', () => {
    expect(sampleSizeForHalfWidth(0.9, 0.05, 0.95)).toBe(139);
    expect(sampleSizeForHalfWidth(0.5, 0.1, 0.95)).toBe(97);
    expect(sampleSizeForHalfWidth(0.5, 0.05, 0.99)).toBe(664);
  });
});

describe('validation', () => {
  it('accepts well-formed interval inputs', () => {
    expect(validateIntervalInputs(697, 720, 0.95)).toEqual([]);
  });

  it('flags bad interval inputs', () => {
    expect(validateIntervalInputs(5, 4, 0.95)).toHaveLength(1);
    expect(validateIntervalInputs(0, 0, 0.95)).toHaveLength(1);
    expect(validateIntervalInputs(0, 10, 1.5)).toHaveLength(1);
  });

  it('flags bad sample-size inputs', () => {
    expect(validateSampleSizeInputs(0.9, 0.05, 0.95)).toEqual([]);
    expect(validateSampleSizeInputs(0, 0.05, 0.95)).toHaveLength(1);
    expect(validateSampleSizeInputs(0.9, 0, 0.95)).toHaveLength(1);
    expect(validateSampleSizeInputs(0.9, 0.05, 0)).toHaveLength(1);
  });
});
