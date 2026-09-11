
/**
 * Deal-Grove thermal oxidation of silicon: x^2 + A x = B (t + tau).
 *
 * x is the oxide thickness, t the oxidation time, A and B the linear and
 * parabolic rate constants at the process temperature and tau the offset that
 * accounts for the oxide already present when the step began:
 *
 *   tau = (x_i^2 + A x_i) / B
 *
 * A and B depend strongly on temperature, on the ambient and on the silicon
 * orientation, so they are inputs at the temperature actually being run rather
 * than constants baked into the tool. The presets are the classic Deal-Grove
 * numbers for a (100) wafer at 1000 C, where B over A is the familiar linear
 * rate. For any other temperature, ambient or orientation, take A and B from a
 * table or from your own growth data.
 *
 * The thickness at which the linear and parabolic terms are equal is A / 2:
 * well below it growth is linear in time, well above it goes as the square root
 * of time. This tool calls the crossover region between A / 4 and A mixed.
 *
 * Silicon is consumed as the oxide grows. Using rho(SiO2) = 2.27 g/cm3 with a
 * molar mass of 60.08 g/mol and rho(Si) = 2.329 g/cm3 with 28.0855 g/mol, one
 * micrometre of oxide consumes 0.456 micrometres of silicon.
 */

/** Micrometres of silicon consumed per micrometre of thermal oxide. */
export const SILICON_CONSUMED_PER_UM_OXIDE = 0.4556261109418156;

export interface OxidePreset {
  id: string;
  label: string;
  aUm: number;
  bUm2PerHour: number;
}

export const OXIDE_PRESETS: OxidePreset[] = [
  { id: 'dry100', label: 'Dry O2, (100) Si, 1000 C', aUm: 0.165, bUm2PerHour: 0.0117 },
  { id: 'wet100', label: 'Steam, (100) Si, 1000 C', aUm: 0.226, bUm2PerHour: 0.287 },
];

export type OxideRegime = 'linear' | 'mixed' | 'parabolic';

export interface OxideShared {
  aUm: number;
  bUm2PerHour: number;
  linearRateUmPerHour: number;
  crossoverUm: number;
  tauHours: number;
}

export function tauForInitialOxide(aUm: number, bUm2PerHour: number, initialUm: number): number {
  return (initialUm * initialUm + aUm * initialUm) / bUm2PerHour;
}

function regimeFor(thicknessUm: number, crossoverUm: number): OxideRegime {
  if (thicknessUm <= crossoverUm / 2) return 'linear';
  if (thicknessUm >= crossoverUm * 2) return 'parabolic';
  return 'mixed';
}

export interface OxideFromTimeInput {
  aUm: number;
  bUm2PerHour: number;
  initialUm: number;
  timeHours: number;
}

export interface OxideFromTimeSuccess extends OxideShared {
  ok: true;
  thicknessUm: number;
  growthUm: number;
  siliconConsumedUm: number;
  regime: OxideRegime;
}

export type OxideFromTimeResult = { ok: false; errors: string[] } | OxideFromTimeSuccess;

function validateShared(aUm: number, bUm2PerHour: number, initialUm: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(aUm) || aUm <= 0) errors.push('The linear rate constant A must be a positive number of micrometres.');
  if (!Number.isFinite(bUm2PerHour) || bUm2PerHour <= 0) {
    errors.push('The parabolic rate constant B must be a positive number of square micrometres per hour.');
  }
  if (!Number.isFinite(initialUm) || initialUm < 0) errors.push('The starting oxide thickness cannot be negative.');
  return errors;
}

export function thicknessAfterTime(input: OxideFromTimeInput): OxideFromTimeResult {
  const { aUm, bUm2PerHour, initialUm, timeHours } = input;
  const errors = validateShared(aUm, bUm2PerHour, initialUm);
  if (!Number.isFinite(timeHours) || timeHours < 0) errors.push('Time must be zero or a positive number of hours.');
  if (errors.length > 0) return { ok: false, errors };

  const tauHours = tauForInitialOxide(aUm, bUm2PerHour, initialUm);
  const thicknessUm =
    (aUm / 2) * (Math.sqrt(1 + (4 * bUm2PerHour * (timeHours + tauHours)) / (aUm * aUm)) - 1);

  return {
    ok: true,
    aUm,
    bUm2PerHour,
    linearRateUmPerHour: bUm2PerHour / aUm,
    crossoverUm: aUm / 2,
    tauHours,
    thicknessUm,
    growthUm: thicknessUm - initialUm,
    siliconConsumedUm: thicknessUm * SILICON_CONSUMED_PER_UM_OXIDE,
    regime: regimeFor(thicknessUm, aUm / 2),
  };
}

export interface OxideFromThicknessInput {
  aUm: number;
  bUm2PerHour: number;
  initialUm: number;
  thicknessUm: number;
}

export interface OxideFromThicknessSuccess extends OxideShared {
  ok: true;
  thicknessUm: number;
  timeHours: number;
  growthUm: number;
  siliconConsumedUm: number;
  regime: OxideRegime;
}

export type OxideFromThicknessResult = { ok: false; errors: string[] } | OxideFromThicknessSuccess;

export function timeToThickness(input: OxideFromThicknessInput): OxideFromThicknessResult {
  const { aUm, bUm2PerHour, initialUm, thicknessUm } = input;
  const errors = validateShared(aUm, bUm2PerHour, initialUm);
  if (!Number.isFinite(thicknessUm) || thicknessUm <= 0) {
    errors.push('The target thickness must be a positive number of micrometres.');
  } else if (thicknessUm < initialUm) {
    errors.push('The target thickness must be at least the starting thickness.');
  }
  if (errors.length > 0) return { ok: false, errors };

  const tauHours = tauForInitialOxide(aUm, bUm2PerHour, initialUm);
  const timeHours = (thicknessUm * thicknessUm + aUm * thicknessUm) / bUm2PerHour - tauHours;

  return {
    ok: true,
    aUm,
    bUm2PerHour,
    linearRateUmPerHour: bUm2PerHour / aUm,
    crossoverUm: aUm / 2,
    tauHours,
    thicknessUm,
    timeHours,
    growthUm: thicknessUm - initialUm,
    siliconConsumedUm: thicknessUm * SILICON_CONSUMED_PER_UM_OXIDE,
    regime: regimeFor(thicknessUm, aUm / 2),
  };
}
