/**
 * Wafer Bow, Warp & Thin Film Stress Calculator
 *
 * Implements:
 * 1. Stoney equation for thin-film residual stress from curvature / bow changes
 * 2. Wafer bow and radius of curvature bidirectional conversion
 * 3. Thermal mismatch stress from coefficient of thermal expansion (CTE) differences
 * 4. Intrinsic stress separation (sigma_intrinsic = sigma_total - sigma_thermal)
 * 5. Critical film cracking / peeling thickness (Griffith / Hutchinson-Suo model)
 */

export interface SubstratePreset {
  id: string;
  name: string;
  biaxialModulusGPa: number; // M_s = E_s / (1 - nu_s) in GPa
  thermalExpansionPpm: number; // alpha_s in 1e-6 / °C
  description: string;
}

export interface FilmPreset {
  id: string;
  name: string;
  youngsModulusGPa: number; // E_f in GPa
  poissonRatio: number; // nu_f
  thermalExpansionPpm: number; // alpha_f in 1e-6 / °C
  fractureToughness: number; // Gamma in J/m^2
  color: string; // Hex or theme color for SVG cross section
  description: string;
}

export interface WaferDiameterPreset {
  diameterMm: number;
  label: string;
  defaultThicknessUm: number;
}

export const SUBSTRATE_PRESETS: SubstratePreset[] = [
  {
    id: 'si100',
    name: 'Si <100>',
    biaxialModulusGPa: 180.5,
    thermalExpansionPpm: 2.6,
    description: 'Silicon (100) crystal orientation, standard CMOS substrate',
  },
  {
    id: 'si111',
    name: 'Si <111>',
    biaxialModulusGPa: 229.0,
    thermalExpansionPpm: 2.6,
    description: 'Silicon (111) orientation, higher in-plane stiffness',
  },
  {
    id: 'gaas100',
    name: 'GaAs <100>',
    biaxialModulusGPa: 123.9,
    thermalExpansionPpm: 5.7,
    description: 'Gallium Arsenide (100), RF and optoelectronics substrate',
  },
  {
    id: 'sic4h',
    name: '4H-SiC',
    biaxialModulusGPa: 501.0,
    thermalExpansionPpm: 4.0,
    description: 'Silicon Carbide 4H polytype, high power / RF substrate',
  },
  {
    id: 'fused-silica',
    name: 'Fused Silica Glass',
    biaxialModulusGPa: 85.0,
    thermalExpansionPpm: 0.5,
    description: 'Amorphous SiO2 fused quartz / silica substrate',
  },
  {
    id: 'sapphire',
    name: 'Sapphire (Al2O3)',
    biaxialModulusGPa: 603.0,
    thermalExpansionPpm: 7.5,
    description: 'Single-crystal c-plane sapphire, GaN epitaxy & optical substrate',
  },
];

export const FILM_PRESETS: FilmPreset[] = [
  {
    id: 'sio2-thermal',
    name: 'Thermal SiO2',
    youngsModulusGPa: 70.0,
    poissonRatio: 0.17,
    thermalExpansionPpm: 0.5,
    fractureToughness: 4.0,
    color: '#0284c7', // Sky-600
    description: 'Thermally grown dry/wet silicon dioxide (typically compressive)',
  },
  {
    id: 'si3n4-pecvd',
    name: 'PECVD Si3N4',
    youngsModulusGPa: 220.0,
    poissonRatio: 0.25,
    thermalExpansionPpm: 2.8,
    fractureToughness: 5.0,
    color: '#0d9488', // Teal-600
    description: 'Plasma-enhanced CVD silicon nitride passivation & AR coating',
  },
  {
    id: 'poly-si-lpcvd',
    name: 'LPCVD Poly-Si',
    youngsModulusGPa: 160.0,
    poissonRatio: 0.22,
    thermalExpansionPpm: 2.7,
    fractureToughness: 8.0,
    color: '#64748b', // Slate-500
    description: 'Low-pressure CVD polycrystalline silicon gate / structural film',
  },
  {
    id: 'cu-sputtered',
    name: 'Sputtered Cu',
    youngsModulusGPa: 110.0,
    poissonRatio: 0.34,
    thermalExpansionPpm: 16.5,
    fractureToughness: 10.0,
    color: '#b45309', // Amber-700
    description: 'Physical vapor deposition copper seed / interconnect metallization',
  },
  {
    id: 'al-sputtered',
    name: 'Sputtered Al',
    youngsModulusGPa: 70.0,
    poissonRatio: 0.33,
    thermalExpansionPpm: 23.1,
    fractureToughness: 12.0,
    color: '#94a3b8', // Slate-400
    description: 'Aluminum metallization layer with large thermal expansion',
  },
  {
    id: 'al2o3-ald',
    name: 'ALD Al2O3',
    youngsModulusGPa: 180.0,
    poissonRatio: 0.24,
    thermalExpansionPpm: 7.0,
    fractureToughness: 6.0,
    color: '#6366f1', // Indigo-500
    description: 'Atomic layer deposited aluminum oxide dielectric barrier',
  },
  {
    id: 'tin-sputtered',
    name: 'TiN (Titanium Nitride)',
    youngsModulusGPa: 450.0,
    poissonRatio: 0.25,
    thermalExpansionPpm: 9.4,
    fractureToughness: 5.0,
    color: '#d97706', // Gold / Amber-600
    description: 'Refractory barrier / gate electrode metal nitride',
  },
];

export const WAFER_DIAMETER_PRESETS: WaferDiameterPreset[] = [
  { diameterMm: 100, label: '100 mm (4")', defaultThicknessUm: 525 },
  { diameterMm: 150, label: '150 mm (6")', defaultThicknessUm: 675 },
  { diameterMm: 200, label: '200 mm (8")', defaultThicknessUm: 725 },
  { diameterMm: 300, label: '300 mm (12")', defaultThicknessUm: 775 },
];

/** Shape factor Z for film channel cracking / interfacial delamination (Hutchinson & Suo) */
export const DEFAULT_CRACK_SHAPE_FACTOR_Z = 1.12;

/**
 * Converts wafer radius of curvature (m) to wafer bow (µm).
 * Formula: Bow = D^2 / (8 * R)
 *
 * @param radiusM Signed radius of curvature in meters (positive = concave up, negative = convex)
 * @param diameterMm Wafer diameter in millimeters
 * @returns Bow in micrometers (µm)
 */
export function radiusToBow(radiusM: number, diameterMm: number): number {
  if (!Number.isFinite(radiusM) || radiusM === 0) {
    if (radiusM === 0) return Number.NaN;
    return 0; // Infinite radius = perfectly flat wafer
  }
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) {
    return Number.NaN;
  }
  const diameterM = diameterMm * 1e-3;
  // Bow in meters: D^2 / (8 * R)
  const bowM = (diameterM * diameterM) / (8 * radiusM);
  // Convert to micrometers
  return bowM * 1e6;
}

/**
 * Converts wafer bow (µm) to wafer radius of curvature (m).
 * Formula: R = D^2 / (8 * Bow)
 *
 * @param bowUm Wafer bow in micrometers (positive = concave up, negative = convex)
 * @param diameterMm Wafer diameter in millimeters
 * @returns Radius in meters (m)
 */
export function bowToRadius(bowUm: number, diameterMm: number): number {
  if (!Number.isFinite(bowUm)) return Number.NaN;
  if (bowUm === 0) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) return Number.NaN;

  const diameterM = diameterMm * 1e-3;
  const bowM = bowUm * 1e-6;
  return (diameterM * diameterM) / (8 * bowM);
}

export interface WaferStressInputs {
  biaxialModulusGPa: number; // M_s in GPa
  thermalExpansionSubstratePpm: number; // alpha_s in 1e-6 / °C
  waferDiameterMm: number; // D in mm
  substrateThicknessUm: number; // t_s in µm

  filmThicknessNm: number; // t_f in nm
  youngsModulusFilmGPa: number; // E_f in GPa
  poissonRatioFilm: number; // nu_f
  thermalExpansionFilmPpm: number; // alpha_f in 1e-6 / °C
  fractureToughness: number; // Gamma in J/m^2
  crackShapeFactorZ?: number; // Z factor (default 1.12)

  curvatureMode: 'radius' | 'bow';
  radiusPreM?: number; // Pre-deposition radius (m)
  radiusPostM?: number; // Post-deposition radius (m)
  bowPreUm?: number; // Pre-deposition bow (µm)
  bowPostUm?: number; // Post-deposition bow (µm)

  tempDepositionC: number; // T_dep (°C)
  tempMeasurementC?: number; // T_room / T_meas (°C, default 25)
}

export interface WaferStressResult {
  ok: boolean;
  error?: string;

  // Curvature & Bow
  radiusPreM: number;
  radiusPostM: number;
  curvaturePreM_inv: number; // 1 / R_pre (m^-1)
  curvaturePostM_inv: number; // 1 / R_post (m^-1)
  curvatureDeltaM_inv: number; // 1/R_post - 1/R_pre (m^-1)

  bowPreUm: number;
  bowPostUm: number;
  bowDeltaUm: number; // Bow_post - Bow_pre (µm)
  warpPostUm: number; // Peak-to-valley sagitta estimate |Bow_post| (µm)

  // Stresses (in MPa)
  totalStressMPa: number;
  thermalStressMPa: number;
  intrinsicStressMPa: number;
  stressType: 'tensile' | 'compressive' | 'neutral';

  // Elastic constants & Ratios
  substrateBiaxialModulusGPa: number;
  filmBiaxialModulusGPa: number;
  thicknessRatio: number; // t_f / t_s
  isThicknessRatioValid: boolean; // t_f / t_s <= 0.01

  // Cracking / Peeling Limit
  criticalThicknessNm: number; // h_c in nm
  exceedsCriticalThickness: boolean;

  // Engineering warnings
  warnings: string[];
}

/**
 * Calculates thin film stress via Stoney equation and thermal/intrinsic stress breakdown.
 */
export function calculateWaferWarpStress(inputs: WaferStressInputs): WaferStressResult {
  const warnings: string[] = [];

  // Guard validate basic geometry and modulus inputs
  if (
    !Number.isFinite(inputs.biaxialModulusGPa) ||
    inputs.biaxialModulusGPa <= 0 ||
    !Number.isFinite(inputs.waferDiameterMm) ||
    inputs.waferDiameterMm <= 0 ||
    !Number.isFinite(inputs.substrateThicknessUm) ||
    inputs.substrateThicknessUm <= 0 ||
    !Number.isFinite(inputs.filmThicknessNm) ||
    inputs.filmThicknessNm <= 0 ||
    !Number.isFinite(inputs.youngsModulusFilmGPa) ||
    inputs.youngsModulusFilmGPa <= 0 ||
    !Number.isFinite(inputs.poissonRatioFilm) ||
    inputs.poissonRatioFilm >= 1 ||
    inputs.poissonRatioFilm <= -1
  ) {
    return {
      ok: false,
      error: 'Invalid physical inputs: thicknesses, modulus, and diameter must be positive numbers.',
      radiusPreM: Number.NaN,
      radiusPostM: Number.NaN,
      curvaturePreM_inv: Number.NaN,
      curvaturePostM_inv: Number.NaN,
      curvatureDeltaM_inv: Number.NaN,
      bowPreUm: Number.NaN,
      bowPostUm: Number.NaN,
      bowDeltaUm: Number.NaN,
      warpPostUm: Number.NaN,
      totalStressMPa: Number.NaN,
      thermalStressMPa: Number.NaN,
      intrinsicStressMPa: Number.NaN,
      stressType: 'neutral',
      substrateBiaxialModulusGPa: inputs.biaxialModulusGPa || Number.NaN,
      filmBiaxialModulusGPa: Number.NaN,
      thicknessRatio: Number.NaN,
      isThicknessRatioValid: false,
      criticalThicknessNm: Number.NaN,
      exceedsCriticalThickness: false,
      warnings: ['Invalid input parameters.'],
    };
  }

  const D_m = inputs.waferDiameterMm * 1e-3;
  const t_s_m = inputs.substrateThicknessUm * 1e-6;
  const t_f_m = inputs.filmThicknessNm * 1e-9;
  const M_s_Pa = inputs.biaxialModulusGPa * 1e9;
  const E_f_Pa = inputs.youngsModulusFilmGPa * 1e9;
  const nu_f = inputs.poissonRatioFilm;
  const M_f_Pa = E_f_Pa / (1 - nu_f);
  const M_f_GPa = M_f_Pa / 1e9;

  let rPreM = 0;
  let rPostM = 0;
  let bowPreUm = 0;
  let bowPostUm = 0;
  let curPreInv = 0;
  let curPostInv = 0;

  if (inputs.curvatureMode === 'bow') {
    bowPreUm = Number.isFinite(inputs.bowPreUm) ? (inputs.bowPreUm as number) : 0;
    bowPostUm = Number.isFinite(inputs.bowPostUm) ? (inputs.bowPostUm as number) : 0;

    rPreM = bowToRadius(bowPreUm, inputs.waferDiameterMm);
    rPostM = bowToRadius(bowPostUm, inputs.waferDiameterMm);

    curPreInv = (8 * (bowPreUm * 1e-6)) / (D_m * D_m);
    curPostInv = (8 * (bowPostUm * 1e-6)) / (D_m * D_m);
  } else {
    // Radius mode
    rPreM = Number.isFinite(inputs.radiusPreM) ? (inputs.radiusPreM as number) : Number.POSITIVE_INFINITY;
    rPostM = Number.isFinite(inputs.radiusPostM) ? (inputs.radiusPostM as number) : Number.POSITIVE_INFINITY;

    if (rPostM === 0) {
      return {
        ok: false,
        error: 'Post-process radius cannot be zero (infinite curvature).',
        radiusPreM: rPreM,
        radiusPostM: 0,
        curvaturePreM_inv: Number.NaN,
        curvaturePostM_inv: Number.NaN,
        curvatureDeltaM_inv: Number.NaN,
        bowPreUm: Number.NaN,
        bowPostUm: Number.NaN,
        bowDeltaUm: Number.NaN,
        warpPostUm: Number.NaN,
        totalStressMPa: Number.NaN,
        thermalStressMPa: Number.NaN,
        intrinsicStressMPa: Number.NaN,
        stressType: 'neutral',
        substrateBiaxialModulusGPa: inputs.biaxialModulusGPa,
        filmBiaxialModulusGPa: M_f_GPa,
        thicknessRatio: t_f_m / t_s_m,
        isThicknessRatioValid: false,
        criticalThicknessNm: Number.NaN,
        exceedsCriticalThickness: false,
        warnings: ['Post radius of curvature cannot be 0.'],
      };
    }

    curPreInv = !Number.isFinite(rPreM) || rPreM === 0 ? 0 : 1 / rPreM;
    curPostInv = !Number.isFinite(rPostM) || rPostM === 0 ? 0 : 1 / rPostM;

    bowPreUm = radiusToBow(rPreM, inputs.waferDiameterMm);
    bowPostUm = radiusToBow(rPostM, inputs.waferDiameterMm);
  }

  const deltaCurvInv = curPostInv - curPreInv;
  const bowDeltaUm = bowPostUm - bowPreUm;
  const warpPostUm = Math.abs(bowPostUm);

  // Stoney equation:
  // sigma = (M_s * t_s^2) / (6 * t_f) * (1 / R_post - 1 / R_pre)
  const totalStressPa = (M_s_Pa * (t_s_m * t_s_m) * deltaCurvInv) / (6 * t_f_m);
  const totalStressMPa = totalStressPa / 1e6;

  // Thermal mismatch stress:
  // sigma_th = M_f * (alpha_s - alpha_f) * (T_room - T_dep)
  const alpha_s = inputs.thermalExpansionSubstratePpm * 1e-6;
  const alpha_f = inputs.thermalExpansionFilmPpm * 1e-6;
  const tMeas = inputs.tempMeasurementC ?? 25;
  const tDep = inputs.tempDepositionC;
  const deltaT = tMeas - tDep;

  const thermalStressPa = M_f_Pa * (alpha_s - alpha_f) * deltaT;
  const thermalStressMPa = thermalStressPa / 1e6;

  // Intrinsic stress:
  // sigma_intrinsic = sigma_total - sigma_thermal
  const intrinsicStressMPa = totalStressMPa - thermalStressMPa;

  // Stress classification
  let stressType: 'tensile' | 'compressive' | 'neutral' = 'neutral';
  if (totalStressMPa > 0.05) {
    stressType = 'tensile';
  } else if (totalStressMPa < -0.05) {
    stressType = 'compressive';
  }

  // Thickness ratio validation check:
  // Stoney relation assumes thin film t_f << t_s (typically t_f / t_s <= 0.01)
  const thicknessRatio = t_f_m / t_s_m;
  const isThicknessRatioValid = thicknessRatio <= 0.01;

  if (!isThicknessRatioValid) {
    warnings.push(
      `Film-to-substrate thickness ratio (${(thicknessRatio * 100).toFixed(2)}%) exceeds 1.0%. Stoney equation underestimates film stress for thick films.`
    );
  }

  // Critical cracking / delamination thickness threshold:
  // h_c = (Gamma * E_f) / (Z * sigma^2)
  const gamma = inputs.fractureToughness > 0 ? inputs.fractureToughness : 4.0;
  const Z = inputs.crackShapeFactorZ && inputs.crackShapeFactorZ > 0 ? inputs.crackShapeFactorZ : DEFAULT_CRACK_SHAPE_FACTOR_Z;

  let criticalThicknessNm = Number.POSITIVE_INFINITY;
  if (Math.abs(totalStressPa) > 1e3) {
    const hc_m = (gamma * E_f_Pa) / (Z * (totalStressPa * totalStressPa));
    criticalThicknessNm = hc_m * 1e9;
  }

  const exceedsCriticalThickness =
    Number.isFinite(criticalThicknessNm) && inputs.filmThicknessNm > criticalThicknessNm;

  if (exceedsCriticalThickness) {
    if (stressType === 'tensile') {
      warnings.push(
        `Film thickness (${inputs.filmThicknessNm} nm) exceeds critical cracking thickness h_c (${criticalThicknessNm.toFixed(0)} nm). High risk of film channel cracking / fracture.`
      );
    } else {
      warnings.push(
        `Film thickness (${inputs.filmThicknessNm} nm) exceeds critical threshold h_c (${criticalThicknessNm.toFixed(0)} nm). High risk of compressive film buckling, blistering, or interfacial delamination.`
      );
    }
  }

  // Wafer bow & lithography chuck limit warning:
  // Standard lithography electrostatic/vacuum chucks have difficulty chucking wafers with Bow > 150 µm
  if (warpPostUm > 150) {
    warnings.push(
      `Wafer bow / warp (${warpPostUm.toFixed(1)} µm) exceeds 150 µm. Risk of lithography chucking failure, focal plane degradation, or robot vacuum grip alarms.`
    );
  }

  // Substrate breakage risk warning (> 1000 MPa total stress)
  if (Math.abs(totalStressMPa) > 1000) {
    warnings.push(
      `Extremely high film stress (${Math.abs(totalStressMPa).toFixed(0)} MPa). Potential for substrate spontaneous cleavage, crystal dislocation slip, or mechanical breakage.`
    );
  }

  return {
    ok: true,
    radiusPreM: rPreM,
    radiusPostM: rPostM,
    curvaturePreM_inv: curPreInv,
    curvaturePostM_inv: curPostInv,
    curvatureDeltaM_inv: deltaCurvInv,
    bowPreUm,
    bowPostUm,
    bowDeltaUm,
    warpPostUm,
    totalStressMPa,
    thermalStressMPa,
    intrinsicStressMPa,
    stressType,
    substrateBiaxialModulusGPa: inputs.biaxialModulusGPa,
    filmBiaxialModulusGPa: M_f_GPa,
    thicknessRatio,
    isThicknessRatioValid,
    criticalThicknessNm,
    exceedsCriticalThickness,
    warnings,
  };
}
