
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { calculateEtch } from '@/lib/etch';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

const INITIAL = {
  beforeNm: '500',
  afterNm: '300',
  timeSeconds: '120',
  maskLossNm: '',
  nominalTimeSeconds: '',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));
/** Optional fields keep an empty box meaning "not measured" rather than zero. */
const optional = (value: string) => (value.trim() === '' ? null : Number(value));

export default function EtchRateCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);

  const [copied, setCopied] = useState(false);
  const g = useGlossary();

  const result = useMemo(
    () =>
      calculateEtch({
        beforeNm: num(state.beforeNm),
        afterNm: num(state.afterNm),
        timeSeconds: num(state.timeSeconds),
        maskLossNm: optional(state.maskLossNm),
        nominalTimeSeconds: optional(state.nominalTimeSeconds),
      }),
    [state],
  );

  const copyResult = async () => {
    if (!result.ok) return;
    const lines = [
      `Thickness before: ${state.beforeNm} nm`,
      `Thickness after: ${state.afterNm} nm`,
      `Etch time: ${state.timeSeconds} s`,
      `Thickness removed: ${fmt(result.removedNm)} nm`,
      `Etch rate: ${fmt(result.rateNmPerMinute)} nm/min`,
      `Remaining fraction: ${fmt(result.remainingPercent)} %`,
    ];
    if (result.selectivity !== null) lines.push(`Selectivity: ${fmt(result.selectivity)}`);
    if (result.overetchPercent !== null) lines.push(`Overetch: ${fmt(result.overetchPercent)} %`);

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
      <section className="panel" aria-labelledby="etch-inputs">
        <h2 id="etch-inputs">Measurement</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="etch-before">
              Thickness before<span className="unit">nm</span>
            </label>
            <input
              id="etch-before"
              type="number"
              min="0"
              step="any"
              value={state.beforeNm}
              onChange={(event) => setState((previous) => ({ ...previous, beforeNm: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="etch-after">
              Thickness after<span className="unit">nm</span>
            </label>
            <input
              id="etch-after"
              type="number"
              min="0"
              step="any"
              value={state.afterNm}
              onChange={(event) => setState((previous) => ({ ...previous, afterNm: event.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="etch-time">
            {g('etchTime')}<span className="unit">s</span>
          </label>
          <input
            id="etch-time"
            type="number"
            min="0"
            step="any"
            value={state.timeSeconds}
            onChange={(event) => setState((previous) => ({ ...previous, timeSeconds: event.target.value }))}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="etch-mask">
              Mask loss<span className="unit">nm, optional</span>
            </label>
            <input
              id="etch-mask"
              type="number"
              min="0"
              step="any"
              placeholder="not measured"
              value={state.maskLossNm}
              onChange={(event) => setState((previous) => ({ ...previous, maskLossNm: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="etch-nominal">
              Nominal time<span className="unit">s, optional</span>
            </label>
            <input
              id="etch-nominal"
              type="number"
              min="0"
              step="any"
              placeholder="not set"
              value={state.nominalTimeSeconds}
              onChange={(event) => setState((previous) => ({ ...previous, nominalTimeSeconds: event.target.value }))}
            />
          </div>
        </div>

        <p className="note">
          Both thickness measurements should come from the same point on the same wafer. Leave the optional fields blank
          and the selectivity and overetch rows are simply not shown.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="etch-result">
        <h2 id="etch-result">{g('etchRate')}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{g('etchRate')}</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.rateNmPerMinute)}
              <span className="result-suffix"> nm/min</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Thickness removed</span>
                <strong>{fmt(result.removedNm)} nm</strong>
              </div>
              <div className="metric">
                <span>{g('etchRate')}</span>
                <strong>{fmt(result.rateNmPerSecond)} nm/s</strong>
              </div>
              <div className="metric">
                <span>Remaining</span>
                <strong>{fmt(result.remainingPercent)} %</strong>
              </div>
              {result.selectivity !== null ? (
                <div className="metric">
                  <span>{g('selectivity')}</span>
                  <strong>{fmt(result.selectivity)} : 1</strong>
                </div>
              ) : null}
              {result.maskRateNmPerMinute !== null ? (
                <div className="metric">
                  <span>Mask etch rate</span>
                  <strong>{fmt(result.maskRateNmPerMinute)} nm/min</strong>
                </div>
              ) : null}
              {result.overetchPercent !== null ? (
                <div className="metric">
                  <span>Overetch</span>
                  <strong>{fmt(result.overetchPercent)} %</strong>
                </div>
              ) : null}
            </div>

            <p className="note">
              The rate is the thickness removed divided by the time, so it is an average over the whole etch. Selectivity
              is the film removed divided by the masking layer removed over the same time; it shifts with pressure, power,
              temperature and load, so compare it only against numbers taken under the same recipe.
            </p>

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy result'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
