
/**
 * Length units shared by the metrology and layout tools.
 *
 * Every conversion goes through a single explicit table so no tool has to
 * remember a factor: the UI always shows the unit next to the field, and the
 * pure functions below are the only place a factor appears.
 */
export type LengthUnit = 'nm' | 'µm' | 'mm' | 'cm' | 'mil' | 'inch';

export const LENGTH_UNITS: LengthUnit[] = ['nm', 'µm', 'mm', 'cm', 'mil', 'inch'];

/** Multiplier that converts a value expressed in the given unit into centimetres. */
export const LENGTH_TO_CM: Record<LengthUnit, number> = {
  nm: 1e-7,
  µm: 1e-4,
  mm: 0.1,
  cm: 1,
  mil: 2.54e-3,
  inch: 2.54,
};

/** Multiplier that converts a value expressed in the given unit into millimetres. */
export const LENGTH_TO_MM: Record<LengthUnit, number> = {
  nm: 1e-6,
  µm: 1e-3,
  mm: 1,
  cm: 10,
  mil: 2.54e-2,
  inch: 25.4,
};

export function toCm(value: number, unit: LengthUnit): number {
  return value * LENGTH_TO_CM[unit];
}

export function toMm(value: number, unit: LengthUnit): number {
  return value * LENGTH_TO_MM[unit];
}

export function fromMm(value: number, unit: LengthUnit): number {
  return value / LENGTH_TO_MM[unit];
}
