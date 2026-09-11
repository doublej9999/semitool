
import { describe, expect, it } from 'vitest';
import { calculateWaferArea } from './wafer-area';

const base = {
  diameter: 300,
  diameterUnit: 'mm' as const,
  edgeExclusion: 3,
  edgeExclusionUnit: 'mm' as const,
  dieWidth: 10,
  dieHeight: 10,
  dieUnit: 'mm' as const,
};

describe('calculateWaferArea', () => {
  it('reports the full and the usable area', () => {
    const result = calculateWaferArea(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.waferAreaMm2).toBeCloseTo(Math.PI * 150 ** 2, 9);
    expect(result.waferAreaCm2).toBeCloseTo((Math.PI * 150 ** 2) / 100, 9);
    expect(result.usableDiameterMm).toBeCloseTo(294, 12);
    expect(result.usableAreaMm2).toBeCloseTo(Math.PI * 147 ** 2, 9);
    expect(result.usableAreaCm2).toBeCloseTo((Math.PI * 147 ** 2) / 100, 9);
  });

  it('expresses the edge exclusion loss as a share of the full wafer', () => {
    const result = calculateWaferArea(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Area scales with the square of the radius, so the ring is 1 - (147 / 150)^2.
    expect(result.edgeLossPercent).toBeCloseTo((1 - (147 / 150) ** 2) * 100, 9);
  });

  it('counts the whole dice that fit in the usable area', () => {
    const result = calculateWaferArea(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dieAreaMm2).toBeCloseTo(100, 12);
    expect(result.dieAreaCm2).toBeCloseTo(1, 12);
    expect(result.areaOnlyDieCount).toBe(678);
  });

  it('compares a measured die count against the area-only bound', () => {
    const result = calculateWaferArea({ ...base, dieCount: 665 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.utilizationPercent).toBeCloseTo(97.9574, 3);
    expect(result.packingEfficiencyPercent).toBeCloseTo(98.0826, 3);
    expect(result.packingEfficiencyPercent).toBeLessThanOrEqual(100);
  });

  it('leaves the utilisation figures empty when no die count is supplied', () => {
    const result = calculateWaferArea(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.utilizationPercent).toBeNull();
    expect(result.packingEfficiencyPercent).toBeNull();
  });

  it('converts the diameter and the edge exclusion from their own units', () => {
    const centimetres = calculateWaferArea({ ...base, diameter: 30, diameterUnit: 'cm', edgeExclusion: 0.3, edgeExclusionUnit: 'cm' });
    const millimetres = calculateWaferArea(base);
    expect(centimetres.ok && millimetres.ok).toBe(true);
    if (!centimetres.ok || !millimetres.ok) return;

    expect(centimetres.waferAreaMm2).toBeCloseTo(millimetres.waferAreaMm2, 9);
    expect(centimetres.usableAreaMm2).toBeCloseTo(millimetres.usableAreaMm2, 9);

    const inches = calculateWaferArea({ ...base, diameter: 12, diameterUnit: 'inch' });
    expect(inches.ok).toBe(true);
    if (!inches.ok) return;
    expect(inches.waferAreaMm2).toBeCloseTo(Math.PI * 152.4 ** 2, 9);
  });

  it('rejects an edge exclusion that would remove the whole wafer', () => {
    const result = calculateWaferArea({ ...base, edgeExclusion: 150 });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors.join(' ')).toContain('Edge exclusion');
  });

  it('rejects non-positive die dimensions', () => {
    const result = calculateWaferArea({ ...base, dieWidth: 0, dieHeight: Number.NaN });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toHaveLength(2);
    expect(result.errors.join(' ')).toContain('Die width');
    expect(result.errors.join(' ')).toContain('Die height');
  });

  it('rejects a negative measured die count', () => {
    const result = calculateWaferArea({ ...base, dieCount: -1 });
    expect(result.ok).toBe(false);
  });
});
