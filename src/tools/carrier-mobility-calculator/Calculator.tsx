'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateCarrierMobility,
  calculateDopingFromResistivity,
  type DopantType,
} from '@/lib/carrier-mobility';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';

const PRESETS = [
  { name: 'Standard p-type Wafer (10 Ω·cm)', type: 'p-type' as DopantType, mode: 'rev', val: '10' },
  { name: 'n-type Epitaxial Layer (1 Ω·cm)', type: 'n-type' as DopantType, mode: 'rev', val: '1' },
  { name: 'Heavy p⁺ Substrate (0.01 Ω·cm)', type: 'p-type' as DopantType, mode: 'rev', val: '0.01' },
  { name: 'Well Doping (10¹⁶ cm⁻³)', type: 'n-type' as DopantType, mode: 'fwd', val: '1e16' },
  { name: 'Heavy Source/Drain (10²⁰ cm⁻³)', type: 'n-type' as DopantType, mode: 'fwd', val: '1e20' },
];

function parseSci(str: string): number {
  const trimmed = str.trim().replace(/×10\^?/i, 'e').replace(/\^/g, '');
  return Number(trimmed);
}

export default function CarrierMobilityCalculator() {
  const [state, setState] = useState({
    dopantType: 'p-type' as DopantType,
    mode: 'forward' as 'forward' | 'reverse',
    dopingInput: '1e16',
    resistivityInput: '1.0',
  });
  useUrlParamsState(state, setState);
  const { dopantType, mode, dopingInput, resistivityInput } = state;
  const setDopantType = (value: DopantType) => setState((previous) => ({ ...previous, dopantType: value }));
  const setMode = (value: 'forward' | 'reverse') => setState((previous) => ({ ...previous, mode: value }));
  const setDopingInput = (value: string) => setState((previous) => ({ ...previous, dopingInput: value }));
  const setResistivityInput = (value: string) => setState((previous) => ({ ...previous, resistivityInput: value }));
  const { copied, copy: copyResult } = useCopyToClipboard();

  const result = useMemo(() => {
    if (mode === 'forward') {
      const n = parseSci(dopingInput);
      return calculateCarrierMobility({ dopantType, dopingCm3: n });
    } else {
      const rho = parseSci(resistivityInput);
      return calculateDopingFromResistivity({ dopantType, resistivityOhmCm: rho });
    }
  }, [dopantType, mode, dopingInput, resistivityInput]);

  const copy = () => {
    if (!result.ok) return;
    const lines = [
      `Silicon Carrier Mobility & Resistivity (${result.dopantType.toUpperCase()})`,
      `Doping Concentration: ${result.dopingCm3.toExponential(3)} cm⁻³`,
      `Carrier Mobility: ${fmt(result.mobilityCm2PerVs)} cm²/(V·s)`,
      `Resistivity: ${fmt(result.resistivityOhmCm)} Ω·cm`,
      `Conductivity: ${fmt(result.conductivitySPerCm)} S/cm`,
      `Diffusion Coefficient (Dn/Dp): ${fmt(result.diffusivityCm2PerS)} cm²/s`,
    ];

    void copyResult(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Doping & Transport Mode</h2>

        <div className="field">
          <span className="field-label">Dopant Type</span>
          <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`button ${dopantType === 'p-type' ? 'primary' : 'secondary'}`}
              onClick={() => setDopantType('p-type')}
            >
              p-type (Boron / Holes)
            </button>
            <button
              type="button"
              className={`button ${dopantType === 'n-type' ? 'primary' : 'secondary'}`}
              onClick={() => setDopantType('n-type')}
            >
              n-type (Phosphorus / Arsenic / Electrons)
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Calculation Direction</span>
          <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`button ${mode === 'forward' ? 'primary' : 'secondary'}`}
              onClick={() => setMode('forward')}
            >
              Doping → Resistivity
            </button>
            <button
              type="button"
              className={`button ${mode === 'reverse' ? 'primary' : 'secondary'}`}
              onClick={() => setMode('reverse')}
            >
              Resistivity → Doping
            </button>
          </div>
        </div>

        {mode === 'forward' ? (
          <div className="field">
            <label htmlFor="doping-val">
              {dopantType === 'n-type' ? 'Donor Concentration Nd' : 'Acceptor Concentration Na'} (cm⁻³)
            </label>
            <input
              id="doping-val"
              type="text"
              placeholder="e.g. 1e16"
              value={dopingInput}
              onChange={(e) => setDopingInput(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="rho-val">Silicon Resistivity ρ (Ω·cm)</label>
            <input
              id="rho-val"
              type="text"
              placeholder="e.g. 10.0"
              value={resistivityInput}
              onChange={(e) => setResistivityInput(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <span className="field-label">Industry Presets</span>
          <div className="button-group" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="button secondary"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                onClick={() => {
                  setDopantType(p.type);
                  if (p.mode === 'rev') {
                    setMode('reverse');
                    setResistivityInput(p.val);
                  } else {
                    setMode('forward');
                    setDopingInput(p.val);
                  }
                }}
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
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setDopantType('p-type');
              setMode('forward');
              setDopingInput('1e16');
              setResistivityInput('1.0');
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Transport & Resistivity Characteristics</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">
              {mode === 'forward' ? 'Silicon Resistivity (ρ)' : 'Doping Concentration (N)'}
            </span>
            <div className="result-value" aria-live="polite">
              {mode === 'forward' ? (
                <>
                  {fmt(result.resistivityOhmCm)} <span className="result-suffix">Ω·cm</span>
                </>
              ) : (
                <>
                  {result.dopingCm3.toExponential(3)} <span className="result-suffix">cm⁻³</span>
                </>
              )}
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Doping (N)</span>
                <strong>{result.dopingCm3.toExponential(3)} cm⁻³</strong>
              </div>
              <div className="metric">
                <span>Carrier Mobility (µ)</span>
                <strong>{fmt(result.mobilityCm2PerVs)} cm²/V·s</strong>
              </div>
              <div className="metric">
                <span>Resistivity (ρ)</span>
                <strong>{fmt(result.resistivityOhmCm)} Ω·cm</strong>
              </div>
              <div className="metric">
                <span>Conductivity (σ)</span>
                <strong>{fmt(result.conductivitySPerCm)} S/cm</strong>
              </div>
              <div className="metric">
                <span>Diff. Constant (D)</span>
                <strong>{fmt(result.diffusivityCm2PerS)} cm²/s</strong>
              </div>
              <div className="metric">
                <span>Thermal Voltage (Vt)</span>
                <strong>~25.85 mV</strong>
              </div>
            </div>

            <MobilityCurvePlot
              currentDoping={result.dopingCm3}
              currentMobility={result.mobilityCm2PerVs}
              dopantType={result.dopantType}
            />
          </>
        )}
      </section>
    </div>
  );
}

function MobilityCurvePlot({
  currentDoping,
  currentMobility,
  dopantType,
}: {
  currentDoping: number;
  currentMobility: number;
  dopantType: DopantType;
}) {
  const width = 460;
  const height = 180;
  const pad = { top: 20, right: 25, bottom: 32, left: 45 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // log scale doping: 1e14 to 1e21
  const minLogN = 14;
  const maxLogN = 21;
  const mapX = (doping: number) => {
    const logVal = Math.log10(doping);
    const clamped = Math.max(minLogN, Math.min(maxLogN, logVal));
    return pad.left + ((clamped - minLogN) / (maxLogN - minLogN)) * plotW;
  };

  // Linear mobility: 0 to 1500 cm2/Vs
  const maxMu = 1500;
  const mapY = (mu: number) => {
    const clamped = Math.max(0, Math.min(maxMu, mu));
    return pad.top + (1 - clamped / maxMu) * plotH;
  };

  // Generate curves for n-type and p-type
  const points = 50;
  const electronPoints: string[] = [];
  const holePoints: string[] = [];

  for (let i = 0; i <= points; i++) {
    const logN = minLogN + (i / points) * (maxLogN - minLogN);
    const conc = Math.pow(10, logN);

    // electrons
    const muN = 65.0 + (1417.0 - 65.0) / (1 + Math.pow(conc / 9.68e16, 0.72));
    electronPoints.push(`${mapX(conc).toFixed(1)},${mapY(muN).toFixed(1)}`);

    // holes
    const muP = 47.7 + (470.5 - 47.7) / (1 + Math.pow(conc / 2.23e17, 0.76));
    holePoints.push(`${mapX(conc).toFixed(1)},${mapY(muP).toFixed(1)}`);
  }

  const curX = mapX(currentDoping);
  const curY = mapY(currentMobility);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--ink)' }}>
        Carrier Mobility vs Doping (Caughey-Thomas 300K)
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '6px' }}
        role="img"
        aria-label="Carrier mobility versus doping concentration curve"
      >
        {/* Grid lines */}
        {[0, 500, 1000, 1500].map((mu) => (
          <g key={mu}>
            <line
              x1={pad.left}
              y1={mapY(mu)}
              x2={pad.left + plotW}
              y2={mapY(mu)}
              stroke="var(--line)"
              strokeDasharray="2 2"
            />
            <text x={pad.left - 6} y={mapY(mu) + 3} fontSize="9" fill="var(--muted)" textAnchor="end">
              {mu}
            </text>
          </g>
        ))}

        {/* X Ticks */}
        {[14, 16, 18, 20].map((log) => (
          <g key={log}>
            <text x={mapX(Math.pow(10, log))} y={pad.top + plotH + 15} fontSize="9" fill="var(--muted)" textAnchor="middle">
              10^{log}
            </text>
          </g>
        ))}

        {/* Electron Curve */}
        <polyline
          fill="none"
          stroke={dopantType === 'n-type' ? 'var(--teal)' : 'var(--line-strong)'}
          strokeWidth={dopantType === 'n-type' ? '2.5' : '1.5'}
          points={electronPoints.join(' ')}
        />

        {/* Hole Curve */}
        <polyline
          fill="none"
          stroke={dopantType === 'p-type' ? 'var(--amber)' : 'var(--line-strong)'}
          strokeWidth={dopantType === 'p-type' ? '2.5' : '1.5'}
          points={holePoints.join(' ')}
        />

        {/* Current operating point marker */}
        <circle
          cx={curX}
          cy={curY}
          r="5"
          fill={dopantType === 'n-type' ? 'var(--teal)' : 'var(--amber)'}
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Legend */}
        <text x={pad.left + 10} y={pad.top + 15} fontSize="10" fill="var(--teal)" fontWeight="600">
          — Electrons (µn)
        </text>
        <text x={pad.left + 110} y={pad.top + 15} fontSize="10" fill="var(--amber)" fontWeight="600">
          — Holes (µp)
        </text>
      </svg>
    </div>
  );
}
