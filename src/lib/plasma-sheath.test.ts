import { describe, expect, it } from 'vitest';
import {
  calculatePlasmaSheath,
  PLASMA_GAS_PRESETS,
  generateSheathProfile,
} from './plasma-sheath';

describe('Plasma Sheath & Debye Length Physics', () => {
  it('calculates argon plasma parameters for standard RIE / ICP conditions', () => {
    // 1e11 cm^-3, Te = 3.0 eV, Ar+ (39.95 amu), V_bias = 150 V
    const result = calculatePlasmaSheath({
      electronDensityCm3: 1e11,
      electronTempEv: 3.0,
      ionMassAmu: 39.95,
      sheathVoltageV: 150,
      chamberPressureMtorr: 10,
    });

    // Debye length: sqrt(eps0 * 3 / (e * 1e17))
    // eps0 ≈ 8.854e-12, Te = 3, e = 1.602e-19, n = 1e17 m^-3
    // lambda_De = sqrt(8.854e-12 * 3 / 1.602e-2) = sqrt(1.658e-9) ≈ 4.07e-5 m = 40.7 µm
    expect(result.debyeLengthUm).toBeGreaterThan(35);
    expect(result.debyeLengthUm).toBeLessThan(45);

    // Bohm velocity: sqrt(e * 3 / (39.95 * 1.66e-27))
    // ≈ sqrt(4.806e-19 / 6.63e-26) = sqrt(7.25e6) ≈ 2690 m/s
    expect(result.bohmVelocityMPerSec).toBeGreaterThan(2500);
    expect(result.bohmVelocityMPerSec).toBeLessThan(2900);

    // Plasma frequency: f_pe ≈ 8980 * sqrt(1e11) Hz ≈ 8980 * 3.162e5 ≈ 2.84 GHz
    expect(result.electronPlasmaFreqGhz).toBeGreaterThan(2.5);
    expect(result.electronPlasmaFreqGhz).toBeLessThan(3.2);

    // Child-Langmuir sheath thickness for 150V bias: typically ~0.5 to 2 mm in RIE
    expect(result.childLangmuirSheathMm).toBeGreaterThan(0.2);
    expect(result.childLangmuirSheathMm).toBeLessThan(5.0);

    // Floating potential is negative
    expect(result.floatingPotentialVolts).toBeLessThan(0);
    // For Ar (M=39.95 amu, m_e=9.11e-31 kg, ratio M/(2pi me) ≈ 11600, ln ≈ 9.36 -> Vf ≈ -0.5*3*9.36 ≈ -14 V)
    expect(result.floatingPotentialVolts).toBeCloseTo(-14.0, 0);

    // Mean free path at 10 mTorr ≈ 5 mm
    expect(result.ionMeanFreePathMm).toBeCloseTo(5.0, 1);
  });

  it('checks presets are defined and non-empty', () => {
    expect(PLASMA_GAS_PRESETS.length).toBeGreaterThanOrEqual(5);
    const ar = PLASMA_GAS_PRESETS.find((p) => p.id === 'argon');
    const cl = PLASMA_GAS_PRESETS.find((p) => p.id === 'chlorine');
    const cf3 = PLASMA_GAS_PRESETS.find((p) => p.id === 'cf3');

    expect(ar).toBeDefined();
    expect(cl).toBeDefined();
    expect(cf3).toBeDefined();
    expect(cf3?.ionMassAmu).toBe(69);
  });

  it('scales sheath thickness with applied voltage V^(3/4)', () => {
    const res50 = calculatePlasmaSheath({
      electronDensityCm3: 1e11,
      electronTempEv: 3.0,
      ionMassAmu: 39.95,
      sheathVoltageV: 50,
    });

    const res200 = calculatePlasmaSheath({
      electronDensityCm3: 1e11,
      electronTempEv: 3.0,
      ionMassAmu: 39.95,
      sheathVoltageV: 200,
    });

    // Ratio of sheath should be (200/50)^(3/4) = 4^0.75 = 2.828
    const ratio = res200.childLangmuirSheathUm / res50.childLangmuirSheathUm;
    expect(ratio).toBeCloseTo(2.828, 2);
  });

  it('generates sheath spatial profile with consistent boundary conditions and physical trends', () => {
    const inputs = {
      electronDensityCm3: 1e11,
      electronTempEv: 3.0,
      ionMassAmu: 39.95,
      sheathVoltageV: 150,
    };
    const result = calculatePlasmaSheath(inputs);
    const profile = generateSheathProfile(result, inputs, 60);

    expect(profile.length).toBeGreaterThanOrEqual(40);

    // Bulk / Presheath start: potential close to 0, ni/n0 and ne/n0 close to 1
    const start = profile[0];
    expect(start.region).toBe('Presheath');
    expect(start.potentialVolts).toBeCloseTo(0, 1);
    expect(start.ionDensityNormalized).toBeCloseTo(1, 1);
    expect(start.electronDensityNormalized).toBeCloseTo(1, 1);

    // Sheath edge (x = 0): V = -0.5 Te = -1.5 V, ni/n0 = ne/n0 ≈ exp(-0.5) ≈ 0.6065
    const edge = profile.find((p) => p.region === 'Sheath Edge');
    expect(edge).toBeDefined();
    expect(edge?.xUm).toBe(0);
    expect(edge?.potentialVolts).toBeCloseTo(-1.5, 1);
    expect(edge?.ionDensityNormalized).toBeCloseTo(0.6065, 2);
    expect(edge?.electronDensityNormalized).toBeCloseTo(0.6065, 2);
    expect(edge?.ionVelocityMPerSec).toBe(Math.round(result.bohmVelocityMPerSec));

    // Wafer / Electrode boundary (x = s): V = -150 V, ne ≈ 0, vi accelerated
    const end = profile[profile.length - 1];
    expect(end.region).toBe('Sheath');
    expect(end.potentialVolts).toBeCloseTo(-150, 1);
    expect(end.electronDensityNormalized).toBeLessThan(1e-4);
    expect(end.ionVelocityMPerSec).toBeGreaterThan(result.bohmVelocityMPerSec * 8);
    expect(end.xUm).toBeCloseTo(result.childLangmuirSheathUm, 0);
  });
});
