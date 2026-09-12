
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  gammaFromReturnLossDb,
  gammaFromVswr,
  mismatchLossDb,
  reflectedFraction,
  returnLossDbFromGamma,
  transmittedFraction,
  vswrFromGamma,
} from '@/lib/rf';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

type Mode = 'returnLoss' | 'gamma' | 'vswr';

const MODE_LABELS: Record<Mode, string> = {
  returnLoss: 'Return loss (dB)',
  gamma: 'Reflection coefficient |Γ|',
  vswr: 'VSWR',
};

const INITIAL = { mode: 'returnLoss' as Mode, value: '20' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function ReturnLossCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const raw = num(state.value);
    if (!Number.isFinite(raw)) return { ok: false as const, errors: ['Enter a value to convert.'] };

    let gamma: number;
    if (state.mode === 'returnLoss') {
      if (raw < 0) return { ok: false as const, errors: ['A passive load has a return loss of 0 dB or more.'] };
      gamma = gammaFromReturnLossDb(raw);
    } else if (state.mode === 'gamma') {
      gamma = Math.abs(raw);
    } else {
      if (raw < 1) return { ok: false as const, errors: ['VSWR is 1 or more for a passive load.'] };
      gamma = gammaFromVswr(raw);
    }

    if (gamma >= 1) {
      return {
        ok: false as const,
        errors: ['|Γ| must be below 1 for a passive load: at 1 the load reflects everything and VSWR is infinite.'],
      };
    }

    return {
      ok: true as const,
      gamma,
      returnLossDb: returnLossDbFromGamma(gamma),
      vswr: vswrFromGamma(gamma),
      mismatchLossDb: mismatchLossDb(gamma),
      reflectedPercent: reflectedFraction(gamma) * 100,
      deliveredPercent: transmittedFraction(gamma) * 100,
    };
  }, [state.mode, state.value]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'Return loss and mismatch',
      `Return loss = ${fmt(result.returnLossDb)} dB`,
      `Reflection coefficient |Γ| = ${fmt(result.gamma)}`,
      `VSWR = ${fmt(result.vswr)}`,
      `Mismatch loss = ${fmt(result.mismatchLossDb)} dB`,
      `Reflected = ${fmt(result.reflectedPercent)} %`,
      `Delivered = ${fmt(result.deliveredPercent)} %`,
    ];
  }, [result]);

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="rl-mode">What do you have?</label>
          <select id="rl-mode" value={state.mode} onChange={(event) => update('mode', event.target.value as Mode)}>
            {(Object.keys(MODE_LABELS) as Mode[]).map((entry) => (
              <option key={entry} value={entry}>
                {MODE_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rl-value">{MODE_LABELS[state.mode]}</label>
          <input
            id="rl-value"
            type="number"
            inputMode="decimal"
            value={state.value}
            onChange={(event) => update('value', event.target.value)}
          />
        </div>
        <p className="note">
          Return loss uses 20 log10 |Γ| because the reflection coefficient is an amplitude, while mismatch loss uses
          10 log10 of a power ratio. A perfect match is infinite return loss, |Γ| = 0 and VSWR = 1.
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
            <span className="unit">Return loss</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.returnLossDb)}
              <span className="result-suffix"> dB</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Reflection coefficient |Γ|</dt>
                <dd>{fmt(result.gamma)}</dd>
              </div>
              <div>
                <dt>VSWR</dt>
                <dd>{fmt(result.vswr)}</dd>
              </div>
              <div>
                <dt>Mismatch loss</dt>
                <dd>{fmt(result.mismatchLossDb)} dB</dd>
              </div>
              <div>
                <dt>Reflected power</dt>
                <dd>{fmt(result.reflectedPercent)} %</dd>
              </div>
              <div>
                <dt>Delivered power</dt>
                <dd>{fmt(result.deliveredPercent)} %</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
