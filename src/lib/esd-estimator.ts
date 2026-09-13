/**
 * ESD Protection Estimator — rule-of-thumb robustness scaling for on-chip
 * protection devices, checked against JEDEC-style class targets.
 *
 * The third DFM-cluster check (after the layout parasitics estimator and the
 * DRC rule-of-thumb checker): an engineer sizes an input diode pair, a
 * grounded-gate NMOS or a chip-level supply clamp, and sees the HBM / MM / CDM
 * robustness level the literature-typical scaling rules suggest — plus which
 * JEDEC class targets that level passes or fails.
 *
 * ─── README-style accuracy note ─────────────────────────────────────────────
 *
 * THIS CATALOG IS A RULE-OF-THUMB SIZING REFERENCE, NOT SILICON-VALIDATED
 * ESD SIGN-OFF.
 *
 * Every scaling constant is a literature-typical approximation for generic
 * planar/FinFET logic I/O pads. Real robustness depends on the foundry ESD
 * library, junction depth, salicide blocking, ballast resistance, snapback
 * uniformity, rail resistance, package parasitics and the failure criterion
 * chosen after stress — a factor-of-two spread between wafers is normal.
 * Real sign-off means JEDEC HBM / CDM qualification testing of packaged
 * parts (ANSI/ESDA-JEDEC JS-001 / JS-002) and TLP (transmission-line
 * pulsing) characterization on the foundry's structures. This tool answers
 * "is my device even in the right size ballpark for the target class?",
 * never "will it survive the zapper?".
 *
 * Catalog invariants (enforced by tests):
 *   - every model has at least one class limit and a finite severity factor
 *     in (0, 1] relative to HBM;
 *   - every device rule constant is finite and positive, and every caveat
 *     carries the ±30%+ rule-of-thumb wording;
 *   - class pass/fail is computed as estimated level ≥ limit (boundary passes).
 *
 * All outputs are deterministic and null-safe: unknown models/devices,
 * non-finite or non-positive sizes and invalid targets produce explicit
 * nulls with an explanation — never NaN and never a fabricated number.
 */

/**
 * The honesty banner, word for word. Shown in the UI and checked by tests so
 * the disclaimer cannot silently disappear from the tool.
 */
export const ESD_DISCLAIMER =
  'Rule-of-thumb sizing estimates from literature-typical constants — NOT silicon-validated ESD sign-off. Real robustness needs TLP characterization and the foundry ESD library.';

/** Accuracy notes following the README accuracy-policy spirit. */
export const ACCURACY_NOTES: readonly string[] = [
  ESD_DISCLAIMER,
  'All scaling constants are ±30%+ rules of thumb at best: foundry ESD libraries, junction engineering, silicide blocking and layout details routinely move the real number by a factor of two in either direction.',
  'HBM robustness scales with protection-device size; MM and CDM numbers here are derived from empirical HBM severity correlations (≈1/10 and ≈1/8 of the HBM level in volts) with very wide literature spreads — they are severity reminders, not sizing rules.',
  'CDM robustness is dominated by package capacitance, pin interconnect resistance and gate-oxide integrity, NOT by the size of the protection device: a bigger diode does not buy CDM margin the way it buys HBM margin.',
  'Pass/fail here compares a rule-of-thumb estimate against a JEDEC-style class limit. Sign-off means stressed packaged parts per ANSI/ESDA-JEDEC JS-001 (HBM) / JS-002 (CDM) on your foundry qualification flow; MM (JESD22-A115) has been dropped from most modern qualification suites.',
  'Chip-level HBM for power pins is set by the supply clamp network and the rail resistance between clamps and pins — a per-device estimate for a local diode or GGNMOS on a power pin describes the device alone, not the pin.',
];

// ─── ESD stress models ───────────────────────────────────────────────────────

export type EsdModelId = 'hbm' | 'mm' | 'cdm';

/** Pin-level or chip-level scope of the class target. */
export type EsdTargetScope = 'pin' | 'chip';

/** One JEDEC-style class target of a model. */
export interface EsdClassLevel {
  /** Passing threshold in volts (estimated level ≥ limit passes). */
  limitV: number;
  /** Human label, e.g. 'Class 1A' for HBM 250 V. */
  label: string;
}

/** One ESD stress model: circuit, class targets and typical rise behaviour. */
export interface EsdModelSpec {
  id: EsdModelId;
  label: string;
  /** Discharge capacitance in pF. */
  capacitancePf: number;
  /** Series resistance in Ω (0 for the nominally-resistorless MM). */
  resistanceOhm: number;
  /** One-line honesty note about the model. */
  note: string;
  /** Typical pulse rise / first-peak characteristic, literature-typical. */
  riseNote: string;
  /** Class targets, ascending. */
  classLimits: readonly EsdClassLevel[];
  /**
   * Empirical severity correlation: volts the SAME silicon survives relative
   * to its HBM level. HBM = 1 by definition; MM ≈ 1/10 (a 200 V MM target
   * corresponds to roughly a 2 kV HBM capability; literature spread ≈1/5–1/30);
   * CDM ≈ 1/8 (a 500 V CDM target corresponds to roughly a 4 kV HBM
   * capability). Both conversions are severity reminders, not scaling laws.
   */
  severityFactor: number;
  /** Scope the class targets apply to. */
  scope: EsdTargetScope;
  /** Whether the model is still common in modern qualification suites. */
  qualificationNote: string;
}

export const ESD_MODELS: readonly EsdModelSpec[] = [
  {
    id: 'hbm',
    label: 'HBM — Human Body Model',
    capacitancePf: 100,
    resistanceOhm: 1500,
    note: 'Charged human discharges through the pin (JS-001). The classic qualification model; device-size scaling rules are calibrated on it.',
    riseNote: 'Rise time ≈ 2–10 ns (typical spec range), single exponential decay pulse.',
    classLimits: [
      { limitV: 250, label: 'Class 1A' },
      { limitV: 500, label: 'Class 1B' },
      { limitV: 1000, label: 'Class 1C' },
      { limitV: 2000, label: 'Class 2' },
    ],
    severityFactor: 1,
    scope: 'pin',
    qualificationNote: 'Still required by essentially every foundry qualification flow (JS-001).',
  },
  {
    id: 'mm',
    label: 'MM — Machine Model',
    capacitancePf: 200,
    resistanceOhm: 0,
    note: 'Machine discharge, nominally 0 Ω series resistance (JESD22-A115). Largely retired from modern qualification suites but still quoted on datasheets.',
    riseNote: 'Oscillatory L–C ring (≈ 15 MHz class), first current peak ≈ 15–25 ns.',
    classLimits: [{ limitV: 200, label: '200 V target' }],
    severityFactor: 0.1,
    scope: 'pin',
    qualificationNote: 'Dropped from most modern foundry qualification flows; kept here for datasheet comparisons.',
  },
  {
    id: 'cdm',
    label: 'CDM — Charged Device Model',
    capacitancePf: 0,
    resistanceOhm: 0,
    note: 'The device itself is charged (package capacitance) and discharges from the pin (JS-002). Pin-level targets; the dominant real-world ESD threat on production lines.',
    riseNote: 'Very fast: rise < 400 ps (field-induced), multi-ampere current pulse inside ≈ 1 ns.',
    classLimits: [
      { limitV: 250, label: '250 V pin target' },
      { limitV: 500, label: '500 V pin target' },
    ],
    severityFactor: 0.125,
    scope: 'pin',
    qualificationNote: 'Required by modern logic qualification (JS-002); levels dominated by package and interconnect, not device size.',
  },
];

// ─── Protection device rules ────────────────────────────────────────────────

export type EsdDeviceType = 'diode' | 'ggnmos' | 'supply-clamp';

/**
 * One protection-device scaling rule. All constants are HBM-calibrated,
 * literature-typical and carry a ±30%+ rule-of-thumb caveat — they are NOT
 * foundry ESD library values.
 */
export interface EsdDeviceSpec {
  type: EsdDeviceType;
  label: string;
  /** What the `sizeUm` parameter means for this device. */
  sizeLabel: string;
  /** HBM robustness per µm of the sized dimension, kV/µm. */
  constantKvPerUm: number;
  /** Where the constant sits in the literature range. */
  rangeNote: string;
  /** The honesty caveat, always mentioning the ±30%+ rule-of-thumb spread. */
  caveat: string;
  /** Typical drawn sizes for orientation only (µm). */
  typicalSizeUm: [number, number];
}

export const DEVICE_RULES: readonly EsdDeviceSpec[] = [
  {
    type: 'diode',
    label: 'Input pad diode pair',
    sizeLabel: 'Junction perimeter of ONE diode (µm)',
    // 0.012 kV/µm × 100 µm = 1.2 kV HBM — inside the ≈1–2 kV per 100 µm band.
    constantKvPerUm: 0.012,
    rangeNote: 'Literature range ≈ 1–2 kV HBM per 100 µm of junction perimeter.',
    caveat:
      '±30%+ rule-of-thumb: robustness depends on junction depth, silicide blocking, contact layout and the failure criterion, not just perimeter.',
    typicalSizeUm: [30, 300],
  },
  {
    type: 'ggnmos',
    label: 'Grounded-gate NMOS (snapback)',
    sizeLabel: 'Total gate width (µm)',
    // 0.008 kV/µm × 100 µm = 0.8 kV HBM — snapback devices scale worse per µm.
    constantKvPerUm: 0.008,
    rangeNote: 'Literature range ≈ 0.5–1.5 kV HBM per 100 µm of gate width.',
    caveat:
      '±30%+ rule-of-thumb: snapback is a filament phenomenon — ballast resistance, gate coupling and drain contact spacing dominate real results. Verify with TLP.',
    typicalSizeUm: [50, 400],
  },
  {
    type: 'supply-clamp',
    label: 'Supply clamp (chip-level)',
    sizeLabel: 'Total clamp gate width (µm)',
    // 0.003 kV/µm × 1000 µm = 3 kV HBM chip-level — per-µm efficiency is lower
    // than a local pad device because current must spread along the rails.
    constantKvPerUm: 0.003,
    rangeNote: 'Literature range ≈ 2–4 kV HBM per 1 mm of total clamp width (RC-triggered MOSFET clamps).',
    caveat:
      '±30%+ rule-of-thumb at best: rail resistance, clamp trigger network and how many clamps share the current dominate the real chip-level result.',
    typicalSizeUm: [400, 4000],
  },
];

// ─── Lookup helpers (null-safe) ──────────────────────────────────────────────

/** All models in display order. */
export function listModels(): readonly EsdModelSpec[] {
  return ESD_MODELS;
}

/** One model by id. Null-safe. */
export function getModel(modelId: string | null | undefined): EsdModelSpec | undefined {
  if (!modelId) return undefined;
  return ESD_MODELS.find((model) => model.id === modelId);
}

/** All device rules in display order. */
export function listDevices(): readonly EsdDeviceSpec[] {
  return DEVICE_RULES;
}

/** One device rule by type. Null-safe. */
export function getDevice(deviceType: string | null | undefined): EsdDeviceSpec | undefined {
  if (!deviceType) return undefined;
  return DEVICE_RULES.find((device) => device.type === deviceType);
}

// ─── Rounding ────────────────────────────────────────────────────────────────

/** Round to 6 decimals so rule-of-thumb results stay clean under IEEE-754. */
function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

// ─── The estimator ───────────────────────────────────────────────────────────

export type EsdPinType = 'input' | 'output' | 'power';

/** One class-target check outcome. */
export interface EsdClassCheck {
  limitV: number;
  label: string;
  /** estimated level ≥ limit (boundary passes). Always false when unestimable. */
  pass: boolean;
}

export interface EsdEstimate {
  modelId: string;
  modelLabel: string;
  deviceType: string;
  deviceLabel: string;
  pinType: string;
  /** Echoed size in µm; null when the input size is invalid. */
  sizeUm: number | null;
  /** HBM scaling constant used (kV/µm); null when the device is unknown. */
  constantKvPerUm: number | null;
  /** HBM-equivalent level (kV) before the model severity conversion; null when unestimable. */
  hbmEquivalentKv: number | null;
  /** Estimated robustness of the selected model (kV); null when unestimable. */
  estimatedKv: number | null;
  /** Same estimate in volts for convenience; null when unestimable. */
  estimatedV: number | null;
  /** One row per class target of the model; [] when unestimable. */
  classPass: EsdClassCheck[];
  /** Explanations and honesty warnings; non-empty whenever the estimate is degraded. */
  warnings: string[];
  status: 'ok' | 'invalid' | 'no-model' | 'no-device';
}

export interface EsdEstimateInput {
  model: string | null | undefined;
  device:
    | {
        type: string | null | undefined;
        /** µm of the device-specific dimension (perimeter / gate width / clamp width). */
        sizeUm: number | null | undefined;
      }
    | null
    | undefined;
  pinType: string | null | undefined;
}

/**
 * Estimate the ESD robustness of a sized protection device and check it
 * against the class targets of the selected model.
 *
 * Semantics: estimated level ≥ limit passes (boundary passes). Unknown
 * model/device → 'no-model' / 'no-device'; non-finite or non-positive size →
 * 'invalid'. In every refused case estimatedKv is null and classPass is empty
 * — the estimator never guesses. Deterministic: the same input always yields
 * the same result.
 */
export function estimateEsd(input: EsdEstimateInput | null | undefined): EsdEstimate {
  const modelId = input?.model ?? '';
  const deviceType = input?.device?.type ?? '';
  const pinType = input?.pinType ?? '';
  const sizeUm = input?.device?.sizeUm;

  const model = getModel(modelId);
  const device = getDevice(deviceType);

  if (!model) {
    return {
      modelId,
      modelLabel: 'Unknown model',
      deviceType,
      deviceLabel: device?.label ?? 'Unknown device',
      pinType,
      sizeUm: typeof sizeUm === 'number' ? sizeUm : null,
      constantKvPerUm: null,
      hbmEquivalentKv: null,
      estimatedKv: null,
      estimatedV: null,
      classPass: [],
      warnings: [`Unknown ESD model "${modelId}".`],
      status: 'no-model',
    };
  }

  if (!device) {
    return {
      modelId,
      modelLabel: model.label,
      deviceType,
      deviceLabel: 'Unknown device',
      pinType,
      sizeUm: typeof sizeUm === 'number' ? sizeUm : null,
      constantKvPerUm: null,
      hbmEquivalentKv: null,
      estimatedKv: null,
      estimatedV: null,
      classPass: [],
      warnings: [`Unknown protection device "${deviceType}".`],
      status: 'no-device',
    };
  }

  if (typeof sizeUm !== 'number' || !Number.isFinite(sizeUm) || sizeUm <= 0) {
    return {
      modelId,
      modelLabel: model.label,
      deviceType,
      deviceLabel: device.label,
      pinType,
      sizeUm: typeof sizeUm === 'number' ? sizeUm : null,
      constantKvPerUm: device.constantKvPerUm,
      hbmEquivalentKv: null,
      estimatedKv: null,
      estimatedV: null,
      classPass: [],
      warnings: ['Device size must be a finite number greater than 0 µm.'],
      status: 'invalid',
    };
  }

  const warnings: string[] = [`${device.label}: ${device.caveat}`];

  if (model.id === 'mm') {
    warnings.push(
      'MM level derived from the empirical HBM↔MM severity correlation (≈1/10; literature spread ≈1/5–1/30) — treat as a severity reminder, not a sizing rule.',
    );
  }
  if (model.id === 'cdm') {
    warnings.push(
      'CDM robustness is dominated by package capacitance, pin interconnect and gate oxide — NOT by protection-device size. This estimate is an order-of-magnitude severity reminder only.',
    );
  }
  if (pinType === 'output') {
    warnings.push(
      'Output pins: the driver (pull-down NMOS) often adds self-protection in parallel — this estimate covers the explicit device only and is therefore conservative.',
    );
  }
  if (pinType === 'power' && device.type !== 'supply-clamp') {
    warnings.push(
      'Power pins are protected by the chip-level supply clamp network, not by a local diode/GGNMOS — this number describes the device alone, not the pin-level result.',
    );
  }

  // HBM-calibrated scaling, then the model severity conversion.
  const hbmEquivalentV = sizeUm * device.constantKvPerUm * 1000;
  const estimatedV = round6(hbmEquivalentV * model.severityFactor);
  const estimatedKv = round6(estimatedV / 1000);
  const hbmEquivalentKv = round6(hbmEquivalentV / 1000);

  const classPass = model.classLimits.map<EsdClassCheck>((level) => ({
    limitV: level.limitV,
    label: level.label,
    pass: estimatedV >= level.limitV,
  }));

  return {
    modelId,
    modelLabel: model.label,
    deviceType,
    deviceLabel: device.label,
    pinType,
    sizeUm,
    constantKvPerUm: device.constantKvPerUm,
    hbmEquivalentKv,
    estimatedKv,
    estimatedV,
    classPass,
    warnings,
    status: 'ok',
  };
}

// ─── Inverse sizing ──────────────────────────────────────────────────────────

export interface EsdSuggestion {
  modelId: EsdModelId;
  modelLabel: string;
  deviceType: EsdDeviceType;
  deviceLabel: string;
  /** Requested robustness target, kV of the selected model. */
  targetKv: number;
  /** Required size in µm, rounded UP to 0.1 µm so it never undersizes. */
  requiredSizeUm: number;
  /** HBM scaling constant used (kV/µm). */
  constantKvPerUm: number;
  /** Honesty notes for this suggestion. */
  notes: string[];
}

/**
 * Invert the scaling rule: required device size in µm to reach `targetKv` on
 * the selected model. Rounded UP to 0.1 µm so the suggestion never
 * undersizes. Returns null for unknown models/devices or non-finite,
 * non-positive targets — never a fabricated size.
 */
export function suggestSizing(input: {
  model: string | null | undefined;
  targetKv: number | null | undefined;
  deviceType: string | null | undefined;
}): EsdSuggestion | null {
  const model = getModel(input?.model);
  const device = getDevice(input?.deviceType);
  const targetKv = input?.targetKv;

  if (!model || !device) return null;
  if (typeof targetKv !== 'number' || !Number.isFinite(targetKv) || targetKv <= 0) return null;

  const kvPerUm = device.constantKvPerUm * model.severityFactor;
  const requiredSizeUm = round6(Math.ceil((targetKv / kvPerUm) * 10) / 10);

  const notes: string[] = [`${device.label}: ${device.caveat}`];

  if (model.id === 'mm') {
    notes.push(
      'MM target converted through the empirical HBM↔MM severity correlation (≈1/10) — expect wide real-world spread.',
    );
  }
  if (model.id === 'cdm') {
    notes.push(
      'CDM is dominated by the package and interconnect, not device size — this inverse number is a severity-reminder only, not a CDM design rule.',
    );
  }
  if (targetKv > 50) {
    notes.push(
      'A target above 50 kV looks like volts entered instead of kV — HBM class targets are 0.25–8 kV, MM 0.2–0.4 kV, CDM 0.25–1 kV.',
    );
  }

  return {
    modelId: model.id,
    modelLabel: model.label,
    deviceType: device.type,
    deviceLabel: device.label,
    targetKv,
    requiredSizeUm,
    constantKvPerUm: device.constantKvPerUm,
    notes,
  };
}
