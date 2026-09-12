import { describe, expect, it } from 'vitest';
import {
  BOLTZMANN_EV_K,
  calculateDriveIn,
  calculateJunctionDepth,
  calculateMinimumOxideMaskThickness,
  calculatePredeposition,
  calculateTwoStepDiffusion,
  erf,
  erfc,
  getDiffusionCoefficient,
  getSolidSolubility,
  inverfc,
  normalizeDopantSpecies,
  SILICON_DOPANTS,
  SIO2_DOPANTS,
} from './dopant-diffusion';

describe('Dopant Diffusion Physics & Mathematical Helpers', () => {
  describe('Mathematical Functions: erf, erfc, inverfc', () => {
    it('calculates erfc and erf with complementary property erf(z) + erfc(z) = 1', () => {
      const testPoints = [0, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0];
      for (const z of testPoints) {
        const valErf = erf(z);
        const valErfc = erfc(z);
        expect(valErf + valErfc).toBeCloseTo(1, 12);
      }
      expect(erfc(0)).toBe(1);
      expect(erf(0)).toBe(0);
    });

    it('inverts erfc accurately across wide dynamic range: erfc(inverfc(y)) == y', () => {
      const ys = [
        1.8, 1.5, 1.0, 0.9, 0.5, 0.1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-8, 1e-10, 1e-12,
      ];
      for (const y of ys) {
        const x = inverfc(y);
        const yRecovered = erfc(x);
        expect(yRecovered / y).toBeCloseTo(1, 7);
      }
    });

    it('handles special values and edge cases for inverfc', () => {
      expect(inverfc(1)).toBe(0);
      expect(inverfc(0)).toBe(Infinity);
      expect(inverfc(-0.5)).toBe(Infinity);
      expect(inverfc(2)).toBe(-Infinity);
      expect(inverfc(2.5)).toBe(-Infinity);
      expect(Number.isNaN(inverfc(NaN))).toBe(true);
    });

    it('handles negative arguments for erf and erfc symmetrically', () => {
      expect(erf(-1)).toBeCloseTo(-erf(1), 12);
      expect(erfc(-1)).toBeCloseTo(2 - erfc(1), 12);
      expect(inverfc(erfc(-0.75))).toBeCloseTo(-0.75, 10);
    });
  });

  describe('Arrhenius Diffusion Coefficients in Silicon and SiO2', () => {
    it('verifies Boron diffusion coefficient at 1000°C and 1100°C in Silicon', () => {
      // D(T) = D0 * exp(-Ea / (kB * T))
      // Boron: D0 = 0.76 cm^2/s, Ea = 3.46 eV
      const d1000 = getDiffusionCoefficient('B', 1000, 'Si');
      const d1100 = getDiffusionCoefficient('B', 1100, 'Si');

      // 1000°C (1273.15 K): kB*T ~ 0.10971 eV => Ea/(kB*T) ~ 31.537 => D ~ 1.529e-14 cm^2/s
      expect(d1000).toBeGreaterThan(1.4e-14);
      expect(d1000).toBeLessThan(1.6e-14);
      const expectedD1000 = 0.76 * Math.exp(-3.46 / (BOLTZMANN_EV_K * 1273.15));
      expect(d1000).toBeCloseTo(expectedD1000, 16);

      // 1100°C (1373.15 K): kB*T ~ 0.11833 eV => Ea/(kB*T) ~ 29.241 => D ~ 1.517e-13 cm^2/s (~10x higher)
      expect(d1100).toBeGreaterThan(1.4e-13);
      expect(d1100).toBeLessThan(1.6e-13);
      const expectedD1100 = 0.76 * Math.exp(-3.46 / (BOLTZMANN_EV_K * 1373.15));
      expect(d1100).toBeCloseTo(expectedD1100, 15);
    });

    it('verifies Phosphorus diffusion coefficient at 1000°C and 1100°C in Silicon', () => {
      // Phosphorus: D0 = 3.85 cm^2/s, Ea = 3.66 eV
      const d1000 = getDiffusionCoefficient('P', 1000, 'Si');
      const d1100 = getDiffusionCoefficient('P', 1100, 'Si');

      // 1000°C: D ~ 1.256e-14 cm^2/s
      expect(d1000).toBeGreaterThan(1.1e-14);
      expect(d1000).toBeLessThan(1.4e-14);
      const expectedD1000 = 3.85 * Math.exp(-3.66 / (BOLTZMANN_EV_K * 1273.15));
      expect(d1000).toBeCloseTo(expectedD1000, 16);

      // 1100°C: D ~ 1.420e-13 cm^2/s
      expect(d1100).toBeGreaterThan(1.3e-13);
      expect(d1100).toBeLessThan(1.5e-13);
      const expectedD1100 = 3.85 * Math.exp(-3.66 / (BOLTZMANN_EV_K * 1373.15));
      expect(d1100).toBeCloseTo(expectedD1100, 15);
    });

    it('verifies Arsenic diffusion coefficient at 1000°C and 1100°C in Silicon', () => {
      // Arsenic: D0 = 0.066 cm^2/s, Ea = 3.44 eV (slow diffuser for shallow junctions)
      const d1000 = getDiffusionCoefficient('As', 1000, 'Si');
      const d1100 = getDiffusionCoefficient('As', 1100, 'Si');

      // 1000°C: D ~ 1.593e-15 cm^2/s
      expect(d1000).toBeGreaterThan(1.5e-15);
      expect(d1000).toBeLessThan(1.7e-15);
      const expectedD1000 = 0.066 * Math.exp(-3.44 / (BOLTZMANN_EV_K * 1273.15));
      expect(d1000).toBeCloseTo(expectedD1000, 17);

      // 1100°C: D ~ 1.561e-14 cm^2/s
      expect(d1100).toBeGreaterThan(1.4e-14);
      expect(d1100).toBeLessThan(1.7e-14);
      const expectedD1100 = 0.066 * Math.exp(-3.44 / (BOLTZMANN_EV_K * 1373.15));
      expect(d1100).toBeCloseTo(expectedD1100, 16);
    });

    it('verifies Antimony diffusion coefficient in Silicon', () => {
      // Antimony: D0 = 0.214 cm^2/s, Ea = 3.65 eV
      const d1000 = getDiffusionCoefficient('Sb', 1000, 'Si');
      const expectedD1000 = 0.214 * Math.exp(-3.65 / (BOLTZMANN_EV_K * 1273.15));
      expect(d1000).toBeCloseTo(expectedD1000, 18);
    });

    it('verifies dopant diffusion in SiO2 for oxide masking', () => {
      // Boron in SiO2: D0 = 3.16e-4, Ea = 3.53 eV => D(1000°C) ~ 3.36e-18 cm^2/s
      const dBSiO2_1000 = getDiffusionCoefficient('B', 1000, 'SiO2');
      expect(dBSiO2_1000).toBeGreaterThan(3e-18);
      expect(dBSiO2_1000).toBeLessThan(4e-18);

      // Phosphorus in SiO2: calibrated to D ~ 1.0e-15 cm^2/s at 1000°C
      const dPSiO2_1000 = getDiffusionCoefficient('P', 1000, 'SiO2');
      expect(dPSiO2_1000).toBeCloseTo(1.0e-15, 16);
    });

    it('accepts full dopant names and case-insensitive symbols', () => {
      expect(getDiffusionCoefficient('boron', 1000)).toBe(getDiffusionCoefficient('B', 1000));
      expect(getDiffusionCoefficient('phosphorus', 1000)).toBe(getDiffusionCoefficient('P', 1000));
      expect(getDiffusionCoefficient('arsenic', 1000)).toBe(getDiffusionCoefficient('As', 1000));
      expect(getDiffusionCoefficient('antimony', 1000)).toBe(getDiffusionCoefficient('Sb', 1000));
      expect(getDiffusionCoefficient('p', 1000)).toBe(getDiffusionCoefficient('P', 1000));
    });

    it('provides standard dopant catalog entries', () => {
      expect(SILICON_DOPANTS.B.d0Cm2PerS).toBe(0.76);
      expect(SILICON_DOPANTS.B.activationEnergyEv).toBe(3.46);
      expect(SILICON_DOPANTS.P.d0Cm2PerS).toBe(3.85);
      expect(SILICON_DOPANTS.P.activationEnergyEv).toBe(3.66);
      expect(SILICON_DOPANTS.As.d0Cm2PerS).toBe(0.066);
      expect(SILICON_DOPANTS.As.activationEnergyEv).toBe(3.44);
      expect(SILICON_DOPANTS.Sb.d0Cm2PerS).toBe(0.214);
      expect(SILICON_DOPANTS.Sb.activationEnergyEv).toBe(3.65);

      expect(SIO2_DOPANTS.B.d0Cm2PerS).toBe(3.16e-4);
      expect(SIO2_DOPANTS.P.activationEnergyEv).toBe(4.0);
    });

    it('throws error for unknown dopant species or temperature below absolute zero', () => {
      expect(() => normalizeDopantSpecies('Gallium')).toThrow(/Unknown dopant species/);
      expect(() => getDiffusionCoefficient('B', -280)).toThrow(/absolute zero/);
    });
  });

  describe('Solid Solubility in Silicon', () => {
    it('calculates solid solubility for B, P, and As at 1000°C', () => {
      const bSol1000 = getSolidSolubility('B', 1000);
      const pSol1000 = getSolidSolubility('P', 1000);
      const asSol1000 = getSolidSolubility('As', 1000);

      // Boron: ~ 2.47e20 cm^-3
      expect(bSol1000).toBeGreaterThan(2.0e20);
      expect(bSol1000).toBeLessThan(3.0e20);

      // Phosphorus: ~ 1.01e21 cm^-3
      expect(pSol1000).toBeGreaterThan(0.9e21);
      expect(pSol1000).toBeLessThan(1.2e21);

      // Arsenic: ~ 1.48e21 cm^-3
      expect(asSol1000).toBeGreaterThan(1.3e21);
      expect(asSol1000).toBeLessThan(1.7e21);
    });

    it('increases with temperature up to 1100°C', () => {
      expect(getSolidSolubility('B', 1100)).toBeGreaterThan(getSolidSolubility('B', 1000));
      expect(getSolidSolubility('P', 1100)).toBeGreaterThan(getSolidSolubility('P', 1000));
      expect(getSolidSolubility('As', 1100)).toBeGreaterThan(getSolidSolubility('As', 1000));
    });
  });

  describe('Constant Source Diffusion (Predeposition / erfc Profile)', () => {
    it('calculates dose Q and concentration profile correctly', () => {
      // Boron predep at 1000°C for 30 minutes (1800 s)
      const res = calculatePredeposition({
        dopant: 'B',
        tempCelsius: 1000,
        timeSeconds: 1800,
        surfaceConcentrationCm3: 2.5e20,
        backgroundConcentrationCm3: 1e15,
        depthsUm: [0, 0.1, 0.2, 0.35],
      });

      expect(res.diffusivityCm2PerS).toBeGreaterThan(1.4e-14);
      expect(res.dtProductCm2).toBeCloseTo(res.diffusivityCm2PerS * 1800, 16);

      // Dose Q = (2 / sqrt(pi)) * Cs * sqrt(Dt)
      const expectedSqrtDt = Math.sqrt(res.dtProductCm2);
      const expectedQ = (2 / Math.sqrt(Math.PI)) * 2.5e20 * expectedSqrtDt;
      expect(res.doseQ).toBeCloseTo(expectedQ, 5);

      // Profile at surface (x = 0): erfc(0) = 1 => C(0) == Cs
      expect(res.profile).toBeDefined();
      expect(res.profile![0].depthUm).toBe(0);
      expect(res.profile![0].concentrationCm3).toBeCloseTo(2.5e20, 10);

      // Concentration decreases monotonically with depth
      expect(res.profile![1].concentrationCm3).toBeLessThan(res.profile![0].concentrationCm3);
      expect(res.profile![2].concentrationCm3).toBeLessThan(res.profile![1].concentrationCm3);

      // Metallurgical junction depth xj: C(xj) = CB
      expect(res.junctionDepthUm).toBeDefined();
      expect(res.junctionDepthUm!).toBeGreaterThan(0.2);
      expect(res.junctionDepthUm!).toBeLessThan(0.5);

      // Verify C(xj) equals CB = 1e15
      const diffusionLengthCm = 2 * expectedSqrtDt;
      const xjCm = res.junctionDepthCm!;
      const concAtXj = 2.5e20 * erfc(xjCm / diffusionLengthCm);
      expect(concAtXj / 1e15).toBeCloseTo(1, 5);
    });

    it('defaults surfaceConcentration to solid solubility when omitted', () => {
      const res = calculatePredeposition({
        dopant: 'P',
        tempCelsius: 1000,
        timeSeconds: 1200,
      });

      const solP = getSolidSolubility('P', 1000);
      expect(res.surfaceConcentrationCm3).toBe(solP);
    });
  });

  describe('Limited Source Diffusion (Drive-In / Gaussian Profile)', () => {
    it('calculates Gaussian profile and drive-in junction depth accurately', () => {
      // Phosphorus drive-in at 1100°C for 1 hour with dose Q = 1e15 atoms/cm^2
      const timeSec = 3600;
      const dose = 1e15;
      const bg = 1e15;

      const res = calculateDriveIn({
        dopant: 'P',
        tempCelsius: 1100,
        timeSeconds: timeSec,
        doseCm2: dose,
        backgroundConcentrationCm3: bg,
        depthsUm: [0, 0.5, 1.0],
      });

      // Cs = Q / sqrt(pi * D * t)
      const expectedDt = res.diffusivityCm2PerS * timeSec;
      const expectedCs = dose / Math.sqrt(Math.PI * expectedDt);
      expect(res.surfaceConcentrationCm3).toBeCloseTo(expectedCs, 5);

      // Junction depth xj = sqrt(4 * Dt * ln(Cs / CB))
      const expectedXjCm = Math.sqrt(4 * expectedDt * Math.log(expectedCs / bg));
      expect(res.junctionDepthCm).toBeCloseTo(expectedXjCm, 8);

      // Profile verification: C(xj) must equal CB
      const concAtXj = expectedCs * Math.exp(-(res.junctionDepthCm! ** 2) / (4 * expectedDt));
      expect(concAtXj / bg).toBeCloseTo(1, 6);

      // Profile at x = 0 is Cs
      expect(res.profile![0].concentrationCm3).toBeCloseTo(expectedCs, 5);
    });
  });

  describe('calculateJunctionDepth helper', () => {
    it('computes constant-source junction depth consistent with erfc equation', () => {
      const D = 1.5e-14;
      const t = 1800;
      const Cs = 1e20;
      const CB = 1e16;

      const res = calculateJunctionDepth({
        model: 'constant-source',
        diffusivityCm2PerS: D,
        timeSeconds: t,
        surfaceConcentrationCm3: Cs,
        backgroundConcentrationCm3: CB,
      });

      expect(res.hasJunction).toBe(true);
      expect(res.junctionDepthUm).toBeGreaterThan(0);

      // Verify erfc equation
      const diffLenCm = 2 * Math.sqrt(D * t);
      const cAtXj = Cs * erfc(res.junctionDepthCm / diffLenCm);
      expect(cAtXj / CB).toBeCloseTo(1, 6);
    });

    it('computes limited-source Gaussian junction depth consistent with formula', () => {
      const D = 2e-13;
      const t = 3600;
      const Q = 5e14;
      const CB = 1e15;

      const res = calculateJunctionDepth({
        model: 'gaussian',
        diffusivityCm2PerS: D,
        timeSeconds: t,
        doseCm2: Q,
        backgroundConcentrationCm3: CB,
      });

      expect(res.hasJunction).toBe(true);
      const Dt = D * t;
      const Cs = Q / Math.sqrt(Math.PI * Dt);
      const cAtXj = Cs * Math.exp(-(res.junctionDepthCm ** 2) / (4 * Dt));
      expect(cAtXj / CB).toBeCloseTo(1, 6);
    });

    it('returns hasJunction: false when surface concentration <= background', () => {
      const res = calculateJunctionDepth({
        model: 'constant-source',
        diffusivityCm2PerS: 1e-14,
        timeSeconds: 1000,
        surfaceConcentrationCm3: 1e15,
        backgroundConcentrationCm3: 1e16, // background higher than surface
      });

      expect(res.hasJunction).toBe(false);
      expect(res.junctionDepthCm).toBe(0);
    });
  });

  describe('Two-Step Diffusion Process', () => {
    it('integrates predeposition dose into drive-in diffusion with combined thermal budget', () => {
      const res = calculateTwoStepDiffusion({
        dopant: 'B',
        predepTempCelsius: 950,
        predepTimeSeconds: 1800,
        driveInTempCelsius: 1100,
        driveInTimeSeconds: 3600,
        backgroundConcentrationCm3: 1e15,
        depthsUm: [0, 0.5, 1.0],
      });

      expect(res.dopant).toBe('B');
      expect(res.predep.doseQ).toBeGreaterThan(0);
      expect(res.driveIn.doseQ).toBe(res.predep.doseQ);

      // (Dt)eff = D1 * t1 + D2 * t2
      const expectedEffectiveDt = res.predep.dtProductCm2 + res.driveIn.dtProductCm2;
      expect(res.effectiveDtCm2).toBeCloseTo(expectedEffectiveDt, 15);

      // Final surface concentration = Q / sqrt(pi * (Dt)eff)
      const expectedFinalCs = res.predep.doseQ / Math.sqrt(Math.PI * expectedEffectiveDt);
      expect(res.finalSurfaceConcentrationCm3).toBeCloseTo(expectedFinalCs, 5);

      // Final junction depth
      expect(res.junctionDepthUm).toBeGreaterThan(0.5);
      expect(res.junctionDepthUm).toBeLessThan(3.0);
    });
  });

  describe('Minimum SiO2 Oxide Mask Thickness', () => {
    it('computes 3x and 4x diffusion length rules of thumb for oxide masking', () => {
      // Phosphorus masking at 1000°C for 1 hour (3600 s)
      // D_ox ~ 1.0e-15 cm^2/s => sqrt(D_ox * t) = sqrt(3.6e-12) ~ 1.897e-6 cm ~ 18.97 nm
      const res = calculateMinimumOxideMaskThickness({
        dopant: 'P',
        tempCelsius: 1000,
        timeSeconds: 3600,
      });

      expect(res.diffusivityOxideCm2PerS).toBeCloseTo(1.0e-15, 16);
      expect(res.diffusionLengthNm).toBeCloseTo(19.0, 0);
      expect(res.minThickness3xNm).toBeCloseTo(3 * res.diffusionLengthNm, 5);
      expect(res.minThickness4xNm).toBeCloseTo(4 * res.diffusionLengthNm, 5);
      expect(res.recommendedThicknessNm).toBe(res.minThickness4xNm); // default 4x
    });

    it('allows custom safety multiplier', () => {
      const res = calculateMinimumOxideMaskThickness({
        diffusivityOxideCm2PerS: 1e-15,
        timeSeconds: 3600,
        safetyMultiplier: 5,
      });

      expect(res.recommendedThicknessNm).toBeCloseTo(5 * res.diffusionLengthNm, 5);
    });
  });
});
