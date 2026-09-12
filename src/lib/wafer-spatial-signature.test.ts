import { describe, it, expect } from 'vitest';
import {
  calculateClarkEvansIndex,
  analyzeRadialYield,
  classifySpatialSignatures,
  fitWaferYieldModels,
  type WaferDieInput,
} from './wafer-spatial-signature';

describe('Wafer Spatial Defect Signatures and Yield Modeling', () => {
  it('calculates Clark-Evans aggregation index R correctly', () => {
    // Clustered defects close to each other
    const clustered = [
      { x: 10, y: 10 },
      { x: 10.5, y: 10.2 },
      { x: 11, y: 9.8 },
      { x: 10.2, y: 10.8 },
      { x: 9.8, y: 10.1 },
    ];
    const { rIndex } = calculateClarkEvansIndex(clustered, 70685); // 300mm wafer
    expect(rIndex).toBeLessThan(0.6); // Strong clustering
  });

  it('detects outer ring edge signature from radial yield decay', () => {
    const dies: WaferDieInput[] = [];
    // Generate synthetic dies across a 150mm radius wafer
    for (let r = 10; r <= 145; r += 15) {
      const circumference = 2 * Math.PI * r;
      const count = Math.max(6, Math.floor(circumference / 12));
      for (let i = 0; i < count; i++) {
        const theta = (2 * Math.PI * i) / count;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        // Outer edge (r > 120) has high defectivity
        const isDefect = r > 120 ? Math.random() < 0.75 : Math.random() < 0.05;
        dies.push({
          x,
          y,
          status: isDefect ? 'Defect' : 'Good',
        });
      }
    }

    const radial = analyzeRadialYield(dies, 150, 6);
    expect(radial.bins.length).toBe(6);
    expect(radial.bins[5].defectRate).toBeGreaterThan(0.5);

    const signatures = classifySpatialSignatures(dies, 150);
    expect(signatures.some((s) => s.pattern === 'ring')).toBe(true);
  });

  it('detects linear scratch pattern via aspect ratio', () => {
    const dies: WaferDieInput[] = [];
    // Normal background
    for (let i = 0; i < 50; i++) {
      dies.push({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        status: 'Good',
      });
    }
    // Scratch line along X-axis
    for (let i = 0; i < 10; i++) {
      dies.push({
        x: -40 + i * 9, // spans -40 to 41 mm
        y: 10 + (i % 2) * 0.2, // spans only 0.2 mm
        status: 'Defect',
      });
    }

    const signatures = classifySpatialSignatures(dies, 150);
    expect(signatures.some((s) => s.pattern === 'scratch')).toBe(true);
  });

  it('fits wafer yield models (Poisson, Murphy, Seeds, Negative Binomial)', () => {
    const totalDies = 800;
    const defectiveDies = 120; // 85% observed yield
    const dieAreaMm2 = 50; // 0.5 cm²

    const fit = fitWaferYieldModels(totalDies, defectiveDies, dieAreaMm2, 2.0);
    expect(fit.observedYield).toBe(0.85);
    expect(fit.defectDensityPerCm2).toBeGreaterThan(0.2);
    expect(fit.poissonYield).toBe(0.85);
    expect(fit.murphyYield).toBeGreaterThanOrEqual(fit.poissonYield); // Murphy >= Poisson
    expect(fit.negativeBinomialYield).toBeGreaterThanOrEqual(fit.poissonYield); // Stapper NB >= Poisson
  });
});
