
/**
 * Temperature scales.
 *
 * Exact definitions used here:
 *   T(K) = T(°C) + 273.15
 *   T(°F) = T(°C) x 9/5 + 32
 *   T(°R) = T(K) x 9/5
 *
 * These conversions carry an offset, so a temperature *difference* does not
 * convert like a temperature: a 10 °C rise is an 18 °F rise, not a 50 °F rise.
 * The mode is therefore explicit instead of guessed.
 */
export type TemperatureUnit = 'C' | 'F' | 'K' | 'R';

export const TEMPERATURE_UNITS: TemperatureUnit[] = ['C', 'F', 'K', 'R'];

export const TEMPERATURE_LABELS: Record<TemperatureUnit, string> = {
  C: '°C',
  F: '°F',
  K: 'K',
  R: '°R',
};

/** Labels used when the quantity is a temperature difference rather than a temperature. */
export const TEMPERATURE_DIFFERENCE_LABELS: Record<TemperatureUnit, string> = {
  C: 'Δ°C',
  F: 'Δ°F',
  K: 'ΔK',
  R: 'Δ°R',
};

export type TemperatureMode = 'absolute' | 'difference';

const ABSOLUTE_TO_KELVIN: Record<TemperatureUnit, (value: number) => number> = {
  C: (value) => value + 273.15,
  F: (value) => ((value + 459.67) * 5) / 9,
  K: (value) => value,
  R: (value) => (value * 5) / 9,
};

const KELVIN_TO_ABSOLUTE: Record<TemperatureUnit, (kelvin: number) => number> = {
  C: (kelvin) => kelvin - 273.15,
  F: (kelvin) => (kelvin * 9) / 5 - 459.67,
  K: (kelvin) => kelvin,
  R: (kelvin) => (kelvin * 9) / 5,
};

/** A one-degree step on each scale, expressed in kelvin. */
const DIFFERENCE_TO_KELVIN: Record<TemperatureUnit, number> = {
  C: 1,
  F: 5 / 9,
  K: 1,
  R: 5 / 9,
};

export function toKelvin(value: number, unit: TemperatureUnit): number {
  return ABSOLUTE_TO_KELVIN[unit](value);
}

export function fromKelvin(kelvin: number, unit: TemperatureUnit): number {
  return KELVIN_TO_ABSOLUTE[unit](kelvin);
}

/** True when an absolute temperature lies below 0 K, which is not physical. */
export function belowAbsoluteZero(value: number, unit: TemperatureUnit): boolean {
  return toKelvin(value, unit) < 0;
}

/** One temperature, or one temperature difference, in every supported scale. */
export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  mode: TemperatureMode,
): Record<TemperatureUnit, number> {
  const converted = {} as Record<TemperatureUnit, number>;
  if (mode === 'difference') {
    const kelvin = value * DIFFERENCE_TO_KELVIN[from];
    for (const unit of TEMPERATURE_UNITS) {
      converted[unit] = kelvin / DIFFERENCE_TO_KELVIN[unit];
    }
    return converted;
  }
  const kelvin = toKelvin(value, from);
  for (const unit of TEMPERATURE_UNITS) {
    converted[unit] = fromKelvin(kelvin, unit);
  }
  return converted;
}
