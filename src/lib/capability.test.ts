import { describe, expect, it } from 'vitest';
import { calculateCapability, erfc, normalCdf, type CapabilitySuccess } from './capability';

function expectSuccess(input: Parameters<typeof calculateCapability>[0]): CapabilitySuccess {
  const result = calculateCapability(input);
  if (!result.ok) throw new Error(`expected success, got: ${result.errors.join('; ')}`);
  return result;
}

describe('normalCdf', () => {
  it('returns 0.5 at the mean and the standard tail values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 12);
    expect(normalCdf(1.959963984540054)).toBeCloseTo(0.975, 9);
    expect(normalCdf(-1.959963984540054)).toBeCloseTo(0.025, 9);
    expect(normalCdf(2)).toBeCloseTo(0.9772498680518208, 12);
  });

  it('is symmetric and spans the full range', () => {
    for (const z of [0.3, 1, 2.5, 4]) {
      expect(normalCdf(z) + normalCdf(-z)).toBeCloseTo(1, 12);
    }
    expect(normalCdf(-40)).toBeCloseTo(0, 15);
    expect(normalCdf(40)).toBeCloseTo(1, 15);
  });

  it('erfc matches the known values', () => {
    expect(erfc(0)).toBeCloseTo(1, 14);
    expect(erfc(1)).toBeCloseTo(0.15729920705028513, 12);
  });
});

describe('calculateCapability', () => {
  const both = { lowerLimit: 9, upperLimit: 11, mean: 10, sigma: 0.5 };

  it('computes Cp, Cpk and the out-of-spec fraction from both limits', () => {
    const result = expectSuccess(both);

    expect(result.cp).toBeCloseTo(2 / 3, 12);
    expect(result.cpu).toBeCloseTo(2 / 3, 12);
    expect(result.cpl).toBeCloseTo(2 / 3, 12);
    expect(result.cpk).toBeCloseTo(2 / 3, 12);
    expect(result.zUpper).toBeCloseTo(2, 12);
    expect(result.zLower).toBeCloseTo(2, 12);
    expect(result.abovePercent).toBeCloseTo(2.2750131948179214, 9);
    expect(result.belowPercent).toBeCloseTo(2.2750131948179214, 9);
    expect(result.outOfSpecPpm).toBeCloseTo(45500.26389635843, 6);
    expect(result.sigmaLevel).toBeCloseTo(2, 12);
  });

  it('takes Cpk from the worse side when the mean is off-centre', () => {
    const result = expectSuccess({ lowerLimit: 9, upperLimit: 11, mean: 10.5, sigma: 0.5 });

    expect(result.cp).toBeCloseTo(2 / 3, 12);
    expect(result.cpl).toBeCloseTo(1, 12);
    expect(result.cpu).toBeCloseTo(1 / 3, 12);
    expect(result.cpk).toBeCloseTo(1 / 3, 12);
    expect(result.outOfSpecPpm).toBeCloseTo(((1 - normalCdf(1)) + normalCdf(-3)) * 1e6, 3);
  });

  it('handles a one-sided upper specification (no Cp, no lower tail)', () => {
    const result = expectSuccess({ lowerLimit: null, upperLimit: 11, mean: 10, sigma: 0.5 });

    expect(result.cp).toBeNull();
    expect(result.cpl).toBeNull();
    expect(result.cpu).toBeCloseTo(2 / 3, 12);
    expect(result.cpk).toBeCloseTo(2 / 3, 12);
    expect(result.belowPercent).toBe(0);
    expect(result.outOfSpecPpm).toBeCloseTo(result.abovePercent * 1e4, 9);
  });

  it('handles a one-sided lower specification', () => {
    const result = expectSuccess({ lowerLimit: 9, upperLimit: null, mean: 9.2, sigma: 0.5 });

    expect(result.cp).toBeNull();
    expect(result.cpu).toBeNull();
    expect(result.cpl).toBeCloseTo(0.2 / 1.5, 12);
    expect(result.abovePercent).toBe(0);
    expect(result.cpk).toBeCloseTo(result.cpl as number, 12);
  });

  it('lets Cpk go negative when the mean sits outside the limits', () => {
    const result = expectSuccess({ lowerLimit: 9, upperLimit: 11, mean: 11.3, sigma: 0.5 });

    expect(result.cpk).toBeLessThan(0);
    expect(result.outOfSpecPpm).toBeGreaterThan(500000);
  });

  it('rejects uncomputable inputs', () => {
    for (const input of [
      { ...both, sigma: 0 },
      { ...both, sigma: -1 },
      { lowerLimit: null, upperLimit: null, mean: 10, sigma: 1 },
      { ...both, lowerLimit: 11 },
      { ...both, upperLimit: 9 },
      { ...both, mean: Number.NaN },
    ]) {
      expect(calculateCapability(input).ok, JSON.stringify(input)).toBe(false);
    }
  });
});
