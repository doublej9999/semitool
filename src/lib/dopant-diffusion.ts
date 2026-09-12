/**
 * Semiconductor Dopant Diffusion & Junction Depth Physics.
 *
 * Implements:
 * 1. Arrhenius diffusion coefficients D(T) in Silicon and SiO2 for common dopants (B, P, As, Sb).
 * 2. Solid solubility limits C_solid(T) in Silicon.
 * 3. Constant Source (predeposition / infinite source / erfc profile) models and junction depth.
 * 4. Limited Source (drive-in / Gaussian / finite source) models and junction depth.
 * 5. Two-step diffusion processes (predeposition dose Q followed by drive-in thermal budget).
 * 6. Minimum SiO2 oxide masking thickness calculations (3x and 4x diffusion length rules).
 * 7. Error functions: erf(z), erfc(z), and high-precision inverse erfc (inverfc).
 */

/** Boltzmann constant in electron-volts per Kelvin (eV/K). */
export const BOLTZMANN_EV_K = 8.617333262e-5;

/** 0°C in Kelvin. */
export const CELSIUS_TO_KELVIN = 273.15;

/** Length conversion factors. */
export const CM_PER_UM = 1e-4;
export const UM_PER_CM = 1e4;
export const CM_PER_NM = 1e-7;
export const NM_PER_CM = 1e7;
export const NM_PER_UM = 1000;
export const UM_PER_NM = 1e-3;

export type DopantSpecies = 'B' | 'P' | 'As' | 'Sb';
export type DopantType = 'p-type' | 'n-type';
export type MatrixMaterial = 'Si' | 'SiO2';

export interface DopantParameter {
  name: string;
  symbol: DopantSpecies;
  dopantType: DopantType;
  /** Pre-exponential factor D0 in cm^2/s. */
  d0Cm2PerS: number;
  /** Activation energy Ea in eV. */
  activationEnergyEv: number;
}

/**
 * Standard dopant diffusion parameters in Silicon (intrinsic regime, standard Sze / Plummer values).
 */
export const SILICON_DOPANTS: Record<DopantSpecies, DopantParameter> = {
  B: {
    name: 'Boron',
    symbol: 'B',
    dopantType: 'p-type',
    d0Cm2PerS: 0.76,
    activationEnergyEv: 3.46,
  },
  P: {
    name: 'Phosphorus',
    symbol: 'P',
    dopantType: 'n-type',
    d0Cm2PerS: 3.85,
    activationEnergyEv: 3.66,
  },
  As: {
    name: 'Arsenic',
    symbol: 'As',
    dopantType: 'n-type',
    d0Cm2PerS: 0.066,
    activationEnergyEv: 3.44,
  },
  Sb: {
    name: 'Antimony',
    symbol: 'Sb',
    dopantType: 'n-type',
    d0Cm2PerS: 0.214,
    activationEnergyEv: 3.65,
  },
};

/**
 * Dopant diffusion parameters in SiO2 (for masking oxide calculations).
 * Phosphorus in SiO2 has D ~ 1.0e-15 cm^2/s at 1000°C (Ea ~ 4.0 eV, D0 ~ 6.843 cm^2/s).
 */
export const SIO2_DOPANTS: Record<DopantSpecies, DopantParameter> = {
  B: {
    name: 'Boron',
    symbol: 'B',
    dopantType: 'p-type',
    d0Cm2PerS: 3.16e-4,
    activationEnergyEv: 3.53,
  },
  P: {
    name: 'Phosphorus',
    symbol: 'P',
    dopantType: 'n-type',
    d0Cm2PerS: 6.843,
    activationEnergyEv: 4.0,
  },
  As: {
    name: 'Arsenic',
    symbol: 'As',
    dopantType: 'n-type',
    d0Cm2PerS: 0.063,
    activationEnergyEv: 4.2,
  },
  Sb: {
    name: 'Antimony',
    symbol: 'Sb',
    dopantType: 'n-type',
    d0Cm2PerS: 0.013,
    activationEnergyEv: 4.3,
  },
};

/**
 * Parameters for solid solubility limits in Silicon as C_solid(T) = C0 * exp(-Es / (kB * T)).
 * Fitted to standard Trumbore / Sze experimental data across 800°C - 1250°C.
 */
export const SOLID_SOLUBILITY_MODELS: Record<DopantSpecies, { c0Cm3: number; esEv: number }> = {
  B: { c0Cm3: 9.25e22, esEv: 0.65 },
  P: { c0Cm3: 1.8e22, esEv: 0.316 },
  As: { c0Cm3: 1.45e22, esEv: 0.25 },
  Sb: { c0Cm3: 3.8e21, esEv: 0.486 },
};

/**
 * Normalizes user-supplied dopant string into canonical DopantSpecies ('B' | 'P' | 'As' | 'Sb').
 */
export function normalizeDopantSpecies(dopant: string): DopantSpecies {
  const norm = dopant.trim().toLowerCase();
  switch (norm) {
    case 'b':
    case 'boron':
      return 'B';
    case 'p':
    case 'phosphorus':
      return 'P';
    case 'as':
    case 'arsenic':
      return 'As';
    case 'sb':
    case 'antimony':
      return 'Sb';
    default:
      throw new Error(`Unknown dopant species: "${dopant}". Supported species are B, P, As, Sb.`);
  }
}

/**
 * Numerical Recipes' Chebyshev polynomial coefficients for complementary error function erfc(x).
 */
const ERFC_COF = [
  -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
  -9.46595344482036e-4, 3.66839497852761e-4, 4.2523324806907e-5, -2.0278578112534e-5,
  -1.624290004647e-6, 1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
  5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12,
  8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15, -1.523e-15, -9.4e-17,
  1.214e-16, -6.3e-18, -5.8e-18, 1.6e-18, 5.8e-19, -3.8e-19, 1.8e-20, 8.3e-20,
  -1.0e-20, -1.4e-20,
];

/**
 * Complementary error function: erfc(z) = 1 - erf(z) = (2 / sqrt(pi)) * int_z^inf exp(-t^2) dt.
 */
export function erfc(z: number): number {
  if (Number.isNaN(z)) return NaN;
  if (z < 0) return 2 - erfc(-z);
  let d = 0;
  let dd = 0;
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;
  for (let j = ERFC_COF.length - 1; j > 0; j -= 1) {
    const tmp = d;
    d = ty * d - dd + ERFC_COF[j];
    dd = tmp;
  }
  return t * Math.exp(-z * z + 0.5 * (ERFC_COF[0] + ty * d) - dd);
}

/**
 * Standard error function: erf(z) = (2 / sqrt(pi)) * int_0^z exp(-t^2) dt.
 */
export function erf(z: number): number {
  if (Number.isNaN(z)) return NaN;
  return 1 - erfc(z);
}

/**
 * Inverse complementary error function: inverfc(y) such that erfc(inverfc(y)) = y.
 * Defined for 0 < y < 2.
 *
 * Uses Acklam's rational probit approximation initialized with standard normal quantile,
 * followed by Halley's cubic root-refinement iteration to achieve full double-precision accuracy (~1e-16).
 */
export function inverfc(y: number): number {
  if (Number.isNaN(y)) return NaN;
  if (y <= 0) return Infinity;
  if (y >= 2) return -Infinity;
  if (y === 1) return 0;

  // Relation to standard normal CDF: erfc(x) = 2 * Phi(-x * sqrt(2)) => p = y / 2
  const p = y / 2;

  // Coefficients for Peter Acklam's inverse normal CDF
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680133036558071e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let zNormal: number;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    zNormal =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    zNormal =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    zNormal =
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  // Initial estimate for x
  let x = -zNormal / Math.SQRT2;

  // Refine via Halley's cubic root-finding iteration
  // f(x) = erfc(x) - y, f'(x) = - (2 / sqrt(pi)) * exp(-x^2)
  // f''(x) = -2 * x * f'(x)
  // Halley step: delta = f / (f' + x * f)
  const TWO_OVER_SQRT_PI = 2 / Math.sqrt(Math.PI);
  for (let i = 0; i < 3; i++) {
    const fVal = erfc(x) - y;
    const d1 = -TWO_OVER_SQRT_PI * Math.exp(-x * x);
    const denom = d1 + x * fVal;
    if (Math.abs(denom) < 1e-300) break;
    const step = fVal / denom;
    x -= step;
    if (Math.abs(step) < 1e-15 * Math.max(1, Math.abs(x))) break;
  }

  return x;
}

/**
 * Calculates the Arrhenius diffusion coefficient D(T) in cm^2/s:
 * D(T) = D0 * exp(-Ea / (kB * T))
 *
 * @param dopant Dopant species ('B', 'P', 'As', 'Sb' or full name)
 * @param tempCelsius Process temperature in degrees Celsius
 * @param matrix Host matrix: 'Si' (default) or 'SiO2'
 */
export function getDiffusionCoefficient(
  dopant: string,
  tempCelsius: number,
  matrix: MatrixMaterial = 'Si'
): number {
  const species = normalizeDopantSpecies(dopant);
  const table = matrix === 'SiO2' ? SIO2_DOPANTS : SILICON_DOPANTS;
  const param = table[species];

  const tempK = tempCelsius + CELSIUS_TO_KELVIN;
  if (tempK <= 0) {
    throw new Error(`Temperature must be above absolute zero (-273.15°C). Received: ${tempCelsius}°C`);
  }

  const exponent = -param.activationEnergyEv / (BOLTZMANN_EV_K * tempK);
  return param.d0Cm2PerS * Math.exp(exponent);
}

/**
 * Calculates the equilibrium solid solubility limit C_solid(T) in Silicon (cm^-3).
 *
 * @param dopant Dopant species ('B', 'P', 'As', 'Sb')
 * @param tempCelsius Temperature in degrees Celsius
 */
export function getSolidSolubility(dopant: string, tempCelsius: number): number {
  const species = normalizeDopantSpecies(dopant);
  const model = SOLID_SOLUBILITY_MODELS[species];

  const tempK = tempCelsius + CELSIUS_TO_KELVIN;
  if (tempK <= 0) {
    throw new Error(`Temperature must be above absolute zero (-273.15°C). Received: ${tempCelsius}°C`);
  }

  const exponent = -model.esEv / (BOLTZMANN_EV_K * tempK);
  return model.c0Cm3 * Math.exp(exponent);
}

export interface ConcentrationProfilePoint {
  depthUm: number;
  depthNm: number;
  concentrationCm3: number;
}

export interface PredepositionInput {
  dopant?: string;
  matrix?: MatrixMaterial;
  tempCelsius?: number;
  diffusivityCm2PerS?: number;
  timeSeconds: number;
  /** Surface concentration Cs in cm^-3. If omitted, defaults to solid solubility at tempCelsius. */
  surfaceConcentrationCm3?: number;
  /** Background substrate doping concentration CB in cm^-3 (optional, for junction depth). */
  backgroundConcentrationCm3?: number;
  /** Depths in micrometres at which to evaluate concentration. */
  depthsUm?: number[];
}

export interface PredepositionResult {
  dopant?: DopantSpecies;
  matrix: MatrixMaterial;
  tempCelsius?: number;
  diffusivityCm2PerS: number;
  timeSeconds: number;
  /** Thermal budget D * t in cm^2. */
  dtProductCm2: number;
  /** sqrt(D * t) in micrometres. */
  characteristicLengthUm: number;
  /** 2 * sqrt(D * t) in micrometres (erfc length scale). */
  diffusionLengthUm: number;
  /** Surface concentration Cs in cm^-3. */
  surfaceConcentrationCm3: number;
  /** Total dopant dose Q in atoms/cm^2: Q = (2 / sqrt(pi)) * Cs * sqrt(Dt). */
  doseQ: number;
  /** Metallurgical junction depth xj in cm (if CB given and CB < Cs). */
  junctionDepthCm?: number;
  /** Metallurgical junction depth xj in micrometres. */
  junctionDepthUm?: number;
  /** Metallurgical junction depth xj in nanometres. */
  junctionDepthNm?: number;
  /** Doping concentration profile. */
  profile?: ConcentrationProfilePoint[];
}

/**
 * Calculates a Constant-Source (Predeposition / Infinite Source / erfc) diffusion profile:
 * C(x, t) = Cs * erfc(x / (2 * sqrt(D * t)))
 * Q = (2 / sqrt(pi)) * Cs * sqrt(D * t)
 * xj = 2 * sqrt(D * t) * inverfc(CB / Cs)
 */
export function calculatePredeposition(input: PredepositionInput): PredepositionResult {
  const {
    dopant,
    matrix = 'Si',
    tempCelsius,
    timeSeconds,
    depthsUm,
    backgroundConcentrationCm3,
  } = input;

  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    throw new Error('Diffusion time must be a positive number of seconds.');
  }

  let diffusivityCm2PerS = input.diffusivityCm2PerS;
  let species: DopantSpecies | undefined;

  if (dopant) {
    species = normalizeDopantSpecies(dopant);
    if (diffusivityCm2PerS === undefined) {
      if (tempCelsius === undefined) {
        throw new Error('Must provide either diffusivityCm2PerS or tempCelsius with dopant.');
      }
      diffusivityCm2PerS = getDiffusionCoefficient(species, tempCelsius, matrix);
    }
  }

  if (diffusivityCm2PerS === undefined || diffusivityCm2PerS <= 0 || !Number.isFinite(diffusivityCm2PerS)) {
    throw new Error('Diffusivity must be a positive number in cm^2/s.');
  }

  let surfaceConcentrationCm3 = input.surfaceConcentrationCm3;
  if (surfaceConcentrationCm3 === undefined) {
    if (species && tempCelsius !== undefined && matrix === 'Si') {
      surfaceConcentrationCm3 = getSolidSolubility(species, tempCelsius);
    } else {
      throw new Error('Must provide surfaceConcentrationCm3 or (dopant, tempCelsius in Si) for solid solubility.');
    }
  }

  if (surfaceConcentrationCm3 <= 0 || !Number.isFinite(surfaceConcentrationCm3)) {
    throw new Error('Surface concentration must be a positive number in cm^-3.');
  }

  const dtProductCm2 = diffusivityCm2PerS * timeSeconds;
  const sqrtDtCm = Math.sqrt(dtProductCm2);
  const characteristicLengthUm = sqrtDtCm * UM_PER_CM;
  const diffusionLengthUm = 2 * characteristicLengthUm;
  const diffusionLengthCm = 2 * sqrtDtCm;

  // Q = (2 / sqrt(pi)) * Cs * sqrt(Dt)
  const doseQ = (2 / Math.sqrt(Math.PI)) * surfaceConcentrationCm3 * sqrtDtCm;

  let junctionDepthCm: number | undefined;
  let junctionDepthUm: number | undefined;
  let junctionDepthNm: number | undefined;

  if (
    backgroundConcentrationCm3 !== undefined &&
    backgroundConcentrationCm3 > 0 &&
    backgroundConcentrationCm3 < surfaceConcentrationCm3
  ) {
    const ratio = backgroundConcentrationCm3 / surfaceConcentrationCm3;
    const inv = inverfc(ratio);
    junctionDepthCm = diffusionLengthCm * inv;
    junctionDepthUm = junctionDepthCm * UM_PER_CM;
    junctionDepthNm = junctionDepthCm * NM_PER_CM;
  }

  let profile: ConcentrationProfilePoint[] | undefined;
  if (depthsUm && depthsUm.length > 0) {
    profile = depthsUm.map((xUm) => {
      const xCm = xUm * CM_PER_UM;
      const arg = xCm / diffusionLengthCm;
      const conc = surfaceConcentrationCm3 * erfc(arg);
      return {
        depthUm: xUm,
        depthNm: xUm * NM_PER_UM,
        concentrationCm3: Math.max(0, conc),
      };
    });
  }

  return {
    dopant: species,
    matrix,
    tempCelsius,
    diffusivityCm2PerS,
    timeSeconds,
    dtProductCm2,
    characteristicLengthUm,
    diffusionLengthUm,
    surfaceConcentrationCm3,
    doseQ,
    junctionDepthCm,
    junctionDepthUm,
    junctionDepthNm,
    profile,
  };
}

export interface DriveInInput {
  dopant?: string;
  matrix?: MatrixMaterial;
  tempCelsius?: number;
  diffusivityCm2PerS?: number;
  timeSeconds: number;
  /** Predeposited or implanted total dopant dose Q in atoms/cm^2. */
  doseCm2: number;
  /** Background substrate doping concentration CB in cm^-3 (optional, for junction depth). */
  backgroundConcentrationCm3?: number;
  /** Depths in micrometres at which to evaluate concentration. */
  depthsUm?: number[];
}

export interface DriveInResult {
  dopant?: DopantSpecies;
  matrix: MatrixMaterial;
  tempCelsius?: number;
  diffusivityCm2PerS: number;
  timeSeconds: number;
  /** Thermal budget D * t in cm^2. */
  dtProductCm2: number;
  /** sqrt(D * t) in micrometres. */
  characteristicLengthUm: number;
  /** sqrt(2 * D * t) in micrometres (standard deviation sigma). */
  gaussianSigmaUm: number;
  /** Total dopant dose Q in atoms/cm^2. */
  doseQ: number;
  /** Resulting surface concentration Cs = Q / sqrt(pi * D * t) in cm^-3. */
  surfaceConcentrationCm3: number;
  /** Metallurgical junction depth xj in cm (if CB given and CB < Cs). */
  junctionDepthCm?: number;
  /** Metallurgical junction depth xj in micrometres. */
  junctionDepthUm?: number;
  /** Metallurgical junction depth xj in nanometres. */
  junctionDepthNm?: number;
  /** Doping concentration profile. */
  profile?: ConcentrationProfilePoint[];
}

/**
 * Calculates a Limited-Source (Drive-In / Gaussian / Finite Source) diffusion profile:
 * C(x, t) = (Q / sqrt(pi * D * t)) * exp(-x^2 / (4 * D * t))
 * Cs = Q / sqrt(pi * D * t)
 * xj = sqrt(4 * D * t * ln(Cs / CB))
 */
export function calculateDriveIn(input: DriveInInput): DriveInResult {
  const {
    dopant,
    matrix = 'Si',
    tempCelsius,
    timeSeconds,
    doseCm2,
    depthsUm,
    backgroundConcentrationCm3,
  } = input;

  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    throw new Error('Diffusion time must be a positive number of seconds.');
  }
  if (!Number.isFinite(doseCm2) || doseCm2 <= 0) {
    throw new Error('Dose Q must be a positive number in atoms/cm^2.');
  }

  let diffusivityCm2PerS = input.diffusivityCm2PerS;
  let species: DopantSpecies | undefined;

  if (dopant) {
    species = normalizeDopantSpecies(dopant);
    if (diffusivityCm2PerS === undefined) {
      if (tempCelsius === undefined) {
        throw new Error('Must provide either diffusivityCm2PerS or tempCelsius with dopant.');
      }
      diffusivityCm2PerS = getDiffusionCoefficient(species, tempCelsius, matrix);
    }
  }

  if (diffusivityCm2PerS === undefined || diffusivityCm2PerS <= 0 || !Number.isFinite(diffusivityCm2PerS)) {
    throw new Error('Diffusivity must be a positive number in cm^2/s.');
  }

  const dtProductCm2 = diffusivityCm2PerS * timeSeconds;
  const sqrtDtCm = Math.sqrt(dtProductCm2);
  const characteristicLengthUm = sqrtDtCm * UM_PER_CM;
  const gaussianSigmaUm = Math.sqrt(2 * dtProductCm2) * UM_PER_CM;

  // Cs = Q / sqrt(pi * D * t)
  const surfaceConcentrationCm3 = doseCm2 / Math.sqrt(Math.PI * dtProductCm2);

  let junctionDepthCm: number | undefined;
  let junctionDepthUm: number | undefined;
  let junctionDepthNm: number | undefined;

  if (
    backgroundConcentrationCm3 !== undefined &&
    backgroundConcentrationCm3 > 0 &&
    backgroundConcentrationCm3 < surfaceConcentrationCm3
  ) {
    const lnRatio = Math.log(surfaceConcentrationCm3 / backgroundConcentrationCm3);
    junctionDepthCm = Math.sqrt(4 * dtProductCm2 * lnRatio);
    junctionDepthUm = junctionDepthCm * UM_PER_CM;
    junctionDepthNm = junctionDepthCm * NM_PER_CM;
  }

  let profile: ConcentrationProfilePoint[] | undefined;
  if (depthsUm && depthsUm.length > 0) {
    profile = depthsUm.map((xUm) => {
      const xCm = xUm * CM_PER_UM;
      const exponent = -(xCm * xCm) / (4 * dtProductCm2);
      const conc = surfaceConcentrationCm3 * Math.exp(exponent);
      return {
        depthUm: xUm,
        depthNm: xUm * NM_PER_UM,
        concentrationCm3: Math.max(0, conc),
      };
    });
  }

  return {
    dopant: species,
    matrix,
    tempCelsius,
    diffusivityCm2PerS,
    timeSeconds,
    dtProductCm2,
    characteristicLengthUm,
    gaussianSigmaUm,
    doseQ: doseCm2,
    surfaceConcentrationCm3,
    junctionDepthCm,
    junctionDepthUm,
    junctionDepthNm,
    profile,
  };
}

export interface JunctionDepthParams {
  model: 'constant-source' | 'limited-source' | 'erfc' | 'gaussian';
  diffusivityCm2PerS: number;
  timeSeconds: number;
  backgroundConcentrationCm3: number;
  /** Surface concentration Cs for constant source or limited source. */
  surfaceConcentrationCm3?: number;
  /** Dose Q (atoms/cm^2) for limited source / Gaussian model. */
  doseCm2?: number;
}

export interface JunctionDepthResult {
  hasJunction: boolean;
  junctionDepthCm: number;
  junctionDepthUm: number;
  junctionDepthNm: number;
  surfaceConcentrationCm3: number;
  dtProductCm2: number;
  characteristicLengthUm: number;
}

/**
 * Calculates metallurgical junction depth xj where dopant concentration equals background doping CB.
 *
 * For Constant Source / erfc:
 *   xj = 2 * sqrt(D * t) * inverfc(CB / Cs)
 *
 * For Limited Source / Gaussian:
 *   xj = sqrt(4 * D * t * ln(Cs / CB))
 */
export function calculateJunctionDepth(params: JunctionDepthParams): JunctionDepthResult {
  const {
    model,
    diffusivityCm2PerS,
    timeSeconds,
    backgroundConcentrationCm3,
    doseCm2,
  } = params;

  if (diffusivityCm2PerS <= 0 || timeSeconds <= 0 || backgroundConcentrationCm3 <= 0) {
    return {
      hasJunction: false,
      junctionDepthCm: 0,
      junctionDepthUm: 0,
      junctionDepthNm: 0,
      surfaceConcentrationCm3: 0,
      dtProductCm2: Math.max(0, diffusivityCm2PerS * timeSeconds),
      characteristicLengthUm: 0,
    };
  }

  const dtProductCm2 = diffusivityCm2PerS * timeSeconds;
  const characteristicLengthUm = Math.sqrt(dtProductCm2) * UM_PER_CM;
  const diffusionLengthCm = 2 * Math.sqrt(dtProductCm2);

  let cs = params.surfaceConcentrationCm3 ?? 0;

  const isGaussian = model === 'limited-source' || model === 'gaussian';

  if (isGaussian && (!cs || cs <= 0)) {
    if (doseCm2 && doseCm2 > 0) {
      cs = doseCm2 / Math.sqrt(Math.PI * dtProductCm2);
    }
  }

  if (cs <= backgroundConcentrationCm3 || cs <= 0) {
    return {
      hasJunction: false,
      junctionDepthCm: 0,
      junctionDepthUm: 0,
      junctionDepthNm: 0,
      surfaceConcentrationCm3: cs,
      dtProductCm2,
      characteristicLengthUm,
    };
  }

  let xjCm = 0;
  if (isGaussian) {
    const lnRatio = Math.log(cs / backgroundConcentrationCm3);
    xjCm = Math.sqrt(4 * dtProductCm2 * lnRatio);
  } else {
    const ratio = backgroundConcentrationCm3 / cs;
    const inv = inverfc(ratio);
    xjCm = diffusionLengthCm * inv;
  }

  return {
    hasJunction: true,
    junctionDepthCm: xjCm,
    junctionDepthUm: xjCm * UM_PER_CM,
    junctionDepthNm: xjCm * NM_PER_CM,
    surfaceConcentrationCm3: cs,
    dtProductCm2,
    characteristicLengthUm,
  };
}

export interface TwoStepDiffusionParams {
  dopant: string;
  predepTempCelsius: number;
  predepTimeSeconds: number;
  predepSurfaceConcentrationCm3?: number;
  driveInTempCelsius: number;
  driveInTimeSeconds: number;
  backgroundConcentrationCm3?: number;
  depthsUm?: number[];
}

export interface TwoStepDiffusionResult {
  dopant: DopantSpecies;
  predep: PredepositionResult;
  driveIn: DriveInResult;
  /** Effective thermal budget (Dt)eff = D1 * t1 + D2 * t2 in cm^2. */
  effectiveDtCm2: number;
  effectiveCharacteristicLengthUm: number;
  finalSurfaceConcentrationCm3: number;
  junctionDepthCm?: number;
  junctionDepthUm?: number;
  junctionDepthNm?: number;
  profile?: ConcentrationProfilePoint[];
}

/**
 * Calculates a complete Two-Step Diffusion process:
 * 1. Constant source predeposition at (T1, t1) introducing dose Q1 = (2 / sqrt(pi)) * Cs1 * sqrt(D1 * t1).
 * 2. Drive-in thermal diffusion at (T2, t2) with effective (Dt)eff = D1 * t1 + D2 * t2.
 * Returns both stage details, effective budget, resulting surface concentration, and junction depth.
 */
export function calculateTwoStepDiffusion(params: TwoStepDiffusionParams): TwoStepDiffusionResult {
  const {
    dopant,
    predepTempCelsius,
    predepTimeSeconds,
    predepSurfaceConcentrationCm3,
    driveInTempCelsius,
    driveInTimeSeconds,
    backgroundConcentrationCm3,
    depthsUm,
  } = params;

  const species = normalizeDopantSpecies(dopant);

  // Step 1: Predeposition
  const predep = calculatePredeposition({
    dopant: species,
    tempCelsius: predepTempCelsius,
    timeSeconds: predepTimeSeconds,
    surfaceConcentrationCm3: predepSurfaceConcentrationCm3,
    backgroundConcentrationCm3,
  });

  // Step 2: Drive-In
  const driveIn = calculateDriveIn({
    dopant: species,
    tempCelsius: driveInTempCelsius,
    timeSeconds: driveInTimeSeconds,
    doseCm2: predep.doseQ,
    backgroundConcentrationCm3,
  });

  // Combined effective thermal budget: (Dt)eff = D1 * t1 + D2 * t2
  const effectiveDtCm2 = predep.dtProductCm2 + driveIn.dtProductCm2;
  const effectiveCharacteristicLengthUm = Math.sqrt(effectiveDtCm2) * UM_PER_CM;

  // Final surface concentration accounting for total effective budget
  const finalSurfaceConcentrationCm3 = predep.doseQ / Math.sqrt(Math.PI * effectiveDtCm2);

  let junctionDepthCm: number | undefined;
  let junctionDepthUm: number | undefined;
  let junctionDepthNm: number | undefined;

  if (
    backgroundConcentrationCm3 !== undefined &&
    backgroundConcentrationCm3 > 0 &&
    backgroundConcentrationCm3 < finalSurfaceConcentrationCm3
  ) {
    const lnRatio = Math.log(finalSurfaceConcentrationCm3 / backgroundConcentrationCm3);
    junctionDepthCm = Math.sqrt(4 * effectiveDtCm2 * lnRatio);
    junctionDepthUm = junctionDepthCm * UM_PER_CM;
    junctionDepthNm = junctionDepthCm * NM_PER_CM;
  }

  let profile: ConcentrationProfilePoint[] | undefined;
  if (depthsUm && depthsUm.length > 0) {
    profile = depthsUm.map((xUm) => {
      const xCm = xUm * CM_PER_UM;
      const conc = finalSurfaceConcentrationCm3 * Math.exp(-(xCm * xCm) / (4 * effectiveDtCm2));
      return {
        depthUm: xUm,
        depthNm: xUm * NM_PER_UM,
        concentrationCm3: Math.max(0, conc),
      };
    });
  }

  return {
    dopant: species,
    predep,
    driveIn,
    effectiveDtCm2,
    effectiveCharacteristicLengthUm,
    finalSurfaceConcentrationCm3,
    junctionDepthCm,
    junctionDepthUm,
    junctionDepthNm,
    profile,
  };
}

export interface OxideMaskThicknessParams {
  dopant?: string;
  diffusivityOxideCm2PerS?: number;
  tempCelsius?: number;
  timeSeconds: number;
  /** Safety multiplier, typically 3 or 4 (defaults to 4). */
  safetyMultiplier?: number;
}

export interface OxideMaskThicknessResult {
  dopant?: DopantSpecies;
  tempCelsius?: number;
  timeSeconds: number;
  diffusivityOxideCm2PerS: number;
  /** sqrt(D_ox * t) in cm. */
  diffusionLengthCm: number;
  /** sqrt(D_ox * t) in micrometres. */
  diffusionLengthUm: number;
  /** sqrt(D_ox * t) in nanometres. */
  diffusionLengthNm: number;
  /** Minimum oxide thickness by 3 * sqrt(D_ox * t) rule in nanometres (~99.7% masking). */
  minThickness3xNm: number;
  /** Minimum oxide thickness by 3 * sqrt(D_ox * t) rule in micrometres. */
  minThickness3xUm: number;
  /** Minimum oxide thickness by 4 * sqrt(D_ox * t) rule in nanometres (~99.99% masking). */
  minThickness4xNm: number;
  /** Minimum oxide thickness by 4 * sqrt(D_ox * t) rule in micrometres. */
  minThickness4xUm: number;
  safetyMultiplier: number;
  /** Recommended thickness using selected safety multiplier in nanometres. */
  recommendedThicknessNm: number;
  /** Recommended thickness in micrometres. */
  recommendedThicknessUm: number;
}

/**
 * Calculates minimum SiO2 masking oxide thickness required to prevent dopant penetration into Silicon.
 *
 * Engineering rules of thumb:
 * - 3 * sqrt(D_ox * t): removes 99.7% of diffusion flux.
 * - 4 * sqrt(D_ox * t): standard conservative VLSI design guideline (99.99% masking).
 */
export function calculateMinimumOxideMaskThickness(
  params: OxideMaskThicknessParams
): OxideMaskThicknessResult {
  const { dopant, tempCelsius, timeSeconds, safetyMultiplier = 4 } = params;

  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    throw new Error('Diffusion time must be a positive number of seconds.');
  }

  let diffusivityOxideCm2PerS = params.diffusivityOxideCm2PerS;
  let species: DopantSpecies | undefined;

  if (dopant) {
    species = normalizeDopantSpecies(dopant);
    if (diffusivityOxideCm2PerS === undefined) {
      if (tempCelsius === undefined) {
        throw new Error('Must provide either diffusivityOxideCm2PerS or tempCelsius with dopant.');
      }
      diffusivityOxideCm2PerS = getDiffusionCoefficient(species, tempCelsius, 'SiO2');
    }
  }

  if (
    diffusivityOxideCm2PerS === undefined ||
    diffusivityOxideCm2PerS <= 0 ||
    !Number.isFinite(diffusivityOxideCm2PerS)
  ) {
    throw new Error('Oxide diffusivity must be a positive number in cm^2/s.');
  }

  const diffusionLengthCm = Math.sqrt(diffusivityOxideCm2PerS * timeSeconds);
  const diffusionLengthUm = diffusionLengthCm * UM_PER_CM;
  const diffusionLengthNm = diffusionLengthCm * NM_PER_CM;

  const minThickness3xCm = 3 * diffusionLengthCm;
  const minThickness4xCm = 4 * diffusionLengthCm;
  const recommendedCm = safetyMultiplier * diffusionLengthCm;

  return {
    dopant: species,
    tempCelsius,
    timeSeconds,
    diffusivityOxideCm2PerS,
    diffusionLengthCm,
    diffusionLengthUm,
    diffusionLengthNm,
    minThickness3xNm: minThickness3xCm * NM_PER_CM,
    minThickness3xUm: minThickness3xCm * UM_PER_CM,
    minThickness4xNm: minThickness4xCm * NM_PER_CM,
    minThickness4xUm: minThickness4xCm * UM_PER_CM,
    safetyMultiplier,
    recommendedThicknessNm: recommendedCm * NM_PER_CM,
    recommendedThicknessUm: recommendedCm * UM_PER_CM,
  };
}
