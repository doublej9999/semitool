import { describe, expect, it } from 'vitest';
import {
  calculateCleanroomAirflow,
  calculateIsoRawLimit,
  cfmToM3h,
  ft3ToM3,
  getParticleLimitsForIso,
  m3hToCfm,
  m3ToFt3,
  roundIsoStandardLimit,
  FT3_PER_M3,
  ISO_CLASSES_INFO,
} from './cleanroom';

describe('Cleanroom Classification & Airflow Math', () => {
  describe('ISO 14644-1 Particle Limits', () => {
    it('computes ISO 5 particle limit at 0.5 µm as 3520 particles/m³ and approx 100 particles/ft³', () => {
      const rawLimit = calculateIsoRawLimit(5, 0.5);
      // Raw formula: 10^5 * (0.1 / 0.5)^2.08 = 3516.757...
      expect(rawLimit).toBeCloseTo(3516.76, 1);

      const rounded = roundIsoStandardLimit(rawLimit);
      expect(rounded).toBe(3520);

      const limits = getParticleLimitsForIso(5);
      const limit05 = limits.find((l) => l.diameterUm === 0.5);
      expect(limit05).toBeDefined();
      expect(limit05?.standardPerM3).toBe(3520);

      // In ft³: 3520 / 35.3147 ≈ 99.68 particles/ft³ (approx 100 particles/ft³)
      expect(limit05?.standardPerFt3).toBeCloseTo(99.68, 1);
      expect(Math.round(limit05?.standardPerFt3 ?? 0)).toBe(100);
    });

    it('scales particle limits correctly across particle sizes according to ISO 14644-1 formula', () => {
      // For ISO 3 (Fed Class 1):
      // D = 0.1 µm -> 10^3 * (0.1 / 0.1)^2.08 = 1000
      expect(calculateIsoRawLimit(3, 0.1)).toBeCloseTo(1000, 4);
      expect(roundIsoStandardLimit(calculateIsoRawLimit(3, 0.1))).toBe(1000);

      // D = 0.2 µm -> 10^3 * (0.1 / 0.2)^2.08 = 1000 * 0.5^2.08 ≈ 236.51 -> 237
      expect(roundIsoStandardLimit(calculateIsoRawLimit(3, 0.2))).toBe(237);

      // D = 0.3 µm -> 10^3 * (0.1 / 0.3)^2.08 ≈ 101.76 -> 102
      expect(roundIsoStandardLimit(calculateIsoRawLimit(3, 0.3))).toBe(102);

      // D = 0.5 µm -> 10^3 * (0.1 / 0.5)^2.08 ≈ 35.17 -> 35
      expect(roundIsoStandardLimit(calculateIsoRawLimit(3, 0.5))).toBe(35);

      // D = 1.0 µm -> 10^3 * (0.1 / 1.0)^2.08 ≈ 8.32 -> 8
      expect(roundIsoStandardLimit(calculateIsoRawLimit(3, 1.0))).toBe(8);

      // Check ISO 4 (Fed Class 10): exactly 10x ISO 3
      expect(calculateIsoRawLimit(4, 0.1)).toBeCloseTo(10000, 3);
      expect(roundIsoStandardLimit(calculateIsoRawLimit(4, 0.5))).toBe(352);

      // Check ISO 6 (Fed Class 1000):
      expect(roundIsoStandardLimit(calculateIsoRawLimit(6, 0.5))).toBe(35200);
      expect(roundIsoStandardLimit(calculateIsoRawLimit(6, 5.0))).toBe(293);
    });

    it('throws for out-of-range ISO class or negative diameter', () => {
      expect(() => calculateIsoRawLimit(0, 0.5)).toThrow(RangeError);
      expect(() => calculateIsoRawLimit(10, 0.5)).toThrow(RangeError);
      expect(() => calculateIsoRawLimit(5, 0)).toThrow(RangeError);
      expect(() => calculateIsoRawLimit(5, -1)).toThrow(RangeError);
    });
  });

  describe('Unit Conversions', () => {
    it('converts volume between m³ and ft³ accurately', () => {
      const oneM3InFt3 = m3ToFt3(1);
      expect(oneM3InFt3).toBeCloseTo(FT3_PER_M3, 5);
      expect(ft3ToM3(oneM3InFt3)).toBeCloseTo(1, 5);

      const testM3 = 150;
      const convertedFt3 = m3ToFt3(testM3);
      expect(convertedFt3).toBeCloseTo(5297.2, 0.1);
      expect(ft3ToM3(convertedFt3)).toBeCloseTo(testM3, 5);
    });

    it('converts airflow between CFM and m³/h accurately', () => {
      // 1 CFM = 60 ft³/h. In m³/h: 60 / 35.3146667 ≈ 1.69901 m³/h
      expect(cfmToM3h(1)).toBeCloseTo(1.69901, 4);
      expect(m3hToCfm(1.6990108)).toBeCloseTo(1, 4);

      // Typical 2x4 FFU: 700 CFM ≈ 1189.3 m³/h
      expect(cfmToM3h(700)).toBeCloseTo(1189.3, 1);
      expect(m3hToCfm(1189.307)).toBeCloseTo(700, 0.5);
    });
  });

  describe('Room Airflow and HVAC ACH Calculation', () => {
    it('calculates room volume, airflow Q = Volume * ACH, and FFU requirements in metric', () => {
      // Room: 10m x 6m x 3m = 180 m³
      // ISO 5 default ACH = 300
      const result = calculateCleanroomAirflow({
        isoClass: 5,
        length: 10,
        width: 6,
        height: 3,
        dimensionUnit: 'm',
        ach: 300,
        ffuSize: '2x4',
      });

      expect(result.roomVolumeM3).toBe(180);
      expect(result.floorAreaM2).toBe(60);
      expect(result.roomVolumeFt3).toBeCloseTo(6356.64, 1);

      // Q = 180 m³ * 300 1/h = 54,000 m³/h
      expect(result.totalAirflowM3h).toBe(54000);
      // CFM = 54000 * FT3_PER_M3 / 60 ≈ 31783.2 CFM
      expect(result.totalAirflowCfm).toBeCloseTo(31783.2, 1);

      // 2x4 FFU nominal CFM is 700
      // ffuCountByAirflow = ceil(31783.2 / 700) = 46 FFUs
      expect(result.ffuCountByAirflow).toBe(46);

      // Ceiling coverage for ISO 5 is typical 65% (min 60%, max 70%)
      // Ceiling area = 60 m² * 65% = 39 m²
      // 2x4 FFU area = 0.72 m² -> ceil(39 / 0.72) = 55 FFUs
      expect(result.ffuCountByCoverage).toBe(55);

      // recommended is max(46, 55) = 55
      expect(result.recommendedFfuCount).toBe(55);
      // Actual coverage = 55 * 0.72 / 60 = 39.6 / 60 = 66%
      expect(result.actualCeilingCoveragePercent).toBeCloseTo(66, 1);

      // FED Equivalent
      expect(result.fedEquivalent).toBe('Class 100');
    });

    it('calculates cleanroom airflow in imperial units (ft)', () => {
      // Room: 30 ft x 20 ft x 10 ft = 6,000 ft³
      const result = calculateCleanroomAirflow({
        isoClass: 7,
        length: 30,
        width: 20,
        height: 10,
        dimensionUnit: 'ft',
        ach: 75,
        ffuSize: '2x4',
      });

      expect(result.roomVolumeFt3).toBeCloseTo(6000, 1);
      expect(result.floorAreaFt2).toBe(600);
      // Total airflow CFM = 6000 ft³ * 75 ACH / 60 min/h = 7500 CFM
      expect(result.totalAirflowCfm).toBeCloseTo(7500, 1);

      // FED equivalent is Class 10,000
      expect(result.fedEquivalent).toBe('Class 10,000');
      expect(result.classInfo.flowRegime).toBe('Non-unidirectional (Turbulent)');
    });

    it('defaults ACH to standard class midpoint if omitted', () => {
      const iso5 = calculateCleanroomAirflow({
        isoClass: 5,
        length: 5,
        width: 5,
        height: 3,
        dimensionUnit: 'm',
      });
      expect(iso5.ach).toBe(ISO_CLASSES_INFO[5].achDefault); // 300 ACH
      expect(iso5.totalAirflowM3h).toBe(75 * 300);
    });
  });
});
