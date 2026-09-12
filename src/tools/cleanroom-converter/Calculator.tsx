'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateCleanroomAirflow,
  type DimensionUnit,
  type FfuSize,
  type IsoClassNumber,
  ISO_CLASSES_INFO,
  FFU_CONFIGS,
} from '@/lib/cleanroom';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';

const INITIAL = {
  isoClass: 5 as IsoClassNumber,
  length: '10',
  width: '6',
  height: '3',
  dimensionUnit: 'm' as DimensionUnit,
  ach: '300',
  ffuSize: '2x4' as FfuSize,
};

const ISO_OPTIONS: { iso: IsoClassNumber; label: string }[] = [
  { iso: 1, label: 'ISO Class 1 (Extreme EUV Litho Core)' },
  { iso: 2, label: 'ISO Class 2 (Sub-nm R&D / Advanced Pods)' },
  { iso: 3, label: 'ISO Class 3 (US FED-STD-209E Class 1)' },
  { iso: 4, label: 'ISO Class 4 (US FED-STD-209E Class 10)' },
  { iso: 5, label: 'ISO Class 5 (US FED-STD-209E Class 100)' },
  { iso: 6, label: 'ISO Class 6 (US FED-STD-209E Class 1,000)' },
  { iso: 7, label: 'ISO Class 7 (US FED-STD-209E Class 10,000)' },
  { iso: 8, label: 'ISO Class 8 (US FED-STD-209E Class 100,000)' },
  { iso: 9, label: 'ISO Class 9 (Room Air Baseline)' },
];

export default function CleanroomCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  // When changing ISO class, also update ACH default to that class's standard midpoint
  const handleIsoChange = (newIso: IsoClassNumber) => {
    const defaultAch = ISO_CLASSES_INFO[newIso].achDefault;
    setState((prev) => ({
      ...prev,
      isoClass: newIso,
      ach: defaultAch.toString(),
    }));
  };

  const handleUnitToggle = (unit: DimensionUnit) => {
    if (unit === state.dimensionUnit) return;
    const l = Number(state.length);
    const w = Number(state.width);
    const h = Number(state.height);

    if (unit === 'ft') {
      // m to ft
      setState((prev) => ({
        ...prev,
        dimensionUnit: 'ft',
        length: Number.isFinite(l) ? (l * 3.28084).toFixed(1) : prev.length,
        width: Number.isFinite(w) ? (w * 3.28084).toFixed(1) : prev.width,
        height: Number.isFinite(h) ? (h * 3.28084).toFixed(1) : prev.height,
      }));
    } else {
      // ft to m
      setState((prev) => ({
        ...prev,
        dimensionUnit: 'm',
        length: Number.isFinite(l) ? (l / 3.28084).toFixed(1) : prev.length,
        width: Number.isFinite(w) ? (w / 3.28084).toFixed(1) : prev.width,
        height: Number.isFinite(h) ? (h / 3.28084).toFixed(1) : prev.height,
      }));
    }
  };

  const lNum = Number(state.length);
  const wNum = Number(state.width);
  const hNum = Number(state.height);
  const achNum = Number(state.ach);

  const isValidInput =
    Number.isFinite(lNum) &&
    lNum > 0 &&
    Number.isFinite(wNum) &&
    wNum > 0 &&
    Number.isFinite(hNum) &&
    hNum > 0 &&
    Number.isFinite(achNum) &&
    achNum > 0;

  const result = useMemo(() => {
    if (!isValidInput) return null;
    return calculateCleanroomAirflow({
      isoClass: state.isoClass,
      length: lNum,
      width: wNum,
      height: hNum,
      dimensionUnit: state.dimensionUnit,
      ach: achNum,
      ffuSize: state.ffuSize,
    });
  }, [state.isoClass, lNum, wNum, hNum, achNum, state.dimensionUnit, state.ffuSize, isValidInput]);

  const copyResult = () => {
    if (!result) return;
    const lines = [
      'Cleanroom Classification & Airflow Calculation',
      `ISO Classification: ISO Class ${result.isoClass} (${result.fedEquivalent})`,
      `Flow Regime: ${result.classInfo.flowRegime}`,
      `Filter Spec: ${result.classInfo.filterType}`,
      `Dimensions: ${fmt(result.lengthM)} m × ${fmt(result.widthM)} m × ${fmt(result.heightM)} m (${fmt(result.lengthFt)} ft × ${fmt(result.widthFt)} ft × ${fmt(result.heightFt)} ft)`,
      `Room Volume: ${fmt(result.roomVolumeM3)} m³ (${fmt(result.roomVolumeFt3)} ft³)`,
      `Air Changes / Hour (ACH): ${result.ach}`,
      `Total Required Airflow: ${fmt(result.totalAirflowCfm)} CFM (${fmt(result.totalAirflowM3h)} m³/h)`,
      `Recommended FFU Count (${result.ffuSpec.id}): ${result.recommendedFfuCount} units`,
      `Ceiling Filter Coverage: ${result.actualCeilingCoveragePercent.toFixed(1)}% (Recommended guideline: ${result.recommendedCoveragePercent.min}-${result.recommendedCoveragePercent.max}%)`,
      '',
      'Maximum Cumulative Particle Limits (ISO 14644-1):',
      ...result.particleLimits.map(
        (p) =>
          `≥ ${p.diameterUm} µm: ${
            p.isStandardApplicable
              ? `${p.standardPerM3.toLocaleString()} /m³ (${fmt(p.standardPerFt3)} /ft³)`
              : 'N/A (Beyond threshold)'
          }`,
      ),
    ];

    void copy(lines.join('\n'));
  };

  const isLaminar = result ? result.isoClass <= 5 : true;

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="cleanroom-inputs">
        <h2 id="cleanroom-inputs">Classification & Room Geometry</h2>

        <div className="field">
          <label htmlFor="iso-class-select">
            Cleanroom Standard Classification
            <span className="unit">ISO 14644-1 / FED-209E</span>
          </label>
          <select
            id="iso-class-select"
            value={state.isoClass}
            onChange={(e) => handleIsoChange(Number(e.target.value) as IsoClassNumber)}
          >
            {ISO_OPTIONS.map((opt) => (
              <option key={opt.iso} value={opt.iso}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>
            Measurement Units
            <span className="unit">m / ft</span>
          </label>
          <div className="action-row" style={{ marginTop: 0, marginBottom: 12 }}>
            <button
              type="button"
              className={`button ${state.dimensionUnit === 'm' ? 'primary' : 'secondary'}`}
              style={{ padding: '5px 12px', fontSize: 13 }}
              onClick={() => handleUnitToggle('m')}
            >
              Metric (metres)
            </button>
            <button
              type="button"
              className={`button ${state.dimensionUnit === 'ft' ? 'primary' : 'secondary'}`}
              style={{ padding: '5px 12px', fontSize: 13 }}
              onClick={() => handleUnitToggle('ft')}
            >
              Imperial (feet)
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="room-length">
              Length
              <span className="unit">{state.dimensionUnit}</span>
            </label>
            <input
              id="room-length"
              type="number"
              min="0.1"
              step="any"
              value={state.length}
              onChange={(e) => setState((prev) => ({ ...prev, length: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="room-width">
              Width
              <span className="unit">{state.dimensionUnit}</span>
            </label>
            <input
              id="room-width"
              type="number"
              min="0.1"
              step="any"
              value={state.width}
              onChange={(e) => setState((prev) => ({ ...prev, width: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="room-height">
              Ceiling Height
              <span className="unit">{state.dimensionUnit}</span>
            </label>
            <input
              id="room-height"
              type="number"
              min="0.1"
              step="any"
              value={state.height}
              onChange={(e) => setState((prev) => ({ ...prev, height: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="room-ach">
              Air Changes / Hour (ACH)
              <span className="unit">1/h</span>
            </label>
            <input
              id="room-ach"
              type="number"
              min="1"
              step="any"
              value={state.ach}
              onChange={(e) => setState((prev) => ({ ...prev, ach: e.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ffu-size-select">
            Fan Filter Unit (FFU) Module Size
            <span className="unit">HEPA / ULPA</span>
          </label>
          <select
            id="ffu-size-select"
            value={state.ffuSize}
            onChange={(e) => setState((prev) => ({ ...prev, ffuSize: e.target.value as FfuSize }))}
          >
            <option value="2x4">{FFU_CONFIGS['2x4'].label} (~700 CFM / 1190 m³/h)</option>
            <option value="4x4">{FFU_CONFIGS['4x4'].label} (~1400 CFM / 2380 m³/h)</option>
          </select>
        </div>

        {result && (
          <p className="note">
            Standard recommended ACH range for ISO {result.isoClass}:{' '}
            <strong>
              {result.classInfo.achMin} – {result.classInfo.achMax} ACH
            </strong>
            . Recommended ceiling filter coverage:{' '}
            <strong>
              {result.recommendedCoveragePercent.min}% – {result.recommendedCoveragePercent.max}%
            </strong>
            .
          </p>
        )}

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => setState(INITIAL)}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
          {result && (
            <button className="button secondary" type="button" onClick={copyResult}>
              <Copy size={14} aria-hidden="true" /> {copied ? 'Copied' : 'Copy Summary'}
            </button>
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="cleanroom-results">
        <h2 id="cleanroom-results">HVAC & Airflow Requirements</h2>

        {!result ? (
          <div className="error" role="alert">
            Please enter valid positive dimensions and air change rates.
          </div>
        ) : (
          <>
            <span className="unit">Total Airflow Demand</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.totalAirflowCfm)}
              <span className="result-suffix"> CFM ({fmt(result.totalAirflowM3h)} m³/h)</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>ISO 14644-1 Class</span>
                <strong>ISO {result.isoClass}</strong>
              </div>
              <div className="metric">
                <span>FED-STD-209E Equiv</span>
                <strong>{result.fedEquivalent}</strong>
              </div>
              <div className="metric">
                <span>Flow Regime</span>
                <strong style={{ fontSize: 13 }}>{result.classInfo.flowRegime}</strong>
              </div>
              <div className="metric">
                <span>Filter Rating</span>
                <strong style={{ fontSize: 13 }}>{result.classInfo.filterType}</strong>
              </div>
              <div className="metric">
                <span>Room Volume</span>
                <strong>
                  {fmt(result.roomVolumeM3)} m³ <span style={{ fontWeight: 400, fontSize: 12 }}>({fmt(result.roomVolumeFt3)} ft³)</span>
                </strong>
              </div>
              <div className="metric">
                <span>Floor / Ceiling Area</span>
                <strong>
                  {fmt(result.floorAreaM2)} m² <span style={{ fontWeight: 400, fontSize: 12 }}>({fmt(result.floorAreaFt2)} ft²)</span>
                </strong>
              </div>
              <div className="metric">
                <span>Estimated FFUs</span>
                <strong style={{ color: 'var(--teal-dark)' }}>
                  {result.recommendedFfuCount} units ({result.ffuSpec.id})
                </strong>
              </div>
              <div className="metric">
                <span>Ceiling Coverage</span>
                <strong>{result.actualCeilingCoveragePercent.toFixed(1)}%</strong>
              </div>
            </div>

            {/* Cleanroom Air Circulation Interactive Architectural SVG */}
            <div style={{ marginTop: 18, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6, color: 'var(--ink)' }}>
                Cleanroom Circulation Diagram ({isLaminar ? 'Laminar Downflow' : 'Turbulent Dilution'})
              </h3>
              <div className="map-wrap" style={{ background: '#f8fafc', padding: 12 }}>
                <svg
                  viewBox="0 0 540 280"
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 260 }}
                  role="img"
                  aria-label="Cleanroom HVAC airflow circulation schematic diagram"
                >
                  <defs>
                    <linearGradient id="plenumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    <linearGradient id="airStreamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
                    </linearGradient>
                    <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
                    </marker>
                    <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0d9488" />
                    </marker>
                    <pattern id="raisedFloorHoles" width="10" height="6" patternUnits="userSpaceOnUse">
                      <circle cx="5" cy="3" r="1.5" fill="#475569" />
                    </pattern>
                  </defs>

                  {/* Cleanroom Outer Envelope */}
                  <rect x="20" y="20" width="500" height="240" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />

                  {/* Ceiling Air Supply Plenum */}
                  <rect x="20" y="20" width="500" height="40" fill="url(#plenumGrad)" />
                  <text x="270" y="38" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="600">
                    AIR SUPPLY PLENUM (Positive Pressure +P)
                  </text>
                  <text x="270" y="52" textAnchor="middle" fill="#334155" fontSize="9.5">
                    Recirculated Clean Air from AHU
                  </text>

                  {/* Ceiling Filter / FFU Array */}
                  {isLaminar ? (
                    // Laminar layout: High density FFUs across ceiling
                    <>
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const x = 50 + i * 65;
                        return (
                          <g key={i}>
                            <rect x={x} y="60" width="55" height="14" fill="#0d9488" rx="2" stroke="#0f766e" strokeWidth="1" />
                            <text x={x + 27.5} y="71" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="600">
                              FFU / ULPA
                            </text>
                            {/* Streamline arrows */}
                            <line x1={x + 15} y1="80" x2={x + 15} y2="180" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#arrowDown)" />
                            <line x1={x + 40} y1="80" x2={x + 40} y2="180" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#arrowDown)" />
                          </g>
                        );
                      })}
                    </>
                  ) : (
                    // Turbulent layout: Fewer spaced ceiling diffusers
                    <>
                      {[0, 1, 2].map((i) => {
                        const x = 90 + i * 150;
                        return (
                          <g key={i}>
                            <rect x={x} y="60" width="60" height="14" fill="#0284c7" rx="2" stroke="#0369a1" strokeWidth="1" />
                            <text x={x + 30} y="71" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="600">
                              HEPA Diffuser
                            </text>
                            {/* Turbulent swirling airflow lines */}
                            <path d={`M ${x + 20} 80 Q ${x - 20} 130 ${x + 10} 175`} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" markerEnd="url(#arrowDown)" />
                            <path d={`M ${x + 40} 80 Q ${x + 80} 130 ${x + 50} 175`} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" markerEnd="url(#arrowDown)" />
                          </g>
                        );
                      })}
                    </>
                  )}

                  {/* Cleanroom Tool & Processing Zone */}
                  <rect x="180" y="145" width="80" height="50" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" rx="3" />
                  <text x="220" y="168" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600">
                    WAFER FAB
                  </text>
                  <text x="220" y="181" textAnchor="middle" fill="#475569" fontSize="8">
                    PROCESS TOOL
                  </text>

                  {/* Wafer track mini-cassette */}
                  <rect x="280" y="155" width="45" height="40" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" rx="2" />
                  <text x="302.5" y="177" textAnchor="middle" fill="#64748b" fontSize="7.5">
                    FOUP / Pod
                  </text>

                  {/* Floor Level: Perforated Raised Access Floor vs Solid Floor */}
                  {isLaminar ? (
                    <>
                      {/* Raised perforated access floor tile */}
                      <rect x="40" y="196" width="460" height="10" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                      <rect x="40" y="196" width="460" height="10" fill="url(#raisedFloorHoles)" />
                      {/* Sub-floor basement return plenum */}
                      <rect x="40" y="208" width="460" height="36" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="270" y="228" textAnchor="middle" fill="#475569" fontSize="9.5" fontWeight="500">
                        RAISED PERFORATED FLOOR RETURN (15-25% Open Area)
                      </text>

                      {/* Side return air shafts rising back up */}
                      <path d="M 55 225 L 30 225 L 30 45" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeDasharray="5 3" markerEnd="url(#arrowUp)" />
                      <path d="M 485 225 L 510 225 L 510 45" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeDasharray="5 3" markerEnd="url(#arrowUp)" />
                      <text x="25" y="130" transform="rotate(-90, 25, 130)" textAnchor="middle" fill="#0d9488" fontSize="8.5" fontWeight="600">
                        RECIRCULATION CHASE ↑
                      </text>
                      <text x="515" y="130" transform="rotate(90, 515, 130)" textAnchor="middle" fill="#0d9488" fontSize="8.5" fontWeight="600">
                        ↑ RETURN AIR SHAFT
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Low wall exhaust grilles for turbulent flow */}
                      <rect x="40" y="200" width="460" height="12" fill="#94a3b8" />
                      <text x="270" y="210" textAnchor="middle" fill="#ffffff" fontSize="9">
                        Solid Sealed Floor
                      </text>
                      <rect x="35" y="170" width="10" height="28" fill="#64748b" rx="1" />
                      <rect x="495" y="170" width="10" height="28" fill="#64748b" rx="1" />
                      <text x="32" y="162" textAnchor="middle" fill="#64748b" fontSize="7.5">Low Grille</text>
                      <text x="500" y="162" textAnchor="middle" fill="#64748b" fontSize="7.5">Low Grille</text>
                      <path d="M 40 185 L 25 185 L 25 45" fill="none" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrowUp)" />
                      <path d="M 500 185 L 515 185 L 515 45" fill="none" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrowUp)" />
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* ISO 14644-1 Particle Concentration Limits Table */}
            <h3 style={{ fontSize: 14, marginBottom: 8, marginTop: 18, color: 'var(--ink)' }}>
              ISO 14644-1 Maximum Cumulative Particle Limits (ISO Class {result.isoClass})
            </h3>
            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Particle Size</th>
                  <th scope="col">ISO Limit (particles/m³)</th>
                  <th scope="col">Equivalent (particles/ft³)</th>
                  <th scope="col">Standard Status</th>
                </tr>
              </thead>
              <tbody>
                {result.particleLimits.map((p) => (
                  <tr key={p.diameterUm}>
                    <th scope="row">≥ {p.diameterUm} µm</th>
                    <td className="mono">
                      {p.isStandardApplicable ? p.standardPerM3.toLocaleString() : '—'}
                    </td>
                    <td className="mono">
                      {p.isStandardApplicable ? fmt(p.standardPerFt3) : '—'}
                    </td>
                    <td>
                      {p.isStandardApplicable ? (
                        <span style={{ color: 'var(--teal-dark)', fontWeight: 500 }}>
                          Standard Limit
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                          {result.isoClass <= 2
                            ? 'Omitted (statistically negligible)'
                            : 'Omitted (sensor saturation threshold)'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="formula" style={{ marginTop: 16 }}>
              <strong>Airflow Sizing Logic:</strong>
              <div>
                • Volumetric Flow: {fmt(result.roomVolumeM3)} m³ × {result.ach} ACH ={' '}
                <strong>{fmt(result.totalAirflowM3h)} m³/h</strong> ({fmt(result.totalAirflowCfm)} CFM).
              </div>
              <div>
                • Flow-based FFUs: ⌈{fmt(result.totalAirflowCfm)} / {result.ffuSpec.nominalAirflowCfm}⌉ ={' '}
                <strong>{result.ffuCountByAirflow} FFUs</strong>.
              </div>
              <div>
                • Coverage-based FFUs: ({fmt(result.floorAreaM2)} m² × {result.recommendedCoveragePercent.typical}%) /{' '}
                {result.ffuSpec.areaM2} m² = <strong>{result.ffuCountByCoverage} FFUs</strong>.
              </div>
              <div>
                • Selected Design FFU Count: <strong>{result.recommendedFfuCount} units</strong> yielding{' '}
                <strong>{result.actualCeilingCoveragePercent.toFixed(1)}%</strong> ceiling filter coverage.
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
