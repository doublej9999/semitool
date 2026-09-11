
/**
 * Diffusion length and thermal budget.
 *
 * A one-dimensional diffusion has a profile whose natural length scale is the
 * square root of the product of the diffusivity and the time. Which multiple of
 * that scale appears depends on the boundary condition, so this tool prints all
 * three of them and says what each one is:
 *
 *   sqrt(D t)      the characteristic diffusion length
 *   2 sqrt(D t)    the length inside the erfc argument x / (2 sqrt(D t)) for a
 *                  constant surface concentration
 *   sqrt(2 D t)    the standard deviation of the Gaussian profile that grows
 *                  from an instantaneous thin source
 *
 * The diffusivity is in square centimetres per second, the usual unit in
 * diffusion tables, and the thermal budget D t is a length squared, not a
 * length: ten times the time gives a length only sqrt(10) times longer.
 */

/** Square micrometres in one square centimetre. */
export const UM2_PER_CM2 = 1e8;
/** Square nanometres in one square micrometre. */
export const NM2_PER_UM2 = 1e6;
/** Micrometres in one centimetre. */
export const UM_PER_CM = 1e4;

export interface DiffusionInput {
  diffusivityCm2PerS: number;
  timeSeconds: number;
}

export interface DiffusionSuccess {
  ok: true;
  diffusivityCm2PerS: number;
  timeSeconds: number;
  budgetCm2: number;
  budgetUm2: number;
  budgetNm2: number;
  /** sqrt(D t) in micrometres. */
  characteristicLengthUm: number;
  /** 2 sqrt(D t) in micrometres. */
  erfcLengthUm: number;
  /** sqrt(2 D t) in micrometres, the Gaussian standard deviation. */
  gaussianSigmaUm: number;
}

export type DiffusionResult = { ok: false; errors: string[] } | DiffusionSuccess;

export function calculateDiffusion(input: DiffusionInput): DiffusionResult {
  const errors: string[] = [];
  const { diffusivityCm2PerS, timeSeconds } = input;

  if (!Number.isFinite(diffusivityCm2PerS) || diffusivityCm2PerS <= 0) {
    errors.push('Diffusivity must be a positive number in square centimetres per second.');
  }
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    errors.push('Time must be a positive number.');
  }
  if (errors.length > 0) return { ok: false, errors };

  const budgetCm2 = diffusivityCm2PerS * timeSeconds;
  const rootCm = Math.sqrt(budgetCm2);
  const budgetUm2 = budgetCm2 * UM2_PER_CM2;

  return {
    ok: true,
    diffusivityCm2PerS,
    timeSeconds,
    budgetCm2,
    budgetUm2,
    budgetNm2: budgetUm2 * NM2_PER_UM2,
    characteristicLengthUm: rootCm * UM_PER_CM,
    erfcLengthUm: 2 * rootCm * UM_PER_CM,
    gaussianSigmaUm: Math.sqrt(2 * budgetCm2) * UM_PER_CM,
  };
}
