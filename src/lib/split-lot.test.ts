import { describe, expect, it } from 'vitest';
import { analyzeSplitLot, type RecipeParameter, type SplitRecipe } from './split-lot';

describe('split-lot analysis engine', () => {
  const params: RecipeParameter[] = [
    { name: 'RF Power', unit: 'W', baseline: 500 },
    { name: 'Pressure', unit: 'mTorr', baseline: 25 },
    { name: 'CF4 Flow', unit: 'sccm', baseline: 80 },
  ];

  const splits: SplitRecipe[] = [
    {
      id: 'split-1',
      name: 'Split A (Power +20%)',
      wafers: '#01-#06',
      parameters: {
        'RF Power': 600,
        Pressure: 25,
        'CF4 Flow': 80,
      },
      targetResponse: 450, // Etch rate nm/min
    },
    {
      id: 'split-2',
      name: 'Split B (Pressure -20%)',
      wafers: '#07-#12',
      parameters: {
        'RF Power': 500,
        Pressure: 20,
        'CF4 Flow': 80,
      },
      targetResponse: 320,
    },
  ];

  it('calculates exact parameter deltas and percentage changes', () => {
    const analysis = analyzeSplitLot(params, splits, 380, 'nm/min');

    expect(analysis.metrics.length).toBe(3);
    const powerMetric = analysis.metrics.find((m) => m.paramName === 'RF Power')!;
    expect(powerMetric.baseline).toBe(500);
    expect(powerMetric.splits[0].value).toBe(600);
    expect(powerMetric.splits[0].delta).toBe(100);
    expect(powerMetric.splits[0].pctChange).toBe(20);

    const pressureMetric = analysis.metrics.find((m) => m.paramName === 'Pressure')!;
    expect(pressureMetric.splits[1].value).toBe(20);
    expect(pressureMetric.splits[1].delta).toBe(-5);
    expect(pressureMetric.splits[1].pctChange).toBe(-20);
  });

  it('computes target response comparisons against baseline', () => {
    const analysis = analyzeSplitLot(params, splits, 400, 'nm/min');
    expect(analysis.responseComparison).toBeDefined();
    expect(analysis.responseComparison!.length).toBe(2);

    const respA = analysis.responseComparison![0];
    expect(respA.response).toBe(450);
    expect(respA.delta).toBe(50);
    expect(respA.pctChange).toBe(12.5);

    expect(analysis.summary.splitCount).toBe(2);
    expect(analysis.summary.maxDeltaPct).toBe(20);
    expect(analysis.summary.isSignificantVariance).toBe(true);
  });
});
