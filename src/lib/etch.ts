
/**
 * Etch rate, selectivity and overetch from a before/after thickness measurement.
 *
 *   removed     = before - after
 *   rate        = removed / time
 *   selectivity = film removed / masking layer removed
 *   overetch    = (time - nominal time) / nominal time
 *
 * Selectivity is a ratio measured under one set of conditions. It moves with
 * pressure, power, temperature, loading and the mask material, so a number
 * carried over from another recipe is a starting point rather than a result.
 */

export interface EtchInput {
  beforeNm: number;
  afterNm: number;
  timeSeconds: number;
  /** Masking or underlying layer loss over the same time, when it was measured. */
  maskLossNm: number | null;
  /** Time at which the etch should have stopped, for the overetch figure. */
  nominalTimeSeconds: number | null;
}

export interface EtchSuccess {
  ok: true;
  removedNm: number;
  rateNmPerMinute: number;
  rateNmPerSecond: number;
  maskRateNmPerMinute: number | null;
  selectivity: number | null;
  overetchPercent: number | null;
  /** What fraction of the starting thickness is left. */
  remainingPercent: number;
}

export type EtchResult = { ok: false; errors: string[] } | EtchSuccess;

export function calculateEtch(input: EtchInput): EtchResult {
  const errors: string[] = [];
  const { beforeNm, afterNm, timeSeconds, maskLossNm, nominalTimeSeconds } = input;

  if (!Number.isFinite(beforeNm) || beforeNm <= 0) {
    errors.push('Starting thickness must be a positive number of nanometres.');
  }
  if (!Number.isFinite(afterNm) || afterNm < 0) {
    errors.push('Remaining thickness must be zero or a positive number of nanometres.');
  } else if (Number.isFinite(beforeNm) && beforeNm > 0 && afterNm >= beforeNm) {
    errors.push('Remaining thickness must be smaller than the starting thickness for a net etch to have happened.');
  }
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    errors.push('Etch time must be a positive number of seconds.');
  }
  if (maskLossNm !== null && (!Number.isFinite(maskLossNm) || maskLossNm < 0)) {
    errors.push('Mask loss must be zero or a positive number of nanometres.');
  }
  if (nominalTimeSeconds !== null && (!Number.isFinite(nominalTimeSeconds) || nominalTimeSeconds <= 0)) {
    errors.push('Nominal etch time must be a positive number of seconds.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const removedNm = beforeNm - afterNm;
  const minutes = timeSeconds / 60;
  const rateNmPerMinute = removedNm / minutes;
  const hasMask = maskLossNm !== null && maskLossNm > 0;

  return {
    ok: true,
    removedNm,
    rateNmPerMinute,
    rateNmPerSecond: removedNm / timeSeconds,
    maskRateNmPerMinute: hasMask && maskLossNm !== null ? maskLossNm / minutes : null,
    selectivity: hasMask && maskLossNm !== null ? removedNm / maskLossNm : null,
    overetchPercent:
      nominalTimeSeconds !== null ? ((timeSeconds - nominalTimeSeconds) / nominalTimeSeconds) * 100 : null,
    remainingPercent: (afterNm / beforeNm) * 100,
  };
}
