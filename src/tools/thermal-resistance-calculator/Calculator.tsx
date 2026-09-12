'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateThermalResistance,
  HEATSINK_PRESETS,
  PACKAGE_PRESETS,
  TIM_PRESETS,
} from '@/lib/thermal-resistance';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  ambientTempC: '25',
  powerW: '65',
  packagePresetId: 'fcbga',
  dieWidthMm: '12',
  dieHeightMm: '12',
  thetaJc: '0.25',
  timPresetId: 'grease',
  bltUm: '50',
  kTim: '3.5',
  heatsinkPresetId: 'active-fan',
  thetaSa: '1.2',
  tjMaxC: '105',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function ChipThermalCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'packagePresetId') {
        const pkg = PACKAGE_PRESETS.find((p) => p.id === value);
        if (pkg) {
          next.thetaJc = String(pkg.thetaJc);
          // adjust default width/height if square area fits
          const side = Math.round(Math.sqrt(pkg.typicalDieAreaMm2) * 10) / 10;
          next.dieWidthMm = String(side);
          next.dieHeightMm = String(side);
        }
      } else if (key === 'timPresetId') {
        const tim = TIM_PRESETS.find((t) => t.id === value);
        if (tim) {
          next.bltUm = String(tim.bltUm);
          next.kTim = String(tim.kTim);
        }
      } else if (key === 'heatsinkPresetId') {
        const hs = HEATSINK_PRESETS.find((h) => h.id === value);
        if (hs) {
          next.thetaSa = String(hs.thetaSa);
        }
      }

      return next;
    });
  };

  const result = useMemo(() => {
    return calculateThermalResistance({
      ambientTempC: num(state.ambientTempC),
      powerW: num(state.powerW),
      dieWidthMm: num(state.dieWidthMm),
      dieHeightMm: num(state.dieHeightMm),
      thetaJc: num(state.thetaJc),
      bltUm: num(state.bltUm),
      kTim: num(state.kTim),
      thetaSa: num(state.thetaSa),
      tjMaxC: num(state.tjMaxC),
    });
  }, [state]);

  const copy = async () => {
    if (!result.ok) return;

    const lines = [
      'Chip Thermal Resistance & Junction Temperature Analysis',
      '-------------------------------------------------------',
      `Ambient Temperature (Ta): ${result.ambientTempC} °C`,
      `Power Dissipation (P): ${result.powerW} W`,
      `Die Dimensions: ${result.dieWidthMm} mm × ${result.dieHeightMm} mm (${fmt(result.dieAreaMm2)} mm²)`,
      `Junction-to-Case Resistance (θJC): ${fmt(result.thetaJc)} °C/W`,
      `TIM Layer: BLT = ${result.bltUm} µm, k = ${result.kTim} W/(m·K) (θTIM = ${fmt(result.thetaTim)} °C/W)`,
      `Heatsink Resistance (θSA): ${fmt(result.thetaSa)} °C/W`,
      `Total Junction-to-Ambient (θJA): ${fmt(result.thetaJa)} °C/W`,
      '-------------------------------------------------------',
      `Junction Temperature (Tj): ${fmt(result.tjC)} °C (Limit Tj,max: ${result.tjMaxC} °C)`,
      `Case Temperature (Tcase): ${fmt(result.tCaseC)} °C`,
      `Heatsink Temperature (Tsink): ${fmt(result.tSinkC)} °C`,
      `Thermal Margin: ${fmt(result.thermalMarginC)} °C`,
      `Max Allowable Power (Pmax): ${fmt(result.pMaxW)} W`,
      `Status: ${result.isSafe ? 'SAFE (Within Limits)' : 'THERMAL OVERHEAT WARNING'}`,
    ];

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
      {/* Input Panel */}
      <section className="panel">
        <h2>Operating Conditions & Package Stack</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="pwr-ambient">Ambient Temp Ta (°C)</label>
            <input
              id="pwr-ambient"
              type="number"
              inputMode="decimal"
              value={state.ambientTempC}
              onChange={(e) => update('ambientTempC', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pwr-power">Power Dissipation P (W)</label>
            <input
              id="pwr-power"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={state.powerW}
              onChange={(e) => update('powerW', e.target.value)}
            />
          </div>
        </div>

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

        {/* Package Preset */}
        <div className="field">
          <label htmlFor="pkg-preset">Package Type / Preset</label>
          <select
            id="pkg-preset"
            value={state.packagePresetId}
            onChange={(e) => update('packagePresetId', e.target.value)}
          >
            {PACKAGE_PRESETS.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} (θJC ≈ {pkg.thetaJc} °C/W)
              </option>
            ))}
            <option value="custom">Custom θJC</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="pkg-thetajc">Junction-to-Case Resistance θJC (°C/W)</label>
          <input
            id="pkg-thetajc"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={state.thetaJc}
            onChange={(e) => update('thetaJc', e.target.value)}
          />
        </div>

        {/* TIM Preset */}
        <div className="field">
          <label htmlFor="tim-preset">Thermal Interface Material (TIM)</label>
          <select
            id="tim-preset"
            value={state.timPresetId}
            onChange={(e) => update('timPresetId', e.target.value)}
          >
            {TIM_PRESETS.map((tim) => (
              <option key={tim.id} value={tim.id}>
                {tim.name} ({tim.kTim} W/mK, {tim.bltUm} µm)
              </option>
            ))}
            <option value="custom">Custom TIM Layer</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="tim-blt">Bond Line BLT (µm)</label>
            <input
              id="tim-blt"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={state.bltUm}
              onChange={(e) => update('bltUm', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tim-k">Conductivity k (W/m·K)</label>
            <input
              id="tim-k"
              type="number"
              min="0.01"
              step="any"
              inputMode="decimal"
              value={state.kTim}
              onChange={(e) => update('kTim', e.target.value)}
            />
          </div>
        </div>

        {/* Heatsink Preset */}
        <div className="field">
          <label htmlFor="hs-preset">Heatsink / Cooling Solution</label>
          <select
            id="hs-preset"
            value={state.heatsinkPresetId}
            onChange={(e) => update('heatsinkPresetId', e.target.value)}
          >
            {HEATSINK_PRESETS.map((hs) => (
              <option key={hs.id} value={hs.id}>
                {hs.name} (θSA ≈ {hs.thetaSa} °C/W)
              </option>
            ))}
            <option value="custom">Custom Heatsink θSA</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="hs-thetasa">Sink-to-Ambient θSA (°C/W)</label>
            <input
              id="hs-thetasa"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={state.thetaSa}
              onChange={(e) => update('thetaSa', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tj-max">Tj,max Limit (°C)</label>
            <input
              id="tj-max"
              type="number"
              inputMode="decimal"
              value={state.tjMaxC}
              onChange={(e) => update('tjMaxC', e.target.value)}
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

      {/* Result Panel */}
      <section className="panel">
        <h2>Thermal Analysis & Junction Temperature</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Silicon Junction Temperature (Tj)</span>
            <div
              className="result-value"
              aria-live="polite"
              style={{
                color: result.isSafe ? 'var(--ink)' : 'var(--red)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span>{fmt(result.tjC)}</span>
              <span className="result-suffix">°C</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: result.isSafe ? '#ebf8f2' : '#fdf1f0',
                  color: result.isSafe ? '#16794b' : 'var(--red)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginLeft: 'auto',
                }}
              >
                {result.isSafe ? (
                  <>
                    <CheckCircle2 size={15} /> Within Spec (Tj &le; {result.tjMaxC}°C)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={15} /> OVERHEAT EXCEEDED (+{fmt(result.tjC - result.tjMaxC)}°C)
                  </>
                )}
              </span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Total Resistance θJA</span>
                <strong>{fmt(result.thetaJa)} °C/W</strong>
              </div>
              <div className="metric">
                <span>Thermal Margin (Tj,max - Tj)</span>
                <strong style={{ color: result.isSafe ? 'inherit' : 'var(--red)' }}>
                  {result.thermalMarginC >= 0 ? `+${fmt(result.thermalMarginC)}` : fmt(result.thermalMarginC)} °C
                </strong>
              </div>
              <div className="metric">
                <span>Case Temperature Tcase</span>
                <strong>{fmt(result.tCaseC)} °C</strong>
              </div>
              <div className="metric">
                <span>Sink Temperature Tsink</span>
                <strong>{fmt(result.tSinkC)} °C</strong>
              </div>
              <div className="metric">
                <span>Package θJC</span>
                <strong>{fmt(result.thetaJc)} °C/W</strong>
              </div>
              <div className="metric">
                <span>TIM Resistance θTIM</span>
                <strong>{fmt(result.thetaTim)} °C/W</strong>
              </div>
              <div className="metric">
                <span>Heatsink θSA</span>
                <strong>{fmt(result.thetaSa)} °C/W</strong>
              </div>
              <div className="metric">
                <span>Max Allowable Power Pmax</span>
                <strong>{fmt(result.pMaxW)} W</strong>
              </div>
            </div>

            {/* Interactive SVG Thermal Gradient Stack Diagram */}
            <ThermalStackDiagram result={result} />
          </>
        )}
      </section>
    </div>
  );
}

interface ThermalStackDiagramProps {
  result: ReturnType<typeof calculateThermalResistance> & { ok: true };
}

function ThermalStackDiagram({ result }: ThermalStackDiagramProps) {
  const width = 480;
  const height = 340;

  // Layer heights and positions
  const leftX = 45;
  const blockW = 270;

  const dieY = 30;
  const dieH = 40;

  const caseY = dieY + dieH + 12;
  const caseH = 46;

  const timY = caseY + caseH + 12;
  const timH = 34;

  const sinkY = timY + timH + 12;
  const sinkH = 70;

  const ambY = sinkY + sinkH + 24;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink)' }}>
        1D Thermal Gradient Stack & Heat Flow
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          height: 'auto',
          background: 'var(--paper)',
          borderRadius: '8px',
          border: '1px solid var(--line)',
        }}
        role="img"
        aria-label="Thermal Resistance and Temperature Gradient Stack"
      >
        <defs>
          <linearGradient id="heatFlowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9534f" />
            <stop offset="50%" stopColor="#f0ad4e" />
            <stop offset="100%" stopColor="#0d7c82" />
          </linearGradient>
          <marker
            id="arrowHeat"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#b0413a" />
          </marker>
        </defs>

        {/* Heat Flow Arrow on Right */}
        <line
          x1={340}
          y1={45}
          x2={340}
          y2={ambY - 10}
          stroke="#b0413a"
          strokeWidth="3"
          strokeDasharray="5 3"
          markerEnd="url(#arrowHeat)"
        />
        <text x={352} y={150} fontSize="11" fill="#b0413a" fontWeight="600">
          Heat Flow Q = {result.powerW} W
        </text>

        {/* 1. Silicon Active Die */}
        <rect
          x={leftX}
          y={dieY}
          width={blockW}
          height={dieH}
          rx="4"
          fill="#33454e"
          stroke="#152127"
          strokeWidth="1.5"
        />
        <text x={leftX + 14} y={dieY + 24} fontSize="12" fill="#ffffff" fontWeight="600">
          Silicon Die (Active Hot Spot)
        </text>
        <text x={leftX + blockW - 12} y={dieY + 24} fontSize="12" fill="#ffb4a2" fontWeight="700" textAnchor="end">
          Tj = {fmt(result.tjC)} °C
        </text>

        {/* Sub-label for die */}
        <text x={leftX + 14} y={dieY + dieH + 9} fontSize="10" fill="var(--muted)">
          Die Size: {result.dieWidthMm} × {result.dieHeightMm} mm ({fmt(result.dieAreaMm2)} mm²)
        </text>

        {/* 2. Package Lid / Case */}
        <rect
          x={leftX}
          y={caseY}
          width={blockW}
          height={caseH}
          rx="4"
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        <text x={leftX + 14} y={caseY + 20} fontSize="11" fill="#0f172a" fontWeight="600">
          Package Lid / Case (θJC = {fmt(result.thetaJc)} °C/W)
        </text>
        <text x={leftX + 14} y={caseY + 36} fontSize="10" fill="#475569">
          ΔT_case = {fmt(result.powerW * result.thetaJc)} °C drop
        </text>
        <text x={leftX + blockW - 12} y={caseY + 27} fontSize="12" fill="#b91c1c" fontWeight="700" textAnchor="end">
          Tcase = {fmt(result.tCaseC)} °C
        </text>

        {/* 3. TIM Layer */}
        <rect
          x={leftX}
          y={timY}
          width={blockW}
          height={timH}
          rx="3"
          fill="#fef08a"
          stroke="#eab308"
          strokeWidth="1.5"
        />
        <text x={leftX + 14} y={timY + 16} fontSize="11" fill="#854d0e" fontWeight="600">
          TIM Layer (BLT: {result.bltUm} µm, k: {result.kTim} W/mK)
        </text>
        <text x={leftX + 14} y={timY + 28} fontSize="9.5" fill="#a16207">
          θTIM = {fmt(result.thetaTim)} °C/W (ΔT = {fmt(result.powerW * result.thetaTim)} °C)
        </text>
        <text x={leftX + blockW - 12} y={timY + 22} fontSize="12" fill="#a16207" fontWeight="700" textAnchor="end">
          Tsink = {fmt(result.tSinkC)} °C
        </text>

        {/* 4. Heatsink */}
        <rect
          x={leftX}
          y={sinkY}
          width={blockW}
          height={sinkH}
          rx="4"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="1.5"
        />
        {/* Fins stylized on heatsink */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const fx = leftX + 16 + i * 36;
          return (
            <line
              key={i}
              x1={fx}
              y1={sinkY + 4}
              x2={fx}
              y2={sinkY + 34}
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
        <text x={leftX + 14} y={sinkY + 50} fontSize="11" fill="#1e293b" fontWeight="600">
          Heat Sink & Fins (θSA = {fmt(result.thetaSa)} °C/W)
        </text>
        <text x={leftX + 14} y={sinkY + 63} fontSize="10" fill="#475569">
          ΔT_sink = {fmt(result.powerW * result.thetaSa)} °C drop to ambient
        </text>

        {/* 5. Ambient Air boundary */}
        <line
          x1={leftX - 10}
          y1={ambY - 6}
          x2={leftX + blockW + 10}
          y2={ambY - 6}
          stroke="var(--teal)"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text x={leftX + 14} y={ambY + 12} fontSize="12" fill="var(--teal-dark)" fontWeight="600">
          Ambient Cooling Air (Ta)
        </text>
        <text x={leftX + blockW - 12} y={ambY + 12} fontSize="12" fill="var(--teal-dark)" fontWeight="700" textAnchor="end">
          Ta = {result.ambientTempC} °C
        </text>
      </svg>
    </div>
  );
}
