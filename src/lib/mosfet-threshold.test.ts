import { describe, expect, it } from 'vitest';
import {
  calculateIntrinsicCarrierConcentration,
  calculateMosfetThreshold,
  calculateThermalVoltage,
  generateVthVsToxCurve,
  DIELECTRIC_PRESETS,
  GATE_PRESETS,
} from './mosfet-threshold';

describe('MOSFET Threshold and Gate Dielectric Physics', () => {
  it('calculates thermal voltage and intrinsic concentration at 300 K', () => {
    const vt = calculateThermalVoltage(300);
    expect(vt).toBeCloseTo(0.02585, 4);

    const ni = calculateIntrinsicCarrierConcentration(300, vt);
    expect(ni).toBeGreaterThan(0.9e10);
    expect(ni).toBeLessThan(1.2e10);
  });

  it('computes standard NMOS parameters with SiO2 and n+ poly gate', () => {
    const res = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 2.0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.05, // n+ poly
      bodyBiasV: 0,
      qoxPerQ: 1e10,
      temperatureK: 300,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // EOT for SiO2 should equal physical tox
    expect(res.eotNm).toBeCloseTo(2.0, 4);

    // Cox for 2nm SiO2 ~ 17.26 fF/µm²
    expect(res.coxFFPerUm2).toBeCloseTo(17.266, 1);

    // Bulk potential phi_B ~ 0.41 - 0.43 V
    expect(res.phiBV).toBeGreaterThan(0.40);
    expect(res.phiBV).toBeLessThan(0.44);

    // Subthreshold swing at 300K should be physically realistic (~65 - 85 mV/dec)
    expect(res.subthresholdSwingMVPerDec).toBeGreaterThan(60);
    expect(res.subthresholdSwingMVPerDec).toBeLessThan(85);

    // Body effect coefficient gamma > 0
    expect(res.gammaV05).toBeGreaterThan(0.1);
  });

  it('evaluates High-k dielectric (HfO2) and EOT scaling', () => {
    const toxPhysical = 3.0; // 3 nm HfO2
    const epsHfO2 = 25.0;

    const res = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 2e17,
      toxNm: toxPhysical,
      dielectricEpsR: epsHfO2,
      gateWorkFunctionEv: 4.60, // midgap metal
      bodyBiasV: 0,
      qoxPerQ: 1e10,
      temperatureK: 300,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // EOT = 3.0 * (3.9 / 25) = 0.468 nm
    const expectedEOT = 3.0 * (3.9 / 25.0);
    expect(res.eotNm).toBeCloseTo(expectedEOT, 3);
    expect(res.eotNm).toBeLessThan(toxPhysical);

    // Cox should be significantly higher than standard SiO2 of same thickness
    expect(res.coxFFPerUm2).toBeGreaterThan(50);

    // Subthreshold swing is sharper with high Cox
    expect(res.subthresholdSwingMVPerDec).toBeGreaterThan(59.5);
    expect(res.subthresholdSwingMVPerDec).toBeLessThan(75);
  });

  it('correctly models body effect when Vsb is applied', () => {
    const zeroBias = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 2.0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.60,
      bodyBiasV: 0,
    });

    const bodyBiased = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 2.0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.60,
      bodyBiasV: 1.5,
    });

    expect(zeroBias.ok).toBe(true);
    expect(bodyBiased.ok).toBe(true);
    if (!zeroBias.ok || !bodyBiased.ok) return;

    // For NMOS, positive Vsb increases Vth
    expect(bodyBiased.vthV).toBeGreaterThan(zeroBias.vthV);
    expect(bodyBiased.deltaVthV).toBeGreaterThan(0);
    expect(bodyBiased.vthV - zeroBias.vthV).toBeCloseTo(bodyBiased.deltaVthV, 5);
  });

  it('computes PMOS threshold and signs appropriately', () => {
    const pmos = calculateMosfetThreshold({
      channelType: 'pmos',
      substrateDopingCm3: 1e17, // Nd
      toxNm: 2.5,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.05, // n+ poly or midgap gate on PMOS yields negative Vth
      bodyBiasV: 0,
    });

    expect(pmos.ok).toBe(true);
    if (!pmos.ok) return;

    // Zero-bias Vth for PMOS with n+ poly or midgap gate is negative
    expect(pmos.vth0V).toBeLessThan(0);
  });

  it('validates bad input gracefully', () => {
    const invalidSubstrate = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: -1e15,
      toxNm: 2.0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.05,
    });
    expect(invalidSubstrate.ok).toBe(false);

    const invalidTox = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.05,
    });
    expect(invalidTox.ok).toBe(false);

    const invalidEps = calculateMosfetThreshold({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 2.0,
      dielectricEpsR: -5,
      gateWorkFunctionEv: 4.05,
    });
    expect(invalidEps.ok).toBe(false);
  });

  it('generates sweep curve data', () => {
    const curve = generateVthVsToxCurve({
      channelType: 'nmos',
      substrateDopingCm3: 1e17,
      toxNm: 2.0,
      dielectricEpsR: 3.9,
      gateWorkFunctionEv: 4.60,
    }, 1.0, 5.0, 10);

    expect(curve.length).toBe(10);
    expect(curve[0].toxNm).toBeCloseTo(1.0);
    expect(curve[9].toxNm).toBeCloseTo(5.0);
    expect(curve[0].coxFFPerUm2).toBeGreaterThan(curve[9].coxFFPerUm2);
  });

  it('contains expected presets in catalog', () => {
    expect(DIELECTRIC_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(GATE_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(DIELECTRIC_PRESETS.some((p) => p.id === 'hfo2')).toBe(true);
  });
});
