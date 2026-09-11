
/**
 * Power units.
 *
 * Exact anchors used here:
 *   1 hp       = 550 ft·lbf/s = 550 x 0.3048 x 0.45359237 x 9.80665 W = 745.6998715822702 W
 *   1 BTU(IT)  = 1055.05585262 J, so 1 BTU/h = 1055.05585262 / 3600 W
 *   1 cal(th)  = 4.184 J exactly, so 1 cal/s = 4.184 W
 *   1 ft·lbf/s = 1.3558179483314004 W
 *   0 dBm      = 1 mW, 0 dBW = 1 W, P(dBm) = 10 log10(P / 1 mW)
 *
 * dBm and dBW are logarithmic, so a linear reading of zero watts has no
 * finite decibel value; that is reported as not-a-number rather than as a
 * large negative number that looks like a real answer.
 */
export type PowerUnit = 'W' | 'mW' | 'uW' | 'kW' | 'hp' | 'btu_h' | 'cal_s' | 'ftlb_s' | 'dBm' | 'dBW';

export const POWER_UNITS: PowerUnit[] = ['W', 'mW', 'uW', 'kW', 'hp', 'btu_h', 'cal_s', 'ftlb_s', 'dBm', 'dBW'];

export const POWER_LABELS: Record<PowerUnit, string> = {
  W: 'W',
  mW: 'mW',
  uW: 'µW',
  kW: 'kW',
  hp: 'hp',
  btu_h: 'BTU/h',
  cal_s: 'cal/s',
  ftlb_s: 'ft·lbf/s',
  dBm: 'dBm',
  dBW: 'dBW',
};

/** W per one unit, for the linear units only. */
const WATT_PER_UNIT: Record<Exclude<PowerUnit, 'dBm' | 'dBW'>, number> = {
  W: 1,
  mW: 1e-3,
  uW: 1e-6,
  kW: 1e3,
  hp: 745.6998715822702,
  btu_h: 1055.05585262 / 3600,
  cal_s: 4.184,
  ftlb_s: 1.3558179483314004,
};

const LOG_UNITS: Exclude<PowerUnit, 'dBm' | 'dBW'>[] = ['W', 'mW', 'uW', 'kW', 'hp', 'btu_h', 'cal_s', 'ftlb_s'];

export function isLogarithmicPowerUnit(unit: PowerUnit): boolean {
  return unit === 'dBm' || unit === 'dBW';
}

/** Watts for a reading in any unit; decibel units go through their reference. */
export function wattsFrom(value: number, unit: PowerUnit): number {
  if (unit === 'dBm') return 1e-3 * 10 ** (value / 10);
  if (unit === 'dBW') return 10 ** (value / 10);
  return value * WATT_PER_UNIT[unit];
}

/** dBm for a power in watts; not finite at zero and below. */
export function wattsToDbm(watts: number): number {
  return 10 * Math.log10(watts / 1e-3);
}

export function wattsToDbw(watts: number): number {
  return 10 * Math.log10(watts);
}

/** One power, in every supported unit. */
export function convertPower(value: number, from: PowerUnit): Record<PowerUnit, number> {
  const watts = wattsFrom(value, from);
  const converted = {} as Record<PowerUnit, number>;
  for (const unit of LOG_UNITS) {
    converted[unit] = watts / WATT_PER_UNIT[unit];
  }
  converted.dBm = wattsToDbm(watts);
  converted.dBW = wattsToDbw(watts);
  return converted;
}

/** True when a reading is physically possible: a linear power must not be negative. */
export function belowZeroPower(value: number, unit: PowerUnit): boolean {
  return !isLogarithmicPowerUnit(unit) && value < 0;
}

/* ------------------------------------------------------------------ *
 * Power, voltage and impedance (a real load, a sine wave)
 * ------------------------------------------------------------------ */

/** RMS volts across a real load R carrying power P: V = sqrt(P R). */
export function voltsRmsFromWatts(watts: number, ohms: number): number {
  return Math.sqrt(watts * ohms);
}

/** Power into a real load R from an RMS voltage: P = V^2 / R. */
export function wattsFromVoltsRms(volts: number, ohms: number): number {
  return (volts * volts) / ohms;
}

/** Peak-to-peak voltage of a sine wave from its RMS value: Vpp = 2 sqrt(2) Vrms. */
export function vrmsToVpp(voltsRms: number): number {
  return 2 * Math.SQRT2 * voltsRms;
}

/** Peak voltage of a sine wave from its RMS value. */
export function vrmsToVpeak(voltsRms: number): number {
  return Math.SQRT2 * voltsRms;
}
