import { describe, expect, it } from 'vitest';
import {
  calculateDepletion,
  calculateIntrinsicCarrierConcentration,
  calculateThermalVoltage,
} from './semiconductor-physics';

describe('Semiconductor Physics & PN Junction Depletion', () => {
  it('computes thermal voltage and intrinsic carrier concentration at 300 K', () => {
    const vt = calculateThermalVoltage(300);
    expect(vt).toBeCloseTo(0.025852, 4);

    const ni = calculateIntrinsicCarrierConcentration(300, vt);
    expect(ni).toBeGreaterThan(0.9e10);
    expect(ni).toBeLessThan(1.5e10);
  });

  it('computes built-in potential and depletion width for symmetric junction', () => {
    const res = calculateDepletion({
      temperatureK: 300,
      naCm3: 1e16,
      ndCm3: 1e16,
      reverseBiasV: 0,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Vbi around 0.69 - 0.72 V for 1e16 / 1e16 Si junction
    expect(res.vbiV).toBeGreaterThan(0.68);
    expect(res.vbiV).toBeLessThan(0.73);

    // Symmetric junction: xp == xn, xp + xn == W
    expect(res.xpNm).toBeCloseTo(res.xnNm, 3);
    expect(res.xpNm + res.xnNm).toBeCloseTo(res.widthNm, 3);
  });

  it('maintains charge neutrality balance: Na * xp == Nd * xn', () => {
    const res = calculateDepletion({
      temperatureK: 300,
      naCm3: 1e18, // n+/p or p+/n asymmetric
      ndCm3: 1e15,
      reverseBiasV: 5,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const chargeP = res.naCm3 * res.xpCm;
    const chargeN = res.ndCm3 * res.xnCm;
    expect(chargeP / chargeN).toBeCloseTo(1, 5);

    // Most depletion width is in the lightly doped n-side
    expect(res.xnNm).toBeGreaterThan(res.xpNm * 500);
  });

  it('widens depletion region and reduces capacitance under reverse bias', () => {
    const zeroBias = calculateDepletion({
      temperatureK: 300,
      naCm3: 1e16,
      ndCm3: 1e17,
      reverseBiasV: 0,
    });
    const revBias = calculateDepletion({
      temperatureK: 300,
      naCm3: 1e16,
      ndCm3: 1e17,
      reverseBiasV: 5,
    });

    expect(zeroBias.ok).toBe(true);
    expect(revBias.ok).toBe(true);
    if (!zeroBias.ok || !revBias.ok) return;

    expect(revBias.widthNm).toBeGreaterThan(zeroBias.widthNm);
    expect(revBias.capacitanceFFPerUm2).toBeLessThan(zeroBias.capacitanceFFPerUm2);
    expect(revBias.maxElectricFieldKVPerCm).toBeGreaterThan(zeroBias.maxElectricFieldKVPerCm);
  });

  it('rejects invalid inputs gracefully', () => {
    const res1 = calculateDepletion({
      temperatureK: -5,
      naCm3: 1e16,
      ndCm3: 1e16,
      reverseBiasV: 0,
    });
    expect(res1.ok).toBe(false);

    const res2 = calculateDepletion({
      temperatureK: 300,
      naCm3: 0,
      ndCm3: 1e16,
      reverseBiasV: -2,
    });
    expect(res2.ok).toBe(false);
  });
});
