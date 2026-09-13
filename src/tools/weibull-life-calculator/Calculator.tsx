'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { fitWeibull, weibullReliability, weibullUnreliability } from '@/lib/weibull';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

const SAMPLE = ['50', '100', '150', '200', '250', '300'].join('\n');

const INITIAL = { times: SAMPLE, missionHours: '100' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Parse one failure time per line, ignoring blanks and # comments. */
function parseTimes(text: string): number[] {
  const times: number[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      throw new Error(`Line ${index + 1} is not a failure time: "${trimmed}".`);
    }
    times.push(value);
  });
  return times;
}

interface WeibullPlotProps {
  sortedTimes: number[];
  beta: number;
  etaHours: number;
  b10Hours: number;
  b50Hours: number;
}

function WeibullPlot({ sortedTimes, beta, etaHours, b10Hours, b50Hours }: WeibullPlotProps) {
  const n = sortedTimes.length;

  // Empirical sample points: x_i = ln(t_i), y_i = ln(-ln(1 - F_i))
  const points = sortedTimes.map((t, i) => {
    const rank = (i + 1 - 0.3) / (n + 0.4);
    const yVal = Math.log(-Math.log(1 - rank));
    const xVal = Math.log(t);
    return { time: t, rank, x: xVal, y: yVal };
  });

  // Target percentiles on the Weibull scale: y = ln(-ln(1 - F))
  const percentileTicks = [
    { label: '1%', f: 0.01 },
    { label: '5%', f: 0.05 },
    { label: '10%', f: 0.10 },
    { label: '20%', f: 0.20 },
    { label: '50%', f: 0.50 },
    { label: '63.2%', f: 1 - Math.exp(-1) },
    { label: '90%', f: 0.90 },
    { label: '99%', f: 0.99 },
  ].map((item) => ({
    ...item,
    yVal: Math.log(-Math.log(1 - item.f)),
  }));

  // Determine Y range from data, percentiles, and margins
  const allYVals = [...points.map((p) => p.y), ...percentileTicks.map((p) => p.yVal)];
  const dataMinY = Math.min(...allYVals);
  const dataMaxY = Math.max(...allYVals);
  const ySpan = dataMaxY - dataMinY || 1;
  const yDomainMin = dataMinY - ySpan * 0.06;
  const yDomainMax = dataMaxY + ySpan * 0.06;

  // Determine X range from sample times, eta, b10, b50
  const referenceTimes = [etaHours, b10Hours, b50Hours, ...sortedTimes].filter(
    (t) => Number.isFinite(t) && t > 0,
  );
  const minTime = Math.min(...referenceTimes);
  const maxTime = Math.max(...referenceTimes);

  const minLnT = Math.log(minTime);
  const maxLnT = Math.log(maxTime);
  const xSpan = maxLnT - minLnT || 1;
  const xDomainMin = minLnT - xSpan * 0.14;
  const xDomainMax = maxLnT + xSpan * 0.14;

  const tDomainMin = Math.exp(xDomainMin);
  const tDomainMax = Math.exp(xDomainMax);

  // Pick nice time ticks for the X-axis across the range [tDomainMin, tDomainMax]
  const niceCandidates = [
    1, 2, 5, 10, 20, 25, 50, 100, 150, 200, 250, 300, 400, 500,
    750, 1000, 1500, 2000, 2500, 5000, 10000, 20000, 50000, 100000,
  ];
  let timeTicks = niceCandidates.filter((t) => t >= tDomainMin * 0.95 && t <= tDomainMax * 1.05);
  if (timeTicks.length < 3) {
    // Fallback: interpolate 5 geometric or linear points
    const step = (maxLnT - minLnT) / 4;
    timeTicks = [0, 1, 2, 3, 4].map((i) => Math.round(Math.exp(minLnT + i * step)));
  } else if (timeTicks.length > 7) {
    // Subsample to around 5-6 ticks
    const step = Math.ceil(timeTicks.length / 6);
    timeTicks = timeTicks.filter((_, idx) => idx % step === 0 || idx === timeTicks.length - 1);
  }

  // SVG dimensions
  const width = 580;
  const height = 320;
  const marginLeft = 56;
  const marginRight = 74;
  const marginTop = 24;
  const marginBottom = 34;

  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const toSvgX = (lnT: number) =>
    plotLeft + ((lnT - xDomainMin) / (xDomainMax - xDomainMin)) * plotWidth;
  const toSvgY = (yVal: number) =>
    plotTop + (1 - (yVal - yDomainMin) / (yDomainMax - yDomainMin)) * plotHeight;

  // Fitted linear regression line: y = beta * ln(t) - beta * ln(eta)
  // Compute line start and end at xDomainMin and xDomainMax
  const lineX1 = toSvgX(xDomainMin);
  const lineY1 = toSvgY(beta * (xDomainMin - Math.log(etaHours)));
  const lineX2 = toSvgX(xDomainMax);
  const lineY2 = toSvgY(beta * (xDomainMax - Math.log(etaHours)));

  // Key milestones: B10 (F = 0.1), B50 (F = 0.5), Eta (F = 1 - 1/e ≈ 63.2%)
  const milestones = [
    {
      key: 'b10',
      label: 'B10',
      hours: b10Hours,
      yVal: Math.log(-Math.log(1 - 0.1)),
      color: 'var(--amber)',
    },
    {
      key: 'b50',
      label: 'B50',
      hours: b50Hours,
      yVal: Math.log(-Math.log(1 - 0.5)),
      color: 'var(--ink-soft)',
    },
    {
      key: 'eta',
      label: 'η (63.2%)',
      hours: etaHours,
      yVal: 0, // ln(-ln(1 - (1 - 1/e))) = ln(1) = 0
      color: 'var(--teal)',
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`Weibull probability plot with ${n} failure samples, shape beta ${fmt(beta)}, scale eta ${fmt(etaHours)} hours`}
    >
      <title>Weibull Probability Plot</title>
      <desc>
        Linearized Weibull paper plot: empirical median ranks against failure time with fitted line and milestones.
      </desc>

      <defs>
        {/* Clip path so fitted line doesn't spill outside plot box */}
        <clipPath id="weibull-plot-clip">
          <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>

      {/* Plot area background */}
      <rect
        x={plotLeft}
        y={plotTop}
        width={plotWidth}
        height={plotHeight}
        fill="#ffffff"
        stroke="var(--line)"
        strokeWidth="1"
        rx="4"
      />

      {/* Horizontal grid lines for percentiles */}
      {percentileTicks.map((p) => {
        const y = toSvgY(p.yVal);
        if (y < plotTop || y > plotBottom) return null;
        const isMajor = p.label === '63.2%' || p.label === '50%' || p.label === '10%';
        return (
          <g key={p.label}>
            <line
              x1={plotLeft}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke="var(--line)"
              strokeWidth={isMajor ? '0.9' : '0.6'}
              strokeDasharray={isMajor ? undefined : '2 3'}
            />
            <text
              x={plotLeft - 6}
              y={y + 3.5}
              textAnchor="end"
              fontSize="9.5"
              fill={isMajor ? 'var(--ink-soft)' : 'var(--muted)'}
              fontFamily="var(--font-mono)"
              fontWeight={isMajor ? '600' : '400'}
            >
              {p.label}
            </text>
          </g>
        );
      })}

      {/* Vertical grid lines for real time ticks */}
      {timeTicks.map((t) => {
        const x = toSvgX(Math.log(t));
        if (x < plotLeft || x > plotRight) return null;
        return (
          <g key={t}>
            <line
              x1={x}
              y1={plotTop}
              x2={x}
              y2={plotBottom}
              stroke="var(--line)"
              strokeWidth="0.6"
              strokeDasharray="2 3"
            />
            <line
              x1={x}
              y1={plotBottom}
              x2={x}
              y2={plotBottom + 4}
              stroke="var(--line-strong)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={plotBottom + 15}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--muted)"
              fontFamily="var(--font-mono)"
            >
              {t >= 1000 ? `${t / 1000}k` : `${t}`}h
            </text>
          </g>
        );
      })}

      {/* Milestone guide markers (dashed lines to milestone coordinates) */}
      {milestones.map((m) => {
        const x = toSvgX(Math.log(m.hours));
        const y = toSvgY(m.yVal);
        if (x < plotLeft || x > plotRight || y < plotTop || y > plotBottom) return null;

        return (
          <g key={m.key}>
            {/* Vertical dashed line from X axis to point on curve */}
            <line
              x1={x}
              y1={plotBottom}
              x2={x}
              y2={y}
              stroke={m.color}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.85"
            />
            {/* Horizontal dashed line from point on curve to right label */}
            <line
              x1={x}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke={m.color}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.85"
            />
            {/* Milestone node marker on the regression line */}
            <rect
              x={x - 3.5}
              y={y - 3.5}
              width="7"
              height="7"
              fill={m.color}
              transform={`rotate(45 ${x} ${y})`}
            >
              <title>{`${m.label}: ${fmt(m.hours)} h`}</title>
            </rect>
            {/* Right margin label */}
            <text
              x={plotRight + 6}
              y={y + 3.5}
              fill={m.color}
              fontSize="9.5"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Fitted linear regression line */}
      <g clipPath="url(#weibull-plot-clip)">
        <line
          x1={lineX1}
          y1={lineY1}
          x2={lineX2}
          y2={lineY2}
          stroke="var(--teal)"
          strokeWidth="2"
        />
      </g>

      {/* Empirical sample points */}
      {points.map((pt, i) => {
        const cx = toSvgX(pt.x);
        const cy = toSvgY(pt.y);
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="4.5"
              fill="var(--teal-dark)"
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <title>{`Failure #${i + 1}: ${fmt(pt.time)} h, unreliability F = ${(pt.rank * 100).toFixed(1)}%`}</title>
            </circle>
          </g>
        );
      })}

      {/* Y-axis title */}
      <text
        x={plotLeft - 4}
        y={plotTop - 8}
        textAnchor="end"
        fontSize="9.5"
        fontWeight="500"
        fill="var(--muted)"
      >
        Unreliability F (%)
      </text>

      {/* X-axis title */}
      <text
        x={plotLeft + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize="10"
        fill="var(--muted)"
      >
        Failure time t (log scale)
      </text>
    </svg>
  );
}

export default function WeibullLifeCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();
  const g = useGlossary();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    try {
      const times = parseTimes(state.times);
      const fit = fitWeibull(times);
      const missionHours = num(state.missionHours);
      const reliability = Number.isFinite(missionHours)
        ? weibullReliability(missionHours, fit.beta, fit.etaHours)
        : null;
      const sortedTimes = [...times].sort((a, b) => a - b);
      return { ok: true as const, ...fit, missionHours, reliability, sortedTimes };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The data could not be fitted.'],
      };
    }
  }, [state.times, state.missionHours]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'Weibull fit (median rank)',
      `Failures fitted = ${result.count}`,
      `Shape beta = ${fmt(result.beta)}`,
      `Scale eta = ${fmt(result.etaHours)} h`,
      `Fit correlation = ${fmt(result.rSquared)}`,
      `MTBF = ${fmt(result.mtbfHours)} h`,
      `B1 = ${fmt(result.b1Hours)} h`,
      `B10 = ${fmt(result.b10Hours)} h`,
      `B50 = ${fmt(result.b50Hours)} h`,
    ];
    if (result.reliability !== null) {
      head.push(`Reliability at ${fmt(result.missionHours)} h = ${fmt(result.reliability)}`);
    }
    return head;
  }, [result]);

  const weakFit = result.ok && result.rSquared < 0.9;

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="wb-times">Failure times in hours, one per line</label>
          <textarea
            id="wb-times"
            rows={8}
            spellCheck={false}
            value={state.times}
            onChange={(event) => update('times', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="wb-mission">Mission time for R(t) (h)</label>
          <input
            id="wb-mission"
            type="number"
            inputMode="decimal"
            value={state.missionHours}
            onChange={(event) => update('missionHours', event.target.value)}
          />
        </div>
        <p className="note">
          Times are sorted before fitting, so any order works. Lines starting with # are ignored. Every unit is
          treated as a failure: run-out or suspended units would need a censored estimator, which this fit is not.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={() => void copy(lines.join('\n'))} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
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
            <span className="unit">Shape parameter β</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.beta)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Scale parameter η</dt>
                <dd>{fmt(result.etaHours)} h</dd>
              </div>
              <div>
                <dt>Fit correlation</dt>
                <dd>{fmt(result.rSquared)}</dd>
              </div>
              <div>
                <dt>MTBF</dt>
                <dd>{fmt(result.mtbfHours)} h</dd>
              </div>
              <div>
                <dt>B1 life</dt>
                <dd>{fmt(result.b1Hours)} h</dd>
              </div>
              <div>
                <dt>B10 life</dt>
                <dd>{fmt(result.b10Hours)} h</dd>
              </div>
              <div>
                <dt>B50 life</dt>
                <dd>{fmt(result.b50Hours)} h</dd>
              </div>
              {result.reliability !== null ? (
                <div>
                  <dt>Reliability at {fmt(result.missionHours)} h</dt>
                  <dd>{fmt(result.reliability)}</dd>
                </div>
              ) : null}
              {result.reliability !== null ? (
                <div>
                  <dt>Unreliability at {fmt(result.missionHours)} h</dt>
                  <dd>{fmt(weibullUnreliability(result.missionHours, result.beta, result.etaHours))}</dd>
                </div>
              ) : null}
            </dl>

            {/* Weibull Probability Plot */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px',
                margin: '16px 0 20px',
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
                  Weibull Probability Plot
                </span>
                <span
                  className="unit"
                  style={{
                    color: weakFit ? 'var(--amber)' : 'var(--teal-dark)',
                    borderColor: weakFit ? 'var(--amber)' : 'var(--line)',
                    background: weakFit ? '#fef9ee' : 'var(--teal-soft)',
                  }}
                >
                  R² = {fmt(result.rSquared)}
                </span>
              </div>

              <WeibullPlot
                sortedTimes={result.sortedTimes}
                beta={result.beta}
                etaHours={result.etaHours}
                b10Hours={result.b10Hours}
                b50Hours={result.b50Hours}
              />

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '10px',
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
                      background: 'var(--teal-dark)',
                      display: 'inline-block',
                    }}
                  />
                  <span>Median rank sample point</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '14px', borderTop: '2px solid var(--teal)', display: 'inline-block' }} />
                  <span>Fitted Weibull line</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      background: 'var(--teal)',
                      transform: 'rotate(45deg)',
                      display: 'inline-block',
                    }}
                  />
                  <span>η scale ({fmt(result.etaHours)} h)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      background: 'var(--amber)',
                      transform: 'rotate(45deg)',
                      display: 'inline-block',
                    }}
                  />
                  <span>B10 life ({fmt(result.b10Hours)} h)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      background: 'var(--ink-soft)',
                      transform: 'rotate(45deg)',
                      display: 'inline-block',
                    }}
                  />
                  <span>B50 life ({fmt(result.b50Hours)} h)</span>
                </div>
              </div>
            </div>

            <p className="note">
              β below 1 means infant mortality, near 1 is a random failure rate, and above 1 means wear out. This
              data fits β = {fmt(result.beta)}.
            </p>
            {weakFit ? (
              <p className="note">
                The correlation is only {fmt(result.rSquared)}, so the points do not fall on a straight line well.
                A Weibull assumption is weakly supported here and the B life figures should be treated as
                indicative.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
