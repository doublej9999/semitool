'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  LENGTH_UNITS,
  calculateReticleField,
  type LengthUnit,
} from '@/lib/reticle';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  fieldWidth: '26',
  fieldHeight: '33',
  fieldUnit: 'mm' as LengthUnit,
  dieWidth: '5',
  dieHeight: '5',
  dieUnit: 'mm' as LengthUnit,
  scribe: '0.1',
  scribeUnit: 'mm' as LengthUnit,
  waferDiameter: '300',
  waferUnit: 'mm' as LengthUnit,
  edgeExclusion: '3',
  edgeExclusionUnit: 'mm' as LengthUnit,
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

function fmt(value: number, significant = 4): string {
  if (!Number.isFinite(value)) return '---';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(3);
  return Number(value.toPrecision(significant + 2)).toString();
}

export default function ReticleFieldCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const { copied, copy } = useCopyToClipboard();

  const result = useMemo(
    () =>
      calculateReticleField({
        fieldWidth: num(values.fieldWidth),
        fieldHeight: num(values.fieldHeight),
        fieldUnit: values.fieldUnit,
        dieWidth: num(values.dieWidth),
        dieHeight: num(values.dieHeight),
        dieUnit: values.dieUnit,
        scribe: num(values.scribe),
        scribeUnit: values.scribeUnit,
        waferDiameter: num(values.waferDiameter),
        waferUnit: values.waferUnit,
        edgeExclusion: num(values.edgeExclusion),
        edgeExclusionUnit: values.edgeExclusionUnit,
      }),
    [values],
  );

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const copyResult = () => {
    if (!result.ok) return;

    const lines = [
      `Field: ${values.fieldWidth} x ${values.fieldHeight} ${values.fieldUnit}`,
      `Die: ${values.dieWidth} x ${values.dieHeight} ${values.dieUnit}`,
      `Scribe lane: ${values.scribe} ${values.scribeUnit}`,
      `Die pitch: ${fmt(result.pitchXMm)} x ${fmt(result.pitchYMm)} mm`,
      `Dice per field: ${result.diesPerField} (${result.diesPerFieldX} x ${result.diesPerFieldY})`,
      `Field utilisation: ${result.fieldUtilizationPercent.toFixed(2)}%`,
    ];
    if (result.shotsPerWafer !== null) {
      lines.push(`Shots per wafer: ${result.shotsPerWafer}`);
      lines.push(`Dice per wafer (upper bound): ${result.diesPerWaferUpperBound}`);
    }

    void copy(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="reticle-inputs">
        <h2 id="reticle-inputs">Field and die</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="reticle-field-w">Field width</label>
            <div className="inline-field">
              <input
                id="reticle-field-w"
                type="number"
                min="0"
                step="any"
                value={values.fieldWidth}
                onChange={(event) => update('fieldWidth', event.target.value)}
              />
              <select
                aria-label="Field unit, applied to width and height"
                value={values.fieldUnit}
                onChange={(event) => update('fieldUnit', event.target.value as LengthUnit)}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="reticle-field-h">
              Field height<span className="unit">{values.fieldUnit}</span>
            </label>
            <input
              id="reticle-field-h"
              type="number"
              min="0"
              step="any"
              value={values.fieldHeight}
              onChange={(event) => update('fieldHeight', event.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="reticle-die-w">Die width</label>
            <div className="inline-field">
              <input
                id="reticle-die-w"
                type="number"
                min="0"
                step="any"
                value={values.dieWidth}
                onChange={(event) => update('dieWidth', event.target.value)}
              />
              <select
                aria-label="Die unit, applied to width and height"
                value={values.dieUnit}
                onChange={(event) => update('dieUnit', event.target.value as LengthUnit)}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="reticle-die-h">
              Die height<span className="unit">{values.dieUnit}</span>
            </label>
            <input
              id="reticle-die-h"
              type="number"
              min="0"
              step="any"
              value={values.dieHeight}
              onChange={(event) => update('dieHeight', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="reticle-scribe">Scribe lane</label>
          <div className="inline-field">
            <input
              id="reticle-scribe"
              type="number"
              min="0"
              step="any"
              value={values.scribe}
              onChange={(event) => update('scribe', event.target.value)}
            />
            <select
              aria-label="Scribe lane unit"
              value={values.scribeUnit}
              onChange={(event) => update('scribeUnit', event.target.value as LengthUnit)}
              style={{ flex: '0 0 auto', width: 'auto' }}
            >
              {LENGTH_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="reticle-wafer">Wafer diameter</label>
            <div className="inline-field">
              <input
                id="reticle-wafer"
                type="number"
                min="0"
                step="any"
                value={values.waferDiameter}
                onChange={(event) => update('waferDiameter', event.target.value)}
              />
              <select
                aria-label="Wafer diameter unit"
                value={values.waferUnit}
                onChange={(event) => update('waferUnit', event.target.value as LengthUnit)}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="reticle-exclusion">Edge exclusion</label>
            <div className="inline-field">
              <input
                id="reticle-exclusion"
                type="number"
                min="0"
                step="any"
                value={values.edgeExclusion}
                onChange={(event) => update('edgeExclusion', event.target.value)}
              />
              <select
                aria-label="Edge exclusion unit"
                value={values.edgeExclusionUnit}
                onChange={(event) => update('edgeExclusionUnit', event.target.value as LengthUnit)}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="note">
          The scribe lane is added to each die to give the step pitch, so it is counted once between neighbours. The wafer
          section only sets the context for the shot count; clear the diameter to skip it.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="reticle-result">
        <h2 id="reticle-result">Field results</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Dice per field</span>
            <div className="result-value" aria-live="polite">
              {result.diesPerField}
              <span className="result-suffix"> dice</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Shots per wafer</span>
                <strong>{result.shotsPerWafer === null ? '---' : result.shotsPerWafer}</strong>
              </div>
              <div className="metric">
                <span>Dice per wafer (bound)</span>
                <strong>{result.diesPerWaferUpperBound === null ? '---' : result.diesPerWaferUpperBound}</strong>
              </div>
              <div className="metric">
                <span>Field utilisation</span>
                <strong>{result.fieldUtilizationPercent.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Field area</span>
                <strong>{fmt(result.fieldAreaMm2 / 100)} cm&#178;</strong>
              </div>
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Quantity</th>
                  <th scope="col">Value</th>
                  <th scope="col">How it is obtained</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Die pitch X</th>
                  <td className="mono">{fmt(result.pitchXMm)} mm</td>
                  <td className="mono">die width + scribe</td>
                </tr>
                <tr>
                  <th scope="row">Die pitch Y</th>
                  <td className="mono">{fmt(result.pitchYMm)} mm</td>
                  <td className="mono">die height + scribe</td>
                </tr>
                <tr>
                  <th scope="row">Dice per field</th>
                  <td className="mono">{result.diesPerField}</td>
                  <td className="mono">
                    floor(field / pitch) on each axis: {result.diesPerFieldX} &#215; {result.diesPerFieldY}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Field utilisation</th>
                  <td className="mono">{result.fieldUtilizationPercent.toFixed(2)}%</td>
                  <td className="mono">dice &#215; die area / field area</td>
                </tr>
              </tbody>
            </table>

            <p className="note">
              Shots are counted by stepping whole fields across the wafer and keeping the ones whose centre lands inside
              the usable circle, so dice per wafer is an upper bound: fields at the rim do not print a full complement,
              and a real scanner job may use a different stepping plan.
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
