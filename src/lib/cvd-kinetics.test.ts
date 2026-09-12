import { describe, it, expect } from 'vitest';
import {
  calculateCvdKinetics,
  CVD_RECIPES,
  type CvdCalculationInput,
} from './cvd-kinetics';

describe('cvd-kinetics', () => {
  const baseInput: CvdCalculationInput = {
    recipeId: 'si-sih4',
    tempCelsius: 850,
    pressureTorr: 760,
    reactantMoleFraction: 0.001,
    gasVelocityCmPerS: 20,
    waferPositionXCm: 10,
    channelHeightCm: 5,
    susceptorLengthCm: 30,
  };

  it('calculates silicon epitaxy from silane with reasonable growth rate and regime', () => {
    const res = calculateCvdKinetics(baseInput);
    expect(res.ok).toBe(true);
    expect(res.growthRateNmPerMin).toBeGreaterThan(5);
    expect(res.growthRateNmPerMin).toBeLessThan(5000);
    expect(res.diffusivityDg).toBeGreaterThan(0);
    expect(res.massTransferCoefficientHg).toBeGreaterThan(0);
    expect(res.surfaceReactionRateKs).toBeGreaterThan(0);
    expect(res.boundaryLayerThicknessDeltaMm).toBeGreaterThan(0);
    expect(res.depletionProfile.length).toBeGreaterThan(10);
    expect(res.arrheniusCurve.length).toBeGreaterThan(10);
  });

  it('demonstrates surface-reaction-limited regime at lower temperatures', () => {
    const lowTempInput: CvdCalculationInput = {
      ...baseInput,
      tempCelsius: 600, // low temp where surface reaction is slow
    };
    const res = calculateCvdKinetics(lowTempInput);
    expect(res.ok).toBe(true);
    expect(res.regime).toBe('surface-reaction-limited');
    expect(res.surfaceReactionRateKs).toBeLessThan(res.massTransferCoefficientHg);
  });

  it('demonstrates mass-transport-limited regime at elevated temperatures', () => {
    const highTempInput: CvdCalculationInput = {
      ...baseInput,
      tempCelsius: 1100, // high temp where surface reaction is fast
    };
    const res = calculateCvdKinetics(highTempInput);
    expect(res.ok).toBe(true);
    expect(res.regime).toBe('mass-transport-limited');
    expect(res.surfaceReactionRateKs).toBeGreaterThan(res.massTransferCoefficientHg);
  });

  it('verifies growth rate increases monotonically with reactant mole fraction', () => {
    const res1 = calculateCvdKinetics({ ...baseInput, reactantMoleFraction: 0.001 });
    const res2 = calculateCvdKinetics({ ...baseInput, reactantMoleFraction: 0.005 });
    expect(res2.growthRateNmPerMin).toBeGreaterThan(res1.growthRateNmPerMin);
  });

  it('verifies boundary layer grows with distance x along susceptor', () => {
    const resNear = calculateCvdKinetics({ ...baseInput, waferPositionXCm: 2 });
    const resFar = calculateCvdKinetics({ ...baseInput, waferPositionXCm: 20 });
    expect(resFar.boundaryLayerThicknessDeltaCm).toBeGreaterThan(resNear.boundaryLayerThicknessDeltaCm);
  });

  it('correctly reports transition temperature where ks equals hg', () => {
    const res = calculateCvdKinetics(baseInput);
    expect(res.transitionTemperatureCelsius).not.toBeNull();
    if (res.transitionTemperatureCelsius !== null) {
      expect(res.transitionTemperatureCelsius).toBeGreaterThan(500);
      expect(res.transitionTemperatureCelsius).toBeLessThan(1200);
    }
  });

  it('handles LPCVD poly-Si recipe properly under sub-torr pressure', () => {
    const polyInput: CvdCalculationInput = {
      recipeId: 'polysilicon-lpcvd',
      tempCelsius: 620,
      pressureTorr: 0.3,
      reactantMoleFraction: 1.0,
      gasVelocityCmPerS: 50,
      waferPositionXCm: 15,
      channelHeightCm: 10,
      susceptorLengthCm: 50,
    };
    const res = calculateCvdKinetics(polyInput);
    expect(res.ok).toBe(true);
    expect(res.growthRateNmPerMin).toBeGreaterThan(1);
    expect(res.growthRateNmPerMin).toBeLessThan(200);
  });

  it('handles LPCVD TEOS and Si3N4 presets without throwing', () => {
    const teos = calculateCvdKinetics({
      ...baseInput,
      recipeId: 'sio2-teos',
      tempCelsius: 700,
      pressureTorr: 0.5,
      reactantMoleFraction: 0.8,
    });
    expect(teos.ok).toBe(true);

    const nitride = calculateCvdKinetics({
      ...baseInput,
      recipeId: 'si3n4-lpcvd',
      tempCelsius: 780,
      pressureTorr: 0.25,
      reactantMoleFraction: 0.15,
    });
    expect(nitride.ok).toBe(true);
  });

  it('validates invalid inputs and returns appropriate error messages', () => {
    expect(calculateCvdKinetics({ ...baseInput, tempCelsius: -300 }).ok).toBe(false);
    expect(calculateCvdKinetics({ ...baseInput, pressureTorr: 0 }).ok).toBe(false);
    expect(calculateCvdKinetics({ ...baseInput, reactantMoleFraction: -0.1 }).ok).toBe(false);
    expect(calculateCvdKinetics({ ...baseInput, gasVelocityCmPerS: 0 }).ok).toBe(false);
    expect(calculateCvdKinetics({ ...baseInput, waferPositionXCm: 0 }).ok).toBe(false);
  });

  it('ensures all recipes in CVD_RECIPES have valid physical properties', () => {
    Object.values(CVD_RECIPES).forEach((recipe) => {
      expect(recipe.activationEnergyEv).toBeGreaterThan(0);
      expect(recipe.preExponentialKs0).toBeGreaterThan(0);
      expect(recipe.diffusivityDg0).toBeGreaterThan(0);
      expect(recipe.filmDensityAtomsCm3).toBeGreaterThan(0);
      expect(recipe.defaultTempC).toBeGreaterThan(0);
    });
  });
});
