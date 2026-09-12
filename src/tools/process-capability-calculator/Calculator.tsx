'use client';

import { useMemo, useRef, useState } from 'react';
import { Copy, RotateCcw, Play, Download, BarChart2 } from 'lucide-react';
import { calculateCapability } from '@/lib/capability';
import { useUrlParamsState } from '@/lib/use-url-state';
import {
  runMonteCarloSimulation,
  type MonteCarloResult,
  type ParameterSpec,
} from '@/lib/monte-carlo';
import { downloadCsv, downloadSvg } from '@/lib/export';

const UNITS = ['nm', 'µm', 'mm', 'inch', 'mil', 'unitless'];

const INITIAL = { unit: 'µm', lower: '9', upper: '11', mean: '10', sigma: '0.5' };

function parseLimit(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function num(value: number | null, digits = 3): string {
  return value === null || !Number.isFinite(value) ? '—' : value.toFixed(digits);
}

export default function ProcessCapabilityCalculator() {
  const [values, setValues] = useState(INITIAL);
  useUrlParamsState(values, setValues);
  const [copied, setCopied] = useState(false);

  // Monte Carlo simulation state
  const [runSimulation, setRunSimulation] = useState(false);
  const [mcSamples, setMcSamples] = useState('2000');
  const [mcToolWearSpread, setMcToolWearSpread] = useState('0.15');
  const [mcTemperatureSpread, setMcTemperatureSpread] = useState('0.10');
  const [mcGasFlowSpread, setMcGasFlowSpread] = useState('0.08');

  const histSvgRef = useRef<SVGSVGElement | null>(null);

  const lowerLimit = parseLimit(values.lower);
  const upperLimit = parseLimit(values.upper);
  const mean = values.mean.trim() === '' ? Number.NaN : Number(values.mean);
  const sigma = values.sigma.trim() === '' ? Number.NaN : Number(values.sigma);
  const unit = values.unit;

  const result = useMemo(
    () => calculateCapability({ lowerLimit, upperLimit, mean, sigma }),
    [lowerLimit, upperLimit, mean, sigma],
  );

  // Monte Carlo Simulation computation
  const mcResult: MonteCarloResult | null = useMemo(() => {
    if (!runSimulation || !Number.isFinite(mean) || !Number.isFinite(sigma)) return null;

    const n = Math.max(100, Math.min(10000, Number(mcSamples) || 2000));
    const toolWearSpread = Number(mcToolWearSpread) || 0.15;
    const tempSpread = Number(mcTemperatureSpread) || 0.10;
    const gasSpread = Number(mcGasFlowSpread) || 0.08;

    const parameters: ParameterSpec[] = [
      { name: 'Machine Variation', nominal: mean, spread: Math.max(1e-5, sigma * 0.7), type: 'normal' },
      { name: 'Tool Wear / Aging', nominal: 0, spread: toolWearSpread, type: 'triangular' },
      { name: 'Chamber Temperature Shift', nominal: 0, spread: tempSpread, type: 'uniform' },
      { name: 'Precursor / Gas Fluctuation', nominal: 0, spread: gasSpread, type: 'normal' },
    ];

    return runMonteCarloSimulation({
      parameters,
      sampleSize: n,
      lsl: lowerLimit ?? undefined,
      usl: upperLimit ?? undefined,
      randomSeed: 42,
      evaluate: (p) => {
        return (
          p['Machine Variation'] +
          p['Tool Wear / Aging'] +
          p['Chamber Temperature Shift'] +
          p['Precursor / Gas Fluctuation']
        );
      },
    });
  }, [runSimulation, mean, sigma, mcSamples, mcToolWearSpread, mcTemperatureSpread, mcGasFlowSpread, lowerLimit, upperLimit]);

  const copyResult = async () => {
    if (!result.ok) return;

    const summary = [
      `Unit: ${unit}`,
      `Lower spec limit: ${num(lowerLimit)}`,
      `Upper spec limit: ${num(upperLimit)}`,
      `Process mean: ${num(mean)}`,
      `Process sigma: ${num(sigma)}`,
      `Cp: ${num(result.cp)}`,
      `Cpk: ${num(result.cpk)}`,
      `CPU: ${num(result.cpu)}`,
      `CPL: ${num(result.cpl)}`,
      `Sigma level (3 x Cpk): ${num(result.sigmaLevel)}`,
      `Above USL: ${result.abovePercent.toFixed(4)}%`,
      `Below LSL: ${result.belowPercent.toFixed(4)}%`,
      `Out of spec: ${result.outOfSpecPpm.toFixed(2)} ppm`,
    ];

    if (mcResult) {
      summary.push(
        '--- Monte Carlo Simulation ---',
        `Simulated Samples: ${mcResult.sampleSize}`,
        `Simulated Mean: ${mcResult.mean.toFixed(3)} ${unit}`,
        `Simulated StdDev: ${mcResult.stdDev.toFixed(3)} ${unit}`,
        `Simulated Cpk: ${mcResult.cpk !== null ? mcResult.cpk.toFixed(3) : '—'}`,
        `Simulated Yield: ${mcResult.yieldPercent !== null ? mcResult.yieldPercent.toFixed(2) + '%' : '—'}`,
        `Simulated Defect PPM: ${mcResult.defectPpm !== null ? mcResult.defectPpm.toFixed(0) + ' ppm' : '—'}`,
      );
    }

    try {
      await navigator.clipboard.writeText(summary.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const exportSimulationCsv = () => {
    if (!mcResult) return;
    const headers = ['bin_start', 'bin_end', 'bin_center', 'die_count', 'relative_frequency'];
    const rows = mcResult.histogram.map((bin) => [
      bin.binStart.toFixed(4),
      bin.binEnd.toFixed(4),
      bin.binCenter.toFixed(4),
      bin.count,
      bin.frequency.toFixed(5),
    ]);
    downloadCsv(`monte-carlo-distribution-${unit}.csv`, headers, rows);
  };

  // SVG dimensions for histogram
  const hWidth = 540;
  const hHeight = 220;
  const hMargin = { top: 20, right: 25, bottom: 40, left: 55 };
  const hPlotW = hWidth - hMargin.left - hMargin.right;
  const hPlotH = hHeight - hMargin.top - hMargin.bottom;

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="capability-inputs">
        <h2 id="capability-inputs">Specification and process</h2>

        <div className="field">
          <label htmlFor="capability-unit">Measurement unit</label>
          <select
            id="capability-unit"
            value={unit}
            onChange={(event) => setValues((previous) => ({ ...previous, unit: event.target.value }))}
          >
            {UNITS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="capability-lsl">
              Lower spec limit<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-lsl"
              type="number"
              step="any"
              value={values.lower}
              onChange={(event) => setValues((previous) => ({ ...previous, lower: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="capability-usl">
              Upper spec limit<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-usl"
              type="number"
              step="any"
              value={values.upper}
              onChange={(event) => setValues((previous) => ({ ...previous, upper: event.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="capability-mean">
              Process mean<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-mean"
              type="number"
              step="any"
              value={values.mean}
              onChange={(event) => setValues((previous) => ({ ...previous, mean: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="capability-sigma">
              Process sigma<span className="unit">{unit}</span>
            </label>
            <input
              id="capability-sigma"
              type="number"
              min="0"
              step="any"
              value={values.sigma}
              onChange={(event) => setValues((previous) => ({ ...previous, sigma: event.target.value }))}
            />
          </div>
        </div>

        <p className="note">
          Leave one spec limit blank for a one-sided specification. The mean and sigma must be measured on the same
          characteristic and in the same unit as the limits.
        </p>

        {/* Monte Carlo Process Simulation Settings */}
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--panel-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
              Monte Carlo Process Sensitivity
            </span>
            <button
              type="button"
              className={runSimulation ? 'button primary' : 'button secondary'}
              style={{ padding: '3px 10px', fontSize: '12px' }}
              onClick={() => setRunSimulation(!runSimulation)}
            >
              <Play size={12} aria-hidden="true" />
              {runSimulation ? 'Recalculate' : 'Simulate'}
            </button>
          </div>

          {runSimulation && (
            <>
              <div className="form-row" style={{ marginBottom: '8px' }}>
                <div className="field">
                  <label htmlFor="mc-samples" style={{ fontSize: '12px' }}>Trials (N)</label>
                  <input
                    id="mc-samples"
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={mcSamples}
                    onChange={(e) => setMcSamples(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="mc-wear" style={{ fontSize: '12px' }}>Tool Wear Spread (±{unit})</label>
                  <input
                    id="mc-wear"
                    type="number"
                    step="any"
                    value={mcToolWearSpread}
                    onChange={(e) => setMcToolWearSpread(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="mc-temp" style={{ fontSize: '12px' }}>Temp Drift (±{unit})</label>
                  <input
                    id="mc-temp"
                    type="number"
                    step="any"
                    value={mcTemperatureSpread}
                    onChange={(e) => setMcTemperatureSpread(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="mc-gas" style={{ fontSize: '12px' }}>Precursor Drift (±{unit})</label>
                  <input
                    id="mc-gas"
                    type="number"
                    step="any"
                    value={mcGasFlowSpread}
                    onChange={(e) => setMcGasFlowSpread(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="action-row" style={{ marginTop: '16px' }}>
          <button className="button secondary" type="button" onClick={() => { setValues(INITIAL); setRunSimulation(false); }}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="capability-result">
        <h2 id="capability-result">Capability & Tolerance Analysis</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Cpk</span>
            <div className="result-value" aria-live="polite">
              {num(result.cpk)}
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Cp (both limits)</span>
                <strong>{num(result.cp)}</strong>
              </div>
              <div className="metric">
                <span>CPU (upper)</span>
                <strong>{num(result.cpu)}</strong>
              </div>
              <div className="metric">
                <span>CPL (lower)</span>
                <strong>{num(result.cpl)}</strong>
              </div>
              <div className="metric">
                <span>Sigma level (3 x Cpk)</span>
                <strong>{num(result.sigmaLevel)}</strong>
              </div>
              <div className="metric">
                <span>Out of spec</span>
                <strong>{result.outOfSpecPpm.toFixed(1)} ppm</strong>
              </div>
              <div className="metric">
                <span>Theoretical Yield</span>
                <strong>{(100 - result.outOfSpecPpm / 10000).toFixed(3)}%</strong>
              </div>
            </div>

            {/* Monte Carlo Simulated Results */}
            {mcResult && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    Monte Carlo Simulated Distribution (N={mcResult.sampleSize})
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => histSvgRef.current && downloadSvg(histSvgRef.current, 'monte-carlo-histogram.svg')}
                    >
                      <Download size={12} aria-hidden="true" /> SVG
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={exportSimulationCsv}
                    >
                      <Download size={12} aria-hidden="true" /> CSV
                    </button>
                  </div>
                </div>

                <div className="metric-grid" style={{ marginBottom: '12px' }}>
                  <div className="metric">
                    <span>Simulated Cpk</span>
                    <strong style={{ color: mcResult.cpk && mcResult.cpk >= 1.33 ? 'var(--teal)' : '#b0413a' }}>
                      {mcResult.cpk !== null ? mcResult.cpk.toFixed(3) : '—'}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Simulated Yield</span>
                    <strong>{mcResult.yieldPercent !== null ? mcResult.yieldPercent.toFixed(2) + '%' : '—'}</strong>
                  </div>
                  <div className="metric">
                    <span>Defect PPM</span>
                    <strong>{mcResult.defectPpm !== null ? mcResult.defectPpm.toFixed(0) : '—'}</strong>
                  </div>
                  <div className="metric">
                    <span>Skew / Kurtosis</span>
                    <strong style={{ fontSize: '13px' }}>
                      {mcResult.skewness.toFixed(2)} / {mcResult.kurtosis.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* SVG Histogram */}
                <div style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden', padding: '6px' }}>
                  <svg
                    ref={histSvgRef}
                    viewBox={`0 0 ${hWidth} ${hHeight}`}
                    width="100%"
                    height="auto"
                    role="img"
                    aria-label="Monte Carlo output distribution histogram"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Plot area background */}
                    <rect x={hMargin.left} y={hMargin.top} width={hPlotW} height={hPlotH} fill="#fafbfc" stroke="#e1e6e8" />

                    {(() => {
                      const maxFreq = Math.max(...mcResult.histogram.map((b) => b.frequency), 0.05);
                      const minX = mcResult.histogram[0]?.binStart ?? 0;
                      const maxX = mcResult.histogram[mcResult.histogram.length - 1]?.binEnd ?? 1;
                      const rangeX = maxX - minX || 1;

                      return (
                        <>
                          {/* Spec limit lines */}
                          {lowerLimit !== null && lowerLimit >= minX && lowerLimit <= maxX && (
                            <g>
                              <line
                                x1={hMargin.left + ((lowerLimit - minX) / rangeX) * hPlotW}
                                y1={hMargin.top}
                                x2={hMargin.left + ((lowerLimit - minX) / rangeX) * hPlotW}
                                y2={hMargin.top + hPlotH}
                                stroke="#b0413a"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={hMargin.left + ((lowerLimit - minX) / rangeX) * hPlotW}
                                y={hMargin.top - 4}
                                fontSize="9"
                                fill="#b0413a"
                                textAnchor="middle"
                                fontWeight="600"
                              >
                                LSL
                              </text>
                            </g>
                          )}
                          {upperLimit !== null && upperLimit >= minX && upperLimit <= maxX && (
                            <g>
                              <line
                                x1={hMargin.left + ((upperLimit - minX) / rangeX) * hPlotW}
                                y1={hMargin.top}
                                x2={hMargin.left + ((upperLimit - minX) / rangeX) * hPlotW}
                                y2={hMargin.top + hPlotH}
                                stroke="#b0413a"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={hMargin.left + ((upperLimit - minX) / rangeX) * hPlotW}
                                y={hMargin.top - 4}
                                fontSize="9"
                                fill="#b0413a"
                                textAnchor="middle"
                                fontWeight="600"
                              >
                                USL
                              </text>
                            </g>
                          )}

                          {/* Histogram bars */}
                          {mcResult.histogram.map((bin, idx) => {
                            const x1 = hMargin.left + ((bin.binStart - minX) / rangeX) * hPlotW;
                            const x2 = hMargin.left + ((bin.binEnd - minX) / rangeX) * hPlotW;
                            const bWidth = Math.max(1, x2 - x1 - 1);
                            const bH = (bin.frequency / maxFreq) * hPlotH;
                            const y = hMargin.top + hPlotH - bH;
                            const isOos =
                              (lowerLimit !== null && bin.binCenter < lowerLimit) ||
                              (upperLimit !== null && bin.binCenter > upperLimit);

                            return (
                              <rect
                                key={idx}
                                x={x1}
                                y={y}
                                width={bWidth}
                                height={bH}
                                fill={isOos ? '#e06a64' : 'var(--teal)'}
                                opacity={0.85}
                              />
                            );
                          })}

                          {/* X-axis ticks */}
                          {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                            const val = minX + rangeX * frac;
                            const x = hMargin.left + hPlotW * frac;
                            return (
                              <g key={frac}>
                                <line x1={x} y1={hMargin.top + hPlotH} x2={x} y2={hMargin.top + hPlotH + 4} stroke="#6a7a78" />
                                <text x={x} y={hMargin.top + hPlotH + 14} fontSize="9" fill="#6a7a78" textAnchor="middle">
                                  {val.toFixed(2)}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Labels */}
                    <text x={hMargin.left + hPlotW / 2} y={hHeight - 4} fontSize="10" fill="#152127" textAnchor="middle">
                      Process Value ({unit})
                    </text>
                  </svg>
                </div>

                {/* Sensitivity Ranking (Tornado-style variance contribution) */}
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink-soft)' }}>
                    Variance Sensitivity Ranking (Sobol % contribution)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {mcResult.sensitivities.map((s) => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                        <span style={{ width: '170px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {s.name} (r={s.correlation.toFixed(2)})
                        </span>
                        <div style={{ flex: 1, height: '8px', background: '#ecefe0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, s.varianceContributionPercent))}%`,
                              height: '100%',
                              background: 'var(--teal)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                        <span style={{ width: '45px', textAlign: 'right', fontWeight: '600' }}>
                          {s.varianceContributionPercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="action-row" style={{ marginTop: '16px' }}>
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
