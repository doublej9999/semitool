
import { describe, expect, it } from 'vitest';
import { calculateEtch } from './etch';

describe('calculateEtch', () => {
  it('computes the etch rate from a before/after thickness pair', () => {
    const result = calculateEtch({
      beforeNm: 500,
      afterNm: 300,
      timeSeconds: 120,
      maskLossNm: 20,
      nominalTimeSeconds: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.removedNm).toBeCloseTo(200, 10);
    expect(result.rateNmPerMinute).toBeCloseTo(100, 10);
    expect(result.rateNmPerSecond).toBeCloseTo(1.6666666666666667, 10);
    expect(result.maskRateNmPerMinute).toBeCloseTo(10, 10);
    expect(result.selectivity).toBeCloseTo(10, 10);
    expect(result.remainingPercent).toBeCloseTo(60, 10);
    expect(result.overetchPercent).toBeNull();
  });

  it('computes the overetch when the nominal time is given', () => {
    const result = calculateEtch({
      beforeNm: 500,
      afterNm: 300,
      timeSeconds: 132,
      maskLossNm: null,
      nominalTimeSeconds: 120,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.overetchPercent).toBeCloseTo(10, 10);
    expect(result.selectivity).toBeNull();
  });

  it('treats zero mask loss as no measurement rather than infinite selectivity', () => {
    const result = calculateEtch({
      beforeNm: 500,
      afterNm: 300,
      timeSeconds: 120,
      maskLossNm: 0,
      nominalTimeSeconds: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selectivity).toBeNull();
    expect(result.maskRateNmPerMinute).toBeNull();
  });

  it('rejects a remaining thickness at or above the starting thickness', () => {
    const result = calculateEtch({
      beforeNm: 500,
      afterNm: 500,
      timeSeconds: 120,
      maskLossNm: null,
      nominalTimeSeconds: null,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('smaller than the starting thickness');
  });

  it('rejects a non-positive etch time', () => {
    const result = calculateEtch({
      beforeNm: 500,
      afterNm: 300,
      timeSeconds: 0,
      maskLossNm: null,
      nominalTimeSeconds: null,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('positive number of seconds');
  });
});
