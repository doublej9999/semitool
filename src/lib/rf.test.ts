
import { describe, expect, it } from 'vitest';
import {
  dbToAmplitudeRatio,
  dbToPowerRatio,
  gammaFromReturnLossDb,
  gammaFromVswr,
  mismatchLossDb,
  reflectedFraction,
  returnLossDbFromGamma,
  returnLossDbFromVswr,
  transmittedFraction,
  vswrFromGamma,
  vswrFromReturnLossDb,
} from './rf';

describe('impedance mismatch', () => {
  it('keeps the amplitude and power conventions apart', () => {
    // 10 dB is 10x in power but sqrt(10)x in amplitude.
    expect(dbToPowerRatio(10)).toBeCloseTo(10, 12);
    expect(dbToAmplitudeRatio(10)).toBeCloseTo(Math.sqrt(10), 12);
  });

  it('pins a gamma of 0.1', () => {
    expect(gammaFromReturnLossDb(20)).toBeCloseTo(0.1, 12);
    expect(returnLossDbFromGamma(0.1)).toBeCloseTo(20, 12);
    expect(vswrFromGamma(0.1)).toBeCloseTo(1.2222222222222223, 12);
    expect(mismatchLossDb(0.1)).toBeCloseTo(0.04364805402450088, 12);
    expect(reflectedFraction(0.1)).toBeCloseTo(0.01, 12);
    expect(transmittedFraction(0.1)).toBeCloseTo(0.99, 12);
  });

  it('pins a VSWR of 2', () => {
    expect(gammaFromVswr(2)).toBeCloseTo(1 / 3, 12);
    expect(returnLossDbFromVswr(2)).toBeCloseTo(9.542425094393248, 12);
    expect(mismatchLossDb(1 / 3)).toBeCloseTo(0.5115252244738131, 12);
    expect(vswrFromReturnLossDb(9.542425094393248)).toBeCloseTo(2, 9);
  });

  it('is a matched load at gamma zero', () => {
    expect(vswrFromGamma(0)).toBeCloseTo(1, 12);
    expect(mismatchLossDb(0)).toBeCloseTo(0, 12);
    expect(transmittedFraction(0)).toBeCloseTo(1, 12);
    expect(Number.isFinite(returnLossDbFromGamma(0))).toBe(false);
  });

  it('round trips between the three parameters', () => {
    for (const vswr of [1.05, 1.2, 1.5, 2, 3, 10]) {
      const gamma = gammaFromVswr(vswr);
      expect(vswrFromReturnLossDb(returnLossDbFromGamma(gamma))).toBeCloseTo(vswr, 9);
      expect(gammaFromReturnLossDb(returnLossDbFromVswr(vswr))).toBeCloseTo(gamma, 12);
    }
  });
});
