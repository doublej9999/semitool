import { describe, expect, it } from 'vitest';
import {
  ACCURACY_NOTES,
  DRC_DISCLAIMER,
  RULE_CATALOG,
  checkRules,
  getNode,
  getRule,
  getRuleTable,
  kindsForLayer,
  listLayers,
  listNodes,
} from './drc-rules';

const ALL_NODE_IDS = [
  '180nm',
  '130nm',
  '90nm',
  '65nm',
  '45nm',
  '28nm',
  '14nm-finFET',
  '7nm-finFET',
];

const ALL_LAYER_IDS = [
  'poly',
  'active',
  'metal1',
  'metal2',
  'metal3',
  'metal4',
  'metal5',
  'contact',
  'via1',
  'via2',
  'via3',
  'via4',
];

describe('DRC rule catalog', () => {
  it('covers 8 process node families × 12 layers', () => {
    expect(RULE_CATALOG.map((node) => node.id)).toEqual(ALL_NODE_IDS);
    // 96 layer entries; 36 width/spacing/pitch rules + 5 enclosure rules per node = 328 checkable.
    expect(RULE_CATALOG.reduce((sum, node) => sum + node.layers.length, 0)).toBe(96);
    expect(RULE_CATALOG.reduce((sum, node) => sum + node.layers.length * 3, 0)).toBe(288);
    expect(
      RULE_CATALOG.reduce(
        (sum, node) => sum + node.layers.filter((layer) => layer.rules.enclosureUm !== null).length,
        0,
      ),
    ).toBe(40);
  });

  it('has every expected layer exactly once per node, with catalog invariants', () => {
    for (const node of RULE_CATALOG) {
      const ids = node.layers.map((layer) => layer.id);
      expect(ids).toEqual(ALL_LAYER_IDS);
      expect(new Set(ids).size).toBe(ids.length);

      for (const layer of node.layers) {
        const { widthUm, spacingUm, pitchUm, enclosureUm, minAreaUm2 } = layer.rules;
        expect(widthUm, `${node.id}/${layer.id} width`).toBeGreaterThan(0);
        expect(Number.isFinite(widthUm)).toBe(true);
        expect(spacingUm, `${node.id}/${layer.id} spacing`).toBeGreaterThan(0);
        // Invariant: minimum pitch = minimum width + minimum spacing.
        expect(pitchUm, `${node.id}/${layer.id} pitch`).toBeCloseTo(widthUm + spacingUm, 9);
        // Invariant: enclosure only on cut layers.
        if (layer.group === 'cut') {
          expect(enclosureUm, `${node.id}/${layer.id} enclosure`).not.toBeNull();
        } else {
          expect(enclosureUm).toBeNull();
        }
        if (minAreaUm2 !== null) {
          expect(minAreaUm2).toBeGreaterThan(0);
          expect(layer.group).toBe('metal');
        }
      }
    }
  });

  it('matches known literature-typical anchors', () => {
    // 28 nm metal1: min width/spacing 0.04 µm → pitch 0.08 µm.
    expect(getRule('28nm', 'metal1', 'width')).toBeCloseTo(0.04, 9);
    expect(getRule('28nm', 'metal1', 'spacing')).toBeCloseTo(0.04, 9);
    expect(getRule('28nm', 'metal1', 'pitch')).toBeCloseTo(0.08, 9);
    // 28 nm contacted gate pitch ≈ 0.108 µm.
    expect(getRule('28nm', 'poly', 'pitch')).toBeCloseTo(0.108, 9);
    // 14 nm FinFET: fin pitch ≈ 0.042 µm (0.008 + 0.034).
    expect(getRule('14nm-finFET', 'active', 'width')).toBeCloseTo(0.008, 9);
    expect(getRule('14nm-finFET', 'active', 'pitch')).toBeCloseTo(0.042, 9);
    // 7 nm FinFET: gate pitch ≈ 0.054 µm (0.016 + 0.038).
    expect(getRule('7nm-finFET', 'poly', 'pitch')).toBeCloseTo(0.054, 9);
    // 180 nm: classic textbook metal1 0.28 / 0.28, top metal 0.46.
    expect(getRule('180nm', 'metal1', 'width')).toBeCloseTo(0.28, 9);
    expect(getRule('180nm', 'metal5', 'width')).toBeCloseTo(0.46, 9);
    // Contact enclosure of metal around the cut shrinks with the node.
    expect(getRule('180nm', 'contact', 'enclosure')).toBeCloseTo(0.07, 9);
    expect(getRule('28nm', 'contact', 'enclosure')).toBeCloseTo(0.02, 9);
    expect(getRule('7nm-finFET', 'contact', 'enclosure')).toBeCloseTo(0.005, 9);
  });

  it('keeps min-area display values only where the era commonly has them', () => {
    expect(getRuleTable('180nm').find((row) => row.layerId === 'metal1')?.minAreaUm2).toBeNull();
    expect(getRuleTable('130nm').find((row) => row.layerId === 'metal2')?.minAreaUm2).toBeNull();
    expect(getRuleTable('28nm').find((row) => row.layerId === 'metal1')?.minAreaUm2).toBeCloseTo(0.015, 9);
    expect(getRuleTable('28nm').find((row) => row.layerId === 'metal5')?.minAreaUm2).toBeCloseTo(0.06, 9);
    expect(getRuleTable('28nm').find((row) => row.layerId === 'contact')?.minAreaUm2).toBeNull();
  });

  it('labels the active layer as fins on FinFET families', () => {
    expect(getNode('14nm-finFET')?.era).toBe('finFET');
    expect(listLayers('14nm-finFET').find((layer) => layer.id === 'active')?.label).toMatch(/Fin/);
    expect(getNode('28nm')?.era).toBe('planar');
  });

  it('documents its own honesty: rule-of-thumb, not a foundry DRC deck', () => {
    expect(DRC_DISCLAIMER).toMatch(/not a foundry drc deck/i);
    expect(DRC_DISCLAIMER).toMatch(/design rule manual/i);
    expect(ACCURACY_NOTES.length).toBeGreaterThanOrEqual(4);
    expect(ACCURACY_NOTES.join(' ')).toMatch(/signed-off|density, antenna/i);
  });
});

describe('getRuleTable', () => {
  it('returns the full 12-row layer/kind table in display order', () => {
    const table = getRuleTable('28nm');
    expect(table.map((row) => row.layerId)).toEqual(ALL_LAYER_IDS);
    const metal1 = table.find((row) => row.layerId === 'metal1');
    expect(metal1).toMatchObject({
      label: 'Metal 1',
      group: 'metal',
      widthUm: 0.04,
      spacingUm: 0.04,
      pitchUm: 0.08,
      enclosureUm: null,
    });
    const contact = table.find((row) => row.layerId === 'contact');
    expect(contact?.enclosureUm).toBeCloseTo(0.02, 9);
    expect(contact?.minAreaUm2).toBeNull();
  });

  it('returns an empty table for an unknown or missing node', () => {
    expect(getRuleTable('3nm')).toEqual([]);
    expect(getRuleTable('')).toEqual([]);
    expect(getRuleTable(undefined)).toEqual([]);
  });
});

describe('getRule / kindsForLayer guards', () => {
  it('returns null for unknown nodes, layers and inapplicable kinds', () => {
    expect(getRule('28nm', 'via2', 'enclosure')).toBeCloseTo(0.02, 9);
    expect(getRule('28nm', 'metal1', 'enclosure')).toBeNull();
    expect(getRule('28nm', 'metal9', 'width')).toBeNull();
    expect(getRule('3nm', 'metal1', 'width')).toBeNull();
    expect(getRule('', 'metal1', 'width')).toBeNull();
    expect(getRule(undefined, 'metal1', 'width')).toBeNull();
  });

  it('offers the enclosure kind only on cut layers', () => {
    expect(kindsForLayer(listLayers('28nm').find((layer) => layer.id === 'metal1'))).toEqual([
      'width',
      'spacing',
      'pitch',
    ]);
    expect(kindsForLayer(listLayers('28nm').find((layer) => layer.id === 'contact'))).toEqual([
      'width',
      'spacing',
      'pitch',
      'enclosure',
    ]);
    expect(kindsForLayer(undefined)).toEqual([]);
  });

  it('lists nodes and layers null-safely', () => {
    expect(listNodes().length).toBe(8);
    expect(listLayers('bogus')).toEqual([]);
    expect(listLayers(null)).toEqual([]);
  });
});

describe('checkRules', () => {
  it('computes hand-verified margin and ratio for a known-value check', () => {
    const report = checkRules({
      node: '28nm',
      checks: [{ layer: 'metal1', kind: 'width', drawnUm: 0.05 }],
    });
    expect(report.nodeLabel).toBe('28 nm');
    expect(report.results).toHaveLength(1);
    const result = report.results[0];
    expect(result.ruleUm).toBeCloseTo(0.04, 9);
    expect(result.marginUm).toBeCloseTo(0.01, 9);
    expect(result.ratio).toBeCloseTo(1.25, 9);
    expect(result.status).toBe('pass');
    expect(result.layerLabel).toBe('Metal 1');
    expect(report.summary).toEqual({ total: 1, pass: 1, fail: 0, skipped: 0 });
  });

  it('passes at the boundary (drawn == rule) and fails below it', () => {
    const report = checkRules({
      node: '28nm',
      checks: [
        { layer: 'metal1', kind: 'width', drawnUm: 0.04 },
        { layer: 'metal1', kind: 'width', drawnUm: 0.039 },
      ],
    });
    const [boundary, below] = report.results;
    expect(boundary.status).toBe('pass');
    expect(boundary.marginUm).toBeCloseTo(0, 9);
    expect(boundary.ratio).toBeCloseTo(1, 9);
    expect(below.status).toBe('fail');
    expect(below.marginUm).toBeCloseTo(-0.001, 9);
    expect(below.ratio).toBeCloseTo(0.975, 9);
    expect(report.summary).toEqual({ total: 2, pass: 1, fail: 1, skipped: 0 });
  });

  it('checks spacing, pitch and enclosure rules', () => {
    const report = checkRules({
      node: '28nm',
      checks: [
        { layer: 'metal1', kind: 'spacing', drawnUm: 0.03 },
        { layer: 'metal1', kind: 'pitch', drawnUm: 0.08 },
        { layer: 'contact', kind: 'enclosure', drawnUm: 0.025 },
        { layer: 'via3', kind: 'enclosure', drawnUm: 0.015 },
      ],
    });
    const [spacing, pitch, encPass, encFail] = report.results;
    expect(spacing.ruleUm).toBeCloseTo(0.04, 9);
    expect(spacing.status).toBe('fail');
    expect(spacing.marginUm).toBeCloseTo(-0.01, 9);
    expect(spacing.ratio).toBeCloseTo(0.75, 9);
    expect(pitch.ruleUm).toBeCloseTo(0.08, 9);
    expect(pitch.status).toBe('pass');
    expect(encPass.ruleUm).toBeCloseTo(0.02, 9);
    expect(encPass.status).toBe('pass');
    expect(encPass.marginUm).toBeCloseTo(0.005, 9);
    expect(encFail.ruleUm).toBeCloseTo(0.02, 9);
    expect(encFail.status).toBe('fail');
    expect(encFail.marginUm).toBeCloseTo(-0.005, 9);
    expect(report.summary).toEqual({ total: 4, pass: 2, fail: 2, skipped: 0 });
  });

  it('marks unknown nodes, layers and inapplicable kinds as no-rule, never inventing a rule', () => {
    const report = checkRules({
      node: '3nm',
      checks: [{ layer: 'metal1', kind: 'width', drawnUm: 0.05 }],
    });
    expect(report.nodeLabel).toBe('Unknown node');
    expect(report.results[0].status).toBe('no-rule');
    expect(report.results[0].ruleUm).toBeNull();
    expect(report.results[0].message).toMatch(/Unknown process node/);

    const mixed = checkRules({
      node: '28nm',
      checks: [
        { layer: 'metal9', kind: 'width', drawnUm: 0.05 },
        { layer: 'metal1', kind: 'enclosure', drawnUm: 0.05 },
        { layer: '', kind: 'width', drawnUm: 0.05 },
      ],
    });
    for (const result of mixed.results) {
      expect(result.status).toBe('no-rule');
      expect(result.ruleUm).toBeNull();
      expect(result.message.length).toBeGreaterThan(0);
    }
    expect(mixed.results[1].message).toMatch(/enclosure/i);
    expect(mixed.summary).toEqual({ total: 3, pass: 0, fail: 0, skipped: 3 });
  });

  it('flags non-finite or non-positive drawn values as invalid instead of computing garbage', () => {
    const report = checkRules({
      node: '28nm',
      checks: [
        { layer: 'metal1', kind: 'width', drawnUm: 0 },
        { layer: 'metal1', kind: 'width', drawnUm: -0.1 },
        { layer: 'metal1', kind: 'width', drawnUm: Number.NaN },
      ],
    });
    for (const result of report.results) {
      expect(result.status).toBe('invalid');
      // The rule is still reported; margins are not fabricated.
      expect(result.ruleUm).toBeCloseTo(0.04, 9);
      expect(result.marginUm).toBeNull();
      expect(result.ratio).toBeNull();
      expect(result.message).toMatch(/greater than 0/);
    }
    expect(report.summary).toEqual({ total: 3, pass: 0, fail: 0, skipped: 3 });
  });

  it('counts the summary across a mixed batch', () => {
    const report = checkRules({
      node: '28nm',
      checks: [
        { layer: 'metal1', kind: 'width', drawnUm: 0.05 }, // pass
        { layer: 'metal1', kind: 'width', drawnUm: 0.03 }, // fail
        { layer: 'metal1', kind: 'enclosure', drawnUm: 0.03 }, // no-rule
        { layer: 'metal9', kind: 'width', drawnUm: 0.1 }, // no-rule
        { layer: 'metal1', kind: 'width', drawnUm: Number.NaN }, // invalid
      ],
    });
    expect(report.summary).toEqual({ total: 5, pass: 1, fail: 1, skipped: 3 });
  });

  it('is deterministic and null-safe for empty or missing checks', () => {
    const input = {
      node: '45nm',
      checks: [
        { layer: 'poly', kind: 'width' as const, drawnUm: 0.06 },
        { layer: 'contact', kind: 'enclosure' as const, drawnUm: 0.04 }, // rule 0.03 → pass
      ],
    };
    const first = checkRules(input);
    const second = checkRules(input);
    expect(second).toEqual(first);
    expect(first.summary).toEqual({ total: 2, pass: 2, fail: 0, skipped: 0 });

    for (const empty of [[], null, undefined]) {
      const report = checkRules({ node: '45nm', checks: empty as never });
      expect(report.results).toEqual([]);
      expect(report.summary).toEqual({ total: 0, pass: 0, fail: 0, skipped: 0 });
    }
    expect(checkRules({ node: undefined, checks: undefined }).summary.total).toBe(0);
  });
});
