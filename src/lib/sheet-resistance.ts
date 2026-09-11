
import { type LengthUnit, toCm } from './units';

export type CurrentUnit = 'A' | 'mA' | 'µA';
export type VoltageUnit = 'V' | 'mV' | 'µV';

export const CURRENT_UNITS: CurrentUnit[] = ['A', 'mA', 'µA'];
export const VOLTAGE_UNITS: VoltageUnit[] = ['V', 'mV', 'µV'];

export { LENGTH_UNITS, type LengthUnit } from './units';

const CURRENT_TO_A: Record<CurrentUnit, number> = { A: 1, mA: 1e-3, µA: 1e-6 };
const VOLTAGE_TO_V: Record<VoltageUnit, number> = { V: 1, mV: 1e-3, µV: 1e-6 };

/**
 * Geometric factor of a collinear four-point probe measuring a thin film:
 * pi / ln 2 = 4.5324. It comes from mapping the two-dimensional current
 * spreading between the outer probes onto the measured inner-probe voltage.
 *
 * This is a textbook factor, not a metrology-standard claim: real measurements
 * also depend on probe geometry, contact placement and how well the film is
 * insulating underneath, which is why the tool states the t / s ratio it is
 * relying on instead of silently assuming it.
 */
export const FOUR_POINT_FACTOR = Math.PI / Math.LN2;

/** Film thickness divided by probe spacing at or below which the thin-film relation is used. */
export const THIN_FILM_RATIO_LIMIT = 0.5;

export function toAmps(value: number, unit: CurrentUnit): number {
  return value * CURRENT_TO_A[unit];
}

export function toVolts(value: number, unit: VoltageUnit): number {
  return value * VOLTAGE_TO_V[unit];
}

export interface ProbeInput {
  /** Distance between adjacent probe tips. */
  spacing: number;
  spacingUnit: LengthUnit;
  /** Current forced through the outer probes. */
  current: number;
  currentUnit: CurrentUnit;
  /** Voltage measured across the inner probes. */
  voltage: number;
  voltageUnit: VoltageUnit;
  /** Film thickness. */
  thickness: number;
  thicknessUnit: LengthUnit;
}

export interface ProbeSuccess {
  ok: true;
  /** Sheet resistance in ohms per square (Ω/sq). */
  sheetResistance: number;
  /** Resistivity in ohm-centimetres (Ω·cm). */
  resistivity: number;
  /** Conductivity in siemens per centimetre (S/cm). */
  conductivity: number;
  thicknessCm: number;
  spacingCm: number;
  thicknessOverSpacing: number;
  /** False when the film is too thick for the thin-film relation to be trustworthy. */
  thinFilmValid: boolean;
}

export interface SheetFailure {
  ok: false;
  errors: string[];
}

export type ProbeResult = ProbeSuccess | SheetFailure;

function validatePositive(values: Array<[string, number]>, errors: string[]) {
  for (const [label, value] of values) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${label} must be greater than 0.`);
  }
}

export function calculateSheetResistance(input: ProbeInput): ProbeResult {
  const errors: string[] = [];
  validatePositive(
    [
      ['Probe spacing', input.spacing],
      ['Measured current', input.current],
      ['Measured voltage', input.voltage],
      ['Film thickness', input.thickness],
    ],
    errors,
  );
  if (errors.length > 0) return { ok: false, errors };

  const spacingCm = toCm(input.spacing, input.spacingUnit);
  const thicknessCm = toCm(input.thickness, input.thicknessUnit);
  const currentA = toAmps(input.current, input.currentUnit);
  const voltageV = toVolts(input.voltage, input.voltageUnit);

  // Thin-film relation: the current spreads in two dimensions, so the probe
  // spacing cancels and only the geometric factor survives.
  const sheetResistance = FOUR_POINT_FACTOR * (voltageV / currentA);
  const resistivity = sheetResistance * thicknessCm;
  const conductivity = 1 / resistivity;
  const thicknessOverSpacing = thicknessCm / spacingCm;

  return {
    ok: true,
    sheetResistance,
    resistivity,
    conductivity,
    thicknessCm,
    spacingCm,
    thicknessOverSpacing,
    thinFilmValid: thicknessOverSpacing <= THIN_FILM_RATIO_LIMIT,
  };
}

/** Sheet resistance and resistivity are the same number scaled by thickness. */
export function resistivityFromSheet(sheetResistance: number, thicknessCm: number): number {
  return sheetResistance * thicknessCm;
}

export function sheetFromResistivity(resistivity: number, thicknessCm: number): number {
  return resistivity / thicknessCm;
}

export interface ConversionInput {
  /** Leave as NaN when the resistivity is the known value. */
  sheetResistance: number;
  /** Leave as NaN when the sheet resistance is the known value. */
  resistivity: number;
  thickness: number;
  thicknessUnit: LengthUnit;
}

export interface ConversionSuccess {
  ok: true;
  sheetResistance: number;
  resistivity: number;
  conductivity: number;
  thicknessCm: number;
}

export type ConversionResult = ConversionSuccess | SheetFailure;

/**
 * Two-way relation between sheet resistance and resistivity for a film of known
 * thickness. Supply exactly one of the two and the other is derived, so the
 * tool never has to guess which number the user meant.
 */
export function convertSheetAndResistivity(input: ConversionInput): ConversionResult {
  const errors: string[] = [];
  const hasSheet = Number.isFinite(input.sheetResistance);
  const hasResistivity = Number.isFinite(input.resistivity);

  if (hasSheet && hasResistivity) errors.push('Enter either sheet resistance or resistivity, not both.');
  if (!hasSheet && !hasResistivity) errors.push('Enter a sheet resistance or a resistivity.');
  validatePositive([['Film thickness', input.thickness]], errors);
  if (errors.length > 0) return { ok: false, errors };

  const thicknessCm = toCm(input.thickness, input.thicknessUnit);
  const sheetResistance = hasSheet ? input.sheetResistance : sheetFromResistivity(input.resistivity, thicknessCm);
  const resistivity = hasSheet ? resistivityFromSheet(input.sheetResistance, thicknessCm) : input.resistivity;

  if (!Number.isFinite(sheetResistance) || sheetResistance <= 0 || !Number.isFinite(resistivity) || resistivity <= 0) {
    return { ok: false, errors: ['Sheet resistance and resistivity must both be greater than 0.'] };
  }

  return { ok: true, sheetResistance, resistivity, conductivity: 1 / resistivity, thicknessCm };
}
