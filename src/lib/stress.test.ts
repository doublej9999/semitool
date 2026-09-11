
import { describe, expect, it } from 'vitest';
import { calculateFilmStress, radiusFromBow, THICKNESS_RATIO_LIMIT } from './stress';

describe('calculateFilmStress', () => {
  it('applies the Stoney relation with the substrate biaxial modulus', () => {
    const result = calculateFilmStress({
      filmThicknessM: 100e-9,
      substrateThicknessM: 775e-6,
      youngsModulusPa: 130e9,
      poissonRatio: 0.28,
      radiusM: 100,
      tensile: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.biaxialModulusPa).toBeCloseTo(180555555555.55557, 3);
    expect(result.magnitudePa).toBeCloseTo(1807436342.592593, 3);
    expect(result.stressPa).toBeCloseTo(1807436342.592593, 3);
    expect(result.tensile).toBe(true);
    expect(result.thicknessRatio).toBeCloseTo(0.00012903225806451613, 12);
    expect(result.ratioWithinStoney).toBe(true);
  });

  it('signs a compressive film negative', () => {
    const result = calculateFilmStress({
      filmThicknessM: 100e-9,
      substrateThicknessM: 775e-6,
      youngsModulusPa: 130e9,
      poissonRatio: 0.28,
      radiusM: 100,
      tensile: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stressPa).toBeCloseTo(-1807436342.592593, 3);
    expect(result.magnitudePa).toBeCloseTo(1807436342.592593, 3);
  });

  it('flags a film too thick for the Stoney assumption', () => {
    const result = calculateFilmStress({
      filmThicknessM: 20e-6,
      substrateThicknessM: 775e-6,
      youngsModulusPa: 130e9,
      poissonRatio: 0.28,
      radiusM: 100,
      tensile: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ratioWithinStoney).toBe(false);
    expect(result.thicknessRatio).toBeGreaterThan(THICKNESS_RATIO_LIMIT);
  });

  it('rejects a poison ratio outside a stable isotropic range', () => {
    const result = calculateFilmStress({
      filmThicknessM: 100e-9,
      substrateThicknessM: 775e-6,
      youngsModulusPa: 130e9,
      poissonRatio: 0.5,
      radiusM: 100,
      tensile: true,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('Poisson');
  });
});

describe('radiusFromBow', () => {
  it('uses the exact chord and sagitta relation', () => {
    const result = radiusFromBow(100e-3, 10e-6);
    expect(result.ok).toBe(true);
    expect(result.radiusM).toBeCloseTo(125.00000500000002, 6);
  });

  it('approaches the small-deflection form for a gentle bow', () => {
    const result = radiusFromBow(100e-3, 1e-6);
    expect(result.ok).toBe(true);
    expect(result.radiusM).toBeCloseTo(1250.0000005, 4);
  });

  it('rejects a bow that leaves no valid chord', () => {
    const result = radiusFromBow(0.1, 0.06);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('half the scan length');
  });

  it('rejects non-positive inputs', () => {
    expect(radiusFromBow(0, 1e-6).ok).toBe(false);
    expect(radiusFromBow(0.1, 0).ok).toBe(false);
  });
});
