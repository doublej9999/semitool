
/**
 * Length units shared by the metrology, layout and conversion tools.
 *
 * Every conversion goes through a single explicit table so no tool has to
 * remember a factor: the UI always shows the unit next to the field, and the
 * functions below are the only place a factor appears.
 *
 * Exact definitions used here:
 *   1 in  = 25.4 mm exactly (international yard and pound agreement, 1959)
 *   1 mil = 0.001 in exactly
 *   1 Å   = 0.1 nm = 1e-10 m exactly
 */
export type LengthUnit = 'angstrom' | 'nm' | 'µm' | 'mil' | 'mm' | 'cm' | 'inch' | 'm';

/** Ordered smallest to largest so a unit picker reads in a predictable order. */
export const LENGTH_UNITS: LengthUnit[] = ['angstrom', 'nm', 'µm', 'mil', 'mm', 'cm', 'inch', 'm'];

/** Display labels: the id is the key, the label is what a user reads. */
export const LENGTH_LABELS: Record<LengthUnit, string> = {
  angstrom: 'Å',
  nm: 'nm',
  µm: 'µm',
  mil: 'mil',
  mm: 'mm',
  cm: 'cm',
  inch: 'in',
  m: 'm',
};

/**
 * Units offered for wafer, die, field and edge-exclusion dimensions. Angstroms
 * and metres only make sense for films and long distances, so the geometry
 * tools use this shorter list instead of the full one.
 */
export const DIE_LENGTH_UNITS: LengthUnit[] = ['mm', 'cm', 'inch'];

/** Multiplier that converts a value expressed in the given unit into millimetres. */
export const LENGTH_TO_MM: Record<LengthUnit, number> = {
  angstrom: 1e-7,
  nm: 1e-6,
  µm: 1e-3,
  mil: 2.54e-2,
  mm: 1,
  cm: 10,
  inch: 25.4,
  m: 1000,
};

/** Multiplier that converts a value expressed in the given unit into centimetres. */
export const LENGTH_TO_CM: Record<LengthUnit, number> = {
  angstrom: 1e-8,
  nm: 1e-7,
  µm: 1e-4,
  mil: 2.54e-3,
  mm: 0.1,
  cm: 1,
  inch: 2.54,
  m: 100,
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

/**
 * One length expressed in every supported unit. The value is carried through
 * millimetres so a single factor per unit is ever used.
 */
export function convertLength(value: number, from: LengthUnit): Record<LengthUnit, number> {
  const millimetres = toMm(value, from);
  const converted = {} as Record<LengthUnit, number>;
  for (const unit of LENGTH_UNITS) {
    converted[unit] = millimetres / LENGTH_TO_MM[unit];
  }
  return converted;
}
