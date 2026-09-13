import { describe, expect, it } from 'vitest';
import {
  calculateRecipeVolumes,
  solveC1V1,
  RECIPE_PRESETS,
} from './chemical-dilution';

describe('Chemical Dilution & RCA Wet Bench Physics', () => {
  it('calculates RCA SC-1 1:1:5 volumetric recipe breakdown', () => {
    const sc1 = RECIPE_PRESETS.find((p) => p.id === 'sc1-standard')!;
    expect(sc1).toBeDefined();

    // 7 Liters bath
    const result = calculateRecipeVolumes(sc1, 7);
    expect(result.totalVolumeLiters).toBe(7);
    expect(result.components).toHaveLength(3);

    // Total parts = 1 + 1 + 5 = 7
    // NH4OH: 1L (1000 mL)
    const nh4oh = result.components.find((c) => c.chemicalKey === 'nh4oh')!;
    expect(nh4oh.volumeLiters).toBeCloseTo(1.0, 3);
    expect(nh4oh.volumeMl).toBeCloseTo(1000, 1);
    expect(nh4oh.massGrams).toBeCloseTo(900, 1); // 1000 mL * 0.90 g/mL
    expect(nh4oh.activeChemicalMassGrams).toBeCloseTo(261, 1); // 900 * 0.29

    // H2O2: 1L (1000 mL)
    const h2o2 = result.components.find((c) => c.chemicalKey === 'h2o2')!;
    expect(h2o2.volumeLiters).toBeCloseTo(1.0, 3);
    expect(h2o2.massGrams).toBeCloseTo(1110, 1); // 1000 * 1.11

    // DI Water: 5L (5000 mL)
    const water = result.components.find((c) => c.chemicalKey === 'water')!;
    expect(water.volumeLiters).toBeCloseTo(5.0, 3);
    expect(water.massGrams).toBeCloseTo(5000, 1);

    // Total mass = 900 + 1110 + 5000 = 7010 g
    expect(result.totalMassGrams).toBeCloseTo(7010, 1);

    // Mass percentages sum to 100%
    const totalMassPct = result.components.reduce((sum, c) => sum + c.massPct, 0);
    expect(totalMassPct).toBeCloseTo(100, 2);
  });

  it('calculates Piranha 3:1 recipe and includes safety notices', () => {
    const piranha = RECIPE_PRESETS.find((p) => p.id === 'piranha-3-1')!;
    expect(piranha).toBeDefined();

    // 4 Liters total
    const result = calculateRecipeVolumes(piranha, 4);
    expect(result.totalVolumeLiters).toBe(4);
    expect(result.components).toHaveLength(2);

    // H2SO4: 3L, H2O2: 1L
    const h2so4 = result.components.find((c) => c.chemicalKey === 'h2so4')!;
    expect(h2so4.volumeLiters).toBeCloseTo(3.0, 3);
    expect(h2so4.massGrams).toBeCloseTo(3000 * 1.84, 1); // 5520 g

    expect(result.safetyNotes.length).toBeGreaterThan(0);
    expect(result.safetyNotes.some((n) => n.toLowerCase().includes('exothermic'))).toBe(true);
  });

  it('calculates DHF 50:1 oxide etch rate and time to clear', () => {
    const dhf = RECIPE_PRESETS.find((p) => p.id === 'dhf-50-1')!;
    expect(dhf.oxideEtchRateAngstromsPerMin).toBe(32);

    const result = calculateRecipeVolumes(dhf, 10.2); // 10.2 L
    expect(result.estimatedEtchRateAngstromsPerMin).toBe(32);
    // 100 nm = 1000 Å -> 1000 / 32 = 31.25 min
    expect(result.estimatedTimeToClear100nmMinutes).toBeCloseTo(31.25, 2);
  });

  it('solves C1*V1 = C2*V2 dilution correctly', () => {
    // Dilute 49% HF to 1% HF in a 5L bath
    const solved = solveC1V1({
      stockConcentration: 49,
      targetConcentration: 1,
      targetVolumeLiters: 5,
    });

    expect(solved.dilutionFactor).toBeCloseTo(49, 3);
    // V1 = (1 * 5) / 49 = 0.10204 L (~102.04 mL)
    expect(solved.stockVolumeLiters).toBeCloseTo(5 / 49, 4);
    expect(solved.stockVolumeMl).toBeCloseTo(102.04, 1);
    // V_water = 5 - 0.10204 = 4.89796 L (~4897.96 mL)
    expect(solved.solventWaterVolumeLiters).toBeCloseTo(5 - 5 / 49, 4);
  });
});
