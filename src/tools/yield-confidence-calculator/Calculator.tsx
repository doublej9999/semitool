'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  CONFIDENCE_LEVELS,
  clopperPearsonInterval,
  sampleSizeForHalfWidth,
  validateIntervalInputs,
  validateSampleSizeInputs,
  wilsonInterval,
  type Interval,
} from '@/lib/confidence';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

const INITIAL_SAMPLE = { total: '720', passes: '697' };
const INITIAL_PLAN = { expectedYield: '96.8', halfWidth: '1' };

function pct(fraction: number, digits = 3): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

function ConfidenceSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {CONFIDENCE_LEVELS.map((level) => (
        <option key={level.label} value={level.confidence}>
          {level.label}
        </option>
      ))}
    </select>
  );
}

function intervalRow(label: string, interval: Interval) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td className="mono">{pct(interval.low)}</td>
      <td className="mono">{pct(interval.high)}</td>
      <td className="mono">{pct((interval.high - interval.low) / 2, 2)}</td>
    </tr>
  );
}

export default function YieldConfidenceCalculator() {
  const [sample, setSample] = useState(INITIAL_SAMPLE);
  useUrlParamsState(sample, setSample);
  const [plan, setPlan] = useState(INITIAL_PLAN);
  useUrlParamsState(plan, setPlan);
  const [confidenceState, setConfidenceState] = useState({ confidence: 0.95 });
  useUrlParamsState(confidenceState, setConfidenceState);
  const confidence = confidenceState.confidence;
  const setConfidence = (value: number) => setConfidenceState({ confidence: value });
  const { copied, copy } = useCopyToClipboard();
  const g = useGlossary();

  const total = sample.total.trim() === '' ? Number.NaN : Number(sample.total);
  const passes = sample.passes.trim() === '' ? Number.NaN : Number(sample.passes);

  const intervalResult = useMemo(() => {
    const errors = validateIntervalInputs(passes, total, confidence);
    if (errors.length > 0) return { ok: false as const, errors };

    return {
      ok: true as const,
      point: passes / total,
      wilson: wilsonInterval(passes, total, confidence),
      exact: clopperPearsonInterval(passes, total, confidence),
    };
  }, [passes, total, confidence]);

  const planResult = useMemo(() => {
    const expectedYield = plan.expectedYield.trim() === '' ? Number.NaN : Number(plan.expectedYield) / 100;
    const halfWidth = plan.halfWidth.trim() === '' ? Number.NaN : Number(plan.halfWidth) / 100;
    const errors = validateSampleSizeInputs(expectedYield, halfWidth, confidence);
    if (errors.length > 0) return { ok: false as const, errors };

    return { ok: true as const, size: sampleSizeForHalfWidth(expectedYield, halfWidth, confidence) };
  }, [plan, confidence]);

  const copyResult = async () => {
    if (!intervalResult.ok) return;

    const summary = [
      `Sample size: ${total}`,
      `Passed: ${passes}`,
      `Point estimate: ${pct(intervalResult.point)}`,
      `Confidence: ${pct(confidence, 1)}`,
      `Wilson interval: ${pct(intervalResult.wilson.low)} to ${pct(intervalResult.wilson.high)}`,
      `Clopper-Pearson interval: ${pct(intervalResult.exact.low)} to ${pct(intervalResult.exact.high)}`,
    ].join('\n');

    await copy(summary);
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="confidence-inputs">
        <h2 id="confidence-inputs">Sample and confidence</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="confidence-total">
              Units tested<span className="unit">count</span>
            </label>
            <input
              id="confidence-total"
              type="number"
              min="1"
              step="1"
              value={sample.total}
              onChange={(event) => setSample((previous) => ({ ...previous, total: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="confidence-passes">
              Units that passed<span className="unit">count</span>
            </label>
            <input
              id="confidence-passes"
              type="number"
              min="0"
              step="1"
              value={sample.passes}
              onChange={(event) => setSample((previous) => ({ ...previous, passes: event.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="confidence-level">{g('confidenceLevel')}</label>
          <ConfidenceSelect id="confidence-level" value={confidence} onChange={setConfidence} />
        </div>

        <p className="note">
          The interval describes a measured pass rate sampling from a large population under the binomial model, so the
          uncertainty comes from sampling only. Process drift and systematic defects are not part of it.
        </p>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSample(INITIAL_SAMPLE);
              setConfidence(0.95);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="confidence-result">
        <h2 id="confidence-result">Interval for a measured yield</h2>

        {!intervalResult.ok ? (
          <div className="error" role="alert">
            {intervalResult.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Point estimate</span>
            <div className="result-value" aria-live="polite">
              {pct(intervalResult.point)}
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Low</th>
                  <th scope="col">High</th>
                  <th scope="col">Half-width</th>
                </tr>
              </thead>
              <tbody>
                {intervalRow('Wilson score', intervalResult.wilson)}
                {intervalRow('Clopper-Pearson', intervalResult.exact)}
              </tbody>
            </table>

            <p className="note">
              Wilson is the usual recommendation; Clopper-Pearson is the exact interval, whose coverage is at least the
              nominal level. Near the middle of the range Clopper-Pearson is the wider of the two; at a 0% or 100%
              result the two can differ slightly. Both are two-sided at the confidence level you picked.
            </p>

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy result'}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="size-inputs">
        <h2 id="size-inputs">How many units do I need?</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="size-yield">
              Expected yield<span className="unit">%</span>
            </label>
            <input
              id="size-yield"
              type="number"
              min="0"
              max="100"
              step="any"
              value={plan.expectedYield}
              onChange={(event) => setPlan((previous) => ({ ...previous, expectedYield: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="size-width">
              Target half-width<span className="unit">points</span>
            </label>
            <input
              id="size-width"
              type="number"
              min="0"
              step="any"
              value={plan.halfWidth}
              onChange={(event) => setPlan((previous) => ({ ...previous, halfWidth: event.target.value }))}
            />
          </div>
        </div>

        <p className="note">
          Planned from the normal approximation, so treat it as a starting point and expect the realised interval to
          differ slightly.
        </p>
      </section>

      <section className="panel" aria-labelledby="size-result">
        <h2 id="size-result">Planned sample size</h2>

        {!planResult.ok ? (
          <div className="error" role="alert">
            {planResult.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Units to test</span>
            <div className="result-value" aria-live="polite">
              {planResult.size.toLocaleString('en-US')}
              <span className="result-suffix"> units</span>
            </div>

            <p className="note">
              At {pct(confidence, 1)} confidence, {planResult.size.toLocaleString('en-US')} units give an interval about
              ±{plan.halfWidth || '0'} points wide around a yield near {plan.expectedYield || '0'}%.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
