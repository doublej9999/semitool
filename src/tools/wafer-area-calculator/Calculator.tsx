'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  DIAMETER_UNITS,
  LENGTH_UNITS,
  calculateWaferArea,
  type DiameterUnit,
  type LengthUnit,
} from '@/lib/wafer-area';

const INITIAL = {
  diameter: '300',
  diameterUnit: 'mm' as DiameterUnit,
  edgeExclusion: '3',
  edgeExclusionUnit: 'mm' as LengthUnit,
  dieWidth: '10',
  dieHeight: '10',
  dieUnit: 'mm' as LengthUnit,
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

function fmt(value: number, significant = 4): string {
  if (!Number.isFinite(value)) return '---';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(3);
  return Number(value.toPrecision(significant + 2)).toString();
}

export default function WaferAreaCalculator() {
  const [values, setValues] = useState(INITIAL);
  const [measured, setMeasured] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      calculateWaferArea({
        diameter: num(values.diameter),
        diameterUnit: values.diameterUnit,
        edgeExclusion: num(values.edgeExclusion),
        edgeExclusionUnit: values.edgeExclusionUnit,
        dieWidth: num(values.dieWidth),
        dieHeight: num(values.dieHeight),
        dieUnit: values.dieUnit,
        dieCount: measured.trim() === '' ? null : Number(measured),
      }),
    [values, measured],
  );

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const copyResult = async () => {
    if (!result.ok) return;

    const lines = [
      `Wafer: ${values.diameter} ${values.diameterUnit}, edge exclusion ${values.edgeExclusion} ${values.edgeExclusionUnit}`,
      `Die: ${values.dieWidth} x ${values.dieHeight} ${values.dieUnit}`,
      `Wafer area: ${fmt(result.waferAreaCm2)} cm2`,
      `Usable area: ${fmt(result.usableAreaCm2)} cm2`,
      `Edge exclusion loss: ${result.edgeLossPercent.toFixed(2)}%`,
      `Die area: ${fmt(result.dieAreaCm2)} cm2`,
      `Area-only die count: ${result.areaOnlyDieCount}`,
    ];
    if (result.utilizationPercent !== null) {
      lines.push(`Measured die count: ${measured} (${result.utilizationPercent.toFixed(2)}% of usable area)`);
    }

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
      <section className="panel" aria-labelledby="wafer-area-inputs">
        <h2 id="wafer-area-inputs">Wafer and die</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="wafer-area-diameter">Wafer diameter</label>
            <div className="inline-field">
              <input
                id="wafer-area-diameter"
                type="number"
                min="0"
                step="any"
                value={values.diameter}
                onChange={(event) => update('diameter', event.target.value)}
              />
              <select
                aria-label="Wafer diameter unit"
                value={values.diameterUnit}
                onChange={(event) => update('diameterUnit', event.target.value as DiameterUnit)}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {DIAMETER_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="wafer-area-exclusion">Edge exclusion</label>
            <div className="inline-field">
              <input
                id="wafer-area-exclusion"
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

        <div className="form-row">
          <div className="field">
            <label htmlFor="wafer-area-die-w">Die width</label>
            <div className="inline-field">
              <input
                id="wafer-area-die-w"
                type="number"
                min="0"
                step="any"
                value={values.dieWidth}
                onChange={(event) => update('dieWidth', event.target.value)}
              />
              <select
                aria-label="Die dimension unit, applied to width and height"
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
            <label htmlFor="wafer-area-die-h">
              Die height<span className="unit">{values.dieUnit}</span>
            </label>
            <input
              id="wafer-area-die-h"
              type="number"
              min="0"
              step="any"
              value={values.dieHeight}
              onChange={(event) => update('dieHeight', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="wafer-area-measured">
            Measured gross die<span className="unit">optional, count</span>
          </label>
          <input
            id="wafer-area-measured"
            type="number"
            min="0"
            step="1"
            value={measured}
            onChange={(event) => setMeasured(event.target.value)}
            placeholder="e.g. 665"
          />
        </div>

        <p className="note">
          The edge exclusion is removed from the radius on every side, so the usable diameter is the wafer diameter
          minus twice the exclusion. Leave the measured count empty to skip the utilisation figures.
        </p>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setValues(INITIAL);
              setMeasured('');
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="wafer-area-result">
        <h2 id="wafer-area-result">Area results</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Area-only die count (upper bound)</span>
            <div className="result-value" aria-live="polite">
              {result.areaOnlyDieCount}
              <span className="result-suffix"> dice</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Wafer area</span>
                <strong>{fmt(result.waferAreaCm2)} cm&#178;</strong>
              </div>
              <div className="metric">
                <span>Usable area</span>
                <strong>{fmt(result.usableAreaCm2)} cm&#178;</strong>
              </div>
              <div className="metric">
                <span>Edge exclusion loss</span>
                <strong>{result.edgeLossPercent.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Die area</span>
                <strong>{fmt(result.dieAreaCm2)} cm&#178;</strong>
              </div>
            </div>

            {result.utilizationPercent !== null ? (
              <div className="metric-grid">
                <div className="metric">
                  <span>Measured dice / usable area</span>
                  <strong>{result.utilizationPercent.toFixed(2)}%</strong>
                </div>
                <div className="metric">
                  <span>Measured vs area bound</span>
                  <strong>{result.packingEfficiencyPercent === null ? '---' : `${result.packingEfficiencyPercent.toFixed(2)}%`}</strong>
                </div>
              </div>
            ) : null}

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
                  <th scope="row">Wafer area</th>
                  <td className="mono">{fmt(result.waferAreaCm2)} cm&#178;</td>
                  <td className="mono">&#960; r&#178;</td>
                </tr>
                <tr>
                  <th scope="row">Usable area</th>
                  <td className="mono">{fmt(result.usableAreaCm2)} cm&#178;</td>
                  <td className="mono">&#960; (r &#8722; e)&#178;</td>
                </tr>
                <tr>
                  <th scope="row">Die area</th>
                  <td className="mono">{fmt(result.dieAreaCm2)} cm&#178;</td>
                  <td className="mono">width &#215; height</td>
                </tr>
                <tr>
                  <th scope="row">Area-only count</th>
                  <td className="mono">{result.areaOnlyDieCount}</td>
                  <td className="mono">floor(usable / die)</td>
                </tr>
              </tbody>
            </table>

            <p className="note">
              The area-only count divides one area by another and ignores that rectangles cannot tile a circle, so it is
              an upper bound rather than a die-per-wafer count. Use the die-per-wafer calculator for a grid layout, or
              enter a measured count for the only figure that reflects the real wafer.
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
