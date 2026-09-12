'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateDepletion,
  type SemiconductorDepletionSuccess,
} from '@/lib/semiconductor-physics';

const PRESETS = [
  { name: 'Symmetric (10¹⁶ cm⁻³)', na: '1e16', nd: '1e16', t: '300', vr: '0' },
  { name: 'n⁺/p Junction (10¹⁵ / 10¹⁸)', na: '1e15', nd: '1e18', t: '300', vr: '2' },
  { name: 'p⁺/n High Voltage (10¹⁹ / 10¹⁴)', na: '1e19', nd: '1e14', t: '300', vr: '20' },
];

const INITIAL = {
  temperatureK: '300',
  naCm3: '1e16',
  ndCm3: '1e17',
  reverseBiasV: '0',
};

function parseSci(str: string): number {
  const trimmed = str.trim().replace(/×10\^?/i, 'e').replace(/\^/g, '');
  return Number(trimmed);
}

export default function SemiconductorDepletionCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => {
    const t = parseSci(state.temperatureK);
    const na = parseSci(state.naCm3);
    const nd = parseSci(state.ndCm3);
    const vr = parseSci(state.reverseBiasV);

    return calculateDepletion({
      temperatureK: t,
      naCm3: na,
      ndCm3: nd,
      reverseBiasV: vr,
    });
  }, [state]);

  const copy = async () => {
    if (!result.ok) return;
    const lines = [
      'PN Junction Depletion Analysis',
      `Temperature: ${result.temperatureK} K`,
      `Acceptor Na: ${result.naCm3.toExponential(2)} cm⁻³`,
      `Donor Nd: ${result.ndCm3.toExponential(2)} cm⁻³`,
      `Reverse Bias Vr: ${result.reverseBiasV} V`,
      `Built-in Potential Vbi: ${fmt(result.vbiV)} V`,
      `Total Potential (Vbi + Vr): ${fmt(result.vtotalV)} V`,
      `Depletion Width W: ${fmt(result.widthNm)} nm (${fmt(result.widthUm)} µm)`,
      `p-side Width xp: ${fmt(result.xpNm)} nm`,
      `n-side Width xn: ${fmt(result.xnNm)} nm`,
      `Peak Electric Field: ${fmt(result.maxElectricFieldKVPerCm)} kV/cm`,
      `Depletion Capacitance Cj: ${fmt(result.capacitanceFFPerUm2)} fF/µm² (${fmt(result.capacitancePFPerMm2)} pF/mm²)`,
      `Estimated Breakdown Vbd: ${fmt(result.breakdownVoltageV)} V`,
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
      <section className="panel">
        <h2>Junction Parameters</h2>

        <div className="field">
          <label htmlFor="temp-k">Temperature (K)</label>
          <input
            id="temp-k"
            type="text"
            value={state.temperatureK}
            onChange={(e) => update('temperatureK', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="na-cm3">Acceptor Doping Na (p-side, cm⁻³)</label>
          <input
            id="na-cm3"
            type="text"
            placeholder="e.g. 1e16"
            value={state.naCm3}
            onChange={(e) => update('naCm3', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="nd-cm3">Donor Doping Nd (n-side, cm⁻³)</label>
          <input
            id="nd-cm3"
            type="text"
            placeholder="e.g. 1e17"
            value={state.ndCm3}
            onChange={(e) => update('ndCm3', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="vr-v">Reverse Bias Vr (V, Vr ≥ 0)</label>
          <input
            id="vr-v"
            type="text"
            value={state.reverseBiasV}
            onChange={(e) => update('reverseBiasV', e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Presets</span>
          <div className="button-group" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="button secondary"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                onClick={() =>
                  setState({
                    temperatureK: p.t,
                    naCm3: p.na,
                    ndCm3: p.nd,
                    reverseBiasV: p.vr,
                  })
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="action-row" style={{ marginTop: '16px' }}>
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

      <section className="panel">
        <h2>Depletion Characteristics</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Total Depletion Width (W)</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.widthNm)} <span className="result-suffix">nm</span>
              <span style={{ fontSize: '16px', color: 'var(--muted)', marginLeft: '8px' }}>
                ({fmt(result.widthUm)} µm)
              </span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Built-in Potential (Vbi)</span>
                <strong>{fmt(result.vbiV)} V</strong>
              </div>
              <div className="metric">
                <span>Total Potential (Vbi + Vr)</span>
                <strong>{fmt(result.vtotalV)} V</strong>
              </div>
              <div className="metric">
                <span>p-side Depletion (xp)</span>
                <strong>{fmt(result.xpNm)} nm</strong>
              </div>
              <div className="metric">
                <span>n-side Depletion (xn)</span>
                <strong>{fmt(result.xnNm)} nm</strong>
              </div>
              <div className="metric">
                <span>Peak Electric Field (Emax)</span>
                <strong>{fmt(result.maxElectricFieldKVPerCm)} kV/cm</strong>
              </div>
              <div className="metric">
                <span>Junction Capacitance (Cj)</span>
                <strong>{fmt(result.capacitanceFFPerUm2)} fF/µm²</strong>
              </div>
              <div className="metric">
                <span>Capacitance (Area)</span>
                <strong>{fmt(result.capacitancePFPerMm2)} pF/mm²</strong>
              </div>
              <div className="metric">
                <span>Est. Breakdown (Vbd)</span>
                <strong>~{fmt(result.breakdownVoltageV)} V</strong>
              </div>
            </div>

            <DepletionProfilePlot result={result} />
          </>
        )}
      </section>
    </div>
  );
}

function DepletionProfilePlot({ result }: { result: SemiconductorDepletionSuccess }) {
  const width = 460;
  const height = 180;
  const pad = { top: 20, right: 30, bottom: 30, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // X range: from -xp to +xn
  const xp = result.xpNm;
  const xn = result.xnNm;
  const totalW = xp + xn;

  // zero coordinate (metallurgical junction)
  const zeroX = pad.left + (xp / totalW) * plotW;

  // Electric field triangle: peaks at x=0 with maxElectricFieldKVPerCm, zero at -xp and +xn
  const peakY = pad.top;
  const baseY = pad.top + plotH;

  const leftX = pad.left;
  const rightX = pad.left + plotW;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--ink)' }}>
        Electric Field & Depletion Profile |E(x)|
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '6px' }}
        role="img"
        aria-label="PN junction electric field profile diagram"
      >
        {/* Baseline */}
        <line x1={pad.left} y1={baseY} x2={pad.left + plotW} y2={baseY} stroke="var(--line-strong)" />

        {/* Junction dividing line x = 0 */}
        <line
          x1={zeroX}
          y1={pad.top}
          x2={zeroX}
          y2={baseY}
          stroke="var(--muted)"
          strokeDasharray="3 3"
        />

        {/* Electric field profile polygon */}
        <polygon
          points={`${leftX},${baseY} ${zeroX},${peakY} ${rightX},${baseY}`}
          fill="var(--teal)"
          fillOpacity="0.18"
          stroke="var(--teal)"
          strokeWidth="2"
        />

        {/* Labels */}
        <text x={leftX} y={baseY + 16} fontSize="11" fill="var(--muted)" textAnchor="middle">
          -xp
        </text>
        <text x={zeroX} y={baseY + 16} fontSize="11" fill="var(--ink)" textAnchor="middle" fontWeight="600">
          x = 0
        </text>
        <text x={rightX} y={baseY + 16} fontSize="11" fill="var(--muted)" textAnchor="middle">
          +xn
        </text>

        {/* Peak E-field label */}
        <text x={zeroX} y={peakY - 6} fontSize="11" fill="var(--teal-dark)" textAnchor="middle" fontWeight="600">
          Emax: {fmt(result.maxElectricFieldKVPerCm)} kV/cm
        </text>

        {/* p-side and n-side regions */}
        <text x={(leftX + zeroX) / 2} y={baseY - 10} fontSize="11" fill="var(--muted)" textAnchor="middle">
          p-depletion ({fmt(xp)} nm)
        </text>
        <text x={(zeroX + rightX) / 2} y={baseY - 10} fontSize="11" fill="var(--muted)" textAnchor="middle">
          n-depletion ({fmt(xn)} nm)
        </text>
      </svg>
    </div>
  );
}
