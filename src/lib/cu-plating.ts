/**
 * Semiconductor Copper Electrochemical Deposition (ECD / Plating)
 * Dual Damascene superfilling, Faraday electrolysis, seed layer terminal effect,
 * and additive kinetics.
 */

export interface CuPlatingParams {
  /** Applied current density (mA/cm^2) - typically 5 to 40 mA/cm^2 */
  currentDensityMaCm2: number;
  /** Plating time (seconds) */
  platingTimeSec: number;
  /** Cathodic current efficiency (0 to 1, typically 0.95 to 0.99) */
  currentEfficiency?: number;
  /** Wafer diameter (mm) - e.g. 200 or 300 mm */
  waferDiameterMm?: number;
  /** Copper seed layer sheet resistance (Ohm/sq) - typically 0.5 to 3 Ohm/sq */
  seedSheetResistanceOhmSq?: number;
  /** Feature trench width (nm) */
  trenchWidthNm?: number;
  /** Feature trench depth (nm) */
  trenchDepthNm?: number;
  /** Accelerator (SPS) concentration factor (0.5 to 2.0, default 1.0) */
  acceleratorRatio?: number;
  /** Suppressor (PEG) concentration factor (0.5 to 2.0, default 1.0) */
  suppressorRatio?: number;
  /** Leveler concentration factor (0.5 to 2.0, default 1.0) */
  levelerRatio?: number;
}

export interface PlatingProfilePoint {
  normalizedRadius: number; // 0 (center) to 1.0 (edge)
  radiusMm: number;
  currentDensityMaCm2: number;
  filmThicknessNm: number;
}

export interface DamasceneFillResult {
  aspectRatio: number;
  bottomUpVelocityRatio: number; // v_bottom / v_field
  pinchOffRisk: 'none' | 'moderate' | 'high';
  voidRiskPercent: number;
  timeToFillTrenchSec: number;
  overburdenThicknessNm: number;
  recommendedSuperfillingTimeSec: number;
}

export interface CuPlatingResult {
  nominalRateNmMin: number;
  nominalThicknessNm: number;
  totalChargeCoulombs: number;
  totalCuMassGrams: number;
  radialUniformityPercent: number; // 100 * (T_edge - T_center) / T_mean
  centerThicknessNm: number;
  edgeThicknessNm: number;
  radialProfile: PlatingProfilePoint[];
  damascene?: DamasceneFillResult;
  warnings: string[];
}

// Physical constants
export const CU_ATOMIC_WEIGHT = 63.546; // g/mol
export const FARADAY_CONSTANT = 96485.332; // C/mol
export const CU_DENSITY_G_CM3 = 8.96; // g/cm^3
export const CU_VALENCE = 2; // Cu2+ + 2e- -> Cu

/**
 * Calculates nominal planar Cu deposition rate from current density using Faraday's law.
 * Rate (nm/min) = (J [mA/cm^2] * 10 [A/m^2 / mA/cm^2] * M_cu [kg/mol] * efficiency * 60 [s/min] * 1e9 [nm/m]) / (z * F * rho [kg/m^3])
 * Factor = (10 * 0.063546 * 60 * 1e9) / (2 * 96485.332 * 8960) = 38.1276e9 / 1.7289e9 ≈ 22.0528 nm/min per mA/cm^2
 */
export function calculateCuDepositionRateNmMin(
  currentDensityMaCm2: number,
  efficiency = 0.98
): number {
  if (currentDensityMaCm2 <= 0 || efficiency <= 0) return 0;
  const rateFactor = (CU_ATOMIC_WEIGHT * 60 * 1e4) / (CU_VALENCE * FARADAY_CONSTANT * CU_DENSITY_G_CM3);
  return rateFactor * currentDensityMaCm2 * efficiency;
}

/**
 * Simulates Dual Damascene trench superfilling using Curvature Enhanced Accelerator Coverage (CEAC) model.
 */
export function simulateDamasceneFill(
  trenchWidthNm: number,
  trenchDepthNm: number,
  fieldRateNmMin: number,
  acceleratorRatio = 1.0,
  suppressorRatio = 1.0,
  levelerRatio = 1.0
): DamasceneFillResult {
  if (trenchWidthNm <= 0 || trenchDepthNm <= 0 || fieldRateNmMin <= 0) {
    return {
      aspectRatio: 0,
      bottomUpVelocityRatio: 1,
      pinchOffRisk: 'high',
      voidRiskPercent: 100,
      timeToFillTrenchSec: 0,
      overburdenThicknessNm: 0,
      recommendedSuperfillingTimeSec: 0,
    };
  }

  const aspectRatio = trenchDepthNm / trenchWidthNm;

  // CEAC bottom acceleration ratio:
  // Accelerator accumulates at concave corners (area shrinks) while suppressor suppresses flat field.
  const baseRatio = 1.6 + 0.5 * (acceleratorRatio / Math.max(0.2, suppressorRatio)) + 0.15 * Math.log10(aspectRatio + 0.5);
  const bottomUpVelocityRatio = Math.max(1.1, Math.min(4.5, baseRatio * (1 - 0.1 * (levelerRatio - 1))));

  const bottomRateNmMin = fieldRateNmMin * bottomUpVelocityRatio;
  const timeToFillTrenchSec = (trenchDepthNm / (bottomRateNmMin / 60));

  // Risk of pinch-off and center void formation
  let pinchOffRisk: 'none' | 'moderate' | 'high' = 'none';
  let voidRiskPercent = 5;

  if (aspectRatio > 4.5 || bottomUpVelocityRatio < 1.4) {
    pinchOffRisk = 'high';
    voidRiskPercent = Math.min(95, 25 + (aspectRatio - 4) * 20);
  } else if (aspectRatio > 2.8 || bottomUpVelocityRatio < 1.8) {
    pinchOffRisk = 'moderate';
    voidRiskPercent = Math.min(50, 15 + (aspectRatio - 2.5) * 15);
  }

  const recommendedSuperfillingTimeSec = Math.ceil(timeToFillTrenchSec * 1.35); // 35% overburden margin
  const overburdenThicknessNm = Math.max(0, (fieldRateNmMin / 60) * (recommendedSuperfillingTimeSec - timeToFillTrenchSec));

  return {
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    bottomUpVelocityRatio: Math.round(bottomUpVelocityRatio * 100) / 100,
    pinchOffRisk,
    voidRiskPercent: Math.round(voidRiskPercent),
    timeToFillTrenchSec: Math.round(timeToFillTrenchSec * 10) / 10,
    overburdenThicknessNm: Math.round(overburdenThicknessNm * 10) / 10,
    recommendedSuperfillingTimeSec,
  };
}

/**
 * Calculates wafer radial current distribution accounting for the seed layer terminal effect.
 */
export function calculateRadialCurrentProfile(
  nominalCurrentMaCm2: number,
  waferDiameterMm: number,
  seedSheetResistanceOhmSq: number,
  platingTimeSec: number,
  efficiency = 0.98,
  points = 11
): { profile: PlatingProfilePoint[]; centerThickness: number; edgeThickness: number; uniformity: number } {
  const radiusMaxMm = waferDiameterMm / 2;
  const waferAreaCm2 = Math.PI * Math.pow(radiusMaxMm / 10, 2);
  const totalNominalCurrentA = (nominalCurrentMaCm2 * waferAreaCm2) / 1000;

  // Terminal effect parameter beta: ratio of seed IR drop to overpotential scale (approx 0.1V)
  // Higher Rsheet and larger wafer diameter produce sharper edge current crowding.
  const beta = (seedSheetResistanceOhmSq * totalNominalCurrentA) / (8 * Math.PI * 0.12);
  const dampFactor = Math.min(0.65, beta * 0.25);

  const profile: PlatingProfilePoint[] = [];

  for (let i = 0; i < points; i++) {
    const normR = i / (points - 1);
    const rMm = normR * radiusMaxMm;
    // Radial distribution: edge has higher current due to perimeter contact ring
    const currentMultiplier = 1 - dampFactor * (1 - Math.pow(normR, 2.2));
    const localCurrentDensity = nominalCurrentMaCm2 * currentMultiplier;
    const localRateNmMin = calculateCuDepositionRateNmMin(localCurrentDensity, efficiency);
    const filmThicknessNm = (localRateNmMin / 60) * platingTimeSec;

    profile.push({
      normalizedRadius: Math.round(normR * 100) / 100,
      radiusMm: Math.round(rMm * 10) / 10,
      currentDensityMaCm2: Math.round(localCurrentDensity * 100) / 100,
      filmThicknessNm: Math.round(filmThicknessNm * 10) / 10,
    });
  }

  const centerThickness = profile[0].filmThicknessNm;
  const edgeThickness = profile[profile.length - 1].filmThicknessNm;
  const meanThickness = profile.reduce((sum, p) => sum + p.filmThicknessNm, 0) / profile.length;
  const uniformity = meanThickness > 0 ? (Math.abs(edgeThickness - centerThickness) / meanThickness) * 100 : 0;

  return {
    profile,
    centerThickness,
    edgeThickness,
    uniformity: Math.round(uniformity * 100) / 100,
  };
}

/**
 * Main Cu Plating calculation routine.
 */
export function calculateCuPlating(params: CuPlatingParams): CuPlatingResult {
  const {
    currentDensityMaCm2,
    platingTimeSec,
    currentEfficiency = 0.98,
    waferDiameterMm = 300,
    seedSheetResistanceOhmSq = 1.2,
    trenchWidthNm,
    trenchDepthNm,
    acceleratorRatio = 1.0,
    suppressorRatio = 1.0,
    levelerRatio = 1.0,
  } = params;

  const warnings: string[] = [];

  if (currentDensityMaCm2 <= 0) {
    warnings.push('Applied current density must be greater than zero.');
  } else if (currentDensityMaCm2 > 50) {
    warnings.push('Current density exceeds 50 mA/cm²: risk of copper burning, hydrogen co-evolution, and extreme dendritic roughness.');
  }

  if (platingTimeSec <= 0) {
    warnings.push('Plating time must be greater than zero.');
  }

  const nominalRateNmMin = calculateCuDepositionRateNmMin(currentDensityMaCm2, currentEfficiency);
  const nominalThicknessNm = (nominalRateNmMin / 60) * platingTimeSec;

  const radiusMm = waferDiameterMm / 2;
  const waferAreaCm2 = Math.PI * Math.pow(radiusMm / 10, 2);
  const totalCurrentA = (currentDensityMaCm2 * waferAreaCm2) / 1000;
  const totalChargeCoulombs = totalCurrentA * platingTimeSec;
  // Faraday mass: m = (Q * M) / (z * F) * efficiency
  const totalCuMassGrams = (totalChargeCoulombs * CU_ATOMIC_WEIGHT * currentEfficiency) / (CU_VALENCE * FARADAY_CONSTANT);

  const radial = calculateRadialCurrentProfile(
    currentDensityMaCm2,
    waferDiameterMm,
    seedSheetResistanceOhmSq,
    platingTimeSec,
    currentEfficiency
  );

  if (radial.uniformity > 15) {
    warnings.push(
      `High terminal effect non-uniformity (${radial.uniformity}% edge-to-center difference). Consider dynamic multi-zone anode shield rings or thicker copper seed layer.`
    );
  }

  let damascene: DamasceneFillResult | undefined;
  if (trenchWidthNm && trenchDepthNm && trenchWidthNm > 0 && trenchDepthNm > 0) {
    damascene = simulateDamasceneFill(
      trenchWidthNm,
      trenchDepthNm,
      nominalRateNmMin,
      acceleratorRatio,
      suppressorRatio,
      levelerRatio
    );

    if (damascene.pinchOffRisk === 'high') {
      warnings.push(
        `High risk of Damascene keyhole voiding! Aspect ratio is ${damascene.aspectRatio}:1. Increase accelerator/suppressor ratio or reduce current density.`
      );
    }
  }

  return {
    nominalRateNmMin: Math.round(nominalRateNmMin * 10) / 10,
    nominalThicknessNm: Math.round(nominalThicknessNm * 10) / 10,
    totalChargeCoulombs: Math.round(totalChargeCoulombs * 10) / 10,
    totalCuMassGrams: Math.round(totalCuMassGrams * 1000) / 1000,
    radialUniformityPercent: radial.uniformity,
    centerThicknessNm: radial.centerThickness,
    edgeThicknessNm: radial.edgeThickness,
    radialProfile: radial.profile,
    damascene,
    warnings,
  };
}
