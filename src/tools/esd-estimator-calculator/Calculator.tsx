'use client';

import { useId, useState } from 'react';
import { Download } from 'lucide-react';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { downloadCsv } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import {
  DEVICE_RULES,
  ESD_DISCLAIMER,
  ESD_MODELS,
  estimateEsd,
  suggestSizing,
  type EsdDeviceSpec,
  type EsdPinType,
} from '@/lib/esd-estimator';

/**
 * URL state holds only primitives (useUrlParamsState contract), so the whole
 * estimate — model, device, size, pin type and target class — is shareable as
 * a link, e.g. /tools/esd-estimator-calculator?model=hbm&device=diode&pin=input
 * &sizeUm=100&targetV=2000. Nothing else is serialized; the catalog tables are
 * rebuilt from the static catalog on every load.
 */
interface EstimatorState {
  [key: string]: string | number | boolean;
  model: string;
  device: string;
  pin: string;
  sizeUm: number;
  targetV: number;
}

const INITIAL_STATE: EstimatorState = {
  model: 'hbm',
  device: 'diode',
  pin: 'input',
  sizeUm: 100,
  targetV: 2000,
};

const PIN_OPTIONS: readonly { value: EsdPinType; label: string }[] = [
  { value: 'input', label: 'Input pin' },
  { value: 'output', label: 'Output pin' },
  { value: 'power', label: 'Power pin' },
];

const PASS_COLOR = 'var(--teal)';
const FAIL_COLOR = 'var(--red, #dc2626)';

function safePin(pin: string): EsdPinType {
  return (PIN_OPTIONS.some((option) => option.value === pin) ? pin : 'input') as EsdPinType;
}

/**
 * Schematic of the protection path: bond pad → selected device → supply
 * rails. Purely didactic (symbols are simplified), deterministic and static —
 * it carries no computed numbers.
 */
function EsdSchematic({ device }: { device: EsdDeviceSpec }) {
  const label = {
    diode: 'Schematic: bond pad with a diode pair to the VDD and VSS rails',
    ggnmos: 'Schematic: bond pad into a grounded-gate NMOS discharging to VSS',
    'supply-clamp': 'Schematic: VDD to VSS supply clamp with RC trigger network',
  }[device.type];

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 320 230"
      style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', color: 'inherit' }}
    >
      <title>{label}</title>
      {/* Supply rails */}
      <line x1="30" y1="28" x2="290" y2="28" stroke="currentColor" strokeWidth="2" />
      <text x="30" y="20" fontSize="11" fill="currentColor">VDD</text>
      <line x1="30" y1="202" x2="290" y2="202" stroke="currentColor" strokeWidth="2" />
      <text x="30" y="218" fontSize="11" fill="currentColor">VSS / GND</text>

      {device.type === 'diode' && (
        <g stroke="currentColor" fill="none" strokeWidth="1.5">
          {/* Pad */}
          <circle cx="160" cy="100" r="5" fill="currentColor" />
          <text x="172" y="97" fontSize="11" fill="currentColor" stroke="none">PAD</text>
          {/* D1: pad → VDD (anode pad, cathode VDD) */}
          <line x1="160" y1="95" x2="160" y2="92" />
          <line x1="148" y1="74" x2="172" y2="74" />
          <polygon points="150,92 170,92 160,78" fill="currentColor" stroke="none" />
          <line x1="160" y1="74" x2="160" y2="28" />
          <text x="178" y="88" fontSize="11" fill="currentColor" stroke="none">D1</text>
          {/* D2: VSS → pad (anode VSS, cathode pad) */}
          <line x1="160" y1="105" x2="160" y2="118" />
          <line x1="148" y1="118" x2="172" y2="118" />
          <polygon points="150,136 170,136 160,122" fill="currentColor" stroke="none" />
          <line x1="160" y1="136" x2="160" y2="202" />
          <text x="178" y="132" fontSize="11" fill="currentColor" stroke="none">D2</text>
        </g>
      )}

      {device.type === 'ggnmos' && (
        <g stroke="currentColor" fill="none" strokeWidth="1.5">
          {/* Pad */}
          <circle cx="160" cy="100" r="5" fill="currentColor" />
          <text x="172" y="97" fontSize="11" fill="currentColor" stroke="none">PAD</text>
          {/* Drain → channel → source */}
          <line x1="160" y1="105" x2="160" y2="130" />
          <rect x="152" y="130" width="16" height="44" fill="currentColor" stroke="none" opacity="0.85" />
          <line x1="160" y1="174" x2="160" y2="202" />
          <text x="176" y="155" fontSize="11" fill="currentColor" stroke="none">GGNMOS</text>
          {/* Gate tied to GND */}
          <line x1="152" y1="150" x2="120" y2="150" />
          <line x1="120" y1="150" x2="120" y2="168" />
          <line x1="110" y1="168" x2="130" y2="168" />
          <line x1="114" y1="173" x2="126" y2="173" />
          <line x1="118" y1="178" x2="122" y2="178" />
        </g>
      )}

      {device.type === 'supply-clamp' && (
        <g stroke="currentColor" fill="none" strokeWidth="1.5">
          {/* Clamp FET between the rails */}
          <line x1="200" y1="28" x2="200" y2="70" />
          <rect x="192" y="70" width="16" height="60" fill="currentColor" stroke="none" opacity="0.85" />
          <line x1="200" y1="130" x2="200" y2="202" />
          <text x="214" y="104" fontSize="11" fill="currentColor" stroke="none">Clamp FET</text>
          {/* RC trigger: R from VDD, C to VSS, node drives the gate */}
          <line x1="100" y1="28" x2="100" y2="60" />
          <rect x="94" y="60" width="12" height="40" fill="currentColor" stroke="none" opacity="0.6" />
          <text x="112" y="84" fontSize="11" fill="currentColor" stroke="none">R</text>
          <line x1="100" y1="100" x2="100" y2="120" />
          <line x1="90" y1="126" x2="110" y2="126" />
          <line x1="90" y1="132" x2="110" y2="132" />
          <text x="112" y="134" fontSize="11" fill="currentColor" stroke="none">C</text>
          <line x1="100" y1="132" x2="100" y2="202" />
          <line x1="100" y1="120" x2="170" y2="120" />
          <line x1="170" y1="120" x2="170" y2="100" />
          <line x1="170" y1="100" x2="192" y2="100" />
        </g>
      )}
    </svg>
  );
}

export default function EsdEstimatorCalculator() {
  const [state, setState] = useState<EstimatorState>(INITIAL_STATE);
  const { copied, copy } = useCopyToClipboard();

  useUrlParamsState(state, setState);

  const modelId = useId();
  const deviceId = useId();
  const pinId = useId();
  const sizeId = useId();
  const targetId = useId();

  // Coerce stale URL values at usage time (the URL keeps the stale string
  // until the user next touches the select — same pattern as the DRC checker).
  const model = ESD_MODELS.find((candidate) => candidate.id === state.model) ?? ESD_MODELS[0];
  const device = DEVICE_RULES.find((candidate) => candidate.type === state.device) ?? DEVICE_RULES[0];
  const pin = safePin(state.pin);
  const target =
    model.classLimits.find((level) => level.limitV === state.targetV) ??
    model.classLimits[model.classLimits.length - 1];

  const update = <K extends keyof EstimatorState>(key: K, value: EstimatorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const estimate = estimateEsd({
    model: model.id,
    device: { type: device.type, sizeUm: state.sizeUm },
    pinType: pin,
  });

  const suggestion = suggestSizing({
    model: model.id,
    targetKv: target.limitV / 1000,
    deviceType: device.type,
  });

  const estimateOk = estimate.status === 'ok' && estimate.estimatedV !== null;
  const failingCount = estimate.classPass.filter((row) => !row.pass).length;
  const tone = !estimateOk
    ? 'var(--amber, #d97706)'
    : failingCount > 0
      ? FAIL_COLOR
      : PASS_COLOR;

  const copySummary = () => {
    const classLine = estimate.classPass
      .map((row) => `${row.label} (${row.limitV} V): ${row.pass ? 'PASS' : 'FAIL'}`)
      .join(' · ');
    const lines = [
      `ESD Protection Estimate — ${model.label}:`,
      `Device: ${device.label}, ${fmt(state.sizeUm)} µm (${pin} pin)`,
      `Scaling ${device.constantKvPerUm} kV/µm → HBM-equivalent ${
        estimate.hbmEquivalentKv !== null ? `${fmt(estimate.hbmEquivalentKv)} kV` : '—'
      } → estimated ${estimate.estimatedV !== null ? `${fmt(estimate.estimatedV)} V` : '—'}`,
      `Class targets: ${classLine || '—'}`,
      suggestion
        ? `Suggested size for ${target.label} (${target.limitV} V): ${fmt(suggestion.requiredSizeUm)} µm`
        : '',
      ...estimate.warnings.map((warning) => `Note: ${warning}`),
      ESD_DISCLAIMER,
    ].filter(Boolean);
    void copy(lines.join('\n'));
  };

  const exportCsv = () => {
    downloadCsv(
      `esd-estimate-${model.id}-${device.type}.csv`,
      ['model', 'device', 'pin_type', 'size_um', 'hbm_equivalent_v', 'estimated_v', 'class', 'limit_v', 'margin_v', 'status'],
      estimate.classPass.map((row) => [
        model.id,
        device.type,
        pin,
        estimate.sizeUm !== null ? estimate.sizeUm : 'N/A',
        estimate.hbmEquivalentKv !== null ? Number((estimate.hbmEquivalentKv * 1000).toFixed(3)) : 'N/A',
        estimate.estimatedV !== null ? estimate.estimatedV : 'N/A',
        row.label,
        row.limitV,
        estimate.estimatedV !== null ? Number((estimate.estimatedV - row.limitV).toFixed(3)) : 'N/A',
        row.pass ? 'pass' : 'fail',
      ]),
    );
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="esd-inputs">
        <h2 id="esd-inputs">Model, device and size</h2>

        <div className="field">
          <label htmlFor={modelId}>ESD stress model</label>
          <select id={modelId} value={model.id} onChange={(e) => update('model', e.target.value)}>
            {ESD_MODELS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
          <small>{model.note}</small>
          <small>Pulse: {model.riseNote}</small>
        </div>

        <div className="field">
          <label htmlFor={deviceId}>Protection device</label>
          <select id={deviceId} value={device.type} onChange={(e) => update('device', e.target.value)}>
            {DEVICE_RULES.map((candidate) => (
              <option key={candidate.type} value={candidate.type}>
                {candidate.label}
              </option>
            ))}
          </select>
          <small>{device.sizeLabel} · typical drawn range {device.typicalSizeUm[0]}–{device.typicalSizeUm[1]} µm</small>
        </div>

        <div className="field">
          <label htmlFor={sizeId}>Device size (µm)</label>
          <input
            id={sizeId}
            type="number"
            step="any"
            min={0}
            value={state.sizeUm}
            onChange={(e) => update('sizeUm', Number.parseFloat(e.target.value) || 0)}
          />
          <small>
            {device.label}: {device.constantKvPerUm} kV/µm HBM — {device.rangeNote}
          </small>
        </div>

        <div className="field">
          <label htmlFor={pinId}>Pin type</label>
          <select id={pinId} value={pin} onChange={(e) => update('pin', e.target.value)}>
            {PIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>Pin type drives the warnings, not the scaling: power pins rely on the supply clamp.</small>
        </div>

        <div className="field">
          <label htmlFor={targetId}>Target class (for suggested sizing)</label>
          <select id={targetId} value={target.limitV} onChange={(e) => update('targetV', Number(e.target.value))}>
            {model.classLimits.map((level) => (
              <option key={level.limitV} value={level.limitV}>
                {level.label} — {level.limitV} V
              </option>
            ))}
          </select>
          <small>{model.qualificationNote}</small>
        </div>

        <div className="physics-alert" style={{ marginTop: '12px' }}>
          <div className="physics-alert-content">
            <strong>Rule-of-thumb estimate only.</strong> {ESD_DISCLAIMER}
          </div>
        </div>

        <h3 style={{ margin: '20px 0 8px' }}>Protection path</h3>
        <EsdSchematic device={device} />
        <small>
          Simplified schematic: {device.type === 'diode'
            ? 'D1 conducts positive surges pad → VDD, D2 conducts negative surges VSS → pad.'
            : device.type === 'ggnmos'
              ? 'The snapback NMOS triggers with its gate grounded and discharges the pad into VSS.'
              : 'The RC-triggered clamp dumps chip-level surge current between the power rails.'}
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

      <section className="panel" aria-labelledby="esd-results">
        <h2 id="esd-results">Estimated robustness — {model.label}</h2>

        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Estimated level ({model.id.toUpperCase()})</span>
            <span className="metric-value" style={{ color: tone }}>
              {estimate.estimatedKv !== null ? `${fmt(estimate.estimatedKv)} kV` : '—'}
            </span>
            <span className="metric-label">
              {estimate.estimatedV !== null ? `${fmt(estimate.estimatedV)} V` : 'fix the inputs to estimate'}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">HBM-equivalent (before model conversion)</span>
            <span className="metric-value">{estimate.hbmEquivalentKv !== null ? `${fmt(estimate.hbmEquivalentKv)} kV` : '—'}</span>
            <span className="metric-label">
              {device.constantKvPerUm} kV/µm × {fmt(state.sizeUm)} µm
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Class targets met</span>
            <span className="metric-value" style={{ color: tone }}>
              {estimate.classPass.filter((row) => row.pass).length}/{estimate.classPass.length || model.classLimits.length}
            </span>
            <span className="metric-label">
              {estimateOk ? `pass = estimated V ≥ limit (boundary passes)` : 'estimate unavailable'}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Suggested size for {target.label} ({target.limitV} V)</span>
            <span className="metric-value">{suggestion ? `${fmt(suggestion.requiredSizeUm)} µm` : '—'}</span>
            <span className="metric-label">
              {suggestion
                ? estimateOk && estimate.sizeUm !== null && estimate.sizeUm >= suggestion.requiredSizeUm
                  ? 'current size meets this target'
                  : `current ${fmt(state.sizeUm)} µm → add about ${fmt(
                      Math.max(0, Number((suggestion.requiredSizeUm - state.sizeUm).toFixed(1))),
                    )} µm`
                : 'fix the inputs to size'}
            </span>
          </div>
        </div>

        <div className="table-scroll" style={{ marginTop: '12px' }}>
          <table className="model-table">
            <thead>
              <tr>
                <th scope="col">Class target</th>
                <th scope="col">Limit (V)</th>
                <th scope="col">Estimated (V)</th>
                <th scope="col">Margin (V)</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {estimate.classPass.map((row) => (
                <tr key={row.limitV}>
                  <th scope="row">{row.label}</th>
                  <td className="mono">{fmt(row.limitV)}</td>
                  <td className="mono">{estimate.estimatedV !== null ? fmt(estimate.estimatedV) : '—'}</td>
                  <td className="mono">
                    {estimate.estimatedV !== null
                      ? `${estimate.estimatedV - row.limitV >= 0 ? '+' : ''}${fmt(
                          Number((estimate.estimatedV - row.limitV).toFixed(3)),
                        )}`
                      : '—'}
                  </td>
                  <td style={{ color: row.pass ? PASS_COLOR : FAIL_COLOR, fontWeight: 600 }}>
                    {row.pass ? 'pass ✓' : 'fail ✗'}
                  </td>
                </tr>
              ))}
              {estimate.classPass.length === 0 && (
                <tr>
                  <td colSpan={5}>No estimate — fix the model, device or size above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {estimate.warnings.length > 0 && (
          <div className="physics-alert" style={{ marginTop: '10px' }}>
            <div className="physics-alert-content">
              {estimate.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </div>
        )}

        {suggestion && suggestion.notes.length > 0 && (
          <small style={{ display: 'block', marginTop: '8px' }}>{suggestion.notes.join(' ')}</small>
        )}
      </section>

      <section className="panel" aria-labelledby="esd-catalog" style={{ gridColumn: '1 / -1' }}>
        <h2 id="esd-catalog">Model catalog and scaling rules</h2>
        <div className="table-scroll">
          <table className="model-table">
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Circuit</th>
                <th scope="col">Typical pulse</th>
                <th scope="col">Class targets (V)</th>
                <th scope="col">Severity vs HBM</th>
              </tr>
            </thead>
            <tbody>
              {ESD_MODELS.map((candidate) => (
                <tr key={candidate.id}>
                  <th scope="row">{candidate.label}</th>
                  <td>
                    {candidate.capacitancePf > 0 ? `${candidate.capacitancePf} pF` : 'device package charge'}
                    {candidate.resistanceOhm > 0 ? ` · ${candidate.resistanceOhm} Ω` : ' · ~0 Ω'}
                  </td>
                  <td>{candidate.riseNote}</td>
                  <td className="mono">{candidate.classLimits.map((level) => level.limitV).join(' / ')}</td>
                  <td>
                    ×{candidate.severityFactor} {candidate.id === 'hbm' ? '(reference)' : '(empirical correlation)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-scroll" style={{ marginTop: '12px' }}>
          <table className="model-table">
            <thead>
              <tr>
                <th scope="col">Device</th>
                <th scope="col">Sized dimension</th>
                <th scope="col">HBM constant (kV/µm)</th>
                <th scope="col">Literature range</th>
              </tr>
            </thead>
            <tbody>
              {DEVICE_RULES.map((candidate) => (
                <tr key={candidate.type}>
                  <th scope="row">{candidate.label}</th>
                  <td>{candidate.sizeLabel}</td>
                  <td className="mono">{candidate.constantKvPerUm}</td>
                  <td>{candidate.rangeNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <small>
          All constants are HBM-calibrated rules of thumb for generic logic I/O — not foundry ESD library values. MM
          and CDM rows are severity correlations from HBM, not independent scaling laws.
        </small>
      </section>
    </div>
  );
}
