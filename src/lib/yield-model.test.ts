import { describe, expect, it } from 'vitest';
import {
  YIELD_MODELS,
  areaToCm2,
  getYieldModel,
  modelDefectDensities,
  modelYields,
  validateDensityInversionInputs,
  validateYieldModelInputs,
} from './yield-model';

describe('yield models', () => {
  it('matches the closed forms at AD = 0.5', () => {
    const ad = 0.5;
    const byId = Object.fromEntries(YIELD_MODELS.map((model) => [model.id, model.yieldFromAd(ad)]));

    expect(byId.poisson).toBeCloseTo(Math.exp(-0.5), 12);
    expect(byId.murphy).toBeCloseTo(((1 - Math.exp(-0.5)) / 0.5) ** 2, 12);
    expect(byId.seeds).toBeCloseTo(1 / 1.5, 12);
  });

  it('returns 100% from every model at zero defect density', () => {
    for (const model of YIELD_MODELS) {
      expect(model.yieldFromAd(0)).toBeCloseTo(1, 12);
    }
  });

  it('stays accurate for an AD so small that the closed form would cancel', () => {
    const murphy = getYieldModel('murphy');

    expect(murphy.yieldFromAd(0)).toBe(1);
    expect(murphy.yieldFromAd(1e-9)).toBeCloseTo(1, 9);
  });

  it('orders the models Poisson <= Murphy <= Seeds for equal AD', () => {
    for (const ad of [0.01, 0.1, 0.5, 1, 3, 10]) {
      const poisson = getYieldModel('poisson').yieldFromAd(ad);
      const murphy = getYieldModel('murphy').yieldFromAd(ad);
      const seeds = getYieldModel('seeds').yieldFromAd(ad);

      expect(poisson).toBeLessThanOrEqual(murphy);
      expect(murphy).toBeLessThanOrEqual(seeds);
    }
  });

  it('inverts each model back to the same defect density', () => {
    const areaCm2 = 0.5;

    for (const defectDensity of [0.05, 0.25, 0.5, 1, 2]) {
      for (const row of modelYields(defectDensity, areaCm2)) {
        const [inverse] = modelDefectDensities(row.yieldPercent, areaCm2).filter(
          (candidate) => candidate.model.id === row.model.id,
        );

        expect(inverse.defectDensityPerCm2).toBeCloseTo(defectDensity, 9);
      }
    }
  });

  it('reports the same AD for every model in one run', () => {
    const rows = modelYields(0.5, 0.4);

    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.ad).toBeCloseTo(0.2, 12);
  });

  it('rejects a yield of zero, which has no finite defect density', () => {
    expect(validateDensityInversionInputs(0, 0.5).length).toBeGreaterThan(0);
    expect(validateDensityInversionInputs(100, 0.5)).toEqual([]);
  });

  it('validates density and area inputs', () => {
    expect(validateYieldModelInputs(0, 0.5)).toEqual([]);
    expect(validateYieldModelInputs(-0.1, 0.5).length).toBeGreaterThan(0);
    expect(validateYieldModelInputs(0.5, 0).length).toBeGreaterThan(0);
    expect(validateYieldModelInputs(0.5, Number.NaN).length).toBeGreaterThan(0);
  });

  it('converts areas to cm2 for the model input', () => {
    expect(areaToCm2(50, 'mm2')).toBeCloseTo(0.5, 12);
    expect(areaToCm2(0.5, 'cm2')).toBeCloseTo(0.5, 12);
  });
});
