import { describe, expect, it } from 'vitest';
import { calculateDieCost, type DieCostSuccess } from './die-cost';

const BASE = { waferCost: 1000, grossDie: 720, goodDie: 697 };

function expectSuccess(input: Parameters<typeof calculateDieCost>[0]): DieCostSuccess {
  const result = calculateDieCost(input);
  if (!result.ok) throw new Error(`expected success, got: ${result.errors.join('; ')}`);
  return result;
}

describe('calculateDieCost', () => {
  it('derives cost per gross die, cost per good die and scrap from the inputs', () => {
    const result = expectSuccess(BASE);

    expect(result.yieldPercent).toBeCloseTo((697 / 720) * 100, 9);
    expect(result.costPerGrossDie).toBeCloseTo(1000 / 720, 9);
    expect(result.costPerGoodDie).toBeCloseTo(1000 / 697, 9);
    expect(result.scrapCostPerWafer).toBeCloseTo((1000 * 23) / 720, 9);
    expect(result.costMultiplier).toBeCloseTo(720 / 697, 9);
  });

  it('keeps cost per good die above cost per gross die by the 1 / yield factor', () => {
    const result = expectSuccess(BASE);

    expect(result.costPerGoodDie / result.costPerGrossDie).toBeCloseTo(result.costMultiplier, 9);
    expect(result.costPerGoodDiePremium).toBeCloseTo(result.costPerGoodDie - result.costPerGrossDie, 12);
  });

  it('adds an optional per-wafer cost before dividing', () => {
    const result = expectSuccess({ ...BASE, extraCostPerWafer: 200 });

    expect(result.totalWaferCost).toBe(1200);
    expect(result.costPerGoodDie).toBeCloseTo(1200 / 697, 9);
  });

  it('treats a missing additional cost as zero', () => {
    expect(expectSuccess(BASE).totalWaferCost).toBe(expectSuccess({ ...BASE, extraCostPerWafer: 0 }).totalWaferCost);
  });

  it('reports skipped die as the gross minus good difference', () => {
    const result = expectSuccess({ waferCost: 500, grossDie: 100, goodDie: 60 });

    expect(result.unclassifiedDie).toBe(40);
    expect(result.costPerGoodDie).toBeCloseTo(500 / 60, 9);
  });

  it('rejects inputs that cannot produce a finite cost per good die', () => {
    for (const input of [
      { ...BASE, goodDie: 0 },
      { ...BASE, goodDie: 800 },
      { ...BASE, grossDie: 0 },
      { ...BASE, waferCost: 0 },
      { ...BASE, extraCostPerWafer: -1 },
    ]) {
      expect(calculateDieCost(input).ok, JSON.stringify(input)).toBe(false);
    }
  });

  it('lists every violated input at once', () => {
    const result = calculateDieCost({ waferCost: -1, grossDie: 0, goodDie: -5 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
