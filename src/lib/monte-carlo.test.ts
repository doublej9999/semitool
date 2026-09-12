import { describe, expect, it } from 'vitest';
import {
  createRng,
  sampleParameter,
  calculatePearsonCorrelation,
  computeHistogram,
  runMonteCarloSimulation,
  type ParameterSpec,
} from './monte-carlo';

describe('Monte Carlo simulation module', () => {
  it('generates reproducible numbers with deterministic seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    expect(seq1).toEqual(seq2);
  });

  it('samples normal, uniform, triangular, and lognormal distributions respecting bounds', () => {
    const rng = createRng(100);
    const normalSpec: ParameterSpec = {
      name: 'etchRate',
      type: 'normal',
      nominal: 100,
      spread: 5,
      minBound: 80,
      maxBound: 120,
    };
    const uniformSpec: ParameterSpec = {
      name: 'thickness',
      type: 'uniform',
      nominal: 50,
      spread: 10,
    };
    const triangularSpec: ParameterSpec = {
      name: 'temp',
      type: 'triangular',
      nominal: 1000,
      spread: 20,
    };
    const lognormalSpec: ParameterSpec = {
      name: 'defectDensity',
      type: 'lognormal',
      nominal: 0.1,
      spread: 0.2,
      minBound: 0,
    };

    for (let i = 0; i < 100; i += 1) {
      const nVal = sampleParameter(normalSpec, rng);
      expect(nVal).toBeGreaterThanOrEqual(80);
      expect(nVal).toBeLessThanOrEqual(120);

      const uVal = sampleParameter(uniformSpec, rng);
      expect(uVal).toBeGreaterThanOrEqual(40);
      expect(uVal).toBeLessThanOrEqual(60);

      const tVal = sampleParameter(triangularSpec, rng);
      expect(tVal).toBeGreaterThanOrEqual(980);
      expect(tVal).toBeLessThanOrEqual(1020);

      const lVal = sampleParameter(lognormalSpec, rng);
      expect(lVal).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes accurate Pearson correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // perfectly correlated
    const r = calculatePearsonCorrelation(x, y, 3, 6);
    expect(r).toBeCloseTo(1, 4);

    const yNeg = [10, 8, 6, 4, 2]; // perfectly negatively correlated
    const rNeg = calculatePearsonCorrelation(x, yNeg, 3, 6);
    expect(rNeg).toBeCloseTo(-1, 4);
  });

  it('computes valid histogram bins', () => {
    const values = [10, 12, 14, 16, 18, 20];
    const bins = computeHistogram(values, 5);
    expect(bins.length).toBe(5);
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(values.length);
  });

  it('simulates process tolerance and accurately ranks sensitivity', () => {
    // Model: Etch depth = etchRate * time. etchRate has high variance, time has low variance.
    const result = runMonteCarloSimulation({
      parameters: [
        { name: 'etchRate', type: 'normal', nominal: 10, spread: 1 },
        { name: 'time', type: 'normal', nominal: 60, spread: 0.5 },
      ],
      evaluate: (vals) => vals.etchRate * vals.time,
      sampleSize: 3000,
      lsl: 500,
      usl: 700,
      randomSeed: 999,
    });

    // Mean should be around 10 * 60 = 600
    expect(result.mean).toBeGreaterThan(580);
    expect(result.mean).toBeLessThan(620);
    expect(result.cp).not.toBeNull();
    expect(result.cpk).not.toBeNull();
    expect(result.yieldPercent).toBeGreaterThan(85);

    // etchRate sensitivity should dominate
    expect(result.sensitivities[0].name).toBe('etchRate');
    expect(result.sensitivities[0].correlation).toBeGreaterThan(0.7);
    expect(result.sensitivities[0].varianceContributionPercent).toBeGreaterThan(60);
  });
});
