'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Sparkles, Layers } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateFilmColor,
  FILM_MATERIALS,
  PLISKIN_OXIDE_BANDS,
  type FilmColorResult,
} from '@/lib/film-color';
import MathFormula from '@/components/tools/MathFormulaClient';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

/**
 * Multilayer TMM solver mode is code-split out of the route bundle and only
 * fetched when the user switches to the "Multilayer Optical Solver" tab.
 */
const TmmMode = dynamic(() => import('./TmmMode'), {
  loading: () => (
    <div className="calc-grid">
      <section className="panel">
        <p className="note" style={{ margin: 0 }}>
          Loading multilayer optical solver…
        </p>
      </section>
    </div>
  ),
});

type ThicknessUnit = 'nm' | 'angstrom';
type CalcMode = 'single' | 'tmm';

const QUICK_PRESETS = [50, 100, 150, 200, 250, 300, 400, 500];

const INITIAL_SINGLE_STATE = {
  materialId: 'sio2',
  thicknessInput: '100',
  unit: 'nm' as ThicknessUnit,
  customN: '1.65',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function FilmColorCalculator() {
  const [calcMode, setCalcMode] = useState<CalcMode>('single');

  // Single-layer state
  const [singleState, setSingleState] = useState(INITIAL_SINGLE_STATE);
  useUrlParamsState(singleState, setSingleState);
  const [singleCopied, setSingleCopied] = useState(false);
  const g = useGlossary();

  // -------------------------------------------------------------------------
  // Single-Layer Logic
  // -------------------------------------------------------------------------
  const selectedMaterial =
    FILM_MATERIALS.find((m) => m.id === singleState.materialId) || FILM_MATERIALS[0];

  const refractiveIndex =
    singleState.materialId === 'custom' ? num(singleState.customN) : selectedMaterial.refractiveIndex;

  const rawThickness = num(singleState.thicknessInput);
  const thicknessNm =
    singleState.unit === 'angstrom' ? rawThickness / 10 : rawThickness;

  const singleResult = useMemo(
    () =>
      calculateFilmColor({
        thicknessNm,
        refractiveIndex,
      }),
    [thicknessNm, refractiveIndex],
  );

  const copySingleResults = async () => {
    if (!singleResult.ok) return;
    const lines = [
      'Thin Film Optical Interference & Color Simulation',
      `Film Material: ${selectedMaterial.name} (${selectedMaterial.formula})`,
      `Refractive Index n: ${fmt(refractiveIndex, 3)}`,
      `Film Thickness: ${fmt(thicknessNm)} nm (${fmt(thicknessNm * 10)} Å)`,
      `Optical Thickness (n·d): ${fmt(singleResult.opticalThicknessNm)} nm`,
      `Simulated Color Hex: ${singleResult.hexColor}`,
      `Simulated sRGB: rgb(${singleResult.rgb.r}, ${singleResult.rgb.g}, ${singleResult.rgb.b})`,
      `Classic Pliskin Color: ${singleResult.classicColorName}`,
      `Photopic Reflectance Y: ${fmt(singleResult.photopicReflectancePercent, 1)}%`,
      singleResult.constructivePeaks.length > 0
        ? `Constructive Peak(s): ${singleResult.constructivePeaks.map((p) => `${p} nm`).join(', ')}`
        : 'Constructive Peaks: None in visible range (380–750 nm)',
      singleResult.destructiveTroughs.length > 0
        ? `Destructive Trough(s): ${singleResult.destructiveTroughs.map((t) => `${t} nm`).join(', ')}`
        : 'Destructive Troughs: None in visible range (380–750 nm)',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setSingleCopied(true);
      window.setTimeout(() => setSingleCopied(false), 1600);
    } catch {
      setSingleCopied(false);
    }
  };

  const handleSingleReset = () => {
    setSingleState(INITIAL_SINGLE_STATE);
  };

  const setPresetThickness = (presetNm: number) => {
    setSingleState((prev) => ({
      ...prev,
      thicknessInput: prev.unit === 'angstrom' ? String(presetNm * 10) : String(presetNm),
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* MODE SELECTION TABS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--line)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`button ${calcMode === 'single' ? 'primary' : 'secondary'}`}
            onClick={() => setCalcMode('single')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} />
            Single-Layer Visual Inspection (Pliskin)
          </button>
          <button
            type="button"
            className={`button ${calcMode === 'tmm' ? 'primary' : 'secondary'}`}
            onClick={() => setCalcMode('tmm')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={16} />
            Multilayer Optical Solver (Abelès TMM)
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {calcMode === 'single'
            ? 'Fast color lookup and normal-incidence visual order bands'
            : 'Exact 1D Maxwell boundary solver (angle, polarization, complex n+ik)'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SINGLE-LAYER PLISKIN MODE                                                  */}
      {/* ========================================================================= */}
      {calcMode === 'single' && (
        <div className="calc-grid">
          {/* INPUTS PANEL */}
          <section className="panel" aria-labelledby="film-inputs-heading">
            <h2 id="film-inputs-heading">Film and Substrate</h2>

            {/* Material Selection */}
            <div className="field">
              <label htmlFor="film-material">{g('filmMaterial')}</label>
              <select
                id="film-material"
                value={singleState.materialId}
                onChange={(e) => setSingleState((prev) => ({ ...prev, materialId: e.target.value }))}
              >
                {FILM_MATERIALS.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.formula}) — n ≈ {mat.refractiveIndex.toFixed(2)}
                  </option>
                ))}
              </select>
              <p className="note">{selectedMaterial.description}</p>
            </div>

            {/* Custom Refractive Index if selected */}
            {singleState.materialId === 'custom' && (
              <div className="field">
                <label htmlFor="film-custom-n">
                  {g('refractiveIndex')} (n)
                  <span className="unit">dielectric</span>
                </label>
                <input
                  id="film-custom-n"
                  type="number"
                  min="1.05"
                  max="4.0"
                  step="0.01"
                  value={singleState.customN}
                  onChange={(e) => setSingleState((prev) => ({ ...prev, customN: e.target.value }))}
                />
              </div>
            )}

            {/* Thickness with Unit selector */}
            <div className="field">
              <label htmlFor="film-thickness">
                Film Physical Thickness
                <span className="unit">{singleState.unit === 'angstrom' ? 'Å' : 'nm'}</span>
              </label>
              <div className="inline-field">
                <input
                  id="film-thickness"
                  type="number"
                  min="0"
                  max="5000"
                  step="any"
                  value={singleState.thicknessInput}
                  onChange={(e) => setSingleState((prev) => ({ ...prev, thicknessInput: e.target.value }))}
                />
                <select
                  aria-label="Thickness unit"
                  value={singleState.unit}
                  onChange={(e) => {
                    const newUnit = e.target.value as ThicknessUnit;
                    const currentVal = num(singleState.thicknessInput);
                    let converted = singleState.thicknessInput;
                    if (Number.isFinite(currentVal)) {
                      if (newUnit === 'angstrom' && singleState.unit === 'nm') {
                        converted = String(Math.round(currentVal * 10));
                      } else if (newUnit === 'nm' && singleState.unit === 'angstrom') {
                        converted = String(Number((currentVal / 10).toFixed(1)));
                      }
                    }
                    setSingleState((prev) => ({ ...prev, unit: newUnit, thicknessInput: converted }));
                  }}
                  style={{ flex: '0 0 auto', width: 'auto' }}
                >
                  <option value="nm">nm (nanometres)</option>
                  <option value="angstrom">Å (ångström)</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="field">
              <label>Quick Thickness Presets (nm)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {QUICK_PRESETS.map((presetNm) => {
                  const isCurrent =
                    Number.isFinite(thicknessNm) && Math.abs(thicknessNm - presetNm) < 0.1;
                  return (
                    <button
                      key={presetNm}
                      type="button"
                      className={`button secondary ${isCurrent ? 'primary' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => setPresetThickness(presetNm)}
                    >
                      {presetNm} nm
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Substrate Display */}
            <div className="field">
              <label>Substrate</label>
              <input
                type="text"
                readOnly
                value="Silicon (Si) — Dispersive n(λ) ≈ 3.88 (380–750 nm)"
                style={{ background: 'var(--paper)', cursor: 'default' }}
              />
            </div>

            {/* Physics Formula Card */}
            <div style={{ marginTop: '16px' }}>
              <MathFormula
                block
                label="Normal Thin Film Constructive / Destructive Interference"
                math="2 n d = m \lambda \quad (\text{Constructive}) \qquad 2 n d = \left(m - \frac{1}{2}\right) \lambda \quad (\text{Destructive})"
              />
            </div>

            {/* Reset and Action buttons */}
            <div className="action-row">
              <button
                type="button"
                className="button secondary"
                onClick={handleSingleReset}
                title="Reset calculator inputs to default"
              >
                <RotateCcw size={15} />
                Reset
              </button>
              <button
                type="button"
                className="button primary"
                onClick={copySingleResults}
                disabled={!singleResult.ok}
              >
                <Copy size={15} />
                {singleCopied ? 'Copied summary!' : 'Copy summary'}
              </button>
            </div>
          </section>

          {/* RESULTS & VISUALIZATION PANEL */}
          <section className="panel" aria-labelledby="film-results-heading">
            <h2 id="film-results-heading">Simulated Color & Interference Spectrum</h2>

            {!singleResult.ok ? (
              <div className="error">{singleResult.error}</div>
            ) : (
              <div>
                {/* Color Swatch Hero */}
                <div
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--line-strong)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    backgroundColor: 'var(--card)',
                  }}
                >
                  <div
                    style={{
                      height: '96px',
                      backgroundColor: singleResult.hexColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                      borderBottom: '1px solid var(--line)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        color: '#152127',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '15px',
                        letterSpacing: '0.05em',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {singleResult.hexColor}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pliskin / Wafer Interference Classification
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      {singleResult.classicColorName}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                      sRGB: <code style={{ fontFamily: 'var(--font-mono)' }}>rgb({singleResult.rgb.r}, {singleResult.rgb.g}, {singleResult.rgb.b})</code>
                      {' • '}
                      Reflectance (Y): <strong>{singleResult.photopicReflectancePercent.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                {/* Key Optical Metrics Grid */}
                <div className="metric-grid">
                  <div className="metric">
                    <span>Optical Thickness (n·d)</span>
                    <strong>{fmt(singleResult.opticalThicknessNm, 3)} nm</strong>
                  </div>
                  <div className="metric">
                    <span>Interference Order</span>
                    <strong>Order {singleResult.orderNumber}</strong>
                  </div>
                  <div className="metric">
                    <span>Constructive Peak (R_max)</span>
                    <strong>
                      {singleResult.constructivePeaks.length > 0
                        ? singleResult.constructivePeaks.map((p) => `${p} nm`).join(', ')
                        : 'None in visible'}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Destructive Trough (R_min)</span>
                    <strong>
                      {singleResult.destructiveTroughs.length > 0
                        ? singleResult.destructiveTroughs.map((t) => `${t} nm`).join(', ')
                        : 'None in visible'}
                    </strong>
                  </div>
                </div>

                {/* Reflectance Spectrum Plot */}
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink)' }}>
                    Reflectance Spectrum R(λ) across Visible Spectrum (380–750 nm)
                  </h3>
                  <ReflectanceChart result={singleResult} />
                </div>

                {/* Pliskin Oxide Reference Palette */}
                <div style={{ marginTop: '20px' }}>
                  <details style={{ fontSize: '13px', cursor: 'pointer' }}>
                    <summary style={{ fontWeight: 600, color: 'var(--teal-dark)' }}>
                      View Classic Pliskin Thermal Oxide Reference Chart
                    </summary>
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '8px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        padding: '8px',
                        backgroundColor: 'var(--paper)',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {PLISKIN_OXIDE_BANDS.map((band) => (
                        <div
                          key={band.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#fff',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            fontSize: '11.5px',
                          }}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: band.hexPreview,
                              border: '1px solid rgba(0,0,0,0.15)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {band.minNm}–{band.maxNm} nm
                            </div>
                            <div style={{ color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {band.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTILAYER TMM SOLVER MODE (lazily loaded)                                 */}
      {/* ========================================================================= */}
      {calcMode === 'tmm' && <TmmMode />}
    </div>
  );
}

/**
 * Interactive SVG spectrum chart with rainbow visible spectrum backdrop and white reflectance curve.
 */
function ReflectanceChart({ result }: { result: FilmColorResult }) {
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const minX = 380;
  const maxX = 750;
  const maxY = 1.0;

  const getX = (wl: number) => padding.left + ((wl - minX) / (maxX - minX)) * plotW;
  const getY = (r: number) => padding.top + (1 - r / maxY) * plotH;

  const pathPoints = result.spectrum.map((pt) => `${getX(pt.wavelengthNm).toFixed(1)},${getY(pt.reflectance).toFixed(1)}`);
  const curveD = `M ${pathPoints.join(' L ')}`;

  const areaD = `${curveD} L ${getX(maxX).toFixed(1)},${getY(0).toFixed(1)} L ${getX(minX).toFixed(1)},${getY(0).toFixed(1)} Z`;

  const xTicks = [400, 450, 500, 550, 600, 650, 700, 750];
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        background: '#152127',
        borderRadius: '8px',
        padding: '10px',
        color: '#f4f6f5',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Reflectance spectrum plot"
      >
        <defs>
          <linearGradient id="rainbowSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a34eb" stopOpacity="0.45" />
            <stop offset="16%" stopColor="#2563eb" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.45" />
            <stop offset="49%" stopColor="#22c55e" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#eab308" stopOpacity="0.45" />
            <stop offset="78%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="url(#rainbowSpectrum)"
          rx="4"
        />

        {yTicks.map((yVal) => {
          const yPos = getY(yVal);
          return (
            <g key={yVal}>
              <line
                x1={padding.left}
                y1={yPos}
                x2={padding.left + plotW}
                y2={yPos}
                stroke="#33454e"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={yPos + 4}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {(yVal * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {xTicks.map((wl) => {
          const xPos = getX(wl);
          return (
            <g key={wl}>
              <line
                x1={xPos}
                y1={padding.top}
                x2={xPos}
                y2={padding.top + plotH}
                stroke="#33454e"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={xPos}
                y={padding.top + plotH + 18}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {wl}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill="rgba(255, 255, 255, 0.12)" />

        <path
          d={curveD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {result.constructivePeaks.map((peakWl) => {
          const pt = result.spectrum.find((s) => s.wavelengthNm === peakWl);
          if (!pt) return null;
          return (
            <g key={`peak-${peakWl}`}>
              <circle
                cx={getX(peakWl)}
                cy={getY(pt.reflectance)}
                r="4.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={getX(peakWl)}
                y={getY(pt.reflectance) - 8}
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {peakWl}
              </text>
            </g>
          );
        })}

        {result.destructiveTroughs.map((troughWl) => {
          const pt = result.spectrum.find((s) => s.wavelengthNm === troughWl);
          if (!pt) return null;
          return (
            <g key={`trough-${troughWl}`}>
              <circle
                cx={getX(troughWl)}
                cy={getY(pt.reflectance)}
                r="4.5"
                fill="#f43f5e"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={getX(troughWl)}
                y={getY(pt.reflectance) + 14}
                fill="#f43f5e"
                fontSize="9"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {troughWl}
              </text>
            </g>
          );
        })}

        <text
          x={padding.left + plotW / 2}
          y={height - 2}
          fill="#cbd5e1"
          fontSize="11"
          textAnchor="middle"
        >
          Wavelength λ (nm)
        </text>
        <text
          x={14}
          y={padding.top + plotH / 2}
          fill="#cbd5e1"
          fontSize="11"
          textAnchor="middle"
          transform={`rotate(-90 14 ${padding.top + plotH / 2})`}
        >
          Reflectance R
        </text>
      </svg>
    </div>
  );
}
