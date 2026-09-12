import { describe, expect, it } from 'vitest';
import {
  calculateThermalResistance,
  PACKAGE_PRESETS,
  TIM_PRESETS,
  HEATSINK_PRESETS,
} from './thermal-resistance';

describe('thermal-resistance', () => {
  it('has valid presets for package, tim, and heatsink', () => {
    expect(PACKAGE_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(TIM_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(HEATSINK_PRESETS.length).toBeGreaterThanOrEqual(5);

    for (const pkg of PACKAGE_PRESETS) {
      expect(pkg.thetaJc).toBeGreaterThan(0);
      expect(pkg.typicalDieAreaMm2).toBeGreaterThan(0);
    }
    for (const tim of TIM_PRESETS) {
      expect(tim.kTim).toBeGreaterThan(0);
      expect(tim.bltUm).toBeGreaterThanOrEqual(0);
    }
    for (const hs of HEATSINK_PRESETS) {
      expect(hs.thetaSa).toBeGreaterThan(0);
    }
  });

  it('calculates standard FCBGA with TIM correctly', () => {
    const res = calculateThermalResistance({
      ambientTempC: 25,
      powerW: 50,
      dieWidthMm: 12,
      dieHeightMm: 12,
      thetaJc: 0.25,
      bltUm: 50,
      kTim: 3.5,
      thetaSa: 0.8,
      tjMaxC: 105,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.dieAreaMm2).toBe(144);
    // theta_TIM = 50 / (3.5 * 144) = 50 / 504 ~= 0.0992063
    expect(res.thetaTim).toBeCloseTo(50 / 504, 5);
    // theta_JA = 0.25 + 50/504 + 0.8 ~= 1.1492063
    expect(res.thetaJa).toBeCloseTo(0.25 + 50 / 504 + 0.8, 5);

    // Tj = 25 + 50 * thetaJa
    expect(res.tjC).toBeCloseTo(25 + 50 * (0.25 + 50 / 504 + 0.8), 4);
    // Tcase = Tj - 50 * 0.25
    expect(res.tCaseC).toBeCloseTo(res.tjC - 50 * 0.25, 4);
    // Tsink = Tcase - 50 * thetaTim = Ta + 50 * thetaSa = 25 + 40 = 65
    expect(res.tSinkC).toBeCloseTo(25 + 50 * 0.8, 4);

    // P_max = (105 - 25) / thetaJa
    expect(res.pMaxW).toBeCloseTo(80 / res.thetaJa, 4);
    expect(res.thermalMarginC).toBeCloseTo(105 - res.tjC, 4);
    expect(res.isSafe).toBe(true);
  });

  it('handles QFN with zero TIM (direct thermal pad)', () => {
    const res = calculateThermalResistance({
      ambientTempC: 25,
      powerW: 2,
      dieWidthMm: 5,
      dieHeightMm: 5,
      thetaJc: 1.8,
      bltUm: 0,
      kTim: 1.0,
      thetaSa: 25.0,
      tjMaxC: 105,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.dieAreaMm2).toBe(25);
    expect(res.thetaTim).toBe(0);
    expect(res.thetaJa).toBeCloseTo(26.8, 5);
    expect(res.tjC).toBeCloseTo(25 + 2 * 26.8, 4); // 78.6 °C
    expect(res.tCaseC).toBeCloseTo(78.6 - 2 * 1.8, 4); // 75.0 °C
    expect(res.tSinkC).toBeCloseTo(75.0, 4); // 75.0 °C
    expect(res.thermalMarginC).toBeCloseTo(105 - 78.6, 4); // 26.4 °C
    expect(res.isSafe).toBe(true);
  });

  it('accurately reports thermal breach when Tj exceeds Tj_max', () => {
    const res = calculateThermalResistance({
      ambientTempC: 30,
      powerW: 100,
      dieWidthMm: 10,
      dieHeightMm: 10,
      thetaJc: 0.5,
      bltUm: 50,
      kTim: 2.0,
      thetaSa: 2.0,
      tjMaxC: 100,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // dieArea = 100 mm2
    // thetaTim = 50 / (2.0 * 100) = 0.25 °C/W
    // thetaJa = 0.5 + 0.25 + 2.0 = 2.75 °C/W
    // Tj = 30 + 100 * 2.75 = 305 °C
    expect(res.thetaTim).toBeCloseTo(0.25, 5);
    expect(res.thetaJa).toBeCloseTo(2.75, 5);
    expect(res.tjC).toBeCloseTo(305, 4);
    expect(res.thermalMarginC).toBeCloseTo(-205, 4);
    expect(res.isSafe).toBe(false);
    expect(res.pMaxW).toBeCloseTo((100 - 30) / 2.75, 4);
  });

  it('calculates maximum allowable power P_max', () => {
    const res = calculateThermalResistance({
      ambientTempC: 25,
      powerW: 10,
      dieWidthMm: 8,
      dieHeightMm: 8,
      thetaJc: 1.0,
      bltUm: 40,
      kTim: 4.0,
      thetaSa: 4.0,
      tjMaxC: 125,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // thetaTim = 40 / (4 * 64) = 40 / 256 = 0.15625
    // thetaJa = 1.0 + 0.15625 + 4.0 = 5.15625
    // P_max = (125 - 25) / 5.15625 = 100 / 5.15625 = 19.3939... W
    expect(res.pMaxW).toBeCloseTo(100 / (5.15625), 4);
  });

  it('validates negative power and invalid dimensions', () => {
    const invalidPower = calculateThermalResistance({
      powerW: -5,
      dieWidthMm: 10,
      dieHeightMm: 10,
      thetaJc: 1,
      bltUm: 50,
      kTim: 3,
      thetaSa: 2,
    });
    expect(invalidPower.ok).toBe(false);
    if (!invalidPower.ok) {
      expect(invalidPower.errors).toContain('Power dissipation must be greater than or equal to 0 W.');
    }

    const invalidDims = calculateThermalResistance({
      powerW: 10,
      dieWidthMm: 0,
      dieHeightMm: -2,
      thetaJc: 1,
      bltUm: 50,
      kTim: 3,
      thetaSa: 2,
    });
    expect(invalidDims.ok).toBe(false);
    if (!invalidDims.ok) {
      expect(invalidDims.errors).toContain('Die width must be greater than 0 mm.');
      expect(invalidDims.errors).toContain('Die height must be greater than 0 mm.');
    }

    const invalidTim = calculateThermalResistance({
      powerW: 10,
      dieWidthMm: 10,
      dieHeightMm: 10,
      thetaJc: -1,
      bltUm: -10,
      kTim: 0,
      thetaSa: -2,
    });
    expect(invalidTim.ok).toBe(false);
    if (!invalidTim.ok) {
      expect(invalidTim.errors.length).toBeGreaterThanOrEqual(4);
    }
  });
});
