import { describe, it, expect } from 'vitest';
import {
  calculateTsvStress,
  calculateMicrobumpEm,
  calculateUnderfillFlow,
} from './advanced-packaging';

describe('Advanced Packaging Multiphysics', () => {
  it('calculates TSV thermo-mechanical stress and KOZ radius', () => {
    const res = calculateTsvStress({
      viaDiameterUm: 10,
      viaHeightUm: 80,
      deltaTC: 225, // 250°C to 25°C
      stressThresholdMpa: 50,
    });

    expect(res.kozRadiusUm).toBeGreaterThan(5); // Must exceed physical radius (5 um)
    expect(res.radialStressMpaAtInterface).toBeLessThan(0); // Compressive in Si
    expect(res.hoopStressMpaAtInterface).toBeGreaterThan(0); // Tensile hoop stress
    expect(res.cuPumpingHeightNm).toBeGreaterThan(0);
    expect(res.stressProfile.length).toBeGreaterThan(20);
    // Radial stress magnitude decays as 1/r^2
    const firstPoint = res.stressProfile[0];
    const lastPoint = res.stressProfile[res.stressProfile.length - 1];
    expect(Math.abs(firstPoint.radialStressMpa)).toBeGreaterThan(Math.abs(lastPoint.radialStressMpa));
  });

  it('calculates microbump electromigration MTTF and current crowding', () => {
    const res = calculateMicrobumpEm({
      currentMa: 250,
      bumpDiameterUm: 40,
      ambientTempC: 85,
      crowdingFactor: 2.5,
    });

    expect(res.currentDensityAcm2).toBeGreaterThan(1e3);
    expect(res.crowdingCurrentDensityAcm2 / res.currentDensityAcm2).toBeCloseTo(2.5, 1);
    expect(res.jouleHeatingDeltaTC).toBeGreaterThan(0);
    expect(res.effectiveTemperatureC).toBeGreaterThan(85);
    expect(res.mttfHours).toBeGreaterThan(0);
    expect(res.safeLimitHours).toBeLessThan(res.mttfHours);
  });

  it('calculates underfill capillary flow dynamics via Washburn equation', () => {
    const res = calculateUnderfillFlow({
      chipLengthMm: 15,
      gapHeightUm: 30,
      dynamicViscosityPaS: 0.1,
    });

    expect(res.fillTimeSec).toBeGreaterThan(0);
    expect(res.flowVelocityMmPerSec).toBeGreaterThan(0);
    expect(res.capillaryPressureKpa).toBeGreaterThan(0);
    expect(['Low', 'Moderate', 'High']).toContain(res.voidRiskLevel);

    // Narrower gap increases fill time
    const narrowRes = calculateUnderfillFlow({
      chipLengthMm: 15,
      gapHeightUm: 10,
      dynamicViscosityPaS: 0.1,
    });
    expect(narrowRes.fillTimeSec).toBeGreaterThan(res.fillTimeSec);
    expect(narrowRes.voidRiskLevel).toBe('High');
  });
});
