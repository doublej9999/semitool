/**
 * Wet Bench Chemical Lifetime, Spike Dosing & Loading Calculator
 *
 * Implements chemical lifetime tracking, spike dosing replenishment,
 * dissolved silicon/oxide mass loading decay, water evaporation loss (Antoine equation),
 * and RCA SC-1 clean particle removal efficiency (PRE) heuristics.
 */

export interface WetBenchRecipe {
  id: string;
  name: string;
  chemicalSystem: string;
  ratioDescription: string;
  targetChemical: string;
  defaultBathVolumeL: number;
  defaultCurrentConc: number; // %
  defaultTargetConc: number; // %
  defaultSourceConc: number; // %
  defaultTempC: number; // °C
  defaultRunHours: number; // hours
  defaultBathLifeHours: number; // hours
  defaultDissolvedLoadingGL: number; // g/L
  defaultMaxLoadingGL: number; // g/L
  defaultInitialEtchRateNmMin: number; // nm/min
  megasonicsApplicable: boolean;
  defaultMegasonicPowerW?: number;
  hazardNote?: string;
}

export const WET_BENCH_RECIPES: Record<string, WetBenchRecipe> = {
  'sc-1': {
    id: 'sc-1',
    name: 'RCA SC-1 (Standard Clean 1)',
    chemicalSystem: 'NH4OH:H2O2:H2O',
    ratioDescription: '1 part NH₄OH (29%) : 1 part H₂O₂ (30%) : 5 parts DI H₂O',
    targetChemical: 'NH₄OH (29%)',
    defaultBathVolumeL: 20,
    defaultCurrentConc: 1.8,
    defaultTargetConc: 2.5,
    defaultSourceConc: 29.0,
    defaultTempC: 65,
    defaultRunHours: 16,
    defaultBathLifeHours: 48,
    defaultDissolvedLoadingGL: 0.8,
    defaultMaxLoadingGL: 5.0,
    defaultInitialEtchRateNmMin: 0.65,
    megasonicsApplicable: true,
    defaultMegasonicPowerW: 400,
    hazardNote: 'Exothermic decomposition of H₂O₂ accelerates above 70°C. Maintain continuous recirculation and exhaust.',
  },
  'sc-2': {
    id: 'sc-2',
    name: 'RCA SC-2 (Standard Clean 2)',
    chemicalSystem: 'HCl:H2O2:H2O',
    ratioDescription: '1 part HCl (37%) : 1 part H₂O₂ (30%) : 6 parts DI H₂O',
    targetChemical: 'HCl (37%)',
    defaultBathVolumeL: 20,
    defaultCurrentConc: 4.2,
    defaultTargetConc: 5.2,
    defaultSourceConc: 37.0,
    defaultTempC: 75,
    defaultRunHours: 24,
    defaultBathLifeHours: 72,
    defaultDissolvedLoadingGL: 0.3,
    defaultMaxLoadingGL: 4.0,
    defaultInitialEtchRateNmMin: 0.08,
    megasonicsApplicable: false,
    hazardNote: 'Corrosive HCl acid vapors; dedicated acid exhaust required. Do not cross-contaminate with alkaline SC-1.',
  },
  spm: {
    id: 'spm',
    name: 'SPM Piranha (Sulfuric Peroxide)',
    chemicalSystem: 'H2SO4:H2O2',
    ratioDescription: '4 parts H₂SO₄ (96%) : 1 part H₂O₂ (30%)',
    targetChemical: 'H₂O₂ (30%)',
    defaultBathVolumeL: 25,
    defaultCurrentConc: 2.0,
    defaultTargetConc: 5.0,
    defaultSourceConc: 30.0,
    defaultTempC: 125,
    defaultRunHours: 10,
    defaultBathLifeHours: 24,
    defaultDissolvedLoadingGL: 2.2,
    defaultMaxLoadingGL: 8.0,
    defaultInitialEtchRateNmMin: 14.0,
    megasonicsApplicable: false,
    hazardNote: 'Violent exothermic reaction (>120°C). Risk of explosion if spiked too rapidly or exposed to heavy organic/solvent load.',
  },
  'boe-6-1': {
    id: 'boe-6-1',
    name: 'BOE 6:1 (Buffered Oxide Etch)',
    chemicalSystem: 'NH4F:HF (6:1)',
    ratioDescription: '6 parts NH₄F (40%) : 1 part HF (49%)',
    targetChemical: 'HF (49%)',
    defaultBathVolumeL: 20,
    defaultCurrentConc: 6.0,
    defaultTargetConc: 6.8,
    defaultSourceConc: 49.0,
    defaultTempC: 22,
    defaultRunHours: 36,
    defaultBathLifeHours: 120,
    defaultDissolvedLoadingGL: 8.5,
    defaultMaxLoadingGL: 25.0,
    defaultInitialEtchRateNmMin: 85.0,
    megasonicsApplicable: false,
    hazardNote: 'HF causes severe, deep bone and nerve tissue burns without immediate pain. Calcium gluconate antidote required on site.',
  },
  'boe-10-1': {
    id: 'boe-10-1',
    name: 'BOE 10:1 (Buffered Oxide Etch)',
    chemicalSystem: 'NH4F:HF (10:1)',
    ratioDescription: '10 parts NH₄F (40%) : 1 part HF (49%)',
    targetChemical: 'HF (49%)',
    defaultBathVolumeL: 20,
    defaultCurrentConc: 3.8,
    defaultTargetConc: 4.4,
    defaultSourceConc: 49.0,
    defaultTempC: 22,
    defaultRunHours: 30,
    defaultBathLifeHours: 120,
    defaultDissolvedLoadingGL: 5.2,
    defaultMaxLoadingGL: 22.0,
    defaultInitialEtchRateNmMin: 52.0,
    megasonicsApplicable: false,
    hazardNote: 'Buffered HF formulation for slower, controlled dielectric and thin gate oxide etching.',
  },
  'dhf-50-1': {
    id: 'dhf-50-1',
    name: 'dHF 50:1 (Dilute HF)',
    chemicalSystem: 'H2O:HF (50:1)',
    ratioDescription: '50 parts DI H₂O : 1 part HF (49%)',
    targetChemical: 'HF (49%)',
    defaultBathVolumeL: 25,
    defaultCurrentConc: 0.75,
    defaultTargetConc: 0.98,
    defaultSourceConc: 49.0,
    defaultTempC: 21,
    defaultRunHours: 42,
    defaultBathLifeHours: 96,
    defaultDissolvedLoadingGL: 1.8,
    defaultMaxLoadingGL: 6.0,
    defaultInitialEtchRateNmMin: 6.8,
    megasonicsApplicable: false,
    hazardNote: 'Dilute HF terminates bare silicon surfaces with hydrophobic Si-H bonds while stripping chemical/native oxides.',
  },
  'dhf-100-1': {
    id: 'dhf-100-1',
    name: 'dHF 100:1 (Dilute HF)',
    chemicalSystem: 'H2O:HF (100:1)',
    ratioDescription: '100 parts DI H₂O : 1 part HF (49%)',
    targetChemical: 'HF (49%)',
    defaultBathVolumeL: 25,
    defaultCurrentConc: 0.35,
    defaultTargetConc: 0.49,
    defaultSourceConc: 49.0,
    defaultTempC: 21,
    defaultRunHours: 32,
    defaultBathLifeHours: 96,
    defaultDissolvedLoadingGL: 1.1,
    defaultMaxLoadingGL: 4.5,
    defaultInitialEtchRateNmMin: 3.4,
    megasonicsApplicable: false,
    hazardNote: 'Very low etch rate (~3.4 nm/min) for sensitive surface pre-clean prior to gate oxide growth or epitaxy.',
  },
};

/**
 * Calculates required chemical spike volume to restore bath to target concentration:
 * V_spike = V_bath * (C_target - C_current) / (C_source - C_target)
 *
 * @param bathVolumeL Bath liquid volume in Liters (non-negative)
 * @param currentConc Current active chemical concentration in % (e.g. 2.0%)
 * @param targetConc Desired target concentration in % (e.g. 5.0%)
 * @param sourceConc Concentrated chemical spike source in % (e.g. 30.0%)
 * @returns Spike volume in Liters
 */
export function calculateSpikeDosing(
  bathVolumeL: number,
  currentConc: number,
  targetConc: number,
  sourceConc: number,
): number {
  if (
    !Number.isFinite(bathVolumeL) ||
    !Number.isFinite(currentConc) ||
    !Number.isFinite(targetConc) ||
    !Number.isFinite(sourceConc)
  ) {
    throw new TypeError('All volume and concentration parameters must be finite numbers');
  }

  if (bathVolumeL < 0) {
    throw new RangeError('Bath volume must be non-negative');
  }
  if (currentConc < 0) {
    throw new RangeError('Current concentration must be non-negative');
  }
  if (targetConc < 0) {
    throw new RangeError('Target concentration must be non-negative');
  }
  if (sourceConc <= 0) {
    throw new RangeError('Source concentration must be strictly positive');
  }
  if (sourceConc > 100 || targetConc > 100 || currentConc > 100) {
    throw new RangeError('Concentration cannot exceed 100%');
  }
  if (sourceConc <= targetConc) {
    throw new RangeError('Source concentration must be strictly greater than target concentration');
  }
  if (currentConc > targetConc) {
    throw new RangeError('Current concentration exceeds target concentration');
  }

  if (bathVolumeL === 0 || currentConc === targetConc) {
    return 0;
  }

  const vSpike = (bathVolumeL * (targetConc - currentConc)) / (sourceConc - targetConc);
  return vSpike;
}

export interface BathDegradationParams {
  initialEtchRateNmMin: number;
  dissolvedSiliconGL: number;
  maxLoadingGL: number;
  runHours: number;
  bathLifeHours: number;
  bathTempC: number;
}

export interface BathDegradationResult {
  currentEtchRateNmMin: number;
  initialEtchRateNmMin: number;
  etchRateFactor: number;
  etchRateReductionPercent: number;
  remainingLifeHours: number;
  remainingLifePercent: number;
  loadingSaturationPercent: number;
  isExpired: boolean;
  waterEvaporationLossRateLPerHour: number;
  vaporPressureKPa: number;
  vaporPressureMmHg: number;
  status: 'optimal' | 'warning' | 'critical' | 'expired';
}

/**
 * Calculates wet bench chemical bath degradation:
 * - Current etch rate decayed by dissolved mass loading: ER = ER0 * Math.max(0, 1 - (dissolvedSiliconGL / maxLoadingGL)**1.5)
 * - Remaining lifetime in hours and percent
 * - Water evaporation loss rate based on Antoine equation for water vapor pressure
 */
export function calculateBathDegradation(params: BathDegradationParams): BathDegradationResult {
  const {
    initialEtchRateNmMin,
    dissolvedSiliconGL,
    maxLoadingGL,
    runHours,
    bathLifeHours,
    bathTempC,
  } = params;

  if (
    !Number.isFinite(initialEtchRateNmMin) ||
    !Number.isFinite(dissolvedSiliconGL) ||
    !Number.isFinite(maxLoadingGL) ||
    !Number.isFinite(runHours) ||
    !Number.isFinite(bathLifeHours) ||
    !Number.isFinite(bathTempC)
  ) {
    throw new TypeError('All degradation parameters must be finite numbers');
  }

  if (initialEtchRateNmMin < 0) {
    throw new RangeError('Initial etch rate must be non-negative');
  }
  if (dissolvedSiliconGL < 0) {
    throw new RangeError('Dissolved silicon loading must be non-negative');
  }
  if (maxLoadingGL <= 0) {
    throw new RangeError('Max loading capacity must be strictly positive');
  }
  if (runHours < 0) {
    throw new RangeError('Run hours must be non-negative');
  }
  if (bathLifeHours <= 0) {
    throw new RangeError('Bath life hours must be strictly positive');
  }
  if (bathTempC < -10 || bathTempC > 180) {
    throw new RangeError('Bath temperature is outside valid range (-10°C to 180°C)');
  }

  // 1. Etch rate decay via dissolved mass loading
  const loadingRatio = dissolvedSiliconGL / maxLoadingGL;
  const loadingSaturationPercent = loadingRatio * 100;
  const etchRateFactor = Math.max(0, 1 - Math.pow(loadingRatio, 1.5));
  const currentEtchRateNmMin = initialEtchRateNmMin * etchRateFactor;
  const etchRateReductionPercent =
    initialEtchRateNmMin > 0
      ? ((initialEtchRateNmMin - currentEtchRateNmMin) / initialEtchRateNmMin) * 100
      : 0;

  // 2. Lifetime tracking
  const remainingLifeHours = Math.max(0, bathLifeHours - runHours);
  const remainingLifePercent = Math.max(0, Math.min(100, (remainingLifeHours / bathLifeHours) * 100));
  const isExpired = runHours >= bathLifeHours || dissolvedSiliconGL >= maxLoadingGL;

  // 3. Water vapor pressure & evaporation loss rate via Antoine Equation
  // log10(P [mmHg]) = A - B / (T + C) for water (A=8.07131, B=1730.63, C=233.426)
  const safeTemp = Math.max(0, Math.min(140, bathTempC));
  const logP = 8.07131 - 1730.63 / (safeTemp + 233.426);
  const vaporPressureMmHg = Math.pow(10, logP);
  const vaporPressureKPa = vaporPressureMmHg * 0.133322;

  // Carrier evaporation model for typical fab wet bench tank (A ≈ 0.15 m², face velocity ≈ 0.45 m/s)
  // Ambient fab vapor pressure at 21°C / 45% RH is ~1.12 kPa
  const pAmbientKPa = 1.12;
  const deltaP = Math.max(0, vaporPressureKPa - pAmbientKPa);
  const waterEvaporationLossRateLPerHour = Number((0.0186 * deltaP).toFixed(4));

  // Determine overall status
  let status: BathDegradationResult['status'] = 'optimal';
  if (isExpired) {
    status = 'expired';
  } else if (loadingSaturationPercent >= 85 || remainingLifePercent <= 15) {
    status = 'critical';
  } else if (loadingSaturationPercent >= 60 || remainingLifePercent <= 35) {
    status = 'warning';
  }

  return {
    currentEtchRateNmMin,
    initialEtchRateNmMin,
    etchRateFactor,
    etchRateReductionPercent,
    remainingLifeHours,
    remainingLifePercent,
    loadingSaturationPercent,
    isExpired,
    waterEvaporationLossRateLPerHour,
    vaporPressureKPa,
    vaporPressureMmHg,
    status,
  };
}

export interface Sc1Ratio {
  nh4oh: number;
  h2o2: number;
  h2o: number;
}

export interface RcaCleanEfficiencyResult {
  prePercent: number; // Particle Removal Efficiency (%)
  roughnessDeltaRaNm: number; // Surface roughness delta (Ra increase in nm)
  underEtchRateNmMin: number; // Liftoff under-etching rate
  regime: 'dilute-low-damage' | 'standard-rca' | 'aggressive-roughening';
}

/**
 * Estimates RCA SC-1 clean particle removal efficiency (PRE %) and surface roughness increase (Ra nm)
 * as a function of temperature, megasonic agitation power, and NH4OH:H2O2:H2O ratio.
 */
export function calculateRcaParticleCleanEfficiency(
  tempC: number,
  megasonicPowerW: number,
  sc1Ratio: Sc1Ratio,
): RcaCleanEfficiencyResult {
  if (
    !Number.isFinite(tempC) ||
    !Number.isFinite(megasonicPowerW) ||
    !Number.isFinite(sc1Ratio?.nh4oh) ||
    !Number.isFinite(sc1Ratio?.h2o2) ||
    !Number.isFinite(sc1Ratio?.h2o)
  ) {
    throw new TypeError('All temperature, power, and ratio parameters must be finite numbers');
  }

  if (tempC < 15 || tempC > 100) {
    throw new RangeError('SC-1 operating temperature must be between 15°C and 100°C');
  }
  if (megasonicPowerW < 0) {
    throw new RangeError('Megasonic power must be non-negative');
  }
  if (sc1Ratio.nh4oh <= 0 || sc1Ratio.h2o2 <= 0 || sc1Ratio.h2o <= 0) {
    throw new RangeError('SC-1 volumetric ratio components must all be strictly positive');
  }

  const nh4ohRatio = sc1Ratio.nh4oh / sc1Ratio.h2o2;

  // 1. Particle Removal Efficiency (PRE)
  // Base PRE from chemical liftoff + thermal activation
  const chemPRE = 48 + 30 * (1 - Math.exp(-(tempC - 20) / 25));
  // Acoustic cavitation & streaming drag force boost
  const megaPRE = 22 * (1 - Math.exp(-megasonicPowerW / 140));

  let prePercent = chemPRE + megaPRE;
  // If NH4OH is very low, under-etching decreases slightly
  if (nh4ohRatio < 0.1) {
    prePercent *= 0.75 + 2.5 * nh4ohRatio;
  }
  prePercent = Math.min(99.8, Math.max(10, prePercent));

  // 2. Surface roughness increase (delta Ra in nm)
  // Scales with NH4OH fraction, temperature, and dilution
  const tempFactor = Math.exp((tempC - 65) / 25);
  const dilutionFactor = Math.sqrt(5 / sc1Ratio.h2o);
  const roughnessDeltaRaNm = Number(
    (0.03 + 0.14 * nh4ohRatio * tempFactor * dilutionFactor).toFixed(4),
  );

  // 3. Oxide/silicon under-etch rate (nm/min)
  const underEtchRateNmMin = Number(
    (0.1 + 0.55 * nh4ohRatio * Math.exp((tempC - 65) / 20) * (5 / sc1Ratio.h2o)).toFixed(3),
  );

  // 4. Regime classification
  let regime: RcaCleanEfficiencyResult['regime'] = 'standard-rca';
  if (nh4ohRatio <= 0.3 && tempC <= 65) {
    regime = 'dilute-low-damage';
  } else if (nh4ohRatio > 1.2 || tempC > 75) {
    regime = 'aggressive-roughening';
  }

  return {
    prePercent: Number(prePercent.toFixed(2)),
    roughnessDeltaRaNm,
    underEtchRateNmMin,
    regime,
  };
}
