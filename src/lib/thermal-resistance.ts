/**
 * Chip Thermal Resistance & Steady-State Junction Temperature Network.
 *
 * Models a 1D heat flow path from silicon active junction through the
 * package lid/case, Thermal Interface Material (TIM), and heat sink to ambient:
 *
 *   Tj = Ta + P * theta_JA
 *   theta_JA = theta_JC + theta_TIM + theta_SA
 *
 * TIM Thermal Resistance:
 *   theta_TIM = BLT_m / (k_tim * A_m2)
 *             = (BLT_um * 1e-6) / (k_tim * dieAreaMm2 * 1e-6)
 *             = BLT_um / (k_tim * dieAreaMm2)  [°C/W]
 *
 * Case and Sink Temperatures:
 *   T_case = Tj - P * theta_JC
 *   T_sink = T_case - P * theta_TIM = Ta + P * theta_SA
 *
 * Maximum Allowable Power:
 *   P_max = (Tj_max - Ta) / theta_JA  (for theta_JA > 0)
 *
 * Thermal Margin:
 *   Margin = Tj_max - Tj  (negative indicates thermal breach)
 */

export interface PackagePreset {
  id: string;
  name: string;
  thetaJc: number; // °C/W
  typicalDieAreaMm2: number;
  description: string;
}

export const PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: 'fcbga',
    name: 'FCBGA (Flip-Chip BGA)',
    thetaJc: 0.25,
    typicalDieAreaMm2: 144,
    description: 'High-performance flip-chip BGA with integrated copper heat spreader (IHS).',
  },
  {
    id: 'wirebond-bga',
    name: 'Wirebond BGA',
    thetaJc: 1.20,
    typicalDieAreaMm2: 64,
    description: 'Overmolded wire-bonded ball grid array package.',
  },
  {
    id: 'qfn',
    name: 'QFN (Exposed Pad)',
    thetaJc: 1.80,
    typicalDieAreaMm2: 25,
    description: 'Quad Flat No-Lead with copper thermal slug soldered to PCB plane.',
  },
  {
    id: 'to220',
    name: 'TO-220',
    thetaJc: 1.00,
    typicalDieAreaMm2: 16,
    description: 'Classic through-hole power transistor package with metal mounting tab.',
  },
  {
    id: 'soic8',
    name: 'SOIC-8',
    thetaJc: 18.0,
    typicalDieAreaMm2: 9,
    description: 'Standard 8-lead small-outline package without dedicated thermal slug.',
  },
];

export interface TimPreset {
  id: string;
  name: string;
  kTim: number; // W/(m·K)
  bltUm: number; // µm
  description: string;
}

export const TIM_PRESETS: TimPreset[] = [
  {
    id: 'grease',
    name: 'Standard Thermal Grease',
    kTim: 3.5,
    bltUm: 50,
    description: 'Typical silicone/metal-oxide thermal compound (k ~ 3.5 W/m·K, BLT ~ 50 µm).',
  },
  {
    id: 'pcm',
    name: 'High-Perf Phase Change Material (PCM)',
    kTim: 10.0,
    bltUm: 30,
    description: 'Low thermal resistance phase-change polymer or metal alloy (k ~ 10 W/m·K, BLT ~ 30 µm).',
  },
  {
    id: 'gap-pad',
    name: 'Thermal Gap Filler Pad',
    kTim: 2.0,
    bltUm: 200,
    description: 'Compliant elastomer pad accommodating mechanical tolerances (k ~ 2 W/m·K, BLT ~ 200 µm).',
  },
  {
    id: 'zero-tim',
    name: 'Direct Contact / Zero TIM',
    kTim: 1.0,
    bltUm: 0,
    description: 'Direct solder, sintering, or direct PCB thermal pad (0 µm TIM bond line).',
  },
];

export interface HeatsinkPreset {
  id: string;
  name: string;
  thetaSa: number; // °C/W
  description: string;
}

export const HEATSINK_PRESETS: HeatsinkPreset[] = [
  {
    id: 'liquid-coldplate',
    name: 'Liquid Cooling Cold Plate',
    thetaSa: 0.3,
    description: 'Direct pumped liquid cold plate with microchannels.',
  },
  {
    id: 'active-fan',
    name: 'Active Fan-Sink (Forced Air)',
    thetaSa: 1.2,
    description: 'Extruded aluminum/copper heatsink with high-RPM fan.',
  },
  {
    id: 'passive-extruded',
    name: 'Passive Extruded Heatsink (Still Air)',
    thetaSa: 3.5,
    description: 'Natural convection finned aluminum heatsink.',
  },
  {
    id: 'stamped-clip',
    name: 'Small Stamped Clip-on Sink',
    thetaSa: 8.0,
    description: 'Small sheet-metal clip heatsink for board-level components.',
  },
  {
    id: 'bare-board',
    name: 'Bare Package / PCB Only (No Sink)',
    thetaSa: 25.0,
    description: 'Natural convection dissipation into PCB copper and chassis ambient.',
  },
];

export interface ThermalResistanceInput {
  /** Ambient air temperature Ta in °C (default 25 °C). */
  ambientTempC?: number;
  /** Total device power dissipation P in Watts (P >= 0). */
  powerW: number;
  /** Die width in mm (> 0). */
  dieWidthMm: number;
  /** Die height in mm (> 0). */
  dieHeightMm: number;
  /** Junction-to-case thermal resistance theta_JC in °C/W (>= 0). */
  thetaJc: number;
  /** TIM bond line thickness BLT in micrometres (>= 0). */
  bltUm: number;
  /** TIM thermal conductivity k in W/(m·K) (> 0). */
  kTim: number;
  /** Heat sink-to-ambient thermal resistance theta_SA in °C/W (>= 0). */
  thetaSa: number;
  /** Maximum safe junction temperature limit Tj_max in °C (default 105 °C). */
  tjMaxC?: number;
}

export interface ThermalResistanceSuccess {
  ok: true;
  ambientTempC: number;
  powerW: number;
  dieWidthMm: number;
  dieHeightMm: number;
  dieAreaMm2: number;
  thetaJc: number;
  bltUm: number;
  kTim: number;
  thetaTim: number;
  thetaSa: number;
  thetaJa: number;
  tjC: number;
  tCaseC: number;
  tSinkC: number;
  tjMaxC: number;
  pMaxW: number;
  thermalMarginC: number;
  isSafe: boolean;
}

export type ThermalResistanceResult =
  | { ok: false; errors: string[] }
  | ThermalResistanceSuccess;

export function validateThermalResistanceInput(input: ThermalResistanceInput): string[] {
  const errors: string[] = [];

  const ambient = input.ambientTempC ?? 25;
  if (!Number.isFinite(ambient) || ambient < -273.15) {
    errors.push('Ambient temperature must be above absolute zero (-273.15 °C).');
  }

  if (!Number.isFinite(input.powerW) || input.powerW < 0) {
    errors.push('Power dissipation must be greater than or equal to 0 W.');
  }

  if (!Number.isFinite(input.dieWidthMm) || input.dieWidthMm <= 0) {
    errors.push('Die width must be greater than 0 mm.');
  }

  if (!Number.isFinite(input.dieHeightMm) || input.dieHeightMm <= 0) {
    errors.push('Die height must be greater than 0 mm.');
  }

  if (!Number.isFinite(input.thetaJc) || input.thetaJc < 0) {
    errors.push('Junction-to-case resistance (θJC) must be greater than or equal to 0 °C/W.');
  }

  if (!Number.isFinite(input.bltUm) || input.bltUm < 0) {
    errors.push('Bond line thickness (BLT) must be greater than or equal to 0 µm.');
  }

  if (!Number.isFinite(input.kTim) || input.kTim <= 0) {
    errors.push('TIM thermal conductivity (k) must be greater than 0 W/(m·K).');
  }

  if (!Number.isFinite(input.thetaSa) || input.thetaSa < 0) {
    errors.push('Heat sink-to-ambient resistance (θSA) must be greater than or equal to 0 °C/W.');
  }

  const tjMax = input.tjMaxC ?? 105;
  if (!Number.isFinite(tjMax) || tjMax < -273.15) {
    errors.push('Maximum junction temperature limit must be above absolute zero (-273.15 °C).');
  }

  return errors;
}

/**
 * Calculates 1D steady-state junction temperature, thermal resistances,
 * interface temperatures, and thermal headroom.
 */
export function calculateThermalResistance(input: ThermalResistanceInput): ThermalResistanceResult {
  const errors = validateThermalResistanceInput(input);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const ambientTempC = input.ambientTempC ?? 25;
  const tjMaxC = input.tjMaxC ?? 105;
  const { powerW, dieWidthMm, dieHeightMm, thetaJc, bltUm, kTim, thetaSa } = input;

  const dieAreaMm2 = dieWidthMm * dieHeightMm;

  // Formula: theta_TIM = BLT_um / (k_tim * dieAreaMm2) [°C/W]
  // If BLT is 0 µm (direct solder/pad), theta_TIM is 0.
  const thetaTim = bltUm === 0 ? 0 : bltUm / (kTim * dieAreaMm2);

  const thetaJa = thetaJc + thetaTim + thetaSa;
  const tjC = ambientTempC + powerW * thetaJa;
  const tCaseC = tjC - powerW * thetaJc;
  const tSinkC = tCaseC - powerW * thetaTim;

  const pMaxW = thetaJa > 0 ? (tjMaxC - ambientTempC) / thetaJa : Infinity;
  const thermalMarginC = tjMaxC - tjC;
  const isSafe = tjC <= tjMaxC;

  return {
    ok: true,
    ambientTempC,
    powerW,
    dieWidthMm,
    dieHeightMm,
    dieAreaMm2,
    thetaJc,
    bltUm,
    kTim,
    thetaTim,
    thetaSa,
    thetaJa,
    tjC,
    tCaseC,
    tSinkC,
    tjMaxC,
    pMaxW,
    thermalMarginC,
    isSafe,
  };
}
