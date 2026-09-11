/**
 * Classical defect-density yield models: Poisson, Murphy and Seeds (Moore).
 *
 * All three are driven by the same quantity
 *
 *   AD = D0 x A
 *
 * where `D0` is the defect density (defects per cm^2) and `A` is the critical
 * area (cm^2), so `AD` is the expected number of killer defects per die.
 *
 * The models differ only in the assumed spatial distribution of defects, which
 * is why they agree closely at small AD and separate as AD grows. With the same
 * AD, Poisson returns the lowest yield and Seeds the highest. These are textbook
 * models, not a fab-, customer- or equipment-specific specification, and the
 * numbers they return are model outputs rather than measured results.
 */

export type YieldModel = 'poisson' | 'murphy' | 'seeds';

export interface YieldModelInfo {
  id: YieldModel;
  /** Human-readable name, also used as the table row label. */
  label: string;
  /** Formula as plain text; the tool page renders it verbatim. */
  formula: string;
  /** Yield fraction in [0, 1] for a given defects-per-die value. */
  yieldFromAd: (ad: number) => number;
  /** Inverse of `yieldFromAd`, for a yield fraction in (0, 1]. */
  adFromYield: (yieldFraction: number) => number;
}

/**
 * Below this AD the Murphy closed form loses precision to cancellation
 * (`1 - exp(-x)` for tiny `x`), and the limit value is accurate to far better
 * than the display precision anyway.
 */
const MURPHY_ZERO_AD = 1e-6;

const POISSON: YieldModelInfo = {
  id: 'poisson',
  label: 'Poisson',
  formula: 'Y = exp(-AD)',
  yieldFromAd: (ad) => Math.exp(-ad),
  adFromYield: (yieldFraction) => -Math.log(yieldFraction),
};

const MURPHY: YieldModelInfo = {
  id: 'murphy',
  label: 'Murphy',
  formula: 'Y = ((1 - exp(-AD)) / AD)^2',
  yieldFromAd: (ad) => {
    if (ad < MURPHY_ZERO_AD) return 1;
    return ((1 - Math.exp(-ad)) / ad) ** 2;
  },
  // No closed form: g(AD) = (1 - exp(-AD)) / AD decreases monotonically from 1
  // to 0, so bisect for the AD where g(AD) equals sqrt(Y).
  adFromYield: (yieldFraction) => {
    const target = Math.sqrt(yieldFraction);
    if (target >= 1) return 0;

    let low = 0;
    // g(1 / target) = (1 - exp(-1 / target)) * target < target, so this brackets
    // the root for every target in (0, 1).
    let high = 1 / target;

    for (let i = 0; i < 200 && high - low > 1e-12; i += 1) {
      const mid = (low + high) / 2;
      if ((1 - Math.exp(-mid)) / mid > target) low = mid;
      else high = mid;
    }

    return (low + high) / 2;
  },
};

const SEEDS: YieldModelInfo = {
  id: 'seeds',
  label: 'Seeds (Moore)',
  formula: 'Y = 1 / (1 + AD)',
  yieldFromAd: (ad) => 1 / (1 + ad),
  adFromYield: (yieldFraction) => 1 / yieldFraction - 1,
};

export const YIELD_MODELS: YieldModelInfo[] = [POISSON, MURPHY, SEEDS];

export function getYieldModel(id: YieldModel): YieldModelInfo {
  const model = YIELD_MODELS.find((candidate) => candidate.id === id);
  if (!model) throw new Error(`Unknown yield model: ${id}`);
  return model;
}

export interface ModelYield {
  model: YieldModelInfo;
  /** Expected killer defects per die (dimensionless). */
  ad: number;
  /** Modelled yield in percent. */
  yieldPercent: number;
}

/** Forward direction: defect density + critical area -> yield, for every model. */
export function modelYields(defectDensityPerCm2: number, areaCm2: number): ModelYield[] {
  const ad = defectDensityPerCm2 * areaCm2;

  return YIELD_MODELS.map((model) => ({
    model,
    ad,
    yieldPercent: model.yieldFromAd(ad) * 100,
  }));
}

export interface ModelDensity {
  model: YieldModelInfo;
  /** Expected killer defects per die implied by the measured yield. */
  ad: number;
  /** Defect density in defects/cm^2 implied by the measured yield. */
  defectDensityPerCm2: number;
}

/** Inverse direction: measured yield + critical area -> defect density. */
export function modelDefectDensities(yieldPercent: number, areaCm2: number): ModelDensity[] {
  const yieldFraction = yieldPercent / 100;

  return YIELD_MODELS.map((model) => {
    const ad = model.adFromYield(yieldFraction);
    return { model, ad, defectDensityPerCm2: ad / areaCm2 };
  });
}

export function validateYieldModelInputs(defectDensityPerCm2: number, areaCm2: number): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(defectDensityPerCm2) || defectDensityPerCm2 < 0) {
    errors.push('Defect density must be zero or greater (defects/cm2).');
  }
  if (!Number.isFinite(areaCm2) || areaCm2 <= 0) {
    errors.push('Critical area must be greater than 0.');
  }

  return errors;
}

export function validateDensityInversionInputs(yieldPercent: number, areaCm2: number): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(yieldPercent) || yieldPercent <= 0 || yieldPercent > 100) {
    errors.push('Yield must be greater than 0 and at most 100 (%).');
  }
  if (!Number.isFinite(areaCm2) || areaCm2 <= 0) {
    errors.push('Critical area must be greater than 0.');
  }

  return errors;
}

export type AreaUnit = 'mm2' | 'cm2';

export const MM2_PER_CM2 = 100;

/** The models are defined for cm^2, so millimetre inputs are converted here. */
export function areaToCm2(value: number, unit: AreaUnit): number {
  return unit === 'cm2' ? value : value / MM2_PER_CM2;
}

export function areaUnitLabel(unit: AreaUnit): string {
  return unit === 'cm2' ? 'cm²' : 'mm²';
}
