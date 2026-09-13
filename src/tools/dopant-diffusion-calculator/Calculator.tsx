'use client';

import { useMemo, useRef, useState } from 'react';
import { Copy, RotateCcw, Download, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import {
  SILICON_DOPANTS,
  type DopantSpecies,
  getDiffusionCoefficient,
  getSolidSolubility,
  calculatePredeposition,
  calculateDriveIn,
  calculateMinimumOxideMaskThickness,
  erfc,
} from '@/lib/dopant-diffusion';
import { downloadCsv, downloadSvg, downloadXlsx } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  dopant: 'B' as DopantSpecies,
  processType: 'predeposition', // 'predeposition' | 'drive-in'
  tempCelsius: 1000,
  timeMinutes: 60,
  useSolidSolubility: true,
  customCsCm3: '1e20',
  doseQCm2: '1e15', // for drive-in
  backgroundDopingCm3: '1e16',
};

export default function DopantDiffusionCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useUrlParamsState(state, setState);

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const dopantInfo = SILICON_DOPANTS[state.dopant];

  const solidSolubility = useMemo(() => {
    return getSolidSolubility(state.dopant, state.tempCelsius);
  }, [state.dopant, state.tempCelsius]);

  const D_Si = useMemo(() => {
    return getDiffusionCoefficient(state.dopant, state.tempCelsius, 'Si');
  }, [state.dopant, state.tempCelsius]);

  const timeSeconds = state.timeMinutes * 60;

  const predepResult = useMemo(() => {
    if (state.processType !== 'predeposition') return null;
    const cs = state.useSolidSolubility
      ? solidSolubility
      : Number.parseFloat(state.customCsCm3) || 1e20;
    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;

    try {
      return calculatePredeposition({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
        surfaceConcentrationCm3: cs,
        backgroundConcentrationCm3: cb,
      });
    } catch {
      return null;
    }
  }, [state, solidSolubility, timeSeconds]);

  const driveInResult = useMemo(() => {
    if (state.processType !== 'drive-in') return null;
    const Q = Number.parseFloat(state.doseQCm2) || 1e15;
    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;

    try {
      return calculateDriveIn({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
        doseCm2: Q,
        backgroundConcentrationCm3: cb,
      });
    } catch {
      return null;
    }
  }, [state, timeSeconds]);

  const oxideMask = useMemo(() => {
    try {
      return calculateMinimumOxideMaskThickness({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
      });
    } catch {
      return null;
    }
  }, [state.dopant, state.tempCelsius, timeSeconds]);
  const chartData = useMemo(() => {
    const isPredep = state.processType === 'predeposition';
    const active = isPredep ? predepResult : driveInResult;
    if (!active) return null;

    const cb = Math.max(1e12, Number.parseFloat(state.backgroundDopingCm3) || 1e16);
    const cs = active.surfaceConcentrationCm3;
    const xj = active.junctionDepthUm;
    const diffLen = active.characteristicLengthUm * 2;

    const maxX = xj !== undefined && Number.isFinite(xj)
      ? Math.max(xj * 1.5, diffLen * 2.5, 0.05)
      : Math.max(diffLen * 3, 0.1);

    const sampleCount = 101;
    const points: Array<{ depthUm: number; concentrationCm3: number }> = [];
    const dtProductCm2 = D_Si * timeSeconds;
    const sqrtDtCm = Math.sqrt(dtProductCm2);
    const twoSqrtDtCm = 2 * sqrtDtCm;

    for (let i = 0; i < sampleCount; i++) {
      const xUm = (i / (sampleCount - 1)) * maxX;
      const xCm = xUm * 1e-4;
      let c: number;
      if (isPredep) {
        c = cs * erfc(xCm / twoSqrtDtCm);
      } else {
        const exponent = -(xCm * xCm) / (4 * dtProductCm2);
        c = cs * Math.exp(exponent);
      }
      points.push({ depthUm: xUm, concentrationCm3: Math.max(1e10, c) });
    }

    const logCb = Math.log10(cb);
    const logCs = Math.log10(Math.max(1e14, cs));
    const minLog = Math.floor(Math.min(logCb, 15) - 1);
    const maxLog = Math.ceil(logCs);
    const logSpan = Math.max(2, maxLog - minLog);

    const svgW = 560;
    const svgH = 260;
    const pad = { top: 24, right: 36, bottom: 44, left: 66 };
    const pW = svgW - pad.left - pad.right;
    const pH = svgH - pad.top - pad.bottom;

    const scaleX = (xUm: number) => pad.left + (xUm / maxX) * pW;
    const scaleY = (conc: number) => {
      const logVal = Math.log10(Math.max(1e10, conc));
      const clamped = Math.max(minLog, Math.min(maxLog, logVal));
      const fraction = (clamped - minLog) / logSpan;
      return pad.top + pH * (1 - fraction);
    };

    const pathD = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.depthUm).toFixed(1)} ${scaleY(pt.concentrationCm3).toFixed(1)}`)
      .join(' ');

    const areaD = `${pathD} L ${scaleX(maxX).toFixed(1)} ${(pad.top + pH).toFixed(1)} L ${scaleX(0).toFixed(1)} ${(pad.top + pH).toFixed(1)} Z`;

    const cbY = scaleY(cb);
    const xjX = xj !== undefined && xj <= maxX ? scaleX(xj) : null;

    const decades: number[] = [];
    for (let d = minLog; d <= maxLog; d++) {
      decades.push(d);
    }

    return {
      points,
      maxX,
      minLog,
      maxLog,
      logSpan,
      svgW,
      svgH,
      pad,
      pW,
      pH,
      scaleX,
      scaleY,
      pathD,
      areaD,
      cbY,
      xjX,
      decades,
      xj,
      cb,
      cs,
    };
  }, [state, predepResult, driveInResult, D_Si, timeSeconds]);

  const buildProfileExportRows = () => {
    const isPredep = state.processType === 'predeposition';
    const active = isPredep ? predepResult : driveInResult;
    if (!active || !chartData) return null;

    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;
    const headers = [
      'Depth (um)',
      'Depth (nm)',
      'Concentration (cm^-3)',
      'Normalized Concentration (C/Cs)',
      'Ratio to Substrate (C/CB)',
    ];
    const rows = chartData.points.map((p) => [
      p.depthUm.toFixed(4),
      (p.depthUm * 1000).toFixed(1),
      p.concentrationCm3.toExponential(4),
      (p.concentrationCm3 / active.surfaceConcentrationCm3).toExponential(4),
      (p.concentrationCm3 / cb).toFixed(3),
    ]);
    return { headers, rows };
  };

  const handleExportProfileCsv = () => {
    const data = buildProfileExportRows();
    if (!data) return;
    downloadCsv(
      `dopant_profile_${state.dopant}_${state.processType}_${state.tempCelsius}C_${state.timeMinutes}min`,
      data.headers,
      data.rows
    );
  };

  const handleExportProfileXlsx = async () => {
    const data = buildProfileExportRows();
    if (!data) return;
    await downloadXlsx(
      `dopant_profile_${state.dopant}_${state.processType}_${state.tempCelsius}C_${state.timeMinutes}min.xlsx`,
      'Dopant Profile',
      data.headers,
      data.rows
    );
  };

  const handleExportProfileSvg = () => {
    if (svgRef.current) {
      downloadSvg(
        svgRef.current,
        `dopant_profile_${state.dopant}_${state.processType}_${state.tempCelsius}C`
      );
    }
  };

  const physicsWarnings = useMemo(() => {
    const warnings: { level: 'danger' | 'warning'; title: string; message: string }[] = [];
    const cs = state.processType === 'predeposition'
      ? (state.useSolidSolubility ? solidSolubility : Number.parseFloat(state.customCsCm3) || 1e20)
      : (driveInResult?.surfaceConcentrationCm3 ?? 0);
    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;

    if (state.tempCelsius >= 1414) {
      warnings.push({
        level: 'danger',
        title: 'Exceeds Silicon Melting Point (1414 °C)',
        message: 'Pure silicon melts at 1414 °C. At this temperature, the wafer will melt and destroy the furnace chamber.',
      });
    } else if (state.tempCelsius > 1250) {
      warnings.push({
        level: 'warning',
        title: 'High Thermal Stress & Slip Dislocation Risk (> 1250 °C)',
        message: 'Prolonged exposure above 1250 °C induces severe crystal plastic deformation, wafer warpage, and slip lines along {111} planes.',
      });
    }

    if (state.processType === 'predeposition' && !state.useSolidSolubility && cs > solidSolubility * 1.05) {
      warnings.push({
        level: 'warning',
        title: 'Exceeds Solid Solubility Limit',
        message: `Surface concentration (${cs.toExponential(2)} cm⁻³) exceeds equilibrium solid solubility (${solidSolubility.toExponential(2)} cm⁻³ at ${state.tempCelsius} °C). Excess dopant forms inactive precipitates and dislocation loops.`,
      });
    }

    if (cs > 0 && cs <= cb) {
      warnings.push({
        level: 'danger',
        title: 'No Metallurgical Junction Formed (Cs ≤ C_sub)',
        message: 'Surface dopant concentration is less than or equal to substrate background doping. A p-n junction cannot be formed.',
      });
    }

    return warnings;
  }, [state, solidSolubility, driveInResult]);

  const copyResult = async () => {
    const isPredep = state.processType === 'predeposition';
    const active = isPredep ? predepResult : driveInResult;
    if (!active) return;

    const summary = [
      `Dopant: ${dopantInfo.name} (${dopantInfo.symbol}, ${dopantInfo.dopantType})`,
      `Process Regime: ${isPredep ? 'Constant Source (Predeposition / erfc)' : 'Limited Source (Drive-in / Gaussian)'}`,
      `Diffusion Temperature: ${state.tempCelsius} °C`,
      `Diffusion Time: ${state.timeMinutes} min (${timeSeconds} s)`,
      `Diffusion Coefficient D(Si): ${D_Si.toExponential(4)} cm²/s`,
      `Diffusion Length 2√(Dt): ${(active.characteristicLengthUm * 2).toFixed(4)} μm (${(active.characteristicLengthUm * 2000).toFixed(1)} nm)`,
      isPredep
        ? `Surface Concentration Cs: ${predepResult?.surfaceConcentrationCm3.toExponential(3)} cm⁻³`
        : `Surface Concentration Cs: ${driveInResult?.surfaceConcentrationCm3.toExponential(3)} cm⁻³`,
      isPredep
        ? `Incorporated Dose Q: ${predepResult?.doseQ.toExponential(3)} atoms/cm²`
        : `Initial Dose Q: ${driveInResult?.doseQ.toExponential(3)} atoms/cm²`,
      `Background Doping C_sub: ${Number.parseFloat(state.backgroundDopingCm3).toExponential(3)} cm⁻³`,
      `Metallurgical Junction Depth (xj): ${active.junctionDepthUm ? active.junctionDepthUm.toFixed(4) + ' μm (' + (active.junctionDepthUm * 1000).toFixed(1) + ' nm)' : 'N/A (Cs <= C_sub)'}`,
      oxideMask ? `Minimum SiO2 Masking Oxide: ${oxideMask.minThickness3xNm.toFixed(1)} nm (conservative 4x: ${oxideMask.minThickness4xNm.toFixed(1)} nm)` : '',
    ].filter(Boolean).join('\n');

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
      <section className="panel" aria-labelledby="dopant-inputs">
        <h2 id="dopant-inputs">Thermal Diffusion Parameters</h2>

        <div className="field">
          <label>Process Profile Model</label>
          <div className="segmented-control" role="group" aria-label="Process type">
            <button
              type="button"
              className={state.processType === 'predeposition' ? 'active' : ''}
              onClick={() => update('processType', 'predeposition')}
            >
              Predeposition (erfc)
            </button>
            <button
              type="button"
              className={state.processType === 'drive-in' ? 'active' : ''}
              onClick={() => update('processType', 'drive-in')}
            >
              Drive-in (Gaussian)
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="dopant-select">Dopant Species</label>
            <select
              id="dopant-select"
              value={state.dopant}
              onChange={(e) => update('dopant', e.target.value as DopantSpecies)}
            >
              <option value="B">Boron (B) — p-type (Acceptor)</option>
              <option value="P">Phosphorus (P) — n-type (Donor)</option>
              <option value="As">Arsenic (As) — n-type (Donor)</option>
              <option value="Sb">Antimony (Sb) — n-type (Donor)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="temp-c">Temperature (°C)</label>
            <input
              id="temp-c"
              type="number"
              min={700}
              max={1300}
              step={10}
              value={state.tempCelsius}
              onChange={(e) => update('tempCelsius', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="time-min">Furnace Time (min)</label>
            <input
              id="time-min"
              type="number"
              min={1}
              step={5}
              value={state.timeMinutes}
              onChange={(e) => update('timeMinutes', Math.max(0.1, Number(e.target.value)))}
            />
          </div>

          <div className="field">
            <label htmlFor="cb-sub">Substrate Doping C_B (cm⁻³)</label>
            <input
              id="cb-sub"
              type="text"
              value={state.backgroundDopingCm3}
              onChange={(e) => update('backgroundDopingCm3', e.target.value)}
              placeholder="e.g. 1e16"
            />
          </div>
        </div>

        {state.processType === 'predeposition' ? (
          <div className="field">
            <label>Surface Concentration (Cs)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  checked={state.useSolidSolubility}
                  onChange={() => update('useSolidSolubility', true)}
                />
                Solid Solubility Limit ({solidSolubility.toExponential(2)} cm⁻³)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  checked={!state.useSolidSolubility}
                  onChange={() => update('useSolidSolubility', false)}
                />
                Custom Cs
              </label>
            </div>
            {!state.useSolidSolubility && (
              <input
                type="text"
                value={state.customCsCm3}
                onChange={(e) => update('customCsCm3', e.target.value)}
                placeholder="e.g. 5e19"
              />
            )}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="dose-q">Predeposition / Implantation Dose Q (atoms/cm²)</label>
            <input
              id="dose-q"
              type="text"
              value={state.doseQCm2}
              onChange={(e) => update('doseQCm2', e.target.value)}
              placeholder="e.g. 1e15"
            />
          </div>
        )}

        <div className="action-row" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>
          <button type="button" className="button" onClick={copyResult}>
            <Copy size={14} aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy Results'}</span>
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="dopant-results">
        <h2 id="dopant-results">Junction Depth & Doping Profile</h2>

        {physicsWarnings.map((w, idx) => (
          <div key={idx} className={`physics-alert ${w.level === 'danger' ? 'danger' : ''}`} role="alert">
            <AlertTriangle size={16} className="physics-alert-icon" />
            <div className="physics-alert-content">
              <strong>{w.title}:</strong> {w.message}
            </div>
          </div>
        ))}

        {(() => {
          const isPredep = state.processType === 'predeposition';
          const active = isPredep ? predepResult : driveInResult;

          if (!active) {
            return <div className="notice warning">Invalid diffusion conditions. Check substrate and surface concentrations.</div>;
          }

          const xjUm = active.junctionDepthUm;
          const xjNm = active.junctionDepthNm;

          return (
            <>
              <div className="result-hero" style={{ marginBottom: 16 }}>
                <span className="result-label">Metallurgical Junction Depth (x_j)</span>
                <span className="result-value">
                  {xjUm !== undefined ? fmt(xjUm, 4) : 'N/A'}
                  <span className="result-suffix"> μm</span>
                </span>
                <span className="result-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  {xjNm !== undefined ? `= ${fmt(xjNm, 1)} nm at background doping C(x_j) = C_B` : 'C_s does not exceed background doping C_B'}
                </span>
              </div>

              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">Diffusion Coefficient D</span>
                  <span className="metric-value">{D_Si.toExponential(3)}</span>
                  <span className="metric-unit">cm² / s in Si</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Diffusion Length 2√(Dt)</span>
                  <span className="metric-value">{fmt(active.characteristicLengthUm * 2, 4)}</span>
                  <span className="metric-unit">μm ({fmt(active.characteristicLengthUm * 2000, 1)} nm)</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Surface Concentration C_s</span>
                  <span className="metric-value">{active.surfaceConcentrationCm3.toExponential(3)}</span>
                  <span className="metric-unit">cm⁻³</span>
                </div>

                <div className="metric">
                  <span className="metric-label">{isPredep ? 'Incorporated Dose Q' : 'Dopant Dose Q'}</span>
                  <span className="metric-value">
                    {isPredep ? predepResult?.doseQ.toExponential(3) : driveInResult?.doseQ.toExponential(3)}
                  </span>
                  <span className="metric-unit">atoms / cm²</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Solid Solubility Limit</span>
                  <span className="metric-value">{solidSolubility.toExponential(3)}</span>
                  <span className="metric-unit">cm⁻³ at {state.tempCelsius} °C</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Thermal Budget D·t</span>
                  <span className="metric-value">{(D_Si * timeSeconds).toExponential(3)}</span>
                  <span className="metric-unit">cm²</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Min. SiO₂ Mask (3x)</span>
                  <span className="metric-value">{oxideMask ? fmt(oxideMask.minThickness3xNm, 1) : '—'}</span>
                  <span className="metric-unit">nm (3√(D_ox·t))</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Safe SiO₂ Mask (4x)</span>
                  <span className="metric-value">{oxideMask ? fmt(oxideMask.minThickness4xNm, 1) : '—'}</span>
                  <span className="metric-unit">nm (4√(D_ox·t))</span>
                </div>
              </div>
              {/* Concentration Profile SVG Chart */}
              {chartData && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      Dopant Concentration vs. Depth Profile C(x) (0 to {chartData.maxX >= 1 ? chartData.maxX.toFixed(2) : chartData.maxX.toFixed(3)} μm)
                    </span>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={handleExportProfileCsv}
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={handleExportProfileXlsx}
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>Export XLSX</span>
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={handleExportProfileSvg}
                    >
                      <ImageIcon size={13} aria-hidden="true" />
                      <span>Save SVG</span>
                    </button>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                    <svg ref={svgRef} viewBox={`0 0 ${chartData.svgW} ${chartData.svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                      {/* Horizontal Decade Grid Lines */}
                      {chartData.decades.map((d) => {
                        const y = chartData.scaleY(Math.pow(10, d));
                        return (
                          <g key={d}>
                            <line
                              x1={chartData.pad.left}
                              y1={y}
                              x2={chartData.pad.left + chartData.pW}
                              y2={y}
                              stroke="var(--border)"
                              strokeDasharray="3 3"
                              opacity={0.6}
                            />
                            <text
                              x={chartData.pad.left - 8}
                              y={y + 3}
                              fontSize="9"
                              fill="var(--text-dim)"
                              textAnchor="end"
                              fontFamily="var(--font-mono)"
                            >
                              10<tspan dy="-3" fontSize="7">{d}</tspan>
                            </text>
                          </g>
                        );
                      })}

                      {/* Vertical Depth Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                        const x = chartData.pad.left + chartData.pW * f;
                        const depthUm = chartData.maxX * f;
                        return (
                          <g key={f}>
                            <line
                              x1={x}
                              y1={chartData.pad.top}
                              x2={x}
                              y2={chartData.pad.top + chartData.pH}
                              stroke="var(--border)"
                              strokeDasharray="3 3"
                              opacity={0.6}
                            />
                            <text
                              x={x}
                              y={chartData.pad.top + chartData.pH + 16}
                              fontSize="9"
                              fill="var(--text-dim)"
                              textAnchor="middle"
                              fontFamily="var(--font-mono)"
                            >
                              {depthUm >= 1 ? depthUm.toFixed(2) : depthUm.toFixed(3)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area under curve */}
                      <path d={chartData.areaD} fill="rgba(32, 178, 170, 0.12)" />

                      {/* Background Doping CB Line */}
                      <line
                        x1={chartData.pad.left}
                        y1={chartData.cbY}
                        x2={chartData.pad.left + chartData.pW}
                        y2={chartData.cbY}
                        stroke="#d19a66"
                        strokeWidth="1.6"
                        strokeDasharray="4 3"
                      />
                      <text
                        x={chartData.pad.left + chartData.pW - 6}
                        y={chartData.cbY - 5}
                        fontSize="9"
                        fill="#d19a66"
                        textAnchor="end"
                        fontWeight="500"
                      >
                        Substrate C_B = {chartData.cb.toExponential(1)} cm⁻³
                      </text>

                      {/* Junction Depth xj Line and Marker */}
                      {chartData.xjX !== null && chartData.xj !== undefined && (
                        <g>
                          <line
                            x1={chartData.xjX}
                            y1={chartData.pad.top}
                            x2={chartData.xjX}
                            y2={chartData.pad.top + chartData.pH}
                            stroke="#e06c75"
                            strokeWidth="1.6"
                            strokeDasharray="4 3"
                          />
                          <circle
                            cx={chartData.xjX}
                            cy={chartData.cbY}
                            r="4.5"
                            fill="#e06c75"
                            stroke="var(--surface-sunken)"
                            strokeWidth="1.5"
                          />
                          <text
                            x={chartData.xjX + 6}
                            y={chartData.pad.top + 14}
                            fontSize="9"
                            fill="#e06c75"
                            fontWeight="600"
                          >
                            x_j = {chartData.xj.toFixed(3)} μm ({(chartData.xj * 1000).toFixed(0)} nm)
                          </text>
                        </g>
                      )}

                      {/* Profile Curve Line */}
                      <path d={chartData.pathD} fill="none" stroke="var(--teal)" strokeWidth="2.5" />

                      {/* Surface Concentration Point */}
                      <circle
                        cx={chartData.pad.left}
                        cy={chartData.scaleY(chartData.cs)}
                        r="4"
                        fill="var(--teal)"
                        stroke="var(--surface-sunken)"
                        strokeWidth="1.5"
                      />
                      <text
                        x={chartData.pad.left + 8}
                        y={chartData.scaleY(chartData.cs) + 12}
                        fontSize="9"
                        fill="var(--teal)"
                        fontWeight="600"
                      >
                        C_s = {chartData.cs.toExponential(2)}
                      </text>

                      {/* Axis Labels */}
                      <text
                        x={chartData.pad.left + chartData.pW / 2}
                        y={chartData.pad.top + chartData.pH + 34}
                        fontSize="10"
                        fill="var(--text-dim)"
                        textAnchor="middle"
                      >
                        Depth into Silicon Substrate (μm)
                      </text>
                      <text
                        transform="rotate(-90)"
                        x={-(chartData.pad.top + chartData.pH / 2)}
                        y={18}
                        fontSize="10"
                        fill="var(--text-dim)"
                        textAnchor="middle"
                      >
                        Concentration (cm⁻³, log₁₀)
                      </text>
                    </svg>
                  </div>
                </div>
              )}

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
                  Profile Description:
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  {isPredep ? (
                    <>
                      <strong>Constant Source (Complementary Error Function erfc)</strong>: Constant dopant flux from gaseous source (e.g. BBr₃, POCl₃, or spin-on dopant) maintains surface saturation at {active.surfaceConcentrationCm3.toExponential(2)} cm⁻³.
                    </>
                  ) : (
                    <>
                      <strong>Limited Source (Gaussian Distribution)</strong>: Finite fixed dopant dose Q is redistributed into the silicon bulk during high-temperature drive-in annealing, dropping surface concentration Cs over time.
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </section>
    </div>
  );
}
