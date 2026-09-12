import { describe, expect, it } from 'vitest';
import {
  calculateFilmColor,
  filmReflectance,
  siliconRefractiveIndex,
  FILM_MATERIALS,
  PLISKIN_OXIDE_BANDS,
  xyzToSrgb,
} from './film-color';

describe('film-color physics and optical calculation', () => {
  it('calculates silicon substrate refractive index dispersion', () => {
    // n_si(lambda) = 3.5 + 2e5 / lambda^2
    const n550 = siliconRefractiveIndex(550);
    expect(n550).toBeCloseTo(3.5 + 2e5 / (550 * 550), 4);
    expect(n550).toBeGreaterThan(3.5);
    expect(n550).toBeLessThan(4.5);
  });

  it('zero thickness gives bare silicon reflectance and color', () => {
    const result = calculateFilmColor({ thicknessNm: 0, refractiveIndex: 1.46 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.opticalThicknessNm).toBe(0);
    expect(result.classicColorName).toContain('Bare Silicon');

    // For thickness 0, reflectance R at 550nm equals bare silicon reflection
    const r550 = filmReflectance(550, 0, 1.46);
    const nSi550 = siliconRefractiveIndex(550);
    const bareR = Math.pow((1 - nSi550) / (1 + nSi550), 2);
    expect(r550).toBeCloseTo(bareR, 5);

    // Bare silicon reflected color is grayish / neutral metallic
    // R, G, and B should be close to each other
    expect(Math.abs(result.rgb.r - result.rgb.g)).toBeLessThan(20);
    expect(Math.abs(result.rgb.g - result.rgb.b)).toBeLessThan(20);
  });

  it('ensures reflectance R is strictly bounded in [0, 1]', () => {
    const testCases = [
      { d: 50, n: 1.46 },
      { d: 100, n: 2.0 },
      { d: 250, n: 1.46 },
      { d: 500, n: 2.5 },
      { d: 1000, n: 1.46 },
    ];

    for (const { d, n } of testCases) {
      for (let lambda = 380; lambda <= 750; lambda += 25) {
        const r = filmReflectance(lambda, d, n);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
      }
    }
  });

  it('identifies characteristic interference hues for SiO2 on silicon', () => {
    // 100 nm SiO2: Violet / Cobalt Blue hue (high blue component, lower green/red)
    const res100 = calculateFilmColor({ thicknessNm: 100, refractiveIndex: 1.46 });
    expect(res100.ok).toBe(true);
    if (res100.ok) {
      expect(res100.rgb.b).toBeGreaterThan(res100.rgb.r);
      expect(res100.rgb.b).toBeGreaterThan(res100.rgb.g);
      expect(res100.classicColorName.toLowerCase()).toMatch(/blue|violet/);
    }

    // 280 nm SiO2: Carnation Pink / Rose hue (elevated red and blue over green)
    const res280 = calculateFilmColor({ thicknessNm: 280, refractiveIndex: 1.46 });
    expect(res280.ok).toBe(true);
    if (res280.ok) {
      expect(res280.rgb.r).toBeGreaterThan(res280.rgb.g);
      expect(res280.rgb.b).toBeGreaterThan(res280.rgb.g);
      expect(res280.classicColorName.toLowerCase()).toMatch(/pink|rose/);
    }

    // 400 nm SiO2: Green-Yellow / Pale Green hue (green/red dominant over blue)
    const res400 = calculateFilmColor({ thicknessNm: 400, refractiveIndex: 1.46 });
    expect(res400.ok).toBe(true);
    if (res400.ok) {
      expect(res400.rgb.g).toBeGreaterThan(res400.rgb.b);
      expect(res400.rgb.r).toBeGreaterThan(res400.rgb.b);
      expect(res400.classicColorName.toLowerCase()).toMatch(/green|yellow/);
    }
  });

  it('formats hex color as valid 7-character #RRGGBB', () => {
    const hexRegex = /^#[0-9A-F]{6}$/;

    const res50 = calculateFilmColor({ thicknessNm: 50, refractiveIndex: 1.46 });
    expect(res50.ok).toBe(true);
    if (res50.ok) {
      expect(res50.hexColor).toMatch(hexRegex);
    }

    const res200 = calculateFilmColor({ thicknessNm: 200, refractiveIndex: 2.0 });
    expect(res200.ok).toBe(true);
    if (res200.ok) {
      expect(res200.hexColor).toMatch(hexRegex);
    }
  });

  it('validates input ranges and rejects illegal values', () => {
    const negThickness = calculateFilmColor({ thicknessNm: -10, refractiveIndex: 1.46 });
    expect(negThickness.ok).toBe(false);

    const nanThickness = calculateFilmColor({ thicknessNm: Number.NaN, refractiveIndex: 1.46 });
    expect(nanThickness.ok).toBe(false);

    const lowIndex = calculateFilmColor({ thicknessNm: 100, refractiveIndex: 0.9 });
    expect(lowIndex.ok).toBe(false);

    const indexOne = calculateFilmColor({ thicknessNm: 100, refractiveIndex: 1.0 });
    expect(indexOne.ok).toBe(false);
  });

  it('detects interference peaks and troughs across the visible spectrum', () => {
    // At 500 nm SiO2, multiple constructive and destructive fringes occur in visible light (380-750 nm)
    const res500 = calculateFilmColor({ thicknessNm: 500, refractiveIndex: 1.46 });
    expect(res500.ok).toBe(true);
    if (res500.ok) {
      expect(res500.constructivePeaks.length).toBeGreaterThanOrEqual(1);
      expect(res500.destructiveTroughs.length).toBeGreaterThanOrEqual(1);

      for (const peak of res500.constructivePeaks) {
        expect(peak).toBeGreaterThanOrEqual(380);
        expect(peak).toBeLessThanOrEqual(750);
      }
      for (const trough of res500.destructiveTroughs) {
        expect(trough).toBeGreaterThanOrEqual(380);
        expect(trough).toBeLessThanOrEqual(750);
      }
    }
  });

  it('exposes preset materials including SiO2, Si3N4, TiO2', () => {
    expect(FILM_MATERIALS.length).toBeGreaterThanOrEqual(4);
    const sio2 = FILM_MATERIALS.find((m) => m.id === 'sio2');
    const si3n4 = FILM_MATERIALS.find((m) => m.id === 'si3n4');
    const tio2 = FILM_MATERIALS.find((m) => m.id === 'tio2');

    expect(sio2?.refractiveIndex).toBeCloseTo(1.46, 2);
    expect(si3n4?.refractiveIndex).toBeCloseTo(2.0, 2);
    expect(tio2?.refractiveIndex).toBeCloseTo(2.5, 2);
  });

  it('contains comprehensive Pliskin oxide color bands', () => {
    expect(PLISKIN_OXIDE_BANDS.length).toBeGreaterThan(15);
    expect(PLISKIN_OXIDE_BANDS[0].name).toContain('Silicon');
    expect(PLISKIN_OXIDE_BANDS.some((b) => b.name.includes('Carnation Pink'))).toBe(true);
    expect(PLISKIN_OXIDE_BANDS.some((b) => b.name.includes('Cobalt Blue'))).toBe(true);
  });

  it('converts XYZ to sRGB correctly', () => {
    // D65 reference white (X=0.95047, Y=1.0, Z=1.08883) should map to #FFFFFF
    const white = xyzToSrgb(0.95047, 1.0, 1.08883);
    expect(white.hex).toBe('#FFFFFF');
    expect(white.r).toBe(255);
    expect(white.g).toBe(255);
    expect(white.b).toBe(255);

    // Black (0, 0, 0)
    const black = xyzToSrgb(0, 0, 0);
    expect(black.hex).toBe('#000000');
    expect(black.r).toBe(0);
    expect(black.g).toBe(0);
    expect(black.b).toBe(0);
  });
});
