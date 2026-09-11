import { describe, expect, it } from 'vitest';
import { calculateThroughput, type ThroughputSuccess } from './throughput';

const BASE = {
  processTimeMin: 2,
  chambers: 2,
  availabilityPercent: 90,
  performancePercent: 95,
  qualityPercent: 97,
};

function expectSuccess(input: Parameters<typeof calculateThroughput>[0]): ThroughputSuccess {
  const result = calculateThroughput(input);
  if (!result.ok) throw new Error(`expected success, got: ${result.errors.join('; ')}`);
  return result;
}

describe('calculateThroughput', () => {
  it('scales the ideal rate down by availability, performance and quality', () => {
    const result = expectSuccess(BASE);

    expect(result.theoreticalWph).toBeCloseTo(60, 12);
    expect(result.effectiveWph).toBeCloseTo(60 * 0.9 * 0.95, 12);
    expect(result.goodWph).toBeCloseTo(60 * 0.9 * 0.95 * 0.97, 12);
    expect(result.oee).toBeCloseTo(0.9 * 0.95 * 0.97, 12);
    expect(result.goodWafersPerDay).toBeCloseTo(result.goodWph * 24, 10);
  });

  it('gives the ideal rate when every factor is 100%', () => {
    const result = expectSuccess({
      ...BASE,
      availabilityPercent: 100,
      performancePercent: 100,
      qualityPercent: 100,
    });

    expect(result.effectiveWph).toBeCloseTo(60, 12);
    expect(result.goodWph).toBeCloseTo(60, 12);
    expect(result.oee).toBe(1);
  });

  it('scales linearly with the number of chambers', () => {
    const one = expectSuccess({ ...BASE, chambers: 1 });
    const four = expectSuccess({ ...BASE, chambers: 4 });
    expect(four.theoreticalWph / one.theoreticalWph).toBeCloseTo(4, 12);
  });

  it('halves the rate when the process time doubles', () => {
    const fast = expectSuccess({ ...BASE, processTimeMin: 1 });
    const slow = expectSuccess({ ...BASE, processTimeMin: 2 });
    expect(fast.theoreticalWph / slow.theoreticalWph).toBeCloseTo(2, 12);
  });

  it('rejects uncomputable inputs', () => {
    for (const input of [
      { ...BASE, processTimeMin: 0 },
      { ...BASE, processTimeMin: -1 },
      { ...BASE, chambers: 0 },
      { ...BASE, chambers: 1.5 },
      { ...BASE, availabilityPercent: 0 },
      { ...BASE, availabilityPercent: 101 },
      { ...BASE, performancePercent: -5 },
      { ...BASE, qualityPercent: 100.1 },
    ]) {
      expect(calculateThroughput(input).ok, JSON.stringify(input)).toBe(false);
    }
  });

  it('lists every violated input at once', () => {
    const result = calculateThroughput({ processTimeMin: 0, chambers: 0, availabilityPercent: 0, performancePercent: 0, qualityPercent: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});
