import { describe, expect, it } from 'vitest';
import {
  ACCURACY_NOTES,
  DIELECTRICS,
  EPSILON_0_F_PER_M,
  estimateCapacitance,
  estimateIRDrop,
  estimateRcDelay,
  estimateResistance,
  getConductor,
  getDielectric,
  listConductors,
} from './layout-parasitics';

describe('layout-parasitics catalog', () => {
  it('provides literature-typical conductors and dielectrics', () => {
    const cu = getConductor('cu');
    expect(cu).toBeDefined();
    expect(cu?.kind).toBe('metal');
    if (cu?.kind === 'metal') {
      expect(cu.bulkResistivityUohmCm).toBeCloseTo(1.72, 6);
      expect(cu.tcrPerK).toBeCloseTo(0.0039, 6);
    }

    expect(getDielectric('sio2')?.k).toBeCloseTo(3.9, 6);
    expect(getDielectric('lowk')?.k).toBeCloseTo(2.7, 6);
    expect(getDielectric('airgap')?.k).toBeCloseTo(1.9, 6);

    const ids = listConductors().map((layer) => layer.id);
    expect(new Set(ids).size).toBe(ids.length);
    const dielIds = DIELECTRICS.map((d) => d.id);
    expect(new Set(dielIds).size).toBe(dielIds.length);
  });

  it('documents accuracy honestly', () => {
    expect(ACCURACY_NOTES.length).toBeGreaterThanOrEqual(3);
    expect(ACCURACY_NOTES.join(' ')).toMatch(/20–30 %|±20–30/);
  });
});

describe('estimateResistance', () => {
  it('computes a 1 mm × 0.18 µm × 0.3 µm Cu line with size-effect corrected ρ', () => {
    // Hand arithmetic:
    //   ρ_eff = 1.72 µΩ·cm × (1 + 0.05/0.18) = 2.1977778 µΩ·cm
    //   squares = 1000/0.18 = 5555.5556
    //   Rs = 0.01 × 2.1977778 / 0.3 = 0.0732593 Ω/□
    //   R = Rs × squares = 406.9959 Ω
    const res = estimateResistance({
      lengthUm: 1000,
      widthUm: 0.18,
      thicknessUm: 0.3,
      material: 'cu',
      temperatureC: 20,
    });
    expect(res.effectiveResistivityUohmCm).toBeCloseTo(2.1977778, 4);
    expect(res.squares).toBeCloseTo(5555.5556, 2);
    expect(res.sheetResistanceOhmSq).toBeCloseTo(0.0732593, 6);
    expect(res.resistanceOhm).toBeCloseTo(406.9959, 1);
    expect(res.warnings).toHaveLength(0);
  });

  it('lands near 1.8 µΩ·cm for wide Cu and ~3.0 µΩ·cm for Al', () => {
    const cuWide = estimateResistance({
      lengthUm: 100,
      widthUm: 2,
      thicknessUm: 0.5,
      material: 'cu',
      temperatureC: 20,
    });
    // 1.72 × (1 + 0.05/2) = 1.763 µΩ·cm
    expect(cuWide.effectiveResistivityUohmCm).toBeCloseTo(1.763, 4);
    expect(cuWide.resistanceOhm).toBeCloseTo(0.01 * 1.763 * (100 / (2 * 0.5)), 6);

    const al = estimateResistance({
      lengthUm: 1000,
      widthUm: 1,
      thicknessUm: 0.5,
      material: 'alcu',
      temperatureC: 20,
    });
    // 2.65 × (1 + 0.15/1) = 3.0475 µΩ·cm — the classic ~3.0 µΩ·cm Al-Cu line value
    expect(al.effectiveResistivityUohmCm).toBeCloseTo(3.0475, 4);
    expect(al.resistanceOhm).toBeCloseTo(60.95, 2);
    expect(al.sheetResistanceOhmSq).toBeCloseTo(0.06095, 6);
  });

  it('scales linearly with the TCR (Cu +0.0039/K)', () => {
    const ref = estimateResistance({ lengthUm: 1000, widthUm: 0.18, thicknessUm: 0.3, material: 'cu', temperatureC: 20 });
    const hot = estimateResistance({ lengthUm: 1000, widthUm: 0.18, thicknessUm: 0.3, material: 'cu', temperatureC: 120 });
    expect(hot.temperatureFactor).toBeCloseTo(1 + 0.0039 * 100, 9);
    expect(hot.resistanceOhm / ref.resistanceOhm).toBeCloseTo(1.39, 6);
    expect(hot.resistanceOhm).toBeCloseTo(565.72, 1);
  });

  it('computes poly from sheet resistance and ignores thickness for R', () => {
    const thin = estimateResistance({ lengthUm: 100, widthUm: 0.5, thicknessUm: 0.1, material: 'poly-doped', temperatureC: 20 });
    const thick = estimateResistance({ lengthUm: 100, widthUm: 0.5, thicknessUm: 1.0, material: 'poly-doped', temperatureC: 20 });

    expect(thin.materialKind).toBe('poly');
    expect(thin.squares).toBeCloseTo(200, 6);
    // Rs = 15 Ω/□ → R = 15 × 200 = 3000 Ω
    expect(thin.resistanceOhm).toBeCloseTo(3000, 6);
    expect(thick.resistanceOhm).toBeCloseTo(thin.resistanceOhm, 9);
    // Derived ρ readout only: Rs × t = 15 Ω/□ × 0.1 µm = 150 µΩ·cm
    expect(thin.effectiveResistivityUohmCm).toBeCloseTo(150, 4);

    const silicided = estimateResistance({ lengthUm: 100, widthUm: 0.5, thicknessUm: 0.05, material: 'poly-silicided', temperatureC: 20 });
    expect(silicided.resistanceOhm).toBeCloseTo(4 * 200, 6);
  });

  it('applies the poly TCR as well', () => {
    const hot = estimateResistance({ lengthUm: 100, widthUm: 0.5, thicknessUm: 0.1, material: 'poly-doped', temperatureC: 125 });
    // factor = 1 + 0.0015 × 105 = 1.1575 → R = 3000 × 1.1575 = 3472.5 Ω
    expect(hot.temperatureFactor).toBeCloseTo(1.1575, 9);
    expect(hot.resistanceOhm).toBeCloseTo(3472.5, 4);
  });

  it('clamps temperatures outside the validated window and warns', () => {
    const tooHot = estimateResistance({ lengthUm: 1000, widthUm: 0.18, thicknessUm: 0.3, material: 'cu', temperatureC: 300 });
    expect(tooHot.temperatureC).toBe(175);
    expect(tooHot.temperatureFactor).toBeCloseTo(1 + 0.0039 * 155, 9);
    expect(tooHot.warnings.length).toBeGreaterThan(0);

    const tooCold = estimateResistance({ lengthUm: 1000, widthUm: 0.18, thicknessUm: 0.3, material: 'cu', temperatureC: -100 });
    expect(tooCold.temperatureC).toBe(-55);
    expect(tooCold.temperatureFactor).toBeCloseTo(1 - 0.0039 * 75, 9);
    expect(tooCold.warnings.length).toBeGreaterThan(0);
  });

  it('caps the size-effect multiplier for unphysically narrow lines', () => {
    const nano = estimateResistance({ lengthUm: 10, widthUm: 0.001, thicknessUm: 0.01, material: 'cu', temperatureC: 20 });
    expect(nano.effectiveResistivityUohmCm).toBeCloseTo(17.2, 5); // 1.72 × cap(10)
    expect(nano.warnings.some((w) => /capped/i.test(w))).toBe(true);
  });

  it('is null-safe on invalid inputs', () => {
    const zeroWidth = estimateResistance({ lengthUm: 100, widthUm: 0, thicknessUm: 0.3, material: 'cu' });
    expect(zeroWidth.resistanceOhm).toBe(0);
    expect(zeroWidth.warnings.length).toBeGreaterThan(0);

    const nan = estimateResistance({ lengthUm: Number.NaN, widthUm: 1, thicknessUm: 0.3, material: 'cu' });
    expect(Number.isFinite(nan.resistanceOhm)).toBe(true);
    expect(nan.resistanceOhm).toBe(0);
    expect(nan.warnings.length).toBeGreaterThan(0);

    const unknown = estimateResistance({ lengthUm: 100, widthUm: 1, thicknessUm: 0.3, material: 'unobtainium' });
    expect(unknown.resistanceOhm).toBe(0);
    expect(unknown.warnings.some((w) => /Unknown material/i.test(w))).toBe(true);
  });
});

describe('estimateCapacitance', () => {
  it('combines plate and fringe for a 1 µm × 1 mm line over a plane', () => {
    // Hand arithmetic (µm units):
    //   plate length  = W·L/t = 1·1000/0.5 = 2000 µm
    //   fringe length = 2·(W+L)·ln(1+2t/s) = 2002·ln(3) = 2199.4218 µm
    //   C = k·ε0·(sum)·1e-6 F
    const cap = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 3.9 });

    const expectedPlate = 3.9 * EPSILON_0_F_PER_M * 2000 * 1e-6;
    const expectedFringe = 3.9 * EPSILON_0_F_PER_M * 2002 * Math.log(3) * 1e-6;

    expect(cap.plateCapacitanceF).toBeCloseTo(expectedPlate, 21);
    expect(cap.fringeCapacitanceF).toBeCloseTo(expectedFringe, 21);
    expect(cap.capacitanceF).toBeCloseTo(1.450116e-13, 18);
    expect(cap.capacitanceFf).toBeCloseTo(145.012, 1);
    expect(cap.fringeFraction).toBeCloseTo(0.5237, 3);
    expect(cap.warnings).toHaveLength(0);
  });

  it('exceeds the pure parallel-plate value and stays finite (fringe sanity)', () => {
    const cap = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 3.9 });
    expect(cap.capacitanceF).toBeGreaterThan(cap.plateCapacitanceF);
    expect(cap.fringeCapacitanceF).toBeGreaterThan(0);
    expect(cap.fringeFraction).toBeGreaterThan(0);
    expect(cap.fringeFraction).toBeLessThan(1);
  });

  it('scales linearly with the dielectric constant k', () => {
    const lowk = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 2.7 });
    const oxide = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 3.9 });
    expect(lowk.capacitanceF / oxide.capacitanceF).toBeCloseTo(2.7 / 3.9, 9);
  });

  it('replaces the plate area with the drawn overlap when given', () => {
    const base = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 3.9 });
    const overlapped = estimateCapacitance({
      lengthUm: 1000,
      widthUm: 1,
      thicknessUm: 0.5,
      spacingUm: 0.5,
      dielectricK: 3.9,
      overlapAreaUm2: 2 * 1000, // 2 × W·L → plate doubles, fringe unchanged
    });
    expect(overlapped.capacitanceF - base.capacitanceF).toBeCloseTo(base.plateCapacitanceF, 21);
    expect(overlapped.plateAreaUm2).toBe(2000);
  });

  it('reduces to the analytic parallel-plate capacitance in the no-fringe limit', () => {
    // Huge spacing → ln(1 + 2t/s) ≈ 0. C = k·ε0·A/d with A = 100 µm × 100 µm, d = 1 µm.
    const cap = estimateCapacitance({ lengthUm: 100, widthUm: 100, thicknessUm: 1, spacingUm: 1e6, dielectricK: 3.9 });
    const analytic = 3.9 * EPSILON_0_F_PER_M * ((100e-6 * 100e-6) / 1e-6);
    expect(cap.capacitanceF).toBeCloseTo(analytic, 18);
    expect(cap.capacitanceF).toBeCloseTo(3.4531332e-13, 18);
  });

  it('falls back safely when thickness/spacing are omitted', () => {
    const cap = estimateCapacitance({ lengthUm: 1000, widthUm: 1, dielectricK: 3.9 });
    expect(cap.dielectricThicknessUm).toBeCloseTo(1.0, 9);
    expect(cap.spacingUm).toBeCloseTo(1.0, 9);
    expect(cap.warnings.length).toBe(2);
    expect(Number.isFinite(cap.capacitanceF)).toBe(true);
    expect(cap.capacitanceF).toBeGreaterThan(0);
  });

  it('is null-safe on invalid inputs', () => {
    const zeroK = estimateCapacitance({ lengthUm: 100, widthUm: 1, thicknessUm: 0.5, dielectricK: 0 });
    expect(zeroK.capacitanceF).toBe(0);
    expect(zeroK.warnings.length).toBeGreaterThan(0);

    const nanWidth = estimateCapacitance({ lengthUm: 100, widthUm: Number.NaN, thicknessUm: 0.5, dielectricK: 3.9 });
    expect(nanWidth.capacitanceF).toBe(0);
    expect(nanWidth.warnings.length).toBeGreaterThan(0);

    const badOverlap = estimateCapacitance({
      lengthUm: 100,
      widthUm: 1,
      thicknessUm: 0.5,
      dielectricK: 3.9,
      overlapAreaUm2: -5,
    });
    expect(badOverlap.plateAreaUm2).toBeCloseTo(100, 9); // falls back to W·L
    expect(badOverlap.warnings.some((w) => /Overlap area/i.test(w))).toBe(true);
  });
});

describe('estimateIRDrop', () => {
  it('computes V = I·R with I in mA', () => {
    const drop = estimateIRDrop(406.9959, 1);
    expect(drop.voltageDropV).toBeCloseTo(0.4069959, 7);
    expect(drop.voltageDropMv).toBeCloseTo(406.9959, 4);
    expect(drop.vddVolt).toBeNull();
    expect(drop.dropPercentOfVdd).toBeNull();
  });

  it('reports the drop as a percentage of VDD when given', () => {
    const drop = estimateIRDrop(100, 2, 1.0);
    expect(drop.voltageDropV).toBeCloseTo(0.2, 9);
    expect(drop.dropPercentOfVdd).toBeCloseTo(20, 6);

    const pct = estimateIRDrop(407, 1, 1.2);
    expect(pct.dropPercentOfVdd).toBeCloseTo(33.9167, 3);
  });

  it('is null-safe on invalid inputs', () => {
    const negR = estimateIRDrop(-5, 1);
    expect(negR.voltageDropV).toBe(0);
    expect(negR.warnings.length).toBeGreaterThan(0);

    const nanI = estimateIRDrop(100, Number.NaN);
    expect(nanI.voltageDropV).toBe(0);
    expect(nanI.warnings.length).toBeGreaterThan(0);

    const badVdd = estimateIRDrop(100, 1, -1.2);
    expect(badVdd.vddVolt).toBeNull();
    expect(badVdd.dropPercentOfVdd).toBeNull();
    expect(badVdd.warnings.some((w) => /Supply voltage/i.test(w))).toBe(true);
  });
});

describe('estimateRcDelay', () => {
  it('returns 0.69·RC (50%) and 0.35·RC (10-90%) with clear labels', () => {
    const delay = estimateRcDelay(1000, 1e-12);
    expect(delay.rcTimeConstantS).toBeCloseTo(1e-9, 18);
    expect(delay.propDelay50S).toBeCloseTo(6.9e-10, 15);
    expect(delay.propDelay50Ps).toBeCloseTo(690, 6);
    expect(delay.riseTime10To90S).toBeCloseTo(3.5e-10, 15);
    expect(delay.riseTime10To90Ps).toBeCloseTo(350, 6);
  });

  it('propagates the Cu line + capacitance example end to end', () => {
    const res = estimateResistance({ lengthUm: 1000, widthUm: 0.18, thicknessUm: 0.3, material: 'cu', temperatureC: 20 });
    const cap = estimateCapacitance({ lengthUm: 1000, widthUm: 1, thicknessUm: 0.5, spacingUm: 0.5, dielectricK: 3.9 });
    const delay = estimateRcDelay(res.resistanceOhm, cap.capacitanceF);

    // RC = 406.9959 Ω × 1.450116e-13 F = 5.90191e-11 s = 59.019 ps
    expect(delay.rcTimeConstantS).toBeCloseTo(5.90191e-11, 16);
    expect(delay.propDelay50Ps).toBeCloseTo(40.72, 1); // 0.69 · RC
    expect(delay.riseTime10To90Ps).toBeCloseTo(20.66, 1); // 0.35 · RC
  });

  it('is null-safe on invalid inputs', () => {
    const bad = estimateRcDelay(Number.NaN, Number.NaN);
    expect(bad.rcTimeConstantS).toBe(0);
    expect(bad.propDelay50Ps).toBe(0);
    expect(bad.riseTime10To90Ps).toBe(0);
    expect(bad.warnings.length).toBeGreaterThan(0);
  });
});
