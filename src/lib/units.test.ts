
import { describe, expect, it } from 'vitest';
import {
  DIE_LENGTH_UNITS,
  LENGTH_LABELS,
  LENGTH_UNITS,
  convertLength,
  fromMm,
  toCm,
  toMm,
} from './units';

describe('length units', () => {
  it('defines every unit once, with a label', () => {
    expect(LENGTH_UNITS).toHaveLength(8);
    for (const unit of LENGTH_UNITS) {
      expect(LENGTH_LABELS[unit]).toBeTruthy();
    }
  });

  it('keeps the geometry-facing list to wafer-scale units', () => {
    expect(DIE_LENGTH_UNITS).toEqual(['mm', 'cm', 'inch']);
  });

  it('uses the exact inch, foot and mil definitions', () => {
    expect(toMm(1, 'inch')).toBe(25.4);
    expect(toMm(1, 'mil')).toBe(0.0254);
    expect(convertLength(1, 'inch').mil).toBeCloseTo(1000, 9);
    expect(convertLength(1, 'mil').nm).toBeCloseTo(25400, 6);
  });

  it('treats an angstrom as exactly 0.1 nm', () => {
    expect(toMm(1, 'angstrom')).toBe(1e-7);
    expect(convertLength(1, 'angstrom').nm).toBeCloseTo(0.1, 12);
    expect(convertLength(1000, 'angstrom').µm).toBeCloseTo(0.1, 12);
  });

  it('converts a 1000 Å film into the units a fab would quote it in', () => {
    const converted = convertLength(1000, 'angstrom');
    expect(converted.nm).toBeCloseTo(100, 9);
    expect(converted.µm).toBeCloseTo(0.1, 12);
    expect(converted.mm).toBeCloseTo(1e-4, 15);
    expect(converted.inch).toBeCloseTo(3.937007874015748e-6, 15);
    expect(converted.m).toBeCloseTo(1e-7, 18);
  });

  it('round-trips through millimetres without drift', () => {
    expect(convertLength(1, 'm').angstrom).toBeCloseTo(1e10, 0);
    expect(fromMm(toMm(123.456, 'µm'), 'µm')).toBeCloseTo(123.456, 9);
    expect(toCm(1, 'inch')).toBe(2.54);
  });
});
