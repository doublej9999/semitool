'use client';

import { useId, useMemo, useState } from 'react';
import { Copy, RotateCcw, Download, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv } from '@/lib/export';
import {
  calculateCvdKinetics,
  CVD_RECIPES,
  type CvdProcessId,
} from '@/lib/cvd-kinetics';

interface CvdState extends Record<string, string | number | boolean> {
  recipeId: CvdProcessId;
  tempCelsius: number;
  pressureTorr: number;
  reactantMoleFraction: number; // 0.001 to 1.0
  gasVelocityCmPerS: number;
  waferPositionXCm: number;
  channelHeightCm: number;
  susceptorLengthCm: number;
  customEaEv: string;
  customKs0: string;
}

const INITIAL_STATE: CvdState = {
  recipeId: 'si-sih4',
  tempCelsius: 850,
  pressureTorr: 760,
  reactantMoleFraction: 0.001,
  gasVelocityCmPerS: 20,
  waferPositionXCm: 10,
  channelHeightCm: 5,
  susceptorLengthCm: 30,
  customEaEv: '1.6',
  customKs0: '1.2e7',
};

export default function CvdKineticsCalculator() {
  const [state, setState] = useState<CvdState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  // Synchronize state with URL search query params
  useUrlParamsState(state, setState);

  const recipeSelectId = useId();
  const tempId = useId();
  const pressureId = useId();
  const moleFracId = useId();
  const velocityId = useId();
  const waferPosId = useId();
  const channelHeightId = useId();
  const susceptorLenId = useId();

  const update = <K extends keyof CvdState>(key: K, value: CvdState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleRecipeChange = (recipeId: CvdProcessId) => {
    const preset = CVD_RECIPES[recipeId];
    if (!preset) return;
    setState((prev) => ({
      ...prev,
      recipeId,
      tempCelsius: preset.defaultTempC,
      pressureTorr: preset.defaultPressureTorr,
      reactantMoleFraction: preset.defaultMoleFraction,
      customEaEv: String(preset.activationEnergyEv),
      customKs0: String(preset.preExponentialKs0),
    }));
  };

  const currentRecipe = CVD_RECIPES[state.recipeId] ?? CVD_RECIPES['si-sih4'];

  const result = useMemo(() => {
    const customEa = Number(state.customEaEv);
    const customKs = Number(state.customKs0);

    return calculateCvdKinetics({
      recipeId: state.recipeId,
      tempCelsius: Number(state.tempCelsius),
      pressureTorr: Number(state.pressureTorr),
      reactantMoleFraction: Number(state.reactantMoleFraction),
      gasVelocityCmPerS: Number(state.gasVelocityCmPerS),
      waferPositionXCm: Number(state.waferPositionXCm),
      channelHeightCm: Number(state.channelHeightCm),
      susceptorLengthCm: Number(state.susceptorLengthCm),
      customActivationEnergyEv: Number.isFinite(customEa) && customEa > 0 ? customEa : undefined,
      customKs0: Number.isFinite(customKs) && customKs > 0 ? customKs : undefined,
    });
  }, [state]);

  const copySummary = async () => {
    if (!result.ok) return;
    const text = [
      `CVD & Epitaxy Kinetics: ${currentRecipe.name}`,
      `Temperature: ${state.tempCelsius} °C (${fmt(result.tempKelvin, 1)} K)`,
      `Pressure: ${state.pressureTorr} Torr | Precursor Fraction: ${(state.reactantMoleFraction * 100).toFixed(2)}%`,
      `Regime: ${result.regime.toUpperCase()}`,
      `Growth Rate: ${fmt(result.growthRateNmPerMin, 2)} nm/min (${fmt(result.growthRateUmPerHour, 3)} μm/h)`,
      `Boundary Layer Thickness δ: ${fmt(result.boundaryLayerThicknessDeltaMm, 2)} mm`,
      `Mass Transfer Coeff (hg): ${result.massTransferCoefficientHg.toExponential(3)} cm/s`,
      `Surface Reaction Rate (ks): ${result.surfaceReactionRateKs.toExponential(3)} cm/s`,
      result.transitionTemperatureCelsius !== null
        ? `Transition Temperature (ks = hg): ${fmt(result.transitionTemperatureCelsius, 1)} °C`
        : '',
      `Reactor Uniformity: ${fmt(result.reactorUniformityPercent, 1)}%`,
      `Link: ${window.location.href}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleExportDepletionCsv = () => {
    if (!result.ok || result.depletionProfile.length === 0) return;
    const headers = ['Position x (cm)', 'Concentration Cg (cm^-3)', 'Growth Rate (nm/min)', 'Depletion Loss (%)'];
    const rows = result.depletionProfile.map((pt) => [
      pt.positionCm,
      pt.concentrationCm3.toExponential(4),
      pt.growthRateNmPerMin,
      pt.fractionalLossPercent,
    ]);
    downloadCsv(`cvd_depletion_profile_${state.recipeId}`, headers, rows);
  };

  const handleExportArrheniusCsv = () => {
    if (!result.ok || result.arrheniusCurve.length === 0) return;
    const headers = ['Temperature (°C)', '1000/T (K^-1)', 'Growth Rate (nm/min)', 'log10(Growth Rate)', 'Regime'];
    const rows = result.arrheniusCurve.map((pt) => [
      pt.tempCelsius,
      pt.invTempK1000,
      pt.growthRateNmPerMin,
      pt.logGrowthRate,
      pt.regime,
    ]);
    downloadCsv(`cvd_arrhenius_curve_${state.recipeId}`, headers, rows);
  };

  // Depletion profile SVG chart parameters
  const svgW = 600;
  const svgH = 220;
  const pad = { top: 20, right: 30, bottom: 40, left: 60 };
  const pW = svgW - pad.left - pad.right;
  const pH = svgH - pad.top - pad.bottom;

  const chartData = useMemo(() => {
    if (!result.ok || result.depletionProfile.length === 0) return null;
    const pts = result.depletionProfile;
    const maxX = Math.max(...pts.map((p) => p.positionCm), 1);
    const maxY = Math.max(...pts.map((p) => p.growthRateNmPerMin), 1) * 1.1;

    const coords = pts.map((p) => {
      const x = pad.left + (p.positionCm / maxX) * pW;
      const y = pad.top + pH - (p.growthRateNmPerMin / maxY) * pH;
      return { x, y, ...p };
    });

    const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${(pad.left + pW).toFixed(1)} ${(pad.top + pH).toFixed(1)} L ${pad.left.toFixed(1)} ${(pad.top + pH).toFixed(1)} Z`;

    const waferX = pad.left + (Math.min(state.waferPositionXCm, maxX) / maxX) * pW;

    return { maxX, maxY, coords, pathD, areaD, waferX };
  }, [result, state.waferPositionXCm]);

  return (
    <div className="calculator-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Parameter Inputs Panel */}
      <section className="panel" aria-labelledby="cvd-params">
        <h2 id="cvd-params">CVD & Epitaxy Process Parameters</h2>

        <div className="field">
          <label htmlFor={recipeSelectId}>Precursor & Process Chemistry Preset</label>
          <select
            id={recipeSelectId}
            value={state.recipeId}
            onChange={(e) => handleRecipeChange(e.target.value as CvdProcessId)}
          >
            {Object.values(CVD_RECIPES).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.filmMaterial})
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
            {currentRecipe.description}
          </span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={tempId}>
              Process Temperature (T) <span className="unit">°C</span>
            </label>
            <input
              id={tempId}
              type="number"
              min={100}
              max={1500}
              step={10}
              value={state.tempCelsius}
              onChange={(e) => update('tempCelsius', Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor={pressureId}>
              Chamber Total Pressure (P) <span className="unit">Torr</span>
            </label>
            <input
              id={pressureId}
              type="number"
              min={0.001}
              step="any"
              value={state.pressureTorr}
              onChange={(e) => update('pressureTorr', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={moleFracId}>
              Reactant Mole Fraction (y_i) <span className="unit">%</span>
            </label>
            <input
              id={moleFracId}
              type="number"
              min={0.0001}
              max={100}
              step="any"
              value={state.reactantMoleFraction * 100}
              onChange={(e) => update('reactantMoleFraction', Math.max(0.000001, Number(e.target.value) / 100))}
            />
          </div>

          <div className="field">
            <label htmlFor={velocityId}>
              Carrier Gas Velocity (U) <span className="unit">cm/s</span>
            </label>
            <input
              id={velocityId}
              type="number"
              min={0.1}
              step={5}
              value={state.gasVelocityCmPerS}
              onChange={(e) => update('gasVelocityCmPerS', Math.max(0.1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={waferPosId}>
              Wafer Position Along Susceptor (x) <span className="unit">cm</span>
            </label>
            <input
              id={waferPosId}
              type="number"
              min={0.5}
              step={1}
              value={state.waferPositionXCm}
              onChange={(e) => update('waferPositionXCm', Math.max(0.1, Number(e.target.value)))}
            />
          </div>

          <div className="field">
            <label htmlFor={channelHeightId}>
              Reactor Channel Height (b) <span className="unit">cm</span>
            </label>
            <input
              id={channelHeightId}
              type="number"
              min={0.5}
              step={0.5}
              value={state.channelHeightCm}
              onChange={(e) => update('channelHeightCm', Math.max(0.2, Number(e.target.value)))}
            />
          </div>

          <div className="field">
            <label htmlFor={susceptorLenId}>
              Susceptor Total Length (L) <span className="unit">cm</span>
            </label>
            <input
              id={susceptorLenId}
              type="number"
              min={5}
              step={5}
              value={state.susceptorLengthCm}
              onChange={(e) => update('susceptorLengthCm', Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="action-row" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL_STATE)}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>
          <button type="button" className="button" onClick={copySummary} disabled={!result.ok}>
            <Copy size={14} aria-hidden="true" />
            <span>{copied ? 'Copied Link & Summary!' : 'Copy Summary'}</span>
          </button>
        </div>
      </section>

      {/* Results Panel */}
      <section className="panel" aria-labelledby="cvd-results">
        <h2 id="cvd-results">Growth Kinetics & Regime Analysis</h2>

        {!result.ok ? (
          <div className="notice warning" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{result.errorMessage || 'Invalid calculation parameters.'}</span>
          </div>
        ) : (
          <>
            {/* Hero Card */}
            <div
              className="result-hero"
              style={{
                marginBottom: 20,
                borderLeft: `4px solid ${
                  result.regime === 'surface-reaction-limited'
                    ? '#e06c75'
                    : result.regime === 'mass-transport-limited'
                    ? '#61afef'
                    : '#e5c07b'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span className="result-label">Predicted Deposition / Growth Rate</span>
                  <span className="result-value">
                    {fmt(result.growthRateNmPerMin, 2)}
                    <span className="result-suffix"> nm/min</span>
                  </span>
                  <span className="result-subtext" style={{ display: 'block', marginTop: 4 }}>
                    ≈ {fmt(result.growthRateUmPerHour, 3)} μm/hour | Material: {currentRecipe.filmMaterial}
                  </span>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background:
                      result.regime === 'surface-reaction-limited'
                        ? 'rgba(224, 108, 117, 0.12)'
                        : result.regime === 'mass-transport-limited'
                        ? 'rgba(97, 175, 239, 0.12)'
                        : 'rgba(229, 192, 123, 0.12)',
                    color:
                      result.regime === 'surface-reaction-limited'
                        ? '#d13b48'
                        : result.regime === 'mass-transport-limited'
                        ? '#2b7ec9'
                        : '#b58900',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textAlign: 'right',
                  }}
                >
                  <div>
                    {result.regime === 'surface-reaction-limited'
                      ? '⚙️ Surface Reaction Controlled'
                      : result.regime === 'mass-transport-limited'
                      ? '🌊 Mass-Transport (Diffusion) Controlled'
                      : '⚖️ Mixed Transition Regime'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 'normal', marginTop: 2 }}>
                    ks / hg ratio = {(result.surfaceReactionRateKs / result.massTransferCoefficientHg).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Boundary Layer Thickness (δ)</span>
                <span className="metric-value">{fmt(result.boundaryLayerThicknessDeltaMm, 2)}</span>
                <span className="metric-unit">mm at x = {state.waferPositionXCm} cm</span>
              </div>

              <div className="metric">
                <span className="metric-label">Mass-Transfer Coeff (h_g)</span>
                <span className="metric-value">{result.massTransferCoefficientHg.toExponential(3)}</span>
                <span className="metric-unit">cm / s (gas-phase transport)</span>
              </div>

              <div className="metric">
                <span className="metric-label">Surface Reaction Rate (k_s)</span>
                <span className="metric-value">{result.surfaceReactionRateKs.toExponential(3)}</span>
                <span className="metric-unit">cm / s (Arrhenius surface kinetics)</span>
              </div>

              <div className="metric">
                <span className="metric-label">Transition Temperature (T_trans)</span>
                <span className="metric-value">
                  {result.transitionTemperatureCelsius !== null ? `${fmt(result.transitionTemperatureCelsius, 1)}` : '—'}
                </span>
                <span className="metric-unit">°C (where k_s = h_g)</span>
              </div>

              <div className="metric">
                <span className="metric-label">Gas Diffusivity (D_g)</span>
                <span className="metric-value">{fmt(result.diffusivityDg, 2)}</span>
                <span className="metric-unit">cm² / s at {state.tempCelsius} °C</span>
              </div>

              <div className="metric">
                <span className="metric-label">Susceptor Uniformity</span>
                <span className="metric-value">{fmt(result.reactorUniformityPercent, 1)}</span>
                <span className="metric-unit">% along channel length</span>
              </div>
            </div>

            {/* Depletion Profile SVG Chart */}
            {chartData && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Reactant Depletion & Growth Rate along Susceptor (0 to {chartData.maxX} cm)
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="button secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={handleExportDepletionCsv}>
                      <Download size={13} aria-hidden="true" />
                      <span>Export Depletion CSV</span>
                    </button>
                    <button type="button" className="button secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={handleExportArrheniusCsv}>
                      <Download size={13} aria-hidden="true" />
                      <span>Export Arrhenius CSV</span>
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Horizontal Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const y = pad.top + pH * (1 - f);
                      const rateVal = chartData.maxY * f;
                      return (
                        <g key={f}>
                          <line x1={pad.left} y1={y} x2={pad.left + pW} y2={y} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                          <text x={pad.left - 8} y={y + 4} fontSize="9" fill="var(--text-dim)" textAnchor="end" fontFamily="var(--font-mono)">
                            {rateVal.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Vertical Grid for X */}
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const x = pad.left + pW * f;
                      const xCm = chartData.maxX * f;
                      return (
                        <g key={f}>
                          <line x1={x} y1={pad.top} x2={x} y2={pad.top + pH} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                          <text x={x} y={pad.top + pH + 16} fontSize="9" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-mono)">
                            {xCm.toFixed(0)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area under curve */}
                    <path d={chartData.areaD} fill="rgba(33, 150, 243, 0.12)" />

                    {/* Depletion Curve Line */}
                    <path d={chartData.pathD} fill="none" stroke="var(--teal)" strokeWidth="2.5" />

                    {/* Current Wafer Position Line */}
                    <line
                      x1={chartData.waferX}
                      y1={pad.top}
                      x2={chartData.waferX}
                      y2={pad.top + pH}
                      stroke="#e06c75"
                      strokeWidth="1.8"
                      strokeDasharray="4 3"
                    />
                    <text x={chartData.waferX + 5} y={pad.top + 16} fontSize="9" fill="#e06c75" fontWeight="600">
                      Wafer (x = {state.waferPositionXCm} cm)
                    </text>

                    {/* Axis labels */}
                    <text x={pad.left + pW / 2} y={pad.top + pH + 34} fontSize="10" fill="var(--text-dim)" textAnchor="middle">
                      Susceptor Distance x (cm)
                    </text>
                    <text
                      x={14}
                      y={pad.top + pH / 2}
                      fontSize="10"
                      fill="var(--text-dim)"
                      textAnchor="middle"
                      transform={`rotate(-90, 14, ${pad.top + pH / 2})`}
                    >
                      Growth Rate (nm/min)
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* Engineering Principles */}
            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 6,
                background: 'var(--surface-sunken)',
                borderLeft: '4px solid var(--teal)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={15} />
                <span>CVD Transport & Surface Reaction Regimes:</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                {result.regime === 'surface-reaction-limited' ? (
                  <>
                    <strong>Surface Reaction Controlled Regime (T &lt; T_trans)</strong>: Deposition rate is dictated by Arrhenius surface chemical kinetics (k_s &lt;&lt; h_g). Growth rate exhibits strong exponential temperature sensitivity. Excellent step coverage and batch uniformity across wafers can be achieved by tight furnace temperature control.
                  </>
                ) : result.regime === 'mass-transport-limited' ? (
                  <>
                    <strong>Mass-Transport Controlled Regime (T &gt; T_trans)</strong>: Precursor molecules diffuse slowly through the stagnant gas boundary layer δ(x) relative to instantaneous surface consumption (h_g &lt;&lt; k_s). Growth rate is nearly independent of temperature, but highly sensitive to gas velocity U, flow patterns, and susceptor tilt to counteract reactant depletion.
                  </>
                ) : (
                  <>
                    <strong>Mixed Transition Regime</strong>: Both boundary-layer mass transfer h_g and surface reaction velocity k_s contribute comparably to the net growth rate: v = (C_g / N_1) · [h_g · k_s / (h_g + k_s)].
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
