/**
 * DRC Rule-of-Thumb Checker — literature-typical design rules per process family.
 *
 * The second DFM-cluster check (after the layout parasitics estimator): an
 * engineer picks a process node family, sees the typical minimum width /
 * spacing / pitch / enclosure values per layer, and checks their own drawn
 * values against them with an explicit pass/fail and margin.
 *
 * ─── README-style accuracy note ─────────────────────────────────────────────
 *
 * THIS CATALOG IS A RULE-OF-THUMB REFERENCE, NOT A FOUNDRY DRC DECK.
 *
 * Every number is a literature-typical approximation for a generic logic
 * process of that era (textbook rule summaries, MOSIS-style scalable rules,
 * publicly presented foundry rule snippets). Real decks differ per foundry,
 * per fab, per option (dense / isolated / wide-metal rules, RF options,
 * FinFET PDKs), and they are versioned per PDK release. The only authoritative
 * source is the signed-off design rule manual of your process — always check
 * against it before tapeout. This tool answers "is my number even in the right
 * ballpark for the node?", never "will it pass DRC?".
 *
 * Catalog invariants (enforced by tests):
 *   - minimum pitch = minimum width + minimum spacing for every layer;
 *   - enclosure rules exist only on contact/via (cut) layers;
 *   - every value is a finite positive number.
 *
 * All outputs are deterministic and null-safe: unknown nodes/layers/kinds or
 * non-finite drawn values produce an explicit 'no-rule' / 'invalid' status,
 * never NaN and never a fabricated rule.
 */

/**
 * The honesty banner, word for word. Shown in the UI and checked by tests so
 * the disclaimer cannot silently disappear from the tool.
 */
export const DRC_DISCLAIMER =
  'Rule-of-thumb catalog compiled from literature-typical values — NOT a foundry DRC deck. Always check the signed-off design rule manual of your process.';

/** Accuracy notes following the README accuracy-policy spirit. */
export const ACCURACY_NOTES: readonly string[] = [
  DRC_DISCLAIMER,
  'Values are generic per node family: foundry, fab option (dense vs isolated, wide-metal, RF), PDK version and design-manual revisions all shift the real numbers, sometimes by tens of percent on enclosure and min-area rules.',
  'Minimum pitch is reported as width + spacing (the classic rule of thumb); real decks add aligned-via and gate-cut exceptions, and FinFET fin pitch is set by the sidewall image transfer, not by a drawn width + spacing.',
  'Minimum area is display-only in this tool (no drawn-area check kind): treat it as an order-of-magnitude reminder for wide-to-narrow tapers and one-dimensional shapes.',
  'Pass/fail here is a text-book comparison of drawn value vs rule value. Sign-off DRC also runs density, antenna, width-dependent spacing tables, rounding/grid checks and OPC-aware rules that this tool does not model.',
];

/** Check kinds supported by `checkRules`. Min-area is display-only. */
export type DrcCheckKind = 'width' | 'spacing' | 'pitch' | 'enclosure';

/** Layer grouping used for the selects and the rule table. */
export type DrcLayerGroup = 'poly' | 'active' | 'metal' | 'cut';

/** Process era — changes the wording of the active-layer label. */
export type DrcNodeEra = 'planar' | 'finFET';

/** All rule values for one layer, in µm (area in µm²). */
export interface DrcLayerRules {
  /** Minimum drawn width (or fixed cut size for contact/via). */
  widthUm: number;
  /** Minimum spacing to a same-layer neighbour. */
  spacingUm: number;
  /** Minimum pitch = width + spacing. */
  pitchUm: number;
  /** Minimum overlap of the surrounding metal/poly around this cut. Null for non-cut layers. */
  enclosureUm: number | null;
  /** Minimum drawn area where the era commonly has one (µm²). Null where not applicable. */
  minAreaUm2: number | null;
}

/** One layer of one process node family. */
export interface DrcLayerSpec {
  id: string;
  label: string;
  group: DrcLayerGroup;
  rules: DrcLayerRules;
}

/** One process node family with its full layer catalog. */
export interface DrcNodeCatalog {
  id: string;
  label: string;
  era: DrcNodeEra;
  /** One-line honesty note about the family. */
  note: string;
  layers: readonly DrcLayerSpec[];
}

// ─── Raw node table (width, spacing [, minArea] per metal; enclosure for cuts) ──

/** [widthUm, spacingUm, minAreaUm2 | null] per metal layer, metal1 → metal5. */
type MetalTuple = [number, number, number | null];
/** [sizeUm, spacingUm, enclosureUm] for contact/via layers. */
type CutTuple = [number, number, number];

interface NodeEntry {
  id: string;
  label: string;
  era: DrcNodeEra;
  note: string;
  poly: [number, number];
  active: [number, number];
  metals: readonly [MetalTuple, MetalTuple, MetalTuple, MetalTuple, MetalTuple];
  contact: CutTuple;
  via: CutTuple;
}

const NODE_ENTRIES: readonly NodeEntry[] = [
  {
    id: '180nm',
    label: '180 nm (0.18 µm)',
    era: 'planar',
    note: 'Generic 0.18 µm logic (MOSIS-style Al/Cu era); classic textbook rule set.',
    poly: [0.18, 0.24],
    active: [0.24, 0.24],
    metals: [
      [0.28, 0.28, null],
      [0.28, 0.28, null],
      [0.28, 0.28, null],
      [0.46, 0.46, null],
      [0.46, 0.46, null],
    ],
    contact: [0.24, 0.26, 0.07],
    via: [0.26, 0.26, 0.06],
  },
  {
    id: '130nm',
    label: '130 nm',
    era: 'planar',
    note: 'Generic 130 nm logic; first widespread Cu / low-k generation.',
    poly: [0.13, 0.2],
    active: [0.16, 0.2],
    metals: [
      [0.2, 0.2, null],
      [0.2, 0.2, null],
      [0.2, 0.2, null],
      [0.32, 0.32, null],
      [0.4, 0.4, null],
    ],
    contact: [0.2, 0.22, 0.06],
    via: [0.22, 0.22, 0.06],
  },
  {
    id: '90nm',
    label: '90 nm',
    era: 'planar',
    note: 'Generic 90 nm logic; strained silicon, min-area rules start to appear on metals.',
    poly: [0.1, 0.16],
    active: [0.12, 0.16],
    metals: [
      [0.14, 0.14, 0.06],
      [0.14, 0.14, 0.06],
      [0.16, 0.16, 0.08],
      [0.2, 0.2, 0.1],
      [0.28, 0.28, 0.16],
    ],
    contact: [0.14, 0.16, 0.05],
    via: [0.16, 0.16, 0.05],
  },
  {
    id: '65nm',
    label: '65 nm',
    era: 'planar',
    note: 'Generic 65 nm logic; double patterning not yet needed, tight M1 pitch.',
    poly: [0.07, 0.12],
    active: [0.09, 0.12],
    metals: [
      [0.1, 0.1, 0.04],
      [0.1, 0.1, 0.04],
      [0.1, 0.1, 0.05],
      [0.14, 0.14, 0.08],
      [0.2, 0.2, 0.12],
    ],
    contact: [0.1, 0.12, 0.04],
    via: [0.12, 0.12, 0.04],
  },
  {
    id: '45nm',
    label: '45 nm',
    era: 'planar',
    note: 'Generic 45 nm logic; high-k + metal gate era begins, planar transistors.',
    poly: [0.05, 0.09],
    active: [0.07, 0.1],
    metals: [
      [0.07, 0.07, 0.02],
      [0.07, 0.08, 0.02],
      [0.08, 0.09, 0.03],
      [0.1, 0.11, 0.05],
      [0.14, 0.15, 0.09],
    ],
    contact: [0.07, 0.09, 0.03],
    via: [0.08, 0.09, 0.03],
  },
  {
    id: '28nm',
    label: '28 nm',
    era: 'planar',
    note: 'Generic 28 nm logic (HP/LP); last planar mainstream node, contacted gate pitch ≈ 0.108 µm.',
    poly: [0.032, 0.076],
    active: [0.05, 0.06],
    metals: [
      [0.04, 0.04, 0.015],
      [0.04, 0.04, 0.015],
      [0.045, 0.045, 0.02],
      [0.06, 0.06, 0.03],
      [0.08, 0.08, 0.06],
    ],
    contact: [0.05, 0.06, 0.02],
    via: [0.05, 0.06, 0.02],
  },
  {
    id: '14nm-finFET',
    label: '14 nm FinFET',
    era: 'finFET',
    note: 'Generic 14/16 nm FinFET family; fin pitch ≈ 0.042 µm, gate pitch ≈ 0.050 µm.',
    poly: [0.02, 0.03],
    active: [0.008, 0.034],
    metals: [
      [0.02, 0.03, 0.008],
      [0.02, 0.03, 0.008],
      [0.028, 0.032, 0.012],
      [0.04, 0.04, 0.02],
      [0.06, 0.06, 0.04],
    ],
    contact: [0.02, 0.026, 0.006],
    via: [0.02, 0.028, 0.006],
  },
  {
    id: '7nm-finFET',
    label: '7 nm FinFET',
    era: 'finFET',
    note: 'Generic 7 nm FinFET family (EUV-assisted); fin pitch ≈ 0.033 µm, M1/M2 pitch ≈ 0.040 µm.',
    poly: [0.016, 0.038],
    active: [0.007, 0.026],
    metals: [
      [0.016, 0.024, 0.006],
      [0.016, 0.024, 0.006],
      [0.02, 0.028, 0.008],
      [0.03, 0.036, 0.014],
      [0.05, 0.05, 0.03],
    ],
    contact: [0.016, 0.022, 0.005],
    via: [0.016, 0.024, 0.005],
  },
];

// ─── Catalog assembly ────────────────────────────────────────────────────────

const METAL_COUNT = 5;
const VIA_COUNT = 4;

/** Round to 6 decimals so decimal inputs stay exact under IEEE-754 (0.07+0.14 → 0.21). */
function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function buildLayer(
  id: string,
  label: string,
  group: DrcLayerGroup,
  widthUm: number,
  spacingUm: number,
  enclosureUm: number | null,
  minAreaUm2: number | null,
): DrcLayerSpec {
  return {
    id,
    label,
    group,
    rules: {
      widthUm,
      spacingUm,
      pitchUm: round6(widthUm + spacingUm),
      enclosureUm,
      minAreaUm2,
    },
  };
}

function buildNode(entry: NodeEntry): DrcNodeCatalog {
  const layers: DrcLayerSpec[] = [];

  layers.push(buildLayer('poly', 'Poly (gate)', 'poly', entry.poly[0], entry.poly[1], null, null));
  layers.push(
    buildLayer(
      'active',
      entry.era === 'finFET' ? 'Fin / active (OD)' : 'Active / OD (diffusion)',
      'active',
      entry.active[0],
      entry.active[1],
      null,
      null,
    ),
  );

  for (let m = 0; m < METAL_COUNT; m += 1) {
    const [widthUm, spacingUm, minAreaUm2] = entry.metals[m];
    layers.push(buildLayer(`metal${m + 1}`, `Metal ${m + 1}`, 'metal', widthUm, spacingUm, null, minAreaUm2));
  }

  layers.push(buildLayer('contact', 'Contact (to M1)', 'cut', entry.contact[0], entry.contact[1], entry.contact[2], null));
  for (let v = 0; v < VIA_COUNT; v += 1) {
    layers.push(
      buildLayer(`via${v + 1}`, `Via ${v + 1}`, 'cut', entry.via[0], entry.via[1], entry.via[2], null),
    );
  }

  return { id: entry.id, label: entry.label, era: entry.era, note: entry.note, layers };
}

/**
 * THE catalog: 8 process node families × 12 layers (poly, active/fin,
 * metal1–metal5, contact, via1–via4). Rule-of-thumb values only — see the
 * module-level accuracy note.
 */
export const RULE_CATALOG: readonly DrcNodeCatalog[] = NODE_ENTRIES.map(buildNode);

/** All node families in ascending feature size, for the node <select>. */
export function listNodes(): readonly DrcNodeCatalog[] {
  return RULE_CATALOG;
}

/** Look up one node family by id (e.g. '28nm'). Null-safe. */
export function getNode(nodeId: string | null | undefined): DrcNodeCatalog | undefined {
  if (!nodeId) return undefined;
  return RULE_CATALOG.find((node) => node.id === nodeId);
}

/** Layers of one node family, in display order. Empty for an unknown node. */
export function listLayers(nodeId: string | null | undefined): readonly DrcLayerSpec[] {
  return getNode(nodeId)?.layers ?? [];
}

/**
 * One numeric rule value, or null when the node/layer is unknown or the kind
 * does not apply to the layer (e.g. enclosure on a metal).
 */
export function getRule(
  nodeId: string | null | undefined,
  layerId: string | null | undefined,
  kind: DrcCheckKind,
): number | null {
  const layer = listLayers(nodeId).find((candidate) => candidate.id === layerId);
  if (!layer) return null;
  return kindRule(layer, kind);
}

function kindRule(layer: DrcLayerSpec, kind: DrcCheckKind): number | null {
  switch (kind) {
    case 'width':
      return layer.rules.widthUm;
    case 'spacing':
      return layer.rules.spacingUm;
    case 'pitch':
      return layer.rules.pitchUm;
    case 'enclosure':
      return layer.rules.enclosureUm;
    default:
      return null;
  }
}

/** Which check kinds apply to a layer (enclosure only exists on cuts). */
export function kindsForLayer(layer: DrcLayerSpec | null | undefined): readonly DrcCheckKind[] {
  if (!layer) return [];
  return layer.rules.enclosureUm === null
    ? ['width', 'spacing', 'pitch']
    : ['width', 'spacing', 'pitch', 'enclosure'];
}

// ─── Rule table for display ──────────────────────────────────────────────────

/** One display row of the per-node rule table. */
export interface DrcRuleRow {
  layerId: string;
  label: string;
  group: DrcLayerGroup;
  widthUm: number;
  spacingUm: number;
  pitchUm: number;
  enclosureUm: number | null;
  minAreaUm2: number | null;
}

/**
 * The full layer/kind table of a node family for display. Returns an empty
 * array for an unknown node (the UI renders nothing instead of guessing).
 */
export function getRuleTable(nodeId: string | null | undefined): readonly DrcRuleRow[] {
  return listLayers(nodeId).map((layer) => ({
    layerId: layer.id,
    label: layer.label,
    group: layer.group,
    widthUm: layer.rules.widthUm,
    spacingUm: layer.rules.spacingUm,
    pitchUm: layer.rules.pitchUm,
    enclosureUm: layer.rules.enclosureUm,
    minAreaUm2: layer.rules.minAreaUm2,
  }));
}

// ─── The checker ─────────────────────────────────────────────────────────────

/** One user request: "check this drawn value on this layer against this kind". */
export interface DrcCheckInput {
  layer: string;
  kind: DrcCheckKind;
  /** Drawn value in µm. */
  drawnUm: number;
}

/** Outcome of one check. */
export interface DrcCheckResult {
  layer: string;
  layerLabel: string | null;
  kind: DrcCheckKind;
  /** Catalog rule in µm, or null when no rule applies. */
  ruleUm: number | null;
  drawnUm: number;
  /** drawn − rule in µm (positive = slack, negative = violation). Null when not computable. */
  marginUm: number | null;
  /** drawn / rule (≥ 1 passes). Null when not computable. */
  ratio: number | null;
  status: 'pass' | 'fail' | 'no-rule' | 'invalid';
  /** Human-readable reason for 'no-rule' / 'invalid'; empty for pass/fail. */
  message: string;
}

export interface DrcCheckSummary {
  total: number;
  pass: number;
  fail: number;
  /** no-rule + invalid: the checker refused to guess. */
  skipped: number;
}

export interface DrcCheckReport {
  node: string;
  nodeLabel: string;
  results: readonly DrcCheckResult[];
  summary: DrcCheckSummary;
}

/**
 * Check drawn values against the rule-of-thumb catalog.
 *
 * Semantics: drawn == rule → pass (margin 0); drawn < rule → fail.
 * Unknown node/layer/kind → 'no-rule'; non-finite or non-positive drawn
 * value → 'invalid'. Deterministic: the same input always yields the same
 * report, and checks keep their input order.
 */
export function checkRules(input: {
  node: string | null | undefined;
  checks: readonly DrcCheckInput[] | null | undefined;
}): DrcCheckReport {
  const node = getNode(input?.node);
  const checks = Array.isArray(input?.checks) ? input.checks : [];

  const results = checks.map<DrcCheckResult>((check) => {
    const kind: DrcCheckKind = check?.kind ?? 'width';
    const drawnUm = check?.drawnUm;
    const layerId = check?.layer ?? '';

    if (!node) {
      return {
        layer: layerId,
        layerLabel: null,
        kind,
        ruleUm: null,
        drawnUm,
        marginUm: null,
        ratio: null,
        status: 'no-rule',
        message: `Unknown process node "${input?.node ?? ''}".`,
      };
    }

    const layer = node.layers.find((candidate) => candidate.id === layerId);
    if (!layer) {
      return {
        layer: layerId,
        layerLabel: null,
        kind,
        ruleUm: null,
        drawnUm,
        marginUm: null,
        ratio: null,
        status: 'no-rule',
        message: `Layer "${layerId}" is not in the ${node.label} catalog.`,
      };
    }

    const ruleUm = kindRule(layer, kind);
    if (ruleUm === null) {
      return {
        layer: layerId,
        layerLabel: layer.label,
        kind,
        ruleUm: null,
        drawnUm,
        marginUm: null,
        ratio: null,
        status: 'no-rule',
        message: `An ${kind} rule does not apply to ${layer.label}.`,
      };
    }

    if (typeof drawnUm !== 'number' || !Number.isFinite(drawnUm) || drawnUm <= 0) {
      return {
        layer: layerId,
        layerLabel: layer.label,
        kind,
        ruleUm,
        drawnUm,
        marginUm: null,
        ratio: null,
        status: 'invalid',
        message: 'Drawn value must be a finite number greater than 0.',
      };
    }

    const marginUm = round6(drawnUm - ruleUm);
    const ratio = round6(drawnUm / ruleUm);
    return {
      layer: layerId,
      layerLabel: layer.label,
      kind,
      ruleUm,
      drawnUm,
      marginUm,
      ratio,
      status: drawnUm >= ruleUm ? 'pass' : 'fail',
      message: '',
    };
  });

  const pass = results.filter((result) => result.status === 'pass').length;
  const fail = results.filter((result) => result.status === 'fail').length;
  const skipped = results.length - pass - fail;

  return {
    node: input?.node ?? '',
    nodeLabel: node?.label ?? 'Unknown node',
    results,
    summary: { total: results.length, pass, fail, skipped },
  };
}
