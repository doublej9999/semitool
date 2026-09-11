
/**
 * Thin-film stress from substrate curvature, using the Stoney relation.
 *
 *   sigma = M_s * t_s^2 / (6 * t_f * R),    M_s = E_s / (1 - nu_s)
 *
 * sigma   film stress (Pa)
 * M_s     biaxial modulus of the substrate (Pa)
 * t_s     substrate thickness (m)
 * t_f     film thickness (m)
 * R       radius of curvature of the substrate (m)
 *
 * The relation assumes the film is much thinner than the substrate and that the
 * bending stays small. The tool prints the thickness ratio it relied on and says
 * when the film is too thick for Stoney rather than reporting a number that
 * looks precise but is not.
 *
 * Sign: Stoney gives the magnitude. Which way the wafer curved tells you whether
 * the film is in tension (concave toward the film side) or in compression
 * (convex toward the film side), so the direction is taken from the selection
 * and combined with the magnitude here. It is not guessed from a signed
 * curvature, because metrology tools do not agree on that sign.
 */

export interface BiaxialModulusPreset {
  id: string;
  label: string;
  youngsGPa: number;
  poisson: number;
}

/**
 * Convenience presets. The values are handbook elastic constants for the
 * substrate as a bulk material; the biaxial modulus of a single crystal depends
 * on orientation, so set E and nu from your own data when it matters.
 */
export const BIAXIAL_PRESETS: BiaxialModulusPreset[] = [
  { id: 'si100', label: 'Silicon (100)', youngsGPa: 130, poisson: 0.28 },
  { id: 'silica', label: 'Fused silica', youngsGPa: 73, poisson: 0.17 },
  { id: 'gaas', label: 'Gallium arsenide', youngsGPa: 85.9, poisson: 0.31 },
];

/** Above this film-to-substrate thickness ratio the Stoney assumption is poor. */
export const THICKNESS_RATIO_LIMIT = 0.01;

export interface BowRadiusResult {
  ok: boolean;
  radiusM: number;
  errors: string[];
}

/**
 * Radius of curvature from the bow over a scan.
 *
 * The chord-and-sagitta geometry gives R = (L^2 / 4 + d^2) / (2 d) exactly, where
 * L is the scan length and d the bow. The familiar R = L^2 / (8 d) is its
 * small-deflection limit, and this tool uses the exact form so a strongly bowed
 * wafer is not under-estimated into a falsely high curvature.
 */
export function radiusFromBow(scanLengthM: number, bowM: number): BowRadiusResult {
  const errors: string[] = [];
  if (!Number.isFinite(scanLengthM) || scanLengthM <= 0) {
    errors.push('Scan length must be a positive number.');
  }
  if (!Number.isFinite(bowM) || bowM <= 0) {
    errors.push('Bow must be a positive number.');
  }
  if (errors.length > 0) return { ok: false, radiusM: Number.NaN, errors };
  if (bowM * 2 >= scanLengthM) {
    return {
      ok: false,
      radiusM: Number.NaN,
      errors: ['Bow must be smaller than half the scan length for a valid chord.'],
    };
  }
  return { ok: true, radiusM: (scanLengthM ** 2 / 4 + bowM ** 2) / (2 * bowM), errors };
}

export interface FilmStressInput {
  filmThicknessM: number;
  substrateThicknessM: number;
  youngsModulusPa: number;
  poissonRatio: number;
  /** Radius of curvature as a positive magnitude. */
  radiusM: number;
  /** True when the wafer is concave toward the film side. */
  tensile: boolean;
}

export interface FilmStressSuccess {
  ok: true;
  biaxialModulusPa: number;
  /** Positive for tensile, negative for compressive. */
  stressPa: number;
  magnitudePa: number;
  tensile: boolean;
  thicknessRatio: number;
  ratioWithinStoney: boolean;
}

export type FilmStressResult = { ok: false; errors: string[] } | FilmStressSuccess;

export function calculateFilmStress(input: FilmStressInput): FilmStressResult {
  const errors: string[] = [];
  const { filmThicknessM, substrateThicknessM, youngsModulusPa, poissonRatio, radiusM, tensile } = input;

  if (!Number.isFinite(filmThicknessM) || filmThicknessM <= 0) {
    errors.push('Film thickness must be a positive number.');
  }
  if (!Number.isFinite(substrateThicknessM) || substrateThicknessM <= 0) {
    errors.push('Substrate thickness must be a positive number.');
  }
  if (!Number.isFinite(youngsModulusPa) || youngsModulusPa <= 0) {
    errors.push('Young modulus must be a positive number.');
  }
  if (!Number.isFinite(poissonRatio) || poissonRatio <= -1 || poissonRatio >= 0.5) {
    errors.push('Poisson ratio must be between -1 and 0.5 for a stable isotropic solid.');
  }
  if (!Number.isFinite(radiusM) || radiusM <= 0) {
    errors.push('Radius of curvature must be a positive number.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const biaxialModulusPa = youngsModulusPa / (1 - poissonRatio);
  const magnitudePa = (biaxialModulusPa * substrateThicknessM ** 2) / (6 * filmThicknessM * radiusM);
  const thicknessRatio = filmThicknessM / substrateThicknessM;

  return {
    ok: true,
    biaxialModulusPa,
    stressPa: tensile ? magnitudePa : -magnitudePa,
    magnitudePa,
    tensile,
    thicknessRatio,
    ratioWithinStoney: thicknessRatio <= THICKNESS_RATIO_LIMIT,
  };
}
