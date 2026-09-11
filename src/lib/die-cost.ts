/**
 * Die cost from wafer cost and die counts.
 *
 * The arithmetic is deliberately simple and every number is derived from the
 * inputs the user supplies:
 *
 *   yield             = good die / gross die
 *   cost per die      = total wafer cost / gross die
 *   cost per good die = total wafer cost / good die
 *
 * `cost per good die` is the number that matters for quoting: scrapped die on a
 * wafer carry the cost of the whole wafer, so it is always greater than or equal
 * to the cost per gross die, by the factor 1 / yield.
 *
 * Currency is whatever the user enters; the tool labels it as ¥ but no exchange
 * rate or price list is applied.
 */

export interface DieCostInput {
  /** Currency per wafer. */
  waferCost: number;
  /** Die positions per wafer. */
  grossDie: number;
  /** Die that passed, used as the divisor for cost per good die. */
  goodDie: number;
  /** Optional additional per-wafer cost, e.g. test or packaging. */
  extraCostPerWafer?: number;
}

export interface DieCostSuccess {
  ok: true;
  yieldPercent: number;
  totalWaferCost: number;
  costPerGrossDie: number;
  costPerGoodDie: number;
  /** How much more a good die costs than a gross die position. */
  costPerGoodDiePremium: number;
  scrapCostPerWafer: number;
  /** Cost per good die divided by cost per gross die (= 1 / yield). */
  costMultiplier: number;
  unclassifiedDie: number;
}

export interface DieCostFailure {
  ok: false;
  errors: string[];
}

export type DieCostResult = DieCostSuccess | DieCostFailure;

export function calculateDieCost(input: DieCostInput): DieCostResult {
  const errors: string[] = [];
  const extraCostPerWafer = input.extraCostPerWafer ?? 0;

  if (!Number.isFinite(input.waferCost) || input.waferCost <= 0) {
    errors.push('Wafer cost must be greater than 0.');
  }
  if (!Number.isFinite(extraCostPerWafer) || extraCostPerWafer < 0) {
    errors.push('Additional cost per wafer cannot be negative.');
  }
  if (!Number.isFinite(input.grossDie) || input.grossDie <= 0) {
    errors.push('Gross die must be greater than 0.');
  }
  if (!Number.isFinite(input.goodDie) || input.goodDie <= 0) {
    errors.push('Good die must be greater than 0 to calculate a cost per good die.');
  }
  if (Number.isFinite(input.grossDie) && Number.isFinite(input.goodDie) && input.goodDie > input.grossDie) {
    errors.push('Good die cannot exceed gross die.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const totalWaferCost = input.waferCost + extraCostPerWafer;
  const yieldFraction = input.goodDie / input.grossDie;
  const costPerGrossDie = totalWaferCost / input.grossDie;
  const costPerGoodDie = totalWaferCost / input.goodDie;

  return {
    ok: true,
    yieldPercent: yieldFraction * 100,
    totalWaferCost,
    costPerGrossDie,
    costPerGoodDie,
    costPerGoodDiePremium: costPerGoodDie - costPerGrossDie,
    scrapCostPerWafer: totalWaferCost * (1 - yieldFraction),
    costMultiplier: 1 / yieldFraction,
    unclassifiedDie: Math.max(0, input.grossDie - input.goodDie),
  };
}
