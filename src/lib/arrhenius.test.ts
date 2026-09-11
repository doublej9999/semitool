
import { describe, expect, it } from 'vitest';
import {
  BOLTZMANN_EV_PER_K,
  calculateArrhenius,
  celsiusToKelvin,
  extractActivationEnergy,
  kelvinToCelsius,
} from './arrhenius';

describe('calculateArrhenius', () => {
  it('computes boron diffusivity in silicon at 1000 C', () => {
    const result = calculateArrhenius({ prefactor: 0.76, activationEnergyEv: 3.46, temperatureC: 1000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.temperatureK).toBeCloseTo(1273.15, 10);
    expect(result.thermalEnergyEv).toBeCloseTo(0.10971157842515301, 12);
    expect(result.exponent).toBeCloseTo(-31.53723654026605, 8);
    expect(result.rate).toBeCloseTo(1.5288532062309314e-14, 26);
  });

  it('gives a roughly tenfold rate per hundred degrees at this activation energy', () => {
    const hot = calculateArrhenius({ prefactor: 0.76, activationEnergyEv: 3.46, temperatureC: 1100 });
    const cool = calculateArrhenius({ prefactor: 0.76, activationEnergyEv: 3.46, temperatureC: 1000 });
    expect(hot.ok && cool.ok).toBe(true);
    if (!hot.ok || !cool.ok) return;
    expect(hot.rate).toBeCloseTo(1.519893309359959e-13, 25);
    expect(hot.rate / cool.rate).toBeCloseTo(9.941394655585928, 10);
  });

  it('treats a zero activation energy as temperature independent', () => {
    const result = calculateArrhenius({ prefactor: 42, activationEnergyEv: 0, temperatureC: -100 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rate).toBeCloseTo(42, 10);
  });

  it('rejects a non-positive prefactor and a temperature below absolute zero', () => {
    expect(calculateArrhenius({ prefactor: 0, activationEnergyEv: 1, temperatureC: 100 }).ok).toBe(false);
    expect(calculateArrhenius({ prefactor: 1, activationEnergyEv: 1, temperatureC: -300 }).ok).toBe(false);
  });
});

describe('extractActivationEnergy', () => {
  const prefactor = 1e-2;
  const activationEnergyEv = 1;
  const rate = (celsius: number) => prefactor * Math.exp(-activationEnergyEv / (BOLTZMANN_EV_PER_K * celsiusToKelvin(celsius)));

  it('recovers the activation energy and prefactor from two points', () => {
    const result = extractActivationEnergy({
      temperature1C: 1000,
      rate1: rate(1000),
      temperature2C: 1100,
      rate2: rate(1100),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activationEnergyEv).toBeCloseTo(1, 10);
    expect(result.prefactor).toBeCloseTo(1e-2, 12);
    expect(result.rateRatio).toBeCloseTo(1.9421356969292052, 10);
  });

  it('is symmetric when the two points are swapped', () => {
    const result = extractActivationEnergy({
      temperature1C: 1100,
      rate1: rate(1100),
      temperature2C: 1000,
      rate2: rate(1000),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activationEnergyEv).toBeCloseTo(1, 10);
  });

  it('refuses equal temperatures and equal rates', () => {
    expect(extractActivationEnergy({ temperature1C: 1000, rate1: 1, temperature2C: 1000, rate2: 2 }).ok).toBe(false);
    expect(extractActivationEnergy({ temperature1C: 1000, rate1: 1, temperature2C: 1100, rate2: 1 }).ok).toBe(false);
  });
});

describe('temperature conversion', () => {
  it('round trips celsius and kelvin', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 10);
    expect(kelvinToCelsius(273.15)).toBeCloseTo(0, 10);
    expect(kelvinToCelsius(celsiusToKelvin(1000))).toBeCloseTo(1000, 10);
  });
});
