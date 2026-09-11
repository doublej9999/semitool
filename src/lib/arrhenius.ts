
/**
 * Arrhenius rate: rate = prefactor * exp(-Ea / (k T)).
 *
 * The activation energy is in electronvolts and the temperature in kelvin, so
 * the Boltzmann constant is 8.617333262e-5 eV/K. The prefactor carries the unit
 * of whatever rate is being modelled (a diffusivity, an etch rate, a growth
 * rate), so this module treats it as a bare number in that unit and only the
 * ratios and the extracted activation energy are unit independent.
 */

/** Boltzmann constant in electronvolts per kelvin (CODATA). */
export const BOLTZMANN_EV_PER_K = 8.617333262e-5;
/** Kelvin below the freezing point of water. */
export const KELVIN_OFFSET = 273.15;

export function celsiusToKelvin(celsius: number): number {
  return celsius + KELVIN_OFFSET;
}

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - KELVIN_OFFSET;
}

export interface ArrheniusInput {
  prefactor: number;
  activationEnergyEv: number;
  temperatureC: number;
}

export interface ArrheniusSuccess {
  ok: true;
  prefactor: number;
  activationEnergyEv: number;
  temperatureK: number;
  thermalEnergyEv: number;
  exponent: number;
  rate: number;
}

export type ArrheniusResult = { ok: false; errors: string[] } | ArrheniusSuccess;

function validate(prefactor: number, activationEnergyEv: number, temperatureC: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(prefactor) || prefactor <= 0) {
    errors.push('Prefactor must be a positive number.');
  }
  if (!Number.isFinite(activationEnergyEv) || activationEnergyEv < 0) {
    errors.push('Activation energy must be zero or a positive number of electronvolts.');
  }
  if (!Number.isFinite(temperatureC) || temperatureC <= -KELVIN_OFFSET) {
    errors.push('Temperature must be above absolute zero.');
  }
  return errors;
}

export function calculateArrhenius(input: ArrheniusInput): ArrheniusResult {
  const { prefactor, activationEnergyEv, temperatureC } = input;
  const errors = validate(prefactor, activationEnergyEv, temperatureC);
  if (errors.length > 0) return { ok: false, errors };

  const temperatureK = celsiusToKelvin(temperatureC);
  const thermalEnergyEv = BOLTZMANN_EV_PER_K * temperatureK;
  const exponent = -activationEnergyEv / thermalEnergyEv;

  return {
    ok: true,
    prefactor,
    activationEnergyEv,
    temperatureK,
    thermalEnergyEv,
    exponent,
    rate: prefactor * Math.exp(exponent),
  };
}

export interface ExtractionInput {
  temperature1C: number;
  rate1: number;
  temperature2C: number;
  rate2: number;
}

export interface ExtractionSuccess {
  ok: true;
  activationEnergyEv: number;
  prefactor: number;
  rateRatio: number;
  temperature1K: number;
  temperature2K: number;
}

export type ExtractionResult = { ok: false; errors: string[] } | ExtractionSuccess;

/**
 * Activation energy and prefactor from two rates at two temperatures.
 *
 *   Ea = k (ln r1 - ln r2) / (1 / T2 - 1 / T1)
 *   prefactor = r1 exp(Ea / (k T1))
 *
 * The two temperatures must differ, and the two rates must be positive.
 */
export function extractActivationEnergy(input: ExtractionInput): ExtractionResult {
  const { temperature1C, rate1, temperature2C, rate2 } = input;
  const errors: string[] = [];

  if (!Number.isFinite(rate1) || rate1 <= 0) errors.push('The first rate must be a positive number.');
  if (!Number.isFinite(rate2) || rate2 <= 0) errors.push('The second rate must be a positive number.');
  if (!Number.isFinite(temperature1C) || temperature1C <= -KELVIN_OFFSET) {
    errors.push('The first temperature must be above absolute zero.');
  }
  if (!Number.isFinite(temperature2C) || temperature2C <= -KELVIN_OFFSET) {
    errors.push('The second temperature must be above absolute zero.');
  }
  if (errors.length > 0) return { ok: false, errors };

  const temperature1K = celsiusToKelvin(temperature1C);
  const temperature2K = celsiusToKelvin(temperature2C);
  if (temperature1K === temperature2K) {
    return { ok: false, errors: ['The two temperatures must differ to extract an activation energy.'] };
  }
  if (rate1 === rate2) {
    return { ok: false, errors: ['Two equal rates mean no measurable temperature dependence.'] };
  }

  const activationEnergyEv =
    (BOLTZMANN_EV_PER_K * (Math.log(rate1) - Math.log(rate2))) / (1 / temperature2K - 1 / temperature1K);
  const prefactor = rate1 * Math.exp(activationEnergyEv / (BOLTZMANN_EV_PER_K * temperature1K));

  return {
    ok: true,
    activationEnergyEv,
    prefactor,
    rateRatio: rate2 / rate1,
    temperature1K,
    temperature2K,
  };
}
