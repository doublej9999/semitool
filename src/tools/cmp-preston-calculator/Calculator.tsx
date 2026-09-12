'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateCmpPreston,
  CMP_PRESETS,
  type CmpPressureUnit,
} from '@/lib/cmp-preston';

const INITIAL = {
  materialId: 'oxide',
  customKp: '7.5e-14',
  downforcePressure: '3.0',
  pressureUnit: 'psi' as CmpPressureUnit,
  platenSpeedRpm: '90',
  carrierSpeedRpm: '85',
  carrierOffsetMm: '200',
  waferDiameterMm: '300',
  polishTimeSec: '60',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function CmpPrestonCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const selectedPreset = useMemo(
    () => CMP_PRESETS.find((p) => p.id === state.materialId) || CMP_PRESETS[0],
    [state.materialId],
  );

  const result = useMemo(() => {
    return calculateCmpPreston({
      materialId: state.materialId,
      customKpPaInv: num(state.customKp),
      downforcePressure: num(state.downforcePressure),
      pressureUnit: state.pressureUnit,
      platenSpeedRpm: num(state.platenSpeedRpm),
      carrierSpeedRpm: num(state.carrierSpeedRpm),
      carrierOffsetMm: num(state.carrierOffsetMm),
      waferDiameterMm: num(state.waferDiameterMm),
      polishTimeSec: num(state.polishTimeSec),
    });
  }, [state]);

  const copyResult = async () => {
    if (!result.ok) return;
    const lines = [
      'CMP Preston Removal Rate Calculation',
      `Material Preset: ${selectedPreset.name}`,
      `Preston Constant (Kp): ${result.kpPaInv.toExponential(2)} Pa⁻¹`,
      `Downforce Pressure: ${state.downforcePressure} ${state.pressureUnit} (${fmt(result.pressurePa)} Pa)`,
      `Platen / Carrier Speed: ${state.platenSpeedRpm} / ${state.carrierSpeedRpm} rpm`,
      `Wafer Center Velocity: ${fmt(result.vCenter)} m/s`,
      `Velocity Range (Inner - Outer): ${fmt(result.vInner)} - ${fmt(result.vOuter)} m/s (ΔV: ${fmt(result.deltaV)} m/s, ${fmt(result.velocityVariationPercent)}%)`,
      `Kinematic WIWNU: ${fmt(result.wiwnuPercent)} %`,
      `Removal Rate: ${fmt(result.rrNmPerMin)} nm/min (${fmt(result.rrAngstromPerMin)} Å/min)`,
      `Polish Time: ${result.polishTimeSec} s`,
      `Total Thickness Removed: ${fmt(result.totalRemovedNm)} nm (${fmt(result.totalRemovedAngstrom)} Å)`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleMaterialChange = (presetId: string) => {
    const preset = CMP_PRESETS.find((p) => p.id === presetId);
    setState((prev) => ({
      ...prev,
      materialId: presetId,
      customKp: preset && preset.id !== 'custom' ? preset.kpPaInv.toExponential(2) : prev.customKp,
    }));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="cmp-inputs">
        <h2 id="cmp-inputs">CMP Process Parameters</h2>

        <div className="field">
          <label htmlFor="cmp-preset">Film & Slurry Preset</label>
          <select
            id="cmp-preset"
            value={state.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
          >
            {CMP_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {state.materialId === 'custom' && (
          <div className="field">
            <label htmlFor="cmp-custom-kp">
              Custom Preston Coefficient (Kp)<span className="unit">Pa⁻¹</span>
            </label>
            <input
              id="cmp-custom-kp"
              type="number"
              step="any"
              placeholder="e.g. 7.5e-14"
              value={state.customKp}
              onChange={(e) => setState((p) => ({ ...p, customKp: e.target.value }))}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="cmp-downforce">
            Downforce Pressure (P)<span className="unit">{state.pressureUnit}</span>
          </label>
          <div className="inline-field">
            <input
              id="cmp-downforce"
              type="number"
              min="0.1"
              step="any"
              value={state.downforcePressure}
              onChange={(e) => setState((p) => ({ ...p, downforcePressure: e.target.value }))}
            />
            <select
              aria-label="Pressure Unit"
              value={state.pressureUnit}
              onChange={(e) => setState((p) => ({ ...p, pressureUnit: e.target.value as CmpPressureUnit }))}
              style={{ flex: '0 0 auto', width: 'auto' }}
            >
              <option value="psi">psi</option>
              <option value="kPa">kPa</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cmp-platen-speed">
              Platen Speed (Ω_p)<span className="unit">rpm</span>
            </label>
            <input
              id="cmp-platen-speed"
              type="number"
              min="1"
              step="1"
              value={state.platenSpeedRpm}
              onChange={(e) => setState((p) => ({ ...p, platenSpeedRpm: e.target.value }))}
            />
          </div>

          <div className="field">
            <label htmlFor="cmp-carrier-speed">
              Carrier Head Speed (Ω_c)<span className="unit">rpm</span>
            </label>
            <input
              id="cmp-carrier-speed"
              type="number"
              min="1"
              step="1"
              value={state.carrierSpeedRpm}
              onChange={(e) => setState((p) => ({ ...p, carrierSpeedRpm: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cmp-offset">
              Carrier Center Offset (R_offset)<span className="unit">mm</span>
            </label>
            <input
              id="cmp-offset"
              type="number"
              min="10"
              step="any"
              value={state.carrierOffsetMm}
              onChange={(e) => setState((p) => ({ ...p, carrierOffsetMm: e.target.value }))}
            />
          </div>

          <div className="field">
            <label htmlFor="cmp-diameter">
              Wafer Diameter<span className="unit">mm</span>
            </label>
            <input
              id="cmp-diameter"
              type="number"
              min="50"
              step="any"
              value={state.waferDiameterMm}
              onChange={(e) => setState((p) => ({ ...p, waferDiameterMm: e.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cmp-time">
            Polish Time<span className="unit">seconds</span>
          </label>
          <input
            id="cmp-time"
            type="number"
            min="1"
            step="any"
            value={state.polishTimeSec}
            onChange={(e) => setState((p) => ({ ...p, polishTimeSec: e.target.value }))}
          />
        </div>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => setState(INITIAL)}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        <div className="formula" style={{ marginTop: '16px' }}>
          <strong>Preston Equation:</strong> RR = Kp · P · V<br />
          Linear speed at center: V = 2π · R_offset · (Ω_platen / 60)<br />
          WIWNU kinematic estimate = (|Ω_p - Ω_c| · R_wafer / V) × 100%
        </div>
      </section>

      <section className="panel" aria-labelledby="cmp-results">
        <h2 id="cmp-results">Removal & Kinematics Results</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <div>
              <span className="unit">Removal Rate</span>
              <div className="result-value">
                {fmt(result.rrNmPerMin)} <span style={{ fontSize: '18px', fontWeight: 400 }}>nm/min</span>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Removal Rate (Å)</span>
                <strong>{fmt(result.rrAngstromPerMin)} Å/min</strong>
              </div>
              <div className="metric">
                <span>Total Removed</span>
                <strong>{fmt(result.totalRemovedNm)} nm</strong>
              </div>
              <div className="metric">
                <span>Total Removed (Å)</span>
                <strong>{fmt(result.totalRemovedAngstrom)} Å</strong>
              </div>
              <div className="metric">
                <span>Center Linear Velocity</span>
                <strong>{fmt(result.vCenter)} m/s</strong>
              </div>
              <div className="metric">
                <span>Wafer Edge Velocity Range</span>
                <strong>{fmt(result.vInner)} – {fmt(result.vOuter)} m/s</strong>
              </div>
              <div className="metric">
                <span>Kinematic WIWNU</span>
                <strong>{fmt(result.wiwnuPercent)} %</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                CMP Platen & Carrier Kinematic Schematic
              </h3>
              <CmpDiagram
                platenRpm={num(state.platenSpeedRpm)}
                carrierRpm={num(state.carrierSpeedRpm)}
                offsetMm={num(state.carrierOffsetMm)}
                diameterMm={num(state.waferDiameterMm)}
                vCenter={result.vCenter}
              />
            </div>

            <div className="action-row" style={{ marginTop: '16px' }}>
              <button
                className="button primary"
                type="button"
                onClick={copyResult}
                disabled={copied}
              >
                <Copy size={15} />
                {copied ? 'Copied to clipboard' : 'Copy Results'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface CmpDiagramProps {
  platenRpm: number;
  carrierRpm: number;
  offsetMm: number;
  diameterMm: number;
  vCenter: number;
}

function CmpDiagram({
  platenRpm,
  carrierRpm,
  offsetMm,
  diameterMm,
  vCenter,
}: CmpDiagramProps) {
  // SVG viewBox is 320 x 320, center platen at (160, 160)
  // Platen radius corresponds to ~400mm real space = 135 SVG units
  const svgCenter = 160;
  const platenRadius = 130;
  const scale = 130 / 380; // 380mm platen radius reference

  const waferRadius = Math.max(15, Math.min(65, (diameterMm / 2) * scale));
  const offsetDistance = Math.max(waferRadius + 5, Math.min(platenRadius - waferRadius - 5, offsetMm * scale));

  // Carrier center located towards top-right (angle -40 deg)
  const angleRad = -0.7;
  const carrierX = svgCenter + offsetDistance * Math.cos(angleRad);
  const carrierY = svgCenter + offsetDistance * Math.sin(angleRad);

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: '8px',
        border: '1px solid var(--line)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <svg
        viewBox="0 0 320 320"
        width="100%"
        height="260"
        style={{ maxWidth: '340px', overflow: 'visible' }}
        role="img"
        aria-label="CMP rotating platen and carrier head layout schematic"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--teal)" />
          </marker>
          <marker
            id="arrow-amber"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--amber)" />
          </marker>
          <radialGradient id="platenGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="90%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#d1d5db" />
          </radialGradient>
          <radialGradient id="waferGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="85%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#60a5fa" />
          </radialGradient>
        </defs>

        {/* Polishing Platen Circle */}
        <circle
          cx={svgCenter}
          cy={svgCenter}
          r={platenRadius}
          fill="url(#platenGrad)"
          stroke="#9ca3af"
          strokeWidth="2.5"
        />

        {/* Platen concentric grooving pattern simulation */}
        <circle cx={svgCenter} cy={svgCenter} r={platenRadius * 0.75} fill="none" stroke="#d1d5db" strokeDasharray="3 3" />
        <circle cx={svgCenter} cy={svgCenter} r={platenRadius * 0.5} fill="none" stroke="#d1d5db" strokeDasharray="3 3" />
        <circle cx={svgCenter} cy={svgCenter} r={platenRadius * 0.25} fill="none" stroke="#d1d5db" strokeDasharray="3 3" />

        {/* Platen Center */}
        <circle cx={svgCenter} cy={svgCenter} r="3" fill="#6b7280" />
        <text
          x={svgCenter + 8}
          y={svgCenter + 14}
          fontSize="10"
          fill="#4b5563"
          fontFamily="var(--font-sans)"
        >
          Platen Center
        </text>

        {/* Carrier offset radius line */}
        <line
          x1={svgCenter}
          y1={svgCenter}
          x2={carrierX}
          y2={carrierY}
          stroke="#9ca3af"
          strokeDasharray="4 3"
          strokeWidth="1.2"
        />

        {/* Platen Rotation Arrow */}
        <path
          d={`M ${svgCenter - 85} ${svgCenter + 60} A 105 105 0 0 0 ${svgCenter + 85} ${svgCenter + 60}`}
          fill="none"
          stroke="var(--teal)"
          strokeWidth="2.5"
          markerEnd="url(#arrow)"
        />
        <text
          x={svgCenter}
          y={svgCenter + 95}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--teal-dark)"
        >
          Platen: {platenRpm} rpm ↺
        </text>

        {/* Wafer / Carrier Head Circle */}
        <circle
          cx={carrierX}
          cy={carrierY}
          r={waferRadius}
          fill="url(#waferGrad)"
          stroke="#2563eb"
          strokeWidth="2"
          opacity="0.9"
        />

        {/* Carrier Retaining Ring */}
        <circle
          cx={carrierX}
          cy={carrierY}
          r={waferRadius + 4}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />

        {/* Carrier Center */}
        <circle cx={carrierX} cy={carrierY} r="3" fill="#1e3a8a" />

        {/* Carrier Rotation Arrow */}
        <path
          d={`M ${carrierX - waferRadius * 0.7} ${carrierY - waferRadius * 0.2} A ${waferRadius * 0.7} ${waferRadius * 0.7} 0 1 1 ${carrierX + waferRadius * 0.7} ${carrierY - waferRadius * 0.2}`}
          fill="none"
          stroke="var(--amber)"
          strokeWidth="2"
          markerEnd="url(#arrow-amber)"
        />
        <text
          x={carrierX}
          y={carrierY - waferRadius - 8}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--amber)"
        >
          Carrier: {carrierRpm} rpm
        </text>

        {/* Linear velocity vector at wafer center */}
        <line
          x1={carrierX}
          y1={carrierY}
          x2={carrierX + 28 * Math.sin(angleRad)}
          y2={carrierY - 28 * Math.cos(angleRad)}
          stroke="var(--teal)"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <text
          x={carrierX + 32 * Math.sin(angleRad)}
          y={carrierY - 30 * Math.cos(angleRad)}
          fontSize="9.5"
          fontWeight="500"
          fill="var(--teal-dark)"
        >
          V = {vCenter > 0 ? fmt(vCenter) : '0'} m/s
        </text>
      </svg>
      <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '4px' }}>
        Eccentric counter/co-rotating carrier head on slurry-wetted platen pad
      </div>
    </div>
  );
}
