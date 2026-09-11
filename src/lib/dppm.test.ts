
import { describe, expect, it } from 'vitest';
import { fromDppm, fromSigma, fromYieldFraction, fromYieldPercent, tailFraction } from './dppm';

describe('dppm', () => {
  it('converts a yield fraction to DPPM', () => {
    const r = fromYieldFraction(0.99865);
    expect(r.yieldPercent).toBeCloseTo(99.865, 6);
    expect(r.dppm).toBeCloseTo(1350, 3);
    expect(r.dpb).toBeCloseTo(1.35e6, 3);
    // 3 sigma is 0.99865010, so a yield of 0.99865 sits just under 3 sigma.
    expect(r.sigma).toBeCloseTo(2.9999769927, 6);
    expect(r.cpkEquivalent).toBeCloseTo(0.9999923309, 6);
  });

  it('converts a percent yield', () => {
    const r = fromYieldPercent(99);
    expect(r.yieldFraction).toBeCloseTo(0.99, 12);
    expect(r.dppm).toBeCloseTo(10000, 6);
    expect(r.sigma).toBeCloseTo(2.3263479, 5);
  });

  it('converts from DPPM', () => {
    const r = fromDppm(1350);
    expect(r.yieldFraction).toBeCloseTo(0.99865, 9);
    expect(r.sigma).toBeCloseTo(3, 4);
  });

  it('converts from a sigma level', () => {
    expect(fromSigma(3).dppm).toBeCloseTo(1349.8980316, 3);
    expect(fromSigma(2).dppm).toBeCloseTo(22750.1319, 3);
    expect(fromSigma(1.96).dppm).toBeCloseTo(24997.8951, 3);
  });

  it('reports the one-sided tail fraction', () => {
    expect(tailFraction(3)).toBeCloseTo(0.0013499, 6);
  });

  it('handles the degenerate ends', () => {
    expect(fromYieldFraction(1).dppm).toBe(0);
    expect(fromYieldFraction(1).sigma).toBeNull();
    expect(fromYieldFraction(0).dppm).toBe(1e6);
    expect(fromYieldFraction(0).cpkEquivalent).toBeNull();
    expect(fromYieldFraction(-1).dppm).toBe(1e6);
  });

  it('rejects an impossible DPPM', () => {
    expect(() => fromDppm(1e6 + 1)).toThrow(/DPPM/);
    expect(() => fromSigma(Infinity)).toThrow(/finite/);
  });
});
