
import { describe, expect, it } from 'vitest';
import {
  dppmFromFit,
  fitFromDppm,
  fractionFailed,
  reliability,
  timeToFractionFailures,
  validateLifeTest,
} from './reliability';

describe('reliability', () => {
  const base = { failures: 10, devices: 1000, hours: 1000 };

  it('computes the failure rate, FIT and MTBF', () => {
    const r = reliability(base);
    expect(r.deviceHours).toBe(1e6);
    expect(r.failureRate).toBeCloseTo(1e-5, 12);
    expect(r.fit).toBeCloseTo(10000, 6);
    expect(r.mtbfHours).toBeCloseTo(1e5, 4);
    expect(r.mtbfYears).toBeCloseTo(1e5 / 8760, 6);
  });

  it('gives an infinite MTBF when nothing failed', () => {
    const r = reliability({ failures: 0, devices: 500, hours: 2000 });
    expect(r.failureRate).toBe(0);
    expect(r.fit).toBe(0);
    expect(r.mtbfHours).toBe(Infinity);
  });

  it('converts FIT to DPPM over a burn-in window', () => {
    expect(dppmFromFit(10000, 1000)).toBeCloseTo(9950.16625, 3);
    expect(dppmFromFit(100, 1000)).toBeCloseTo(99.9950003, 4);
  });

  it('round-trips DPPM back to FIT', () => {
    expect(fitFromDppm(9950.166250831893, 1000)).toBeCloseTo(10000, 4);
  });

  it('rejects a DPPM of a million or more', () => {
    expect(() => fitFromDppm(1e6, 1000)).toThrow(/DPPM/);
  });

  it('finds the time to a failing fraction', () => {
    const rate = 1e-5;
    expect(timeToFractionFailures(rate, 0.01)).toBeCloseTo(1005.0336, 3);
    expect(timeToFractionFailures(rate, 0.1)).toBeCloseTo(10536.0516, 3);
  });

  it('keeps precision for small rates', () => {
    expect(fractionFailed(10, 8760)).toBeCloseTo(8.7596163232e-5, 12);
  });

  it('validates the inputs', () => {
    expect(validateLifeTest(base)).toBeNull();
    expect(validateLifeTest({ failures: 1, devices: 0, hours: 10 })).toMatch(/devices/);
    expect(validateLifeTest({ failures: 1, devices: 10, hours: 0 })).toMatch(/duration/);
    expect(validateLifeTest({ failures: -1, devices: 10, hours: 10 })).toMatch(/negative/);
    expect(validateLifeTest({ failures: 11, devices: 10, hours: 10 })).toMatch(/More failures/);
  });
});
