
import { describe, expect, it } from 'vitest';
import { PRESSURE_LABELS, PRESSURE_UNITS, convertPressure, toPa } from './pressure';

describe('pressure units', () => {
  it('labels every unit', () => {
    expect(PRESSURE_UNITS).toHaveLength(9);
    for (const unit of PRESSURE_UNITS) {
      expect(PRESSURE_LABELS[unit]).toBeTruthy();
    }
  });

  it('makes 760 Torr exactly 1 atm', () => {
    const oneAtmosphere = convertPressure(1, 'atm');
    expect(oneAtmosphere.Pa).toBe(101325);
    expect(oneAtmosphere.Torr).toBeCloseTo(760, 12);
    expect(oneAtmosphere.mbar).toBeCloseTo(1013.25, 12);
    expect(oneAtmosphere.bar).toBeCloseTo(1.01325, 12);
    expect(oneAtmosphere.mTorr).toBeCloseTo(760000, 6);
  });

  it('uses the exact pascal definition of the Torr', () => {
    expect(toPa(1, 'Torr')).toBeCloseTo(133.32236842105263, 12);
    expect(convertPressure(1, 'Torr').mbar).toBeCloseTo(1.3332236842105263, 12);
    expect(convertPressure(1, 'mbar').Torr).toBeCloseTo(0.7500616827041697, 12);
  });

  it('derives psi from the pound-force and the square inch', () => {
    expect(toPa(1, 'psi')).toBeCloseTo(6894.757293168361, 9);
    expect(convertPressure(1, 'atm').psi).toBeCloseTo(14.69594877551345, 12);
  });

  it('spans the vacuum range without losing the base unit', () => {
    const midVacuum = convertPressure(1, 'mTorr');
    expect(midVacuum.Pa).toBeCloseTo(0.13332236842105263, 15);
    expect(convertPressure(100, 'Pa').mbar).toBeCloseTo(1, 12);
    expect(convertPressure(1, 'MPa').bar).toBeCloseTo(10, 12);
  });
});
