'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/throughput-calculator';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { calculateThroughput } from '@/lib/throughput';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  processTimeMin: 2,
  chambers: 2,
  availabilityPercent: 90,
  performancePercent: 95,
  qualityPercent: 97,
};

function rate(value: number): string {
  return value.toFixed(2);
}

export default function ThroughputCalculator() {
  const t = useToolCopy(copyResource);
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const { copied, copy } = useCopyToClipboard();

  const result = useMemo(() => calculateThroughput(values), [values]);

  const copyResult = async () => {
    if (!result.ok) return;

    const summary = [
      `Process time per wafer: ${values.processTimeMin} min`,
      `Parallel chambers: ${values.chambers}`,
      `Availability: ${values.availabilityPercent}%`,
      `Performance: ${values.performancePercent}%`,
      `Quality: ${values.qualityPercent}%`,
      `Theoretical: ${rate(result.theoreticalWph)} wafers/h`,
      `Effective: ${rate(result.effectiveWph)} wafers/h`,
      `Good output: ${rate(result.goodWph)} wafers/h`,
      `OEE: ${(result.oee * 100).toFixed(2)}%`,
      `Good wafers per day: ${result.goodWafersPerDay.toFixed(1)}`,
    ].join('\n');

    await copy(summary);
  };

  const update = (key: keyof typeof INITIAL, value: string) =>
    setValues((previous) => ({ ...previous, [key]: Number(value) }));

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="throughput-inputs">
        <h2 id="throughput-inputs">{t("Step and equipment")}</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="throughput-time">
              {t("Process time")}<span className="unit">{t("min / wafer / chamber")}</span>
            </label>
            <input
              id="throughput-time"
              type="number"
              min="0"
              step="any"
              value={values.processTimeMin}
              onChange={(event) => update('processTimeMin', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="throughput-chambers">
              {t("Parallel chambers")}<span className="unit">count</span>
            </label>
            <input
              id="throughput-chambers"
              type="number"
              min="1"
              step="1"
              value={values.chambers}
              onChange={(event) => update('chambers', event.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="throughput-availability">
              {t("Availability")}<span className="unit">%</span>
            </label>
            <input
              id="throughput-availability"
              type="number"
              min="0"
              max="100"
              step="any"
              value={values.availabilityPercent}
              onChange={(event) => update('availabilityPercent', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="throughput-performance">
              {t("Performance")}<span className="unit">%</span>
            </label>
            <input
              id="throughput-performance"
              type="number"
              min="0"
              max="100"
              step="any"
              value={values.performancePercent}
              onChange={(event) => update('performancePercent', event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="throughput-quality">
            {t("Quality (good output)")}<span className="unit">%</span>
          </label>
          <input
            id="throughput-quality"
            type="number"
            min="0"
            max="100"
            step="any"
            value={values.qualityPercent}
            onChange={(event) => update('qualityPercent', event.target.value)}
          />
        </div>

        <p className="note">
          {t("Availability, performance and quality are each a percentage of the ideal rate, so OEE here is simply their product. Use your own measured values.")}</p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> {t("Reset")}</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="throughput-result">
        <h2 id="throughput-result">{t("Output")}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{t("Good output")}</span>
            <div className="result-value" aria-live="polite">
              {rate(result.goodWph)}
              <span className="result-suffix"> {t("wafers/h")}</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>{t("Theoretical")}</span>
                <strong>{rate(result.theoreticalWph)} {t("/h")}</strong>
              </div>
              <div className="metric">
                <span>{t("Effective (A x P)")}</span>
                <strong>{rate(result.effectiveWph)} {t("/h")}</strong>
              </div>
              <div className="metric">
                <span>OEE</span>
                <strong>{(result.oee * 100).toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>{t("Good wafers / day")}</span>
                <strong>{result.goodWafersPerDay.toFixed(1)}</strong>
              </div>
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">{t("Rate")}</th>
                  <th scope="col">{t("Wafers / hour")}</th>
                  <th scope="col">{t("Factor applied")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{t("Theoretical")}</th>
                  <td className="mono">{rate(result.theoreticalWph)}</td>
                  <td className="mono">{t("60 / time x chambers")}</td>
                </tr>
                <tr>
                  <th scope="row">{t("Effective")}</th>
                  <td className="mono">{rate(result.effectiveWph)}</td>
                  <td className="mono">{t("x A x P")}</td>
                </tr>
                <tr>
                  <th scope="row">{t("Good output")}</th>
                  <td className="mono">{rate(result.goodWph)}</td>
                  <td className="mono">{t("x A x P x Q")}</td>
                </tr>
              </tbody>
            </table>

            <p className="note">
              {t("This models one step at its stated rates. A real flow is set by its bottleneck step, so line output is the slowest step, not the sum or the average of these numbers.")}</p>

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
