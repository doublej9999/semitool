
/**
 * Pressure and vacuum units.
 *
 * Exact definitions used here:
 *   1 atm   = 101 325 Pa exactly
 *   1 Torr  = 1/760 atm exactly (the Torr is defined through the atmosphere,
 *             which is why 760 Torr is exactly 1 atm while the legacy
 *             millimetre of mercury differs in the seventh significant figure)
 *   1 bar   = 100 000 Pa exactly
 *   1 psi   = 1 lbf / in^2, from 1 lbf = 4.448 221 615 260 5 N exactly
 *             (1 lb = 0.453 592 37 kg and g0 = 9.806 65 m/s^2, both exact)
 *             and 1 in^2 = 645.16 mm^2 exactly, so it follows from definitions
 *             rather than from a rounded constant.
 */
export type PressureUnit = 'Pa' | 'kPa' | 'MPa' | 'bar' | 'mbar' | 'Torr' | 'mTorr' | 'atm' | 'psi';

const PASCAL_PER_ATM = 101325;
const POUND_FORCE_NEWTON = 4.4482216152605;
const SQUARE_INCH_M2 = 0.00064516;

/** Ordered from the smallest unit to the largest so a picker reads predictably. */
export const PRESSURE_UNITS: PressureUnit[] = ['Pa', 'kPa', 'MPa', 'bar', 'mbar', 'Torr', 'mTorr', 'atm', 'psi'];

export const PRESSURE_LABELS: Record<PressureUnit, string> = {
  Pa: 'Pa',
  kPa: 'kPa',
  MPa: 'MPa',
  bar: 'bar',
  mbar: 'mbar',
  Torr: 'Torr',
  mTorr: 'mTorr',
  atm: 'atm',
  psi: 'psi',
};

/** Multiplier that converts a value expressed in the given unit into pascals. */
export const PRESSURE_TO_PA: Record<PressureUnit, number> = {
  Pa: 1,
  kPa: 1e3,
  MPa: 1e6,
  bar: 1e5,
  mbar: 1e2,
  Torr: PASCAL_PER_ATM / 760,
  mTorr: PASCAL_PER_ATM / 760 / 1000,
  atm: PASCAL_PER_ATM,
  psi: POUND_FORCE_NEWTON / SQUARE_INCH_M2,
};

export function toPa(value: number, unit: PressureUnit): number {
  return value * PRESSURE_TO_PA[unit];
}

/** One pressure expressed in every supported unit. */
export function convertPressure(value: number, from: PressureUnit): Record<PressureUnit, number> {
  const pascals = toPa(value, from);
  const converted = {} as Record<PressureUnit, number>;
  for (const unit of PRESSURE_UNITS) {
    converted[unit] = pascals / PRESSURE_TO_PA[unit];
  }
  return converted;
}
