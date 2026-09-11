import { describe, expect, it } from 'vitest';
import {
  SPEED_OF_LIGHT_MPS,
  delayPsPerMm,
  effectivePermittivity,
  microstripAnalyze,
  microstripSynthesize,
  microstripZ0,
  phaseVelocityMps,
  wavelengthM,
} from './tline';

describe('guided wavelength', () => {
  it('scales with the square root of the permittivity', () => {
    expect(wavelengthM(2.4e9, 1)).toBeCloseTo(SPEED_OF_LIGHT_MPS / 2.4e9, 12);
    expect(wavelengthM(2.4e9, 4.4)).toBeCloseTo(0.059550186091870926, 15);
    expect(wavelengthM(1e9, 1)).toBeCloseTo(0.299792458, 12);
  });

  it('reports the phase velocity and the per-millimetre delay', () => {
    expect(phaseVelocityMps(1)).toBeCloseTo(SPEED_OF_LIGHT_MPS, 6);
    expect(delayPsPerMm(1)).toBeCloseTo(3.3356409519815204, 15);
    expect(delayPsPerMm(4)).toBeCloseTo(2 * 3.3356409519815204, 14);
  });
});

describe('microstrip analysis', () => {
  it('reports the classic Hammerstad-Jensen values', () => {
    const oneSquare = microstripAnalyze({
      widthUm: 100,
      heightUm: 100,
      er: 4.4,
      frequencyHz: 2.4e9,
    });
    expect(oneSquare.ratio).toBeCloseTo(1, 12);
    expect(oneSquare.z0Ohm).toBeCloseTo(71.03111370309027, 9);
    expect(oneSquare.effectiveEr).toBeCloseTo(3.1678227977495026, 9);

    const fiftyOhmish = microstripAnalyze({
      widthUm: 1000,
      heightUm: 500,
      er: 4.2,
      frequencyHz: 1e9,
    });
    expect(fiftyOhmish.z0Ohm).toBeCloseTo(49.71402969502613, 9);

    const wide = microstripAnalyze({
      widthUm: 1500,
      heightUm: 500,
      er: 4.4,
      frequencyHz: 1e9,
    });
    expect(wide.z0Ohm).toBeCloseTo(37.4726847361231, 9);
  });

  it('drops the impedance as the trace gets wider', () => {
    const narrow = microstripZ0(0.5, 4.4);
    const wide = microstripZ0(5, 4.4);
    expect(narrow).toBeCloseTo(95.45337025775137, 9);
    expect(wide).toBeLessThan(narrow);
    expect(effectivePermittivity(5, 4.4)).toBeGreaterThan(effectivePermittivity(0.5, 4.4));
  });

  it('rejects a non-positive width, height, er below 1 and a bad frequency', () => {
    expect(() =>
      microstripAnalyze({ widthUm: 0, heightUm: 100, er: 4.4, frequencyHz: 1e9 }),
    ).toThrow(/width/);
    expect(() =>
      microstripAnalyze({ widthUm: 100, heightUm: 0, er: 4.4, frequencyHz: 1e9 }),
    ).toThrow(/height/);
    expect(() =>
      microstripAnalyze({ widthUm: 100, heightUm: 100, er: 0.5, frequencyHz: 1e9 }),
    ).toThrow(/permittivity/);
    expect(() =>
      microstripAnalyze({ widthUm: 100, heightUm: 100, er: 4.4, frequencyHz: 0 }),
    ).toThrow(/frequency/);
  });
});

describe('microstrip synthesis', () => {
  it('refines the fit so the width reproduces the target impedance', () => {
    for (const target of [20, 28, 50, 75, 100]) {
      const solved = microstripSynthesize({
        targetZ0Ohm: target,
        heightUm: 500,
        er: 4.4,
        frequencyHz: 1e9,
      });
      // Re-analysing the solved width must return the impedance that was asked for.
      const roundTrip = microstripAnalyze({
        widthUm: solved.widthUm,
        heightUm: 500,
        er: 4.4,
        frequencyHz: 1e9,
      });
      expect(roundTrip.z0Ohm).toBeCloseTo(target, 6);
      expect(solved.ratio).toBeGreaterThan(0);
    }
  });

  it('matches the symmetric case and the published examples', () => {
    const fifty = microstripSynthesize({
      targetZ0Ohm: 50,
      heightUm: 500,
      er: 4.4,
      frequencyHz: 1e9,
    });
    expect(fifty.ratio).toBeCloseTo(1.9138183207936972, 6);
    expect(fifty.z0Ohm).toBeCloseTo(50, 6);

    const seventyFive = microstripSynthesize({
      targetZ0Ohm: 75,
      heightUm: 500,
      er: 4.4,
      frequencyHz: 1e9,
    });
    expect(seventyFive.ratio).toBeCloseTo(0.8912666444755896, 6);

    const hundred = microstripSynthesize({
      targetZ0Ohm: 100,
      heightUm: 500,
      er: 3,
      frequencyHz: 1e9,
    });
    expect(hundred.ratio).toBeCloseTo(0.6695499753997589, 6);
  });

  it('rejects a non-positive target impedance', () => {
    expect(() =>
      microstripSynthesize({ targetZ0Ohm: 0, heightUm: 500, er: 4.4, frequencyHz: 1e9 }),
    ).toThrow(/target impedance/);
  });
});
