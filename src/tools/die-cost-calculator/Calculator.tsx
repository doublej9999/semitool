'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/die-cost-calculator';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateDieCost } from '@/lib/die-cost';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

const INITIAL = { waferCost: 3000, extraCostPerWafer: 0, grossDie: 720, goodDie: 697 };

function money(value: number, digits: number): string {
  return `¥${value.toFixed(digits)}`;
}

export default function DieCostCalculator() {
  const t = useToolCopy(copyResource);
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const [copied, setCopied] = useState(false);
  const g = useGlossary();

  const result = useMemo(() => calculateDieCost(values), [values]);

  const copyResult = async () => {
    if (!result.ok) return;

    const summary = [
      `Wafer cost: ${money(values.waferCost, 2)}`,
      `Additional cost per wafer: ${money(values.extraCostPerWafer, 2)}`,
      `Gross die: ${values.grossDie}`,
      `Good die: ${values.goodDie}`,
      `Yield: ${result.yieldPercent.toFixed(2)}%`,
      `Cost per gross die: ${money(result.costPerGrossDie, 4)}`,
      `Cost per good die: ${money(result.costPerGoodDie, 4)}`,
      `Scrap cost per wafer: ${money(result.scrapCostPerWafer, 2)}`,
      `Cost multiplier (1 / yield): ${result.costMultiplier.toFixed(4)}x`,
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
      <section className="panel" aria-labelledby="cost-inputs">
        <h2 id="cost-inputs">{t("Wafer cost and die counts")}</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cost-wafer">
              {t("Wafer cost")}<span className="unit">¥</span>
            </label>
            <input
              id="cost-wafer"
              type="number"
              min="0"
              step="any"
              value={values.waferCost}
              onChange={(event) => setValues((previous) => ({ ...previous, waferCost: Number(event.target.value) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="cost-extra">
              {t("Additional cost")}<span className="unit">{t("¥ / wafer")}</span>
            </label>
            <input
              id="cost-extra"
              type="number"
              min="0"
              step="any"
              value={values.extraCostPerWafer}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, extraCostPerWafer: Number(event.target.value) }))
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cost-gross">
              {t("Gross die")}<span className="unit">count</span>
            </label>
            <input
              id="cost-gross"
              type="number"
              min="0"
              step="1"
              value={values.grossDie}
              onChange={(event) => setValues((previous) => ({ ...previous, grossDie: Number(event.target.value) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="cost-good">
              {t("Good die")}<span className="unit">count</span>
            </label>
            <input
              id="cost-good"
              type="number"
              min="0"
              step="1"
              value={values.goodDie}
              onChange={(event) => setValues((previous) => ({ ...previous, goodDie: Number(event.target.value) }))}
            />
          </div>
        </div>

        <p className="note">
          {t("The default wafer cost is a placeholder, not a market price — replace it with your own figure. Additional cost covers anything charged per wafer, such as test or packaging.")}</p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> {t("Reset")}</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="cost-result">
        <h2 id="cost-result">{t("Cost per die")}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{t("Cost per good die")}</span>
            <div className="result-value" aria-live="polite">
              {money(result.costPerGoodDie, 4)}
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>{t("Cost per gross die")}</span>
                <strong>{money(result.costPerGrossDie, 4)}</strong>
              </div>
              <div className="metric">
                <span>{g('yieldLabel')}</span>
                <strong>{result.yieldPercent.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>{t("Cost multiplier")}</span>
                <strong>{result.costMultiplier.toFixed(4)}x</strong>
              </div>
              <div className="metric">
                <span>{t("Scrap cost per wafer")}</span>
                <strong>{money(result.scrapCostPerWafer, 2)}</strong>
              </div>
              <div className="metric">
                <span>{t("Good-die premium")}</span>
                <strong>{money(result.costPerGoodDiePremium, 4)}</strong>
              </div>
              <div className="metric">
                <span>{t("Non-good die")}</span>
                <strong>{result.unclassifiedDie}</strong>
              </div>
            </div>

            <p className="note">
              {t("Cost per good die is the wafer cost divided by the good die, so the scrapped die carry their share. It is always the cost per gross die multiplied by 1 / yield.")}</p>

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? t("Copied") : t("Copy result")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
