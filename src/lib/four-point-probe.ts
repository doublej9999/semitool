/**
 * ASTM F84 / SEMI MF84 Four-Point Probe Resistivity & Sheet Resistance Calculator.
 * Includes finite wafer thickness geometric correction factors and
 * NIST/Thurber (ASTM F723) empirical mobility inversion for Si dopant concentration.
 */

export interface FourPointProbeInput {
  voltageMv: number;
  currentMa: number;
  probeSpacingMm: number; // typically 1.0 mm (0.1 cm)
  waferThicknessUm?: number; // optional, for thin wafer / bulk transition
  waferDiameterMm?: number; // optional, e.g. 150, 200, 300 mm
  dopantType?: 'p-type' | 'n-type';
}

export interface FourPointProbeResult {
  resistanceOhm: number; // V / I
  sheetResistanceOhmSq: number; // Rs (Ω/□)
  resistivityOhmCm: number | null; // ρ (Ω·cm)
  thicknessCorrectionFactor: number;
  diameterCorrectionFactor: number;
  regime: 'thin-film' | 'bulk-semi-infinite' | 'intermediate';
  estimatedDopingCm3: number | null; // N (cm^-3)
  dopantType: 'p-type' | 'n-type';
}

const ELEMENTARY_CHARGE_C = 1.602176634e-19;

/**
 * Masetti / Thurber model for carrier mobility in Silicon at 300 K:
 * μ(N) = μ_min + (μ_max - μ_min) / (1 + (N / N_ref)^α)
 */
const SILICON_MOBILITY_PARAMS = {
  'n-type': {
    muMin: 68.5,
    muMax: 1414.0,
    nRef: 9.2e16,
    alpha: 0.711,
  },
  'p-type': {
    muMin: 44.9,
    muMax: 470.5,
    nRef: 2.23e17,
    alpha: 0.719,
  },
};

/**
 * Calculates carrier mobility for Si given dopant concentration N (cm^-3).
 */
export function getSiliconMobility(dopantType: 'p-type' | 'n-type', nCm3: number): number {
  const p = SILICON_MOBILITY_PARAMS[dopantType];
  return p.muMin + (p.muMax - p.muMin) / (1 + (nCm3 / p.nRef) ** p.alpha);
}

/**
 * Calculates resistivity ρ (Ω·cm) given dopant concentration N (cm^-3).
 */
export function dopingToResistivity(dopantType: 'p-type' | 'n-type', nCm3: number): number {
  if (nCm3 <= 0) return Infinity;
  const mu = getSiliconMobility(dopantType, nCm3);
  return 1 / (ELEMENTARY_CHARGE_C * nCm3 * mu);
}

/**
 * Numerically inverts resistivity ρ (Ω·cm) to find doping concentration N (cm^-3)
 * using binary search over the standard range 1e12 to 1e21 cm^-3.
 */
export function resistivityToDoping(dopantType: 'p-type' | 'n-type', resistivityOhmCm: number): number | null {
  if (!Number.isFinite(resistivityOhmCm) || resistivityOhmCm <= 0) return null;

  let lowLogN = 12.0;
  let highLogN = 21.0;

  // Resistivity decreases monotonically with increasing doping
  for (let iter = 0; iter < 60; iter++) {
    const midLogN = (lowLogN + highLogN) / 2;
    const midN = 10 ** midLogN;
    const rho = dopingToResistivity(dopantType, midN);

    if (Math.abs(rho - resistivityOhmCm) / resistivityOhmCm < 1e-6) {
      return midN;
    }

    if (rho > resistivityOhmCm) {
      // Need higher doping to lower resistivity
      lowLogN = midLogN;
    } else {
      highLogN = midLogN;
    }
  }

  return 10 ** ((lowLogN + highLogN) / 2);
}

/**
 * ASTM F84 thickness correction factor F(t/s) for four-point collinear probe.
 * Thin film limit: F -> 1.0 (as t/s -> 0)
 * Semi-infinite bulk limit: Rs * t -> 2*pi*s * (V/I)
 */
export function calculateThicknessCorrection(tMm: number, sMm: number): {
  factor: number;
  regime: 'thin-film' | 'bulk-semi-infinite' | 'intermediate';
} {
  const ratio = tMm / sMm;

  if (ratio <= 0.5) {
    // Standard thin film condition
    // F(t/s) ≈ 1.0 - 0.116 * (t/s)^2 or series
    const factor = 1.0 / (1.0 + 0.116 * ratio * ratio);
    return { factor, regime: 'thin-film' };
  }

  if (ratio >= 5.0) {
    // Bulk semi-infinite
    return { factor: (2 * Math.LN2 * ratio) / Math.PI, regime: 'bulk-semi-infinite' };
  }

  // Intermediate transition: ASTM F84 series approximation
  const sinhT = Math.sinh(ratio);
  const sinhHalfT = Math.sinh(ratio / 2);
  const factor = sinhHalfT > 0 ? (ratio / (2 * Math.log(sinhT / sinhHalfT))) : 1.0;
  return { factor: Math.max(0.2, Math.min(2.0, factor)), regime: 'intermediate' };
}

/**
 * Diameter correction factor F2(D/s) for circular wafers.
 */
export function calculateDiameterCorrection(diameterMm: number, sMm: number): number {
  const ratio = diameterMm / sMm;
  if (ratio >= 40) return 1.0;
  if (ratio >= 20) return 0.9995;
  if (ratio >= 10) return 0.997;
  if (ratio >= 5) return 0.96;
  return 0.85;
}

/**
 * Main calculation entry point for Four-Point Probe measurements.
 */
export function calculateFourPointProbe(input: FourPointProbeInput): FourPointProbeResult {
  const {
    voltageMv,
    currentMa,
    probeSpacingMm = 1.0,
    waferThicknessUm,
    waferDiameterMm = 200,
    dopantType = 'p-type',
  } = input;

  const vVolts = voltageMv * 1e-3;
  const iAmps = currentMa * 1e-3;
  const rOhm = iAmps > 0 ? vVolts / iAmps : 0;

  const sMm = Math.max(0.1, probeSpacingMm);
  const sCm = sMm * 0.1;

  let thicknessCorr = 1.0;
  let regime: 'thin-film' | 'bulk-semi-infinite' | 'intermediate' = 'thin-film';
  let sheetResistanceOhmSq = (Math.PI / Math.LN2) * rOhm; // 4.53236 * R
  let resistivityOhmCm: number | null = null;

  const diamCorr = calculateDiameterCorrection(waferDiameterMm, sMm);

  if (waferThicknessUm && waferThicknessUm > 0) {
    const tMm = waferThicknessUm * 1e-3;
    const tCm = waferThicknessUm * 1e-4;

    const thicknessAnalysis = calculateThicknessCorrection(tMm, sMm);
    thicknessCorr = thicknessAnalysis.factor;
    regime = thicknessAnalysis.regime;

    // Corrected sheet resistance
    sheetResistanceOhmSq = (Math.PI / Math.LN2) * rOhm * thicknessCorr * diamCorr;
    // Bulk resistivity ρ = Rs * t
    resistivityOhmCm = sheetResistanceOhmSq * tCm;
  } else {
    // If no thickness specified, treat as standard thin film / sheet layer
    sheetResistanceOhmSq = (Math.PI / Math.LN2) * rOhm * diamCorr;
    resistivityOhmCm = null;
  }

  const estimatedDopingCm3 = resistivityOhmCm !== null
    ? resistivityToDoping(dopantType, resistivityOhmCm)
    : null;

  return {
    resistanceOhm: rOhm,
    sheetResistanceOhmSq,
    resistivityOhmCm,
    thicknessCorrectionFactor: thicknessCorr,
    diameterCorrectionFactor: diamCorr,
    regime,
    estimatedDopingCm3,
    dopantType,
  };
}
