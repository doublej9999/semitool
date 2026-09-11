
import { describe, expect, it } from 'vitest';
import {
  TEMPERATURE_DIFFERENCE_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_UNITS,
  belowAbsoluteZero,
  convertTemperature,
  fromKelvin,
  toKelvin,
} from './temperature';

describe('temperature scales', () => {
  it('labels every scale for both modes', () => {
    expect(TEMPERATURE_UNITS).toHaveLength(4);
    for (const unit of TEMPERATURE_UNITS) {
      expect(TEMPERATURE_LABELS[unit]).toBeTruthy();
      expect(TEMPERATURE_DIFFERENCE_LABELS[unit]).toBeTruthy();
    }
  });

  it('converts room temperature between the absolute scales', () => {
    const converted = convertTemperature(25, 'C', 'absolute');
    expect(converted.F).toBeCloseTo(77, 9);
    expect(converted.K).toBeCloseTo(298.15, 9);
    expect(converted.R).toBeCloseTo(536.67, 9);
  });

  it('has a single point where Celsius and Fahrenheit agree', () => {
    expect(convertTemperature(-40, 'C', 'absolute').F).toBeCloseTo(-40, 9);
    expect(convertTemperature(-40, 'F', 'absolute').C).toBeCloseTo(-40, 9);
  });

  it('places absolute zero on every scale', () => {
    const zeroKelvin = convertTemperature(0, 'K', 'absolute');
    expect(zeroKelvin.C).toBeCloseTo(-273.15, 9);
    expect(zeroKelvin.F).toBeCloseTo(-459.67, 9);
    expect(zeroKelvin.R).toBeCloseTo(0, 9);
    expect(toKelvin(-459.67, 'F')).toBeCloseTo(0, 9);
    expect(fromKelvin(0, 'F')).toBeCloseTo(-459.67, 9);
  });

  it('flags temperatures below absolute zero', () => {
    expect(belowAbsoluteZero(-300, 'C')).toBe(true);
    expect(belowAbsoluteZero(-273.15, 'C')).toBe(false);
    expect(belowAbsoluteZero(-460, 'F')).toBe(true);
    expect(belowAbsoluteZero(0, 'K')).toBe(false);
  });

  it('scales a temperature difference without the offset', () => {
    const rise = convertTemperature(10, 'C', 'difference');
    expect(rise.F).toBeCloseTo(18, 9);
    expect(rise.K).toBeCloseTo(10, 9);
    expect(rise.R).toBeCloseTo(18, 9);
    // The same rise in Fahrenheit, converted back, is the original step.
    expect(convertTemperature(18, 'F', 'difference').C).toBeCloseTo(10, 9);
    // Contrast with the absolute reading, where 10 °C is 50 °F.
    expect(convertTemperature(10, 'C', 'absolute').F).toBeCloseTo(50, 9);
  });
});
