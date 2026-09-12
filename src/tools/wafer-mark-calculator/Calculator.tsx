'use client';

import { useMemo, useState } from 'react';
import { Copy, Eraser, RotateCcw } from 'lucide-react';
import { generateMark, type DateFormat } from '@/lib/marking';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  lotId: 'ABC123',
  waferNumber: '7',
  productId: 'XYZ001',
  layer: 'M5',
  date: '2026-09-10',
  digits: 2,
  dateFormat: 'YYMMDD' as DateFormat,
  separator: '-',
  uppercase: true,
};

const EMPTY = { ...INITIAL, lotId: '', waferNumber: '', productId: '', layer: '' };

const TEXT_FIELDS: { key: 'lotId' | 'waferNumber' | 'productId' | 'layer' | 'date'; label: string; type: string }[] = [
  { key: 'lotId', label: 'Lot ID', type: 'text' },
  { key: 'waferNumber', label: 'Wafer number', type: 'text' },
  { key: 'productId', label: 'Product ID', type: 'text' },
  { key: 'layer', label: 'Layer', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
];

export default function WaferMarkCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const { copied, copy } = useCopyToClipboard();

  const result = useMemo(() => generateMark(values), [values]);

  const update = (key: string, value: string | number | boolean) => setValues((previous) => ({ ...previous, [key]: value }));

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="mark-inputs">
        <h2 id="mark-inputs">Mark inputs</h2>

        {TEXT_FIELDS.map(({ key, label, type }) => (
          <div className="field" key={key}>
            <label htmlFor={`mark-${key}`}>{label}</label>
            <input
              id={`mark-${key}`}
              type={type}
              value={values[key]}
              onChange={(event) => update(key, event.target.value)}
            />
          </div>
        ))}

        <h2>Format</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="mark-digits">
              Wafer number digits<span className="unit">1–6</span>
            </label>
            <input
              id="mark-digits"
              type="number"
              min={1}
              max={6}
              value={values.digits}
              onChange={(event) => update('digits', Number(event.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="mark-separator">
              Separator<span className="unit">characters</span>
            </label>
            <input
              id="mark-separator"
              maxLength={2}
              value={values.separator}
              onChange={(event) => update('separator', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="mark-date-format">Date format</label>
          <select
            id="mark-date-format"
            value={values.dateFormat}
            onChange={(event) => update('dateFormat', event.target.value as DateFormat)}
          >
            <option value="YYMMDD">YYMMDD (e.g. 260910)</option>
            <option value="YYMM">YYMM (e.g. 2609)</option>
            <option value="YYYYMMDD">YYYYMMDD (e.g. 20260910)</option>
          </select>
        </div>

        <div className="field field-inline">
          <input
            id="mark-uppercase"
            type="checkbox"
            checked={values.uppercase}
            onChange={(event) => update('uppercase', event.target.checked)}
          />
          <label htmlFor="mark-uppercase">Uppercase output</label>
        </div>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
          <button className="button secondary" type="button" onClick={() => setValues(EMPTY)}>
            <Eraser size={14} aria-hidden="true" /> Clear
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="mark-result">
        <h2 id="mark-result">Generated mark</h2>

        {result.errors.length > 0 ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : null}

        <span className="unit">Wafer mark</span>
        <div className="result-value" aria-live="polite">
          {result.mark || '—'}
        </div>

        <div className="metric-grid">
          <div className="metric">
            <span>Characters</span>
            <strong>{result.characters}</strong>
          </div>
          <div className="metric">
            <span>Wafer number padded</span>
            <strong>{result.errors.length === 0 ? values.waferNumber.padStart(values.digits, '0') : '—'}</strong>
          </div>
          <div className="metric">
            <span>Separator</span>
            <strong>{values.separator === '' ? '(none)' : `“${values.separator}”`}</strong>
          </div>
          <div className="metric">
            <span>Date format</span>
            <strong>{values.dateFormat}</strong>
          </div>
        </div>

        <div className="action-row">
          <button className="button primary" type="button" disabled={result.errors.length > 0} onClick={() => void copy(result.mark)}>
            <Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy mark'}
          </button>
        </div>
      </section>
    </div>
  );
}
