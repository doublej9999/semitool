'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  areaToCm2,
  areaUnitLabel,
  modelYields,
  validateYieldModelInputs,
  type AreaUnit,
} from '@/lib/yield-model';

const INITIAL = { density: 0.5, area: 50, areaUnit: 'mm2' as AreaUnit };

export default function YieldModelCalculator() {
  const [values, setValues] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const { areaCm2, errors, rows } = useMemo(() => {
    const cm2 = areaToCm2(values.area, values.areaUnit);
    const found = validateYieldModelInputs(values.density, cm2);

    return {
      areaCm2: cm2,
      errors: found,
      rows: found.length > 0 ? [] : modelYields(values.density, cm2),
    };
  }, [values]);

  const hasErrors = errors.length > 0;

  const copyResult = async () => {
    if (hasErrors) return;

    const summary = [
      `Defect density: ${values.density} defects/cm2`,
      `Critical area: ${values.area} ${areaUnitLabel(values.areaUnit)} (${areaCm2} cm2)`,
      `Defects per die (AD): ${rows[0]?.ad.toFixed(4)}`,
      ...rows.map((row) => `${row.model.label}: ${row.yieldPercent.toFixed(2)}%`),
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
      <section className="panel" aria-labelledby="yield-model-inputs">
        <h2 id="yield-model-inputs">Defect density and area</h2>

        <div className="field">
          <label htmlFor="model-density">
            Defect density (D0)<span className="unit">defects/cm²</span>
          </label>
          <input
            id="model-density"
            type="number"
            min="0"
            step="any"
            value={values.density}
            onChange={(event) => setValues((previous) => ({ ...previous, density: Number(event.target.value) }))}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="model-area">
              Critical area (A)<span className="unit">{areaUnitLabel(values.areaUnit)}</span>
            </label>
            <input
              id="model-area"
              type="number"
              min="0"
              step="any"
              value={values.area}
              onChange={(event) => setValues((previous) => ({ ...previous, area: Number(event.target.value) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="model-area-unit">Area unit</label>
            <select
              id="model-area-unit"
              value={values.areaUnit}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, areaUnit: event.target.value as AreaUnit }))
              }
            >
              <option value="mm2">mm²</option>
              <option value="cm2">cm²</option>
            </select>
          </div>
        </div>

        <p className="note">
          Critical area is the die area that is sensitive to a killer defect, which is not always the full die area.
          Internally the area is converted to cm² because the models are defined in defects/cm².
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="yield-model-result">
        <h2 id="yield-model-result">Modelled yield</h2>

        {hasErrors ? (
          <div className="error" role="alert">
            {errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Defects per die (AD)</span>
            <div className="result-value" aria-live="polite">
              {rows[0]?.ad.toFixed(4)}
            </div>

            <table className="model-table">
              <caption className="sr-only">Modelled yield by model at the current defect density and critical area</caption>
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Formula</th>
                  <th scope="col">Yield</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.model.id}>
                    <th scope="row">{row.model.label}</th>
                    <td className="mono">{row.model.formula}</td>
                    <td className="mono">{row.yieldPercent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="metric-grid">
              <div className="metric">
                <span>Defect density</span>
                <strong>{values.density} /cm²</strong>
              </div>
              <div className="metric">
                <span>Critical area</span>
                <strong>{areaCm2} cm²</strong>
              </div>
              <div className="metric">
                <span>Spread across models</span>
                <strong>
                  {rows.length > 0
                    ? `${(Math.max(...rows.map((row) => row.yieldPercent)) - Math.min(...rows.map((row) => row.yieldPercent))).toFixed(2)} pp`
                    : '—'}
                </strong>
              </div>
            </div>

            <p className="note">
              With the same AD, Poisson returns the lowest yield and Seeds the highest. The gap widens as the expected
              number of defects per die grows.
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
