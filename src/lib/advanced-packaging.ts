/**
 * Advanced Packaging & 2.5D / 3D Chiplet Multiphysics
 *
 * Implements physical models for:
 * 1. TSV (Through-Silicon Via) Thermo-Mechanical Stress & Keep-Out Zone (KOZ):
 *    - Lamé analytic stress solution in silicon matrix around cylindrical Cu via
 *    - Piezoresistive mobility shift threshold determining transistor KOZ radius
 *    - Cu pumping height estimation from plastic yield under thermal cycling
 *
 * 2. Microbump / RDL Electromigration & Thermomigration:
 *    - Black's Equation with coupled Joule self-heating
 *    - Current crowding factor at bump corner constriction
 *    - MTTF (Mean Time to Failure)
 *
 * 3. Underfill Capillary Flow Dynamics:
 *    - Washburn flow model for narrow gap filling
 *    - Fill time vs standoff height, bump pitch, contact angle, and dynamic viscosity
 */

export interface TsvStressResult {
  kozRadiusUm: number; // Keep-Out Zone radius where deltaSigma > threshold
  radialStressMpaAtInterface: number;
  hoopStressMpaAtInterface: number;
  cuPumpingHeightNm: number;
  stressProfile: { distanceUm: number; radialStressMpa: number; hoopStressMpa: number }[];
}

export interface MicrobumpEmResult {
  currentDensityAcm2: number;
  crowdingCurrentDensityAcm2: number; // peak at corner entry
  jouleHeatingDeltaTC: number;
  effectiveTemperatureC: number;
  mttfHours: number;
  safeLimitHours: number; // 99.9% reliability
}

export interface UnderfillFlowResult {
  fillTimeSec: number;
  flowVelocityMmPerSec: number;
  capillaryPressureKpa: number;
  voidRiskLevel: 'Low' | 'Moderate' | 'High';
}

/**
 * Calculates TSV thermo-mechanical stress and Keep-Out Zone (KOZ)
 */
export function calculateTsvStress(params: {
  viaDiameterUm: number; // typical 5 to 10 um
  viaHeightUm: number; // typical 50 to 100 um
  deltaTC: number; // T_process - T_operating, e.g. 250C to 25C = 225C
  stressThresholdMpa?: number; // threshold for transistor piezoresistive shift (typical 50 MPa)
}): TsvStressResult {
  const { viaDiameterUm, viaHeightUm, deltaTC, stressThresholdMpa = 50 } = params;
  const radiusUm = viaDiameterUm / 2;

  // Material properties
  // Silicon: E_si = 130 GPa, nu_si = 0.28, alpha_si = 2.6e-6 /K
  // Copper: E_cu = 110 GPa, nu_cu = 0.35, alpha_cu = 16.5e-6 /K
  const alphaSi = 2.6e-6;
  const alphaCu = 16.5e-6;
  const deltaAlpha = alphaCu - alphaSi; // 13.9e-6 /K

  const E_si = 130e3; // MPa
  const nu_si = 0.28;
  const E_cu = 110e3; // MPa
  const nu_cu = 0.35;

  // Effective mismatch strain
  const epsilon_thermal = deltaAlpha * deltaTC;

  // Interface radial pressure P0 at r = R (Lamé cylinder model)
  // P0 = epsilon_thermal / [ (1 + nu_si)/(2 * E_si) + (1 - nu_cu)/E_cu ]
  const complianceSi = (1 + nu_si) / (2 * E_si);
  const complianceCu = (1 - nu_cu) / E_cu;
  const P0 = epsilon_thermal / (complianceSi + complianceCu); // in MPa

  // Radial stress: sigma_r(r) = - P0 * (R / r)^2
  // Hoop stress: sigma_theta(r) = + P0 * (R / r)^2
  const radialStressMpaAtInterface = Number((-P0).toFixed(1));
  const hoopStressMpaAtInterface = Number(P0.toFixed(1));

  // KOZ radius where |sigma| <= stressThresholdMpa:
  // P0 * (R / r_koz)^2 = threshold => r_koz = R * sqrt(P0 / threshold)
  const kozRadiusUm = Number((radiusUm * Math.sqrt(Math.max(1, P0 / stressThresholdMpa))).toFixed(2));

  // Profile data
  const profile: { distanceUm: number; radialStressMpa: number; hoopStressMpa: number }[] = [];
  const maxR = Math.max(radiusUm * 4, kozRadiusUm * 1.3);
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const r = radiusUm + (i / steps) * (maxR - radiusUm);
    const factor = Math.pow(radiusUm / r, 2);
    profile.push({
      distanceUm: Number(r.toFixed(2)),
      radialStressMpa: Number((-P0 * factor).toFixed(1)),
      hoopStressMpa: Number((P0 * factor).toFixed(1)),
    });
  }

  // Cu pumping protrusion height (plastic yielding under thermal excursion)
  // h_pump ~ H * deltaAlpha * deltaT * plastic_efficiency (~0.2 - 0.3)
  const cuPumpingHeightNm = Number((viaHeightUm * 1e3 * deltaAlpha * deltaTC * 0.25).toFixed(1));

  return {
    kozRadiusUm,
    radialStressMpaAtInterface,
    hoopStressMpaAtInterface,
    cuPumpingHeightNm,
    stressProfile: profile,
  };
}

/**
 * Calculates microbump / pillar electromigration MTTF with coupled Joule heating
 */
export function calculateMicrobumpEm(params: {
  currentMa: number;
  bumpDiameterUm: number;
  ambientTempC?: number;
  thermalResistanceKPerW?: number; // K/W from bump to substrate
  crowdingFactor?: number; // current crowding multiplier at trace entry
}): MicrobumpEmResult {
  const {
    currentMa,
    bumpDiameterUm,
    ambientTempC = 85,
    thermalResistanceKPerW = 120,
    crowdingFactor = 2.4,
  } = params;

  // Bump cross-section area in cm²
  const radiusCm = (bumpDiameterUm / 2) * 1e-4;
  const areaCm2 = Math.PI * radiusCm * radiusCm;

  const currentA = currentMa / 1000;
  const nominalJ = currentA / areaCm2; // A/cm²
  const peakJ = nominalJ * crowdingFactor;

  // Joule heating power P = I^2 * R_bump
  // Solder resistivity (SAC305) ~ 13e-6 ohm-cm, bump height ~ 25 um
  const rhoOhmCm = 13.5e-6;
  const heightCm = 25e-4;
  const resistanceOhm = (rhoOhmCm * heightCm) / areaCm2;
  const powerWatts = currentA * currentA * resistanceOhm;
  const deltaT = powerWatts * thermalResistanceKPerW;
  const effectiveTempC = ambientTempC + deltaT;
  const effectiveTempK = effectiveTempC + 273.15;

  // Black's Equation for Electromigration MTTF:
  // MTTF = A * (J)^(-n) * exp(Ea / (k * T))
  // For SnAgCu (SAC) lead-free solder: n = 1.8, Ea = 0.85 eV, A ~ 1.5e5
  const Ea = 0.85; // eV
  const KB_EV = 8.617333262e-5;
  const nExponent = 1.8;
  const A_const = 2.5e11; // calibrated scaling constant for hours

  const mttf = (A_const * Math.pow(peakJ, -nExponent) * Math.exp(Ea / (KB_EV * effectiveTempK)));
  const mttfHours = Number(Math.max(1, mttf).toFixed(0));
  const safeLimitHours = Number((mttf * 0.1).toFixed(0)); // 10% lifetime for high-reliability target

  return {
    currentDensityAcm2: Number(nominalJ.toExponential(3)),
    crowdingCurrentDensityAcm2: Number(peakJ.toExponential(3)),
    jouleHeatingDeltaTC: Number(deltaT.toFixed(2)),
    effectiveTemperatureC: Number(effectiveTempC.toFixed(2)),
    mttfHours,
    safeLimitHours,
  };
}

/**
 * Calculates underfill capillary flow filling time using Washburn dynamics
 */
export function calculateUnderfillFlow(params: {
  chipLengthMm: number; // flow distance L
  gapHeightUm: number; // standoff h
  surfaceTensionMnPerM?: number; // gamma ~ 30 - 45 mN/m (mJ/m^2)
  contactAngleDeg?: number; // theta ~ 15 - 35 deg wetting angle
  dynamicViscosityPaS?: number; // mu ~ 0.05 - 0.2 Pa*s at 100C dispense temp
}): UnderfillFlowResult {
  const {
    chipLengthMm,
    gapHeightUm,
    surfaceTensionMnPerM = 35,
    contactAngleDeg = 25,
    dynamicViscosityPaS = 0.08,
  } = params;

  // Washburn Equation for 1D planar capillary flow between parallel plates:
  // L^2 = (gamma * h * cos(theta) / (3 * mu)) * t
  // t_fill = 3 * mu * L^2 / (gamma * h * cos(theta))
  const L = chipLengthMm * 1e-3; // meters
  const h = gapHeightUm * 1e-6; // meters
  const gamma = surfaceTensionMnPerM * 1e-3; // N/m
  const thetaRad = (contactAngleDeg * Math.PI) / 180;
  const cosTheta = Math.max(0.01, Math.cos(thetaRad));
  const mu = dynamicViscosityPaS; // Pa*s

  const fillTimeSec = (3 * mu * L * L) / (gamma * h * cosTheta);
  const avgVelocityMmPerSec = (chipLengthMm / Math.max(0.1, fillTimeSec));

  // Capillary driving pressure: deltaP = 2 * gamma * cos(theta) / h
  const capPressurePa = (2 * gamma * cosTheta) / h;
  const capillaryPressureKpa = Number((capPressurePa / 1000).toFixed(2));

  let voidRiskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (fillTimeSec > 120 || gapHeightUm < 15) {
    voidRiskLevel = 'High';
  } else if (fillTimeSec > 60 || gapHeightUm < 25) {
    voidRiskLevel = 'Moderate';
  }

  return {
    fillTimeSec: Number(fillTimeSec.toFixed(1)),
    flowVelocityMmPerSec: Number(avgVelocityMmPerSec.toFixed(2)),
    capillaryPressureKpa,
    voidRiskLevel,
  };
}
