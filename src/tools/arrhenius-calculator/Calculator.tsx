
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { calculateArrhenius, extractActivationEnergy } from '@/lib/arrhenius';
import { useUrlParamsState } from '@/lib/use-url-state';

const MODES = [
  { id: 'predict', label: 'Predict a rate at a temperature' },
  { id: 'extract', label: 'Extract Ea from two points' },
];

const INITIAL = {
  mode: 'predict',
  prefactor: '0.76',
  activationEnergy: '3.46',
  temperature: '1000',
  temperature2: '1100',
  rate1: '1e-6',
  rate2: '2e-6',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function ArrheniusCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const predict = useMemo(
    () =>
      calculateArrhenius({
        prefactor: num(state.prefactor),
        activationEnergyEv: num(state.activationEnergy),
        temperatureC: num(state.temperature),
      }),
    [state.prefactor, state.activationEnergy, state.temperature],
  );

  const predictSecond = useMemo(
    () =>
      calculateArrhenius({
        prefactor: num(state.prefactor),
        activationEnergyEv: num(state.activationEnergy),
        temperatureC: num(state.temperature2),
      }),
    [state.prefactor, state.activationEnergy, state.temperature2],
  );

  const extract = useMemo(
    () =>
      extractActivationEnergy({
        temperature1C: num(state.temperature),
        rate1: num(state.rate1),
        temperature2C: num(state.temperature2),
        rate2: num(state.rate2),
      }),
    [state.temperature, state.rate1, state.temperature2, state.rate2],
  );

  const lines = useMemo(() => {
    if (state.mode === 'predict') {
      if (!predict.ok) return [];
      const second = predictSecond.ok ? `, ${fmt(predictSecond.rate)} at ${fmt(predictSecond.temperatureK)} K` : '';
      return [
        'Arrhenius rate',
        `Rate = ${fmt(predict.rate)} at ${fmt(predict.temperatureK)} K${second}`,
        `Ea = ${predict.activationEnergyEv} eV, kT = ${fmt(predict.thermalEnergyEv)} eV`,
      ];
    }
    if (!extract.ok) return [];
    return [
      'Activation energy',
      `Ea = ${fmt(extract.activationEnergyEv)} eV`,
      `Prefactor = ${fmt(extract.prefactor)}`,
    ];
  }, [state.mode, predict, predictSecond, extract]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const active = state.mode === 'predict' ? predict : extract;

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="arr-mode">Mode</label>
          <select id="arr-mode" value={state.mode} onChange={(event) => update('mode', event.target.value)}>
            {MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {state.mode === 'predict' ? (
          <>
            <div className="field">
              <label htmlFor="arr-prefactor">Prefactor D0 (units of the rate)</label>
              <input
                id="arr-prefactor"
                type="number"
                inputMode="decimal"
                value={state.prefactor}
                onChange={(event) => update('prefactor', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="arr-ea">Activation energy (eV)</label>
              <input
                id="arr-ea"
                type="number"
                inputMode="decimal"
                value={state.activationEnergy}
                onChange={(event) => update('activationEnergy', event.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="arr-t1">Temperature 1 (C)</label>
                <input
                  id="arr-t1"
                  type="number"
                  inputMode="decimal"
                  value={state.temperature}
                  onChange={(event) => update('temperature', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="arr-t2">Temperature 2 (C)</label>
                <input
                  id="arr-t2"
                  type="number"
                  inputMode="decimal"
                  value={state.temperature2}
                  onChange={(event) => update('temperature2', event.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="field">
                <label htmlFor="arr-t1">Temperature 1 (C)</label>
                <input
                  id="arr-t1"
                  type="number"
                  inputMode="decimal"
                  value={state.temperature}
                  onChange={(event) => update('temperature', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="arr-rate1">Rate 1</label>
                <input
                  id="arr-rate1"
                  type="number"
                  inputMode="decimal"
                  value={state.rate1}
                  onChange={(event) => update('rate1', event.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="arr-t2">Temperature 2 (C)</label>
                <input
                  id="arr-t2"
                  type="number"
                  inputMode="decimal"
                  value={state.temperature2}
                  onChange={(event) => update('temperature2', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="arr-rate2">Rate 2</label>
                <input
                  id="arr-rate2"
                  type="number"
                  inputMode="decimal"
                  value={state.rate2}
                  onChange={(event) => update('rate2', event.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <p className="note">
          The prefactor and the rates keep whatever unit you give them. Only the ratios and the
          activation energy are unit independent.
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
        {state.mode === 'predict' ? (
          !predict.ok ? (
            <div className="error" role="alert">
              {predict.errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          ) : (
            <>
              <span className="unit">Rate at {fmt(predict.temperatureK)} K</span>
              <div className="result-value" aria-live="polite">
                {fmt(predict.rate)}
              </div>
              <dl className="metric-grid">
                <div>
                  <dt>Rate at temperature 2</dt>
                  <dd>{predictSecond.ok ? fmt(predictSecond.rate) : 'check input'}</dd>
                </div>
                <div>
                  <dt>Ratio of the two rates</dt>
                  <dd>
                    {predictSecond.ok ? fmt(predictSecond.rate / predict.rate) : 'check input'}
                  </dd>
                </div>
                <div>
                  <dt>Thermal energy kT</dt>
                  <dd>{fmt(predict.thermalEnergyEv)} eV</dd>
                </div>
                <div>
                  <dt>Exponent -Ea / kT</dt>
                  <dd>{fmt(predict.exponent)}</dd>
                </div>
              </dl>
            </>
          )
        ) : !extract.ok ? (
          <div className="error" role="alert">
            {extract.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Activation energy</span>
            <div className="result-value" aria-live="polite">
              {fmt(extract.activationEnergyEv)}
              <span className="result-suffix"> eV</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Prefactor D0</dt>
                <dd>{fmt(extract.prefactor)}</dd>
              </div>
              <div>
                <dt>Rate ratio r2 / r1</dt>
                <dd>{fmt(extract.rateRatio)}</dd>
              </div>
              <div>
                <dt>Temperature 1</dt>
                <dd>{fmt(extract.temperature1K)} K</dd>
              </div>
              <div>
                <dt>Temperature 2</dt>
                <dd>{fmt(extract.temperature2K)} K</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
