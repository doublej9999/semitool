
'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, RotateCcw } from 'lucide-react';

/**
 * One unit a converter can express a value in.
 *
 * `id` is the key the conversion functions use; `label` is what the reader
 * sees, so a unit like the ångström can be shown as "Å" without the maths
 * having to parse a display string.
 */
export interface ConverterUnit {
  id: string;
  label: string;
}

export type ConverterResult =
  | { ok: true; values: Record<string, number> }
  | { ok: false; errors: string[] };

interface UnitConverterProps {
  /** Heading of the input panel. */
  title: string;
  /** Heading of the result panel. */
  resultTitle: string;
  units: readonly ConverterUnit[];
  /** Unit featured as the headline number next to the table. */
  headlineUnit: string;
  initialValue: string;
  initialUnit: string;
  /** Pure conversion; called on every render with the current value and unit. */
  convert: (value: number, unit: string) => ConverterResult;
  /** Extra fields (gas, reference temperature, mode) rendered above the value. */
  controls?: ReactNode;
  /** Explanation rendered under the table. */
  note?: ReactNode;
}

/** Empty input means "nothing typed yet", not zero. */
export function converterNumber(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

/**
 * Fixed point for everyday magnitudes and exponential only when a fixed-point
 * number stops being readable, so a table of sccm, m³/h and mol/min stays
 * legible in every row.
 */
export function formatValue(value: number, significant = 6): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(4);
  return Number(value.toPrecision(significant)).toString();
}

/**
 * Value plus unit in, every supported unit out.
 *
 * The conversion itself lives in `src/lib`, so this component only owns the
 * two things a converter needs: which number and unit went in, and how the
 * answer is laid out. Keeping the maths outside means each converter is
 * testable without a DOM.
 */
export default function UnitConverter({
  title,
  resultTitle,
  units,
  headlineUnit,
  initialValue,
  initialUnit,
  convert,
  controls,
  note,
}: UnitConverterProps) {
  const [raw, setRaw] = useState(initialValue);
  const [unit, setUnit] = useState(initialUnit);
  const [copied, setCopied] = useState(false);

  const result = convert(converterNumber(raw), unit);
  const labelOf = (id: string) => units.find((entry) => entry.id === id)?.label ?? id;
  const headline = units.find((entry) => entry.id === headlineUnit) ?? units[0];

  const copyResult = async () => {
    if (!result.ok) return;

    const lines = [
      `${raw} ${labelOf(unit)}`,
      ...units.map((entry) => `${entry.label}: ${formatValue(result.values[entry.id])}`),
    ];

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
      <section className="panel" aria-labelledby="converter-inputs">
        <h2 id="converter-inputs">{title}</h2>

        {controls}

        <div className="field">
          <label htmlFor="converter-value">Value</label>
          <div className="inline-field">
            <input
              id="converter-value"
              type="number"
              step="any"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
            />
            <select
              aria-label="Value unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              style={{ flex: '0 0 auto', width: 'auto' }}
            >
              {units.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setRaw(initialValue);
              setUnit(initialUnit);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="converter-result">
        <h2 id="converter-result">{resultTitle}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Equal to</span>
            <div className="result-value" aria-live="polite">
              {formatValue(result.values[headline.id])}
              <span className="result-suffix"> {headline.label}</span>
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Unit</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {units.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">{entry.label}</th>
                    <td className="mono">{formatValue(result.values[entry.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {note}

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
