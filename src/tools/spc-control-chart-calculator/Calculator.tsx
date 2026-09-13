'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { parseSubgroups, xbarRChart } from '@/lib/spc';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadXlsx } from '@/lib/export';
import { useGlossary } from '@/lib/i18n/glossary';
import FabMetrologyImportModal from '@/components/tools/FabMetrologyImportModal';

const SAMPLE = [
  '10.1, 10.3, 9.9, 10.1',
  '10.2, 10.4, 10.0, 10.2',
  '9.8, 10.0, 9.6, 9.8',
  '10.3, 10.5, 10.1, 10.3',
  '10.0, 10.2, 9.8, 10.0',
  '10.1, 10.1, 9.9, 10.3',
].join('\n');

interface SpcCalculatorState {
  subgroups: string;
  [key: string]: string | number | boolean;
}

const INITIAL: SpcCalculatorState = { subgroups: SAMPLE };

interface XBarChartProps {
  means: number[];
  grandMean: number;
  ucl: number;
  lcl: number;
  meansOutOfControl: number[];
  runs: { startIndex: number; endIndex: number; side: 'above' | 'below' }[];
}

function XBarChart({ means, grandMean, ucl, lcl, meansOutOfControl, runs }: XBarChartProps) {
  const width = 540;
  const height = 210;
  const marginLeft = 56;
  const marginRight = 76;
  const marginTop = 22;
  const marginBottom = 28;

  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const minY = Math.min(...means, lcl);
  const maxY = Math.max(...means, ucl);
  const span = maxY - minY || 1;
  const pad = span * 0.12;
  const yMin = minY - pad;
  const yMax = maxY + pad;

  const toSvgY = (val: number) => plotTop + (1 - (val - yMin) / (yMax - yMin)) * plotHeight;
  const toSvgX = (i: number) =>
    means.length <= 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (i / (means.length - 1)) * plotWidth;

  const yUcl = toSvgY(ucl);
  const yCl = toSvgY(grandMean);
  const yLcl = toSvgY(lcl);

  const yTicks = [0, 0.333, 0.667, 1].map((p) => yMin + p * (yMax - yMin));

  const pointsStr = means.map((m, i) => `${toSvgX(i)},${toSvgY(m)}`).join(' ');

  const count = means.length;
  const tickStep = count > 24 ? Math.ceil(count / 10) : count > 12 ? 2 : 1;

  let labelUclY = yUcl;
  const labelClY = yCl;
  let labelLclY = yLcl;
  if (labelClY - labelUclY < 14) labelUclY = labelClY - 14;
  if (labelLclY - labelClY < 14) labelLclY = labelClY + 14;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`X-bar control chart showing ${count} subgroup means, grand mean ${fmt(grandMean)}, UCL ${fmt(ucl)}, LCL ${fmt(lcl)}`}
    >
      <title>X-bar Control Chart</title>
      <desc>Subgroup means over time with upper control limit, center line, and lower control limit.</desc>

      {/* Plot background */}
      <rect
        x={plotLeft}
        y={plotTop}
        width={plotWidth}
        height={plotHeight}
        fill="var(--chart-bg)"
        stroke="var(--chart-grid)"
        strokeWidth="1"
        rx="4"
      />

      {/* Subtle Y grid lines */}
      {yTicks.map((tick, idx) => {
        const y = toSvgY(tick);
        return (
          <g key={idx}>
            <line
              x1={plotLeft}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke="var(--chart-grid)"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
            <text
              x={plotLeft - 6}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--chart-axis)"
              fontFamily="var(--font-mono)"
            >
              {fmt(tick)}
            </text>
          </g>
        );
      })}

      {/* UCL line and label */}
      <line
        x1={plotLeft}
        y1={yUcl}
        x2={plotRight}
        y2={yUcl}
        stroke="var(--chart-limit)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text
        x={plotRight + 6}
        y={labelUclY + 3.5}
        fill="var(--chart-limit)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        UCL {fmt(ucl)}
      </text>

      {/* Center line and label */}
      <line
        x1={plotLeft}
        y1={yCl}
        x2={plotRight}
        y2={yCl}
        stroke="var(--chart-accent)"
        strokeWidth="1.5"
      />
      <text
        x={plotRight + 6}
        y={labelClY + 3.5}
        fill="var(--chart-accent)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        CL {fmt(grandMean)}
      </text>

      {/* LCL line and label */}
      <line
        x1={plotLeft}
        y1={yLcl}
        x2={plotRight}
        y2={yLcl}
        stroke="var(--chart-limit)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text
        x={plotRight + 6}
        y={labelLclY + 3.5}
        fill="var(--chart-limit)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        LCL {fmt(lcl)}
      </text>

      {/* Connecting line */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="var(--ink-soft)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Points */}
      {means.map((m, i) => {
        const x = toSvgX(i);
        const y = toSvgY(m);
        const isLimitOut = meansOutOfControl.includes(i);
        const runMatch = runs.find((r) => i >= r.startIndex && i <= r.endIndex);
        const isRunOut = Boolean(runMatch);
        const isOut = isLimitOut || isRunOut;

        const statusText = isLimitOut
          ? 'Outside control limits'
          : isRunOut
          ? `Run rule signal (7+ ${runMatch?.side} CL)`
          : 'In control';

        return (
          <g key={i}>
            {isLimitOut && (
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke="var(--chart-fail)"
                strokeWidth="2"
                opacity="0.85"
              />
            )}
            {!isLimitOut && isRunOut && (
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke="var(--chart-series-2)"
                strokeWidth="2"
                opacity="0.85"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isOut ? 4.5 : 3.5}
              fill={isLimitOut ? 'var(--chart-fail)' : isRunOut ? 'var(--chart-series-2)' : 'var(--chart-accent)'}
              stroke="var(--chart-bg)"
              strokeWidth="1.5"
            >
              <title>{`Subgroup ${i + 1}: Mean = ${fmt(m)} (${statusText})`}</title>
            </circle>
          </g>
        );
      })}

      {/* X ticks */}
      {means.map((_, i) => {
        if (i !== 0 && (i + 1) % tickStep !== 0 && i !== count - 1) return null;
        const x = toSvgX(i);
        return (
          <g key={`xtick-${i}`}>
            <line
              x1={x}
              y1={plotBottom}
              x2={x}
              y2={plotBottom + 4}
              stroke="var(--chart-axis)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={plotBottom + 15}
              textAnchor="middle"
              fontSize="10"
              fill="var(--chart-axis)"
              fontFamily="var(--font-mono)"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* X-axis title */}
      <text
        x={plotLeft + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize="10"
        fill="var(--chart-axis)"
      >
        Subgroup
      </text>
    </svg>
  );
}

interface RChartProps {
  ranges: number[];
  meanRange: number;
  rangeUcl: number;
  rangeLcl: number;
  rangesOutOfControl: number[];
}

function RChart({ ranges, meanRange, rangeUcl, rangeLcl, rangesOutOfControl }: RChartProps) {
  const width = 540;
  const height = 190;
  const marginLeft = 56;
  const marginRight = 76;
  const marginTop = 22;
  const marginBottom = 28;

  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const minR = Math.min(...ranges, rangeLcl);
  const maxR = Math.max(...ranges, rangeUcl);
  const span = maxR - minR || 1;
  const yMin = minR === 0 ? -span * 0.06 : Math.max(0, minR - span * 0.08);
  const yMax = maxR + span * 0.12;

  const toSvgY = (val: number) => plotTop + (1 - (val - yMin) / (yMax - yMin)) * plotHeight;
  const toSvgX = (i: number) =>
    ranges.length <= 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (i / (ranges.length - 1)) * plotWidth;

  const yUcl = toSvgY(rangeUcl);
  const yCl = toSvgY(meanRange);
  const yLcl = toSvgY(rangeLcl);

  const yTicks = [0, 0.333, 0.667, 1].map((p) => Math.max(0, yMin + p * (yMax - yMin)));

  const pointsStr = ranges.map((r, i) => `${toSvgX(i)},${toSvgY(r)}`).join(' ');

  const count = ranges.length;
  const tickStep = count > 24 ? Math.ceil(count / 10) : count > 12 ? 2 : 1;

  let labelUclY = yUcl;
  const labelClY = yCl;
  let labelLclY = yLcl;
  if (labelClY - labelUclY < 14) labelUclY = labelClY - 14;
  if (labelLclY - labelClY < 14) labelLclY = labelClY + 14;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`R range chart showing ${count} subgroup ranges, mean range ${fmt(meanRange)}, UCL ${fmt(rangeUcl)}, LCL ${fmt(rangeLcl)}`}
    >
      <title>R Range Chart</title>
      <desc>Subgroup ranges over time with upper range limit, mean range, and lower range limit.</desc>

      {/* Plot background */}
      <rect
        x={plotLeft}
        y={plotTop}
        width={plotWidth}
        height={plotHeight}
        fill="var(--chart-bg)"
        stroke="var(--chart-grid)"
        strokeWidth="1"
        rx="4"
      />

      {/* Subtle Y grid lines */}
      {yTicks.map((tick, idx) => {
        const y = toSvgY(tick);
        return (
          <g key={idx}>
            <line
              x1={plotLeft}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke="var(--chart-grid)"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
            <text
              x={plotLeft - 6}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--chart-axis)"
              fontFamily="var(--font-mono)"
            >
              {fmt(tick)}
            </text>
          </g>
        );
      })}

      {/* UCL line and label */}
      <line
        x1={plotLeft}
        y1={yUcl}
        x2={plotRight}
        y2={yUcl}
        stroke="var(--chart-limit)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text
        x={plotRight + 6}
        y={labelUclY + 3.5}
        fill="var(--chart-limit)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        UCL {fmt(rangeUcl)}
      </text>

      {/* Center line and label */}
      <line
        x1={plotLeft}
        y1={yCl}
        x2={plotRight}
        y2={yCl}
        stroke="var(--chart-accent)"
        strokeWidth="1.5"
      />
      <text
        x={plotRight + 6}
        y={labelClY + 3.5}
        fill="var(--chart-accent)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        CL {fmt(meanRange)}
      </text>

      {/* LCL line and label */}
      <line
        x1={plotLeft}
        y1={yLcl}
        x2={plotRight}
        y2={yLcl}
        stroke="var(--chart-limit)"
        strokeWidth="1.5"
        strokeDasharray={rangeLcl === 0 ? undefined : '5 4'}
      />
      <text
        x={plotRight + 6}
        y={labelLclY + 3.5}
        fill="var(--chart-limit)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        LCL {fmt(rangeLcl)}
      </text>

      {/* Connecting line */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="var(--ink-soft)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Points */}
      {ranges.map((r, i) => {
        const x = toSvgX(i);
        const y = toSvgY(r);
        const isOut = rangesOutOfControl.includes(i);

        return (
          <g key={i}>
            {isOut && (
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke="var(--chart-fail)"
                strokeWidth="2"
                opacity="0.85"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isOut ? 4.5 : 3.5}
              fill={isOut ? 'var(--chart-fail)' : 'var(--chart-accent)'}
              stroke="var(--chart-bg)"
              strokeWidth="1.5"
            >
              <title>{`Subgroup ${i + 1}: Range = ${fmt(r)} (${isOut ? 'Outside control limits' : 'In control'})`}</title>
            </circle>
          </g>
        );
      })}

      {/* X ticks */}
      {ranges.map((_, i) => {
        if (i !== 0 && (i + 1) % tickStep !== 0 && i !== count - 1) return null;
        const x = toSvgX(i);
        return (
          <g key={`xtick-${i}`}>
            <line
              x1={x}
              y1={plotBottom}
              x2={x}
              y2={plotBottom + 4}
              stroke="var(--chart-axis)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={plotBottom + 15}
              textAnchor="middle"
              fontSize="10"
              fill="var(--chart-axis)"
              fontFamily="var(--font-mono)"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* X-axis title */}
      <text
        x={plotLeft + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize="10"
        fill="var(--chart-axis)"
      >
        Subgroup
      </text>
    </svg>
  );
}

export default function SpcControlChartCalculator() {
  const g = useGlossary();
  const [state, setState] = useState<SpcCalculatorState>(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const result = useMemo(() => {
    try {
      const subgroups = parseSubgroups(state.subgroups);
      return { ok: true as const, ...xbarRChart(subgroups) };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The data could not be charted.'],
      };
    }
  }, [state.subgroups]);

  const signalCount = result.ok
    ? result.meansOutOfControl.length + result.rangesOutOfControl.length + result.runs.length
    : 0;

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'X-bar and R chart',
      `Subgroups = ${result.subgroupCount}, size = ${result.subgroupSize}`,
      `Grand mean = ${fmt(result.grandMean)}`,
      `Mean range = ${fmt(result.meanRange)}`,
      `X-bar limits = ${fmt(result.xbarLcl)} to ${fmt(result.xbarUcl)}`,
      `R limits = ${fmt(result.rangeLcl)} to ${fmt(result.rangeUcl)}`,
      `Within-subgroup sigma = ${fmt(result.sigmaHat)}`,
      `Signals = ${signalCount}`,
    ];
    result.meansOutOfControl.forEach((index) =>
      head.push(`Subgroup ${index + 1} mean is outside the limits`),
    );
    result.rangesOutOfControl.forEach((index) =>
      head.push(`Subgroup ${index + 1} range is outside the limits`),
    );
    result.runs.forEach((run) =>
      head.push(
        `Subgroups ${run.startIndex + 1} to ${run.endIndex + 1} run ${run.side} the centre line`,
      ),
    );
    return head;
  }, [result, signalCount]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const exportXlsx = async () => {
    if (!result.ok) return;
    const headers = ['Subgroup', 'Mean', 'Range', 'Status'];
    const rows = result.means.map((mean, index) => {
      const meanOut = result.meansOutOfControl.includes(index);
      const rangeOut = result.rangesOutOfControl.includes(index);
      const run = result.runs.find(
        (entry) => index >= entry.startIndex && index <= entry.endIndex,
      );
      const status = [
        meanOut ? 'mean out of limits' : null,
        rangeOut ? 'range out of limits' : null,
        run ? `run ${run.side}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return [index + 1, mean, result.ranges[index], status === '' ? 'in control' : status];
    });
    await downloadXlsx('spc-xbar-r-chart.xlsx', 'X-bar R Data', headers, rows);
  };

  const xbarSignalCount = result.ok
    ? result.meansOutOfControl.length + result.runs.length
    : 0;
  const rangeSignalCount = result.ok ? result.rangesOutOfControl.length : 0;

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="spc-subgroups">Subgroups, one per line, readings separated by commas</label>
          <textarea
            id="spc-subgroups"
            rows={8}
            spellCheck={false}
            value={state.subgroups}
            onChange={(event) => setState({ subgroups: event.target.value })}
          />
        </div>
        <p className="note">
          Every subgroup must hold the same number of readings: a constant subgroup size is what makes the range
          meaningful. Lines starting with # are ignored, so you can paste a block from a datalog and comment the
          ones you exclude.
        </p>
        <div className="action-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className="button outline"
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            Fab Metrology Import / CSV
          </button>
          <button type="button" className="button primary" onClick={copy} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={exportXlsx} disabled={!result.ok}>
            <Download size={16} aria-hidden="true" />
            Export XLSX
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <FabMetrologyImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onApplySubgroups={(text) => setState({ ...state, subgroups: text })}
        />
      </section>

      <section className="panel">
        <h2>{g('resultLabel')}</h2>
        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Grand mean</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.grandMean)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>X-bar UCL</dt>
                <dd>{fmt(result.xbarUcl)}</dd>
              </div>
              <div>
                <dt>X-bar LCL</dt>
                <dd>{fmt(result.xbarLcl)}</dd>
              </div>
              <div>
                <dt>R UCL</dt>
                <dd>{fmt(result.rangeUcl)}</dd>
              </div>
              <div>
                <dt>R LCL</dt>
                <dd>{fmt(result.rangeLcl)}</dd>
              </div>
              <div>
                <dt>Mean range</dt>
                <dd>{fmt(result.meanRange)}</dd>
              </div>
              <div>
                <dt>Within-subgroup sigma</dt>
                <dd>{fmt(result.sigmaHat)}</dd>
              </div>
              <div>
                <dt>Subgroup size</dt>
                <dd>{result.subgroupSize}</dd>
              </div>
              <div>
                <dt>Signals</dt>
                <dd>{signalCount}</dd>
              </div>
            </dl>

            {/* Visual SPC Control Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0 20px' }}>
              {/* X-bar Chart Card */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                    X-bar Chart (Subgroup Means)
                  </span>
                  <span
                    className="unit"
                    style={{
                      color: xbarSignalCount > 0 ? 'var(--red)' : 'var(--teal-dark)',
                      borderColor: xbarSignalCount > 0 ? 'var(--red)' : 'var(--line)',
                      background: xbarSignalCount > 0 ? '#fdf1f0' : 'var(--teal-soft)',
                    }}
                  >
                    {xbarSignalCount > 0 ? `${xbarSignalCount} signal${xbarSignalCount > 1 ? 's' : ''}` : 'In control'}
                  </span>
                </div>

                <XBarChart
                  means={result.means}
                  grandMean={result.grandMean}
                  ucl={result.xbarUcl}
                  lcl={result.xbarLcl}
                  meansOutOfControl={result.meansOutOfControl}
                  runs={result.runs}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '8px',
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--chart-accent)',
                        display: 'inline-block',
                      }}
                    />
                    <span>Normal mean</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--chart-fail)',
                        boxShadow: '0 0 0 2px var(--chart-fail)',
                        display: 'inline-block',
                      }}
                    />
                    <span>Outside limits</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--chart-series-2)',
                        boxShadow: '0 0 0 2px var(--chart-series-2)',
                        display: 'inline-block',
                      }}
                    />
                    <span>7-point run</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '14px', borderTop: '1.5px dashed var(--chart-limit)', display: 'inline-block' }} />
                    <span>Control limits (UCL/LCL)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '14px', borderTop: '1.5px solid var(--chart-accent)', display: 'inline-block' }} />
                    <span>Center line (CL)</span>
                  </div>
                </div>
              </div>

              {/* R Chart Card */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                    R Chart (Subgroup Ranges)
                  </span>
                  <span
                    className="unit"
                    style={{
                      color: rangeSignalCount > 0 ? 'var(--red)' : 'var(--teal-dark)',
                      borderColor: rangeSignalCount > 0 ? 'var(--red)' : 'var(--line)',
                      background: rangeSignalCount > 0 ? '#fdf1f0' : 'var(--teal-soft)',
                    }}
                  >
                    {rangeSignalCount > 0 ? `${rangeSignalCount} signal${rangeSignalCount > 1 ? 's' : ''}` : 'In control'}
                  </span>
                </div>

                <RChart
                  ranges={result.ranges}
                  meanRange={result.meanRange}
                  rangeUcl={result.rangeUcl}
                  rangeLcl={result.rangeLcl}
                  rangesOutOfControl={result.rangesOutOfControl}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '8px',
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--chart-accent)',
                        display: 'inline-block',
                      }}
                    />
                    <span>Normal range</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--chart-fail)',
                        boxShadow: '0 0 0 2px var(--chart-fail)',
                        display: 'inline-block',
                      }}
                    />
                    <span>Outside limits</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '14px', borderTop: '1.5px dashed var(--chart-limit)', display: 'inline-block' }} />
                    <span>Range limits (UCL/LCL)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '14px', borderTop: '1.5px solid var(--chart-accent)', display: 'inline-block' }} />
                    <span>Mean range (CL)</span>
                  </div>
                </div>
              </div>
            </div>

            <table className="model-table">
              <caption>Per-subgroup mean and range against the limits</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Mean</th>
                  <th scope="col">Range</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.means.map((mean, index) => {
                  const meanOut = result.meansOutOfControl.includes(index);
                  const rangeOut = result.rangesOutOfControl.includes(index);
                  const run = result.runs.find(
                    (entry) => index >= entry.startIndex && index <= entry.endIndex,
                  );
                  const status = [
                    meanOut ? 'mean out of limits' : null,
                    rangeOut ? 'range out of limits' : null,
                    run ? `run ${run.side}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={index}>
                      <th scope="row">{index + 1}</th>
                      <td>{fmt(mean)}</td>
                      <td>{fmt(result.ranges[index])}</td>
                      <td>{status === '' ? 'in control' : status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="note">
              Control limits come from the variation inside the subgroups, not from the specification. An
              in-control chart says the process is stable, not that it is capable: put the same data through the
              process capability calculator for the specification question.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
