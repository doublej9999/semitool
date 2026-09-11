'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { acceptProbability, ocCurve, solveZeroAcceptSample } from '@/lib/sampling';

type Mode = 'evaluate' | 'solve';

const MODE_LABELS: Record<Mode, string> = {
  evaluate: 'Judge a plan',
  solve: 'Find a sample size',
};

const INITIAL = {
  mode: 'evaluate' as Mode,
  lotSize: '1000',
  sampleSize: '50',
  acceptNumber: '1',
  defectPercent: '1',
  ltpdPercent: '5',
  consumerRiskPercent: '10',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));
const optionalNum = (value: string) => (value.trim() === '' ? null : Number(value));

export default function AcceptanceSamplingCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    try {
      const lotSize = optionalNum(state.lotSize);
      if (lotSize !== null && (!Number.isFinite(lotSize) || lotSize < 1)) {
        throw new Error('The lot size must be at least 1, or left blank for an unlimited lot.');
      }
      if (state.mode === 'evaluate') {
        const sampleSize = num(state.sampleSize);
        const acceptNumber = num(state.acceptNumber);
        const defectPercent = num(state.defectPercent);
        if (![sampleSize, acceptNumber, defectPercent].every(Number.isFinite)) {
          throw new Error('Enter the sample size, the acceptance number and the defect rate.');
        }
        const defectFraction = defectPercent / 100;
        const plan = { lotSize, sampleSize, acceptNumber };
        const evaluation = acceptProbability(plan, defectFraction);
        const fractions = [0.25, 0.5, 1, 2, 4].map(
          (multiple) => defectFraction * multiple,
        ).filter((fraction) => fraction <= 1);
        return {
          ok: true as const,
          mode: state.mode,
          ...evaluation,
          defectPercent,
          sampleSize,
          acceptNumber,
          curve: ocCurve(plan, fractions),
        };
      }

      const ltpdPercent = num(state.ltpdPercent);
      const consumerRiskPercent = num(state.consumerRiskPercent);
      if (![ltpdPercent, consumerRiskPercent].every(Number.isFinite)) {
        throw new Error('Enter the defect rate to reject and the consumer risk.');
      }
      const solved = solveZeroAcceptSample({
        defectFraction: ltpdPercent / 100,
        consumerRisk: consumerRiskPercent / 100,
        lotSize,
      });
      return {
        ok: true as const,
        mode: state.mode,
        ...solved,
        ltpdPercent,
        consumerRiskPercent,
      };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The plan could not be evaluated.'],
      };
    }
  }, [
    state.mode,
    state.lotSize,
    state.sampleSize,
    state.acceptNumber,
    state.defectPercent,
    state.ltpdPercent,
    state.consumerRiskPercent,
  ]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    if (result.mode === 'evaluate') {
      const head = [
        'Acceptance plan',
        `Sample = ${fmt(result.sampleSize)}, accept on ${fmt(result.acceptNumber)} or fewer`,
        `Lot size = ${result.defectivesInLot === null ? 'unlimited' : fmt(num(state.lotSize))}`,
        `Distribution = ${result.method}`,
        `Defect rate = ${fmt(result.defectPercent)} %`,
        `Probability of accepting = ${fmt(result.probability)}`,
        `Expected defectives in the sample = ${fmt(result.expectedDefectives)}`,
      ];
      return head.concat(
        result.curve.map(
          (point) =>
            `At ${fmt(point.defectFraction * 100)} % the probability of accepting is ${fmt(point.probability)}`,
        ),
      );
    }
    return [
      'Zero acceptance sample size',
      `Defect rate to reject = ${fmt(result.ltpdPercent)} %`,
      `Consumer risk = ${fmt(result.consumerRiskPercent)} %`,
      `Sample size = ${fmt(result.sampleSize)}`,
      `Achieved probability of accepting = ${fmt(result.achievedProbability)}`,
    ];
  }, [result, state.lotSize]);

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
          <label htmlFor="as-mode">Direction</label>
          <select
            id="as-mode"
            value={state.mode}
            onChange={(event) => update('mode', event.target.value as Mode)}
          >
            {(Object.keys(MODE_LABELS) as Mode[]).map((entry) => (
              <option key={entry} value={entry}>
                {MODE_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="as-lot">Lot size (blank for an unlimited lot)</label>
          <input
            id="as-lot"
            type="number"
            inputMode="decimal"
            value={state.lotSize}
            onChange={(event) => update('lotSize', event.target.value)}
          />
        </div>
        {state.mode === 'evaluate' ? (
          <>
            <div className="field">
              <label htmlFor="as-n">Sample size</label>
              <input
                id="as-n"
                type="number"
                inputMode="decimal"
                value={state.sampleSize}
                onChange={(event) => update('sampleSize', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="as-c">Acceptance number (accept on this many or fewer)</label>
              <input
                id="as-c"
                type="number"
                inputMode="decimal"
                value={state.acceptNumber}
                onChange={(event) => update('acceptNumber', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="as-p">Defect rate (%)</label>
              <input
                id="as-p"
                type="number"
                inputMode="decimal"
                value={state.defectPercent}
                onChange={(event) => update('defectPercent', event.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="as-ltpd">Defect rate to reject (%)</label>
              <input
                id="as-ltpd"
                type="number"
                inputMode="decimal"
                value={state.ltpdPercent}
                onChange={(event) => update('ltpdPercent', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="as-risk">Consumer risk (%)</label>
              <input
                id="as-risk"
                type="number"
                inputMode="decimal"
                value={state.consumerRiskPercent}
                onChange={(event) => update('consumerRiskPercent', event.target.value)}
              />
            </div>
          </>
        )}
        <p className="note">
          The finite lot is accounted for once the sample exceeds a tenth of it, because drawing without
          replacement is less variable than the binomial assumes; the distribution actually used is reported.
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
            <span className="unit">
              {result.mode === 'evaluate' ? 'Probability of accepting' : 'Zero acceptance sample'}
            </span>
            <div className="result-value" aria-live="polite">
              {result.mode === 'evaluate' ? fmt(result.probability) : fmt(result.sampleSize)}
            </div>
            <dl className="metric-grid">
              {result.mode === 'evaluate' ? (
                <>
                  <div>
                    <dt>Distribution used</dt>
                    <dd>{result.method}</dd>
                  </div>
                  <div>
                    <dt>Defectives in the lot</dt>
                    <dd>{result.defectivesInLot === null ? '—' : fmt(result.defectivesInLot)}</dd>
                  </div>
                  <div>
                    <dt>Expected defectives in the sample</dt>
                    <dd>{fmt(result.expectedDefectives)}</dd>
                  </div>
                  <div>
                    <dt>Probability of rejecting</dt>
                    <dd>{fmt(1 - result.probability)}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>Sample size</dt>
                    <dd>{fmt(result.sampleSize)}</dd>
                  </div>
                  <div>
                    <dt>Achieved probability of accepting</dt>
                    <dd>{fmt(result.achievedProbability)}</dd>
                  </div>
                  <div>
                    <dt>Acceptance number</dt>
                    <dd>0</dd>
                  </div>
                </>
              )}
            </dl>
            {result.mode === 'evaluate' ? (
              <table className="model-table">
                <caption>Operating characteristic around the defect rate</caption>
                <thead>
                  <tr>
                    <th scope="col">Defect rate</th>
                    <th scope="col">Probability of accepting</th>
                  </tr>
                </thead>
                <tbody>
                  {result.curve.map((point) => (
                    <tr key={point.defectFraction}>
                      <th scope="row">{fmt(point.defectFraction * 100)} %</th>
                      <td>{fmt(point.probability)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="note">
                Zero acceptance plans are the ones that actually drive a defect rate down: they make the producer
                improve the process rather than rely on the acceptance number. The cost is a larger sample for the
                same protection.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
