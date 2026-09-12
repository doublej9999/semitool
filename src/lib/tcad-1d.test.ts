import { describe, it, expect } from 'vitest';
import {
  calculatePearsonIvProfile,
  solve1DNumericalDiffusion,
} from './tcad-1d';

describe('1D Numerical TCAD and Diffusion Solver', () => {
  it('generates Pearson-IV ion implantation profile with expected peak and dose', () => {
    const profile = calculatePearsonIvProfile(
      {
        doseCm2: 1e15,
        rpUm: 0.15,
        deltaRpUm: 0.05,
        skewness: 0.8,
        kurtosis: 4.5,
      },
      1.0,
      100,
    );

    expect(profile.length).toBe(100);
    const peakNode = profile.reduce((max, cur) =>
      cur.concentrationCm3 > max.concentrationCm3 ? cur : max,
    );

    // Peak concentration should occur close to Rp ~ 0.15um
    expect(peakNode.depthUm).toBeGreaterThan(0.1);
    expect(peakNode.depthUm).toBeLessThan(0.25);
    expect(peakNode.concentrationCm3).toBeGreaterThan(5e19);
  });

  it('diffuses implanted profile under high temperature RTA', () => {
    const initial = calculatePearsonIvProfile(
      {
        doseCm2: 5e14,
        rpUm: 0.1,
        deltaRpUm: 0.04,
        skewness: 0.2,
        kurtosis: 3.5,
      },
      0.8,
      80,
    );

    const initialPeak = Math.max(...initial.map((p) => p.concentrationCm3));

    // Anneal at 1000C for 10 seconds
    const result = solve1DNumericalDiffusion(initial, 1000, 10, {
      dopant: 'boron',
      backgroundDopingCm3: 1e15,
    });

    // Dopant spreads out: peak concentration decreases, junction depth extends
    expect(result.peakConcentrationCm3).toBeLessThan(initialPeak);
    expect(result.junctionDepthUm).toBeGreaterThan(0.2);
    expect(result.sheetDoseCm2).toBeGreaterThan(1e14);
  });
});
