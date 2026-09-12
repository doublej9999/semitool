
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { calculateDiffusion } from '@/lib/diffusion';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';

const TIME_UNITS = [
  { id: 's', label: 'seconds', seconds: 1 },
  { id: 'min', label: 'minutes', seconds: 60 },
  { id: 'h', label: 'hours', seconds: 3600 },
];

const INITIAL = { diffusivity: '1e-13', time: '3600', timeUnit: 's' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function DiffusionLengthCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy: copyResult } = useCopyToClipboard();

  const unit = TIME_UNITS.find((entry) => entry.id === state.timeUnit) ?? TIME_UNITS[0];
  const timeSeconds = num(state.time) * unit.seconds;

  const result = useMemo(
    () => calculateDiffusion({ diffusivityCm2PerS: num(state.diffusivity), timeSeconds }),
    [state.diffusivity, timeSeconds],
  );

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'Diffusion length',
      `D = ${fmt(result.diffusivityCm2PerS)} cm2/s`,
      `t = ${fmt(result.timeSeconds)} s`,
      `Thermal budget D t = ${fmt(result.budgetCm2)} cm2 = ${fmt(result.budgetUm2)} um2`,
      `Characteristic length sqrt(D t) = ${fmt(result.characteristicLengthUm)} um`,
      `erfc length 2 sqrt(D t) = ${fmt(result.erfcLengthUm)} um`,
      `Gaussian sigma sqrt(2 D t) = ${fmt(result.gaussianSigmaUm)} um`,
    ];
  }, [result]);

  const copy = () => {
    void copyResult(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="diff-d">Diffusivity D (cm2/s)</label>
          <input
            id="diff-d"
            type="number"
            inputMode="decimal"
            value={state.diffusivity}
            onChange={(event) => update('diffusivity', event.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="diff-time">Time</label>
            <input
              id="diff-time"
              type="number"
              inputMode="decimal"
              value={state.time}
              onChange={(event) => update('time', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="diff-unit">Unit</label>
            <select
              id="diff-unit"
              value={state.timeUnit}
              onChange={(event) => update('timeUnit', event.target.value)}
            >
              {TIME_UNITS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="note">
          The diffusivity is the value at the process temperature. Use the Arrhenius calculator to
          get it from a prefactor and an activation energy.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={copy} disabled={!result.ok}>
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
            <span className="unit">Characteristic diffusion length sqrt(D t)</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.characteristicLengthUm)}
              <span className="result-suffix"> um</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Characteristic length sqrt(D t)</dt>
                <dd>{fmt(result.characteristicLengthUm * 1000)} nm</dd>
              </div>
              <div>
                <dt>erfc length 2 sqrt(D t)</dt>
                <dd>{fmt(result.erfcLengthUm)} um</dd>
              </div>
              <div>
                <dt>Gaussian sigma sqrt(2 D t)</dt>
                <dd>{fmt(result.gaussianSigmaUm)} um</dd>
              </div>
              <div>
                <dt>Thermal budget D t</dt>
                <dd>{fmt(result.budgetCm2)} cm2</dd>
              </div>
              <div>
                <dt>Same budget</dt>
                <dd>{fmt(result.budgetUm2)} um2</dd>
              </div>
              <div>
                <dt>Same budget</dt>
                <dd>{fmt(result.budgetNm2)} nm2</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
