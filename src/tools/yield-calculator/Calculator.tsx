'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateYield } from '@/lib/yield';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = { gross: 720, good: 697, defect: 23 };

export default function YieldCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: number) => setValues((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => calculateYield(values.gross, values.good, values.defect), [values]);
  const hasErrors = result.errors.length > 0;

  const copyResult = async () => {
    if (hasErrors) {
      return;
    }

    const summary = [
      `Gross die: ${values.gross}`,
      `Good die: ${values.good}`,
      `Defect die: ${values.defect}`,
      `Yield: ${result.yield?.toFixed(2)}%`,
      `Reject rate: ${result.rejectRate?.toFixed(2)}%`,
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
      <section className="panel" aria-labelledby="yield-inputs">
        <h2 id="yield-inputs">Die counts</h2>

        <Num label="Gross die" value={values.gross} onChange={(value) => update('gross', value)} />
        <Num label="Good die" value={values.good} onChange={(value) => update('good', value)} />
        <Num label="Defect die" value={values.defect} onChange={(value) => update('defect', value)} />

        <p className="note">
          Gross die is the number of die positions considered. Good die plus defect die does not have to equal gross die:
          skipped or unclassified die make up the difference.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="yield-result">
        <h2 id="yield-result">Result</h2>

        {hasErrors ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Yield</span>
            <div className="result-value" aria-live="polite">
              {result.yield?.toFixed(2)}%
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Reject rate</span>
                <strong>{result.rejectRate?.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Good / gross</span>
                <strong>
                  {values.good} / {values.gross}
                </strong>
              </div>
              <div className="metric">
                <span>Defect / gross</span>
                <strong>
                  {values.defect} / {values.gross}
                </strong>
              </div>
              <div className="metric">
                <span>Unclassified die</span>
                <strong>{Math.max(0, values.gross - values.good - values.defect)}</strong>
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

function Num({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = `yield-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        <span className="unit">count</span>
      </label>
      <input id={id} type="number" min="0" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
