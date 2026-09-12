import { describe, expect, it } from 'vitest';
import {
  calculateCarrierMobility,
  calculateDopingFromResistivity,
  calculateMobilityValue,
  calculateThermalVoltage,
  generateMobilityCurves,
  CAUGHEY_THOMAS_PARAMS,
} from './carrier-mobility';

describe('Carrier Mobility and Silicon Resistivity', () => {
  it('computes thermal voltage accurately at 300 K', () => {
    const vt = calculateThermalVoltage(300);
    expect(vt).toBeCloseTo(0.025852, 4);
  });

  it('computes intrinsic/lightly doped mobility limits at 300 K', () => {
    // Lightly doped limit (1e13 cm^-3)
    const muNLight = calculateMobilityValue('n-type', 1e13);
    const muPLight = calculateMobilityValue('p-type', 1e13);

    // Should approach mu_max (~1417 cm^2/Vs for electrons, ~470 for holes)
    expect(muNLight).toBeGreaterThan(1400);
    expect(muNLight).toBeLessThan(1418);

    expect(muPLight).toBeGreaterThan(465);
    expect(muPLight).toBeLessThan(471);
  });

  it('computes heavily doped mobility limits (impurity scattering limit)', () => {
    // Heavy doping (1e20 cm^-3)
    const muNHeavy = calculateMobilityValue('n-type', 1e20);
    const muPHeavy = calculateMobilityValue('p-type', 1e20);

    // Should approach mu_min (~65 for electrons, ~47.7 for holes)
    expect(muNHeavy).toBeGreaterThan(65);
    expect(muNHeavy).toBeLessThan(120);

    expect(muPHeavy).toBeGreaterThan(47.7);
    expect(muPHeavy).toBeLessThan(80);
  });

  it('evaluates forward mode: doping to resistivity and Einstein diffusivity', () => {
    const res = calculateCarrierMobility({
      dopantType: 'n-type',
      dopingCm3: 1e16,
      temperatureK: 300,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Electron mobility around ~1190 - 1300 cm^2/Vs at 1e16 cm^-3 (exact: ~1196 cm^2/Vs)
    expect(res.mobilityCm2PerVs).toBeGreaterThan(1180);
    expect(res.mobilityCm2PerVs).toBeLessThan(1350);

    // Resistivity rho = 1 / (q * N * mu)
    // q ~ 1.6e-19, N = 1e16, mu ~ 1250 => sigma ~ 2 S/cm => rho ~ 0.5 Ω·cm
    expect(res.resistivityOhmCm).toBeGreaterThan(0.4);
    expect(res.resistivityOhmCm).toBeLessThan(0.7);

    // Diffusivity D = mu * Vt ~ 1250 * 0.02585 ~ 32 cm^2/s
    expect(res.diffusivityCm2PerS).toBeGreaterThan(30);
    expect(res.diffusivityCm2PerS).toBeLessThan(36);
  });

  it('evaluates reverse solver: resistivity to doping concentration', () => {
    const targetRho = 1.0; // 1.0 Ω·cm p-type wafer
    const rev = calculateDopingFromResistivity({
      dopantType: 'p-type',
      resistivityOhmCm: targetRho,
      temperatureK: 300,
    });

    expect(rev.ok).toBe(true);
    if (!rev.ok) return;

    // Calculated resistivity should match target within tight tolerance
    expect(rev.resistivityOhmCm).toBeCloseTo(targetRho, 4);

    // Typical 1 Ω·cm p-type silicon has doping around 1.3e16 - 1.6e16 cm^-3
    expect(rev.dopingCm3).toBeGreaterThan(1.0e16);
    expect(rev.dopingCm3).toBeLessThan(2.0e16);
  });

  it('reverse solver matches roundtrip on n-type', () => {
    const initialN = 5e17;
    const fwd = calculateCarrierMobility({
      dopantType: 'n-type',
      dopingCm3: initialN,
    });

    expect(fwd.ok).toBe(true);
    if (!fwd.ok) return;

    const rev = calculateDopingFromResistivity({
      dopantType: 'n-type',
      resistivityOhmCm: fwd.resistivityOhmCm,
    });

    expect(rev.ok).toBe(true);
    if (!rev.ok) return;

    expect(rev.dopingCm3 / initialN).toBeCloseTo(1.0, 4);
    expect(rev.mobilityCm2PerVs).toBeCloseTo(fwd.mobilityCm2PerVs, 2);
  });

  it('validates invalid inputs appropriately', () => {
    const resBadN = calculateCarrierMobility({
      dopantType: 'n-type',
      dopingCm3: -100,
    });
    expect(resBadN.ok).toBe(false);

    const resBadRho = calculateDopingFromResistivity({
      dopantType: 'p-type',
      resistivityOhmCm: -5,
    });
    expect(resBadRho.ok).toBe(false);
  });

  it('generates mobility curve arrays properly', () => {
    const curves = generateMobilityCurves(4);
    expect(curves.dopingCm3.length).toBeGreaterThan(30);
    expect(curves.electrons.length).toBe(curves.dopingCm3.length);
    expect(curves.holes.length).toBe(curves.dopingCm3.length);

    // Electrons mobility is always higher than hole mobility in silicon
    expect(curves.electrons[0]).toBeGreaterThan(curves.holes[0]);
    expect(curves.electrons[curves.electrons.length - 1]).toBeGreaterThan(
      curves.holes[curves.holes.length - 1],
    );
  });

  it('has valid Caughey-Thomas model parameters', () => {
    expect(CAUGHEY_THOMAS_PARAMS['n-type'].muMax).toBe(1417.0);
    expect(CAUGHEY_THOMAS_PARAMS['p-type'].muMax).toBe(470.5);
  });
});
