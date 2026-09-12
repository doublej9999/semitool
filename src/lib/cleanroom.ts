/**
 * Pure mathematics and standard reference definitions for cleanrooms:
 * - ISO 14644-1 particulate concentration limits
 * - US FED-STD-209E historical comparison
 * - HVAC airflow design: ACH, room volume, total airflow rate, FFU count, and ceiling coverage
 */

/** Conversion constant: 1 cubic metre in cubic feet. */
export const FT3_PER_M3 = 35.31466672148859;

/** Standard particle sizes (in micrometres) evaluated by ISO 14644-1. */
export const STANDARD_PARTICLE_SIZES_UM = [0.1, 0.2, 0.3, 0.5, 1.0, 5.0] as const;

export type StandardParticleSizeUm = (typeof STANDARD_PARTICLE_SIZES_UM)[number];

export type IsoClassNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type DimensionUnit = 'm' | 'ft';

export type FfuSize = '2x4' | '4x4';

export interface FfuSpec {
  id: FfuSize;
  label: string;
  widthM: number;
  lengthM: number;
  widthFt: number;
  lengthFt: number;
  areaM2: number;
  areaFt2: number;
  nominalAirflowCfm: number;
  nominalAirflowM3h: number;
}

export const FFU_CONFIGS: Record<FfuSize, FfuSpec> = {
  '2x4': {
    id: '2x4',
    label: '2 × 4 ft (approx 600 × 1200 mm)',
    widthM: 0.6,
    lengthM: 1.2,
    widthFt: 2.0,
    lengthFt: 4.0,
    areaM2: 0.72,
    areaFt2: 8.0,
    nominalAirflowCfm: 700,
    nominalAirflowM3h: 700 * (60 / FT3_PER_M3), // ~1189.3 m^3/h
  },
  '4x4': {
    id: '4x4',
    label: '4 × 4 ft (approx 1200 × 1200 mm)',
    widthM: 1.2,
    lengthM: 1.2,
    widthFt: 4.0,
    lengthFt: 4.0,
    areaM2: 1.44,
    areaFt2: 16.0,
    nominalAirflowCfm: 1400,
    nominalAirflowM3h: 1400 * (60 / FT3_PER_M3), // ~2378.6 m^3/h
  },
};

export interface IsoClassInfo {
  isoClass: IsoClassNumber;
  fedStd209e: string | null;
  fedClassNumber: number | null; // e.g. 100 for Class 100
  flowRegime: 'Unidirectional (Laminar)' | 'Mixed / Laminar' | 'Non-unidirectional (Turbulent)';
  filterType: 'ULPA (U15-U17)' | 'HEPA / ULPA' | 'HEPA (H13-H14)';
  achMin: number;
  achMax: number;
  achDefault: number;
  coverageMinPercent: number;
  coverageMaxPercent: number;
  typicalCoveragePercent: number;
  description: string;
}

export const ISO_CLASSES_INFO: Record<IsoClassNumber, IsoClassInfo> = {
  1: {
    isoClass: 1,
    fedStd209e: null,
    fedClassNumber: null,
    flowRegime: 'Unidirectional (Laminar)',
    filterType: 'ULPA (U15-U17)',
    achMin: 600,
    achMax: 750,
    achDefault: 675,
    coverageMinPercent: 100,
    coverageMaxPercent: 100,
    typicalCoveragePercent: 100,
    description: 'Sub-nanometre advanced R&D, extreme EUV lithography core, 100% ULPA ceiling coverage.',
  },
  2: {
    isoClass: 2,
    fedStd209e: null,
    fedClassNumber: null,
    flowRegime: 'Unidirectional (Laminar)',
    filterType: 'ULPA (U15-U17)',
    achMin: 600,
    achMax: 750,
    achDefault: 675,
    coverageMinPercent: 100,
    coverageMaxPercent: 100,
    typicalCoveragePercent: 100,
    description: 'Cutting-edge semiconductor fabrication, reticle handling and advanced wafer pods.',
  },
  3: {
    isoClass: 3,
    fedStd209e: 'Class 1',
    fedClassNumber: 1,
    flowRegime: 'Unidirectional (Laminar)',
    filterType: 'ULPA (U15-U17)',
    achMin: 360,
    achMax: 540,
    achDefault: 450,
    coverageMinPercent: 80,
    coverageMaxPercent: 100,
    typicalCoveragePercent: 90,
    description: 'Equivalent to US FED-STD-209E Class 1. State-of-the-art 300mm wafer front-end bays.',
  },
  4: {
    isoClass: 4,
    fedStd209e: 'Class 10',
    fedClassNumber: 10,
    flowRegime: 'Unidirectional (Laminar)',
    filterType: 'HEPA / ULPA',
    achMin: 300,
    achMax: 450,
    achDefault: 375,
    coverageMinPercent: 70,
    coverageMaxPercent: 90,
    typicalCoveragePercent: 80,
    description: 'Equivalent to US FED-STD-209E Class 10. Photolithography tracks, wafer stepper areas.',
  },
  5: {
    isoClass: 5,
    fedStd209e: 'Class 100',
    fedClassNumber: 100,
    flowRegime: 'Unidirectional (Laminar)',
    filterType: 'HEPA (H13-H14)',
    achMin: 240,
    achMax: 360,
    achDefault: 300,
    coverageMinPercent: 60,
    coverageMaxPercent: 70,
    typicalCoveragePercent: 65,
    description: 'Equivalent to US FED-STD-209E Class 100. Standard semiconductor wafer processing bays.',
  },
  6: {
    isoClass: 6,
    fedStd209e: 'Class 1,000',
    fedClassNumber: 1000,
    flowRegime: 'Mixed / Laminar',
    filterType: 'HEPA (H13-H14)',
    achMin: 150,
    achMax: 240,
    achDefault: 195,
    coverageMinPercent: 25,
    coverageMaxPercent: 40,
    typicalCoveragePercent: 30,
    description: 'Equivalent to US FED-STD-209E Class 1,000. Micro-assembly, wafer chase corridors, test areas.',
  },
  7: {
    isoClass: 7,
    fedStd209e: 'Class 10,000',
    fedClassNumber: 10000,
    flowRegime: 'Non-unidirectional (Turbulent)',
    filterType: 'HEPA (H13-H14)',
    achMin: 60,
    achMax: 90,
    achDefault: 75,
    coverageMinPercent: 15,
    coverageMaxPercent: 25,
    typicalCoveragePercent: 20,
    description: 'Equivalent to US FED-STD-209E Class 10,000. Semiconductor packaging, backend assembly, support.',
  },
  8: {
    isoClass: 8,
    fedStd209e: 'Class 100,000',
    fedClassNumber: 100000,
    flowRegime: 'Non-unidirectional (Turbulent)',
    filterType: 'HEPA (H13-H14)',
    achMin: 20,
    achMax: 40,
    achDefault: 30,
    coverageMinPercent: 4,
    coverageMaxPercent: 10,
    typicalCoveragePercent: 7,
    description: 'Equivalent to US FED-STD-209E Class 100,000. Gowning rooms, materials airlocks, support corridors.',
  },
  9: {
    isoClass: 9,
    fedStd209e: 'Room Air',
    fedClassNumber: null,
    flowRegime: 'Non-unidirectional (Turbulent)',
    filterType: 'HEPA (H13-H14)',
    achMin: 10,
    achMax: 20,
    achDefault: 15,
    coverageMinPercent: 2,
    coverageMaxPercent: 5,
    typicalCoveragePercent: 3,
    description: 'Standard ambient / air-conditioned room air baseline (filtered baseline).',
  },
};

/**
 * Calculate raw maximum particle concentration Cn according to ISO 14644-1:
 * Cn = 10^N * (0.1 / D)^2.08 [particles/m³]
 *
 * @param isoClass N (1 to 9)
 * @param diameterUm D in micrometres (µm)
 */
export function calculateIsoRawLimit(isoClass: number, diameterUm: number): number {
  if (isoClass < 1 || isoClass > 9 || !Number.isFinite(isoClass)) {
    throw new RangeError(`ISO class must be between 1 and 9 (received ${isoClass})`);
  }
  if (diameterUm <= 0 || !Number.isFinite(diameterUm)) {
    throw new RangeError(`Particle diameter must be greater than 0 (received ${diameterUm})`);
  }
  return Math.pow(10, isoClass) * Math.pow(0.1 / diameterUm, 2.08);
}

/**
 * ISO 14644-1 standard rounding rule:
 * Concentration is rounded to the nearest whole number using no more than three significant digits.
 * For example:
 * - 3516.75... -> 3520
 * - 23.65... -> 24
 * - 1000 -> 1000
 * If the raw value is below 1 (or beyond applicability thresholds in Table 1),
 * the standard marks certain thresholds as not specified or negligible.
 */
export function roundIsoStandardLimit(rawLimit: number): number {
  if (rawLimit < 0.5) {
    return 0;
  }
  if (rawLimit < 10) {
    return Math.round(rawLimit);
  }
  // 3 significant figures rounded
  const formatted = Number(rawLimit.toPrecision(3));
  return Math.round(formatted);
}

export interface ParticleLimitRow {
  diameterUm: number;
  /** Raw theoretical formula limit in particles/m³. */
  rawPerM3: number;
  /** Standard rounded limit in particles/m³ (ISO 14644-1 Table 1 standard value). */
  standardPerM3: number;
  /** Limit in particles/ft³ (standardPerM3 / 35.3147). */
  standardPerFt3: number;
  /** Whether this particle size is officially defined in ISO 14644-1 Table 1 for this class. */
  isStandardApplicable: boolean;
}

/**
 * Official applicability check based on ISO 14644-1:1999 Table 1.
 * Classes 1-2 have no defined limit at >=1.0 µm or >=5.0 µm.
 * Classes 7-9 have no defined limit at <=0.3 µm due to measurement limitations.
 */
export function isSizeApplicableToIso(isoClass: IsoClassNumber, diameterUm: number): boolean {
  if (isoClass === 1 && diameterUm > 0.2) return false;
  if (isoClass === 2 && diameterUm > 0.5) return false;
  if (isoClass === 3 && diameterUm > 1.0) return false;
  if (isoClass === 4 && diameterUm > 1.0) return false;
  if (isoClass >= 7 && diameterUm < 0.5) return false;
  return true;
}

/**
 * Generates the full particle concentration limit table for an ISO class
 * across standard sizes [0.1, 0.2, 0.3, 0.5, 1.0, 5.0 µm].
 */
export function getParticleLimitsForIso(isoClass: IsoClassNumber): ParticleLimitRow[] {
  return STANDARD_PARTICLE_SIZES_UM.map((diameterUm) => {
    const rawPerM3 = calculateIsoRawLimit(isoClass, diameterUm);
    const standardPerM3 = roundIsoStandardLimit(rawPerM3);
    const standardPerFt3 = standardPerM3 / FT3_PER_M3;
    const isStandardApplicable = isSizeApplicableToIso(isoClass, diameterUm);

    return {
      diameterUm,
      rawPerM3,
      standardPerM3,
      standardPerFt3,
      isStandardApplicable,
    };
  });
}

/**
 * Volume conversions.
 */
export function m3ToFt3(m3: number): number {
  return m3 * FT3_PER_M3;
}

export function ft3ToM3(ft3: number): number {
  return ft3 / FT3_PER_M3;
}

/**
 * Airflow conversions:
 * 1 CFM = 1 ft³/min = 60 ft³/h = 60 / 35.3146667 m³/h ≈ 1.69901 m³/h
 */
export function cfmToM3h(cfm: number): number {
  return (cfm * 60) / FT3_PER_M3;
}

export function m3hToCfm(m3h: number): number {
  return (m3h * FT3_PER_M3) / 60;
}

export interface RoomAirflowInputs {
  isoClass: IsoClassNumber;
  length: number;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;
  ach?: number;
  ffuSize?: FfuSize;
}

export interface CleanroomAirflowResult {
  isoClass: IsoClassNumber;
  classInfo: IsoClassInfo;
  fedEquivalent: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  floorAreaM2: number;
  floorAreaFt2: number;
  roomVolumeM3: number;
  roomVolumeFt3: number;
  ach: number;
  totalAirflowM3h: number;
  totalAirflowCfm: number;
  particleLimits: ParticleLimitRow[];
  recommendedCoveragePercent: {
    min: number;
    max: number;
    typical: number;
  };
  ffuSpec: FfuSpec;
  /** Estimated number of FFUs required based on required airflow rate. */
  ffuCountByAirflow: number;
  /** Estimated number of FFUs required based on typical recommended ceiling coverage. */
  ffuCountByCoverage: number;
  /** Recommended design FFU count (max of airflow requirement and coverage requirement). */
  recommendedFfuCount: number;
  /** Actual ceiling coverage percentage with recommended FFU count. */
  actualCeilingCoveragePercent: number;
}

/**
 * Calculates complete cleanroom HVAC airflow, volume, FFU quantity and particle limits.
 */
export function calculateCleanroomAirflow(inputs: RoomAirflowInputs): CleanroomAirflowResult {
  const {
    isoClass,
    length,
    width,
    height,
    dimensionUnit,
    ffuSize = '2x4',
  } = inputs;

  const classInfo = ISO_CLASSES_INFO[isoClass];
  if (!classInfo) {
    throw new Error(`Unknown ISO Class: ${isoClass}`);
  }

  const ach = inputs.ach !== undefined && inputs.ach > 0 ? inputs.ach : classInfo.achDefault;

  let lengthM: number;
  let widthM: number;
  let heightM: number;
  let lengthFt: number;
  let widthFt: number;
  let heightFt: number;

  if (dimensionUnit === 'm') {
    lengthM = length;
    widthM = width;
    heightM = height;
    lengthFt = length * 3.280839895013123;
    widthFt = width * 3.280839895013123;
    heightFt = height * 3.280839895013123;
  } else {
    lengthFt = length;
    widthFt = width;
    heightFt = height;
    lengthM = length / 3.280839895013123;
    widthM = width / 3.280839895013123;
    heightM = height / 3.280839895013123;
  }

  const floorAreaM2 = lengthM * widthM;
  const floorAreaFt2 = lengthFt * widthFt;

  const roomVolumeM3 = floorAreaM2 * heightM;
  const roomVolumeFt3 = m3ToFt3(roomVolumeM3);

  // Total airflow rate: Q = Volume * ACH
  const totalAirflowM3h = roomVolumeM3 * ach;
  const totalAirflowCfm = m3hToCfm(totalAirflowM3h);

  const particleLimits = getParticleLimitsForIso(isoClass);
  const ffuSpec = FFU_CONFIGS[ffuSize];

  // FFU count based on airflow capacity
  const ffuCountByAirflow = Math.ceil(totalAirflowCfm / ffuSpec.nominalAirflowCfm);

  // FFU count based on ceiling coverage percentage
  const ceilingAreaM2 = floorAreaM2;
  const requiredFilterAreaM2 = ceilingAreaM2 * (classInfo.typicalCoveragePercent / 100);
  const ffuCountByCoverage = Math.ceil(requiredFilterAreaM2 / ffuSpec.areaM2);

  // In laminar flow cleanrooms (ISO 1 - ISO 5), ceiling coverage is often the controlling factor
  const recommendedFfuCount = Math.max(ffuCountByAirflow, ffuCountByCoverage, 1);

  const totalFilterAreaM2 = recommendedFfuCount * ffuSpec.areaM2;
  const actualCeilingCoveragePercent = Math.min(100, (totalFilterAreaM2 / ceilingAreaM2) * 100);

  const fedEquivalent = classInfo.fedStd209e
    ? `${classInfo.fedStd209e}`
    : 'No Direct FED Equivalent';

  return {
    isoClass,
    classInfo,
    fedEquivalent,
    lengthM,
    widthM,
    heightM,
    lengthFt,
    widthFt,
    heightFt,
    floorAreaM2,
    floorAreaFt2,
    roomVolumeM3,
    roomVolumeFt3,
    ach,
    totalAirflowM3h,
    totalAirflowCfm,
    particleLimits,
    recommendedCoveragePercent: {
      min: classInfo.coverageMinPercent,
      max: classInfo.coverageMaxPercent,
      typical: classInfo.typicalCoveragePercent,
    },
    ffuSpec,
    ffuCountByAirflow,
    ffuCountByCoverage,
    recommendedFfuCount,
    actualCeilingCoveragePercent,
  };
}
