/**
 * Carrier Mobility and Silicon Resistivity Models.
 *
 * Implements the empirical Caughey-Thomas / Klaassen unified carrier mobility
 * formulations for electrons and holes in crystalline Silicon at 300 K:
 *
 * Electrons (n-type):
 *   mu_min = 65.0 cm²/(V·s)
 *   mu_max = 1417.0 cm²/(V·s)
 *   N_ref  = 9.68e16 cm⁻³
 *   alpha  = 0.72
 *   mu_n   = mu_min + (mu_max - mu_min) / (1 + (Nd / N_ref)^alpha)
 *
 * Holes (p-type):
 *   mu_min = 47.7 cm²/(V·s)
 *   mu_max = 470.5 cm²/(V·s)
 *   N_ref  = 2.23e17 cm⁻³
 *   alpha  = 0.76
 *   mu_p   = mu_min + (mu_max - mu_min) / (1 + (Na / N_ref)^alpha)
 *
 * Physical relations:
 *   Conductivity sigma = q * N * mu [S/cm]
 *   Resistivity rho = 1 / sigma [Ω·cm]
 *   Diffusion coefficient D = mu * Vt [cm²/s] (Einstein relation)
 *
 * Includes forward calculation (Doping -> Mobility & Resistivity)
 * and reverse root-finding solver (Resistivity -> Doping & Mobility).
 */

export const ELEMENTARY_CHARGE = 1.602176634e-19; // C
export const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K
export const DEFAULT_TEMPERATURE_K = 300;

export type DopantType = 'n-type' | 'p-type';

export interface MobilityParameters {
  muMin: number;
  muMax: number;
  nRef: number;
  alpha: number;
}

export const CAUGHEY_THOMAS_PARAMS: Record<DopantType, MobilityParameters> = {
  'n-type': {
    muMin: 65.0,
    muMax: 1417.0,
    nRef: 9.68e16,
    alpha: 0.72,
  },
  'p-type': {
    muMin: 47.7,
    muMax: 470.5,
    nRef: 2.23e17,
    alpha: 0.76,
  },
};

export interface CarrierMobilityInput {
  dopantType: DopantType;
  /** Doping concentration N in cm^-3 (Nd for n-type, Na for p-type, 1e13 to 1e21). */
  dopingCm3: number;
  /** Temperature T in Kelvin (default 300 K). */
  temperatureK?: number;
}

export interface CarrierMobilitySuccess {
  ok: true;
  dopantType: DopantType;
  dopingCm3: number;
  temperatureK: number;
  /** Thermal voltage Vt in Volts. */
  vtV: number;
  /** Carrier mobility mu in cm²/(V·s). */
  mobilityCm2PerVs: number;
  /** Electrical conductivity sigma in S/cm (or (Ω·cm)^-1). */
  conductivitySPerCm: number;
  /** Electrical resistivity rho in Ω·cm. */
  resistivityOhmCm: number;
  /** Carrier diffusivity / diffusion coefficient D in cm²/s. */
  diffusivityCm2PerS: number;
}

export type CarrierMobilityResult =
  | { ok: false; errors: string[] }
  | CarrierMobilitySuccess;

export interface ReverseResistivityInput {
  dopantType: DopantType;
  /** Target resistivity rho in Ω·cm (e.g. 1e-4 to 1e5). */
  resistivityOhmCm: number;
  /** Temperature T in Kelvin (default 300 K). */
  temperatureK?: number;
}

export interface ReverseResistivitySuccess extends CarrierMobilitySuccess {
  iterations: number;
}

export type ReverseResistivityResult =
  | { ok: false; errors: string[] }
  | ReverseResistivitySuccess;

/**
 * Calculates the thermal voltage Vt = k * T / q [V].
 */
export function calculateThermalVoltage(temperatureK: number): number {
  return (BOLTZMANN_CONSTANT * temperatureK) / ELEMENTARY_CHARGE;
}

/**
 * Calculates carrier mobility for given dopant type and concentration using Caughey-Thomas.
 */
export function calculateMobilityValue(dopantType: DopantType, dopingCm3: number): number {
  const { muMin, muMax, nRef, alpha } = CAUGHEY_THOMAS_PARAMS[dopantType];
  return muMin + (muMax - muMin) / (1 + Math.pow(dopingCm3 / nRef, alpha));
}

/**
 * Forward mode: computes carrier mobility, conductivity, resistivity, and diffusivity
 * from dopant concentration.
 */
export function calculateCarrierMobility(input: CarrierMobilityInput): CarrierMobilityResult {
  const errors: string[] = [];
  const { dopantType, dopingCm3, temperatureK = DEFAULT_TEMPERATURE_K } = input;

  if (dopantType !== 'n-type' && dopantType !== 'p-type') {
    errors.push("Dopant type must be either 'n-type' or 'p-type'.");
  }
  if (!Number.isFinite(dopingCm3) || dopingCm3 <= 0) {
    errors.push('Doping concentration must be a positive number in cm⁻³.');
  } else if (dopingCm3 < 1e12 || dopingCm3 > 1e22) {
    errors.push('Doping concentration should be within physical semiconductor range (10¹² to 10²² cm⁻³).');
  }
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    errors.push('Temperature must be a positive number in Kelvin.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const vtV = calculateThermalVoltage(temperatureK);
  const mobilityCm2PerVs = calculateMobilityValue(dopantType, dopingCm3);

  // Conductivity sigma = q * N * mu [S/cm]
  const conductivitySPerCm = ELEMENTARY_CHARGE * dopingCm3 * mobilityCm2PerVs;

  // Resistivity rho = 1 / sigma [Ω·cm]
  const resistivityOhmCm = 1 / conductivitySPerCm;

  // Diffusion coefficient D = mu * Vt [cm²/s]
  const diffusivityCm2PerS = mobilityCm2PerVs * vtV;

  return {
    ok: true,
    dopantType,
    dopingCm3,
    temperatureK,
    vtV,
    mobilityCm2PerVs,
    conductivitySPerCm,
    resistivityOhmCm,
    diffusivityCm2PerS,
  };
}

/**
 * Reverse solver: back-calculates doping concentration N given target resistivity rho.
 * Uses bisection search over the range [1e12, 1e22] cm^-3.
 *
 * Since rho(N) is strictly monotonically decreasing with N, bisection is guaranteed
 * to converge reliably.
 */
export function calculateDopingFromResistivity(
  input: ReverseResistivityInput,
): ReverseResistivityResult {
  const errors: string[] = [];
  const { dopantType, resistivityOhmCm, temperatureK = DEFAULT_TEMPERATURE_K } = input;

  if (dopantType !== 'n-type' && dopantType !== 'p-type') {
    errors.push("Dopant type must be either 'n-type' or 'p-type'.");
  }
  if (!Number.isFinite(resistivityOhmCm) || resistivityOhmCm <= 0) {
    errors.push('Resistivity must be a positive number in Ω·cm.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Bracket bounds in log10 space
  let lowLog = 12.0; // 1e12 cm^-3
  let highLog = 22.0; // 1e22 cm^-3
  let iterations = 0;
  const maxIterations = 80;
  const tolerance = 1e-9;

  let midLog = (lowLog + highLog) / 2;

  while (iterations < maxIterations) {
    iterations++;
    midLog = (lowLog + highLog) / 2;
    const testN = Math.pow(10, midLog);
    const mu = calculateMobilityValue(dopantType, testN);
    const testRho = 1 / (ELEMENTARY_CHARGE * testN * mu);

    const relativeDiff = (testRho - resistivityOhmCm) / resistivityOhmCm;

    if (Math.abs(relativeDiff) < tolerance || (highLog - lowLog) < 1e-12) {
      break;
    }

    // Because rho decreases as N increases:
    // If testRho > targetRho, N is too small => need higher N (lowLog = midLog)
    if (testRho > resistivityOhmCm) {
      lowLog = midLog;
    } else {
      highLog = midLog;
    }
  }

  const finalN = Math.pow(10, midLog);
  const forwardResult = calculateCarrierMobility({
    dopantType,
    dopingCm3: finalN,
    temperatureK,
  });

  if (!forwardResult.ok) {
    return forwardResult;
  }

  return {
    ...forwardResult,
    iterations,
  };
}

/**
 * Generates an array of points for log-log plotting of mobility vs doping
 * from 1e13 to 1e21 cm^-3.
 */
export function generateMobilityCurves(pointsPerDecade = 8): {
  dopingCm3: number[];
  electrons: number[];
  holes: number[];
} {
  const dopingCm3: number[] = [];
  const electrons: number[] = [];
  const holes: number[] = [];

  const minLog = 13;
  const maxLog = 21;
  const totalPoints = (maxLog - minLog) * pointsPerDecade + 1;
  const step = (maxLog - minLog) / (totalPoints - 1);

  for (let i = 0; i < totalPoints; i++) {
    const logN = minLog + i * step;
    const n = Math.pow(10, logN);
    dopingCm3.push(n);
    electrons.push(calculateMobilityValue('n-type', n));
    holes.push(calculateMobilityValue('p-type', n));
  }

  return { dopingCm3, electrons, holes };
}
