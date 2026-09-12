import { describe, expect, it } from 'vitest';
import {
  calculateIonImplantation,
  calculateProfileConcentration,
  erf,
  generateDepthProfile,
  interpolateRangeAndStraggle,
  parseScientificNumber,
  SPECIES_CATALOG,
} from './ion-implantation';

describe('ion-implantation models', () => {
  describe('erf', () => {
    it('calculates error function accurately', () => {
      expect(erf(0)).toBeCloseTo(0, 10);
      expect(erf(1)).toBeCloseTo(0.84270079, 7);
      expect(erf(2)).toBeCloseTo(0.99532226, 7);
      expect(erf(-1)).toBeCloseTo(-0.84270079, 7);
    });
  });

  describe('interpolateRangeAndStraggle', () => {
    it('returns exact tabulated Gibbons values for Boron at 50 keV', () => {
      const { rpNm, deltaRpNm } = interpolateRangeAndStraggle('B', 50);
      expect(rpNm).toBeCloseTo(175.2, 1);
      expect(deltaRpNm).toBeCloseTo(56.2, 1);
    });

    it('returns exact tabulated Gibbons values for Arsenic at 100 keV', () => {
      const { rpNm, deltaRpNm } = interpolateRangeAndStraggle('As', 100);
      expect(rpNm).toBeCloseTo(66.8, 1);
      expect(deltaRpNm).toBeCloseTo(21.9, 1);
    });

    it('interpolates smoothly between table entries (e.g. Phosphorus at 45 keV)', () => {
      const at40 = interpolateRangeAndStraggle('P', 40);
      const at45 = interpolateRangeAndStraggle('P', 45);
      const at50 = interpolateRangeAndStraggle('P', 50);

      expect(at45.rpNm).toBeGreaterThan(at40.rpNm);
      expect(at45.rpNm).toBeLessThan(at50.rpNm);
      expect(at45.deltaRpNm).toBeGreaterThan(at40.deltaRpNm);
      expect(at45.deltaRpNm).toBeLessThan(at50.deltaRpNm);
    });

    it('flags extrapolation when energy is outside 1 to 300 keV', () => {
      const below = interpolateRangeAndStraggle('BF2', 0.5);
      expect(below.isExtrapolated).toBe(true);

      const above = interpolateRangeAndStraggle('BF2', 400);
      expect(above.isExtrapolated).toBe(true);
    });
  });

  describe('calculateIonImplantation', () => {
    it('calculates peak concentration, surface concentration, and junction depth for Boron 50 keV', () => {
      const result = calculateIonImplantation({
        species: 'B',
        energyKeV: 50,
        doseCm2: 1e14,
        backgroundDopingCm3: 1e15,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.rpNm).toBeCloseTo(175.2, 1);
      expect(result.deltaRpNm).toBeCloseTo(56.2, 1);

      // deltaRp_cm = 56.2 * 1e-7 = 5.62e-6 cm
      // Np = 1e14 / (sqrt(2*pi) * 5.62e-6) ~ 7.0984e18 cm^-3
      const expectedNp = 1e14 / (Math.sqrt(2 * Math.PI) * (56.2 * 1e-7));
      expect(result.peakConcentrationCm3).toBeCloseTo(expectedNp, -14);

      // Surface concentration N(0) = Np * exp(- (175.2 / 56.2)^2 / 2)
      const expectedN0 = expectedNp * Math.exp(-0.5 * Math.pow(175.2 / 56.2, 2));
      expect(result.surfaceConcentrationCm3).toBeCloseTo(expectedN0, -14);

      // Junction depth xj solving N(xj) == Nb:
      // xj = Rp + deltaRp * sqrt(2 * ln(Np / Nb))
      const expectedXj = 175.2 + 56.2 * Math.sqrt(2 * Math.log(expectedNp / 1e15));
      expect(result.junctionDepthNm).not.toBeNull();
      expect(result.junctionDepthNm!).toBeCloseTo(expectedXj, 2);

      // Verify that N(xj) strictly matches background doping Nb
      const concAtXj = calculateProfileConcentration(
        result.junctionDepthNm!,
        result.peakConcentrationCm3,
        result.rpNm,
        result.deltaRpNm,
      );
      expect(concAtXj).toBeCloseTo(1e15, -11);

      // Retention fraction should be very close to 1.0 for B at 50 keV
      expect(result.retentionFraction).toBeGreaterThan(0.99);
      expect(result.retentionPercent).toBeGreaterThan(99);
    });

    it('supports custom Rp and deltaRp overrides', () => {
      const result = calculateIonImplantation({
        species: 'Custom',
        energyKeV: 80,
        doseCm2: 1e16,
        backgroundDopingCm3: 5e16,
        customRpNm: 100,
        customDeltaRpNm: 25,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.rpNm).toBe(100);
      expect(result.deltaRpNm).toBe(25);
      expect(result.rpUm).toBeCloseTo(0.1, 4);
      expect(result.deltaRpUm).toBeCloseTo(0.025, 5);

      // Peak conc: 1e16 / (sqrt(2*pi) * 25e-7) = 1.595769e21
      expect(result.peakConcentrationCm3).toBeCloseTo(1.595769e21, -17);

      // Warnings should trigger because peak concentration exceeds solid solubility (~1e21)
      expect(result.warnings.some((w) => w.includes('solid solubility'))).toBe(true);
    });

    it('handles no junction formed when peak concentration <= background doping', () => {
      const result = calculateIonImplantation({
        species: 'P',
        energyKeV: 30,
        doseCm2: 1e11, // very low dose
        backgroundDopingCm3: 1e17, // high background
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.peakConcentrationCm3).toBeLessThan(1e17);
      expect(result.junctionDepthNm).toBeNull();
      expect(result.warnings.some((w) => w.includes('no metallurgical junction'))).toBe(true);
    });

    it('validates invalid inputs rigorously', () => {
      // Non-positive dose
      expect(
        calculateIonImplantation({
          species: 'B',
          energyKeV: 50,
          doseCm2: 0,
          backgroundDopingCm3: 1e15,
        }).ok,
      ).toBe(false);

      expect(
        calculateIonImplantation({
          species: 'B',
          energyKeV: 50,
          doseCm2: -1e14,
          backgroundDopingCm3: 1e15,
        }).ok,
      ).toBe(false);

      // Non-positive background doping
      expect(
        calculateIonImplantation({
          species: 'B',
          energyKeV: 50,
          doseCm2: 1e14,
          backgroundDopingCm3: 0,
        }).ok,
      ).toBe(false);

      // Non-positive energy for standard species
      expect(
        calculateIonImplantation({
          species: 'As',
          energyKeV: -10,
          doseCm2: 1e14,
          backgroundDopingCm3: 1e15,
        }).ok,
      ).toBe(false);

      // Custom species with missing or invalid deltaRp
      expect(
        calculateIonImplantation({
          species: 'Custom',
          energyKeV: 50,
          doseCm2: 1e14,
          backgroundDopingCm3: 1e15,
          customRpNm: 100,
          customDeltaRpNm: 0,
        }).ok,
      ).toBe(false);

      expect(
        calculateIonImplantation({
          species: 'Custom',
          energyKeV: 50,
          doseCm2: 1e14,
          backgroundDopingCm3: 1e15,
          customRpNm: -10,
          customDeltaRpNm: 20,
        }).ok,
      ).toBe(false);
    });
  });

  describe('generateDepthProfile', () => {
    it('generates continuous valid profile points', () => {
      const calcResult = calculateIonImplantation({
        species: 'B',
        energyKeV: 40,
        doseCm2: 1e15,
        backgroundDopingCm3: 1e15,
      });
      expect(calcResult.ok).toBe(true);
      if (!calcResult.ok) return;

      const profile = generateDepthProfile(calcResult, 100);
      expect(profile.length).toBe(100);
      expect(profile[0].depthNm).toBe(0);
      expect(profile[0].concentrationCm3).toBeCloseTo(calcResult.surfaceConcentrationCm3, -10);

      // Profile should peak near Rp (within step resolution)
      const peakPoint = profile.reduce((max, p) => (p.concentrationCm3 > max.concentrationCm3 ? p : max), profile[0]);
      expect(Math.abs(peakPoint.depthNm - calcResult.rpNm)).toBeLessThan(5);
    });
  });

  describe('parseScientificNumber', () => {
    it('parses ordinary and scientific inputs', () => {
      expect(parseScientificNumber('1e15')).toBe(1e15);
      expect(parseScientificNumber('1E14')).toBe(1e14);
      expect(parseScientificNumber('10^15')).toBe(1e15);
      expect(parseScientificNumber('2.5*10^14')).toBe(2.5e14);
      expect(parseScientificNumber('5 x 10^15')).toBe(5e15);
      expect(parseScientificNumber('5000')).toBe(5000);
      expect(Number.isNaN(parseScientificNumber('abc'))).toBe(true);
    });
  });

  describe('SPECIES_CATALOG', () => {
    it('has all four standard species with valid metadata', () => {
      expect(SPECIES_CATALOG.B.name).toContain('Boron');
      expect(SPECIES_CATALOG.P.name).toContain('Phosphorus');
      expect(SPECIES_CATALOG.As.name).toContain('Arsenic');
      expect(SPECIES_CATALOG.BF2.name).toContain('Boron Difluoride');
    });
  });
});
