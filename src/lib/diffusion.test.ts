
import { describe, expect, it } from 'vitest';
import { calculateDiffusion, NM2_PER_UM2, UM2_PER_CM2 } from './diffusion';

describe('calculateDiffusion', () => {
  it('reports the characteristic length, the erfc length and the Gaussian sigma', () => {
    const result = calculateDiffusion({ diffusivityCm2PerS: 1e-13, timeSeconds: 3600 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.budgetCm2).toBeCloseTo(3.6e-10, 18);
    expect(result.budgetUm2).toBeCloseTo(0.036, 12);
    expect(result.budgetNm2).toBeCloseTo(36000, 6);
    expect(result.characteristicLengthUm).toBeCloseTo(0.18973665961010275, 12);
    expect(result.erfcLengthUm).toBeCloseTo(0.3794733192202055, 12);
    expect(result.gaussianSigmaUm).toBeCloseTo(0.2683281572999748, 12);
  });

  it('keeps the length ratios independent of the diffusivity', () => {
    const result = calculateDiffusion({ diffusivityCm2PerS: 1e-12, timeSeconds: 3600 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.erfcLengthUm / result.characteristicLengthUm).toBeCloseTo(2, 12);
    expect(result.gaussianSigmaUm / result.characteristicLengthUm).toBeCloseTo(Math.SQRT2, 12);
  });

  it('scales the budget linearly and the length as the square root with time', () => {
    const one = calculateDiffusion({ diffusivityCm2PerS: 1e-13, timeSeconds: 100 });
    const four = calculateDiffusion({ diffusivityCm2PerS: 1e-13, timeSeconds: 400 });
    expect(one.ok && four.ok).toBe(true);
    if (!one.ok || !four.ok) return;
    expect(four.budgetUm2 / one.budgetUm2).toBeCloseTo(4, 10);
    expect(four.characteristicLengthUm / one.characteristicLengthUm).toBeCloseTo(2, 10);
  });

  it('exposes the unit factors it uses', () => {
    expect(UM2_PER_CM2).toBe(1e8);
    expect(NM2_PER_UM2).toBe(1e6);
  });

  it('rejects non-positive inputs', () => {
    expect(calculateDiffusion({ diffusivityCm2PerS: 0, timeSeconds: 3600 }).ok).toBe(false);
    expect(calculateDiffusion({ diffusivityCm2PerS: 1e-13, timeSeconds: 0 }).ok).toBe(false);
  });
});
