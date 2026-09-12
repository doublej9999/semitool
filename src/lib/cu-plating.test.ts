import { describe, it, expect } from 'vitest';
import {
  calculateCuDepositionRateNmMin,
  simulateDamasceneFill,
  calculateRadialCurrentProfile,
  calculateCuPlating,
} from './cu-plating';

describe('cu-plating', () => {
  describe('calculateCuDepositionRateNmMin', () => {
    it('returns zero for zero or negative current density', () => {
      expect(calculateCuDepositionRateNmMin(0)).toBe(0);
      expect(calculateCuDepositionRateNmMin(-5)).toBe(0);
    });

    it('calculates deposition rate matching Faraday law within 1% at 10 mA/cm2', () => {
      // At 10 mA/cm2, rate is ~216 nm/min with 98% efficiency
      const rate = calculateCuDepositionRateNmMin(10, 0.98);
      expect(rate).toBeGreaterThan(210);
      expect(rate).toBeLessThan(220);
    });

    it('scales linearly with current density and efficiency', () => {
      const rate1 = calculateCuDepositionRateNmMin(10, 1.0);
      const rate2 = calculateCuDepositionRateNmMin(20, 1.0);
      expect(rate2 / rate1).toBeCloseTo(2.0, 3);

      const rateEff1 = calculateCuDepositionRateNmMin(10, 0.5);
      expect(rateEff1 / rate1).toBeCloseTo(0.5, 3);
    });
  });

  describe('simulateDamasceneFill', () => {
    it('handles zero or invalid dimensions', () => {
      const result = simulateDamasceneFill(0, 500, 200);
      expect(result.aspectRatio).toBe(0);
      expect(result.pinchOffRisk).toBe('high');
    });

    it('computes correct aspect ratio', () => {
      const result = simulateDamasceneFill(100, 300, 200);
      expect(result.aspectRatio).toBe(3);
    });

    it('evaluates bottom-up velocity acceleration', () => {
      const result = simulateDamasceneFill(100, 300, 200, 1.5, 0.8, 1.0);
      expect(result.bottomUpVelocityRatio).toBeGreaterThan(1.5);
      expect(result.timeToFillTrenchSec).toBeGreaterThan(0);
    });

    it('flags high risk on high aspect ratio trenches > 4.5', () => {
      const result = simulateDamasceneFill(50, 300, 200); // AR = 6
      expect(result.pinchOffRisk).toBe('high');
      expect(result.voidRiskPercent).toBeGreaterThan(50);
    });

    it('flags moderate or none risk on low aspect ratio trenches', () => {
      const result = simulateDamasceneFill(200, 200, 200); // AR = 1
      expect(result.pinchOffRisk).toBe('none');
      expect(result.voidRiskPercent).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateRadialCurrentProfile', () => {
    it('shows center-thinner and edge-thicker profile due to terminal effect', () => {
      const res = calculateRadialCurrentProfile(15, 300, 1.5, 120);
      expect(res.profile.length).toBe(11);
      expect(res.centerThickness).toBeLessThan(res.edgeThickness);
      expect(res.uniformity).toBeGreaterThan(0);
    });

    it('has higher non-uniformity for higher seed sheet resistance', () => {
      const lowRs = calculateRadialCurrentProfile(15, 300, 0.5, 120);
      const highRs = calculateRadialCurrentProfile(15, 300, 2.5, 120);
      expect(highRs.uniformity).toBeGreaterThan(lowRs.uniformity);
    });
  });

  describe('calculateCuPlating', () => {
    it('computes total charge and deposited copper mass correctly', () => {
      const res = calculateCuPlating({
        currentDensityMaCm2: 15,
        platingTimeSec: 60,
        waferDiameterMm: 300,
      });

      expect(res.nominalRateNmMin).toBeGreaterThan(0);
      expect(res.nominalThicknessNm).toBeGreaterThan(0);
      expect(res.totalChargeCoulombs).toBeGreaterThan(0);
      expect(res.totalCuMassGrams).toBeGreaterThan(0);
      expect(res.radialProfile.length).toBe(11);
    });

    it('emits warning for burning current density > 50 mA/cm2', () => {
      const res = calculateCuPlating({
        currentDensityMaCm2: 60,
        platingTimeSec: 30,
      });
      expect(res.warnings.some((w) => w.includes('exceeds 50 mA/cm²'))).toBe(true);
    });

    it('simulates Damascene trench when dimensions provided', () => {
      const res = calculateCuPlating({
        currentDensityMaCm2: 15,
        platingTimeSec: 90,
        trenchWidthNm: 90,
        trenchDepthNm: 270,
      });
      expect(res.damascene).toBeDefined();
      expect(res.damascene?.aspectRatio).toBe(3);
    });
  });
});
