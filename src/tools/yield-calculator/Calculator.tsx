'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateYield } from '@/lib/yield';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/yield-calculator';

const INITIAL = { gross: 720, good: 697, defect: 23 };

export default function YieldCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const [copied, setCopied] = useState(false);
  const g = useGlossary();
  const t = useToolCopy(copyResource);

  const update = (key: keyof typeof INITIAL, value: number) => setValues((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => calculateYield(values.gross, values.good, values.defect), [values]);
  const hasErrors = result.errors.length > 0;

  const copyResult = async () => {
    if (hasErrors) {
      return;
    }

    const summary = [
      `${t('Gross die')}: ${values.gross}`,
      `${t('Good die')}: ${values.good}`,
      `${t('Defect die')}: ${values.defect}`,
      `${g('yieldLabel')}: ${result.yield?.toFixed(2)}%`,
      `${t('Reject rate')}: ${result.rejectRate?.toFixed(2)}%`,
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
        <h2 id="yield-inputs">{t('Die counts')}</h2>

        <Num id="yield-gross" label={t('Gross die')} value={values.gross} onChange={(value) => update('gross', value)} />
        <Num id="yield-good" label={t('Good die')} value={values.good} onChange={(value) => update('good', value)} />
        <Num id="yield-defect" label={t('Defect die')} value={values.defect} onChange={(value) => update('defect', value)} />

        <p className="note">
          {t(
            'Gross die is the number of die positions considered. Good die plus defect die does not have to equal gross die: skipped or unclassified die make up the difference.',
          )}
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> {t('Reset')}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="yield-result">
        <h2 id="yield-result">{g('resultLabel')}</h2>

        {hasErrors ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{t(error)}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{g('yieldLabel')}</span>
            <div className="result-value" aria-live="polite">
              {result.yield?.toFixed(2)}%
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>{t('Reject rate')}</span>
                <strong>{result.rejectRate?.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>{t('Good / gross')}</span>
                <strong>
                  {values.good} / {values.gross}
                </strong>
              </div>
              <div className="metric">
                <span>{t('Defect / gross')}</span>
                <strong>
                  {values.defect} / {values.gross}
                </strong>
              </div>
              <div className="metric">
                <span>{t('Unclassified die')}</span>
                <strong>{Math.max(0, values.gross - values.good - values.defect)}</strong>
              </div>
            </div>

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? t('Copied') : t('Copy result')}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Num({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
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
