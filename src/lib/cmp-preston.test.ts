import { describe, expect, it } from 'vitest';
import {
  calculateCmpPreston,
  convertDownforceToPa,
  CMP_PRESETS,
  getCmpPreset,
  PSI_TO_PA,
  KPA_TO_PA,
} from './cmp-preston';

describe('CMP Preston Calculator Lib', () => {
  const defaultParams = {
    materialId: 'oxide',
    downforcePressure: 3.0,
    pressureUnit: 'psi' as const,
    platenSpeedRpm: 90,
    carrierSpeedRpm: 85,
    carrierOffsetMm: 200,
    waferDiameterMm: 300,
    polishTimeSec: 60,
  };

  describe('pressure conversion', () => {
    it('correctly converts psi and kPa to Pa', () => {
      expect(convertDownforceToPa(1, 'psi')).toBeCloseTo(PSI_TO_PA, 5);
      expect(convertDownforceToPa(1, 'kPa')).toBe(1000);
      expect(convertDownforceToPa(3.0, 'psi')).toBeCloseTo(3 * PSI_TO_PA, 4);
      expect(convertDownforceToPa(20, 'kPa')).toBe(20000);
    });

    it('calculates equal removal rate when equivalent pressure is provided in kPa', () => {
      const psiResult = calculateCmpPreston({
        ...defaultParams,
        downforcePressure: 3.0,
        pressureUnit: 'psi',
      });
      const paEquivalentKPa = (3.0 * PSI_TO_PA) / KPA_TO_PA;
      const kpaResult = calculateCmpPreston({
        ...defaultParams,
        downforcePressure: paEquivalentKPa,
        pressureUnit: 'kPa',
      });

      expect(psiResult.ok).toBe(true);
      expect(kpaResult.ok).toBe(true);
      if (psiResult.ok && kpaResult.ok) {
        expect(kpaResult.rrNmPerMin).toBeCloseTo(psiResult.rrNmPerMin, 4);
        expect(kpaResult.totalRemovedNm).toBeCloseTo(psiResult.totalRemovedNm, 4);
      }
    });
  });

  describe('presets and removal rates', () => {
    it('provides valid presets for oxide, copper, tungsten, and polysilicon', () => {
      expect(CMP_PRESETS.length).toBeGreaterThanOrEqual(5);

      const oxide = getCmpPreset('oxide');
      expect(oxide?.kpPaInv).toBe(7.5e-14);

      const copper = getCmpPreset('copper');
      expect(copper?.kpPaInv).toBe(1.6e-13);

      const tungsten = getCmpPreset('tungsten');
      expect(tungsten?.kpPaInv).toBe(5.0e-14);

      const poly = getCmpPreset('polysilicon');
      expect(poly?.kpPaInv).toBe(9.0e-14);
    });

    it('computes expected oxide removal rate around 175 nm/min at 3 psi and 90 rpm', () => {
      const result = calculateCmpPreston(defaultParams);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Kp=7.5e-14, P=20684.271 Pa, V_center = 2 * pi * 0.2 * 1.5 = 1.884955 m/s
      // RR = 7.5e-14 * 20684.271 * 1.884955 * 60 * 1e9 ≈ 175.46 nm/min
      expect(result.rrNmPerMin).toBeGreaterThan(170);
      expect(result.rrNmPerMin).toBeLessThan(180);
      expect(result.rrAngstromPerMin).toBeCloseTo(result.rrNmPerMin * 10, 4);
      expect(result.totalRemovedNm).toBeCloseTo(result.rrNmPerMin, 4); // 60 seconds polish
    });

    it('supports custom Kp values', () => {
      const result = calculateCmpPreston({
        ...defaultParams,
        materialId: 'custom',
        customKpPaInv: 3.5e-14,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // At Kp = 3.5e-14, RR ≈ 81.88 nm/min
      expect(result.rrNmPerMin).toBeGreaterThan(80);
      expect(result.rrNmPerMin).toBeLessThan(84);
    });
  });

  describe('linear scaling with pressure, speed, and time', () => {
    it('scales removal rate linearly with downforce pressure', () => {
      const base = calculateCmpPreston({ ...defaultParams, downforcePressure: 3.0 });
      const doubled = calculateCmpPreston({ ...defaultParams, downforcePressure: 6.0 });

      expect(base.ok).toBe(true);
      expect(doubled.ok).toBe(true);
      if (base.ok && doubled.ok) {
        expect(doubled.rrNmPerMin).toBeCloseTo(base.rrNmPerMin * 2, 4);
      }
    });

    it('scales removal rate linearly with platen rotation speed', () => {
      const base = calculateCmpPreston({ ...defaultParams, platenSpeedRpm: 60 });
      const doubled = calculateCmpPreston({ ...defaultParams, platenSpeedRpm: 120 });

      expect(base.ok).toBe(true);
      expect(doubled.ok).toBe(true);
      if (base.ok && doubled.ok) {
        expect(doubled.vCenter).toBeCloseTo(base.vCenter * 2, 4);
        expect(doubled.rrNmPerMin).toBeCloseTo(base.rrNmPerMin * 2, 4);
      }
    });

    it('scales total removed thickness linearly with polish time', () => {
      const res60s = calculateCmpPreston({ ...defaultParams, polishTimeSec: 60 });
      const res120s = calculateCmpPreston({ ...defaultParams, polishTimeSec: 120 });

      expect(res60s.ok).toBe(true);
      expect(res120s.ok).toBe(true);
      if (res60s.ok && res120s.ok) {
        expect(res120s.rrNmPerMin).toBeCloseTo(res60s.rrNmPerMin, 6);
        expect(res120s.totalRemovedNm).toBeCloseTo(res60s.totalRemovedNm * 2, 4);
        expect(res120s.totalRemovedAngstrom).toBeCloseTo(res60s.totalRemovedAngstrom * 2, 4);
      }
    });
  });

  describe('kinematics and WIWNU calculations', () => {
    it('computes inner, center, and outer velocities and velocity variation', () => {
      const result = calculateCmpPreston(defaultParams);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // carrier offset = 200 mm, wafer diameter = 300 mm => rWafer = 150 mm
      // inner radius = 200 - 150 = 50 mm = 0.05 m
      // outer radius = 200 + 150 = 350 mm = 0.35 m
      expect(result.vInner).toBeLessThan(result.vCenter);
      expect(result.vOuter).toBeGreaterThan(result.vCenter);
      expect(result.deltaV).toBeCloseTo(result.vOuter - result.vInner, 5);
      expect(result.velocityVariationPercent).toBeCloseTo((result.deltaV / result.vCenter) * 100, 4);
    });

    it('yields 0% WIWNU kinematic estimate when platen and carrier speeds match', () => {
      const matched = calculateCmpPreston({
        ...defaultParams,
        platenSpeedRpm: 90,
        carrierSpeedRpm: 90,
      });
      expect(matched.ok).toBe(true);
      if (matched.ok) {
        expect(matched.wiwnuPercent).toBe(0);
      }
    });

    it('computes non-zero WIWNU when platen and carrier speeds differ', () => {
      const mismatched = calculateCmpPreston({
        ...defaultParams,
        platenSpeedRpm: 90,
        carrierSpeedRpm: 85,
        waferDiameterMm: 300,
        carrierOffsetMm: 200,
      });
      expect(mismatched.ok).toBe(true);
      if (mismatched.ok) {
        // deltaOmega = 5 * 2 * pi / 60
        // vCenter = 2 * pi * 0.2 * 1.5 = 0.6 * pi
        // wiwnu = ((5 * 2 * pi / 60) * 0.15 / (0.6 * pi)) * 100 = (0.15 / 3.6) * 100 = 4.1667%
        expect(mismatched.wiwnuPercent).toBeCloseTo(4.1667, 3);
      }
    });
  });

  describe('validation', () => {
    it('rejects invalid downforce pressure', () => {
      const res1 = calculateCmpPreston({ ...defaultParams, downforcePressure: 0 });
      const res2 = calculateCmpPreston({ ...defaultParams, downforcePressure: -2 });
      expect(res1.ok).toBe(false);
      expect(res2.ok).toBe(false);
    });

    it('rejects invalid rotation speeds', () => {
      const resPlaten = calculateCmpPreston({ ...defaultParams, platenSpeedRpm: 0 });
      const resCarrier = calculateCmpPreston({ ...defaultParams, carrierSpeedRpm: -10 });
      expect(resPlaten.ok).toBe(false);
      expect(resCarrier.ok).toBe(false);
    });

    it('rejects invalid offset, wafer diameter, and time', () => {
      const resOffset = calculateCmpPreston({ ...defaultParams, carrierOffsetMm: 0 });
      const resDiameter = calculateCmpPreston({ ...defaultParams, waferDiameterMm: -300 });
      const resTime = calculateCmpPreston({ ...defaultParams, polishTimeSec: 0 });
      expect(resOffset.ok).toBe(false);
      expect(resDiameter.ok).toBe(false);
      expect(resTime.ok).toBe(false);
    });

    it('rejects missing or non-positive custom Kp', () => {
      const resNoKp = calculateCmpPreston({
        ...defaultParams,
        materialId: 'custom',
        customKpPaInv: undefined,
      });
      const resZeroKp = calculateCmpPreston({
        ...defaultParams,
        materialId: 'custom',
        customKpPaInv: 0,
      });
      expect(resNoKp.ok).toBe(false);
      expect(resZeroKp.ok).toBe(false);
    });

    it('rejects unknown preset id', () => {
      const resUnknown = calculateCmpPreston({
        ...defaultParams,
        materialId: 'diamond-like-carbon',
      });
      expect(resUnknown.ok).toBe(false);
    });
  });
});
