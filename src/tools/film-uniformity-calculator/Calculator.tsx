
'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/film-uniformity-calculator';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { parseSeries, summariseSeries } from '@/lib/series';
import SeriesField from '@/components/tools/SeriesField';
import CsvBatchUpload from '@/components/tools/CsvBatchUpload';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useGlossary } from '@/lib/i18n/glossary';

const INITIAL_SERIES = '100.5, 101.2, 99.4, 100.8, 102.1, 98.9, 100.0, 101.5, 99.8';
const INITIAL_TARGET = '100';

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function FilmUniformityCalculator() {
  const t = useToolCopy(copyResource);
  const g = useGlossary();
  const [state, setState] = useState({ series: INITIAL_SERIES, target: INITIAL_TARGET });
  useUrlParamsState(state, setState);
  const { series, target } = state;
  const setSeries = (value: string) => setState((previous) => ({ ...previous, series: value }));
  const setTarget = (value: string) => setState((previous) => ({ ...previous, target: value }));
  const { copied, copy } = useCopyToClipboard();

  const parsed = useMemo(() => parseSeries(series), [series]);
  const summary = useMemo(
    () => (parsed.errors.length === 0 && parsed.values.length >= 2 ? summariseSeries(parsed.values) : null),
    [parsed],
  );
  const targetValue = num(target);

  const copyResult = () => {
    if (!summary) return;
    const lines = [
      `Readings: ${summary.n}`,
      `Mean: ${fmt(summary.mean)} nm`,
      `Min / max: ${fmt(summary.min)} / ${fmt(summary.max)} nm`,
      `Range: ${fmt(summary.range)} nm`,
      `Sample sigma: ${summary.sigma === null ? 'n/a' : fmt(summary.sigma) + ' nm'}`,
      `Half range / mean: ${summary.halfRangePercent === null ? 'n/a' : fmt(summary.halfRangePercent) + ' %'}`,
    ];
    void copy(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="uniformity-inputs">
        <h2 id="uniformity-inputs">{t("Thickness readings")}</h2>

        <SeriesField
          id="uniformity-series"
          label={t("Measured thicknesses (nm)")}
          value={series}
          onChange={setSeries}
          placeholder="100.5, 101.2, 99.4, ..."
          hint="Comma, space or line separated. One number per measurement site."
        />

        <CsvBatchUpload
          onDataLoaded={(values) => setSeries(values.join(', '))}
          currentSummary={summary}
          unit="nm"
        />

        <div className="field">
          <label htmlFor="uniformity-target">
            {g('targetThickness')}<span className="unit">nm</span>
          </label>
          <input
            id="uniformity-target"
            type="number"
            min="0"
            step="any"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </div>

        {parsed.errors.length > 0 ? (
          <p className="note">{parsed.errors.join(' ')}</p>
        ) : (
          <p className="note">{parsed.values.length} {t("valid readings parsed.")}</p>
        )}

        <p className="note">
          {t("Every reading counts as one measurement site. How many sites and where they sit change what the uniformity number means, so the site count is reported alongside it.")}</p>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSeries(INITIAL_SERIES);
              setTarget(INITIAL_TARGET);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> {t("Reset")}</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="uniformity-result">
        <h2 id="uniformity-result">{g('uniformity')}</h2>

        {!summary ? (
          <div className="error" role="alert">
            {t("Enter at least two numeric thickness readings to summarise the film.")}</div>
        ) : (
          <>
            <span className="unit">{t("Mean thickness")}</span>
            <div className="result-value" aria-live="polite">
              {fmt(summary.mean)}
              <span className="result-suffix"> nm</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>{t("Readings")}</span>
                <strong>{summary.n}</strong>
              </div>
              <div className="metric">
                <span>{t("Min / max")}</span>
                <strong>
                  {fmt(summary.min)} / {fmt(summary.max)} nm
                </strong>
              </div>
              <div className="metric">
                <span>{t("Range")}</span>
                <strong>{fmt(summary.range)} nm</strong>
              </div>
              <div className="metric">
                <span>{t("Sample sigma")}</span>
                <strong>{summary.sigma === null ? '—' : `${fmt(summary.sigma)} nm`}</strong>
              </div>
              <div className="metric">
                <span>{t("Three sigma")}</span>
                <strong>{summary.threeSigma === null ? '—' : `${fmt(summary.threeSigma)} nm`}</strong>
              </div>
              <div className="metric">
                <span>{t("Coefficient of variation")}</span>
                <strong>{summary.cvPercent === null ? '—' : `${fmt(summary.cvPercent)} %`}</strong>
              </div>
              <div className="metric">
                <span>{t("Half range / mean")}</span>
                <strong>{summary.halfRangePercent === null ? '—' : `${fmt(summary.halfRangePercent)} %`}</strong>
              </div>
              <div className="metric">
                <span>{t("Range / mean")}</span>
                <strong>{summary.rangePercent === null ? '—' : `${fmt(summary.rangePercent)} %`}</strong>
              </div>
            </div>

            {Number.isFinite(targetValue) ? (
              <div className="metric-grid">
                <div className="metric">
                  <span>{t("Mean vs target")}</span>
                  <strong>{fmt(summary.mean - targetValue)} nm</strong>
                </div>
                <div className="metric">
                  <span>{t("Mean vs target")}</span>
                  <strong>
                    {targetValue === 0 ? '—' : `${fmt(((summary.mean - targetValue) / targetValue) * 100)} %`}
                  </strong>
                </div>
              </div>
            ) : null}

            <p className="note">
              {t("Three conventions are shown because they do not agree. Range over mean is the full spread as a fraction of the mean, half range over mean is the plus or minus figure used in many deposition specs, and the coefficient of variation is the sample sigma over the mean. The sample sigma uses n minus one in the denominator. State which one you mean when you quote a uniformity number.")}</p>

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
