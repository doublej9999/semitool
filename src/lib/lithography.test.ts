
import { describe, expect, it } from 'vitest';
import { calculateLithography, K1_DIFFRACTION_LIMIT, WAVELENGTHS } from './lithography';

describe('calculateLithography', () => {
  it('applies the Rayleigh resolution and the depth of focus relation', () => {
    const result = calculateLithography({ wavelengthNm: 193, numericalAperture: 0.93, k1: 0.35, k2: 0.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolutionNm).toBeCloseTo(72.63440860215053, 10);
    expect(result.depthOfFocusNm).toBeCloseTo(111.57359232281188, 10);
    expect(result.naSquared).toBeCloseTo(0.8649, 10);
    expect(result.belowDiffractionLimit).toBe(false);
  });

  it('works at EUV wavelengths', () => {
    const result = calculateLithography({ wavelengthNm: 13.5, numericalAperture: 0.33, k1: 0.3, k2: 0.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolutionNm).toBeCloseTo(12.272727272727272, 10);
    expect(result.depthOfFocusNm).toBeCloseTo(61.98347107438016, 10);
  });

  it('flags a k1 below the two-beam diffraction limit', () => {
    const result = calculateLithography({ wavelengthNm: 193, numericalAperture: 0.93, k1: 0.2, k2: 0.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.belowDiffractionLimit).toBe(true);
    expect(K1_DIFFRACTION_LIMIT).toBe(0.25);
  });

  it('does not flag the limit itself', () => {
    const result = calculateLithography({ wavelengthNm: 193, numericalAperture: 0.93, k1: 0.25, k2: 0.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.belowDiffractionLimit).toBe(false);
  });

  it('rejects a numerical aperture beyond immersion lithography', () => {
    const result = calculateLithography({ wavelengthNm: 193, numericalAperture: 1.5, k1: 0.35, k2: 0.5 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('immersion');
  });

  it('reports every invalid input at once', () => {
    const result = calculateLithography({ wavelengthNm: 0, numericalAperture: Number.NaN, k1: -1, k2: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(4);
  });

  it('lists the common exposure wavelengths', () => {
    const euv = WAVELENGTHS.find((wavelength) => wavelength.id === 'euv');
    const arf = WAVELENGTHS.find((wavelength) => wavelength.id === 'arf');
    const krf = WAVELENGTHS.find((wavelength) => wavelength.id === 'krf');
    expect(euv?.nm).toBe(13.5);
    expect(arf?.nm).toBe(193);
    expect(krf?.nm).toBe(248);
  });
});
