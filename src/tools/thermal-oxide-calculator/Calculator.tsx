'use client';

import { useMemo, useRef, useState } from 'react';
import { Copy, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  OXIDE_PRESETS,
  thicknessAfterTime,
  timeToThickness,
  type OxideRegime,
} from '@/lib/oxide';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv, downloadSvg, downloadXlsx } from '@/lib/export';
import { useGlossary } from '@/lib/i18n/glossary';

const MODES = [
  { id: 'grow', label: 'Time to thickness' },
  { id: 'time', label: 'Thickness to time' },
];

const PRESETS = [
  ...OXIDE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
  { id: 'custom', label: 'Custom A and B' },
];

const INITIAL = {
  presetId: 'dry100',
  aUm: '0.165',
  b: '0.0117',
  initialNm: '0',
  mode: 'grow',
  timeHours: '10',
  targetNm: '500',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

const REGIME_LABEL: Record<OxideRegime, string> = {
  linear: 'Linear (reaction limited)',
  mixed: 'Mixed',
  parabolic: 'Parabolic (diffusion limited)',
};

export default function ThermalOxideCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);
  useUrlParamsState(state, setState);
  const g = useGlossary();

  const kineticsSvgRef = useRef<SVGSVGElement | null>(null);
  const consumptionSvgRef = useRef<SVGSVGElement | null>(null);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => {
      if (key === 'presetId') {
        const preset = OXIDE_PRESETS.find((entry) => entry.id === value);
        if (!preset) return { ...previous, [key]: value };
        return { ...previous, [key]: value, aUm: String(preset.aUm), b: String(preset.bUm2PerHour) };
      }
      return { ...previous, [key]: value };
    });

  const aUmValue = num(state.aUm);
  const bUm2PerHourValue = num(state.b);
  const initialUmValue = num(state.initialNm) / 1000;

  const grow = useMemo(
    () => thicknessAfterTime({ aUm: aUmValue, bUm2PerHour: bUm2PerHourValue, initialUm: initialUmValue, timeHours: num(state.timeHours) }),
    [aUmValue, bUm2PerHourValue, initialUmValue, state.timeHours],
  );

  const time = useMemo(
    () => timeToThickness({ aUm: aUmValue, bUm2PerHour: bUm2PerHourValue, initialUm: initialUmValue, thicknessUm: num(state.targetNm) / 1000 }),
    [aUmValue, bUm2PerHourValue, initialUmValue, state.targetNm],
  );

  const active = state.mode === 'grow' ? grow : time;

  const activeTimeHours = state.mode === 'grow' ? num(state.timeHours) : (time.ok ? time.timeHours : 0);
  const activeThicknessNm = active.ok ? active.thicknessUm * 1000 : 0;
  const activeSiliconConsumedNm = active.ok ? active.siliconConsumedUm * 1000 : 0;

  // Boundary & fab sanity checks
  const boundaryWarnings = useMemo(() => {
    const list: string[] = [];
    if (active.ok) {
      if (num(state.initialNm) > 500) {
        list.push('High starting oxide (>500 nm): Growth begins deep into the diffusion-limited parabolic regime with a large effective initial offset (τ).');
      }
      if (activeThicknessNm > 1200) {
        list.push('Thick oxide (>1.2 µm): Growth rate drops sharply in the parabolic regime, requiring excessive thermal budget. In production fabs, thick dielectric layers (>1 µm) are deposited via TEOS CVD / LPCVD or PECVD rather than thermal oxidation.');
      }
      if (state.mode === 'grow' && num(state.timeHours) > 30) {
        list.push('Long oxidation time (>30 hours): High thermal budget may cause dopant redistribution and wafer slip or warpage.');
      }
    }
    return list;
  }, [active, activeThicknessNm, state.initialNm, state.mode, state.timeHours]);

  // Kinetics Curve Data: x(t) over 0..maxTime
  const curveData = useMemo(() => {
    if (!active.ok || !Number.isFinite(aUmValue) || !Number.isFinite(bUm2PerHourValue)) return null;

    const maxT = Math.max(activeTimeHours * 1.5, 12);
    const steps = 80;
    const dt = maxT / steps;
    const points: Array<{ t: number; thicknessNm: number; rateNmPerHour: number }> = [];

    for (let i = 0; i <= steps; i += 1) {
      const t = i * dt;
      const res = thicknessAfterTime({ aUm: aUmValue, bUm2PerHour: bUm2PerHourValue, initialUm: initialUmValue, timeHours: t });
      if (res.ok) {
        const xNm = res.thicknessUm * 1000;
        // Instantaneous Deal-Grove rate dx/dt = B / (2x + A) in nm/h
        const instRate = (bUm2PerHourValue / (2 * res.thicknessUm + aUmValue)) * 1000;
        points.push({ t, thicknessNm: xNm, rateNmPerHour: instRate });
      }
    }

    const maxThick = Math.max(...points.map((p) => p.thicknessNm), activeThicknessNm * 1.15, 100);

    return { points, maxT, maxThick };
  }, [active, aUmValue, bUm2PerHourValue, initialUmValue, activeTimeHours, activeThicknessNm]);

  const lines = useMemo(() => {
    if (!active.ok) return [];
    if (state.mode === 'grow' && grow.ok) {
      return [
        'Deal-Grove thermal oxidation',
        `A = ${fmt(grow.aUm)} µm, B = ${fmt(grow.bUm2PerHour)} µm²/h`,
        `Thickness = ${fmt(grow.thicknessUm * 1000)} nm after ${fmt(num(state.timeHours))} h`,
        `Silicon consumed = ${fmt(grow.siliconConsumedUm * 1000)} nm`,
        `Linear rate (B/A) = ${fmt(grow.linearRateUmPerHour)} µm/h`,
        `Crossover thickness (A/2) = ${fmt(grow.crossoverUm * 1000)} nm`,
        `Regime: ${REGIME_LABEL[grow.regime]}`,
      ];
    }
    if (time.ok) {
      return [
        'Deal-Grove thermal oxidation',
        `A = ${fmt(time.aUm)} µm, B = ${fmt(time.bUm2PerHour)} µm²/h`,
        `Time = ${fmt(time.timeHours)} h for ${fmt(time.thicknessUm * 1000)} nm`,
        `Silicon consumed = ${fmt(time.siliconConsumedUm * 1000)} nm`,
        `Linear rate (B/A) = ${fmt(time.linearRateUmPerHour)} µm/h`,
        `Crossover thickness (A/2) = ${fmt(time.crossoverUm * 1000)} nm`,
        `Regime: ${REGIME_LABEL[time.regime]}`,
      ];
    }
    return [];
  }, [active, state.mode, state.timeHours, grow, time]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const buildExportRows = () => {
    if (!curveData || !active.ok) return null;

    const headers = [
      'time_hours',
      'oxide_thickness_nm',
      'silicon_consumed_nm',
      'growth_rate_nm_per_h',
      'a_um',
      'b_um2_per_h',
      'regime',
    ];
    const rows = curveData.points.map((p) => [
      p.t.toFixed(3),
      p.thicknessNm.toFixed(2),
      (p.thicknessNm * 0.4556).toFixed(2),
      p.rateNmPerHour.toFixed(2),
      aUmValue,
      bUm2PerHourValue,
      p.thicknessNm < (aUmValue * 500) ? 'Linear' : 'Parabolic',
    ]);
    return { headers, rows };
  };

  const exportCsvFile = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv('deal-grove-oxidation-kinetics.csv', data.headers, data.rows);
  };

  const exportXlsxFile = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx('deal-grove-oxidation-kinetics.xlsx', 'Oxidation Kinetics', data.headers, data.rows);
  };

  // Dimensions for charts
  const width = 540;
  const height = 260;
  const margin = { top: 25, right: 30, bottom: 40, left: 65 };
  const pWidth = width - margin.left - margin.right;
  const pHeight = height - margin.top - margin.bottom;

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="ox-preset">Rate constants at the process temperature</label>
          <select
            id="ox-preset"
            value={state.presetId}
            onChange={(event) => update('presetId', event.target.value)}
          >
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="ox-a">A (µm)</label>
            <input
              id="ox-a"
              type="number"
              inputMode="decimal"
              value={state.aUm}
              onChange={(event) => update('aUm', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ox-b">B (µm²/h)</label>
            <input
              id="ox-b"
              type="number"
              inputMode="decimal"
              value={state.b}
              onChange={(event) => update('b', event.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ox-initial">Oxide already present (nm)</label>
          <input
            id="ox-initial"
            type="number"
            inputMode="decimal"
            value={state.initialNm}
            onChange={(event) => update('initialNm', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ox-mode">Direction</label>
          <select id="ox-mode" value={state.mode} onChange={(event) => update('mode', event.target.value)}>
            {MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
        {state.mode === 'grow' ? (
          <div className="field">
            <label htmlFor="ox-time">Oxidation time (h)</label>
            <input
              id="ox-time"
              type="number"
              inputMode="decimal"
              value={state.timeHours}
              onChange={(event) => update('timeHours', event.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ox-target">{g('targetThickness')} (nm)</label>
            <input
              id="ox-target"
              type="number"
              inputMode="decimal"
              value={state.targetNm}
              onChange={(event) => update('targetNm', event.target.value)}
            />
          </div>
        )}
        <p className="note">
          A and B depend on temperature, ambient and crystal orientation. The presets are the classic
          values for a (100) wafer at 1000 °C; for other conditions, input the Deal-Grove constants for your recipe.
        </p>

        {boundaryWarnings.length > 0 && (
          <div className="physics-alert" role="status" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Process & Boundary Advisory:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {boundaryWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="action-row" style={{ marginTop: '16px' }}>
          <button type="button" className="button primary" onClick={copy} disabled={!active.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="button secondary" onClick={exportCsvFile} disabled={!active.ok}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
          <button type="button" className="button secondary" onClick={exportXlsxFile} disabled={!active.ok}>
            <Download size={16} aria-hidden="true" />
            Export XLSX
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>{g('resultLabel')}</h2>
        {!active.ok ? (
          <div className="error" role="alert">
            {active.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">
              {state.mode === 'grow' ? g('oxideThickness') : 'Oxidation time'}
            </span>
            <div className="result-value" aria-live="polite">
              {state.mode === 'grow' && grow.ok
                ? fmt(grow.thicknessUm * 1000)
                : time.ok
                  ? fmt(time.timeHours)
                  : '--'}
              <span className="result-suffix">
                {state.mode === 'grow' ? ' nm' : ' h'}
              </span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Linear rate B / A</dt>
                <dd>{fmt(active.linearRateUmPerHour)} µm/h</dd>
              </div>
              <div>
                <dt>Crossover A / 2</dt>
                <dd>{fmt(active.crossoverUm * 1000)} nm</dd>
              </div>
              <div>
                <dt>Regime at this thickness</dt>
                <dd>{REGIME_LABEL[active.regime]}</dd>
              </div>
              <div>
                <dt>Offset τ from initial oxide</dt>
                <dd>{fmt(active.tauHours)} h</dd>
              </div>
              <div>
                <dt>Growth in this step</dt>
                <dd>{fmt(active.growthUm * 1000)} nm</dd>
              </div>
              <div>
                <dt>Silicon consumed (45.6%)</dt>
                <dd>{fmt(active.siliconConsumedUm * 1000)} nm</dd>
              </div>
            </dl>

            {/* Deal-Grove Growth Curve SVG */}
            {curveData && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>Deal-Grove Growth Kinetics Curve</h3>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ padding: '3px 8px', fontSize: '12px' }}
                    onClick={() => kineticsSvgRef.current && downloadSvg(kineticsSvgRef.current, 'oxide-kinetics-curve.svg')}
                  >
                    <Download size={13} aria-hidden="true" /> Save SVG
                  </button>
                </div>
                <div style={{ background: 'var(--chart-bg)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <svg
                    ref={kineticsSvgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    width="100%"
                    height="auto"
                    role="img"
                    aria-label="Deal-Grove oxidation thickness versus time curve"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Background grid lines */}
                    {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                      const y = margin.top + pHeight * (1 - frac);
                      const thickVal = curveData.maxThick * frac;
                      return (
                        <g key={frac}>
                          <line x1={margin.left} y1={y} x2={margin.left + pWidth} y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
                          <text x={margin.left - 8} y={y + 4} fontSize="10" fill="var(--chart-axis)" textAnchor="end">
                            {Math.round(thickVal)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Time ticks */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                      const x = margin.left + pWidth * frac;
                      const tVal = curveData.maxT * frac;
                      return (
                        <g key={frac}>
                          <line x1={x} y1={margin.top + pHeight} x2={x} y2={margin.top + pHeight + 4} stroke="var(--chart-axis)" />
                          <text x={x} y={margin.top + pHeight + 16} fontSize="10" fill="var(--chart-axis)" textAnchor="middle">
                            {tVal.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Crossover A/2 line */}
                    {(() => {
                      const crossoverNm = active.crossoverUm * 1000;
                      if (crossoverNm <= curveData.maxThick) {
                        const yCross = margin.top + pHeight * (1 - crossoverNm / curveData.maxThick);
                        return (
                          <g>
                            <line
                              x1={margin.left}
                              y1={yCross}
                              x2={margin.left + pWidth}
                              y2={yCross}
                              stroke="var(--chart-series-2)"
                              strokeWidth="1.2"
                              strokeDasharray="4 4"
                            />
                            <text x={margin.left + pWidth - 6} y={yCross - 5} fontSize="10" fill="var(--chart-series-2)" textAnchor="end">
                              Crossover A/2 = {Math.round(crossoverNm)} nm
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Kinetics Path */}
                    {(() => {
                      const pathD = curveData.points
                        .map((p, i) => {
                          const x = margin.left + (p.t / curveData.maxT) * pWidth;
                          const y = margin.top + pHeight * (1 - p.thicknessNm / curveData.maxThick);
                          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ');
                      return <path d={pathD} fill="none" stroke="var(--chart-accent)" strokeWidth="2.5" />;
                    })()}

                    {/* Operating Point */}
                    {(() => {
                      const opX = margin.left + (Math.min(activeTimeHours, curveData.maxT) / curveData.maxT) * pWidth;
                      const opY = margin.top + pHeight * (1 - Math.min(activeThicknessNm, curveData.maxThick) / curveData.maxThick);
                      return (
                        <g>
                          <line x1={opX} y1={margin.top} x2={opX} y2={margin.top + pHeight} stroke="var(--chart-accent)" strokeDasharray="3 3" strokeWidth="1" />
                          <circle cx={opX} cy={opY} r="5" fill="var(--chart-accent)" stroke="var(--chart-bg)" strokeWidth="2" />
                          <text x={Math.min(opX + 8, width - 80)} y={Math.max(opY - 8, margin.top + 12)} fontSize="11" fontWeight="600" fill="var(--chart-accent)">
                            {fmt(activeThicknessNm)} nm ({fmt(activeTimeHours)} h)
                          </text>
                        </g>
                      );
                    })()}

                    {/* Axes */}
                    <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + pHeight} stroke="var(--chart-axis)" strokeWidth="1.5" />
                    <line x1={margin.left} y1={margin.top + pHeight} x2={margin.left + pWidth} y2={margin.top + pHeight} stroke="var(--chart-axis)" strokeWidth="1.5" />

                    {/* Labels */}
                    <text x={margin.left + pWidth / 2} y={height - 6} fontSize="11" fontWeight="500" fill="var(--chart-axis)" textAnchor="middle">
                      Oxidation Time (hours)
                    </text>
                    <text
                      transform={`rotate(-90 ${margin.left - 42} ${margin.top + pHeight / 2})`}
                      x={margin.left - 42}
                      y={margin.top + pHeight / 2}
                      fontSize="11"
                      fontWeight="500"
                      fill="var(--chart-axis)"
                      textAnchor="middle"
                    >
                      Oxide Thickness (nm)
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* 44% Silicon Consumption Cross-Section Diagram */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>44% Silicon Consumption Cross-Section</h3>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => consumptionSvgRef.current && downloadSvg(consumptionSvgRef.current, 'silicon-consumption.svg')}
                >
                  <Download size={13} aria-hidden="true" /> Save SVG
                </button>
              </div>

              <div style={{ background: 'var(--chart-bg)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <svg
                  ref={consumptionSvgRef}
                  viewBox="0 0 540 180"
                  width="100%"
                  height="auto"
                  role="img"
                  aria-label="Cross-section diagram illustrating 45.6% silicon consumption and 54.4% volume expansion"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Silicon Bulk Base */}
                  <rect x="50" y="115" width="440" height="45" fill="#d0dbd9" stroke="#7a8d8a" strokeWidth="1" />
                  <text x="270" y="142" fontSize="12" fontWeight="500" fill="#2b3b38" textAnchor="middle">
                    Bulk Silicon Substrate (Si crystal matrix)
                  </text>

                  {/* Consumed Silicon Layer (45.6% below original surface) */}
                  <rect x="50" y="75" width="440" height="40" fill="#f4b8b5" stroke="var(--chart-fail)" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="270" y="99" fontSize="11" fontWeight="600" fill="#88211b" textAnchor="middle">
                    Consumed Silicon: {fmt(activeSiliconConsumedNm)} nm (45.6% of oxide)
                  </text>

                  {/* Expanded Oxide Layer (54.4% above original surface) */}
                  <rect x="50" y="30" width="440" height="45" fill="rgba(13, 124, 130, 0.18)" stroke="var(--chart-accent)" strokeWidth="1.5" />
                  <text x="270" y="56" fontSize="11" fontWeight="600" fill="#095559" textAnchor="middle">
                    Volume Expansion: {fmt(activeThicknessNm - activeSiliconConsumedNm)} nm (54.4% above initial plane)
                  </text>

                  {/* Original Silicon Surface Reference Line */}
                  <line x1="35" y1="75" x2="505" y2="75" stroke="var(--chart-text)" strokeWidth="1.8" strokeDasharray="6 3" />
                  <text x="510" y="78" fontSize="10" fontWeight="600" fill="var(--chart-text)">
                    Original Si Surface
                  </text>

                  {/* Dimension Bracket on Left */}
                  <line x1="42" y1="30" x2="42" y2="115" stroke="var(--chart-accent)" strokeWidth="2" />
                  <line x1="38" y1="30" x2="46" y2="30" stroke="var(--chart-accent)" strokeWidth="2" />
                  <line x1="38" y1="115" x2="46" y2="115" stroke="var(--chart-accent)" strokeWidth="2" />
                  <text
                    transform="rotate(-90 32 72)"
                    x="32"
                    y="72"
                    fontSize="10"
                    fontWeight="700"
                    fill="var(--chart-accent)"
                    textAnchor="middle"
                  >
                    Total SiO₂ = {fmt(activeThicknessNm)} nm
                  </text>
                </svg>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
