'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateFilmColor,
  FILM_MATERIALS,
  PLISKIN_OXIDE_BANDS,
  type FilmColorResult,
} from '@/lib/film-color';

type ThicknessUnit = 'nm' | 'angstrom';

const QUICK_PRESETS = [50, 100, 150, 200, 250, 300, 400, 500];

const INITIAL_STATE = {
  materialId: 'sio2',
  thicknessInput: '100',
  unit: 'nm' as ThicknessUnit,
  customN: '1.65',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function FilmColorCalculator() {
  const [state, setState] = useState(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  const selectedMaterial =
    FILM_MATERIALS.find((m) => m.id === state.materialId) || FILM_MATERIALS[0];

  const refractiveIndex =
    state.materialId === 'custom' ? num(state.customN) : selectedMaterial.refractiveIndex;

  const rawThickness = num(state.thicknessInput);
  const thicknessNm =
    state.unit === 'angstrom' ? rawThickness / 10 : rawThickness;

  const result = useMemo(
    () =>
      calculateFilmColor({
        thicknessNm,
        refractiveIndex,
      }),
    [thicknessNm, refractiveIndex],
  );

  const copyResults = async () => {
    if (!result.ok) return;
    const lines = [
      'Thin Film Optical Interference & Color Simulation',
      `Film Material: ${selectedMaterial.name} (${selectedMaterial.formula})`,
      `Refractive Index n: ${fmt(refractiveIndex, 3)}`,
      `Film Thickness: ${fmt(thicknessNm)} nm (${fmt(thicknessNm * 10)} Å)`,
      `Optical Thickness (n·d): ${fmt(result.opticalThicknessNm)} nm`,
      `Simulated Color Hex: ${result.hexColor}`,
      `Simulated sRGB: rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`,
      `Classic Pliskin Color: ${result.classicColorName}`,
      `Photopic Reflectance Y: ${fmt(result.photopicReflectancePercent, 1)}%`,
      result.constructivePeaks.length > 0
        ? `Constructive Peak(s): ${result.constructivePeaks.map((p) => `${p} nm`).join(', ')}`
        : 'Constructive Peaks: None in visible range (380–750 nm)',
      result.destructiveTroughs.length > 0
        ? `Destructive Trough(s): ${result.destructiveTroughs.map((t) => `${t} nm`).join(', ')}`
        : 'Destructive Troughs: None in visible range (380–750 nm)',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  const setPresetThickness = (presetNm: number) => {
    setState((prev) => ({
      ...prev,
      thicknessInput: prev.unit === 'angstrom' ? String(presetNm * 10) : String(presetNm),
    }));
  };

  return (
    <div className="calc-grid">
      {/* INPUTS PANEL */}
      <section className="panel" aria-labelledby="film-inputs-heading">
        <h2 id="film-inputs-heading">Film and Substrate</h2>

        {/* Material Selection */}
        <div className="field">
          <label htmlFor="film-material">Film Material</label>
          <select
            id="film-material"
            value={state.materialId}
            onChange={(e) => setState((prev) => ({ ...prev, materialId: e.target.value }))}
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
        {state.materialId === 'custom' && (
          <div className="field">
            <label htmlFor="film-custom-n">
              Refractive Index (n)
              <span className="unit">dielectric</span>
            </label>
            <input
              id="film-custom-n"
              type="number"
              min="1.05"
              max="4.0"
              step="0.01"
              value={state.customN}
              onChange={(e) => setState((prev) => ({ ...prev, customN: e.target.value }))}
            />
          </div>
        )}

        {/* Thickness with Unit selector */}
        <div className="field">
          <label htmlFor="film-thickness">
            Film Physical Thickness
            <span className="unit">{state.unit === 'angstrom' ? 'Å' : 'nm'}</span>
          </label>
          <div className="inline-field">
            <input
              id="film-thickness"
              type="number"
              min="0"
              max="5000"
              step="any"
              value={state.thicknessInput}
              onChange={(e) => setState((prev) => ({ ...prev, thicknessInput: e.target.value }))}
            />
            <select
              aria-label="Thickness unit"
              value={state.unit}
              onChange={(e) => {
                const newUnit = e.target.value as ThicknessUnit;
                const currentVal = num(state.thicknessInput);
                let converted = state.thicknessInput;
                if (Number.isFinite(currentVal)) {
                  if (newUnit === 'angstrom' && state.unit === 'nm') {
                    converted = String(Math.round(currentVal * 10));
                  } else if (newUnit === 'nm' && state.unit === 'angstrom') {
                    converted = String(Number((currentVal / 10).toFixed(1)));
                  }
                }
                setState((prev) => ({ ...prev, unit: newUnit, thicknessInput: converted }));
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

        {/* Reset and Action buttons */}
        <div className="action-row">
          <button
            type="button"
            className="button secondary"
            onClick={handleReset}
            title="Reset calculator inputs to default"
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            className="button primary"
            onClick={copyResults}
            disabled={!result.ok}
          >
            <Copy size={15} />
            {copied ? 'Copied summary!' : 'Copy summary'}
          </button>
        </div>
      </section>

      {/* RESULTS & VISUALIZATION PANEL */}
      <section className="panel" aria-labelledby="film-results-heading">
        <h2 id="film-results-heading">Simulated Color & Interference Spectrum</h2>

        {!result.ok ? (
          <div className="error">{result.error}</div>
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
                  backgroundColor: result.hexColor,
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
                  {result.hexColor}
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pliskin / Wafer Interference Classification
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                  {result.classicColorName}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  sRGB: <code style={{ fontFamily: 'var(--font-mono)' }}>rgb({result.rgb.r}, {result.rgb.g}, {result.rgb.b})</code>
                  {' • '}
                  Reflectance (Y): <strong>{result.photopicReflectancePercent.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Key Optical Metrics Grid */}
            <div className="metric-grid">
              <div className="metric">
                <span>Optical Thickness (n·d)</span>
                <strong>{fmt(result.opticalThicknessNm, 3)} nm</strong>
              </div>
              <div className="metric">
                <span>Interference Order</span>
                <strong>Order {result.orderNumber}</strong>
              </div>
              <div className="metric">
                <span>Constructive Peak (R_max)</span>
                <strong>
                  {result.constructivePeaks.length > 0
                    ? result.constructivePeaks.map((p) => `${p} nm`).join(', ')
                    : 'None in visible'}
                </strong>
              </div>
              <div className="metric">
                <span>Destructive Trough (R_min)</span>
                <strong>
                  {result.destructiveTroughs.length > 0
                    ? result.destructiveTroughs.map((t) => `${t} nm`).join(', ')
                    : 'None in visible'}
                </strong>
              </div>
            </div>

            {/* Reflectance Spectrum Plot */}
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink)' }}>
                Reflectance Spectrum R(λ) across Visible Spectrum (380–750 nm)
              </h3>
              <ReflectanceChart result={result} />
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

  // X range: 380 nm to 750 nm
  // Y range: 0.0 to 1.0 (or max reflectance + headroom)
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
          {/* Visible rainbow gradient */}
          <linearGradient id="rainbowSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a34eb" stopOpacity="0.45" /> {/* ~380nm violet */}
            <stop offset="16%" stopColor="#2563eb" stopOpacity="0.45" /> {/* ~440nm blue */}
            <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.45" /> {/* ~500nm cyan */}
            <stop offset="49%" stopColor="#22c55e" stopOpacity="0.45" /> {/* ~550nm green */}
            <stop offset="65%" stopColor="#eab308" stopOpacity="0.45" /> {/* ~600nm yellow */}
            <stop offset="78%" stopColor="#f97316" stopOpacity="0.45" /> {/* ~630nm orange */}
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" /> {/* ~750nm red */}
          </linearGradient>
        </defs>

        {/* Plot area background with rainbow gradient */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="url(#rainbowSpectrum)"
          rx="4"
        />

        {/* Grid lines */}
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

        {/* Filled area below reflectance curve */}
        <path d={areaD} fill="rgba(255, 255, 255, 0.12)" />

        {/* Reflectance curve line */}
        <path
          d={curveD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Constructive Peak markers */}
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

        {/* Destructive Trough markers */}
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

        {/* Axis labels */}
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
