import { describe, expect, it } from 'vitest';
import { stubMatch, stubVerification } from './stub';

describe('shunt stub matching', () => {
  it('matches a 100 - j30 ohm load on a 50 ohm line at 2.4 GHz', () => {
    const input = { z0Ohm: 50, loadR: 100, loadX: -30, frequencyHz: 2.4e9, er: 4.4 };
    const result = stubMatch(input);
    expect(result.lambdaM).toBeCloseTo(0.059550186091870926, 15);
    expect(result.normalizedLoadR).toBeCloseTo(2, 12);
    expect(result.normalizedLoadX).toBeCloseTo(-0.6, 12);
    expect(result.solutions).toHaveLength(2);

    const [first, second] = result.solutions;
    expect(first.distanceM).toBeCloseTo(0.018852538909361914, 12);
    expect(first.normalizedSusceptance).toBeCloseTo(-0.824621125123532, 12);
    expect(first.shortStubLengthM).toBeCloseTo(0.02142313185374308, 12);
    expect(first.openStubLengthM).toBeCloseTo(0.006535585330775352, 12);

    expect(second.distanceM).toBeCloseTo(0.007671473914145872, 12);
    expect(second.normalizedSusceptance).toBeCloseTo(0.8246211251235319, 12);
    expect(second.shortStubLengthM).toBeCloseTo(0.008351961192192382, 12);
    expect(second.openStubLengthM).toBeCloseTo(0.02323950771516011, 12);
  });

  it('matches an inductive load on a 1 GHz air line', () => {
    const result = stubMatch({ z0Ohm: 50, loadR: 25, loadX: 40, frequencyHz: 1e9, er: 1 });
    expect(result.lambdaM).toBeCloseTo(0.299792458, 12);
    const [first, second] = result.solutions;
    expect(first.distanceM).toBeCloseTo(0.1374991069554441, 12);
    expect(first.normalizedSusceptance).toBeCloseTo(-1.3341664064126333, 12);
    expect(first.shortStubLengthM).toBeCloseTo(0.11920687384091094, 12);
    expect(second.distanceM).toBeCloseTo(0.09062038276819763, 12);
    expect(second.openStubLengthM).toBeCloseTo(0.10563746965908904, 12);
  });

  it('gives the quarter-wave-symmetric answer for a purely real load', () => {
    const result = stubMatch({ z0Ohm: 50, loadR: 100, loadX: 0, frequencyHz: 2.4e9, er: 4.4 });
    const [first, second] = result.solutions;
    expect(first.normalizedSusceptance).toBeCloseTo(-Math.SQRT1_2, 12);
    expect(second.normalizedSusceptance).toBeCloseTo(Math.SQRT1_2, 12);
    // With x = 0 the short stub length equals the stub distance.
    expect(first.shortStubLengthM).toBeCloseTo(first.distanceM, 15);
    expect(second.shortStubLengthM).toBeCloseTo(second.distanceM, 15);
  });

  it('re-simulates each solution back to a matched line', () => {
    // The closed form is checked against the transmission-line equations rather
    // than against itself: rebuild y_in from the reported distances and lengths.
    const input = { z0Ohm: 50, loadR: 100, loadX: -30, frequencyHz: 2.4e9, er: 4.4 };
    const result = stubMatch(input);
    for (const solution of result.solutions) {
      for (const stubKind of ['short', 'open'] as const) {
        const stubLengthM =
          stubKind === 'short' ? solution.shortStubLengthM : solution.openStubLengthM;
        const check = stubVerification({
          ...input,
          distanceM: solution.distanceM,
          stubLengthM,
          stubKind,
        });
        expect(check.normalizedConductance).toBeCloseTo(1, 9);
        expect(check.normalizedSusceptance).toBeCloseTo(0, 9);
        expect(check.deviation).toBeLessThan(1e-9);
      }
    }
  });

  it('rejects an already matched load and invalid inputs', () => {
    expect(() =>
      stubMatch({ z0Ohm: 50, loadR: 50, loadX: 0, frequencyHz: 1e9, er: 4.4 }),
    ).toThrow(/already matched/);
    expect(() =>
      stubMatch({ z0Ohm: 0, loadR: 100, loadX: 0, frequencyHz: 1e9, er: 4.4 }),
    ).toThrow(/line impedance/);
    expect(() =>
      stubMatch({ z0Ohm: 50, loadR: 0, loadX: 10, frequencyHz: 1e9, er: 4.4 }),
    ).toThrow(/load resistance/);
    expect(() =>
      stubMatch({ z0Ohm: 50, loadR: 100, loadX: 0, frequencyHz: 1e9, er: 0.5 }),
    ).toThrow(/permittivity/);
    expect(() =>
      stubMatch({ z0Ohm: 50, loadR: 100, loadX: 0, frequencyHz: 0, er: 4.4 }),
    ).toThrow(/frequency/);
  });
});
