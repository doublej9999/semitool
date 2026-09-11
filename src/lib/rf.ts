
/**
 * Impedance mismatch in the decibel world.
 *
 * Conventions used here, stated because mixing them is the usual mistake:
 *   return loss    RL = -20 log10 |Γ|      (amplitude ratio, always >= 0 dB)
 *   reflection     |Γ| = 10^(-RL/20),  0 <= |Γ| < 1 for a passive load
 *   VSWR           S = (1 + |Γ|) / (1 - |Γ|)
 *   mismatch loss  ML = -10 log10(1 - |Γ|^2)  (a power ratio, always >= 0 dB)
 *
 * Return loss uses the factor 20 because the reflection coefficient is an
 * amplitude; mismatch loss uses 10 because it is a power ratio. A passive
 * load has |Γ| < 1, so a reading of |Γ| >= 1 (RL <= 0 dB) is rejected.
 */

/** Reflection coefficient magnitude from a return loss in dB. */
export function gammaFromReturnLossDb(returnLossDb: number): number {
  return 10 ** (-returnLossDb / 20);
}

/** Return loss in dB from a reflection coefficient magnitude. */
export function returnLossDbFromGamma(gamma: number): number {
  return -20 * Math.log10(gamma);
}

/** Voltage standing wave ratio from a reflection coefficient magnitude. */
export function vswrFromGamma(gamma: number): number {
  return (1 + gamma) / (1 - gamma);
}

/** Reflection coefficient magnitude from a VSWR. */
export function gammaFromVswr(vswr: number): number {
  return (vswr - 1) / (vswr + 1);
}

export function returnLossDbFromVswr(vswr: number): number {
  return returnLossDbFromGamma(gammaFromVswr(vswr));
}

export function vswrFromReturnLossDb(returnLossDb: number): number {
  return vswrFromGamma(gammaFromReturnLossDb(returnLossDb));
}

/** Mismatch loss in dB: the fraction of incident power that is not delivered. */
export function mismatchLossDb(gamma: number): number {
  return -10 * Math.log10(1 - gamma * gamma);
}

/** Fraction of incident power reflected. */
export function reflectedFraction(gamma: number): number {
  return gamma * gamma;
}

/** Fraction of incident power delivered to the load. */
export function transmittedFraction(gamma: number): number {
  return 1 - gamma * gamma;
}

/** A decibel power ratio to a linear ratio. */
export function dbToPowerRatio(db: number): number {
  return 10 ** (db / 10);
}

/** A decibel voltage (or field) ratio to a linear ratio. */
export function dbToAmplitudeRatio(db: number): number {
  return 10 ** (db / 20);
}
