'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { estimateDies } from '@/lib/wafer';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';
const INITIAL = { diameter: 300, width: 10, height: 10, street: 0.1, edge: 3 };

export default function WaferDieCalculator() {
  const [values, setValues] = useState(INITIAL);
  const [copied, setCopied] = useState(false);
  const g = useGlossary();

  useUrlParamsState(values, setValues);

  const update = (key: keyof typeof INITIAL, value: number) => setValues((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(
    () => estimateDies(values.diameter, values.width, values.height, values.street, values.edge),
    [values],
  );

  const hasErrors = result.errors.length > 0;

  const copyResult = async () => {
    if (hasErrors) {
      return;
    }

    const summary = [
      `Wafer diameter: ${values.diameter} mm`,
      `Die size: ${values.width} x ${values.height} mm`,
      `Street width: ${values.street} mm`,
      `Edge exclusion: ${values.edge} mm`,
      `Estimated usable die: ${result.estimatedUsable}`,
      `Rectangular grid (reference): ${result.gross}`,
      `Effective radius: ${result.radius?.toFixed(2)} mm`,
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
      <section className="panel" aria-labelledby="die-inputs">
        <h2 id="die-inputs">Wafer and die inputs</h2>

        <Num label={g('waferDiameter')} value={values.diameter} unit="mm" onChange={(value) => update('diameter', value)} />

        <div className="form-row">
          <Num label={g('dieWidth')} value={values.width} unit="mm" onChange={(value) => update('width', value)} />
          <Num label={g('dieHeight')} value={values.height} unit="mm" onChange={(value) => update('height', value)} />
        </div>

        <Num label={g('streetWidth')} value={values.street} unit="mm" onChange={(value) => update('street', value)} min={0} />
        <Num label={g('edgeExclusion')} value={values.edge} unit="mm" onChange={(value) => update('edge', value)} min={0} />

        <p className="note">
          All lengths use millimetres. Street width is the scribe lane between two dies; the placement pitch is die size
          plus street width.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="die-result">
        <h2 id="die-result">Estimated result</h2>

        {hasErrors ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Estimated usable die</span>
            <div className="result-value" aria-live="polite">
              {result.estimatedUsable?.toLocaleString()}
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Rectangular grid (reference)</span>
                <strong>{result.gross?.toLocaleString()}</strong>
              </div>
              <div className="metric">
                <span>Die area utilisation</span>
                <strong>{result.utilization?.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Effective radius</span>
                <strong>{result.radius?.toFixed(2)} mm</strong>
              </div>
              <div className="metric">
                <span>Placement pitch</span>
                <strong>
                  {(values.width + values.street).toFixed(2)} × {(values.height + values.street).toFixed(2)} mm
                </strong>
              </div>
            </div>

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

function Num({
  label,
  value,
  unit,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  min?: number;
}) {
  const id = `die-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        <span className="unit">{unit}</span>
      </label>
      <input id={id} type="number" min={min} step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
