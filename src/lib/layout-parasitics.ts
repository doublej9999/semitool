/**
 * IC Layout Parasitics Estimator — first-order interconnect R/C from drawn geometry.
 *
 * The classic pre-tapeout sanity check: given a drawn metal (or poly) line of
 * length L, width W and thickness t, estimate the DC line resistance, the
 * line-to-substrate capacitance (parallel plate + fringe), the IR drop for a
 * given current and the single-pole RC delays.
 *
 * ─── README-style accuracy note ─────────────────────────────────────────────
 *
 * Resistance model
 *   R = ρ_eff(T) · L / (W · t) with a linear temperature coefficient
 *   ρ(T) = ρ_20 · (1 + α·(T − 20 °C)).
 *   ρ_eff is an EMPIRICAL "effective" resistivity: bulk resistivity inflated
 *   by a size-effect term (grain-boundary / surface scattering, Fuchs–
 *   Sondheimer-like) plus the Ta/TiN liner share of the cross-section.
 *   The catalog is calibrated so Cu lands at ≈1.8 µΩ·cm for wide (≥1 µm)
 *   lines and ≈2.2–2.7 µΩ·cm near 0.18 µm, matching published inline data.
 *   Expect ±10–20 % against silicon: bamboo grain structure, CMP dishing,
 *   barrier step coverage and anneal history all shift the real number.
 *   Poly entries are given directly as sheet resistance (typical ranges);
 *   thickness is only used for the derived resistivity readout.
 *
 * Capacitance model
 *   C = k·ε0·( W·L/t  +  2·(W+L)·ln(1 + 2t/s) )
 *   i.e. a parallel-plate term to ONE reference plane below plus a
 *   logarithmic perimeter fringe term. This is the standard first-order
 *   approximation; it is typically within ±20–30 % of a 2-D/3-D field
 *   solver for an isolated line. It deliberately ignores the second side
 *   neighbour, top-metal crossovers, shielding and fill — use a field
 *   solver (Raphael / Q3D / StarRC) for extraction sign-off.
 *
 * All numeric outputs are finite by construction: invalid or missing inputs
 * yield 0 plus an entry in `warnings`, never NaN/Infinity.
 */

/** Vacuum permittivity (F/m). */
export const EPSILON_0_F_PER_M = 8.854187817e-12;

/** Reference temperature for catalog resistivities (°C). */
export const REFERENCE_TEMPERATURE_C = 20;

/**
 * Validated temperature window for the linear TCR model (°C). Inputs outside
 * the window are clamped and flagged with a warning rather than silently
 * extrapolated.
 */
export const MIN_TEMPERATURE_C = -55;
export const MAX_TEMPERATURE_C = 175;

/** Cap on the size-effect multiplier so sub-nm widths cannot explode ρ. */
const MAX_SIZE_EFFECT_MULTIPLIER = 10;

// ─── Layer catalogs ──────────────────────────────────────────────────────────

export interface MetalLayerSpec {
  kind: 'metal';
  id: string;
  label: string;
  /** Bulk resistivity at 20 °C (µΩ·cm). */
  bulkResistivityUohmCm: number;
  /** Linear temperature coefficient of resistance at 20 °C (1/K). */
  tcrPerK: number;
  /**
   * Size-effect coefficient (µm): ρ_eff = ρ_bulk · (1 + coefficient / W_um).
   * Empirically calibrated so Cu gives ≈2.2–2.7 µΩ·cm near 0.18 µm width
   * (liner + scattering) and ≈1.8 µΩ·cm at ≥1 µm.
   */
  sizeEffectPerUm: number;
  notes?: string;
}

export interface PolyLayerSpec {
  kind: 'poly';
  id: string;
  label: string;
  /** Typical sheet resistance at 20 °C (Ω/□). */
  sheetResistanceOhmSq: number;
  /** Linear TCR (1/K); heavily doped poly is weakly metallic (positive). */
  tcrPerK: number;
  notes?: string;
}

export type ConductorLayerSpec = MetalLayerSpec | PolyLayerSpec;

export interface DielectricSpec {
  id: string;
  label: string;
  /** Relative permittivity k (dimensionless). */
  k: number;
  notes?: string;
}

/** Interconnect metals with literature-typical values. */
export const METAL_LAYERS: readonly MetalLayerSpec[] = [
  {
    kind: 'metal',
    id: 'cu',
    label: 'Copper (Cu) — damascene, Ta/TiN liner',
    bulkResistivityUohmCm: 1.72,
    tcrPerK: 0.0039,
    sizeEffectPerUm: 0.05,
    notes:
      'Calibrated effective ρ: ≈2.2–2.7 µΩ·cm at 0.1–0.2 µm width, ≈1.8 µΩ·cm at ≥1 µm (liner share + size scattering).',
  },
  {
    kind: 'metal',
    id: 'alcu',
    label: 'Aluminum alloy (Al–0.5%Cu) — subtractive etch',
    bulkResistivityUohmCm: 2.65,
    tcrPerK: 0.0043,
    sizeEffectPerUm: 0.15,
    notes: 'Effective ≈3.0 µΩ·cm for ≥1 µm lines — typical for Al-Cu interconnect.',
  },
  {
    kind: 'metal',
    id: 'w',
    label: 'Tungsten (W) — plugs / local interconnect',
    bulkResistivityUohmCm: 5.6,
    tcrPerK: 0.0045,
    sizeEffectPerUm: 0.2,
    notes: 'CVD W films run higher than bulk; contacts/vias see still larger effective values.',
  },
];

/** Polysilicon gate layers, specified by sheet resistance (Ω/□). */
export const POLY_LAYERS: readonly PolyLayerSpec[] = [
  {
    kind: 'poly',
    id: 'poly-doped',
    label: 'Doped polysilicon (unsilicided gate)',
    sheetResistanceOhmSq: 15,
    tcrPerK: 0.0015,
    notes: 'Typical 10–20 Ω/□ for heavily doped (above critical concentration) poly.',
  },
  {
    kind: 'poly',
    id: 'poly-silicided',
    label: 'Silicided polysilicon (TiSi₂/CoSi₂ salicide)',
    sheetResistanceOhmSq: 4,
    tcrPerK: 0.002,
    notes: 'Typical 2–8 Ω/□ depending on silicide (TiSi₂, CoSi₂, NiSi) and anneal.',
  },
];

/** Common ILD / gate dielectrics with literature-typical k values. */
export const DIELECTRICS: readonly DielectricSpec[] = [
  { id: 'sio2', label: 'SiO₂ (PETEOS / thermal oxide)', k: 3.9, notes: 'Conventional ILD reference.' },
  { id: 'fsg', label: 'FSG — fluorinated silicate glass (SiOF)', k: 3.5, notes: 'Common 0.25 µm-era ILD.' },
  { id: 'lowk', label: 'Low-k SiOC(H) (SiCOH CVD / spin-on)', k: 2.7, notes: 'Cu/low-k damascene ILD.' },
  { id: 'ulk', label: 'Ultra low-k porous SiCOH', k: 2.2, notes: 'Porous carbon-doped oxide (ELK ~2.0–2.4).' },
  { id: 'airgap', label: 'Air-gap / void ILD', k: 1.9, notes: 'Effective k with air gaps between lines.' },
  { id: 's3n4', label: 'Si₃N₄ (etch-stop / capping)', k: 7.0, notes: 'High-k capping raises line capacitance.' },
];

export function getConductor(id: string): ConductorLayerSpec | undefined {
  if (typeof id !== 'string') return undefined;
  return (
    METAL_LAYERS.find((layer) => layer.id === id) ??
    POLY_LAYERS.find((layer) => layer.id === id)
  );
}

export function getDielectric(id: string): DielectricSpec | undefined {
  if (typeof id !== 'string') return undefined;
  return DIELECTRICS.find((layer) => layer.id === id);
}

/** All conductors (metals then poly) — used for select dropdowns. */
export function listConductors(): readonly ConductorLayerSpec[] {
  return [...METAL_LAYERS, ...POLY_LAYERS];
}

/**
 * Clamps a temperature into the validated window and returns the effective
 * value plus a warning when clamping occurred.
 */
function resolveTemperature(temperatureC: number | undefined): {
  effectiveC: number;
  clamped: boolean;
} {
  const t = Number.isFinite(temperatureC) ? (temperatureC as number) : REFERENCE_TEMPERATURE_C;
  if (t < MIN_TEMPERATURE_C) return { effectiveC: MIN_TEMPERATURE_C, clamped: true };
  if (t > MAX_TEMPERATURE_C) return { effectiveC: MAX_TEMPERATURE_C, clamped: true };
  return { effectiveC: t, clamped: false };
}

/** Linear TCR factor: ρ(T)/ρ(20 °C) = 1 + α·ΔT. */
export function temperatureFactor(tcrPerK: number, temperatureC: number): number {
  return 1 + tcrPerK * (temperatureC - REFERENCE_TEMPERATURE_C);
}

// ─── Resistance ──────────────────────────────────────────────────────────────

export interface EstimateResistanceParams {
  /** Drawn line length (µm). */
  lengthUm: number;
  /** Drawn line width (µm). */
  widthUm: number;
  /** Line thickness (µm) — ignored for poly entries specified by Ω/□. */
  thicknessUm: number;
  /** Conductor catalog id, e.g. 'cu', 'alcu', 'poly-doped'. */
  material: string;
  /** Ambient / operating temperature (°C), clamped to [-55, 175]. */
  temperatureC?: number;
}

export interface ResistanceResult {
  materialId: string;
  materialLabel: string;
  materialKind: 'metal' | 'poly';
  /** Total line resistance (Ω). */
  resistanceOhm: number;
  /** Sheet resistance at temperature (Ω/□). */
  sheetResistanceOhmSq: number;
  /** Number of squares L/W. */
  squares: number;
  /** Effective resistivity at temperature (µΩ·cm); null for poly entries. */
  effectiveResistivityUohmCm: number | null;
  /** Catalog bulk resistivity (µΩ·cm); null for poly entries. */
  bulkResistivityUohmCm: number | null;
  /** ρ(T)/ρ(20 °C) multiplier applied. */
  temperatureFactor: number;
  /** Temperature actually used (°C), after clamping. */
  temperatureC: number;
  warnings: string[];
}

function zeroResistanceResult(params: EstimateResistanceParams, warnings: string[]): ResistanceResult {
  return {
    materialId: String(params?.material ?? ''),
    materialLabel: '',
    materialKind: 'metal',
    resistanceOhm: 0,
    sheetResistanceOhmSq: 0,
    squares: 0,
    effectiveResistivityUohmCm: null,
    bulkResistivityUohmCm: null,
    temperatureFactor: 1,
    temperatureC: REFERENCE_TEMPERATURE_C,
    warnings,
  };
}

/**
 * Line resistance: R = ρ_eff(T)·L/(W·t) with a linear TCR.
 * For poly entries R = Rs(T)·(L/W) directly from the catalog sheet resistance.
 */
export function estimateResistance(params: EstimateResistanceParams): ResistanceResult {
  const warnings: string[] = [];
  const { lengthUm, widthUm, thicknessUm } = params ?? { lengthUm: NaN, widthUm: NaN, thicknessUm: NaN };

  if (!Number.isFinite(lengthUm) || lengthUm <= 0 || !Number.isFinite(widthUm) || widthUm <= 0) {
    warnings.push('Line length and width must be positive numbers.');
    return zeroResistanceResult(params ?? { material: '', lengthUm: NaN, widthUm: NaN, thicknessUm: NaN }, warnings);
  }

  const layer = getConductor(params.material);
  if (!layer) {
    warnings.push(`Unknown material id "${String(params.material)}" — pick a catalog conductor.`);
    return zeroResistanceResult(params, warnings);
  }

  const { effectiveC, clamped } = resolveTemperature(params.temperatureC);
  if (clamped) {
    warnings.push(
      `Temperature ${params.temperatureC} °C is outside the validated linear-TCR window (${MIN_TEMPERATURE_C}…${MAX_TEMPERATURE_C} °C); clamped to ${effectiveC} °C.`,
    );
  }

  const tFactor = temperatureFactor(layer.tcrPerK, effectiveC);
  const squares = lengthUm / widthUm;

  if (layer.kind === 'poly') {
    const sheetRs = layer.sheetResistanceOhmSq * tFactor;
    const thickness = Number.isFinite(thicknessUm) && thicknessUm > 0 ? thicknessUm : null;
    warnings.push(`${layer.label}: sheet-resistance entry — thickness ignored for R (Rs = ${layer.sheetResistanceOhmSq} Ω/□ typical).`);
    return {
      materialId: layer.id,
      materialLabel: layer.label,
      materialKind: 'poly',
      resistanceOhm: sheetRs * squares,
      sheetResistanceOhmSq: sheetRs,
      squares,
      effectiveResistivityUohmCm: thickness !== null ? sheetRs * thickness * 100 : null,
      bulkResistivityUohmCm: null,
      temperatureFactor: tFactor,
      temperatureC: effectiveC,
      warnings,
    };
  }

  if (!Number.isFinite(thicknessUm) || thicknessUm <= 0) {
    warnings.push('Line thickness must be a positive number.');
    return zeroResistanceResult(params, warnings);
  }

  const sizeMultiplier = Math.min(MAX_SIZE_EFFECT_MULTIPLIER, 1 + layer.sizeEffectPerUm / widthUm);
  if (sizeMultiplier >= MAX_SIZE_EFFECT_MULTIPLIER) {
    warnings.push('Size-effect multiplier capped at 10× — width is far below the model calibration range.');
  }
  const rhoEff = layer.bulkResistivityUohmCm * sizeMultiplier * tFactor;
  // ρ [µΩ·cm] → Ω: R = 0.01 · ρ · L/(W·t) with L, W, t all in µm.
  const resistanceOhm = 0.01 * rhoEff * (lengthUm / (widthUm * thicknessUm));
  const sheetResistanceOhmSq = resistanceOhm / squares; // = 0.01 · ρ / t

  return {
    materialId: layer.id,
    materialLabel: layer.label,
    materialKind: 'metal',
    resistanceOhm,
    sheetResistanceOhmSq,
    squares,
    effectiveResistivityUohmCm: rhoEff,
    bulkResistivityUohmCm: layer.bulkResistivityUohmCm,
    temperatureFactor: tFactor,
    temperatureC: effectiveC,
    warnings,
  };
}

// ─── Capacitance ─────────────────────────────────────────────────────────────

export interface EstimateCapacitanceParams {
  /** Drawn line length (µm). */
  lengthUm: number;
  /** Drawn line width (µm). */
  widthUm: number;
  /** Dielectric height from line bottom to the reference plane (µm), optional. */
  thicknessUm?: number;
  /** Spacing to the nearest side neighbour (µm), optional — drives the fringe term. */
  spacingUm?: number;
  /** Relative permittivity of the surrounding ILD (dimensionless). */
  dielectricK: number;
  /** Optional drawn overlap area (µm²); replaces W·L for the plate term when valid. */
  overlapAreaUm2?: number;
}

export interface CapacitanceResult {
  /** Total estimated capacitance (F) — plate + fringe. */
  capacitanceF: number;
  /** Total capacitance (fF). */
  capacitanceFf: number;
  /** Parallel-plate component (F). */
  plateCapacitanceF: number;
  /** Fringe component (F). */
  fringeCapacitanceF: number;
  /** fringe / total, in [0, 1). */
  fringeFraction: number;
  /** Plate area used (µm²). */
  plateAreaUm2: number;
  /** Dielectric height used (µm). */
  dielectricThicknessUm: number;
  /** Neighbour spacing used (µm). */
  spacingUm: number;
  warnings: string[];
}

const DEFAULT_DIELECTRIC_THICKNESS_UM = 1.0;

/**
 * Parallel-plate + fringe capacitance of an isolated line over one plane:
 *   C = k·ε0·( area/t + 2·(W+L)·ln(1 + 2t/s) )
 * Accuracy vs a field solver: ±20–30 % (isolated line, no second neighbour,
 * no crossovers). Null-safe: invalid inputs yield 0 + warnings.
 */
export function estimateCapacitance(params: EstimateCapacitanceParams): CapacitanceResult {
  const warnings: string[] = [];
  const { lengthUm, widthUm } = params ?? { lengthUm: NaN, widthUm: NaN };

  const zero = (): CapacitanceResult => ({
    capacitanceF: 0,
    capacitanceFf: 0,
    plateCapacitanceF: 0,
    fringeCapacitanceF: 0,
    fringeFraction: 0,
    plateAreaUm2: 0,
    dielectricThicknessUm: 0,
    spacingUm: 0,
    warnings,
  });

  const k = params?.dielectricK;
  if (!Number.isFinite(k) || k <= 0) {
    warnings.push('Dielectric constant k must be a positive number.');
    return zero();
  }
  if (!Number.isFinite(lengthUm) || lengthUm <= 0 || !Number.isFinite(widthUm) || widthUm <= 0) {
    warnings.push('Line length and width must be positive numbers.');
    return zero();
  }

  // Dielectric height: explicit thickness, else fall back to the spacing, else 1 µm.
  let t = Number.isFinite(params.thicknessUm) && (params.thicknessUm as number) > 0 ? (params.thicknessUm as number) : NaN;
  if (!Number.isFinite(t)) {
    t = Number.isFinite(params.spacingUm) && (params.spacingUm as number) > 0 ? (params.spacingUm as number) : DEFAULT_DIELECTRIC_THICKNESS_UM;
    warnings.push(
      `Dielectric thickness not given — defaulted to ${t} µm (spacing or ${DEFAULT_DIELECTRIC_THICKNESS_UM} µm).`,
    );
  }

  // Neighbour spacing drives the fringe term; default to the dielectric height.
  let s = Number.isFinite(params.spacingUm) && (params.spacingUm as number) > 0 ? (params.spacingUm as number) : NaN;
  if (!Number.isFinite(s)) {
    s = t;
    warnings.push(`Neighbour spacing not given — defaulted to ${s} µm (the dielectric height).`);
  }

  let area = widthUm * lengthUm;
  if (params.overlapAreaUm2 !== undefined) {
    if (Number.isFinite(params.overlapAreaUm2) && params.overlapAreaUm2 > 0) {
      area = params.overlapAreaUm2;
    } else {
      warnings.push('Overlap area ignored — it must be a positive number.');
    }
  }

  // Effective lengths (µm): plate term W·L/t and perimeter fringe term.
  const plateLengthUm = area / t;
  const fringeLengthUm = 2 * (widthUm + lengthUm) * Math.log(1 + (2 * t) / s);

  // µm · ε0 [F/m] · 1e-6 (µm→m) → F.
  const plateCapacitanceF = k * EPSILON_0_F_PER_M * plateLengthUm * 1e-6;
  const fringeCapacitanceF = k * EPSILON_0_F_PER_M * fringeLengthUm * 1e-6;
  const totalF = plateCapacitanceF + fringeCapacitanceF;

  return {
    capacitanceF: totalF,
    capacitanceFf: totalF * 1e15,
    plateCapacitanceF,
    fringeCapacitanceF,
    fringeFraction: totalF > 0 ? fringeCapacitanceF / totalF : 0,
    plateAreaUm2: area,
    dielectricThicknessUm: t,
    spacingUm: s,
    warnings,
  };
}

// ─── IR drop ─────────────────────────────────────────────────────────────────

export interface IropResult {
  resistanceOhm: number;
  currentMa: number;
  /** V = I·R (V). */
  voltageDropV: number;
  voltageDropMv: number;
  /** Supply voltage used for the percentage, if provided and positive. */
  vddVolt: number | null;
  /** 100·V_drop/V_dd (%), null when V_dd is not given. */
  dropPercentOfVdd: number | null;
  warnings: string[];
}

/**
 * DC IR drop across a resistance: V = I·R, with I in mA.
 * Optionally reports the drop as a percentage of the supply voltage.
 */
export function estimateIRDrop(resistanceOhm: number, currentMa: number, vddVolt?: number): IropResult {
  const warnings: string[] = [];
  const r = Number.isFinite(resistanceOhm) && resistanceOhm >= 0 ? resistanceOhm : NaN;
  const i = Number.isFinite(currentMa) && currentMa >= 0 ? currentMa : NaN;

  if (Number.isNaN(r)) {
    warnings.push('Resistance must be a non-negative number.');
  }
  if (Number.isNaN(i)) {
    warnings.push('Current must be a non-negative number.');
  }

  const dropV = Number.isNaN(r) || Number.isNaN(i) ? 0 : (i / 1000) * r;

  let vdd: number | null = null;
  let percent: number | null = null;
  if (vddVolt !== undefined) {
    if (Number.isFinite(vddVolt) && vddVolt > 0) {
      vdd = vddVolt;
      percent = (dropV / vddVolt) * 100;
    } else {
      warnings.push('Supply voltage ignored — it must be a positive number.');
    }
  }

  return {
    resistanceOhm: Number.isNaN(r) ? 0 : r,
    currentMa: Number.isNaN(i) ? 0 : i,
    voltageDropV: dropV,
    voltageDropMv: dropV * 1000,
    vddVolt: vdd,
    dropPercentOfVdd: percent,
    warnings,
  };
}

// ─── RC delay ────────────────────────────────────────────────────────────────

export interface RcDelayResult {
  resistanceOhm: number;
  capacitanceF: number;
  /** R·C time constant (s). */
  rcTimeConstantS: number;
  /** 50 % propagation delay = 0.69·R·C (s). */
  propDelay50S: number;
  /** 50 % propagation delay (ps). */
  propDelay50Ps: number;
  /** 10–90 % rise time = 0.35·R·C (s). */
  riseTime10To90S: number;
  /** 10–90 % rise time (ps). */
  riseTime10To90Ps: number;
  warnings: string[];
}

/**
 * Single-pole RC response delays of an interconnect segment:
 *   t_p,50% = 0.69·R·C (ln 2) and t_r,10–90% = 0.35·R·C (ln 9).
 */
export function estimateRcDelay(resistanceOhm: number, capacitanceF: number): RcDelayResult {
  const warnings: string[] = [];
  const r = Number.isFinite(resistanceOhm) && resistanceOhm >= 0 ? resistanceOhm : NaN;
  const c = Number.isFinite(capacitanceF) && capacitanceF >= 0 ? capacitanceF : NaN;

  if (Number.isNaN(r)) warnings.push('Resistance must be a non-negative number.');
  if (Number.isNaN(c)) warnings.push('Capacitance must be a non-negative number.');

  const rc = Number.isNaN(r) || Number.isNaN(c) ? 0 : r * c;

  return {
    resistanceOhm: Number.isNaN(r) ? 0 : r,
    capacitanceF: Number.isNaN(c) ? 0 : c,
    rcTimeConstantS: rc,
    propDelay50S: 0.69 * rc,
    propDelay50Ps: 0.69 * rc * 1e12,
    riseTime10To90S: 0.35 * rc,
    riseTime10To90Ps: 0.35 * rc * 1e12,
    warnings,
  };
}

/** README-style accuracy notes, shared by tests and documentation. */
export const ACCURACY_NOTES: readonly string[] = [
  'Resistance: ±10–20 % vs silicon; effective resistivity (bulk + size/barrier penalty) is empirical and varies with CMP dishing, barrier coverage and grain structure.',
  'Capacitance: parallel-plate + logarithmic fringe for an isolated line over one plane, ±20–30 % vs a 2-D/3-D field solver; ignores second-neighbour coupling, crossovers and shielding.',
  'Catalog values are literature-typical, not fab-specific; substitute inline measured Rs and k when available.',
  'Linear TCR model valid from -55 °C to +175 °C; inputs outside the window are clamped and flagged.',
];
