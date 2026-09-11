
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { fromDppm, fromSigma, fromYieldPercent, type YieldDppmResult } from '@/lib/dppm';

type Mode = 'yield' | 'dppm' | 'sigma';

const MODE_LABELS: Record<Mode, string> = {
  yield: 'Yield (%)',
  dppm: 'Defect rate (DPPM)',
  sigma: 'Sigma level',
};

const INITIAL = { mode: 'yield' as Mode, value: '99.865' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function YieldDppmCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const raw = num(state.value);
    if (!Number.isFinite(raw)) return { ok: false as const, errors: ['Enter a value to convert.'] };
    try {
      let converted: YieldDppmResult;
      if (state.mode === 'yield') {
        if (raw < 0 || raw > 100) {
          return { ok: false as const, errors: ['A yield is a percentage, so it must be between 0 and 100.'] };
        }
        converted = fromYieldPercent(raw);
      } else if (state.mode === 'dppm') {
        converted = fromDppm(raw);
      } else {
        converted = fromSigma(raw);
      }
      return { ok: true as const, ...converted };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The value could not be converted.'],
      };
    }
  }, [state.mode, state.value]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'Yield and defect rate',
      `Yield = ${fmt(result.yieldPercent)} %`,
      `Defect rate = ${fmt(result.dppm)} DPPM`,
      `Defect rate = ${fmt(result.dpb)} DPB`,
      `Equivalent sigma = ${result.sigma === null ? 'n/a' : fmt(result.sigma)}`,
      `Cpk equivalent = ${result.cpkEquivalent === null ? 'n/a' : fmt(result.cpkEquivalent)}`,
    ];
  }, [result]);

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
          <label htmlFor="dppm-mode">What do you have?</label>
          <select id="dppm-mode" value={state.mode} onChange={(event) => update('mode', event.target.value as Mode)}>
            {(Object.keys(MODE_LABELS) as Mode[]).map((entry) => (
              <option key={entry} value={entry}>
                {MODE_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dppm-value">{MODE_LABELS[state.mode]}</label>
          <input
            id="dppm-value"
            type="number"
            inputMode="decimal"
            value={state.value}
            onChange={(event) => update('value', event.target.value)}
          />
        </div>
        <p className="note">
          The sigma column is a one-sided normal equivalent, so 3 sigma is 99.865% yield and 1350 DPPM. It is a
          convenience figure, not a claim that the distribution is normal or that the parts are centred.
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
            <span className="unit">Yield</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.yieldPercent)}
              <span className="result-suffix"> %</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Yield</dt>
                <dd>{fmt(result.yieldPercent)} %</dd>
              </div>
              <div>
                <dt>Defect rate</dt>
                <dd>{fmt(result.dppm)} DPPM</dd>
              </div>
              <div>
                <dt>Defect rate</dt>
                <dd>{fmt(result.dpb)} DPB</dd>
              </div>
              <div>
                <dt>Equivalent sigma</dt>
                <dd>{result.sigma === null ? '—' : fmt(result.sigma)}</dd>
              </div>
              <div>
                <dt>Cpk equivalent</dt>
                <dd>{result.cpkEquivalent === null ? '—' : fmt(result.cpkEquivalent)}</dd>
              </div>
            </dl>
            <p className="note">
              Yield and DPPM are the same statement in two units: DPPM = (1 − yield fraction) × 1e6. This tool converts
              the figure you already have; the process capability calculator goes the other way, from limits and a
              distribution to the out-of-spec rate.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
