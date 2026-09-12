'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateCapability } from '@/lib/capability';
import { useUrlParamsState } from '@/lib/use-url-state';

const UNITS = ['nm', 'µm', 'mm', 'inch', 'mil', 'unitless'];

const INITIAL = { unit: 'µm', lower: '9', upper: '11', mean: '10', sigma: '0.5' };

function parseLimit(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function num(value: number | null, digits = 3): string {
  return value === null || !Number.isFinite(value) ? '—' : value.toFixed(digits);
}

export default function ProcessCapabilityCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const [copied, setCopied] = useState(false);

  const lowerLimit = parseLimit(values.lower);
  const upperLimit = parseLimit(values.upper);
  const mean = values.mean.trim() === '' ? Number.NaN : Number(values.mean);
  const sigma = values.sigma.trim() === '' ? Number.NaN : Number(values.sigma);
  const unit = values.unit;

  const result = useMemo(
    () => calculateCapability({ lowerLimit, upperLimit, mean, sigma }),
    [lowerLimit, upperLimit, mean, sigma],
  );

  const copyResult = async () => {
    if (!result.ok) return;

    const summary = [
      `Unit: ${unit}`,
      `Lower spec limit: ${num(lowerLimit)}`,
      `Upper spec limit: ${num(upperLimit)}`,
      `Process mean: ${num(mean)}`,
      `Process sigma: ${num(sigma)}`,
      `Cp: ${num(result.cp)}`,
      `Cpk: ${num(result.cpk)}`,
      `CPU: ${num(result.cpu)}`,
      `CPL: ${num(result.cpl)}`,
      `Sigma level (3 x Cpk): ${num(result.sigmaLevel)}`,
      `Above USL: ${result.abovePercent.toFixed(4)}%`,
      `Below LSL: ${result.belowPercent.toFixed(4)}%`,
      `Out of spec: ${result.outOfSpecPpm.toFixed(2)} ppm`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="capability-inputs">
        <h2 id="capability-inputs">Specification and process</h2>

        <div className="field">
          <label htmlFor="capability-unit">Measurement unit</label>
          <select
            id="capability-unit"
            value={unit}
            onChange={(event) => setValues((previous) => ({ ...previous, unit: event.target.value }))}
          >
            {UNITS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="capability-lsl">
              Lower spec limit<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-lsl"
              type="number"
              step="any"
              value={values.lower}
              onChange={(event) => setValues((previous) => ({ ...previous, lower: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="capability-usl">
              Upper spec limit<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-usl"
              type="number"
              step="any"
              value={values.upper}
              onChange={(event) => setValues((previous) => ({ ...previous, upper: event.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="capability-mean">
              Process mean<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-mean"
              type="number"
              step="any"
              value={values.mean}
              onChange={(event) => setValues((previous) => ({ ...previous, mean: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="capability-sigma">
              Process sigma<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-sigma"
              type="number"
              min="0"
              step="any"
              value={values.sigma}
              onChange={(event) => setValues((previous) => ({ ...previous, sigma: event.target.value }))}
            />
          </div>
        </div>

        <p className="note">
          Leave one spec limit blank for a one-sided specification. The mean and sigma must be measured on the same
          characteristic and in the same unit as the limits.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="capability-result">
        <h2 id="capability-result">Capability</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Cpk</span>
            <div className="result-value" aria-live="polite">
              {num(result.cpk)}
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Cp (both limits)</span>
                <strong>{num(result.cp)}</strong>
              </div>
              <div className="metric">
                <span>CPU (upper)</span>
                <strong>{num(result.cpu)}</strong>
              </div>
              <div className="metric">
                <span>CPL (lower)</span>
                <strong>{num(result.cpl)}</strong>
              </div>
              <div className="metric">
                <span>Sigma level (3 x Cpk)</span>
                <strong>{num(result.sigmaLevel)}</strong>
              </div>
              <div className="metric">
                <span>Out of spec</span>
                <strong>{result.outOfSpecPpm.toFixed(1)} ppm</strong>
              </div>
              <div className="metric">
                <span>Above USL</span>
                <strong>{result.abovePercent.toFixed(4)}%</strong>
              </div>
              <div className="metric">
                <span>Below LSL</span>
                <strong>{result.belowPercent.toFixed(4)}%</strong>
              </div>
              <div className="metric">
                <span>Z upper / Z lower</span>
                <strong>
                  {num(result.zUpper, 2)} / {num(result.zLower, 2)}
                </strong>
              </div>
            </div>

            <p className="note">
              Cpk is the smaller of CPU and CPL, so it follows the side the process is closest to. The out-of-spec
              figures come from the normal distribution using the sigma you entered.
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
