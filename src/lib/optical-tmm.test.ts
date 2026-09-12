import { describe, it, expect } from 'vitest';
import {
  cReal,
  cMake,
  cAdd,
  cSub,
  cMul,
  cDiv,
  cSqrt,
  cCos,
  cSin,
  solveTmmAtWavelength,
  calculateMultilayerOpticalSpectrum,
  calculateOptimalSingleLayerArc,
  OPTICAL_MATERIALS,
} from './optical-tmm';

describe('optical-tmm complex number mathematics', () => {
  it('performs basic complex arithmetic accurately', () => {
    const a = cMake(3, 4);
    const b = cMake(1, -2);

    expect(cAdd(a, b)).toEqual({ r: 4, i: 2 });
    expect(cSub(a, b)).toEqual({ r: 2, i: 6 });

    // (3 + 4i)(1 - 2i) = 3 - 6i + 4i - 8i^2 = 11 - 2i
    expect(cMul(a, b)).toEqual({ r: 11, i: -2 });

    // (3 + 4i) / (1 - 2i) = (3 + 4i)(1 + 2i) / 5 = (-5 + 10i) / 5 = -1 + 2i
    expect(cDiv(a, b)).toEqual({ r: -1, i: 2 });
  });

  it('computes principal branch complex square root', () => {
    // sqrt(-4) = 0 + 2i
    const z1 = cMake(-4, 0);
    const sqrt1 = cSqrt(z1);
    expect(sqrt1.r).toBeCloseTo(0, 5);
    expect(sqrt1.i).toBeCloseTo(2, 5);

    // sqrt(3 + 4i) = 2 + 1i
    const z2 = cMake(3, 4);
    const sqrt2 = cSqrt(z2);
    expect(sqrt2.r).toBeCloseTo(2, 5);
    expect(sqrt2.i).toBeCloseTo(1, 5);
  });

  it('computes complex trigonometric identities', () => {
    // cos(0) = 1, sin(0) = 0
    expect(cCos(cReal(0)).r).toBeCloseTo(1, 6);
    expect(cCos(cReal(0)).i).toBeCloseTo(0, 6);
    expect(cSin(cReal(0)).r).toBeCloseTo(0, 6);
    expect(cSin(cReal(0)).i).toBeCloseTo(0, 6);

    // cos(pi/2) = 0, sin(pi/2) = 1
    expect(cCos(cReal(Math.PI / 2)).r).toBeCloseTo(0, 5);
    expect(cSin(cReal(Math.PI / 2)).r).toBeCloseTo(1, 5);
  });
});

describe('optical-tmm physical boundary solver', () => {
  it('computes normal incidence reflectance of bare silicon accurately', () => {
    // Bare Si substrate at 633 nm: n ~ 3.88
    // Fresnel: R = |(1 - n)/(1 + n)|^2 ~ |(1 - 3.88)/(1 + 3.88)|^2 = (2.88/4.88)^2 ~ 0.348
    const res = solveTmmAtWavelength(633, {
      incidentMediumId: 'air',
      substrateMediumId: 'si',
      layers: [],
    });

    expect(res.reflectance).toBeGreaterThan(0.30);
    expect(res.reflectance).toBeLessThan(0.40);
    expect(res.transmittance).toBeCloseTo(1 - res.reflectance, 2); // Transmitted Poynting flux entering semi-infinite substrate
    expect(res.reflectance + res.transmittance).toBeCloseTo(1.0, 4);
  });

  it('verifies quarter-wave single layer Antireflective Coating (ARC)', () => {
    const lambda0 = 600; // 600 nm
    const arc = calculateOptimalSingleLayerArc(lambda0, 1.0, 4.0);
    // n_opt = sqrt(1 * 4) = 2.0 (like Si3N4)
    expect(arc.optimalIndex).toBeCloseTo(2.0, 3);
    // d = 600 / (4 * 2.0) = 75 nm
    expect(arc.quarterWaveThicknessNm).toBeCloseTo(75.0, 3);

    // Run TMM with custom n=2.0, d=75nm over Si (n=4.0)
    const res = solveTmmAtWavelength(lambda0, {
      incidentMediumId: 'air',
      layers: [
        {
          thicknessNm: arc.quarterWaveThicknessNm,
          refractiveIndex: arc.optimalIndex,
          extinctionCoefficient: 0,
        },
      ],
      substrateMediumId: 'si',
    });

    // Quarter-wave ARC on Si should significantly minimize reflectance down below 3%
    expect(res.reflectance).toBeLessThan(0.03);
  });

  it('predicts high reflectance (>85%) for thick metal layer (Aluminum)', () => {
    const res = solveTmmAtWavelength(550, {
      incidentMediumId: 'air',
      substrateMediumId: 'si',
      layers: [
        {
          materialId: 'al',
          thicknessNm: 120, // 120 nm aluminum mirror
        },
      ],
    });

    expect(res.reflectance).toBeGreaterThan(0.85);
  });

  it('satisfies energy conservation R + T + A = 1 for multilayer stacks', () => {
    const res = solveTmmAtWavelength(500, {
      incidentMediumId: 'air',
      substrateMediumId: 'si',
      layers: [
        { materialId: 'photoresist', thicknessNm: 80 },
        { materialId: 'si3n4', thicknessNm: 40 },
        { materialId: 'sio2', thicknessNm: 100 },
        { materialId: 'tin', thicknessNm: 15 },
      ],
    });

    const totalEnergy = res.reflectance + res.transmittance + res.absorptance;
    expect(totalEnergy).toBeCloseTo(1.0, 5);
  });

  it('demonstrates Brewster angle effect (TM reflectance < TE reflectance)', () => {
    // At ~60-75 degrees angle of incidence, TM reflectance dips significantly
    const te = solveTmmAtWavelength(600, {
      incidentMediumId: 'air',
      substrateMediumId: 'si',
      layers: [{ materialId: 'sio2', thicknessNm: 50 }],
      angleDeg: 65,
      polarization: 'TE',
    });

    const tm = solveTmmAtWavelength(600, {
      incidentMediumId: 'air',
      substrateMediumId: 'si',
      layers: [{ materialId: 'sio2', thicknessNm: 50 }],
      angleDeg: 65,
      polarization: 'TM',
    });

    expect(tm.reflectance).toBeLessThan(te.reflectance);
  });

  it('computes full visible spectrum and valid hex color for SiO2 film on Si', () => {
    const result = calculateMultilayerOpticalSpectrum(
      {
        incidentMediumId: 'air',
        substrateMediumId: 'si',
        layers: [{ materialId: 'sio2', thicknessNm: 120 }], // ~120 nm thermal oxide: vibrant violet/blue
      },
      380,
      780,
      10
    );

    expect(result.spectrum.length).toBe(41);
    expect(result.avgReflectance).toBeGreaterThan(0);
    expect(result.avgReflectance).toBeLessThan(1);
    expect(result.colorHex).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.tristimulus.Y).toBeGreaterThan(0);
  });
});
