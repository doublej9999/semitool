'use client';

import { useMemo, useState } from 'react';
import type { StdfParametricTestRecord } from '@/lib/stdf-parser';
import {
  alignByPart,
  correlateTests,
  CORRELATION_GROUP_CAP,
  splitTestGroupKey,
  topCorrelations,
  type AlignedPartPair,
} from '@/lib/parametric-analysis';

const formatStat = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : value.toFixed(2);

export default function CorrelationPanel({ groups }: { groups: [string, StdfParametricTestRecord[]][] }) {
  const keys = useMemo(() => groups.map(([key]) => key), [groups]);
  // Initial selection = the two largest-listed tests; the parent remounts
  // this panel (keyed by load) whenever a new file is parsed or restored,
  // so the selection can never reference a stale test group.
  const [testA, setTestA] = useState(keys[0] ?? '');
  const [testB, setTestB] = useState(keys[1] ?? keys[0] ?? '');

  const groupsMap = useMemo(() => new Map(groups), [groups]);
  const labelFor = (key: string) => {
    const { name, units } = splitTestGroupKey(key);
    return units ? `${name} [${units}]` : name;
  };

  const recordsA = testA ? groupsMap.get(testA) : undefined;
  const recordsB = testB ? groupsMap.get(testB) : undefined;
  const aligned = useMemo(
    () => (recordsA && recordsB ? alignByPart(recordsA, recordsB) : []),
    [recordsA, recordsB],
  );
  const correlation = useMemo(
    () => (recordsA && recordsB ? correlateTests(recordsA, recordsB) : null),
    [recordsA, recordsB],
  );
  const topPairs = useMemo(() => topCorrelations(groupsMap), [groupsMap]);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px',
        background: 'var(--panel-subtle)',
      }}
    >
      <h3 style={{ marginTop: 0 }}>PTR correlation</h3>
      <p className="note" style={{ marginTop: 0 }}>
        Aligns the two tests&apos; PTR records part-by-part (head, site, execution order) and correlates the shared
        measurements. Spearman ρ also catches monotonic-but-nonlinear relationships that Pearson r underestimates.
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div className="field">
          <label htmlFor="corr-test-a">Test A (X axis)</label>
          <select id="corr-test-a" value={testA} onChange={(event) => setTestA(event.target.value)}>
            {keys.map((key) => (
              <option key={key} value={key}>
                {labelFor(key)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="corr-test-b">Test B (Y axis)</label>
          <select id="corr-test-b" value={testB} onChange={(event) => setTestB(event.target.value)}>
            {keys.map((key) => (
              <option key={key} value={key}>
                {labelFor(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!testA || !testB || testA === testB ? (
        <p className="note" style={{ marginBottom: 0 }}>
          Select two different tests to compute a correlation.
        </p>
      ) : (
        <>
          <div style={{ marginTop: '12px' }}>
            <ScatterPlot pairs={aligned} labelA={labelFor(testA)} labelB={labelFor(testB)} />
          </div>
          <p className="note" style={{ fontWeight: 600, marginBottom: 0 }}>
            r = {formatStat(correlation?.pearson)} · ρ = {formatStat(correlation?.spearman)} · n = {aligned.length}
          </p>
          {aligned.length > 0 && aligned.length < 3 ? (
            <p className="note" style={{ marginBottom: 0 }}>
              Fewer than 3 aligned part pairs — coefficients need at least 3.
            </p>
          ) : null}
        </>
      )}

      <h3 style={{ marginTop: '20px' }}>Strongest pairs</h3>
      {topPairs.length > 0 ? (
        <>
          <p className="note" style={{ marginTop: 0 }}>
            Top {topPairs.length} pair{topPairs.length === 1 ? '' : 's'} across the{' '}
            {Math.min(CORRELATION_GROUP_CAP, groups.length)} largest tests, ranked by |r| — click a row to load the
            pair into the scatter plot.
          </p>
          <div className="table-scroll">
            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Test A</th>
                  <th scope="col">Test B</th>
                  <th scope="col">n</th>
                  <th scope="col">r</th>
                  <th scope="col">ρ</th>
                </tr>
              </thead>
              <tbody>
                {topPairs.map((pair) => (
                  <tr
                    key={`${pair.testA} → ${pair.testB}`}
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setTestA(pair.testA);
                      setTestB(pair.testB);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setTestA(pair.testA);
                        setTestB(pair.testB);
                      }
                    }}
                  >
                    <td>{labelFor(pair.testA)}</td>
                    <td>{labelFor(pair.testB)}</td>
                    <td>{pair.n}</td>
                    <td style={{ color: pair.pearson! < 0 ? '#b0413a' : '#1b806a', fontWeight: 700 }}>
                      {pair.pearson!.toFixed(2)}
                    </td>
                    <td>{formatStat(pair.spearman)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="note" style={{ marginTop: 0 }}>
          No rankable pairs yet — correlation needs at least two tests with 3+ shared parts.
        </p>
      )}
    </div>
  );
}

/** Inline SVG scatter plot of aligned PTR pairs with min/mid/max axis ticks. */
function ScatterPlot({ pairs, labelA, labelB }: { pairs: AlignedPartPair[]; labelA: string; labelB: string }) {
  if (pairs.length === 0) {
    return <p className="note" style={{ margin: 0 }}>No aligned parts between the two selected tests.</p>;
  }

  const width = 460;
  const height = 300;
  const padLeft = 52;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 40;

  // Loop instead of Math.min(...values): aligned pairs can reach the
  // worker's raised 200,000-record cap and spread would overflow the stack.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pair of pairs) {
    if (pair.resultA < minX) minX = pair.resultA;
    if (pair.resultA > maxX) maxX = pair.resultA;
    if (pair.resultB < minY) minY = pair.resultB;
    if (pair.resultB > maxY) maxY = pair.resultB;
  }
  if (minX === maxX) {
    minX -= 1;
    maxX += 1;
  }
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const marginX = (maxX - minX) * 0.05;
  const marginY = (maxY - minY) * 0.05;
  minX -= marginX;
  maxX += marginX;
  minY -= marginY;
  maxY += marginY;

  const px = (value: number) => padLeft + ((value - minX) / (maxX - minX)) * (width - padLeft - padRight);
  const py = (value: number) => height - padBottom - ((value - minY) / (maxY - minY)) * (height - padTop - padBottom);

  // Display-cap very large samples by step sampling (like the sparklines).
  const maxPoints = 1500;
  const step = Math.max(1, Math.ceil(pairs.length / maxPoints));
  const shown = step > 1 ? pairs.filter((_, index) => index % step === 0) : pairs;

  const formatTick = (value: number) => {
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 100000 || abs < 0.001)) return value.toExponential(1);
    return String(Number(value.toPrecision(3)));
  };

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const axisColor = '#b4bec4';
  const textColor = '#5a6a70';
  const truncate = (label: string) => (label.length > 30 ? `${label.slice(0, 29)}…` : label);
  const shownLabelA = truncate(labelA);
  const shownLabelB = truncate(labelB);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: '560px' }}
      role="img"
      aria-label={`Scatter plot of ${shownLabelA} (X) versus ${shownLabelB} (Y) over ${pairs.length} aligned parts`}
    >
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke={axisColor} strokeWidth="1" />
      <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke={axisColor} strokeWidth="1" />

      {[minX, midX, maxX].map((tick) => (
        <g key={`x-${tick}`}>
          <line x1={px(tick)} y1={height - padBottom} x2={px(tick)} y2={height - padBottom + 4} stroke={axisColor} strokeWidth="1" />
          <text x={px(tick)} y={height - padBottom + 14} fontSize="9" fill={textColor} textAnchor="middle">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {[minY, midY, maxY].map((tick) => (
        <g key={`y-${tick}`}>
          <line x1={padLeft - 4} y1={py(tick)} x2={padLeft} y2={py(tick)} stroke={axisColor} strokeWidth="1" />
          <text x={padLeft - 6} y={py(tick)} fontSize="9" fill={textColor} textAnchor="end" dominantBaseline="middle">
            {formatTick(tick)}
          </text>
        </g>
      ))}

      {shown.map((pair, index) => (
        <circle key={index} cx={px(pair.resultA)} cy={py(pair.resultB)} r="2.4" fill="#3c9aa4" fillOpacity="0.7" />
      ))}

      <text x={width - padRight} y={height - 8} fontSize="10" fontWeight="600" fill={textColor} textAnchor="end">
        {shownLabelA} →
      </text>
      <text
        transform={`rotate(-90 10 ${(padTop + height - padBottom) / 2})`}
        x={10}
        y={(padTop + height - padBottom) / 2}
        fontSize="10"
        fontWeight="600"
        fill={textColor}
        textAnchor="middle"
      >
        {shownLabelB} →
      </text>
    </svg>
  );
}
