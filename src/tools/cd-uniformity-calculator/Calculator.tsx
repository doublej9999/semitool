
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import SeriesField from '@/components/tools/SeriesField';
import { formatNumber as fmt } from '@/lib/format';
import { parseSeries, summariseSeries } from '@/lib/series';

const INITIAL = {
  series: '42.1, 41.8, 42.4\n41.9, 42.6, 42.0\n42.3, 41.7, 42.2',
  targetCd: '',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function CdUniformityCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseSeries(state.series), [state.series]);
  const summary = useMemo(
    () => (parsed.errors.length === 0 ? summariseSeries(parsed.values) : null),
    [parsed],
  );

  const target = num(state.targetCd);
  const hasTarget = Number.isFinite(target) && target > 0;
  const deviation = summary !== null && hasTarget ? summary.mean - target : null;
  const deviationPercent =
    deviation !== null && hasTarget ? (deviation / target) * 100 : null;

  const copyResult = async () => {
    if (summary === null) return;
    const lines = [
      `Sites: ${summary.n}`,
      `Mean: ${fmt(summary.mean)} nm`,
      `Min: ${fmt(summary.min)} nm`,
      `Max: ${fmt(summary.max)} nm`,
      `Range: ${fmt(summary.range)} nm`,
      summary.sigma !== null ? `Sigma (n-1): ${fmt(summary.sigma)} nm` : 'Sigma (n-1): not defined with one site',
      summary.threeSigma !== null ? `3 sigma: ${fmt(summary.threeSigma)} nm` : null,
      summary.cvPercent !== null ? `CV: ${fmt(summary.cvPercent)} %` : null,
      summary.rangePercent !== null ? `Range / mean: ${fmt(summary.rangePercent)} %` : null,
      summary.halfRangePercent !== null ? `Half range / mean: ${fmt(summary.halfRangePercent)} %` : null,
    ].filter((line): line is string => line !== null);

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
      <section className="panel" aria-labelledby="cdu-inputs">
        <h2 id="cdu-inputs">Measurements</h2>

        <SeriesField
          id="cdu-series"
          label="Critical dimension at each site"
          value={state.series}
          onChange={(value) => setState((previous) => ({ ...previous, series: value }))}
          hint="Separate the readings with commas, spaces or new lines. One reading per site, in nanometres."
          placeholder="42.1, 41.8, 42.4, 41.9"
        />

        <div className="field">
          <label htmlFor="cdu-target">
            Target CD<span className="unit">nm, optional</span>
          </label>
          <input
            id="cdu-target"
            type="number"
            min="0"
            step="any"
            placeholder="not set"
            value={state.targetCd}
            onChange={(event) => setState((previous) => ({ ...previous, targetCd: event.target.value }))}
          />
        </div>

        {parsed.errors.length > 0 ? (
          <div className="error" role="alert">
            {parsed.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <p className="note">{parsed.values.length} valid readings parsed.</p>
        )}

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="cdu-result">
        <h2 id="cdu-result">Uniformity</h2>

        {summary === null ? (
          <p className="note">Enter at least one valid measurement to see the statistics.</p>
        ) : (
          <>
            <span className="unit">Mean critical dimension</span>
            <div className="result-value" aria-live="polite">
              {fmt(summary.mean)}
              <span className="result-suffix"> nm</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Sites</span>
                <strong>{summary.n}</strong>
              </div>
              <div className="metric">
                <span>Min / max</span>
                <strong>
                  {fmt(summary.min)} / {fmt(summary.max)} nm
                </strong>
              </div>
              <div className="metric">
                <span>Range</span>
                <strong>{fmt(summary.range)} nm</strong>
              </div>
              <div className="metric">
                <span>Sigma (n-1)</span>
                <strong>{summary.sigma === null ? '—' : `${fmt(summary.sigma)} nm`}</strong>
              </div>
              <div className="metric">
                <span>3 sigma</span>
                <strong>{summary.threeSigma === null ? '—' : `${fmt(summary.threeSigma)} nm`}</strong>
              </div>
              <div className="metric">
                <span>CV</span>
                <strong>{summary.cvPercent === null ? '—' : `${fmt(summary.cvPercent)} %`}</strong>
              </div>
              <div className="metric">
                <span>Range / mean</span>
                <strong>{summary.rangePercent === null ? '—' : `${fmt(summary.rangePercent)} %`}</strong>
              </div>
              <div className="metric">
                <span>Half range / mean</span>
                <strong>{summary.halfRangePercent === null ? '—' : `${fmt(summary.halfRangePercent)} %`}</strong>
              </div>
              {hasTarget ? (
                <>
                  <div className="metric">
                    <span>Deviation from target</span>
                    <strong>{deviation === null ? '—' : `${fmt(deviation)} nm`}</strong>
                  </div>
                  <div className="metric">
                    <span>Deviation</span>
                    <strong>{deviationPercent === null ? '—' : `${fmt(deviationPercent)} %`}</strong>
                  </div>
                </>
              ) : null}
            </div>

            <p className="note">
              Three different numbers get called uniformity, and they are not equal: range over mean, half range over
              mean, and the coefficient of variation sigma over mean. All three are shown so you can match whichever one
              your specification uses. The standard deviation uses the n-1 divisor, which is the honest choice for a
              finite set of sites.
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
