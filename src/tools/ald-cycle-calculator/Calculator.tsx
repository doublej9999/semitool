'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  ALD_PRESETS,
  calculateAldCycle,
  getAldPreset,
} from '@/lib/ald';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  presetId: 'al2o3-tma-h2o',
  pulseTime1: 0.1, // s
  purgeTime1: 5.0, // s
  pulseTime2: 0.1, // s
  purgeTime2: 5.0, // s
  pressure1Torr: 0.15, // Torr
  pressure2Torr: 0.15, // Torr
  saturationDose1L: 10000, // L
  saturationDose2L: 10000, // L
  solveMode: 'thickness', // 'thickness' | 'cycles'
  targetThicknessNm: 20, // nm
  totalCycles: 200,
  temperatureC: 200, // °C
};

export default function AldCycleCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  useUrlParamsState(state, setState);

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    setState((prev) => {
      if (key === 'presetId') {
        const preset = getAldPreset(value as string);
        if (preset) {
          return {
            ...prev,
            presetId: value as string,
            saturationDose1L: preset.defaultSaturationDose1L,
            saturationDose2L: preset.defaultSaturationDose2L,
            temperatureC: preset.temperatureRangeC[0],
          };
        }
      }
      return { ...prev, [key]: value };
    });
  };

  const preset = useMemo(() => getAldPreset(state.presetId), [state.presetId]);

  const result = useMemo(() => {
    return calculateAldCycle({
      precursor: state.presetId,
      pulseTime1: state.pulseTime1,
      purgeTime1: state.purgeTime1,
      pulseTime2: state.pulseTime2,
      purgeTime2: state.purgeTime2,
      pressure1Torr: state.pressure1Torr,
      pressure2Torr: state.pressure2Torr,
      saturationDose1L: state.saturationDose1L,
      saturationDose2L: state.saturationDose2L,
      targetThicknessNm: state.solveMode === 'thickness' ? state.targetThicknessNm : undefined,
      totalCycles: state.solveMode === 'cycles' ? state.totalCycles : undefined,
      temperatureC: state.temperatureC,
    });
  }, [state]);

  const copyResult = async () => {
    const summary = [
      `ALD Film: ${preset?.name ?? state.presetId}`,
      `Precursor A Pulse / Purge: ${state.pulseTime1} s / ${state.purgeTime1} s`,
      `Precursor B Pulse / Purge: ${state.pulseTime2} s / ${state.purgeTime2} s`,
      `Precursor A Exposure: ${result.exposure1L.toLocaleString()} L (Coverage: ${(result.coverage1 * 100).toFixed(1)}%)`,
      `Precursor B Exposure: ${result.exposure2L.toLocaleString()} L (Coverage: ${(result.coverage2 * 100).toFixed(1)}%)`,
      `Effective Surface Saturation: ${(result.effectiveCoverage * 100).toFixed(1)}%`,
      `Growth Per Cycle (GPC): ${fmt(result.effectiveGpcAngstrom, 3)} Å/cycle (${fmt(result.effectiveGpcNm, 4)} nm/cycle)`,
      `Total Cycles: ${result.requiredCycles}`,
      `Resulting Thickness: ${fmt(result.resultingThicknessNm, 2)} nm (${fmt(result.resultingThicknessAngstrom, 1)} Å)`,
      `Cycle Time: ${fmt(result.cycleTimeSec, 1)} s`,
      `Total Deposition Time: ${result.formattedTime} (${fmt(result.totalDepositionTimeSec, 0)} s)`,
      `Estimated Precursor Consumption: ${fmt(result.precursorConsumptionGrams, 3)} g`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="ald-inputs">
        <h2 id="ald-inputs">ALD Recipe & Precursor Inputs</h2>

        <div className="field">
          <label htmlFor="ald-preset">Precursor System & Film</label>
          <select
            id="ald-preset"
            value={state.presetId}
            onChange={(e) => update('presetId', e.target.value)}
          >
            {ALD_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {preset && (
            <p className="field-hint" style={{ fontSize: '0.82rem', marginTop: 4, color: 'var(--text-dim)' }}>
              {preset.reactionEquation} — Typical GPC: {preset.typicalGpcAngstrom} Å/cycle ({preset.temperatureRangeC[0]}–{preset.temperatureRangeC[1]} °C)
            </p>
          )}
        </div>

        <div className="field">
          <label>Solve Target</label>
          <div className="segmented-control" role="group" aria-label="Solve mode">
            <button
              type="button"
              className={state.solveMode === 'thickness' ? 'active' : ''}
              onClick={() => update('solveMode', 'thickness')}
            >
              Target Thickness
            </button>
            <button
              type="button"
              className={state.solveMode === 'cycles' ? 'active' : ''}
              onClick={() => update('solveMode', 'cycles')}
            >
              Fixed Cycles
            </button>
          </div>
        </div>

        {state.solveMode === 'thickness' ? (
          <div className="field">
            <label htmlFor="target-thickness">Target Film Thickness (nm)</label>
            <input
              id="target-thickness"
              type="number"
              min={0.1}
              step={1}
              value={state.targetThicknessNm}
              onChange={(e) => update('targetThicknessNm', Math.max(0.1, Number(e.target.value)))}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="total-cycles">Total Deposition Cycles</label>
            <input
              id="total-cycles"
              type="number"
              min={1}
              step={10}
              value={state.totalCycles}
              onChange={(e) => update('totalCycles', Math.max(1, Number(e.target.value)))}
            />
          </div>
        )}

        <div className="form-row">
          <div className="field">
            <label htmlFor="temp-c">Substrate Temp (°C)</label>
            <input
              id="temp-c"
              type="number"
              min={50}
              max={600}
              value={state.temperatureC}
              onChange={(e) => update('temperatureC', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="sat-dose">Precursor A Sat. Dose (L)</label>
            <input
              id="sat-dose"
              type="number"
              min={100}
              step={500}
              value={state.saturationDose1L}
              onChange={(e) => update('saturationDose1L', Math.max(10, Number(e.target.value)))}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '0.95rem', marginTop: 16, marginBottom: 8, color: 'var(--teal)' }}>
          Half-Cycle A: Precursor Dose & Purge
        </h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pulse-1">Pulse Time (s)</label>
            <input
              id="pulse-1"
              type="number"
              min={0.01}
              step={0.05}
              value={state.pulseTime1}
              onChange={(e) => update('pulseTime1', Math.max(0.001, Number(e.target.value)))}
            />
          </div>
          <div className="field">
            <label htmlFor="pressure-1">Partial Pressure (Torr)</label>
            <input
              id="pressure-1"
              type="number"
              min={0.001}
              step={0.05}
              value={state.pressure1Torr}
              onChange={(e) => update('pressure1Torr', Math.max(0.0001, Number(e.target.value)))}
            />
          </div>
          <div className="field">
            <label htmlFor="purge-1">N₂ Purge Time (s)</label>
            <input
              id="purge-1"
              type="number"
              min={0.1}
              step={0.5}
              value={state.purgeTime1}
              onChange={(e) => update('purgeTime1', Math.max(0.01, Number(e.target.value)))}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '0.95rem', marginTop: 16, marginBottom: 8, color: 'var(--teal)' }}>
          Half-Cycle B: Co-Reactant Dose & Purge
        </h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pulse-2">Pulse Time (s)</label>
            <input
              id="pulse-2"
              type="number"
              min={0.01}
              step={0.05}
              value={state.pulseTime2}
              onChange={(e) => update('pulseTime2', Math.max(0.001, Number(e.target.value)))}
            />
          </div>
          <div className="field">
            <label htmlFor="pressure-2">Partial Pressure (Torr)</label>
            <input
              id="pressure-2"
              type="number"
              min={0.001}
              step={0.05}
              value={state.pressure2Torr}
              onChange={(e) => update('pressure2Torr', Math.max(0.0001, Number(e.target.value)))}
            />
          </div>
          <div className="field">
            <label htmlFor="purge-2">N₂ Purge Time (s)</label>
            <input
              id="purge-2"
              type="number"
              min={0.1}
              step={0.5}
              value={state.purgeTime2}
              onChange={(e) => update('purgeTime2', Math.max(0.01, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="action-row" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset Recipe</span>
          </button>
          <button type="button" className="button" onClick={copyResult}>
            <Copy size={14} aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="ald-results">
        <h2 id="ald-results">Deposition Results & Kinetics</h2>

        <div className="result-hero" style={{ marginBottom: 16 }}>
          <span className="result-label">Effective Growth Per Cycle (GPC)</span>
          <span className="result-value">
            {fmt(result.effectiveGpcAngstrom, 3)}
            <span className="result-suffix"> Å/cycle</span>
          </span>
          <span className="result-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            = {fmt(result.effectiveGpcNm, 4)} nm/cycle ({fmt(result.effectiveCoverage * 100, 1)}% surface saturation)
          </span>
        </div>

        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Total Deposition Time</span>
            <span className="metric-value">{result.formattedTime}</span>
            <span className="metric-unit">{fmt(result.totalDepositionTimeSec, 0)} seconds</span>
          </div>

          <div className="metric">
            <span className="metric-label">Required Cycles</span>
            <span className="metric-value">{result.requiredCycles}</span>
            <span className="metric-unit">cycles</span>
          </div>

          <div className="metric">
            <span className="metric-label">Resulting Thickness</span>
            <span className="metric-value">{fmt(result.resultingThicknessNm, 2)}</span>
            <span className="metric-unit">nm ({fmt(result.resultingThicknessAngstrom, 1)} Å)</span>
          </div>

          <div className="metric">
            <span className="metric-label">Single Cycle Period</span>
            <span className="metric-value">{fmt(result.cycleTimeSec, 1)}</span>
            <span className="metric-unit">s / cycle</span>
          </div>

          <div className="metric">
            <span className="metric-label">Precursor A Exposure</span>
            <span className="metric-value">{result.exposure1L.toLocaleString()}</span>
            <span className="metric-unit">Langmuirs (θ₁ = {(result.coverage1 * 100).toFixed(1)}%)</span>
          </div>

          <div className="metric">
            <span className="metric-label">Precursor B Exposure</span>
            <span className="metric-value">{result.exposure2L.toLocaleString()}</span>
            <span className="metric-unit">Langmuirs (θ₂ = {(result.coverage2 * 100).toFixed(1)}%)</span>
          </div>

          <div className="metric">
            <span className="metric-label">Precursor Consumption</span>
            <span className="metric-value">{fmt(result.precursorConsumptionGrams, 3)}</span>
            <span className="metric-unit">grams total vapor</span>
          </div>

          <div className="metric">
            <span className="metric-label">Single-Wafer Rate</span>
            <span className="metric-value">{fmt(result.throughputWph, 2)}</span>
            <span className="metric-unit">wafers / hour</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 6,
            background: 'var(--surface-sunken)',
            borderLeft: '4px solid var(--teal)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>
            Langmuir Saturation Regime:
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {result.effectiveCoverage >= 0.99 ? (
              <span style={{ color: 'var(--teal)' }}>
                ✓ Fully Saturated Self-Limiting Regime (θ &gt; 99%). Film conforms with 100% step coverage across high aspect-ratio 3D trenches.
              </span>
            ) : result.effectiveCoverage >= 0.90 ? (
              <span>
                Near Saturation (90%–99%). GPC is slightly sensitive to precursor partial pressure. Recommend increasing pulse time by 20–30% for challenging 3D topography.
              </span>
            ) : (
              <span style={{ color: 'var(--amber, #f59e0b)' }}>
                ⚠ Sub-saturated Regime (θ &lt; 90%). Growth is dose-starved, leading to non-uniform film thickness and poor step coverage on deep trench sidewalls.
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
