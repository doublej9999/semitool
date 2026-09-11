
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  OXIDE_PRESETS,
  thicknessAfterTime,
  timeToThickness,
  type OxideRegime,
} from '@/lib/oxide';

const MODES = [
  { id: 'grow', label: 'Time to thickness' },
  { id: 'time', label: 'Thickness to time' },
];

const PRESETS = [
  ...OXIDE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
  { id: 'custom', label: 'Custom A and B' },
];

const INITIAL = {
  presetId: 'dry100',
  aUm: '0.165',
  b: '0.0117',
  initialNm: '0',
  mode: 'grow',
  timeHours: '10',
  targetNm: '500',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

const REGIME_LABEL: Record<OxideRegime, string> = {
  linear: 'Linear (reaction limited)',
  mixed: 'Mixed',
  parabolic: 'Parabolic (diffusion limited)',
};

export default function ThermalOxideCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => {
      if (key === 'presetId') {
        const preset = OXIDE_PRESETS.find((entry) => entry.id === value);
        if (!preset) return { ...previous, [key]: value };
        return { ...previous, [key]: value, aUm: String(preset.aUm), b: String(preset.bUm2PerHour) };
      }
      return { ...previous, [key]: value };
    });

  const aUmValue = num(state.aUm);
  const bUm2PerHourValue = num(state.b);
  const initialUmValue = num(state.initialNm) / 1000;

  const grow = useMemo(
    () => thicknessAfterTime({ aUm: aUmValue, bUm2PerHour: bUm2PerHourValue, initialUm: initialUmValue, timeHours: num(state.timeHours) }),
    [aUmValue, bUm2PerHourValue, initialUmValue, state.timeHours],
  );

  const time = useMemo(
    () => timeToThickness({ aUm: aUmValue, bUm2PerHour: bUm2PerHourValue, initialUm: initialUmValue, thicknessUm: num(state.targetNm) / 1000 }),
    [aUmValue, bUm2PerHourValue, initialUmValue, state.targetNm],
  );

  const active = state.mode === 'grow' ? grow : time;

  const lines = useMemo(() => {
    if (!active.ok) return [];
    if (state.mode === 'grow' && grow.ok) {
      return [
        'Deal-Grove thermal oxidation',
        `A = ${fmt(grow.aUm)} um, B = ${fmt(grow.bUm2PerHour)} um2/h`,
        `Thickness = ${fmt(grow.thicknessUm * 1000)} nm after ${fmt(num(state.timeHours))} h`,
        `Silicon consumed = ${fmt(grow.siliconConsumedUm * 1000)} nm`,
      ];
    }
    if (time.ok) {
      return [
        'Deal-Grove thermal oxidation',
        `A = ${fmt(time.aUm)} um, B = ${fmt(time.bUm2PerHour)} um2/h`,
        `Time = ${fmt(time.timeHours)} h for ${fmt(time.thicknessUm * 1000)} nm`,
        `Silicon consumed = ${fmt(time.siliconConsumedUm * 1000)} nm`,
      ];
    }
    return [];
  }, [active, state.mode, state.timeHours, grow, time]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="ox-preset">Rate constants at the process temperature</label>
          <select
            id="ox-preset"
            value={state.presetId}
            onChange={(event) => update('presetId', event.target.value)}
          >
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="ox-a">A (um)</label>
            <input
              id="ox-a"
              type="number"
              inputMode="decimal"
              value={state.aUm}
              onChange={(event) => update('aUm', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ox-b">B (um2/h)</label>
            <input
              id="ox-b"
              type="number"
              inputMode="decimal"
              value={state.b}
              onChange={(event) => update('b', event.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ox-initial">Oxide already present (nm)</label>
          <input
            id="ox-initial"
            type="number"
            inputMode="decimal"
            value={state.initialNm}
            onChange={(event) => update('initialNm', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ox-mode">Direction</label>
          <select id="ox-mode" value={state.mode} onChange={(event) => update('mode', event.target.value)}>
            {MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
        {state.mode === 'grow' ? (
          <div className="field">
            <label htmlFor="ox-time">Oxidation time (h)</label>
            <input
              id="ox-time"
              type="number"
              inputMode="decimal"
              value={state.timeHours}
              onChange={(event) => update('timeHours', event.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ox-target">Target thickness (nm)</label>
            <input
              id="ox-target"
              type="number"
              inputMode="decimal"
              value={state.targetNm}
              onChange={(event) => update('targetNm', event.target.value)}
            />
          </div>
        )}
        <p className="note">
          A and B depend on temperature, ambient and crystal orientation. The presets are the classic
          values for a (100) wafer at 1000 C; for anything else, enter the constants for the
          temperature you are running.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={copy} disabled={!active.ok}>
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
        {!active.ok ? (
          <div className="error" role="alert">
            {active.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">
              {state.mode === 'grow' ? 'Oxide thickness' : 'Oxidation time'}
            </span>
            <div className="result-value" aria-live="polite">
              {state.mode === 'grow' && grow.ok
                ? fmt(grow.thicknessUm * 1000)
                : time.ok
                  ? fmt(time.timeHours)
                  : '--'}
              <span className="result-suffix">
                {state.mode === 'grow' ? ' nm' : ' h'}
              </span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Linear rate B / A</dt>
                <dd>{fmt(active.linearRateUmPerHour)} um/h</dd>
              </div>
              <div>
                <dt>Crossover A / 2</dt>
                <dd>{fmt(active.crossoverUm)} um</dd>
              </div>
              <div>
                <dt>Regime at this thickness</dt>
                <dd>{REGIME_LABEL[active.regime]}</dd>
              </div>
              <div>
                <dt>Offset tau from the initial oxide</dt>
                <dd>{fmt(active.tauHours)} h</dd>
              </div>
              <div>
                <dt>Growth in this step</dt>
                <dd>{fmt(active.growthUm * 1000)} nm</dd>
              </div>
              <div>
                <dt>Silicon consumed</dt>
                <dd>{fmt(active.siliconConsumedUm * 1000)} nm</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
