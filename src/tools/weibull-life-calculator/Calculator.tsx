'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { fitWeibull, weibullReliability, weibullUnreliability } from '@/lib/weibull';

const SAMPLE = ['50', '100', '150', '200', '250', '300'].join('\n');

const INITIAL = { times: SAMPLE, missionHours: '100' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Parse one failure time per line, ignoring blanks and # comments. */
function parseTimes(text: string): number[] {
  const times: number[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      throw new Error(`Line ${index + 1} is not a failure time: "${trimmed}".`);
    }
    times.push(value);
  });
  return times;
}

export default function WeibullLifeCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    try {
      const times = parseTimes(state.times);
      const fit = fitWeibull(times);
      const missionHours = num(state.missionHours);
      const reliability = Number.isFinite(missionHours)
        ? weibullReliability(missionHours, fit.beta, fit.etaHours)
        : null;
      return { ok: true as const, ...fit, missionHours, reliability };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The data could not be fitted.'],
      };
    }
  }, [state.times, state.missionHours]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'Weibull fit (median rank)',
      `Failures fitted = ${result.count}`,
      `Shape beta = ${fmt(result.beta)}`,
      `Scale eta = ${fmt(result.etaHours)} h`,
      `Fit correlation = ${fmt(result.rSquared)}`,
      `MTBF = ${fmt(result.mtbfHours)} h`,
      `B1 = ${fmt(result.b1Hours)} h`,
      `B10 = ${fmt(result.b10Hours)} h`,
      `B50 = ${fmt(result.b50Hours)} h`,
    ];
    if (result.reliability !== null) {
      head.push(`Reliability at ${fmt(result.missionHours)} h = ${fmt(result.reliability)}`);
    }
    return head;
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

  const weakFit = result.ok && result.rSquared < 0.9;

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="wb-times">Failure times in hours, one per line</label>
          <textarea
            id="wb-times"
            rows={8}
            spellCheck={false}
            value={state.times}
            onChange={(event) => update('times', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="wb-mission">Mission time for R(t) (h)</label>
          <input
            id="wb-mission"
            type="number"
            inputMode="decimal"
            value={state.missionHours}
            onChange={(event) => update('missionHours', event.target.value)}
          />
        </div>
        <p className="note">
          Times are sorted before fitting, so any order works. Lines starting with # are ignored. Every unit is
          treated as a failure: run-out or suspended units would need a censored estimator, which this fit is not.
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
            <span className="unit">Shape parameter β</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.beta)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Scale parameter η</dt>
                <dd>{fmt(result.etaHours)} h</dd>
              </div>
              <div>
                <dt>Fit correlation</dt>
                <dd>{fmt(result.rSquared)}</dd>
              </div>
              <div>
                <dt>MTBF</dt>
                <dd>{fmt(result.mtbfHours)} h</dd>
              </div>
              <div>
                <dt>B1 life</dt>
                <dd>{fmt(result.b1Hours)} h</dd>
              </div>
              <div>
                <dt>B10 life</dt>
                <dd>{fmt(result.b10Hours)} h</dd>
              </div>
              <div>
                <dt>B50 life</dt>
                <dd>{fmt(result.b50Hours)} h</dd>
              </div>
              {result.reliability !== null ? (
                <div>
                  <dt>Reliability at {fmt(result.missionHours)} h</dt>
                  <dd>{fmt(result.reliability)}</dd>
                </div>
              ) : null}
              {result.reliability !== null ? (
                <div>
                  <dt>Unreliability at {fmt(result.missionHours)} h</dt>
                  <dd>{fmt(weibullUnreliability(result.missionHours, result.beta, result.etaHours))}</dd>
                </div>
              ) : null}
            </dl>
            <p className="note">
              β below 1 means infant mortality, near 1 is a random failure rate, and above 1 means wear out. This
              data fits β = {fmt(result.beta)}.
            </p>
            {weakFit ? (
              <p className="note">
                The correlation is only {fmt(result.rSquared)}, so the points do not fall on a straight line well.
                A Weibull assumption is weakly supported here and the B life figures should be treated as
                indicative.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
