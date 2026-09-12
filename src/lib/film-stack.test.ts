import { describe, it, expect } from 'vitest';
import {
  calculateFilmStackPhysics,
  INDUSTRIAL_STACK_TEMPLATES,
  createDefaultFilmStackProject,
  FilmLayer,
  SUBSTRATE_CATALOG,
} from './film-stack';

describe('Film Stack & Fab Project Workspace Physics', () => {
  it('handles empty film stack on bare silicon correctly', () => {
    const summary = calculateFilmStackPhysics('si100', 775, 300, []);
    expect(summary.totalFilmThicknessNm).toBe(0);
    expect(summary.totalWaferThicknessUm).toBe(775);
    expect(summary.forcePerUnitWidthNm).toBe(0);
    expect(summary.waferBowUm).toBe(0);
    expect(summary.radiusOfCurvatureM).toBe(Infinity);
    expect(summary.dominantStressRegime).toBe('neutral');
    expect(summary.chuckingWarning).toBeUndefined();
  });

  it('calculates single tensile film bow accurately according to Stoney formula', () => {
    // 300mm wafer (R = 0.15m), Si(100) M_s = 180.5 GPa, thickness = 775 um
    // Film: 1000 nm (1 um), stress = 1000 MPa (1 GPa) Tensile
    const layer: FilmLayer = {
      id: 'test-1',
      name: 'Tensile Nitride',
      material: 'Si3N4',
      processType: 'cvd',
      thicknessNm: 1000,
      residualStressMpa: 1000,
      refractiveIndex: 2.0,
      extinctionCoefficient: 0,
      addedAtIsoDate: new Date().toISOString(),
    };

    const summary = calculateFilmStackPhysics('si100', 775, 300, [layer]);

    expect(summary.totalFilmThicknessNm).toBe(1000);
    expect(summary.forcePerUnitWidthNm).toBeCloseTo(1000, 1); // 1e9 Pa * 1e-6 m = 1000 N/m
    expect(summary.dominantStressRegime).toBe('tensile');
    expect(summary.waferBowUm).toBeGreaterThan(0); // Tensile causes concave bow > 0

    // Manual Stoney check:
    // kappa = 6 * (1000 N/m) / (180.5e9 * (775e-6)^2) = 6000 / (180.5e9 * 6.00625e-7) = 6000 / 108412.8 = 0.05534 1/m
    // Bow = R^2 * kappa / 2 = 0.15^2 * 0.05534 / 2 = 0.0225 * 0.02767 = 0.0006226 m = 622.6 um
    expect(summary.waferBowUm).toBeCloseTo(622.6, 0);
    expect(summary.chuckingWarning).toContain('Severe wafer warp');
  });

  it('correctly models multi-layer stress cancellation', () => {
    // Layer 1: 500nm, +800 MPa (Tensile) -> sum = +400 N/m
    // Layer 2: 400nm, -1000 MPa (Compressive) -> sum = -400 N/m
    // Net stress force = 0 N/m -> Bow = 0 um
    const layers: FilmLayer[] = [
      {
        id: '1',
        name: 'Tensile film',
        material: 'SiN',
        processType: 'cvd',
        thicknessNm: 500,
        residualStressMpa: 800,
        refractiveIndex: 2.0,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Compressive oxide',
        material: 'SiO2',
        processType: 'cvd',
        thicknessNm: 400,
        residualStressMpa: -1000,
        refractiveIndex: 1.46,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
      },
    ];

    const summary = calculateFilmStackPhysics('si100', 775, 300, layers);
    expect(summary.totalFilmThicknessNm).toBe(900);
    expect(summary.forcePerUnitWidthNm).toBeCloseTo(0, 4);
    expect(summary.waferBowUm).toBeCloseTo(0, 4);
    expect(summary.dominantStressRegime).toBe('neutral');
  });

  it('computes thermal budget and effective diffusion length', () => {
    const summary = calculateFilmStackPhysics('si100', 775, 300, [], [
      {
        stepName: 'Anneal Step A',
        temperatureC: 1000,
        durationMin: 30,
        diffusivityCm2PerS: 1e-14,
        dtCm2: 1.8e-11, // 1e-14 * 1800s
      },
      {
        stepName: 'Anneal Step B',
        temperatureC: 1050,
        durationMin: 10,
        diffusivityCm2PerS: 5e-14,
        dtCm2: 3.0e-11,
      },
    ]);

    expect(summary.cumulativeDtCm2).toBeCloseTo(4.8e-11, 13);
    // 2 * sqrt(4.8e-11) * 1e7 = 2 * 6.928e-6 * 1e7 = 138.56 nm
    expect(summary.effectiveDiffusionLengthNm).toBeCloseTo(138.56, 1);
  });

  it('verifies industrial reference templates have valid physics', () => {
    for (const [key, tmpl] of Object.entries(INDUSTRIAL_STACK_TEMPLATES)) {
      expect(tmpl.layers.length).toBeGreaterThan(0);
      const summary = calculateFilmStackPhysics(
        tmpl.substrate.material,
        tmpl.substrate.thicknessUm,
        tmpl.waferDiameterMm,
        tmpl.layers,
        tmpl.thermalBudgetHistory
      );
      expect(summary.totalFilmThicknessNm).toBeGreaterThan(0);
      expect(Number.isFinite(summary.waferBowUm)).toBe(true);
      expect(Number.isFinite(summary.netAverageStressMpa)).toBe(true);
    }
  });

  it('verifies substrate catalog constants are consistent', () => {
    for (const [subId, props] of Object.entries(SUBSTRATE_CATALOG)) {
      expect(props.id).toBe(subId);
      expect(props.biaxialModulusGpa).toBeGreaterThan(50);
      expect(props.poissonsRatio).toBeGreaterThan(0.1);
      expect(props.poissonsRatio).toBeLessThan(0.4);
    }
  });
});
