'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Info, Activity, Download } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculatePlasmaSheath,
  generateSheathProfile,
  PLASMA_GAS_PRESETS,
  type PlasmaGasPreset,
  type SheathSpatialPoint,
} from '@/lib/plasma-sheath';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv } from '@/lib/export';

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
  const [chartMode, setChartMode] = useState<'potential' | 'density'>('potential');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Spatial profiles across presheath & Child-Langmuir sheath
  const profilePoints: SheathSpatialPoint[] = useMemo(() => {
    const Te = num(state.electronTempEv);
    const V = num(state.sheathVoltageV);
    if (!result || !Number.isFinite(Te) || !Number.isFinite(V)) return [];
    return generateSheathProfile(
      result,
      {
        electronDensityCm3: densityVal,
        electronTempEv: Te,
        ionMassAmu: activeIonMass,
        sheathVoltageV: V,
      },
      60
    );
  }, [result, densityVal, state.electronTempEv, activeIonMass, state.sheathVoltageV]);

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

  const handleExportProfileCsv = () => {
    if (!result || profilePoints.length === 0) return;
    const headers = [
      'Position_x_um',
      'Region',
      'Potential_V',
      'Normalized_Ion_Density_ni_n0',
      'Normalized_Electron_Density_ne_n0',
      'Ion_Velocity_m_s',
    ];
    const rows = profilePoints.map((p) => [
      p.xUm.toFixed(2),
      p.region,
      p.potentialVolts.toFixed(3),
      p.ionDensityNormalized.toFixed(4),
      p.electronDensityNormalized.toString(),
      p.ionVelocityMPerSec.toString(),
    ]);
    const gasTag = selectedPreset?.id ?? 'custom';
    downloadCsv(`plasma_sheath_profile_${gasTag}_${state.sheathVoltageV}V`, headers, rows);
  };

  const handleExportSummaryCsv = () => {
    if (!result) return;
    const headers = ['Parameter', 'Value', 'Unit', 'Description'];
    const rows = [
      ['Working Gas / Ion', selectedPreset ? selectedPreset.name : 'Custom', '—', selectedPreset?.typicalProcess ?? 'Custom plasma process'],
      ['Ion Mass', activeIonMass.toString(), 'amu', 'Dominant ionic mass in discharge'],
      ['Electron Density (ne)', densityVal.toExponential(3), 'cm⁻³', 'Unperturbed bulk plasma electron density'],
      ['Electron Temperature (Te)', state.electronTempEv, 'eV', 'Mean kinetic electron temperature'],
      ['Sheath Voltage (V0)', state.sheathVoltageV, 'V', 'Wafer RF self-bias / cathode voltage drop'],
      ['Chamber Pressure', state.chamberPressureMtorr || '—', 'mTorr', 'Reactor vacuum chamber neutral gas pressure'],
      ['Debye Length (lambda_De)', fmt(result.debyeLengthUm), 'µm', 'Electrostatic screening / shielding distance'],
      ['Bohm Presheath Velocity (u_B)', fmt(result.bohmVelocityMPerSec), 'm/s', 'Ion acoustic entry velocity at sheath boundary'],
      ['Bohm Current Density (J_B)', fmt(result.ionCurrentDensityMaPerCm2, 4), 'mA/cm²', 'Directed positive ion saturation current'],
      ['Child-Langmuir Sheath Thickness (s)', fmt(result.childLangmuirSheathUm), 'µm', 'Space-charge limited sheath thickness'],
      ['Floating Potential (V_f)', fmt(result.floatingPotentialVolts, 2), 'V', 'Insulated substrate zero-net-current potential'],
      ['Electron Plasma Frequency (f_pe)', fmt(result.electronPlasmaFreqGhz, 3), 'GHz', 'Collective electron oscillation frequency'],
      ['Sheath Capacitance', fmt(result.sheathCapacitancePfPerCm2, 2), 'pF/cm²', 'RF sheath electrostatic capacitance per unit area'],
      ['Ion Mean Free Path', result.ionMeanFreePathMm ? fmt(result.ionMeanFreePathMm, 2) : '—', 'mm', 'Average distance between ion-neutral collisions'],
      ['Collisionality Ratio (s / lambda_i)', result.collisionalityRatio ? fmt(result.collisionalityRatio, 2) : '—', '—', 'Ratio of sheath width to mean free path'],
      ['Sheath Regime', result.regimeDescription, '—', 'Transport classification'],
    ];
    const gasTag = selectedPreset?.id ?? 'custom';
    downloadCsv(`plasma_sheath_parameters_${gasTag}_${state.sheathVoltageV}V`, headers, rows);
  };

  // SVG dimensions and scaling
  const svgW = 660;
  const svgH = 220;
  const pad = { top: 25, right: 30, bottom: 40, left: 55 };
  const pW = svgW - pad.left - pad.right;
  const pH = svgH - pad.top - pad.bottom;

  const chartInfo = useMemo(() => {
    if (profilePoints.length === 0) return null;
    const minX = profilePoints[0].xUm;
    const maxX = profilePoints[profilePoints.length - 1].xUm;
    const spanX = maxX - minX || 1;

    const getSvgX = (xUm: number) => pad.left + ((xUm - minX) / spanX) * pW;
    const xZero = getSvgX(0);

    // Potential mapping: 0 V at top (pad.top), -V0 V at bottom (pad.top + pH)
    const V0 = Math.max(0.1, num(state.sheathVoltageV) || 150);
    const getSvgYPotential = (v: number) => {
      const clamped = Math.max(-V0, Math.min(0, v));
      return pad.top + (-clamped / V0) * pH;
    };

    // Density mapping: 1.05 at top, 0 at bottom
    const maxDensity = 1.05;
    const getSvgYDensity = (d: number) => {
      const clamped = Math.max(0, Math.min(maxDensity, d));
      return pad.top + pH * (1 - clamped / maxDensity);
    };

    // Construct paths
    const potPath = profilePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.xUm).toFixed(1)} ${getSvgYPotential(p.potentialVolts).toFixed(1)}`)
      .join(' ');

    const potArea = `${potPath} L ${getSvgX(maxX).toFixed(1)} ${pad.top} L ${getSvgX(minX).toFixed(1)} ${pad.top} Z`;

    const niPath = profilePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.xUm).toFixed(1)} ${getSvgYDensity(p.ionDensityNormalized).toFixed(1)}`)
      .join(' ');

    const nePath = profilePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.xUm).toFixed(1)} ${getSvgYDensity(p.electronDensityNormalized).toFixed(1)}`)
      .join(' ');

    // Space charge area between ni and ne inside sheath
    const sheathPoints = profilePoints.filter((p) => p.xUm >= 0);
    let spaceChargeArea = '';
    if (sheathPoints.length > 0) {
      const topPts = sheathPoints.map((p) => `${getSvgX(p.xUm).toFixed(1)},${getSvgYDensity(p.ionDensityNormalized).toFixed(1)}`);
      const botPts = [...sheathPoints].reverse().map((p) => `${getSvgX(p.xUm).toFixed(1)},${getSvgYDensity(p.electronDensityNormalized).toFixed(1)}`);
      spaceChargeArea = `M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;
    }

    return {
      minX,
      maxX,
      xZero,
      getSvgX,
      getSvgYPotential,
      getSvgYDensity,
      potPath,
      potArea,
      niPath,
      nePath,
      spaceChargeArea,
    };
  }, [profilePoints, state.sheathVoltageV, pW, pH, pad.left, pad.top]);

  const activePoint = hoveredIndex !== null && profilePoints[hoveredIndex] ? profilePoints[hoveredIndex] : null;

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
          <button
            className="button secondary"
            type="button"
            onClick={handleExportProfileCsv}
            disabled={!result}
            title="Download spatial sheath potential & density profile as CSV"
          >
            <Download size={14} aria-hidden="true" /> Export Profile
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={handleExportSummaryCsv}
            disabled={!result}
            title="Download comprehensive plasma parameters as CSV"
          >
            <Download size={14} aria-hidden="true" /> Export Summary
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

            {/* Interactive SVG Sheath Profiler */}
            {chartInfo && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--ink)' }}>
                    Sheath Spatial Profiling (Presheath to Wafer Cathode)
                  </h3>
                  <div className="button-group" role="tablist" aria-label="Profile View Mode">
                    <button
                      type="button"
                      className={`button ${chartMode === 'potential' ? 'primary' : 'secondary'}`}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => setChartMode('potential')}
                    >
                      Potential V(x)
                    </button>
                    <button
                      type="button"
                      className={`button ${chartMode === 'density' ? 'primary' : 'secondary'}`}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => setChartMode('density')}
                    >
                      Density n/n₀
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    borderRadius: '6px',
                    border: '1px solid var(--border-soft)',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '8px',
                  }}
                >
                  <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Background region zones */}
                    {/* Presheath zone */}
                    <rect
                      x={pad.left}
                      y={pad.top}
                      width={Math.max(0, chartInfo.xZero - pad.left)}
                      height={pH}
                      fill="rgba(59, 130, 246, 0.04)"
                    />
                    {/* Sheath zone */}
                    <rect
                      x={chartInfo.xZero}
                      y={pad.top}
                      width={Math.max(0, pad.left + pW - chartInfo.xZero)}
                      height={pH}
                      fill="rgba(239, 68, 68, 0.04)"
                    />

                    {/* Sheath Edge vertical marker */}
                    <line
                      x1={chartInfo.xZero}
                      y1={pad.top}
                      x2={chartInfo.xZero}
                      y2={pad.top + pH}
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={chartInfo.xZero + 5}
                      y={pad.top + 14}
                      fontSize="9"
                      fill="var(--accent)"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      Sheath Edge (x=0, u_B={fmt(result.bohmVelocityMPerSec)} m/s)
                    </text>

                    {/* Wafer / Electrode boundary */}
                    <line
                      x1={pad.left + pW}
                      y1={pad.top}
                      x2={pad.left + pW}
                      y2={pad.top + pH}
                      stroke="#dc2626"
                      strokeWidth="2"
                    />
                    <text
                      x={pad.left + pW - 6}
                      y={pad.top + 14}
                      fontSize="9"
                      fill="#dc2626"
                      textAnchor="end"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      Wafer Cathode (x=s)
                    </text>

                    {/* Mode: Potential View */}
                    {chartMode === 'potential' && (
                      <>
                        {/* Horizontal Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1.0].map((f) => {
                          const y = pad.top + pH * f;
                          const vVal = -(f * (num(state.sheathVoltageV) || 150));
                          return (
                            <g key={f}>
                              <line
                                x1={pad.left}
                                y1={y}
                                x2={pad.left + pW}
                                y2={y}
                                stroke="var(--border-soft)"
                                strokeDasharray="3 3"
                                opacity={0.6}
                              />
                              <text
                                x={pad.left - 6}
                                y={y + 3}
                                fontSize="9"
                                fill="var(--ink-soft)"
                                textAnchor="end"
                                fontFamily="var(--font-mono)"
                              >
                                {vVal.toFixed(0)} V
                              </text>
                            </g>
                          );
                        })}

                        {/* Area fill */}
                        <path d={chartInfo.potArea} fill="rgba(59, 130, 246, 0.12)" />

                        {/* Potential Curve */}
                        <path
                          d={chartInfo.potPath}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2.5"
                        />
                      </>
                    )}

                    {/* Mode: Density View */}
                    {chartMode === 'density' && (
                      <>
                        {/* Horizontal Grid */}
                        {[0, 0.25, 0.5, 0.75, 1.0].map((f) => {
                          const y = pad.top + pH * (1 - f);
                          return (
                            <g key={f}>
                              <line
                                x1={pad.left}
                                y1={y}
                                x2={pad.left + pW}
                                y2={y}
                                stroke="var(--border-soft)"
                                strokeDasharray="3 3"
                                opacity={0.6}
                              />
                              <text
                                x={pad.left - 6}
                                y={y + 3}
                                fontSize="9"
                                fill="var(--ink-soft)"
                                textAnchor="end"
                                fontFamily="var(--font-mono)"
                              >
                                {f.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Space Charge Shaded Area (ni - ne) */}
                        {chartInfo.spaceChargeArea && (
                          <path
                            d={chartInfo.spaceChargeArea}
                            fill="rgba(234, 88, 12, 0.15)"
                          />
                        )}

                        {/* Ion Density Curve (Blue/Teal) */}
                        <path
                          d={chartInfo.niPath}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.2"
                        />

                        {/* Electron Density Curve (Orange) */}
                        <path
                          d={chartInfo.nePath}
                          fill="none"
                          stroke="#ea580c"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />

                        {/* Legend */}
                        <g transform={`translate(${pad.left + 15}, ${pad.top + 28})`}>
                          <rect width="120" height="36" rx="4" fill="var(--bg-subtle)" stroke="var(--border-soft)" opacity="0.9" />
                          <line x1="8" y1="12" x2="28" y2="12" stroke="#0284c7" strokeWidth="2" />
                          <text x="34" y="15" fontSize="9" fill="var(--ink)" fontWeight="500">nᵢ / n₀ (Ions)</text>
                          <line x1="8" y1="26" x2="28" y2="26" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
                          <text x="34" y="29" fontSize="9" fill="var(--ink)" fontWeight="500">nₑ / n₀ (Electrons)</text>
                        </g>
                      </>
                    )}

                    {/* X-Axis Ticks */}
                    {[0, 0.33, 0.66, 1.0].map((f) => {
                      const x = pad.left + pW * f;
                      const xUmVal = chartInfo.minX + f * (chartInfo.maxX - chartInfo.minX);
                      return (
                        <g key={f}>
                          <line
                            x1={x}
                            y1={pad.top + pH}
                            x2={x}
                            y2={pad.top + pH + 4}
                            stroke="var(--border-soft)"
                          />
                          <text
                            x={x}
                            y={pad.top + pH + 15}
                            fontSize="9"
                            fill="var(--ink-soft)"
                            textAnchor="middle"
                            fontFamily="var(--font-mono)"
                          >
                            {xUmVal.toFixed(0)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis label */}
                    <text
                      x={pad.left + pW / 2}
                      y={pad.top + pH + 30}
                      fontSize="10"
                      fill="var(--ink-soft)"
                      textAnchor="middle"
                    >
                      Spatial Coordinate x (µm) — [Presheath &lt; 0 | Sheath &gt; 0]
                    </text>

                    {/* Hover indicator hairline and point marker */}
                    {activePoint && (
                      <g>
                        <line
                          x1={chartInfo.getSvgX(activePoint.xUm)}
                          y1={pad.top}
                          x2={chartInfo.getSvgX(activePoint.xUm)}
                          y2={pad.top + pH}
                          stroke="var(--ink)"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        {chartMode === 'potential' ? (
                          <circle
                            cx={chartInfo.getSvgX(activePoint.xUm)}
                            cy={chartInfo.getSvgYPotential(activePoint.potentialVolts)}
                            r="4.5"
                            fill="var(--accent)"
                            stroke="#fff"
                            strokeWidth="1.5"
                          />
                        ) : (
                          <>
                            <circle
                              cx={chartInfo.getSvgX(activePoint.xUm)}
                              cy={chartInfo.getSvgYDensity(activePoint.ionDensityNormalized)}
                              r="4"
                              fill="#0284c7"
                              stroke="#fff"
                              strokeWidth="1"
                            />
                            <circle
                              cx={chartInfo.getSvgX(activePoint.xUm)}
                              cy={chartInfo.getSvgYDensity(activePoint.electronDensityNormalized)}
                              r="4"
                              fill="#ea580c"
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          </>
                        )}
                      </g>
                    )}

                    {/* Invisible hover capture slices */}
                    {profilePoints.map((p, idx) => {
                      const xPrev = idx === 0 ? pad.left : (chartInfo.getSvgX(profilePoints[idx - 1].xUm) + chartInfo.getSvgX(p.xUm)) / 2;
                      const xNext = idx === profilePoints.length - 1 ? pad.left + pW : (chartInfo.getSvgX(p.xUm) + chartInfo.getSvgX(profilePoints[idx + 1].xUm)) / 2;
                      const sliceW = Math.max(1, xNext - xPrev);
                      return (
                        <rect
                          key={p.xUm}
                          x={xPrev}
                          y={pad.top}
                          width={sliceW}
                          height={pH}
                          fill="transparent"
                          style={{ cursor: 'crosshair' }}
                          onMouseEnter={() => setHoveredIndex(idx)}
                        />
                      );
                    })}
                  </svg>

                  {/* Floating active point readout bar */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      marginTop: '6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface-sunken)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--ink-soft)' }}>x: </span>
                      <strong>{activePoint ? `${activePoint.xUm.toFixed(1)} µm` : 'Hover chart'}</strong>
                      <span style={{ marginLeft: '6px', color: 'var(--accent)', fontWeight: 600 }}>
                        {activePoint ? `[${activePoint.region}]` : ''}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)' }}>V(x): </span>
                      <strong>{activePoint ? `${activePoint.potentialVolts.toFixed(1)} V` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)' }}>nᵢ/n₀: </span>
                      <strong style={{ color: '#0284c7' }}>
                        {activePoint ? activePoint.ionDensityNormalized.toFixed(3) : '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)' }}>nₑ/n₀: </span>
                      <strong style={{ color: '#ea580c' }}>
                        {activePoint ? (activePoint.electronDensityNormalized < 0.001 ? '< 0.001' : activePoint.electronDensityNormalized.toFixed(3)) : '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)' }}>vᵢ(x): </span>
                      <strong>{activePoint ? `${fmt(activePoint.ionVelocityMPerSec)} m/s` : '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
