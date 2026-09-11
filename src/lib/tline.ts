/**
 * Transmission lines: guided wavelength and microstrip geometry.
 *
 * The microstrip model is the Hammerstad-Jensen closed form, which is good to
 * a couple of percent over roughly 0.01 < W/H < 100. Synthesis starts from the
 * Hammerstad fit and then bisects the forward model, so the width that is
 * quoted reproduces the requested impedance to within 1e-4 ohm instead of
 * carrying the fit's own ~1% error into the answer.
 *
 * This is a quasi-static model: no dispersion, no radiation, no conductor
 * thickness and no discontinuity effects. It is the right first estimate for a
 * 50 ohm line, not a substitute for a field solver.
 */

export const SPEED_OF_LIGHT_MPS = 299792458;

/** Vacuum wave impedance, ohm. */
export const VACUUM_IMPEDANCE_OHM = 376.730313668;

export interface MicrostripInput {
  widthUm: number;
  heightUm: number;
  er: number;
  frequencyHz: number;
}

export interface MicrostripResult {
  ratio: number;
  z0Ohm: number;
  effectiveEr: number;
  guidedWavelengthM: number;
  phaseVelocityMps: number;
  delayPsPerMm: number;
}

function assertGeometry(heightUm: number, er: number, frequencyHz: number): void {
  if (!Number.isFinite(heightUm) || heightUm <= 0) {
    throw new Error('The substrate height must be greater than 0 um.');
  }
  if (!Number.isFinite(er) || er < 1) {
    throw new Error('The relative permittivity must be at least 1.');
  }
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new Error('The frequency must be greater than 0 Hz.');
  }
}

function hammerstadF(ratio: number): number {
  return 6 + (2 * Math.PI - 6) * Math.exp(-Math.pow(30.666 / ratio, 0.7528));
}

/** Effective permittivity of a microstrip line, Hammerstad-Jensen. */
export function effectivePermittivity(ratio: number, er: number): number {
  const a =
    1 +
    (1 / 49) * Math.log((Math.pow(ratio, 4) + Math.pow(ratio / 52, 2)) / (Math.pow(ratio, 4) + 0.432)) +
    (1 / 18.7) * Math.log(1 + Math.pow(ratio / 18.1, 3));
  const b = 0.564 * Math.pow((er - 0.9) / (er + 3), 0.053);
  return (er + 1) / 2 + ((er - 1) / 2) * Math.pow(1 + 10 / ratio, -a * b);
}

/** Characteristic impedance of a microstrip line, ohm. */
export function microstripZ0(ratio: number, er: number): number {
  const air =
    (VACUUM_IMPEDANCE_OHM / (2 * Math.PI)) *
    Math.log(hammerstadF(ratio) / ratio + Math.sqrt(1 + Math.pow(2 / ratio, 2)));
  return air / Math.sqrt(effectivePermittivity(ratio, er));
}

/** Guided wavelength in a medium of relative permittivity er. */
export function wavelengthM(frequencyHz: number, er: number): number {
  return SPEED_OF_LIGHT_MPS / (frequencyHz * Math.sqrt(er));
}

/** Phase velocity in a medium of relative permittivity er, m/s. */
export function phaseVelocityMps(er: number): number {
  return SPEED_OF_LIGHT_MPS / Math.sqrt(er);
}

/** Propagation delay of one millimetre of a medium of relative permittivity er, ps. */
export function delayPsPerMm(er: number): number {
  return (1e9 * Math.sqrt(er)) / SPEED_OF_LIGHT_MPS;
}

/** Analyse a microstrip line: geometry in, impedance and delay out. */
export function microstripAnalyze(input: MicrostripInput): MicrostripResult {
  const { widthUm, heightUm, er, frequencyHz } = input;
  assertGeometry(heightUm, er, frequencyHz);
  if (!Number.isFinite(widthUm) || widthUm <= 0) {
    throw new Error('The trace width must be greater than 0 um.');
  }
  const ratio = widthUm / heightUm;
  const effective = effectivePermittivity(ratio, er);
  return {
    ratio,
    z0Ohm: microstripZ0(ratio, er),
    effectiveEr: effective,
    guidedWavelengthM: wavelengthM(frequencyHz, effective),
    phaseVelocityMps: phaseVelocityMps(effective),
    delayPsPerMm: delayPsPerMm(effective),
  };
}

/** Hammerstad synthesis fit, used as the starting point for the bisection. */
function synthesisFit(targetZ0: number, er: number): number {
  const a =
    (targetZ0 / 60) * Math.sqrt((er + 1) / 2) + ((er - 1) / (er + 1)) * (0.23 + 0.11 / er);
  const b = (377 * Math.PI) / (2 * targetZ0 * Math.sqrt(er));
  const narrow = (8 * Math.exp(a)) / (Math.exp(2 * a) - 2);
  if (narrow <= 2) return narrow;
  return (
    (2 / Math.PI) *
    (b - 1 - Math.log(2 * b - 1) + ((er - 1) / (2 * er)) * (Math.log(b - 1) + 0.39 - 0.61 / er))
  );
}

/**
 * Solve for the trace width that gives a target impedance.
 *
 * The Hammerstad fit alone carries about 1% error, so the fit is refined by
 * bisecting the forward model until the width reproduces the target impedance.
 */
export function microstripSynthesize(input: {
  targetZ0Ohm: number;
  heightUm: number;
  er: number;
  frequencyHz: number;
}): MicrostripResult & { widthUm: number } {
  const { targetZ0Ohm, heightUm, er, frequencyHz } = input;
  assertGeometry(heightUm, er, frequencyHz);
  if (!Number.isFinite(targetZ0Ohm) || targetZ0Ohm <= 0) {
    throw new Error('The target impedance must be greater than 0 ohm.');
  }

  const start = synthesisFit(targetZ0Ohm, er);
  if (!Number.isFinite(start) || start <= 0) {
    throw new Error('No trace width reproduces that impedance with this substrate.');
  }

  let low = 1e-3;
  let high = 200;
  let ratio = Math.min(Math.max(start, low), high);
  for (let i = 0; i < 200; i += 1) {
    const current = microstripZ0(ratio, er);
    if (Math.abs(current - targetZ0Ohm) < 1e-9) break;
    if (current > targetZ0Ohm) low = ratio;
    else high = ratio;
    ratio = (low + high) / 2;
  }

  const effective = effectivePermittivity(ratio, er);
  return {
    ratio,
    widthUm: ratio * heightUm,
    z0Ohm: microstripZ0(ratio, er),
    effectiveEr: effective,
    guidedWavelengthM: wavelengthM(frequencyHz, effective),
    phaseVelocityMps: phaseVelocityMps(effective),
    delayPsPerMm: delayPsPerMm(effective),
  };
}
