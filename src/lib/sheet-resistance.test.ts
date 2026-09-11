
import { describe, expect, it } from 'vitest';
import {
  FOUR_POINT_FACTOR,
  THIN_FILM_RATIO_LIMIT,
  calculateSheetResistance,
  convertSheetAndResistivity,
  resistivityFromSheet,
  sheetFromResistivity,
} from './sheet-resistance';
import { toCm } from './units';

const base = {
  spacing: 1,
  spacingUnit: 'mm' as const,
  current: 1,
  currentUnit: 'mA' as const,
  voltage: 100,
  voltageUnit: 'mV' as const,
  thickness: 100,
  thicknessUnit: 'nm' as const,
};

describe('calculateSheetResistance', () => {
  it('scales the measured V / I by the geometric factor pi / ln 2', () => {
    const result = calculateSheetResistance(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 100 mV / 1 mA = 100 ohms, scaled by 4.5324 (pi / ln 2).
    expect(result.sheetResistance).toBeCloseTo(FOUR_POINT_FACTOR * 100, 9);
    expect(result.sheetResistance).toBeCloseTo(453.23601418271944, 9);
    expect(result.resistivity).toBeCloseTo(453.23601418271944 * 1e-5, 12);
    expect(result.conductivity * result.resistivity).toBeCloseTo(1, 12);
  });

  it('is independent of probe spacing while the film stays thin', () => {
    const a = calculateSheetResistance(base);
    const b = calculateSheetResistance({ ...base, spacing: 1.5 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    expect(a.sheetResistance).toBeCloseTo(b.sheetResistance, 12);
    expect(a.thicknessOverSpacing).not.toBeCloseTo(b.thicknessOverSpacing, 9);
  });

  it('gives the same answer for the same measurement in different units', () => {
    const metric = calculateSheetResistance(base);
    const si = calculateSheetResistance({ ...base, current: 1e-3, currentUnit: 'A', voltage: 0.1, voltageUnit: 'V' });
    expect(metric.ok && si.ok).toBe(true);
    if (!metric.ok || !si.ok) return;

    expect(si.sheetResistance).toBeCloseTo(metric.sheetResistance, 12);
  });

  it('reports the thickness and spacing in the same unit the ratio uses', () => {
    const result = calculateSheetResistance(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.thicknessCm).toBeCloseTo(toCm(100, 'nm'), 15);
    expect(result.spacingCm).toBeCloseTo(0.1, 12);
    expect(result.thicknessOverSpacing).toBeCloseTo(1e-4, 12);
    expect(result.thinFilmValid).toBe(true);
  });

  it('flags a film that is too thick for the thin-film relation', () => {
    const thick = calculateSheetResistance({ ...base, thickness: 1, thicknessUnit: 'mm' });
    expect(thick.ok).toBe(true);
    if (!thick.ok) return;

    expect(thick.thicknessOverSpacing).toBeCloseTo(1, 12);
    expect(thick.thicknessOverSpacing).toBeGreaterThan(THIN_FILM_RATIO_LIMIT);
    expect(thick.thinFilmValid).toBe(false);
  });

  it('reports every invalid field instead of quietly using zero', () => {
    const result = calculateSheetResistance({ ...base, current: 0, thickness: Number.NaN });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toHaveLength(2);
    expect(result.errors.join(' ')).toContain('Measured current');
    expect(result.errors.join(' ')).toContain('Film thickness');
  });
});

describe('sheet resistance and resistivity', () => {
  it('are the same number scaled by thickness, in both directions', () => {
    const thicknessCm = toCm(100, 'nm');
    expect(resistivityFromSheet(100, thicknessCm)).toBeCloseTo(1e-3, 12);
    expect(sheetFromResistivity(1e-3, thicknessCm)).toBeCloseTo(100, 9);
  });

  it('derives whichever value was not supplied', () => {
    const fromSheet = convertSheetAndResistivity({
      sheetResistance: 100,
      resistivity: Number.NaN,
      thickness: 100,
      thicknessUnit: 'nm',
    });
    const fromRho = convertSheetAndResistivity({
      sheetResistance: Number.NaN,
      resistivity: 1e-3,
      thickness: 100,
      thicknessUnit: 'nm',
    });

    expect(fromSheet.ok && fromRho.ok).toBe(true);
    if (!fromSheet.ok || !fromRho.ok) return;

    expect(fromSheet.resistivity).toBeCloseTo(1e-3, 12);
    expect(fromRho.sheetResistance).toBeCloseTo(100, 9);
    expect(fromSheet.sheetResistance).toBeCloseTo(fromRho.sheetResistance, 9);
  });

  it('refuses to guess when both values or neither value are given', () => {
    const both = convertSheetAndResistivity({
      sheetResistance: 100,
      resistivity: 1e-3,
      thickness: 100,
      thicknessUnit: 'nm',
    });
    const neither = convertSheetAndResistivity({
      sheetResistance: Number.NaN,
      resistivity: Number.NaN,
      thickness: 100,
      thicknessUnit: 'nm',
    });

    expect(both.ok).toBe(false);
    expect(neither.ok).toBe(false);
  });

  it('rejects a thickness that is not a positive number', () => {
    const result = convertSheetAndResistivity({
      sheetResistance: 100,
      resistivity: Number.NaN,
      thickness: 0,
      thicknessUnit: 'nm',
    });
    expect(result.ok).toBe(false);
  });
});
