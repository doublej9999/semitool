/**
 * Ion Implantation & Doping Profile Models in Silicon.
 *
 * Implements standard projected range Rp (nm) and straggle deltaRp (nm) models
 * based on Lindhard-Scharff-Schiott (LSS) theory and Gibbons, Johnson & Mylroie
 * projected range statistics for B, P, As, and BF2 in Silicon.
 *
 * Computes Gaussian doping profiles N(x), peak concentration Np, metallurgical
 * junction depth xj where N(xj) = Nb, surface concentration N(0), and dose
 * retention fraction in silicon.
 */

import { erfc } from './capability';

/** Elementary conversions */
export const CM_PER_NM = 1e-7;
export const UM_PER_NM = 1e-3;
export const NM_PER_UM = 1000;

/** Error function erf(x) = 1 - erfc(x) */
export function erf(x: number): number {
  return 1 - erfc(x);
}

export type IonSpecies = 'B' | 'P' | 'As' | 'BF2' | 'Custom';

export interface IonSpeciesInfo {
  id: IonSpecies;
  name: string;
  symbol: string;
  atomicMassAmu: number;
  dopantType: 'p-type' | 'n-type' | 'custom';
  solidSolubilityCm3: number;
  description: string;
}

export const SPECIES_CATALOG: Record<IonSpecies, IonSpeciesInfo> = {
  B: {
    id: 'B',
    name: 'Boron (¹¹B)',
    symbol: 'B',
    atomicMassAmu: 11,
    dopantType: 'p-type',
    solidSolubilityCm3: 3.0e20,
    description: 'Standard shallow-to-deep p-type dopant in silicon.',
  },
  P: {
    id: 'P',
    name: 'Phosphorus (³¹P)',
    symbol: 'P',
    atomicMassAmu: 31,
    dopantType: 'n-type',
    solidSolubilityCm3: 1.0e21,
    description: 'Moderate mass n-type dopant for wells and source/drain extensions.',
  },
  As: {
    id: 'As',
    name: 'Arsenic (⁷⁵As)',
    symbol: 'As',
    atomicMassAmu: 75,
    dopantType: 'n-type',
    solidSolubilityCm3: 1.8e21,
    description: 'Heavy n-type dopant with low straggle for ultra-shallow junctions.',
  },
  BF2: {
    id: 'BF2',
    name: 'Boron Difluoride (⁴⁹BF₂)',
    symbol: 'BF2',
    atomicMassAmu: 49,
    dopantType: 'p-type',
    solidSolubilityCm3: 3.0e20,
    description: 'Molecular ion for ultra-shallow p-type junctions (effective Boron energy ~ 11/49 E).',
  },
  Custom: {
    id: 'Custom',
    name: 'Custom Dopant',
    symbol: 'Custom',
    atomicMassAmu: 0,
    dopantType: 'custom',
    solidSolubilityCm3: 1.0e21,
    description: 'User-specified projected range Rp and straggle deltaRp.',
  },
};

/** Critical ion implant dose threshold for continuous silicon amorphization at 300 K (cm⁻²) */
export const CRITICAL_AMORPHIZATION_DOSES: Record<Exclude<IonSpecies, 'Custom'>, number> = {
  B: 1.0e16,
  P: 1.0e15,
  As: 2.0e14,
  BF2: 4.0e14,
};

/**
 * Standard Gibbons, Johnson & Mylroie range statistics in Silicon
 * Tabulated [Energy (keV), Projected Range Rp (nm), Straggle deltaRp (nm)].
 */
interface TableEntry {
  energyKeV: number;
  rpNm: number;
  deltaRpNm: number;
}

export const GIBBONS_TABLE_SILICON: Record<Exclude<IonSpecies, 'Custom'>, TableEntry[]> = {
  B: [
    { energyKeV: 1, rpNm: 4.5, deltaRpNm: 2.8 },
    { energyKeV: 5, rpNm: 17.6, deltaRpNm: 9.8 },
    { energyKeV: 10, rpNm: 33.3, deltaRpNm: 17.1 },
    { energyKeV: 20, rpNm: 66.8, deltaRpNm: 29.2 },
    { energyKeV: 30, rpNm: 101.9, deltaRpNm: 39.5 },
    { energyKeV: 40, rpNm: 138.1, deltaRpNm: 48.4 },
    { energyKeV: 50, rpNm: 175.2, deltaRpNm: 56.2 },
    { energyKeV: 60, rpNm: 212.8, deltaRpNm: 63.1 },
    { energyKeV: 70, rpNm: 250.7, deltaRpNm: 69.3 },
    { energyKeV: 80, rpNm: 288.7, deltaRpNm: 74.8 },
    { energyKeV: 90, rpNm: 326.7, deltaRpNm: 79.8 },
    { energyKeV: 100, rpNm: 364.5, deltaRpNm: 84.3 },
    { energyKeV: 120, rpNm: 439.1, deltaRpNm: 92.1 },
    { energyKeV: 140, rpNm: 512.2, deltaRpNm: 98.4 },
    { energyKeV: 160, rpNm: 583.5, deltaRpNm: 103.5 },
    { energyKeV: 180, rpNm: 652.7, deltaRpNm: 107.6 },
    { energyKeV: 200, rpNm: 719.7, deltaRpNm: 111.0 },
    { energyKeV: 250, rpNm: 878.0, deltaRpNm: 116.8 },
    { energyKeV: 300, rpNm: 1022.9, deltaRpNm: 119.8 },
  ],
  P: [
    { energyKeV: 1, rpNm: 2.4, deltaRpNm: 1.4 },
    { energyKeV: 5, rpNm: 7.7, deltaRpNm: 4.2 },
    { energyKeV: 10, rpNm: 13.9, deltaRpNm: 7.2 },
    { energyKeV: 20, rpNm: 25.3, deltaRpNm: 12.5 },
    { energyKeV: 30, rpNm: 36.8, deltaRpNm: 17.3 },
    { energyKeV: 40, rpNm: 48.6, deltaRpNm: 21.8 },
    { energyKeV: 50, rpNm: 60.7, deltaRpNm: 26.2 },
    { energyKeV: 60, rpNm: 73.0, deltaRpNm: 30.4 },
    { energyKeV: 70, rpNm: 85.5, deltaRpNm: 34.4 },
    { energyKeV: 80, rpNm: 98.1, deltaRpNm: 38.3 },
    { energyKeV: 90, rpNm: 110.9, deltaRpNm: 42.0 },
    { energyKeV: 100, rpNm: 123.8, deltaRpNm: 45.6 },
    { energyKeV: 120, rpNm: 150.1, deltaRpNm: 52.4 },
    { energyKeV: 140, rpNm: 176.7, deltaRpNm: 58.7 },
    { energyKeV: 160, rpNm: 203.7, deltaRpNm: 64.7 },
    { energyKeV: 180, rpNm: 230.9, deltaRpNm: 70.3 },
    { energyKeV: 200, rpNm: 258.2, deltaRpNm: 75.6 },
    { energyKeV: 250, rpNm: 326.8, deltaRpNm: 87.7 },
    { energyKeV: 300, rpNm: 395.4, deltaRpNm: 98.4 },
  ],
  As: [
    { energyKeV: 1, rpNm: 1.9, deltaRpNm: 0.9 },
    { energyKeV: 5, rpNm: 4.9, deltaRpNm: 2.1 },
    { energyKeV: 10, rpNm: 8.1, deltaRpNm: 3.4 },
    { energyKeV: 20, rpNm: 14.4, deltaRpNm: 5.7 },
    { energyKeV: 30, rpNm: 20.6, deltaRpNm: 7.8 },
    { energyKeV: 40, rpNm: 26.9, deltaRpNm: 9.9 },
    { energyKeV: 50, rpNm: 33.2, deltaRpNm: 11.9 },
    { energyKeV: 60, rpNm: 39.7, deltaRpNm: 13.9 },
    { energyKeV: 70, rpNm: 46.3, deltaRpNm: 15.9 },
    { energyKeV: 80, rpNm: 53.0, deltaRpNm: 17.9 },
    { energyKeV: 90, rpNm: 59.9, deltaRpNm: 19.9 },
    { energyKeV: 100, rpNm: 66.8, deltaRpNm: 21.9 },
    { energyKeV: 120, rpNm: 81.0, deltaRpNm: 25.8 },
    { energyKeV: 140, rpNm: 95.5, deltaRpNm: 29.8 },
    { energyKeV: 160, rpNm: 110.5, deltaRpNm: 33.7 },
    { energyKeV: 180, rpNm: 125.7, deltaRpNm: 37.6 },
    { energyKeV: 200, rpNm: 141.2, deltaRpNm: 41.5 },
    { energyKeV: 250, rpNm: 181.1, deltaRpNm: 51.1 },
    { energyKeV: 300, rpNm: 222.4, deltaRpNm: 60.5 },
  ],
  BF2: [
    { energyKeV: 1, rpNm: 1.6, deltaRpNm: 1.0 },
    { energyKeV: 5, rpNm: 4.8, deltaRpNm: 2.9 },
    { energyKeV: 10, rpNm: 8.8, deltaRpNm: 5.1 },
    { energyKeV: 20, rpNm: 16.0, deltaRpNm: 9.0 },
    { energyKeV: 30, rpNm: 23.3, deltaRpNm: 12.6 },
    { energyKeV: 40, rpNm: 30.4, deltaRpNm: 15.8 },
    { energyKeV: 50, rpNm: 37.4, deltaRpNm: 18.6 },
    { energyKeV: 60, rpNm: 44.5, deltaRpNm: 21.3 },
    { energyKeV: 70, rpNm: 51.9, deltaRpNm: 24.0 },
    { energyKeV: 80, rpNm: 59.5, deltaRpNm: 26.6 },
    { energyKeV: 90, rpNm: 67.3, deltaRpNm: 29.2 },
    { energyKeV: 100, rpNm: 75.3, deltaRpNm: 31.9 },
    { energyKeV: 120, rpNm: 91.4, deltaRpNm: 36.8 },
    { energyKeV: 140, rpNm: 107.5, deltaRpNm: 41.2 },
    { energyKeV: 160, rpNm: 123.6, deltaRpNm: 45.1 },
    { energyKeV: 180, rpNm: 139.8, deltaRpNm: 48.7 },
    { energyKeV: 200, rpNm: 156.1, deltaRpNm: 52.3 },
    { energyKeV: 250, rpNm: 197.8, deltaRpNm: 60.3 },
    { energyKeV: 300, rpNm: 240.7, deltaRpNm: 67.6 },
  ],
};

/**
 * Log-log interpolation helper: y = y0 * (x / x0)^(ln(y1/y0) / ln(x1/x0))
 */
function logLogInterpolate(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x === x0) return y0;
  if (x === x1) return y1;
  if (x0 <= 0 || x1 <= 0 || y0 <= 0 || y1 <= 0 || x <= 0) {
    // fallback to linear
    return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  const logX = Math.log(x);
  const logX0 = Math.log(x0);
  const logX1 = Math.log(x1);
  const t = (logX - logX0) / (logX1 - logX0);
  return Math.exp(Math.log(y0) + t * (Math.log(y1) - Math.log(y0)));
}

/**
 * Interpolates projected range Rp and straggle deltaRp from the standard Gibbons dataset.
 */
export function interpolateRangeAndStraggle(
  species: IonSpecies,
  energyKeV: number,
): { rpNm: number; deltaRpNm: number; isExtrapolated: boolean } {
  if (species === 'Custom') {
    return { rpNm: 0, deltaRpNm: 0, isExtrapolated: false };
  }

  const table = GIBBONS_TABLE_SILICON[species];
  if (!table || table.length === 0) {
    return { rpNm: 0, deltaRpNm: 0, isExtrapolated: false };
  }

  if (energyKeV <= table[0].energyKeV) {
    const isExtrapolated = energyKeV < table[0].energyKeV;
    const rpNm = logLogInterpolate(
      energyKeV,
      table[0].energyKeV,
      table[1].energyKeV,
      table[0].rpNm,
      table[1].rpNm,
    );
    const deltaRpNm = logLogInterpolate(
      energyKeV,
      table[0].energyKeV,
      table[1].energyKeV,
      table[0].deltaRpNm,
      table[1].deltaRpNm,
    );
    return { rpNm, deltaRpNm, isExtrapolated };
  }

  const last = table.length - 1;
  if (energyKeV >= table[last].energyKeV) {
    const isExtrapolated = energyKeV > table[last].energyKeV;
    const rpNm = logLogInterpolate(
      energyKeV,
      table[last - 1].energyKeV,
      table[last].energyKeV,
      table[last - 1].rpNm,
      table[last].rpNm,
    );
    const deltaRpNm = logLogInterpolate(
      energyKeV,
      table[last - 1].energyKeV,
      table[last].energyKeV,
      table[last - 1].deltaRpNm,
      table[last].deltaRpNm,
    );
    return { rpNm, deltaRpNm, isExtrapolated };
  }

  // Find bracket [i, i+1]
  for (let i = 0; i < table.length - 1; i += 1) {
    if (energyKeV >= table[i].energyKeV && energyKeV <= table[i + 1].energyKeV) {
      const rpNm = logLogInterpolate(
        energyKeV,
        table[i].energyKeV,
        table[i + 1].energyKeV,
        table[i].rpNm,
        table[i + 1].rpNm,
      );
      const deltaRpNm = logLogInterpolate(
        energyKeV,
        table[i].energyKeV,
        table[i + 1].energyKeV,
        table[i].deltaRpNm,
        table[i + 1].deltaRpNm,
      );
      return { rpNm, deltaRpNm, isExtrapolated: false };
    }
  }

  return { rpNm: table[last].rpNm, deltaRpNm: table[last].deltaRpNm, isExtrapolated: false };
}

/**
 * Flexible scientific number parser for user inputs like "1e14", "1E15", "10^15", "2.5*10^15".
 */
export function parseScientificNumber(val: string): number {
  const clean = val.trim().replace(/,/g, '');
  if (!clean) return Number.NaN;

  // Handle pure 10^14 or 10**14
  const purePowMatch = clean.match(/^10(?:\^|\*\*)([+-]?\d+)$/i);
  if (purePowMatch) {
    return Math.pow(10, Number(purePowMatch[1]));
  }

  // Handle a*10^b or a x 10^b or a·10^b
  const multMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:[*x×·]|10\^|\s)\s*10(?:\^|\*\*)([+-]?\d+)$/i);
  if (multMatch) {
    return Number(multMatch[1]) * Math.pow(10, Number(multMatch[2]));
  }

  return Number(clean);
}

export interface IonImplantationInput {
  species: IonSpecies;
  energyKeV: number;
  doseCm2: number;
  backgroundDopingCm3: number;
  customRpNm?: number | null;
  customDeltaRpNm?: number | null;
}

export interface IonImplantationSuccess {
  ok: true;
  species: IonSpecies;
  speciesName: string;
  energyKeV: number;
  doseCm2: number;
  backgroundDopingCm3: number;
  rpNm: number;
  rpUm: number;
  deltaRpNm: number;
  deltaRpUm: number;
  peakConcentrationCm3: number;
  surfaceConcentrationCm3: number;
  junctionDepthNm: number | null;
  junctionDepthUm: number | null;
  retentionFraction: number;
  retentionPercent: number;
  solidSolubilityLimitCm3: number;
  criticalAmorphizationDoseCm2: number | null;
  isAmorphized: boolean;
  warnings: string[];
}

export type IonImplantationResult =
  | { ok: false; errors: string[] }
  | IonImplantationSuccess;

/**
 * Calculates ion implantation Gaussian profile parameters, peak concentration,
 * metallurgical junction depth, surface concentration, and retention fraction.
 */
export function calculateIonImplantation(input: IonImplantationInput): IonImplantationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const {
    species,
    energyKeV,
    doseCm2,
    backgroundDopingCm3,
    customRpNm,
    customDeltaRpNm,
  } = input;

  // Validation
  if (!Number.isFinite(doseCm2) || doseCm2 <= 0) {
    errors.push('Implant dose must be a positive number (ions/cm²).');
  }

  if (!Number.isFinite(backgroundDopingCm3) || backgroundDopingCm3 <= 0) {
    errors.push('Background wafer doping concentration must be a positive number (atoms/cm³).');
  }

  let finalRpNm = 0;
  let finalDeltaRpNm = 0;

  if (species === 'Custom') {
    if (customRpNm == null || !Number.isFinite(customRpNm) || customRpNm < 0) {
      errors.push('Custom projected range Rp must be a non-negative number in nanometres.');
    } else {
      finalRpNm = customRpNm;
    }

    if (customDeltaRpNm == null || !Number.isFinite(customDeltaRpNm) || customDeltaRpNm <= 0) {
      errors.push('Custom straggle deltaRp must be a positive number in nanometres.');
    } else {
      finalDeltaRpNm = customDeltaRpNm;
    }

    if (!Number.isFinite(energyKeV) || energyKeV <= 0) {
      errors.push('Implant energy must be a positive number (keV).');
    }
  } else {
    if (!Number.isFinite(energyKeV) || energyKeV <= 0) {
      errors.push('Implant energy must be a positive number (keV).');
    } else {
      const interpolated = interpolateRangeAndStraggle(species, energyKeV);
      finalRpNm = interpolated.rpNm;
      finalDeltaRpNm = interpolated.deltaRpNm;

      if (interpolated.isExtrapolated || energyKeV < 1 || energyKeV > 300) {
        warnings.push(
          `Implant energy ${energyKeV} keV is outside the standard Gibbons calibrated range (1 to 300 keV). Values are extrapolated.`,
        );
      }
    }

    // Optional user overrides for preset species
    if (customRpNm != null && Number.isFinite(customRpNm)) {
      if (customRpNm < 0) {
        errors.push('Projected range Rp cannot be negative.');
      } else {
        finalRpNm = customRpNm;
      }
    }

    if (customDeltaRpNm != null && Number.isFinite(customDeltaRpNm)) {
      if (customDeltaRpNm <= 0) {
        errors.push('Straggle deltaRp must be a positive number in nanometres.');
      } else {
        finalDeltaRpNm = customDeltaRpNm;
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // DeltaRp in cm
  const deltaRpCm = finalDeltaRpNm * CM_PER_NM;

  // Peak concentration Np = Dose / (sqrt(2 * pi) * deltaRp_cm)
  const sqrtTwoPi = Math.sqrt(2 * Math.PI);
  const peakConcentrationCm3 = doseCm2 / (sqrtTwoPi * deltaRpCm);

  // Surface concentration N(0) = Np * exp(- Rp^2 / (2 * deltaRp^2))
  const surfaceRatio = finalRpNm / finalDeltaRpNm;
  const surfaceConcentrationCm3 = peakConcentrationCm3 * Math.exp(-0.5 * surfaceRatio * surfaceRatio);

  // Junction depth xj: where N(xj) = Nb => xj = Rp + deltaRp * sqrt(2 * ln(Np / Nb))
  let junctionDepthNm: number | null = null;
  let junctionDepthUm: number | null = null;

  if (peakConcentrationCm3 > backgroundDopingCm3) {
    const logRatio = Math.log(peakConcentrationCm3 / backgroundDopingCm3);
    const depthOffsetNm = finalDeltaRpNm * Math.sqrt(2 * logRatio);
    junctionDepthNm = finalRpNm + depthOffsetNm;
    junctionDepthUm = junctionDepthNm * UM_PER_NM;
  } else {
    warnings.push(
      `Peak concentration (${peakConcentrationCm3.toExponential(3)} cm⁻³) does not exceed substrate background doping (${backgroundDopingCm3.toExponential(3)} cm⁻³); no metallurgical junction is formed.`,
    );
  }

  // Dose retention fraction in silicon: 0.5 * (1 + erf(Rp / (sqrt(2) * deltaRp)))
  const erfArg = finalRpNm / (Math.SQRT2 * finalDeltaRpNm);
  const retentionFraction = Math.min(1, Math.max(0, 0.5 * (1 + erf(erfArg))));
  const retentionPercent = retentionFraction * 100;

  // Solid solubility check
  const speciesMeta = SPECIES_CATALOG[species];
  const solidSolubilityLimitCm3 = speciesMeta.solidSolubilityCm3;

  if (peakConcentrationCm3 > solidSolubilityLimitCm3) {
    warnings.push(
      `Peak concentration (${peakConcentrationCm3.toExponential(3)} cm⁻³) exceeds the typical solid solubility limit in silicon (~${solidSolubilityLimitCm3.toExponential(1)} cm⁻³). Extended defect formation and incomplete electrical activation may occur during thermal annealing.`,
    );
  }

  const criticalAmorphizationDoseCm2 =
    species !== 'Custom' ? CRITICAL_AMORPHIZATION_DOSES[species] : null;
  const isAmorphized =
    criticalAmorphizationDoseCm2 !== null && doseCm2 >= criticalAmorphizationDoseCm2;

  if (isAmorphized && criticalAmorphizationDoseCm2 !== null) {
    warnings.push(
      `Dose exceeds amorphization threshold (Φcrit ~ ${criticalAmorphizationDoseCm2.toExponential(1)} cm⁻²). A continuous amorphous layer is created in silicon. Full crystal recovery requires solid-phase epitaxial regrowth (SPER, 550–650 °C); end-of-range (EOR) dislocation loops should be annealed.`
    );
  }

  return {
    ok: true,
    species,
    speciesName: speciesMeta.name,
    energyKeV,
    doseCm2,
    backgroundDopingCm3,
    rpNm: finalRpNm,
    rpUm: finalRpNm * UM_PER_NM,
    deltaRpNm: finalDeltaRpNm,
    deltaRpUm: finalDeltaRpNm * UM_PER_NM,
    peakConcentrationCm3,
    surfaceConcentrationCm3,
    junctionDepthNm,
    junctionDepthUm,
    retentionFraction,
    retentionPercent,
    solidSolubilityLimitCm3,
    criticalAmorphizationDoseCm2,
    isAmorphized,
    warnings,
  };
}

/**
 * Calculates concentration N(x) at depth x (nm) from the Gaussian distribution parameters.
 */
export function calculateProfileConcentration(
  depthNm: number,
  peakConcentrationCm3: number,
  rpNm: number,
  deltaRpNm: number,
): number {
  if (deltaRpNm <= 0 || depthNm < 0) return 0;
  const dev = (depthNm - rpNm) / deltaRpNm;
  return peakConcentrationCm3 * Math.exp(-0.5 * dev * dev);
}

export interface ProfilePoint {
  depthNm: number;
  depthUm: number;
  concentrationCm3: number;
  logConcentration: number;
}

/**
 * Generates an array of depth profile points for charting.
 */
export function generateDepthProfile(
  result: IonImplantationSuccess,
  numPoints = 150,
  maxDepthNm?: number,
): ProfilePoint[] {
  const { rpNm, deltaRpNm, peakConcentrationCm3, junctionDepthNm } = result;

  const defaultMax = Math.max(
    junctionDepthNm ? junctionDepthNm * 1.35 : rpNm + 4.5 * deltaRpNm,
    rpNm * 2.5,
    50,
  );
  const endDepthNm = maxDepthNm && maxDepthNm > 0 ? maxDepthNm : defaultMax;
  const step = endDepthNm / (numPoints - 1);

  const points: ProfilePoint[] = [];

  for (let i = 0; i < numPoints; i += 1) {
    const depthNm = i * step;
    const conc = calculateProfileConcentration(depthNm, peakConcentrationCm3, rpNm, deltaRpNm);
    const logVal = conc > 1 ? Math.log10(conc) : 0;
    points.push({
      depthNm,
      depthUm: depthNm * UM_PER_NM,
      concentrationCm3: conc,
      logConcentration: logVal,
    });
  }

  return points;
}
