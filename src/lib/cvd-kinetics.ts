/**
 * Chemical Vapor Deposition (CVD) & Epitaxy Growth Kinetics
 * Based on the Grove CVD Boundary Layer Model, Arrhenius Surface Reaction Kinetics,
 * and Reactor Depletion Dynamics.
 */

export type CvdProcessId =
  | 'si-sih4'
  | 'si-sih2cl2'
  | 'si-sicl4'
  | 'polysilicon-lpcvd'
  | 'sio2-teos'
  | 'si3n4-lpcvd'
  | 'custom';

export type CvdRegime = 'surface-reaction-limited' | 'mass-transport-limited' | 'mixed-transition';

export interface CvdRecipe {
  id: CvdProcessId;
  name: string;
  filmMaterial: string;
  precursor: string;
  typicalTempRangeC: [number, number];
  defaultTempC: number;
  defaultPressureTorr: number;
  defaultMoleFraction: number;
  activationEnergyEv: number;
  preExponentialKs0: number; // cm/s
  diffusivityDg0: number; // cm^2/s at 300 K, 760 Torr
  filmDensityAtomsCm3: number; // atoms or molecules / cm^3
  description: string;
}

export const CVD_RECIPES: Record<CvdProcessId, CvdRecipe> = {
  'si-sih4': {
    id: 'si-sih4',
    name: 'Silicon Epitaxy from Silane (SiH₄)',
    filmMaterial: 'Si (Epitaxial)',
    precursor: 'SiH₄ in H₂',
    typicalTempRangeC: [600, 1050],
    defaultTempC: 850,
    defaultPressureTorr: 760,
    defaultMoleFraction: 0.001,
    activationEnergyEv: 1.6,
    preExponentialKs0: 1.2e7,
    diffusivityDg0: 0.65,
    filmDensityAtomsCm3: 5.0e22,
    description: 'Pyrolysis of silane. Clean low-temperature epitaxial growth with no chlorine etching competition.',
  },
  'si-sih2cl2': {
    id: 'si-sih2cl2',
    name: 'Silicon Epitaxy from Dichlorosilane (SiH₂Cl₂ / DCS)',
    filmMaterial: 'Si (Epitaxial)',
    precursor: 'SiH₂Cl₂ in H₂',
    typicalTempRangeC: [850, 1150],
    defaultTempC: 1000,
    defaultPressureTorr: 760,
    defaultMoleFraction: 0.005,
    activationEnergyEv: 1.9,
    preExponentialKs0: 8.5e7,
    diffusivityDg0: 0.55,
    filmDensityAtomsCm3: 5.0e22,
    description: 'Standard workhorse for silicon epitaxial reactors. Offers high growth rate with moderate pattern shift.',
  },
  'si-sicl4': {
    id: 'si-sicl4',
    name: 'Silicon Epitaxy from Silicon Tetrachloride (SiCl₄)',
    filmMaterial: 'Si (Epitaxial)',
    precursor: 'SiCl₄ in H₂',
    typicalTempRangeC: [1100, 1250],
    defaultTempC: 1180,
    defaultPressureTorr: 760,
    defaultMoleFraction: 0.02,
    activationEnergyEv: 1.8,
    preExponentialKs0: 4.5e6,
    diffusivityDg0: 0.45,
    filmDensityAtomsCm3: 5.0e22,
    description: 'High-temperature silicon epitaxy. Reversible reaction with in-situ HCl etching competitive regime.',
  },
  'polysilicon-lpcvd': {
    id: 'polysilicon-lpcvd',
    name: 'Polycrystalline Silicon LPCVD (SiH₄)',
    filmMaterial: 'Poly-Si',
    precursor: '100% SiH₄',
    typicalTempRangeC: [570, 650],
    defaultTempC: 620,
    defaultPressureTorr: 0.3,
    defaultMoleFraction: 1.0,
    activationEnergyEv: 1.65,
    preExponentialKs0: 5.0e8,
    diffusivityDg0: 0.65,
    filmDensityAtomsCm3: 5.0e22,
    description: 'Low-pressure chemical vapor deposition of polycrystalline silicon for gate electrodes and capacitor plates.',
  },
  'sio2-teos': {
    id: 'sio2-teos',
    name: 'Silicon Dioxide LPCVD from TEOS',
    filmMaterial: 'SiO₂',
    precursor: 'Si(OC₂H₅)₄ (TEOS)',
    typicalTempRangeC: [650, 750],
    defaultTempC: 700,
    defaultPressureTorr: 0.5,
    defaultMoleFraction: 0.8,
    activationEnergyEv: 1.95,
    preExponentialKs0: 8.0e8,
    diffusivityDg0: 0.25,
    filmDensityAtomsCm3: 2.2e22,
    description: 'Tetraethylorthosilicate decomposition producing exceptional step coverage over high aspect ratio topography.',
  },
  'si3n4-lpcvd': {
    id: 'si3n4-lpcvd',
    name: 'Silicon Nitride LPCVD (SiH₂Cl₂ + NH₃)',
    filmMaterial: 'Si₃N₄',
    precursor: 'DCS + NH₃ (1:5 to 1:10)',
    typicalTempRangeC: [700, 820],
    defaultTempC: 780,
    defaultPressureTorr: 0.25,
    defaultMoleFraction: 0.15,
    activationEnergyEv: 1.8,
    preExponentialKs0: 1.2e8,
    diffusivityDg0: 0.35,
    filmDensityAtomsCm3: 1.48e22,
    description: 'Conformal silicon nitride dielectric for oxidation masks (LOCOS), etch stops, and passivation layers.',
  },
  'custom': {
    id: 'custom',
    name: 'Custom CVD Process',
    filmMaterial: 'Custom Film',
    precursor: 'Custom Precursor',
    typicalTempRangeC: [400, 1200],
    defaultTempC: 750,
    defaultPressureTorr: 10,
    defaultMoleFraction: 0.01,
    activationEnergyEv: 1.7,
    preExponentialKs0: 1e7,
    diffusivityDg0: 0.5,
    filmDensityAtomsCm3: 4.0e22,
    description: 'User-configurable CVD kinetics and reactor parameters.',
  },
};

export const BOLTZMANN_EV_K = 8.617333262e-5; // eV / K
export const GAS_CONSTANT_R = 62363.67; // cm^3 * Torr / (mol * K)
export const AVOGADRO = 6.02214076e23;

export interface CvdCalculationInput {
  recipeId: CvdProcessId;
  tempCelsius: number;
  pressureTorr: number;
  reactantMoleFraction: number; // e.g. 0.005 for 0.5%
  gasVelocityCmPerS: number; // bulk flow velocity U (cm/s)
  waferPositionXCm: number; // position from susceptor leading edge (cm)
  channelHeightCm: number; // reactor vertical spacing above wafer (cm)
  susceptorLengthCm: number; // total susceptor length (cm)
  customActivationEnergyEv?: number;
  customKs0?: number;
  customDg0?: number;
  customFilmDensity?: number;
}

export interface DepletionPoint {
  positionCm: number;
  concentrationCm3: number;
  growthRateNmPerMin: number;
  fractionalLossPercent: number;
}

export interface ArrheniusPoint {
  tempCelsius: number;
  invTempK1000: number; // 1000 / T (K^-1)
  growthRateNmPerMin: number;
  logGrowthRate: number;
  regime: CvdRegime;
}

export interface CvdCalculationResult {
  ok: boolean;
  errorMessage?: string;
  tempKelvin: number;
  reactantPartialPressureTorr: number;
  gasConcentrationCg: number; // molecules / cm^3
  diffusivityDg: number; // cm^2 / s
  boundaryLayerThicknessDeltaCm: number; // cm
  boundaryLayerThicknessDeltaMm: number; // mm
  massTransferCoefficientHg: number; // cm / s
  surfaceReactionRateKs: number; // cm / s
  effectiveRateConstantKeff: number; // cm / s
  transitionTemperatureCelsius: number | null;
  regime: CvdRegime;
  growthRateCmPerS: number;
  growthRateNmPerMin: number;
  growthRateUmPerHour: number;
  depletionProfile: DepletionPoint[];
  arrheniusCurve: ArrheniusPoint[];
  reactorUniformityPercent: number; // 100 * (min / max) along susceptor
}

/**
 * Calculates CVD and Epitaxy kinetics using the Grove boundary-layer transport model
 * and Arrhenius surface reaction kinetics.
 */
export function calculateCvdKinetics(input: CvdCalculationInput): CvdCalculationResult {
  const {
    recipeId,
    tempCelsius,
    pressureTorr,
    reactantMoleFraction,
    gasVelocityCmPerS,
    waferPositionXCm,
    channelHeightCm,
    susceptorLengthCm,
  } = input;

  if (tempCelsius < -200) {
    return createErrorResult('Temperature cannot be below absolute zero.');
  }
  if (pressureTorr <= 0) {
    return createErrorResult('Pressure must be greater than 0 Torr.');
  }
  if (reactantMoleFraction <= 0 || reactantMoleFraction > 1) {
    return createErrorResult('Reactant mole fraction must be between 0 and 1.');
  }
  if (gasVelocityCmPerS <= 0) {
    return createErrorResult('Gas velocity must be greater than 0 cm/s.');
  }
  if (waferPositionXCm <= 0) {
    return createErrorResult('Wafer position along susceptor must be greater than 0 cm.');
  }
  if (channelHeightCm <= 0) {
    return createErrorResult('Channel height must be greater than 0 cm.');
  }

  const recipe = CVD_RECIPES[recipeId] ?? CVD_RECIPES['si-sih4'];
  const Ea = input.customActivationEnergyEv ?? recipe.activationEnergyEv;
  const ks0 = input.customKs0 ?? recipe.preExponentialKs0;
  const Dg0 = input.customDg0 ?? recipe.diffusivityDg0;
  const N1 = input.customFilmDensity ?? recipe.filmDensityAtomsCm3;

  const tempKelvin = tempCelsius + 273.15;
  if (tempKelvin <= 0) {
    return createErrorResult('Temperature must be above absolute zero.');
  }

  // 1. Gas-phase diffusivity D_g(T, P) = Dg0 * (T / 300)^1.75 * (760 / P)
  const diffusivityDg = Dg0 * Math.pow(tempKelvin / 300, 1.75) * (760 / pressureTorr);

  // 2. Boundary layer thickness delta(x) = 3 * sqrt(D_g * x / U)
  const boundaryLayerThicknessDeltaCm = 3 * Math.sqrt((diffusivityDg * waferPositionXCm) / gasVelocityCmPerS);
  const boundaryLayerThicknessDeltaMm = boundaryLayerThicknessDeltaCm * 10;

  // 3. Mass-transfer coefficient h_g = D_g / delta
  const massTransferCoefficientHg = diffusivityDg / boundaryLayerThicknessDeltaCm;

  // 4. Surface reaction rate constant k_s = ks0 * exp(-Ea / (k_B * T))
  const surfaceReactionRateKs = ks0 * Math.exp(-Ea / (BOLTZMANN_EV_K * tempKelvin));

  // 5. Reactant concentration in bulk gas C_g = (P_reactant * N_A) / (R * T)
  const reactantPartialPressureTorr = pressureTorr * reactantMoleFraction;
  const molesPerCm3 = reactantPartialPressureTorr / (GAS_CONSTANT_R * tempKelvin);
  const gasConcentrationCg = molesPerCm3 * AVOGADRO;

  // 6. Effective rate constant k_eff = (h_g * k_s) / (h_g + k_s)
  const effectiveRateConstantKeff = (massTransferCoefficientHg * surfaceReactionRateKs) / (massTransferCoefficientHg + surfaceReactionRateKs);

  // 7. Growth rate v = (C_g / N_1) * k_eff
  const growthRateCmPerS = (gasConcentrationCg / N1) * effectiveRateConstantKeff;
  const growthRateNmPerMin = growthRateCmPerS * 1e7 * 60;
  const growthRateUmPerHour = growthRateCmPerS * 1e4 * 3600;

  // 8. Regime identification
  const ratio = surfaceReactionRateKs / massTransferCoefficientHg;
  let regime: CvdRegime = 'mixed-transition';
  if (ratio < 0.25) {
    regime = 'surface-reaction-limited';
  } else if (ratio > 4.0) {
    regime = 'mass-transport-limited';
  }

  // 9. Transition temperature where k_s = h_g
  // ks0 * exp(-Ea / (k_B * T_trans)) = h_g => T_trans = -Ea / (k_B * ln(h_g / ks0))
  let transitionTemperatureCelsius: number | null = null;
  if (massTransferCoefficientHg > 0 && ks0 > 0 && massTransferCoefficientHg < ks0) {
    const lnRatio = Math.log(massTransferCoefficientHg / ks0);
    const tTransKelvin = -Ea / (BOLTZMANN_EV_K * lnRatio);
    if (tTransKelvin > 0 && tTransKelvin < 3000) {
      transitionTemperatureCelsius = tTransKelvin - 273.15;
    }
  }

  // 10. Depletion Profile along susceptor length
  const numDepletionSteps = 25;
  const totalLength = Math.max(susceptorLengthCm, waferPositionXCm * 1.5, 20);
  const stepSize = totalLength / (numDepletionSteps - 1);
  const depletionProfile: DepletionPoint[] = [];

  let initialRateAtLeadingEdge = 0;
  for (let i = 0; i < numDepletionSteps; i++) {
    const xPos = Math.max(0.1, i * stepSize);
    // Boundary layer at position x
    const deltaX = 3 * Math.sqrt((diffusivityDg * xPos) / gasVelocityCmPerS);
    const hgX = diffusivityDg / deltaX;
    const keffX = (hgX * surfaceReactionRateKs) / (hgX + surfaceReactionRateKs);

    // Concentration depletion along channel: C_g(x) = C_g0 * exp(- (keffX / (b * U)) * x)
    const decayFactor = Math.exp(-((keffX * xPos) / (channelHeightCm * gasVelocityCmPerS)));
    const concX = gasConcentrationCg * decayFactor;
    const rateNmMin = (concX / N1) * keffX * 1e7 * 60;

    if (i === 0) initialRateAtLeadingEdge = rateNmMin;
    const lossPct = initialRateAtLeadingEdge > 0 ? Math.max(0, (1 - rateNmMin / initialRateAtLeadingEdge) * 100) : 0;

    depletionProfile.push({
      positionCm: Number(xPos.toFixed(2)),
      concentrationCm3: concX,
      growthRateNmPerMin: Number(rateNmMin.toFixed(2)),
      fractionalLossPercent: Number(lossPct.toFixed(1)),
    });
  }

  const rates = depletionProfile.map((p) => p.growthRateNmPerMin);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const reactorUniformityPercent = maxRate > 0 ? Number(((minRate / maxRate) * 100).toFixed(1)) : 0;

  // 11. Arrhenius curve generation across range (e.g. 400C to 1200C)
  const arrheniusCurve: ArrheniusPoint[] = [];
  const minTempC = Math.max(200, tempCelsius - 300);
  const maxTempC = tempCelsius + 300;
  const tempSteps = 21;
  const tempDelta = (maxTempC - minTempC) / (tempSteps - 1);

  for (let j = 0; j < tempSteps; j++) {
    const tC = minTempC + j * tempDelta;
    const tK = tC + 273.15;
    const dgT = Dg0 * Math.pow(tK / 300, 1.75) * (760 / pressureTorr);
    const deltaT = 3 * Math.sqrt((dgT * waferPositionXCm) / gasVelocityCmPerS);
    const hgT = dgT / deltaT;
    const ksT = ks0 * Math.exp(-Ea / (BOLTZMANN_EV_K * tK));
    const keffT = (hgT * ksT) / (hgT + ksT);

    const molesT = reactantPartialPressureTorr / (GAS_CONSTANT_R * tK);
    const concT = molesT * AVOGADRO;
    const rateT = (concT / N1) * keffT * 1e7 * 60;

    let regT: CvdRegime = 'mixed-transition';
    const rT = ksT / hgT;
    if (rT < 0.25) regT = 'surface-reaction-limited';
    else if (rT > 4.0) regT = 'mass-transport-limited';

    arrheniusCurve.push({
      tempCelsius: Number(tC.toFixed(0)),
      invTempK1000: Number((1000 / tK).toFixed(3)),
      growthRateNmPerMin: Number(rateT.toFixed(3)),
      logGrowthRate: Number(Math.log10(Math.max(1e-4, rateT)).toFixed(3)),
      regime: regT,
    });
  }

  return {
    ok: true,
    tempKelvin,
    reactantPartialPressureTorr,
    gasConcentrationCg,
    diffusivityDg,
    boundaryLayerThicknessDeltaCm,
    boundaryLayerThicknessDeltaMm,
    massTransferCoefficientHg,
    surfaceReactionRateKs,
    effectiveRateConstantKeff,
    transitionTemperatureCelsius,
    regime,
    growthRateCmPerS,
    growthRateNmPerMin,
    growthRateUmPerHour,
    depletionProfile,
    arrheniusCurve,
    reactorUniformityPercent,
  };
}

function createErrorResult(errorMessage: string): CvdCalculationResult {
  return {
    ok: false,
    errorMessage,
    tempKelvin: 0,
    reactantPartialPressureTorr: 0,
    gasConcentrationCg: 0,
    diffusivityDg: 0,
    boundaryLayerThicknessDeltaCm: 0,
    boundaryLayerThicknessDeltaMm: 0,
    massTransferCoefficientHg: 0,
    surfaceReactionRateKs: 0,
    effectiveRateConstantKeff: 0,
    transitionTemperatureCelsius: null,
    regime: 'mixed-transition',
    growthRateCmPerS: 0,
    growthRateNmPerMin: 0,
    growthRateUmPerHour: 0,
    depletionProfile: [],
    arrheniusCurve: [],
    reactorUniformityPercent: 0,
  };
}
