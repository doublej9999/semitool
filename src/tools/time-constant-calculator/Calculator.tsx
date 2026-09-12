
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  SECONDS_PER_UNIT,
  TIME_LABELS,
  TIME_UNITS,
  cornerFrequencyHz,
  riseTime10to90Seconds,
  settleToPointOnePercentSeconds,
  settleToOnePercentSeconds,
  timeConstantSeconds,
  type TimeUnit,
} from '@/lib/time';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const RESISTANCE_UNITS = [
  { id: 'ohm', label: 'Ω', factor: 1 },
  { id: 'kohm', label: 'kΩ', factor: 1e3 },
  { id: 'Mohm', label: 'MΩ', factor: 1e6 },
];

const CAPACITANCE_UNITS = [
  { id: 'F', label: 'F', factor: 1 },
  { id: 'mF', label: 'mF', factor: 1e-3 },
  { id: 'uF', label: 'µF', factor: 1e-6 },
  { id: 'nF', label: 'nF', factor: 1e-9 },
  { id: 'pF', label: 'pF', factor: 1e-12 },
];

const INITIAL = { resistance: '1000', resistanceUnit: 'ohm', capacitance: '1', capacitanceUnit: 'nF' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function TimeConstantCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const rUnit = RESISTANCE_UNITS.find((entry) => entry.id === state.resistanceUnit) ?? RESISTANCE_UNITS[0];
    const cUnit = CAPACITANCE_UNITS.find((entry) => entry.id === state.capacitanceUnit) ?? CAPACITANCE_UNITS[0];
    const r = num(state.resistance) * rUnit.factor;
    const c = num(state.capacitance) * cUnit.factor;

    if (!Number.isFinite(r) || !Number.isFinite(c)) {
      return { ok: false as const, errors: ['Enter both a resistance and a capacitance.'] };
    }
    if (r <= 0) return { ok: false as const, errors: ['Resistance must be greater than 0 Ω.'] };
    if (c <= 0) return { ok: false as const, errors: ['Capacitance must be greater than 0 F.'] };

    const tau = timeConstantSeconds(r, c);
    const byUnit = {} as Record<TimeUnit, number>;
    for (const unit of TIME_UNITS) {
      byUnit[unit] = tau / SECONDS_PER_UNIT[unit];
    }

    return {
      ok: true as const,
      resistanceOhms: r,
      capacitanceFarads: c,
      tau,
      byUnit,
      rise: riseTime10to90Seconds(tau),
      settle1: settleToOnePercentSeconds(tau),
      settle01: settleToPointOnePercentSeconds(tau),
      corner: cornerFrequencyHz(tau),
    };
  }, [state.resistance, state.resistanceUnit, state.capacitance, state.capacitanceUnit]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'RC time constant',
      `R = ${fmt(result.resistanceOhms)} Ω, C = ${fmt(result.capacitanceFarads)} F`,
      `tau = ${fmt(result.tau)} s`,
      ...TIME_UNITS.map((unit) => `  ${TIME_LABELS[unit]}: ${fmt(result.byUnit[unit])}`),
      `10-90% rise = ${fmt(result.rise)} s`,
      `1% settling = ${fmt(result.settle1)} s`,
      `0.1% settling = ${fmt(result.settle01)} s`,
      `-3 dB corner = ${fmt(result.corner)} Hz`,
    ];
  }, [result]);

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="tau-r">Resistance</label>
            <input
              id="tau-r"
              type="number"
              inputMode="decimal"
              value={state.resistance}
              onChange={(event) => update('resistance', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tau-r-unit">Unit</label>
            <select
              id="tau-r-unit"
              value={state.resistanceUnit}
              onChange={(event) => update('resistanceUnit', event.target.value)}
            >
              {RESISTANCE_UNITS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="tau-c">Capacitance</label>
            <input
              id="tau-c"
              type="number"
              inputMode="decimal"
              value={state.capacitance}
              onChange={(event) => update('capacitance', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tau-c-unit">Unit</label>
            <select
              id="tau-c-unit"
              value={state.capacitanceUnit}
              onChange={(event) => update('capacitanceUnit', event.target.value)}
            >
              {CAPACITANCE_UNITS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="note">
          This is the first-order step response v(t) = 1 - exp(-t / tau). A 50 ohm / 1 pF node has tau = 50 ps and a
          corner near 3.2 GHz.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={() => void copy(lines.join('\n'))} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Result</h2>
        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">RC time constant tau</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.tau)}
              <span className="result-suffix"> s</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>tau in ms</dt>
                <dd>{fmt(result.byUnit.ms)} ms</dd>
              </div>
              <div>
                <dt>tau in µs</dt>
                <dd>{fmt(result.byUnit.us)} µs</dd>
              </div>
              <div>
                <dt>tau in ns</dt>
                <dd>{fmt(result.byUnit.ns)} ns</dd>
              </div>
              <div>
                <dt>tau in ps</dt>
                <dd>{fmt(result.byUnit.ps)} ps</dd>
              </div>
              <div>
                <dt>10-90% rise tau ln 9</dt>
                <dd>{fmt(result.rise)} s</dd>
              </div>
              <div>
                <dt>1% settling tau ln 100</dt>
                <dd>{fmt(result.settle1)} s</dd>
              </div>
              <div>
                <dt>0.1% settling tau ln 1000</dt>
                <dd>{fmt(result.settle01)} s</dd>
              </div>
              <div>
                <dt>-3 dB corner 1 / (2 pi tau)</dt>
                <dd>{fmt(result.corner)} Hz</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
