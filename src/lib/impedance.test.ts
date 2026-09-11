import { describe, expect, it } from 'vitest';
import {
  capacitanceForReactance,
  fractionalBandwidth,
  inductanceForReactance,
  matchLNetwork,
} from './impedance';

/** Relative error, used for the element values because they are tiny. */
function relative(value: number, anchor: number): number {
  return Math.abs(value - anchor) / Math.abs(anchor);
}

describe('L-network matching', () => {
  it('matches 50 ohm to 200 ohm at 100 MHz', () => {
    const result = matchLNetwork({ frequencyHz: 100e6, sourceOhm: 50, loadOhm: 200 });
    expect(result.q).toBeCloseTo(1.7320508075688772, 12);
    expect(result.shuntSide).toBe('load');
    expect(result.bandwidthHz).toBeCloseTo(57735026.91896258, 1);
    expect(fractionalBandwidth(result.q)).toBeCloseTo(1 / Math.sqrt(3), 12);

    const [lowPass, highPass] = result.solutions;
    expect(lowPass.pass).toBe('low');
    expect(highPass.pass).toBe('high');
    expect(lowPass.seriesReactanceOhm).toBeCloseTo(86.60254037844386, 10);
    expect(lowPass.shuntReactanceOhm).toBeCloseTo(115.47005383792516, 10);
    expect(relative(lowPass.seriesInductanceH as number, 1.3783222385544804e-7)).toBeLessThan(1e-14);
    expect(relative(lowPass.shuntCapacitanceF as number, 1.3783222385544801e-11)).toBeLessThan(
      1e-14,
    );
    expect(relative(highPass.seriesCapacitanceF as number, 1.837762984739307e-11)).toBeLessThan(
      1e-14,
    );
    expect(relative(highPass.shuntInductanceH as number, 1.8377629847393072e-7)).toBeLessThan(1e-14);
    expect(lowPass.seriesCapacitanceF).toBeNull();
    expect(lowPass.shuntInductanceH).toBeNull();
    expect(highPass.seriesInductanceH).toBeNull();
    expect(highPass.shuntCapacitanceF).toBeNull();
  });

  it('puts the shunt across the source when the source is the larger resistance', () => {
    const result = matchLNetwork({ frequencyHz: 100e6, sourceOhm: 200, loadOhm: 50 });
    expect(result.shuntSide).toBe('source');
    expect(result.q).toBeCloseTo(1.7320508075688772, 12);
    // The reactive values are the same magnitudes; only the side swaps.
    expect(result.solutions[0].seriesReactanceOhm).toBeCloseTo(86.60254037844386, 10);
    expect(result.solutions[0].shuntReactanceOhm).toBeCloseTo(115.47005383792516, 10);
  });

  it('gives Q = 1 for a 2:1 resistance ratio', () => {
    const result = matchLNetwork({ frequencyHz: 1e9, sourceOhm: 100, loadOhm: 50 });
    expect(result.q).toBeCloseTo(1, 12);
    expect(result.solutions[0].seriesReactanceOhm).toBeCloseTo(50, 12);
    expect(result.solutions[0].shuntReactanceOhm).toBeCloseTo(100, 12);
    expect(result.bandwidthHz).toBeCloseTo(1e9, 6);
  });

  it('converts a reactance to an element value and back', () => {
    const f = 2.4e9;
    const l = inductanceForReactance(100, f);
    expect(l).toBeCloseTo(100 / (2 * Math.PI * f), 18);
    expect(capacitanceForReactance(100, f)).toBeCloseTo(1 / (2 * Math.PI * f * 100), 18);
  });

  it('rejects equal resistances and non-positive inputs', () => {
    expect(() => matchLNetwork({ frequencyHz: 1e9, sourceOhm: 50, loadOhm: 50 })).toThrow(
      /already matched/,
    );
    expect(() => matchLNetwork({ frequencyHz: 0, sourceOhm: 50, loadOhm: 100 })).toThrow(
      /frequency/,
    );
    expect(() => matchLNetwork({ frequencyHz: 1e9, sourceOhm: -50, loadOhm: 100 })).toThrow(
      /source resistance/,
    );
    expect(() => matchLNetwork({ frequencyHz: 1e9, sourceOhm: 50, loadOhm: 0 })).toThrow(
      /load resistance/,
    );
  });
});
