/**
 * Coffin-Manson Thermal Fatigue Model & Solder Joint Reliability Physics.
 *
 * References & Formulations:
 * - Engelmaier, W. (1983): Fatigue life of leadless chip carrier solder joints.
 * - Solomon, H. D. (1986): Low-frequency thermal fatigue of eutectic Pb-Sn solder.
 * - JEDEC JESD22-A104: Temperature Cycling.
 *
 * Equations:
 * 1. CTE Mismatch:
 *    Delta_alpha = |alpha_substrate - alpha_die|  [ppm/°C = 1e-6 / °C]
 *
 * 2. Distance to Neutral Point (DNP):
 *    DNP_mm = sqrt(dieWidthMm^2 + dieHeightMm^2) / 2
 *
 * 3. Thermal Shear Strain Range (Delta_gamma):
 *    Delta_T = T_max - T_min [°C]
 *    Delta_gamma = (DNP_mm * 1e3 * Delta_alpha * 1e-6 * Delta_T) / h_bump_um
 *                = (DNP_mm * 1e-3 * Delta_alpha * Delta_T) / h_bump_um
 *    (Dimensionless shear strain range; multiply by 100 for percentage strain)
 *
 * 4. Coffin-Manson Mean Cycles to Failure (Nf):
 *    Delta_gamma_plastic ≈ Delta_gamma
 *    Nf = 0.5 * (Delta_gamma / (2 * epsilon_f))^(1 / c)
 *    where:
 *      epsilon_f = fatigue ductility coefficient
 *      c         = fatigue ductility exponent (typically -0.4 to -0.6)
 *
 * 5. Acceleration Factor (AF) relative to field operating conditions:
 *    AF = (Delta_T_test / Delta_T_field)^m
 *    where default m = 1.9 (solder creep-fatigue Coffin-Manson acceleration exponent).
 *
 * 6. Expected Field Reliability:
 *    fieldCycles = Nf * AF
 *    fieldYears = fieldCycles / (cyclesPerDay * 365)
 */

export interface SubstratePreset {
  id: string;
  name: string;
  ctePpm: number; // ppm/°C
  description: string;
}

export const SUBSTRATE_PRESETS: SubstratePreset[] = [
  {
    id: 'fr4',
    name: 'FR4 PCB',
    ctePpm: 15.0,
    description: 'Standard multi-layer woven glass reinforced epoxy printed circuit board.',
  },
  {
    id: 'bt-organic',
    name: 'BT Organic Substrate',
    ctePpm: 13.0,
    description: 'Bismaleimide-Triazine high-density package substrate laminate.',
  },
  {
    id: 'ceramic-aln',
    name: 'Ceramic / AlN',
    ctePpm: 4.5,
    description: 'Aluminum Nitride ceramic substrate closely matched to semiconductors.',
  },
  {
    id: 'silicon-interposer',
    name: 'Silicon Interposer',
    ctePpm: 2.6,
    description: 'Silicon 2.5D TSV interposer perfectly CTE-matched to silicon dies.',
  },
];

export interface DiePreset {
  id: string;
  name: string;
  ctePpm: number; // ppm/°C
  description: string;
}

export const DIE_PRESETS: DiePreset[] = [
  {
    id: 'si',
    name: 'Silicon Die',
    ctePpm: 2.6,
    description: 'Standard single-crystal silicon monolithic integrated circuit.',
  },
  {
    id: 'gan',
    name: 'GaN on Si',
    ctePpm: 5.6,
    description: 'Gallium Nitride wide-bandgap epi on silicon base substrate.',
  },
  {
    id: 'sic',
    name: 'SiC',
    ctePpm: 4.0,
    description: 'Silicon Carbide high-voltage power semiconductor die.',
  },
];

export interface SolderAlloyPreset {
  id: string;
  name: string;
  composition: string;
  epsilonF: number; // Fatigue ductility coefficient
  c: number;        // Fatigue ductility exponent (negative)
  description: string;
}

export const SOLDER_ALLOY_PRESETS: SolderAlloyPreset[] = [
  {
    id: 'sac305',
    name: 'SAC305 (Sn96.5Ag3.0Cu0.5)',
    composition: 'Sn96.5 Ag3.0 Cu0.5 (Lead-free)',
    epsilonF: 0.325,
    c: -0.47,
    description: 'Industry standard lead-free SAC alloy for micro-bumps and BGA balls.',
  },
  {
    id: 'sn63pb37',
    name: 'Sn63Pb37 (Eutectic Tin-Lead)',
    composition: 'Sn63 Pb37 (Eutectic)',
    epsilonF: 0.30,
    c: -0.50,
    description: 'Classic eutectic tin-lead alloy used in aerospace and defense electronics.',
  },
  {
    id: 'sn42bi58',
    name: 'Sn42Bi58 (Low-temp solder)',
    composition: 'Sn42 Bi58 (Low-temperature eutectic)',
    epsilonF: 0.22,
    c: -0.42,
    description: 'Low-melting point (138°C) alloy for temperature-sensitive assembly.',
  },
];

export interface TestConditionPreset {
  id: string;
  name: string;
  tMinC: number;
  tMaxC: number;
  description: string;
}

export const TEST_CONDITION_PRESETS: TestConditionPreset[] = [
  {
    id: 'jedec-b',
    name: 'JEDEC Condition B (-40°C to +125°C)',
    tMinC: -40,
    tMaxC: 125,
    description: 'Standard automotive and industrial qualification thermal cycling condition (Delta T = 165°C).',
  },
  {
    id: 'jedec-g',
    name: 'JEDEC Condition G (-40°C to +150°C)',
    tMinC: -40,
    tMaxC: 150,
    description: 'Severe under-the-hood automotive AEC-Q100 Grade 1 thermal cycling condition (Delta T = 190°C).',
  },
  {
    id: 'consumer',
    name: 'Consumer Temp Cycle (0°C to +100°C)',
    tMinC: 0,
    tMaxC: 100,
    description: 'Commercial electronics test profile for mobile and consumer devices (Delta T = 100°C).',
  },
];

export interface ThermalFatigueInputs {
  dieWidthMm: number;
  dieHeightMm: number;
  bumpHeightUm: number;
  substrateCtePpm: number;
  dieCtePpm: number;
  epsilonF: number;
  c: number;
  tMinC: number;
  tMaxC: number;
  fieldDeltaTC?: number;
  accelerationExponentM?: number;
  cyclesPerDay?: number;
}

export interface ThermalFatigueSuccess {
  ok: true;
  dnpMm: number;
  deltaAlphaPpm: number; // ppm/°C
  deltaTTestC: number;    // °C
  deltaGamma: number;     // dimensionless shear strain range
  deltaGammaPct: number;  // shear strain range (%)
  nf: number;             // mean cycles to failure
  af: number;             // acceleration factor
  fieldDeltaTC: number;   // °C
  fieldCycles: number;    // expected cycles in field
  fieldYears: number;     // expected years in field
}

export interface ThermalFatigueError {
  ok: false;
  error: string;
}

export type ThermalFatigueResult = ThermalFatigueSuccess | ThermalFatigueError;

/**
 * Distance to Neutral Point (DNP) from die center to outermost corner bump in mm.
 */
export function calculateDnpMm(dieWidthMm: number, dieHeightMm: number): number {
  return Math.sqrt(dieWidthMm * dieWidthMm + dieHeightMm * dieHeightMm) / 2;
}

/**
 * Shear strain range (Engelmaier formulation).
 * Delta_gamma = (DNP_mm * 1e3 * Delta_alpha * 1e-6 * Delta_T) / h_bump_um
 */
export function calculateShearStrainRange(
  dnpMm: number,
  deltaAlphaPpm: number,
  deltaTC: number,
  bumpHeightUm: number,
): number {
  if (bumpHeightUm <= 0) return Number.NaN;
  return (dnpMm * 1e3 * (deltaAlphaPpm * 1e-6) * deltaTC) / bumpHeightUm;
}

/**
 * Coffin-Manson low-cycle fatigue life (Nf).
 * Nf = 0.5 * (Delta_gamma / (2 * epsilon_f))^(1 / c)
 */
export function calculateCoffinMansonNf(
  deltaGamma: number,
  epsilonF: number,
  c: number,
): number {
  if (deltaGamma <= 0 || epsilonF <= 0 || c >= 0) return Number.NaN;
  const ratio = deltaGamma / (2 * epsilonF);
  if (ratio <= 0) return Number.NaN;
  return 0.5 * Math.pow(ratio, 1 / c);
}

/**
 * Acceleration Factor (AF) relative to field thermal cycling.
 * AF = (Delta_T_test / Delta_T_field)^m
 */
export function calculateAccelerationFactor(
  deltaTTestC: number,
  deltaTFieldC: number,
  m: number = 1.9,
): number {
  if (deltaTFieldC <= 0 || deltaTTestC < 0 || m <= 0) return Number.NaN;
  return Math.pow(deltaTTestC / deltaTFieldC, m);
}

/**
 * Compute comprehensive thermal fatigue analysis.
 */
export function calculateThermalFatigue(inputs: ThermalFatigueInputs): ThermalFatigueResult {
  const {
    dieWidthMm,
    dieHeightMm,
    bumpHeightUm,
    substrateCtePpm,
    dieCtePpm,
    epsilonF,
    c,
    tMinC,
    tMaxC,
    fieldDeltaTC = 45,
    accelerationExponentM = 1.9,
    cyclesPerDay = 4,
  } = inputs;

  if (
    !Number.isFinite(dieWidthMm) ||
    !Number.isFinite(dieHeightMm) ||
    !Number.isFinite(bumpHeightUm) ||
    !Number.isFinite(substrateCtePpm) ||
    !Number.isFinite(dieCtePpm) ||
    !Number.isFinite(epsilonF) ||
    !Number.isFinite(c) ||
    !Number.isFinite(tMinC) ||
    !Number.isFinite(tMaxC)
  ) {
    return { ok: false, error: 'All numerical parameters must be valid numbers.' };
  }

  if (dieWidthMm <= 0 || dieHeightMm <= 0) {
    return { ok: false, error: 'Die width and height must be greater than zero.' };
  }

  if (bumpHeightUm <= 0) {
    return { ok: false, error: 'Bump / solder joint height must be greater than zero.' };
  }

  if (epsilonF <= 0) {
    return { ok: false, error: 'Fatigue ductility coefficient (εf) must be positive.' };
  }

  if (c >= 0) {
    return { ok: false, error: 'Fatigue ductility exponent (c) must be negative (typically -0.4 to -0.6).' };
  }

  if (tMaxC <= tMinC) {
    return { ok: false, error: 'Maximum temperature (T_max) must be greater than minimum temperature (T_min).' };
  }

  if (fieldDeltaTC <= 0) {
    return { ok: false, error: 'Field temperature cycle range (ΔT_field) must be greater than zero.' };
  }

  if (accelerationExponentM <= 0) {
    return { ok: false, error: 'Acceleration exponent (m) must be positive.' };
  }

  if (cyclesPerDay <= 0) {
    return { ok: false, error: 'Field cycles per day must be greater than zero.' };
  }

  const deltaAlphaPpm = Math.abs(substrateCtePpm - dieCtePpm);
  const dnpMm = calculateDnpMm(dieWidthMm, dieHeightMm);
  const deltaTTestC = tMaxC - tMinC;

  if (deltaAlphaPpm === 0) {
    return { ok: false, error: 'CTE mismatch is zero (substrate CTE equals die CTE). Theoretical strain is zero.' };
  }

  const deltaGamma = calculateShearStrainRange(dnpMm, deltaAlphaPpm, deltaTTestC, bumpHeightUm);
  const deltaGammaPct = deltaGamma * 100;

  const nf = calculateCoffinMansonNf(deltaGamma, epsilonF, c);
  const af = calculateAccelerationFactor(deltaTTestC, fieldDeltaTC, accelerationExponentM);
  const fieldCycles = nf * af;
  const fieldYears = fieldCycles / (cyclesPerDay * 365);

  return {
    ok: true,
    dnpMm,
    deltaAlphaPpm,
    deltaTTestC,
    deltaGamma,
    deltaGammaPct,
    nf,
    af,
    fieldDeltaTC,
    fieldCycles,
    fieldYears,
  };
}
