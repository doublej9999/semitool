'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  areaToCm2,
  areaUnitLabel,
  modelDefectDensities,
  validateDensityInversionInputs,
  type AreaUnit,
} from '@/lib/yield-model';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useGlossary } from '@/lib/i18n/glossary';

const INITIAL = { yieldPercent: 85, area: 50, areaUnit: 'mm2' as AreaUnit };

export default function DefectDensityCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const { copied, copy } = useCopyToClipboard();
  const g = useGlossary();

  const { areaCm2, errors, rows } = useMemo(() => {
    const cm2 = areaToCm2(values.area, values.areaUnit);
    const found = validateDensityInversionInputs(values.yieldPercent, cm2);

    return {
      areaCm2: cm2,
      errors: found,
      rows: found.length > 0 ? [] : modelDefectDensities(values.yieldPercent, cm2),
    };
  }, [values]);

  const hasErrors = errors.length > 0;
  const poisson = rows.find((row) => row.model.id === 'poisson');

  const copyResult = () => {
    if (hasErrors) return;

    const summary = [
      `Measured yield: ${values.yieldPercent}%`,
      `Critical area: ${values.area} ${areaUnitLabel(values.areaUnit)} (${areaCm2} cm2)`,
      ...rows.map(
        (row) => `${row.model.label}: D0 = ${row.defectDensityPerCm2.toFixed(4)} defects/cm2 (AD = ${row.ad.toFixed(4)})`,
      ),
    ].join('\n');

    void copy(summary);
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="density-inputs">
        <h2 id="density-inputs">Measured yield and area</h2>

        <div className="field">
          <label htmlFor="density-yield">
            Measured yield<span className="unit">%</span>
          </label>
          <input
            id="density-yield"
            type="number"
            min="0"
            max="100"
            step="any"
            value={values.yieldPercent}
            onChange={(event) =>
              setValues((previous) => ({ ...previous, yieldPercent: Number(event.target.value) }))
            }
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="density-area">
              Critical area (A)<span className="unit">{areaUnitLabel(values.areaUnit)}</span>
            </label>
            <input
              id="density-area"
              type="number"
              min="0"
              step="any"
              value={values.area}
              onChange={(event) => setValues((previous) => ({ ...previous, area: Number(event.target.value) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="density-area-unit">Area unit</label>
            <select
              id="density-area-unit"
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
          Use the die yield from your own sort data, and the area that is actually sensitive to defects. A yield of 100%
          returns a defect density of zero in every model, and 0% has no finite answer, so it is rejected.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="density-result">
        <h2 id="density-result">Implied defect density</h2>

        {hasErrors ? (
          <div className="error" role="alert">
            {errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">D0 — Poisson</span>
            <div className="result-value" aria-live="polite">
              {poisson?.defectDensityPerCm2.toFixed(4)}
              <span className="result-suffix"> /cm²</span>
            </div>

            <table className="model-table">
              <caption className="sr-only">
                Defect density implied by the measured yield, by model
              </caption>
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Defects per die</th>
                  <th scope="col">{g('defectDensityLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.model.id}>
                    <th scope="row">{row.model.label}</th>
                    <td className="mono">{row.ad.toFixed(4)}</td>
                    <td className="mono">{row.defectDensityPerCm2.toFixed(4)} /cm²</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="metric-grid">
              <div className="metric">
                <span>Measured yield</span>
                <strong>{values.yieldPercent}%</strong>
              </div>
              <div className="metric">
                <span>Critical area</span>
                <strong>{areaCm2} cm²</strong>
              </div>
              <div className="metric">
                <span>Defect density / mm²</span>
                <strong>
                  {poisson ? `${(poisson.defectDensityPerCm2 / 100).toFixed(6)} /mm²` : '—'}
                </strong>
              </div>
            </div>

            <p className="note">
              A higher assumed defect density is needed for the same yield when the critical area shrinks, so always read
              D0 together with the area it was derived from.
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
