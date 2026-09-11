
/**
 * Optical lithography limits: the Rayleigh resolution and the depth of focus.
 *
 *   resolution = k1 * lambda / NA      (half-pitch of a dense line/space pattern)
 *   DOF        = k2 * lambda / NA^2    (paraxial estimate, quoted as a total range)
 *
 * k1 = 0.25 is the two-beam diffraction limit for a single exposure. Production
 * single-exposure processes sit near 0.28-0.35; anything below 0.25 needs
 * resolution enhancement (off-axis illumination, phase-shift masks, OPC) or
 * multi-patterning, so the tool says so rather than pretending the number is
 * achievable. k2 near 0.5 is a common planning value.
 *
 * The DOF expression ignores resist thickness, topography and aberrations, so it
 * is a budget starting point, not a measured process window.
 */

export interface LithographyInput {
  wavelengthNm: number;
  numericalAperture: number;
  k1: number;
  k2: number;
}

export interface LithographySuccess {
  ok: true;
  resolutionNm: number;
  depthOfFocusNm: number;
  naSquared: number;
  /** True when k1 is below the two-beam diffraction limit. */
  belowDiffractionLimit: boolean;
}

export type LithographyResult = { ok: false; errors: string[] } | LithographySuccess;

export interface WavelengthPreset {
  id: string;
  label: string;
  nm: number;
}

export const WAVELENGTHS: WavelengthPreset[] = [
  { id: 'g', label: 'g-line, 436 nm', nm: 436 },
  { id: 'h', label: 'h-line, 405 nm', nm: 405 },
  { id: 'i', label: 'i-line, 365 nm', nm: 365 },
  { id: 'krf', label: 'KrF excimer, 248 nm', nm: 248 },
  { id: 'arf', label: 'ArF excimer, 193 nm', nm: 193 },
  { id: 'euv', label: 'EUV, 13.5 nm', nm: 13.5 },
];

/** The two-beam diffraction limit for a single exposure. */
export const K1_DIFFRACTION_LIMIT = 0.25;

/** Highest numerical aperture reachable with 193 nm immersion water (n = 1.44). */
export const MAX_IMMERSION_NA = 1.35;

export function calculateLithography(input: LithographyInput): LithographyResult {
  const errors: string[] = [];
  const { wavelengthNm, numericalAperture, k1, k2 } = input;

  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
    errors.push('Wavelength must be a positive number of nanometres.');
  }
  if (!Number.isFinite(numericalAperture) || numericalAperture <= 0) {
    errors.push('Numerical aperture must be a positive number.');
  } else if (numericalAperture > MAX_IMMERSION_NA) {
    errors.push(`Numerical aperture above ${MAX_IMMERSION_NA} is beyond 193 nm immersion lithography.`);
  }
  if (!Number.isFinite(k1) || k1 <= 0) errors.push('k1 must be positive.');
  if (!Number.isFinite(k2) || k2 <= 0) errors.push('k2 must be positive.');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    resolutionNm: (k1 * wavelengthNm) / numericalAperture,
    depthOfFocusNm: (k2 * wavelengthNm) / numericalAperture ** 2,
    naSquared: numericalAperture ** 2,
    belowDiffractionLimit: k1 < K1_DIFFRACTION_LIMIT,
  };
}
