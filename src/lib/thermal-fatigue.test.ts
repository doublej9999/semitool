import { describe, expect, it } from 'vitest';
import {
  calculateAccelerationFactor,
  calculateCoffinMansonNf,
  calculateDnpMm,
  calculateShearStrainRange,
  calculateThermalFatigue,
  DIE_PRESETS,
  SOLDER_ALLOY_PRESETS,
  SUBSTRATE_PRESETS,
  TEST_CONDITION_PRESETS,
} from './thermal-fatigue';

describe('thermal-fatigue presets', () => {
  it('contains expected presets with physically valid properties', () => {
    expect(SUBSTRATE_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(DIE_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(SOLDER_ALLOY_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(TEST_CONDITION_PRESETS.length).toBeGreaterThanOrEqual(3);

    const fr4 = SUBSTRATE_PRESETS.find((p) => p.id === 'fr4');
    expect(fr4?.ctePpm).toBe(15.0);

    const si = DIE_PRESETS.find((p) => p.id === 'si');
    expect(si?.ctePpm).toBe(2.6);

    const sac305 = SOLDER_ALLOY_PRESETS.find((p) => p.id === 'sac305');
    expect(sac305?.epsilonF).toBe(0.325);
    expect(sac305?.c).toBe(-0.47);

    const snpb = SOLDER_ALLOY_PRESETS.find((p) => p.id === 'sn63pb37');
    expect(snpb?.epsilonF).toBe(0.30);
    expect(snpb?.c).toBe(-0.50);

    const jedecB = TEST_CONDITION_PRESETS.find((p) => p.id === 'jedec-b');
    expect(jedecB?.tMinC).toBe(-40);
    expect(jedecB?.tMaxC).toBe(125);
  });
});

describe('thermal-fatigue formulas', () => {
  it('calculates Distance to Neutral Point (DNP)', () => {
    // 10 mm x 10 mm die -> diagonal = sqrt(200) ≈ 14.1421356 mm, DNP = 7.0710678 mm
    const dnp = calculateDnpMm(10, 10);
    expect(dnp).toBeCloseTo(Math.sqrt(200) / 2, 6);

    // 6 mm x 8 mm die -> diagonal = 10 mm, DNP = 5.0 mm
    expect(calculateDnpMm(6, 8)).toBe(5.0);
  });

  it('calculates Engelmaier shear strain range Delta_gamma', () => {
    // DNP = 5 mm = 5000 µm
    // Delta alpha = 15 - 2.6 = 12.4 ppm/°C = 12.4e-6
    // Delta T = 165 °C (-40 to 125)
    // Bump height = 100 µm
    // Delta_gamma = (5 * 1e3 * 12.4 * 1e-6 * 165) / 100
    //             = (5000 * 12.4e-6 * 165) / 100 = 0.1023 (10.23%)
    const strain = calculateShearStrainRange(5, 12.4, 165, 100);
    expect(strain).toBeCloseTo(0.1023, 6);
  });

  it('calculates Coffin-Manson cycles to failure Nf for SAC305 and SnPb', () => {
    // Delta_gamma = 0.05
    // For SAC305: epsilon_f = 0.325, c = -0.47
    // ratio = 0.05 / (2 * 0.325) = 0.05 / 0.65 = 1 / 13
    // Nf = 0.5 * (1/13)^(1 / -0.47) = 0.5 * 13^(1/0.47)
    const sacNf = calculateCoffinMansonNf(0.05, 0.325, -0.47);
    const expectedSac = 0.5 * Math.pow(0.05 / (2 * 0.325), 1 / -0.47);
    expect(sacNf).toBeCloseTo(expectedSac, 4);
    expect(sacNf).toBeGreaterThan(100);

    // For Sn63Pb37: epsilon_f = 0.30, c = -0.50
    // ratio = 0.05 / 0.60 = 1 / 12
    // 1 / c = -2 -> (1/12)^(-2) = 144
    // Nf = 0.5 * 144 = 72
    const snpbNf = calculateCoffinMansonNf(0.05, 0.30, -0.50);
    expect(snpbNf).toBeCloseTo(72, 4);
  });

  it('calculates Acceleration Factor (AF)', () => {
    // Delta_T_test = 165°C, Delta_T_field = 45°C, m = 1.9
    // AF = (165 / 45)^1.9 = (3.666667)^1.9
    const af = calculateAccelerationFactor(165, 45, 1.9);
    const expectedAf = Math.pow(165 / 45, 1.9);
    expect(af).toBeCloseTo(expectedAf, 5);
    expect(af).toBeGreaterThan(10);
  });
});

describe('calculateThermalFatigue end-to-end', () => {
  it('computes full analysis for standard FCBGA package under JEDEC B', () => {
    const res = calculateThermalFatigue({
      dieWidthMm: 10,
      dieHeightMm: 10,
      bumpHeightUm: 100,
      substrateCtePpm: 15.0, // FR4
      dieCtePpm: 2.6,        // Silicon
      epsilonF: 0.325,       // SAC305
      c: -0.47,
      tMinC: -40,
      tMaxC: 125,
      fieldDeltaTC: 45,
      accelerationExponentM: 1.9,
      cyclesPerDay: 4,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.deltaTTestC).toBe(165);
    expect(res.deltaAlphaPpm).toBeCloseTo(12.4, 4);
    expect(res.dnpMm).toBeCloseTo(Math.sqrt(200) / 2, 4);
    expect(res.deltaGammaPct).toBeGreaterThan(0);
    expect(res.nf).toBeGreaterThan(0);
    expect(res.af).toBeGreaterThan(1);
    expect(res.fieldCycles).toBe(res.nf * res.af);
    expect(res.fieldYears).toBeCloseTo(res.fieldCycles / (4 * 365), 3);
  });

  it('validates invalid inputs properly', () => {
    // Non-positive die dimensions
    expect(
      calculateThermalFatigue({
        dieWidthMm: 0,
        dieHeightMm: 10,
        bumpHeightUm: 100,
        substrateCtePpm: 15,
        dieCtePpm: 2.6,
        epsilonF: 0.325,
        c: -0.47,
        tMinC: -40,
        tMaxC: 125,
      }).ok,
    ).toBe(false);

    // Tmax <= Tmin
    expect(
      calculateThermalFatigue({
        dieWidthMm: 10,
        dieHeightMm: 10,
        bumpHeightUm: 100,
        substrateCtePpm: 15,
        dieCtePpm: 2.6,
        epsilonF: 0.325,
        c: -0.47,
        tMinC: 100,
        tMaxC: 100,
      }).ok,
    ).toBe(false);

    // Positive fatigue exponent (must be negative)
    expect(
      calculateThermalFatigue({
        dieWidthMm: 10,
        dieHeightMm: 10,
        bumpHeightUm: 100,
        substrateCtePpm: 15,
        dieCtePpm: 2.6,
        epsilonF: 0.325,
        c: 0.5,
        tMinC: -40,
        tMaxC: 125,
      }).ok,
    ).toBe(false);

    // Zero CTE mismatch
    expect(
      calculateThermalFatigue({
        dieWidthMm: 10,
        dieHeightMm: 10,
        bumpHeightUm: 100,
        substrateCtePpm: 2.6,
        dieCtePpm: 2.6,
        epsilonF: 0.325,
        c: -0.47,
        tMinC: -40,
        tMaxC: 125,
      }).ok,
    ).toBe(false);
  });
});
