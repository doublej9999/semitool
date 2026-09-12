'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateCoffinMansonNf,
  calculateShearStrainRange,
  calculateThermalFatigue,
  DIE_PRESETS,
  SOLDER_ALLOY_PRESETS,
  SUBSTRATE_PRESETS,
  TEST_CONDITION_PRESETS,
  type ThermalFatigueSuccess,
} from '@/lib/thermal-fatigue';

const INITIAL = {
  testPresetId: 'jedec-b',
  tMinC: '-40',
  tMaxC: '125',
  substratePresetId: 'fr4',
  substrateCtePpm: '15.0',
  diePresetId: 'si',
  dieCtePpm: '2.6',
  dieWidthMm: '10.0',
  dieHeightMm: '10.0',
  bumpHeightUm: '100',
  alloyPresetId: 'sac305',
  epsilonF: '0.325',
  c: '-0.47',
  fieldDeltaTC: '45',
  accelerationExponentM: '1.9',
  cyclesPerDay: '4',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

interface FatiguePlotProps {
  currentTest: ThermalFatigueSuccess;
  epsilonF: number;
  c: number;
  dnpMm: number;
  deltaAlphaPpm: number;
  bumpHeightUm: number;
}

function FatiguePlot({
  currentTest,
  epsilonF,
  c,
  dnpMm,
  deltaAlphaPpm,
  bumpHeightUm,
}: FatiguePlotProps) {
  // Plot range for Delta T: log scale from 20 °C to 300 °C
  const minDeltaT = 20;
  const maxDeltaT = 300;

  // We evaluate Nf across range of Delta T
  const getNfForDeltaT = (dt: number) => {
    const gamma = calculateShearStrainRange(dnpMm, deltaAlphaPpm, dt, bumpHeightUm);
    return calculateCoffinMansonNf(gamma, epsilonF, c);
  };

  const testDeltaT = currentTest.deltaTTestC;
  const testNf = currentTest.nf;
  const fieldDeltaT = currentTest.fieldDeltaTC;
  const fieldNf = getNfForDeltaT(fieldDeltaT);

  // Compute curve samples
  const steps = 40;
  const logMin = Math.log10(minDeltaT);
  const logMax = Math.log10(maxDeltaT);
  const curvePoints: { deltaT: number; nf: number; logDt: number; logNf: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const logVal = logMin + (i / steps) * (logMax - logMin);
    const dt = Math.pow(10, logVal);
    const nfVal = getNfForDeltaT(dt);
    if (Number.isFinite(nfVal) && nfVal > 0) {
      curvePoints.push({
        deltaT: dt,
        nf: nfVal,
        logDt: Math.log10(dt),
        logNf: Math.log10(nfVal),
      });
    }
  }

  // Calculate Nf domain (cycles from ~10 to 1e7)
  const allNf = [
    testNf,
    fieldNf,
    ...curvePoints.map((p) => p.nf),
  ].filter((v) => Number.isFinite(v) && v > 0);

  const minNfVal = Math.min(...allNf);
  const maxNfVal = Math.max(...allNf);

  const logNfMin = Math.max(1, Math.floor(Math.log10(minNfVal)) - 0.2);
  const logNfMax = Math.ceil(Math.log10(maxNfVal)) + 0.2;

  // SVG setup
  const width = 580;
  const height = 300;
  const marginLeft = 60;
  const marginRight = 35;
  const marginTop = 25;
  const marginBottom = 40;

  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const toSvgX = (dt: number) => {
    const logVal = Math.log10(dt);
    return plotLeft + ((logVal - logMin) / (logMax - logMin)) * plotWidth;
  };

  const toSvgY = (nfVal: number) => {
    const logVal = Math.log10(nfVal);
    return plotTop + (1 - (logVal - logNfMin) / (logNfMax - logNfMin)) * plotHeight;
  };

  const pathD = curvePoints
    .map((p, idx) => {
      const x = toSvgX(p.deltaT);
      const y = toSvgY(p.nf);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Delta T ticks
  const dtTicks = [20, 30, 50, 100, 150, 200, 300];

  // Nf decades
  const nfDecades: number[] = [];
  for (let dec = Math.ceil(logNfMin); dec <= Math.floor(logNfMax); dec++) {
    nfDecades.push(Math.pow(10, dec));
  }

  const testX = toSvgX(testDeltaT);
  const testY = toSvgY(testNf);

  const fieldX = toSvgX(fieldDeltaT);
  const fieldY = toSvgY(fieldNf);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Coffin-Manson Thermal Fatigue S-N curve"
    >
      <title>Coffin-Manson Thermal Fatigue Curve</title>
      <defs>
        <clipPath id="fatigue-plot-clip">
          <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>

      {/* Background */}
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

      {/* Nf horizontal grid lines */}
      {nfDecades.map((dec) => {
        const y = toSvgY(dec);
        if (y < plotTop || y > plotBottom) return null;
        return (
          <g key={dec}>
            <line
              x1={plotLeft}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke="var(--line)"
              strokeWidth="0.7"
              strokeDasharray="2 3"
            />
            <text
              x={plotLeft - 8}
              y={y + 3.5}
              textAnchor="end"
              fontSize="9.5"
              fill="var(--ink-soft)"
              fontFamily="var(--font-mono)"
            >
              10^{Math.round(Math.log10(dec))}
            </text>
          </g>
        );
      })}

      {/* Delta T vertical grid lines */}
      {dtTicks.map((dt) => {
        const x = toSvgX(dt);
        if (x < plotLeft || x > plotRight) return null;
        return (
          <g key={dt}>
            <line
              x1={x}
              y1={plotTop}
              x2={x}
              y2={plotBottom}
              stroke="var(--line)"
              strokeWidth="0.7"
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
              y={plotBottom + 16}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--ink-soft)"
              fontFamily="var(--font-mono)"
            >
              {dt}°
            </text>
          </g>
        );
      })}

      {/* Axis Titles */}
      <text
        x={plotLeft + plotWidth / 2}
        y={height - 6}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="var(--ink)"
      >
        Thermal Cycling Range ΔT (°C) [Log scale]
      </text>

      <text
        transform={`rotate(-90 ${16} ${plotTop + plotHeight / 2})`}
        x={16}
        y={plotTop + plotHeight / 2}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="var(--ink)"
      >
        Cycles to Failure Nf [Log scale]
      </text>

      {/* Fatigue Line */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2.5"
        clipPath="url(#fatigue-plot-clip)"
      />

      {/* Field Operating Point Guide */}
      {fieldX >= plotLeft && fieldX <= plotRight && fieldY >= plotTop && fieldY <= plotBottom && (
        <g>
          <line
            x1={fieldX}
            y1={plotBottom}
            x2={fieldX}
            y2={fieldY}
            stroke="var(--ink-soft)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <line
            x1={plotLeft}
            y1={fieldY}
            x2={fieldX}
            y2={fieldY}
            stroke="var(--ink-soft)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <circle cx={fieldX} cy={fieldY} r="5.5" fill="var(--ink-soft)" stroke="#ffffff" strokeWidth="1.5" />
          <text
            x={fieldX + 8}
            y={fieldY - 8}
            fontSize="10"
            fontWeight="600"
            fill="var(--ink-soft)"
          >
            Field (ΔT={fieldDeltaT}°C, Nf≈{fmt(fieldNf)})
          </text>
        </g>
      )}

      {/* Test Condition Point Guide */}
      {testX >= plotLeft && testX <= plotRight && testY >= plotTop && testY <= plotBottom && (
        <g>
          <line
            x1={testX}
            y1={plotBottom}
            x2={testX}
            y2={testY}
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <line
            x1={plotLeft}
            y1={testY}
            x2={testX}
            y2={testY}
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx={testX} cy={testY} r="6" fill="var(--amber)" stroke="#ffffff" strokeWidth="2" />
          <text
            x={testX + 8}
            y={testY + 14}
            fontSize="10.5"
            fontWeight="bold"
            fill="var(--amber)"
          >
            Test Point (ΔT={testDeltaT}°C, Nf≈{fmt(testNf)})
          </text>
        </g>
      )}
    </svg>
  );
}

export default function ThermalFatigueCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((p) => ({ ...p, [key]: value }));

  const handleTestPresetChange = (presetId: string) => {
    if (presetId === 'custom') {
      update('testPresetId', 'custom');
      return;
    }
    const found = TEST_CONDITION_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setState((p) => ({
        ...p,
        testPresetId: presetId,
        tMinC: String(found.tMinC),
        tMaxC: String(found.tMaxC),
      }));
    }
  };

  const handleSubstrateChange = (presetId: string) => {
    if (presetId === 'custom') {
      update('substratePresetId', 'custom');
      return;
    }
    const found = SUBSTRATE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setState((p) => ({
        ...p,
        substratePresetId: presetId,
        substrateCtePpm: String(found.ctePpm),
      }));
    }
  };

  const handleDieChange = (presetId: string) => {
    if (presetId === 'custom') {
      update('diePresetId', 'custom');
      return;
    }
    const found = DIE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setState((p) => ({
        ...p,
        diePresetId: presetId,
        dieCtePpm: String(found.ctePpm),
      }));
    }
  };

  const handleAlloyChange = (presetId: string) => {
    if (presetId === 'custom') {
      update('alloyPresetId', 'custom');
      return;
    }
    const found = SOLDER_ALLOY_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setState((p) => ({
        ...p,
        alloyPresetId: presetId,
        epsilonF: String(found.epsilonF),
        c: String(found.c),
      }));
    }
  };

  const result = useMemo(() => {
    return calculateThermalFatigue({
      dieWidthMm: num(state.dieWidthMm),
      dieHeightMm: num(state.dieHeightMm),
      bumpHeightUm: num(state.bumpHeightUm),
      substrateCtePpm: num(state.substrateCtePpm),
      dieCtePpm: num(state.dieCtePpm),
      epsilonF: num(state.epsilonF),
      c: num(state.c),
      tMinC: num(state.tMinC),
      tMaxC: num(state.tMaxC),
      fieldDeltaTC: num(state.fieldDeltaTC),
      accelerationExponentM: num(state.accelerationExponentM),
      cyclesPerDay: num(state.cyclesPerDay),
    });
  }, [state]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'Coffin-Manson Solder Fatigue Reliability',
      `Distance to Neutral Point (DNP): ${fmt(result.dnpMm)} mm`,
      `CTE Mismatch (Δα): ${fmt(result.deltaAlphaPpm)} ppm/°C`,
      `Test Temperature Range (ΔT): ${fmt(result.deltaTTestC)} °C`,
      `Shear Strain Range (Δγ): ${fmt(result.deltaGammaPct)} %`,
      `Mean Cycles to Failure (Nf): ${fmt(result.nf)} cycles`,
      `Acceleration Factor (AF): ${fmt(result.af)}x`,
      `Expected Field Cycles: ${fmt(result.fieldCycles)} cycles`,
      `Estimated Field Life: ${fmt(result.fieldYears)} years`,
    ];
  }, [result]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      {/* Inputs Section */}
      <section className="panel">
        <h2>Thermal Cycling & Packaging Parameters</h2>

        {/* Test Condition Preset */}
        <div className="field">
          <label htmlFor="test-cond-sel">Temperature Cycling Test Preset</label>
          <select
            id="test-cond-sel"
            value={state.testPresetId}
            onChange={(e) => handleTestPresetChange(e.target.value)}
          >
            {TEST_CONDITION_PRESETS.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
            <option value="custom">Custom Thermal Cycle</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="t-min">Min Temperature T_min (°C)</label>
            <input
              id="t-min"
              type="number"
              inputMode="decimal"
              value={state.tMinC}
              onChange={(e) => {
                update('testPresetId', 'custom');
                update('tMinC', e.target.value);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="t-max">Max Temperature T_max (°C)</label>
            <input
              id="t-max"
              type="number"
              inputMode="decimal"
              value={state.tMaxC}
              onChange={(e) => {
                update('testPresetId', 'custom');
                update('tMaxC', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Die Dimensions & Solder Bump Height */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="die-w">Die Width (mm)</label>
            <input
              id="die-w"
              type="number"
              min="0.1"
              step="any"
              inputMode="decimal"
              value={state.dieWidthMm}
              onChange={(e) => update('dieWidthMm', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="die-h">Die Height (mm)</label>
            <input
              id="die-h"
              type="number"
              min="0.1"
              step="any"
              inputMode="decimal"
              value={state.dieHeightMm}
              onChange={(e) => update('dieHeightMm', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="bump-h">Solder Joint / Bump Height (µm)</label>
          <input
            id="bump-h"
            type="number"
            min="1"
            step="any"
            inputMode="decimal"
            value={state.bumpHeightUm}
            onChange={(e) => update('bumpHeightUm', e.target.value)}
          />
        </div>

        {/* Substrate & Die CTE Presets */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="sub-sel">Substrate Material</label>
            <select
              id="sub-sel"
              value={state.substratePresetId}
              onChange={(e) => handleSubstrateChange(e.target.value)}
            >
              {SUBSTRATE_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.ctePpm} ppm/°C)
                </option>
              ))}
              <option value="custom">Custom Substrate</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sub-cte">Substrate CTE (ppm/°C)</label>
            <input
              id="sub-cte"
              type="number"
              step="any"
              inputMode="decimal"
              value={state.substrateCtePpm}
              onChange={(e) => {
                update('substratePresetId', 'custom');
                update('substrateCtePpm', e.target.value);
              }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="die-sel">Die Material</label>
            <select
              id="die-sel"
              value={state.diePresetId}
              onChange={(e) => handleDieChange(e.target.value)}
            >
              {DIE_PRESETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ctePpm} ppm/°C)
                </option>
              ))}
              <option value="custom">Custom Die</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="die-cte">Die CTE (ppm/°C)</label>
            <input
              id="die-cte"
              type="number"
              step="any"
              inputMode="decimal"
              value={state.dieCtePpm}
              onChange={(e) => {
                update('diePresetId', 'custom');
                update('dieCtePpm', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Solder Alloy Preset */}
        <div className="field">
          <label htmlFor="alloy-sel">Solder Alloy</label>
          <select
            id="alloy-sel"
            value={state.alloyPresetId}
            onChange={(e) => handleAlloyChange(e.target.value)}
          >
            {SOLDER_ALLOY_PRESETS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (εf={a.epsilonF}, c={a.c})
              </option>
            ))}
            <option value="custom">Custom Alloy</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="alloy-ef">Ductility ε_f</label>
            <input
              id="alloy-ef"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={state.epsilonF}
              onChange={(e) => {
                update('alloyPresetId', 'custom');
                update('epsilonF', e.target.value);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="alloy-c">Fatigue Exponent c (negative)</label>
            <input
              id="alloy-c"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={state.c}
              onChange={(e) => {
                update('alloyPresetId', 'custom');
                update('c', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Field Acceleration Inputs */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="field-dt">Field Cycle Range ΔT_field (°C)</label>
            <input
              id="field-dt"
              type="number"
              min="1"
              step="any"
              inputMode="decimal"
              value={state.fieldDeltaTC}
              onChange={(e) => update('fieldDeltaTC', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="m-exp">Acceleration Exponent m</label>
            <input
              id="m-exp"
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              value={state.accelerationExponentM}
              onChange={(e) => update('accelerationExponentM', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cpd">Field Cycles / Day</label>
            <input
              id="cpd"
              type="number"
              min="0.1"
              step="any"
              inputMode="decimal"
              value={state.cyclesPerDay}
              onChange={(e) => update('cyclesPerDay', e.target.value)}
            />
          </div>
        </div>

        <div className="action-row">
          <button type="button" className="button primary" onClick={copy} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {/* Results & Plot Section */}
      <section className="panel">
        <h2>Fatigue Life & Reliability Results</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.error}
          </div>
        ) : (
          <>
            <span className="unit">Mean Cycles to Failure (Nf)</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.nf)}
              <span className="result-suffix"> cycles</span>
            </div>

            <dl className="metric-grid">
              <div>
                <dt>Shear Strain Range (Δγ)</dt>
                <dd>{fmt(result.deltaGammaPct)} %</dd>
              </div>
              <div>
                <dt>Acceleration Factor (AF)</dt>
                <dd>{fmt(result.af)} &times;</dd>
              </div>
              <div>
                <dt>Estimated Field Life</dt>
                <dd>{fmt(result.fieldYears)} Years</dd>
              </div>
              <div>
                <dt>Expected Field Cycles</dt>
                <dd>{fmt(result.fieldCycles)} cycles</dd>
              </div>
              <div>
                <dt>DNP (Distance to Neutral Point)</dt>
                <dd>{fmt(result.dnpMm)} mm</dd>
              </div>
              <div>
                <dt>CTE Mismatch (Δα)</dt>
                <dd>{fmt(result.deltaAlphaPpm)} ppm/°C</dd>
              </div>
              <div>
                <dt>Test Cycle ΔT</dt>
                <dd>{fmt(result.deltaTTestC)} °C</dd>
              </div>
              <div>
                <dt>Field Cycle ΔT</dt>
                <dd>{fmt(result.fieldDeltaTC)} °C</dd>
              </div>
            </dl>

            {/* Interactive SVG Plot */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '20px',
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
                  Coffin-Manson Thermal Fatigue Curve (S-N Log-Log)
                </span>
                <span className="unit">
                  Δγ = {fmt(result.deltaGammaPct)}%
                </span>
              </div>

              <FatiguePlot
                currentTest={result}
                epsilonF={num(state.epsilonF)}
                c={num(state.c)}
                dnpMm={result.dnpMm}
                deltaAlphaPpm={result.deltaAlphaPpm}
                bumpHeightUm={num(state.bumpHeightUm)}
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
                  <span style={{ width: '14px', borderTop: '2.5px solid var(--teal)', display: 'inline-block' }} />
                  <span>Coffin-Manson curve</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--amber)',
                      display: 'inline-block',
                    }}
                  />
                  <span>Test condition ({result.deltaTTestC}°C, Nf={fmt(result.nf)})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--ink-soft)',
                      display: 'inline-block',
                    }}
                  />
                  <span>Field condition ({result.fieldDeltaTC}°C)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
