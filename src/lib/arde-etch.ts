/**
 * Aspect Ratio Dependent Etching (ARDE / RIE Lag), Microloading,
 * and Mask Selectivity Physics.
 *
 * References:
 * - Coburn & Winters, J. Appl. Phys. (Knudsen diffusion transport in high AR features)
 * - Gottscho et al., J. Vac. Sci. Technol. B (Microscopic uniformity in plasma etching)
 * - Mogab, J. Electrochem. Soc. (Loading effect and neutral reactant depletion)
 */

export type ArdeModel = 'exponential' | 'coburn-winter';

export interface ArdeEtchRateOptions {
  /** Nominal open-field etch rate R_0 (e.g., nm/min or um/min). Must be >= 0. */
  nominalRate: number;
  /** Feature etch depth (same length unit as cd, e.g. nm or um). Must be >= 0. */
  depth: number;
  /** Critical dimension / feature opening width (same length unit as depth). Must be > 0. */
  cd: number;
  /**
   * Model used for ARDE / RIE lag:
   * - 'coburn-winter': R(AR) = R_0 / (1 + k * AR)
   * - 'exponential':   R(AR) = R_0 * exp(-alpha * AR)
   * Defaults to 'coburn-winter'.
   */
  model?: ArdeModel;
  /**
   * Attenuation coefficient: k for coburn-winter or alpha for exponential.
   * Default: 0.1 for coburn-winter, 0.1 for exponential.
   */
  modelCoefficient?: number;
  /** Alias for modelCoefficient in coburn-winter model. */
  k?: number;
  /** Alias for modelCoefficient in exponential model. */
  alpha?: number;
}

export interface ArdeEtchRateResult {
  /** Aspect ratio: AR = depth / cd */
  aspectRatio: number;
  /** Nominal etch rate at AR = 0 */
  nominalRate: number;
  /** Predicted etch rate at given aspect ratio: R(AR) */
  etchRate: number;
  /** ARDE lag ratio: R(AR) / R_0 (between 0 and 1) */
  lagRatio: number;
  /** Percentage reduction in etch rate: (1 - lagRatio) * 100 (%) */
  percentageReduction: number;
  /** Model applied ('exponential' | 'coburn-winter') */
  model: ArdeModel;
  /** Model attenuation coefficient applied */
  coefficient: number;
}

/**
 * Calculates ARDE / RIE Lag ratio and predicted etch rate for high-aspect-ratio features.
 *
 * Formula:
 * - Coburn-Winter (Knudsen flux resistance): R(AR) = R_0 / (1 + k * AR)
 * - Exponential attenuation:                 R(AR) = R_0 * exp(-alpha * AR)
 * where AR = depth / cd.
 */
export function calculateArdeEtchRate(options: ArdeEtchRateOptions): ArdeEtchRateResult {
  const { nominalRate, depth, cd, model = 'coburn-winter' } = options;

  if (!Number.isFinite(nominalRate) || nominalRate < 0) {
    throw new RangeError('Nominal etch rate must be a non-negative finite number.');
  }
  if (!Number.isFinite(depth) || depth < 0) {
    throw new RangeError('Feature depth must be a non-negative finite number.');
  }
  if (!Number.isFinite(cd) || cd <= 0) {
    throw new RangeError('Critical dimension (cd) must be a positive finite number.');
  }
  if (model !== 'exponential' && model !== 'coburn-winter') {
    throw new TypeError(`Invalid ARDE model "${model}". Expected "exponential" or "coburn-winter".`);
  }

  const rawCoeff = options.modelCoefficient ?? (model === 'coburn-winter' ? options.k : options.alpha);
  const coeff = rawCoeff !== undefined ? rawCoeff : 0.1;

  if (!Number.isFinite(coeff) || coeff < 0) {
    throw new RangeError('Attenuation coefficient must be a non-negative finite number.');
  }

  const aspectRatio = depth / cd;

  let lagRatio: number;
  if (aspectRatio === 0) {
    lagRatio = 1;
  } else if (model === 'coburn-winter') {
    lagRatio = 1 / (1 + coeff * aspectRatio);
  } else {
    lagRatio = Math.exp(-coeff * aspectRatio);
  }

  const etchRate = nominalRate * lagRatio;
  const percentageReduction = (1 - lagRatio) * 100;

  return {
    aspectRatio,
    nominalRate,
    etchRate,
    lagRatio,
    percentageReduction,
    model,
    coefficient: coeff,
  };
}

export interface MicroloadingOptions {
  /** Pattern open area density rho: fractional area (0 to 1). */
  patternDensity: number;
  /** Neutral reactant depletion coefficient eta (>= 0). */
  neutralDepletionCoeff: number;
  /** Optional isolated pattern etch rate R_iso (e.g. nm/min). Must be >= 0. */
  isolatedEtchRate?: number;
}

export interface MicroloadingResult {
  /** Pattern density rho */
  patternDensity: number;
  /** Neutral depletion coefficient eta */
  neutralDepletionCoeff: number;
  /** Microloading ratio: R_dense / R_iso = 1 / (1 + eta * rho) */
  microloadingRatio: number;
  /** Etch rate reduction percentage due to local loading: (1 - ratio) * 100 (%) */
  loadingDepletionPercent: number;
  /** Isolated pattern etch rate (if provided) */
  isolatedEtchRate?: number;
  /** Predicted dense pattern etch rate: R_iso * microloadingRatio */
  denseEtchRate?: number;
}

/**
 * Calculates microloading ratio between dense and isolated patterns.
 *
 * Formula:
 *   R_dense / R_iso = 1 / (1 + eta * rho)
 * where rho is the local pattern density fraction and eta is the neutral depletion parameter.
 */
export function calculateMicroloading(options: MicroloadingOptions): MicroloadingResult {
  const { patternDensity, neutralDepletionCoeff, isolatedEtchRate } = options;

  if (!Number.isFinite(patternDensity) || patternDensity < 0 || patternDensity > 1) {
    throw new RangeError('Pattern density must be a finite number between 0 and 1.');
  }
  if (!Number.isFinite(neutralDepletionCoeff) || neutralDepletionCoeff < 0) {
    throw new RangeError('Neutral depletion coefficient must be a non-negative finite number.');
  }
  if (isolatedEtchRate !== undefined && (!Number.isFinite(isolatedEtchRate) || isolatedEtchRate < 0)) {
    throw new RangeError('Isolated etch rate must be a non-negative finite number.');
  }

  const microloadingRatio = 1 / (1 + neutralDepletionCoeff * patternDensity);
  const loadingDepletionPercent = (1 - microloadingRatio) * 100;

  const result: MicroloadingResult = {
    patternDensity,
    neutralDepletionCoeff,
    microloadingRatio,
    loadingDepletionPercent,
  };

  if (isolatedEtchRate !== undefined) {
    result.isolatedEtchRate = isolatedEtchRate;
    result.denseEtchRate = isolatedEtchRate * microloadingRatio;
  }

  return result;
}

export interface EtchSelectivityOptions {
  /** Vertical etch rate of the target layer (e.g. nm/min). Must be > 0. */
  targetEtchRate: number;
  /** Vertical etch rate of the masking layer (e.g. nm/min). Must be >= 0. */
  maskEtchRate: number;
  /** Overetch percentage applied beyond nominal target clear (>= 0, e.g. 10 for 10%). */
  overetchPercent: number;
  /** Optional target film thickness (nm or um). Must be > 0 if specified. */
  targetThickness?: number;
  /** Optional initial mask thickness (same unit as targetThickness). Must be > 0 if specified. */
  maskThickness?: number;
  /**
   * Optional initial mask sidewall angle in degrees (default: 90 deg).
   * Valid range: (0, 90].
   */
  initialMaskAngleDeg?: number;
}

export interface EtchSelectivityResult {
  /** Mask selectivity: S = targetEtchRate / maskEtchRate */
  selectivity: number;
  /** Resulting sidewall profile angle from horizontal in degrees: arctan(S * tan(theta_mask)) */
  profileAngleDeg: number;
  /** Sidewall taper angle deviation from vertical: 90 - profileAngleDeg (deg) */
  taperAngleDeg: number;
  /** Overetch percent applied (%) */
  overetchPercent: number;
  /** Overetch factor: 1 + overetchPercent / 100 */
  overetchFactor: number;
  /** Required mask thickness ratio per unit target thickness: (1 + OE) / S */
  requiredMaskRatio: number;
  /** Nominal time to etch target layer (seconds, when targetThickness is given) */
  nominalTimeSec?: number;
  /** Total etch time including overetch (seconds, when targetThickness is given) */
  totalTimeSec?: number;
  /** Total mask thickness consumed during etch + overetch (same unit as targetThickness) */
  maskLoss?: number;
  /** Remaining mask thickness after etch + overetch (when both thicknesses are given) */
  remainingMaskThickness?: number;
  /** Whether mask has remaining thickness > 0 (when both thicknesses are given) */
  isMaskSufficient?: boolean;
}

/**
 * Calculates mask selectivity, profile taper angle, and mask consumption during overetch.
 *
 * Formulas:
 *   S = targetEtchRate / maskEtchRate
 *   tan(profileAngle) = S * tan(initialMaskAngle)
 *   taperAngle = 90 deg - profileAngle
 *   maskLoss = (targetThickness / S) * (1 + overetchPercent / 100)
 */
export function calculateEtchSelectivity(options: EtchSelectivityOptions): EtchSelectivityResult {
  const {
    targetEtchRate,
    maskEtchRate,
    overetchPercent,
    targetThickness,
    maskThickness,
    initialMaskAngleDeg = 90,
  } = options;

  if (!Number.isFinite(targetEtchRate) || targetEtchRate <= 0) {
    throw new RangeError('Target etch rate must be a positive finite number.');
  }
  if (!Number.isFinite(maskEtchRate) || maskEtchRate < 0) {
    throw new RangeError('Mask etch rate must be a non-negative finite number.');
  }
  if (!Number.isFinite(overetchPercent) || overetchPercent < 0) {
    throw new RangeError('Overetch percent must be a non-negative finite number.');
  }
  if (targetThickness !== undefined && (!Number.isFinite(targetThickness) || targetThickness <= 0)) {
    throw new RangeError('Target thickness must be a positive finite number.');
  }
  if (maskThickness !== undefined && (!Number.isFinite(maskThickness) || maskThickness <= 0)) {
    throw new RangeError('Mask thickness must be a positive finite number.');
  }
  if (
    !Number.isFinite(initialMaskAngleDeg) ||
    initialMaskAngleDeg <= 0 ||
    initialMaskAngleDeg > 90
  ) {
    throw new RangeError('Initial mask angle must be greater than 0 and less than or equal to 90 degrees.');
  }

  const overetchFactor = 1 + overetchPercent / 100;

  let selectivity: number;
  let profileAngleDeg: number;
  let taperAngleDeg: number;
  let requiredMaskRatio: number;

  if (maskEtchRate === 0) {
    selectivity = Infinity;
    profileAngleDeg = 90;
    taperAngleDeg = 0;
    requiredMaskRatio = 0;
  } else {
    selectivity = targetEtchRate / maskEtchRate;
    if (initialMaskAngleDeg === 90) {
      // Lateral mask erosion model: tan(theta) = S
      const angleRad = Math.atan(selectivity);
      profileAngleDeg = (angleRad * 180) / Math.PI;
    } else {
      const maskAngleRad = (initialMaskAngleDeg * Math.PI) / 180;
      const tanProfile = selectivity * Math.tan(maskAngleRad);
      profileAngleDeg = (Math.atan(tanProfile) * 180) / Math.PI;
    }
    taperAngleDeg = 90 - profileAngleDeg;
    requiredMaskRatio = overetchFactor / selectivity;
  }

  const result: EtchSelectivityResult = {
    selectivity,
    profileAngleDeg,
    taperAngleDeg,
    overetchPercent,
    overetchFactor,
    requiredMaskRatio,
  };

  if (targetThickness !== undefined) {
    // nominal time assuming etch rate per minute: (thickness / rate) * 60 seconds
    const nominalTimeSec = (targetThickness / targetEtchRate) * 60;
    const totalTimeSec = nominalTimeSec * overetchFactor;
    const maskLoss = targetThickness * requiredMaskRatio;

    result.nominalTimeSec = nominalTimeSec;
    result.totalTimeSec = totalTimeSec;
    result.maskLoss = maskLoss;

    if (maskThickness !== undefined) {
      const remainingMaskThickness = maskThickness - maskLoss;
      result.remainingMaskThickness = remainingMaskThickness;
      result.isMaskSufficient = remainingMaskThickness > 0;
    }
  }

  return result;
}
