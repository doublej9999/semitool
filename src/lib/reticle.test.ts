
import { describe, expect, it } from 'vitest';
import { calculateReticleField, countCentresInCircle } from './reticle';

const base = {
  fieldWidth: 26,
  fieldHeight: 33,
  fieldUnit: 'mm' as const,
  dieWidth: 5,
  dieHeight: 5,
  dieUnit: 'mm' as const,
  scribe: 0.1,
  scribeUnit: 'mm' as const,
};

describe('countCentresInCircle', () => {
  it('counts a grid point when its centre is inside the circle', () => {
    expect(countCentresInCircle(10, 10, 10)).toBe(5);
    expect(countCentresInCircle(9.9, 10, 10)).toBe(1);
    expect(countCentresInCircle(20, 10, 10)).toBe(13);
  });
});

describe('calculateReticleField', () => {
  it('fits whole dice into the field on both axes', () => {
    const result = calculateReticleField(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.pitchXMm).toBeCloseTo(5.1, 12);
    expect(result.pitchYMm).toBeCloseTo(5.1, 12);
    expect(result.diesPerFieldX).toBe(5);
    expect(result.diesPerFieldY).toBe(6);
    expect(result.diesPerField).toBe(30);
  });

  it('reports how much of the field the dice actually cover', () => {
    const result = calculateReticleField(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.fieldAreaMm2).toBeCloseTo(858, 12);
    expect(result.dieAreaMm2).toBeCloseTo(25, 12);
    expect(result.fieldUtilizationPercent).toBeCloseTo(87.4126, 3);
  });

  it('counts the shots per wafer and the dice they can carry', () => {
    const result = calculateReticleField({ ...base, waferDiameter: 300, waferUnit: 'mm', edgeExclusion: 3, edgeExclusionUnit: 'mm' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.usableRadiusMm).toBeCloseTo(147, 12);
    expect(result.shotsPerWafer).toBe(83);
    expect(result.diesPerWaferUpperBound).toBe(83 * 30);
  });

  it('adds the scribe lane to the die pitch but not to the die area', () => {
    const withScribe = calculateReticleField(base);
    const withoutScribe = calculateReticleField({ ...base, scribe: 0 });
    expect(withScribe.ok && withoutScribe.ok).toBe(true);
    if (!withScribe.ok || !withoutScribe.ok) return;

    expect(withoutScribe.pitchXMm).toBeCloseTo(5, 12);
    expect(withScribe.pitchXMm).toBeCloseTo(5.1, 12);
    expect(withoutScribe.dieAreaMm2).toBeCloseTo(withScribe.dieAreaMm2, 12);
  });

  it('lets a wider scribe lane reduce how many dice fit in the field', () => {
    const tight = calculateReticleField({ ...base, dieWidth: 5.2, dieHeight: 5.2, scribe: 0 });
    const wide = calculateReticleField({ ...base, dieWidth: 5.2, dieHeight: 5.2, scribe: 0.2 });
    expect(tight.ok && wide.ok).toBe(true);
    if (!tight.ok || !wide.ok) return;

    // 26 / 5.2 gives five dice across; with a 0.2 mm lane the pitch is 5.4 and only four fit.
    expect(tight.diesPerFieldX).toBe(5);
    expect(wide.diesPerFieldX).toBe(4);
    expect(wide.diesPerField).toBeLessThan(tight.diesPerField);
    expect(wide.fieldUtilizationPercent).toBeLessThan(tight.fieldUtilizationPercent);
  });

  it('converts field, die and scribe units to a common one', () => {
    const millimetres = calculateReticleField(base);
    const converted = calculateReticleField({
      ...base,
      fieldWidth: 2.6,
      fieldHeight: 3.3,
      fieldUnit: 'cm',
      dieWidth: 5000,
      dieHeight: 5000,
      dieUnit: 'µm',
      scribe: 100,
      scribeUnit: 'µm',
    });
    expect(millimetres.ok && converted.ok).toBe(true);
    if (!millimetres.ok || !converted.ok) return;

    expect(converted.diesPerField).toBe(millimetres.diesPerField);
    expect(converted.fieldAreaMm2).toBeCloseTo(millimetres.fieldAreaMm2, 9);
  });

  it('omits the shot count when no wafer is supplied', () => {
    const result = calculateReticleField(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.shotsPerWafer).toBeNull();
    expect(result.diesPerWaferUpperBound).toBeNull();
    expect(result.usableRadiusMm).toBeNull();
  });

  it('rejects a die that does not fit in the field', () => {
    const result = calculateReticleField({ ...base, dieWidth: 30, dieHeight: 30 });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors.join(' ')).toContain('does not fit');
  });

  it('rejects invalid numbers instead of treating them as zero', () => {
    const result = calculateReticleField({ ...base, fieldWidth: Number.NaN, scribe: -1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors.join(' ')).toContain('Field width');
    expect(result.errors.join(' ')).toContain('Scribe lane');
  });

  it('rejects an edge exclusion that would remove the whole wafer', () => {
    const result = calculateReticleField({ ...base, waferDiameter: 300, waferUnit: 'mm', edgeExclusion: 150, edgeExclusionUnit: 'mm' });
    expect(result.ok).toBe(false);
  });
});
