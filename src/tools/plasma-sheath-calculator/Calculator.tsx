'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Info, Activity } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculatePlasmaSheath,
  PLASMA_GAS_PRESETS,
  type PlasmaGasPreset,
} from '@/lib/plasma-sheath';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  gasPresetId: 'argon',
  customIonMassAmu: '39.95',
  electronDensityExp: '11', // log10(n_e) in cm^-3 -> 1e11
  electronTempEv: '3.0',
  sheathVoltageV: '150',
  chamberPressureMtorr: '10',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function PlasmaSheathCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);

  const selectedPreset: PlasmaGasPreset | undefined = useMemo(() => {
    return PLASMA_GAS_PRESETS.find((p) => p.id === state.gasPresetId);
  }, [state.gasPresetId]);

  const activeIonMass = useMemo(() => {
    if (state.gasPresetId === 'custom') {
      return num(state.customIonMassAmu);
    }
    return selectedPreset ? selectedPreset.ionMassAmu : 39.95;
  }, [state.gasPresetId, state.customIonMassAmu, selectedPreset]);

  const densityVal = useMemo(() => {
    const exp = num(state.electronDensityExp);
    return Number.isFinite(exp) ? Math.pow(10, exp) : 1e11;
  }, [state.electronDensityExp]);

  const result = useMemo(() => {
    const Te = num(state.electronTempEv);
    const V = num(state.sheathVoltageV);
    const P = num(state.chamberPressureMtorr);

    if (!Number.isFinite(densityVal) || !Number.isFinite(Te) || !Number.isFinite(activeIonMass) || !Number.isFinite(V)) {
      return null;
    }

    return calculatePlasmaSheath({
      electronDensityCm3: densityVal,
      electronTempEv: Te,
      ionMassAmu: activeIonMass,
      sheathVoltageV: V,
      chamberPressureMtorr: Number.isFinite(P) && P > 0 ? P : undefined,
    });
  }, [densityVal, state.electronTempEv, activeIonMass, state.sheathVoltageV, state.chamberPressureMtorr]);

  const copyResult = async () => {
    if (!result) return;
    const lines = [
      'Plasma Sheath & Debye Length Parameters',
      `Feedstock Gas / Ion: ${selectedPreset ? selectedPreset.name : `Custom (M = ${activeIonMass} amu)`}`,
      `Plasma Density (ne): ${densityVal.toExponential(2)} cm⁻³`,
      `Electron Temperature (Te): ${state.electronTempEv} eV`,
      `Sheath Voltage (V_sheath / V_bias): ${state.sheathVoltageV} V`,
      `Debye Length (λ_De): ${fmt(result.debyeLengthUm)} µm (${fmt(result.debyeLengthMm, 4)} mm)`,
      `Bohm Presheath Velocity (u_B): ${fmt(result.bohmVelocityMPerSec)} m/s`,
      `Bohm Ion Current Density (J_B): ${fmt(result.ionCurrentDensityMaPerCm2, 3)} mA/cm² (${fmt(result.ionFluxDensityAmpsPerM2, 1)} A/m²)`,
      `Child-Langmuir Sheath Thickness (s): ${fmt(result.childLangmuirSheathUm)} µm (${fmt(result.childLangmuirSheathMm, 3)} mm)`,
      `Floating Potential (V_f): ${fmt(result.floatingPotentialVolts, 1)} V`,
      `Plasma Frequency (f_pe): ${fmt(result.electronPlasmaFreqGhz, 2)} GHz`,
      `Sheath Capacitance: ${fmt(result.sheathCapacitancePfPerCm2, 2)} pF/cm²`,
    ];
    if (result.ionMeanFreePathMm) {
      lines.push(`Ion Mean Free Path (λ_i): ${fmt(result.ionMeanFreePathMm, 2)} mm`);
      lines.push(`Collisionality Index (s / λ_i): ${fmt(result.collisionalityRatio ?? 0, 2)}`);
      lines.push(`Regime: ${result.regimeDescription}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="plasma-inputs">
        <h2 id="plasma-inputs">Plasma & Discharge Conditions</h2>

        <div className="field">
          <label htmlFor="gas-preset">Working Gas & Dominant Ion Species</label>
          <select
            id="gas-preset"
            value={state.gasPresetId}
            onChange={(e) => setState((p) => ({ ...p, gasPresetId: e.target.value }))}
          >
            {PLASMA_GAS_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} (amu: {preset.ionMassAmu}) — {preset.typicalProcess}
              </option>
            ))}
            <option value="custom">Custom Ion Mass...</option>
          </select>
        </div>

        {state.gasPresetId === 'custom' && (
          <div className="field">
            <label htmlFor="custom-mass">
              Custom Ion Atomic Mass (Mᵢ)<span className="unit">amu (g/mol)</span>
            </label>
            <input
              id="custom-mass"
              type="number"
              step="0.1"
              min="1"
              value={state.customIonMassAmu}
              onChange={(e) => setState((p) => ({ ...p, customIonMassAmu: e.target.value }))}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="ne-log">
            Plasma Electron Density (nₑ = 10^{state.electronDensityExp})
            <span className="unit">cm⁻³ (10^{state.electronDensityExp})</span>
          </label>
          <input
            id="ne-log"
            type="range"
            min="9"
            max="13"
            step="0.1"
            value={state.electronDensityExp}
            onChange={(e) => setState((p) => ({ ...p, electronDensityExp: e.target.value }))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
            <span>10⁹ cm⁻³ (Capacitive CCP)</span>
            <span>10¹¹ cm⁻³ (Standard RIE)</span>
            <span>10¹³ cm⁻³ (High Density ICP)</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="te-ev">
            Electron Temperature (Tₑ)<span className="unit">eV</span>
          </label>
          <input
            id="te-ev"
            type="number"
            min="0.5"
            max="15"
            step="0.5"
            value={state.electronTempEv}
            onChange={(e) => setState((p) => ({ ...p, electronTempEv: e.target.value }))}
          />
          <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            Note: 1 eV ≈ 11,600 Kelvin. Typical processing plasmas operate at 2.0 – 5.0 eV.
          </div>
        </div>

        <div className="field">
          <label htmlFor="bias-volts">
            RF Sheath / Wafer Bias Voltage (V₀)<span className="unit">Volts (V)</span>
          </label>
          <input
            id="bias-volts"
            type="number"
            min="1"
            max="2000"
            step="10"
            value={state.sheathVoltageV}
            onChange={(e) => setState((p) => ({ ...p, sheathVoltageV: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="pressure-mtorr">
            Chamber Pressure<span className="unit">mTorr</span>
          </label>
          <input
            id="pressure-mtorr"
            type="number"
            min="0.5"
            max="500"
            step="1"
            value={state.chamberPressureMtorr}
            onChange={(e) => setState((p) => ({ ...p, chamberPressureMtorr: e.target.value }))}
          />
        </div>

        <div className="action-row" style={{ marginTop: '24px' }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => setState(INITIAL)}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
          <button
            className="button primary"
            type="button"
            onClick={copyResult}
          >
            <Copy size={14} aria-hidden="true" /> {copied ? 'Copied Results!' : 'Copy Summary'}
          </button>
        </div>

        <div className="note" style={{ marginTop: '20px' }}>
          <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
          <strong>Bohm Criterion:</strong> In order to form a stable non-neutral electrostatic sheath, ions must accelerate across the quasi-neutral presheath and enter the sheath edge with a directed speed equal to or exceeding the Bohm acoustic velocity <em>u_B = √(k_B·T_e / M_i)</em>.
        </div>
      </section>

      <section className="panel" aria-labelledby="plasma-results">
        <h2 id="plasma-results">Sheath & Plasma Properties</h2>

        {result ? (
          <>
            <div>
              <span className="unit">Child-Langmuir Sheath Thickness (s)</span>
              <div className="result-value">
                {fmt(result.childLangmuirSheathUm)} <span style={{ fontSize: '18px', fontWeight: 400 }}>µm</span>
                <span style={{ fontSize: '14px', color: 'var(--ink-soft)', marginLeft: '10px' }}>
                  ({fmt(result.childLangmuirSheathMm, 3)} mm)
                </span>
              </div>
            </div>

            <div className="metric-grid" style={{ marginTop: '20px' }}>
              <div className="metric">
                <span>Debye Length (λ_De)</span>
                <strong>{fmt(result.debyeLengthUm)} µm</strong>
              </div>
              <div className="metric">
                <span>Bohm Presheath Velocity (u_B)</span>
                <strong>{fmt(result.bohmVelocityMPerSec)} m/s</strong>
              </div>
              <div className="metric">
                <span>Bohm Ion Current Density (J_B)</span>
                <strong>{fmt(result.ionCurrentDensityMaPerCm2, 3)} mA/cm²</strong>
              </div>
              <div className="metric">
                <span>Floating Potential (V_f)</span>
                <strong>{fmt(result.floatingPotentialVolts, 1)} V</strong>
              </div>
              <div className="metric">
                <span>Plasma Frequency (f_pe)</span>
                <strong>{fmt(result.electronPlasmaFreqGhz, 2)} GHz</strong>
              </div>
              <div className="metric">
                <span>Sheath Capacitance</span>
                <strong>{fmt(result.sheathCapacitancePfPerCm2, 2)} pF/cm²</strong>
              </div>
            </div>

            {result.ionMeanFreePathMm && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px' }}>
                  <Activity size={18} />
                  <span>Ion Transport & Sheath Collisionality</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '8px' }}>
                  <strong>Ion Mean Free Path (λ_i):</strong> {fmt(result.ionMeanFreePathMm, 2)} mm &nbsp;|&nbsp;
                  <strong> Collisionality Ratio (s / λ_i):</strong> {fmt(result.collisionalityRatio ?? 0, 2)}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>
                  {result.regimeDescription}
                </p>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                Plasma Sheath Potential Structure
              </h3>
              <div
                style={{
                  position: 'relative',
                  height: '140px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-soft)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                  <span>Bulk Plasma (Quasi-Neutral: n_e ≈ n_i, V ≈ V_plasma)</span>
                  <span>Presheath Edge (u_i = u_B)</span>
                  <span style={{ color: '#dc2626' }}>Wafer Electrode (-V_bias)</span>
                </div>

                <div style={{ height: '40px', position: 'relative', margin: '10px 0' }}>
                  <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                    {/* Presheath slow drop */}
                    <path
                      d="M 0,5 Q 40,8 60,15 T 100,38"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                  <span>0 V ref</span>
                  <span>Presheath ΔV ≈ 0.5·Te ({fmt(0.5 * num(state.electronTempEv), 1)} V)</span>
                  <span>Total Sheath Drop ≈ {state.sheathVoltageV} V</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="error" role="alert">
            Please enter valid numerical parameters for electron density and temperature.
          </div>
        )}
      </section>
    </div>
  );
}
