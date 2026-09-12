'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateThroughput } from '@/lib/throughput';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  processTimeMin: 2,
  chambers: 2,
  availabilityPercent: 90,
  performancePercent: 95,
  qualityPercent: 97,
};

function rate(value: number): string {
  return value.toFixed(2);
}

export default function ThroughputCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const { copied, copy } = useCopyToClipboard();

  const result = useMemo(() => calculateThroughput(values), [values]);

  const copyResult = async () => {
    if (!result.ok) return;

    const summary = [
      `Process time per wafer: ${values.processTimeMin} min`,
      `Parallel chambers: ${values.chambers}`,
      `Availability: ${values.availabilityPercent}%`,
      `Performance: ${values.performancePercent}%`,
      `Quality: ${values.qualityPercent}%`,
      `Theoretical: ${rate(result.theoreticalWph)} wafers/h`,
      `Effective: ${rate(result.effectiveWph)} wafers/h`,
      `Good output: ${rate(result.goodWph)} wafers/h`,
      `OEE: ${(result.oee * 100).toFixed(2)}%`,
      `Good wafers per day: ${result.goodWafersPerDay.toFixed(1)}`,
    ].join('\n');

    await copy(summary);
  };

  const update = (key: keyof typeof INITIAL, value: string) =>
    setValues((previous) => ({ ...previous, [key]: Number(value) }));

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="throughput-inputs">
        <h2 id="throughput-inputs">Step and equipment</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="throughput-time">
              Process time<span className="unit">min / wafer / chamber</span>
            </label>
            <input
              id="throughput-time"
              type="number"
              min="0"
              step="any"
              value={values.processTimeMin}
              onChange={(event) => update('processTimeMin', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="throughput-chambers">
              Parallel chambers<span className="unit">count</span>
            </label>
            <input
              id="throughput-chambers"
              type="number"
              min="1"
              step="1"
              value={values.chambers}
              onChange={(event) => update('chambers', event.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="throughput-availability">
              Availability<span className="unit">%</span>
            </label>
            <input
              id="throughput-availability"
              type="number"
              min="0"
              max="100"
              step="any"
              value={values.availabilityPercent}
              onChange={(event) => update('availabilityPercent', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="throughput-performance">
              Performance<span className="unit">%</span>
            </label>
            <input
              id="throughput-performance"
              type="number"
              min="0"
              max="100"
              step="any"
              value={values.performancePercent}
              onChange={(event) => update('performancePercent', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="throughput-quality">
            Quality (good output)<span className="unit">%</span>
          </label>
          <input
            id="throughput-quality"
            type="number"
            min="0"
            max="100"
            step="any"
            value={values.qualityPercent}
            onChange={(event) => update('qualityPercent', event.target.value)}
          />
        </div>

        <p className="note">
          Availability, performance and quality are each a percentage of the ideal rate, so OEE here is simply their
          product. Use your own measured values.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="throughput-result">
        <h2 id="throughput-result">Output</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Good output</span>
            <div className="result-value" aria-live="polite">
              {rate(result.goodWph)}
              <span className="result-suffix"> wafers/h</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Theoretical</span>
                <strong>{rate(result.theoreticalWph)} /h</strong>
              </div>
              <div className="metric">
                <span>Effective (A x P)</span>
                <strong>{rate(result.effectiveWph)} /h</strong>
              </div>
              <div className="metric">
                <span>OEE</span>
                <strong>{(result.oee * 100).toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Good wafers / day</span>
                <strong>{result.goodWafersPerDay.toFixed(1)}</strong>
              </div>
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Rate</th>
                  <th scope="col">Wafers / hour</th>
                  <th scope="col">Factor applied</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Theoretical</th>
                  <td className="mono">{rate(result.theoreticalWph)}</td>
                  <td className="mono">60 / time x chambers</td>
                </tr>
                <tr>
                  <th scope="row">Effective</th>
                  <td className="mono">{rate(result.effectiveWph)}</td>
                  <td className="mono">x A x P</td>
                </tr>
                <tr>
                  <th scope="row">Good output</th>
                  <td className="mono">{rate(result.goodWph)}</td>
                  <td className="mono">x A x P x Q</td>
                </tr>
              </tbody>
            </table>

            <p className="note">
              This models one step at its stated rates. A real flow is set by its bottleneck step, so line output is the
              slowest step, not the sum or the average of these numbers.
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
