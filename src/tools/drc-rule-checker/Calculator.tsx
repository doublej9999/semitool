'use client';

import { useId, useState } from 'react';
import { Download, Plus, X } from 'lucide-react';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { downloadCsv } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import {
  DRC_DISCLAIMER,
  checkRules,
  getRuleTable,
  kindsForLayer,
  listLayers,
  listNodes,
  type DrcCheckKind,
  type DrcLayerGroup,
  type DrcLayerSpec,
} from '@/lib/drc-rules';

/**
 * URL state holds only primitives (useUrlParamsState contract). The FIRST
 * check row — the "quick check" — is backed by it, so a link like
 * /tools/drc-rule-checker?node=28nm&layer=metal1&kind=width&drawnUm=0.05
 * restores a shareable single check. Additional rows live in session-only
 * state (objects are deliberately not serialized into the URL); they are
 * rebuilt per session and the quick row plus the rule table still carry the
 * full context. Documented in the UI under the quick-check inputs.
 */
interface QuickCheckState {
  [key: string]: string | number | boolean;
  node: string;
  layer: string;
  kind: string;
  drawnUm: number;
}

const INITIAL_QUICK: QuickCheckState = {
  node: '28nm',
  layer: 'metal1',
  kind: 'width',
  drawnUm: 0.05,
};

interface CheckRow {
  id: number;
  layer: string;
  kind: DrcCheckKind;
  drawnUm: number;
}

const KIND_LABELS: Record<DrcCheckKind, string> = {
  width: 'Min width',
  spacing: 'Min spacing',
  pitch: 'Min pitch',
  enclosure: 'Min enclosure',
};

const GROUP_LABELS: Record<DrcLayerGroup, string> = {
  poly: 'Gate',
  active: 'Active / fins',
  metal: 'Metals',
  cut: 'Contacts & vias',
};

const GROUP_ORDER: readonly DrcLayerGroup[] = ['poly', 'active', 'metal', 'cut'];

const KIND_ORDER: readonly DrcCheckKind[] = ['width', 'spacing', 'pitch', 'enclosure'];

const STATUS_COLOR: Record<string, string> = {
  pass: 'var(--teal)',
  fail: 'var(--red, #dc2626)',
  'no-rule': 'var(--amber, #d97706)',
  invalid: 'var(--amber, #d97706)',
};

/** Keep only kinds the layer actually has a rule for; default back to width. */
function safeKind(layer: DrcLayerSpec | undefined, kind: string): DrcCheckKind {
  const allowed = kindsForLayer(layer);
  return (allowed as readonly string[]).includes(kind) ? (kind as DrcCheckKind) : 'width';
}

function LayerSelect({
  id,
  layers,
  value,
  onChange,
}: {
  id: string;
  layers: readonly DrcLayerSpec[];
  value: string;
  onChange: (v: string) => void;
}) {
  // Layer ids are identical across node families, so the option list never
  // changes with the node; the rule VALUES come from the selected node.
  const renderGroup = (group: DrcLayerGroup) => {
    const groupLayers = layers.filter((layer) => layer.group === group);
    if (groupLayers.length === 0) return null;
    return (
      <optgroup key={group} label={GROUP_LABELS[group]}>
        {groupLayers.map((layer) => (
          <option key={layer.id} value={layer.id}>
            {layer.label}
          </option>
        ))}
      </optgroup>
    );
  };
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {GROUP_ORDER.map(renderGroup)}
    </select>
  );
}

export default function DrcRuleCheckerCalculator() {
  const [quick, setQuick] = useState<QuickCheckState>(INITIAL_QUICK);
  const [extraRows, setExtraRows] = useState<CheckRow[]>([]);
  const [nextRowId, setNextRowId] = useState(1);
  const { copied, copy } = useCopyToClipboard();

  useUrlParamsState(quick, setQuick);

  const nodeId = useId();
  const layerId = useId();
  const kindId = useId();
  const drawnId = useId();

  const nodes = listNodes();
  const node = nodes.find((candidate) => candidate.id === quick.node) ?? nodes[0];
  const layers = listLayers(node.id);
  // No manual useMemo here: the table and the checks are tiny (12 rows, N
  // checks) and recomputing per render is cheaper than fighting the React
  // Compiler's manual-memoization preservation rules over catalog-derived deps.
  const ruleTable = getRuleTable(node.id);

  const updateQuick = <K extends keyof QuickCheckState>(key: K, value: QuickCheckState[K]) => {
    setQuick((prev) => ({ ...prev, [key]: value }));
  };

  // Changing the layer may invalidate the selected kind (e.g. enclosure on a
  // metal). Coerce at every usage site instead of writing back during render;
  // the URL keeps the stale string until the user next touches the select.
  const selectedLayer = layers.find((layer) => layer.id === quick.layer);
  const effectiveKind = safeKind(selectedLayer, quick.kind);

  const checks = [
    { layer: quick.layer, kind: effectiveKind, drawnUm: quick.drawnUm },
    ...extraRows.map((row) => ({ layer: row.layer, kind: row.kind, drawnUm: row.drawnUm })),
  ];

  const report = checkRules({ node: node.id, checks });

  const summaryTone =
    report.summary.fail > 0 ? 'var(--red, #dc2626)' : report.summary.skipped > 0 ? 'var(--amber, #d97706)' : 'var(--teal)';

  const addRow = () => {
    setExtraRows((prev) => [
      ...prev,
      { id: nextRowId, layer: quick.layer, kind: effectiveKind, drawnUm: quick.drawnUm },
    ]);
    setNextRowId((id) => id + 1);
  };

  const removeRow = (id: number) => {
    setExtraRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateExtra = (id: number, patch: Partial<Omit<CheckRow, 'id'>>) => {
    setExtraRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const copySummary = () => {
    const lines = [
      `DRC Rule-of-Thumb Check — ${node.label}:`,
      ...report.results.map((result) => {
        const target = result.ruleUm !== null ? `${fmt(result.ruleUm)} µm` : 'no rule';
        const margin =
          result.marginUm !== null
            ? `margin ${fmt(result.marginUm)} µm, ×${result.ratio !== null ? fmt(result.ratio) : '—'}`
            : result.message;
        return `${result.status.toUpperCase()} ${result.layer} ${result.kind}: drawn ${fmt(result.drawnUm)} µm vs ${target} (${margin})`;
      }),
      `Summary: ${report.summary.pass} pass / ${report.summary.fail} fail / ${report.summary.skipped} skipped of ${report.summary.total}`,
      DRC_DISCLAIMER,
    ];
    void copy(lines.join('\n'));
  };

  const exportCsv = () => {
    downloadCsv(
      `drc-rule-check-${node.id}.csv`,
      ['node', 'layer', 'kind', 'rule_um', 'drawn_um', 'margin_um', 'ratio', 'status'],
      report.results.map((result) => [
        node.id,
        result.layer,
        result.kind,
        result.ruleUm !== null ? result.ruleUm.toFixed(4) : 'N/A',
        Number.isFinite(result.drawnUm) ? result.drawnUm : 'N/A',
        result.marginUm !== null ? result.marginUm.toFixed(4) : 'N/A',
        result.ratio !== null ? result.ratio.toFixed(4) : 'N/A',
        result.status,
      ]),
    );
  };

  const kindOptions = kindsForLayer(selectedLayer);

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="drc-inputs">
        <h2 id="drc-inputs">Process family and quick check</h2>

        <div className="field">
          <label htmlFor={nodeId}>Process node family</label>
          <select id={nodeId} value={node.id} onChange={(e) => updateQuick('node', e.target.value)}>
            {nodes.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <small>{node.note}</small>
        </div>

        <div className="physics-alert" style={{ marginTop: '12px' }}>
          <div className="physics-alert-content">
            <strong>Rule-of-thumb reference only.</strong> {DRC_DISCLAIMER}
          </div>
        </div>

        <div className="field">
          <label htmlFor={layerId}>Quick check — layer</label>
          <LayerSelect id={layerId} layers={layers} value={quick.layer} onChange={(v) => updateQuick('layer', v)} />
        </div>

        <div className="field">
          <label htmlFor={kindId}>Quick check — rule kind</label>
          <select id={kindId} value={effectiveKind} onChange={(e) => updateQuick('kind', e.target.value)}>
            {KIND_ORDER.filter((kind) => kindOptions.includes(kind)).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          {effectiveKind === 'enclosure' && (
            <small>Overlap of the surrounding metal/poly beyond the cut edge.</small>
          )}
        </div>

        <div className="field">
          <label htmlFor={drawnId}>Quick check — drawn value (µm)</label>
          <input
            id={drawnId}
            type="number"
            step="any"
            min={0}
            value={quick.drawnUm}
            onChange={(e) => updateQuick('drawnUm', Number.parseFloat(e.target.value) || 0)}
          />
          <small>
            Drawn == rule passes with zero margin; anything below fails. Currently checked against{' '}
            {selectedLayer ? KIND_LABELS[effectiveKind].toLowerCase() : '—'} of {selectedLayer?.label ?? '—'}.
          </small>
        </div>

        <h3 style={{ margin: '20px 0 8px' }}>More checks (session only)</h3>
        {extraRows.map((row) => (
          <div key={row.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}>
              <label htmlFor={`drc-layer-${row.id}`}>Layer</label>
              <select
                id={`drc-layer-${row.id}`}
                value={row.layer}
                onChange={(e) => {
                  const nextLayer = listLayers(node.id).find((layer) => layer.id === e.target.value);
                  updateExtra(row.id, { layer: e.target.value, kind: safeKind(nextLayer, row.kind) });
                }}
              >
                {GROUP_ORDER.map((group) => {
                  const groupLayers = layers.filter((layer) => layer.group === group);
                  if (groupLayers.length === 0) return null;
                  return (
                    <optgroup key={group} label={GROUP_LABELS[group]}>
                      {groupLayers.map((layer) => (
                        <option key={layer.id} value={layer.id}>
                          {layer.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div className="field" style={{ flex: 1.4, marginBottom: 0 }}>
              <label htmlFor={`drc-kind-${row.id}`}>Kind</label>
              <select
                id={`drc-kind-${row.id}`}
                value={row.kind}
                onChange={(e) => updateExtra(row.id, { kind: e.target.value as DrcCheckKind })}
              >
                {KIND_ORDER.filter((kind) =>
                  kindsForLayer(layers.find((layer) => layer.id === row.layer)).includes(kind),
                ).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor={`drc-drawn-${row.id}`}>Drawn (µm)</label>
              <input
                id={`drc-drawn-${row.id}`}
                type="number"
                step="any"
                min={0}
                value={row.drawnUm}
                onChange={(e) => updateExtra(row.id, { drawnUm: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label={`Remove check ${row.id + 1}`}
              onClick={() => removeRow(row.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={addRow}>
            <Plus size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Add check row
          </button>
        </div>
        <small>
          The quick check above is kept in the URL for sharing; additional rows live only in this browser
          session (not serialized into the link).
        </small>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={copySummary}>
            {copied ? 'Copied!' : 'Copy results'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>
            <Download size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Export CSV
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="drc-results">
        <h2 id="drc-results">Check results — {node.label}</h2>

        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Pass</span>
            <span className="metric-value" style={{ color: 'var(--teal)' }}>
              {report.summary.pass}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Fail</span>
            <span className="metric-value" style={{ color: 'var(--red, #dc2626)' }}>
              {report.summary.fail}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Skipped (no rule / invalid)</span>
            <span className="metric-value" style={{ color: summaryTone }}>
              {report.summary.skipped}
            </span>
            <span className="metric-label">
              {report.summary.total} checks · margin = drawn − rule, pass at margin ≥ 0
            </span>
          </div>
        </div>

        <div className="table-scroll" style={{ marginTop: '12px' }}>
          <table className="model-table">
            <thead>
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Kind</th>
                <th scope="col">Rule (µm)</th>
                <th scope="col">Drawn (µm)</th>
                <th scope="col">Margin (µm)</th>
                <th scope="col">Drawn/rule</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((result, index) => (
                <tr key={`${result.layer}-${result.kind}-${index}`}>
                  <th scope="row">{result.layerLabel ?? (result.layer || '—')}</th>
                  <td>{KIND_LABELS[result.kind]}</td>
                  <td className="mono">{result.ruleUm !== null ? fmt(result.ruleUm) : '—'}</td>
                  <td className="mono">{Number.isFinite(result.drawnUm) ? fmt(result.drawnUm) : '—'}</td>
                  <td className="mono">
                    {result.marginUm !== null
                      ? `${result.marginUm >= 0 ? '+' : ''}${fmt(result.marginUm)}`
                      : '—'}
                  </td>
                  <td className="mono">{result.ratio !== null ? `×${fmt(result.ratio)}` : '—'}</td>
                  <td style={{ color: STATUS_COLOR[result.status], fontWeight: 600 }}>
                    {result.status}
                    {result.message ? '' : result.status === 'pass' ? ' ✓' : result.status === 'fail' ? ' ✗' : ''}
                  </td>
                </tr>
              ))}
              {report.results.length === 0 && (
                <tr>
                  <td colSpan={7}>Add at least one check to see results.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {report.results.some((result) => result.message) && (
          <div className="physics-alert danger" style={{ marginTop: '10px' }}>
            {report.results
              .filter((result) => result.message)
              .map((result, index) => (
                <div key={index}>{result.message}</div>
              ))}
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="drc-table" style={{ gridColumn: '1 / -1' }}>
        <h2 id="drc-table">Typical rule table — {node.label}</h2>
        <div className="table-scroll">
          <table className="model-table">
            <thead>
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Min width (µm)</th>
                <th scope="col">Min spacing (µm)</th>
                <th scope="col">Min pitch (µm)</th>
                <th scope="col">Min enclosure (µm)</th>
                <th scope="col">Min area (µm²)</th>
              </tr>
            </thead>
            <tbody>
              {ruleTable.map((row) => (
                <tr key={row.layerId}>
                  <th scope="row">{row.label}</th>
                  <td className="mono">{fmt(row.widthUm)}</td>
                  <td className="mono">{fmt(row.spacingUm)}</td>
                  <td className="mono">{fmt(row.pitchUm)}</td>
                  <td className="mono">{row.enclosureUm !== null ? fmt(row.enclosureUm) : '—'}</td>
                  <td className="mono">{row.minAreaUm2 !== null ? fmt(row.minAreaUm2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <small>
          Pitch = width + spacing (classic rule of thumb). Enclosure applies to contact/via cuts only;
          min-area values are display-only reminders for tapers — this tool does not check drawn area.
        </small>
      </section>
    </div>
  );
}
