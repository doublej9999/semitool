'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import MathFormula from '@/components/tools/MathFormula';
import { downloadCsv } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';
import {
  bowToRadius,
  calculateWaferWarpStress,
  FILM_PRESETS,
  radiusToBow,
  SUBSTRATE_PRESETS,
  WAFER_DIAMETER_PRESETS,
} from '@/lib/wafer-warp-stress';

interface CalculatorState {
  [key: string]: string | number | boolean;
  substrateId: string;
  biaxialModulusGPa: number;
  thermalExpansionSubstratePpm: number;
  waferDiameterMm: number;
  substrateThicknessUm: number;

  filmId: string;
  filmThicknessNm: number;
  youngsModulusFilmGPa: number;
  poissonRatioFilm: number;
  thermalExpansionFilmPpm: number;
  fractureToughness: number;

  curvatureMode: string; // 'radius' | 'bow'
  radiusPreM: number;
  radiusPostM: number;
  bowPreUm: number;
  bowPostUm: number;

  tempDepositionC: number;
  tempMeasurementC: number;
}

const INITIAL_STATE: CalculatorState = {
  substrateId: 'si100',
  biaxialModulusGPa: 180.5,
  thermalExpansionSubstratePpm: 2.6,
  waferDiameterMm: 300,
  substrateThicknessUm: 775,

  filmId: 'sio2-thermal',
  filmThicknessNm: 500,
  youngsModulusFilmGPa: 70,
  poissonRatioFilm: 0.17,
  thermalExpansionFilmPpm: 0.5,
  fractureToughness: 4.0,

  curvatureMode: 'bow',
  radiusPreM: 10000,
  radiusPostM: -132.35,
  bowPreUm: 0,
  bowPostUm: -85,

  tempDepositionC: 1000,
  tempMeasurementC: 25,
};

export default function WaferWarpStressCalculator() {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  useUrlParamsState(state, setState);

  // Substrate selector handler
  const handleSubstrateChange = (subId: string) => {
    const preset = SUBSTRATE_PRESETS.find((s) => s.id === subId);
    if (preset) {
      setState((prev) => ({
        ...prev,
        substrateId: subId,
        biaxialModulusGPa: preset.biaxialModulusGPa,
        thermalExpansionSubstratePpm: preset.thermalExpansionPpm,
      }));
    } else {
      setState((prev) => ({ ...prev, substrateId: 'custom' }));
    }
  };

  // Wafer diameter selector handler
  const handleDiameterChange = (diameter: number) => {
    const diaPreset = WAFER_DIAMETER_PRESETS.find((d) => d.diameterMm === diameter);
    setState((prev) => {
      const defaultThickness = diaPreset ? diaPreset.defaultThicknessUm : prev.substrateThicknessUm;
      return {
        ...prev,
        waferDiameterMm: diameter,
        substrateThicknessUm: defaultThickness,
      };
    });
  };

  // Film selector handler
  const handleFilmChange = (filmId: string) => {
    const preset = FILM_PRESETS.find((f) => f.id === filmId);
    if (preset) {
      setState((prev) => ({
        ...prev,
        filmId,
        youngsModulusFilmGPa: preset.youngsModulusGPa,
        poissonRatioFilm: preset.poissonRatio,
        thermalExpansionFilmPpm: preset.thermalExpansionPpm,
        fractureToughness: preset.fractureToughness,
      }));
    } else {
      setState((prev) => ({ ...prev, filmId: 'custom' }));
    }
  };

  // Calculation output
  const result = useMemo(() => {
    return calculateWaferWarpStress({
      biaxialModulusGPa: state.biaxialModulusGPa,
      thermalExpansionSubstratePpm: state.thermalExpansionSubstratePpm,
      waferDiameterMm: state.waferDiameterMm,
      substrateThicknessUm: state.substrateThicknessUm,
      filmThicknessNm: state.filmThicknessNm,
      youngsModulusFilmGPa: state.youngsModulusFilmGPa,
      poissonRatioFilm: state.poissonRatioFilm,
      thermalExpansionFilmPpm: state.thermalExpansionFilmPpm,
      fractureToughness: state.fractureToughness,
      curvatureMode: state.curvatureMode === 'radius' ? 'radius' : 'bow',
      radiusPreM: state.radiusPreM,
      radiusPostM: state.radiusPostM,
      bowPreUm: state.bowPreUm,
      bowPostUm: state.bowPostUm,
      tempDepositionC: state.tempDepositionC,
      tempMeasurementC: state.tempMeasurementC,
    });
  }, [state]);

  const activeFilmPreset = useMemo(() => {
    return FILM_PRESETS.find((f) => f.id === state.filmId);
  }, [state.filmId]);

  const filmColor = activeFilmPreset ? activeFilmPreset.color : '#0284c7';

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  const handleCopy = async () => {
    if (!result.ok) return;
    const lines = [
      'Wafer Bow, Warp & Thin Film Stress Calculator Results',
      '---------------------------------------------------',
      `Substrate: ${state.substrateId} (Diameter: ${state.waferDiameterMm} mm, Thickness: ${state.substrateThicknessUm} µm)`,
      `Substrate Biaxial Modulus: ${state.biaxialModulusGPa} GPa, CTE: ${state.thermalExpansionSubstratePpm} ppm/°C`,
      `Film: ${state.filmId} (Thickness: ${state.filmThicknessNm} nm, Modulus: ${state.youngsModulusFilmGPa} GPa, ν: ${state.poissonRatioFilm})`,
      `Deposition Temp: ${state.tempDepositionC} °C, Measurement Temp: ${state.tempMeasurementC} °C`,
      `Total Residual Stress: ${fmt(result.totalStressMPa, 2)} MPa (${result.stressType.toUpperCase()})`,
      `Thermal Mismatch Stress: ${fmt(result.thermalStressMPa, 2)} MPa`,
      `Intrinsic Stress: ${fmt(result.intrinsicStressMPa, 2)} MPa`,
      `Wafer Bow (Pre / Post / Delta): ${fmt(result.bowPreUm, 1)} µm / ${fmt(result.bowPostUm, 1)} µm / ${fmt(result.bowDeltaUm, 1)} µm`,
      `Estimated Warp (PV): ${fmt(result.warpPostUm, 1)} µm`,
      `Post Curvature Radius: ${Number.isFinite(result.radiusPostM) ? `${fmt(result.radiusPostM, 2)} m` : 'Flat (∞)'}`,
      `Critical Cracking Thickness hc: ${Number.isFinite(result.criticalThicknessNm) ? `${fmt(result.criticalThicknessNm, 0)} nm` : '∞'}`,
      `Thickness Ratio tf/ts: ${(result.thicknessRatio * 100).toFixed(3)}%`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    if (!result.ok) return;
    const headers = ['Parameter', 'Value', 'Unit', 'Notes'];
    const rows = [
      ['Substrate Material', state.substrateId, '', 'Selected substrate preset or custom'],
      ['Substrate Diameter', state.waferDiameterMm, 'mm', 'Wafer standard diameter'],
      ['Substrate Thickness', state.substrateThicknessUm, 'µm', 'Bulk substrate wafer thickness'],
      ['Substrate Biaxial Modulus', state.biaxialModulusGPa, 'GPa', 'Ms = Es / (1 - nus)'],
      ['Substrate CTE', state.thermalExpansionSubstratePpm, 'ppm/°C', 'Linear thermal expansion coefficient'],
      ['Film Material', state.filmId, '', 'Selected deposited film layer'],
      ['Film Thickness', state.filmThicknessNm, 'nm', 'Thin film physical thickness'],
      ['Film Youngs Modulus', state.youngsModulusFilmGPa, 'GPa', 'Ef of thin film'],
      ['Film Poisson Ratio', state.poissonRatioFilm, '', 'nuf of thin film'],
      ['Film CTE', state.thermalExpansionFilmPpm, 'ppm/°C', 'alpha_f of thin film'],
      ['Film Fracture Toughness', state.fractureToughness, 'J/m²', 'Interfacial Griffith fracture toughness Gamma'],
      ['Deposition Temperature', state.tempDepositionC, '°C', 'Process growth/anneal temperature'],
      ['Measurement Temperature', state.tempMeasurementC, '°C', 'Ambient wafer metrology temperature'],
      ['Curvature Input Mode', state.curvatureMode, '', 'Radius or Bow input mode'],
      ['Pre-process Bow', fmt(result.bowPreUm, 2), 'µm', 'Wafer bow before film deposition'],
      ['Post-process Bow', fmt(result.bowPostUm, 2), 'µm', 'Wafer bow after film deposition'],
      ['Bow Delta', fmt(result.bowDeltaUm, 2), 'µm', 'Delta Bow = Bow_post - Bow_pre'],
      ['Post-process Warp Estimate', fmt(result.warpPostUm, 2), 'µm', 'Peak-to-valley median surface warp |Bow_post|'],
      ['Pre-process Radius', fmt(result.radiusPreM, 2), 'm', 'Pre-process radius of curvature'],
      ['Post-process Radius', fmt(result.radiusPostM, 2), 'm', 'Post-process radius of curvature'],
      ['Total Residual Stress', fmt(result.totalStressMPa, 2), 'MPa', `Stoney total stress (${result.stressType})`],
      ['Thermal Mismatch Stress', fmt(result.thermalStressMPa, 2), 'MPa', 'Stress from CTE difference'],
      ['Intrinsic Deposition Stress', fmt(result.intrinsicStressMPa, 2), 'MPa', 'sigma_total - sigma_thermal'],
      ['Critical Cracking Thickness hc', fmt(result.criticalThicknessNm, 1), 'nm', 'Threshold for film cracking / delamination'],
      ['Film-to-Substrate Ratio', (result.thicknessRatio * 100).toFixed(4), '%', 'Validity check (<= 1.0% required)'],
    ];

    downloadCsv('wafer-warp-thin-film-stress.csv', headers, rows);
  };

  // SVG Wafer Curvature geometry
  // Width 560, Height 180. Center X = 280, Y = 90.
  // We represent the bending profile with an amplified sagitta for clarity.
  const svgVisualDeflection = useMemo(() => {
    if (!result.ok) return 0;
    const bow = result.bowPostUm;
    // Map bow to pixels: clamp between -45 and +45 px
    if (!Number.isFinite(bow) || Math.abs(bow) < 0.1) return 0;
    const scaled = (bow / 150) * 35;
    return Math.max(-45, Math.min(45, scaled));
  }, [result]);

  // Smiling (tensile, bow > 0): edges curve UP, center is lower => dy > 0
  // Frowning (compressive, bow < 0): edges curve DOWN, center is higher => dy < 0
  const def = svgVisualDeflection;
  const centerY = 90 + def;
  const leftY = 90 - def * 0.7;
  const rightY = 90 - def * 0.7;
  const subThickness = 12; // px
  const filmThicknessPx = 4; // px

  return (
    <div className="calc-grid">
      {/* Left Column: Process & Geometry Inputs */}
      <section className="panel" aria-labelledby="wafer-inputs-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="wafer-inputs-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Wafer & Film Specifications
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>

        {/* Substrate Section */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
            Substrate Material & Crystal Orientation
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
            {SUBSTRATE_PRESETS.map((sub) => {
              const selected = state.substrateId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubstrateChange(sub.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: selected ? '2px solid var(--teal)' : '1px solid var(--line)',
                    backgroundColor: selected ? 'var(--teal-soft)' : 'var(--card)',
                    color: selected ? 'var(--teal-dark)' : 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: selected ? 600 : 400,
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{sub.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    M: {sub.biaxialModulusGPa} GPa
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label htmlFor="biaxial-modulus">
                Biaxial Modulus <span className="unit">GPa</span>
              </label>
              <input
                id="biaxial-modulus"
                type="number"
                step="0.5"
                min="10"
                value={state.biaxialModulusGPa}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    biaxialModulusGPa: Number(e.target.value) || 0,
                    substrateId: 'custom',
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="substrate-cte">
                Substrate CTE (α<sub>s</sub>) <span className="unit">ppm/°C</span>
              </label>
              <input
                id="substrate-cte"
                type="number"
                step="0.1"
                min="0.1"
                value={state.thermalExpansionSubstratePpm}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    thermalExpansionSubstratePpm: Number(e.target.value) || 0,
                    substrateId: 'custom',
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Wafer Diameter & Substrate Thickness */}
        <div style={{ marginBottom: '18px', padding: '12px', background: 'var(--paper)', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label htmlFor="wafer-diameter">
                Wafer Diameter <span className="unit">mm</span>
              </label>
              <select
                id="wafer-diameter"
                value={state.waferDiameterMm}
                onChange={(e) => handleDiameterChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--card)',
                }}
              >
                {WAFER_DIAMETER_PRESETS.map((d) => (
                  <option key={d.diameterMm} value={d.diameterMm}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="substrate-thickness">
                Substrate Thickness (t<sub>s</sub>) <span className="unit">µm</span>
              </label>
              <input
                id="substrate-thickness"
                type="number"
                step="5"
                min="50"
                value={state.substrateThicknessUm}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    substrateThicknessUm: Math.max(1, Number(e.target.value) || 0),
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Thin Film Section */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
            Thin Film Material
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
            {FILM_PRESETS.map((film) => {
              const selected = state.filmId === film.id;
              return (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => handleFilmChange(film.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: selected ? `2px solid ${film.color}` : '1px solid var(--line)',
                    backgroundColor: selected ? 'var(--paper)' : 'var(--card)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: selected ? 600 : 400,
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: film.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{film.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    E: {film.youngsModulusGPa} GPa, ν: {film.poissonRatio}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="field">
              <label htmlFor="film-thickness">
                Film Thickness (t<sub>f</sub>) <span className="unit">nm</span>
              </label>
              <input
                id="film-thickness"
                type="number"
                step="50"
                min="1"
                value={state.filmThicknessNm}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    filmThicknessNm: Math.max(1, Number(e.target.value) || 0),
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="film-modulus">
                Young Modulus (E<sub>f</sub>) <span className="unit">GPa</span>
              </label>
              <input
                id="film-modulus"
                type="number"
                step="5"
                min="10"
                value={state.youngsModulusFilmGPa}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    youngsModulusFilmGPa: Number(e.target.value) || 0,
                    filmId: 'custom',
                  }))
                }
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label htmlFor="film-poisson">
                Poisson Ratio (ν<sub>f</sub>)
              </label>
              <input
                id="film-poisson"
                type="number"
                step="0.01"
                min="0.05"
                max="0.49"
                value={state.poissonRatioFilm}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    poissonRatioFilm: Number(e.target.value) || 0,
                    filmId: 'custom',
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="film-cte">
                Film CTE (α<sub>f</sub>) <span className="unit">ppm/°C</span>
              </label>
              <input
                id="film-cte"
                type="number"
                step="0.1"
                min="0"
                value={state.thermalExpansionFilmPpm}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    thermalExpansionFilmPpm: Number(e.target.value) || 0,
                    filmId: 'custom',
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="fracture-toughness">
                Fracture Toughness (Γ) <span className="unit">J/m²</span>
              </label>
              <input
                id="fracture-toughness"
                type="number"
                step="0.5"
                min="0.5"
                value={state.fractureToughness}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    fractureToughness: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Curvature & Bow Measurement Inputs */}
        <div style={{ marginBottom: '18px', padding: '14px', border: '1px solid var(--line)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Metrology Curvature Input Mode
            </label>
            <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, curvatureMode: 'bow' }))}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: state.curvatureMode === 'bow' ? 600 : 400,
                  backgroundColor: state.curvatureMode === 'bow' ? 'var(--teal)' : 'var(--card)',
                  color: state.curvatureMode === 'bow' ? '#fff' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Wafer Bow (µm)
              </button>
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, curvatureMode: 'radius' }))}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: state.curvatureMode === 'radius' ? 600 : 400,
                  backgroundColor: state.curvatureMode === 'radius' ? 'var(--teal)' : 'var(--card)',
                  color: state.curvatureMode === 'radius' ? '#fff' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Curvature Radius R (m)
              </button>
            </div>
          </div>

          {state.curvatureMode === 'bow' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label htmlFor="bow-pre">
                  Pre-Deposition Bow <span className="unit">µm</span>
                </label>
                <input
                  id="bow-pre"
                  type="number"
                  step="1"
                  value={state.bowPreUm}
                  onChange={(e) => setState((p) => ({ ...p, bowPreUm: Number(e.target.value) || 0 }))}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>
                  (+) Concave / smile, (−) Convex / frown
                </span>
              </div>
              <div className="field">
                <label htmlFor="bow-post">
                  Post-Deposition Bow <span className="unit">µm</span>
                </label>
                <input
                  id="bow-post"
                  type="number"
                  step="1"
                  value={state.bowPostUm}
                  onChange={(e) => setState((p) => ({ ...p, bowPostUm: Number(e.target.value) || 0 }))}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>
                  Equivalent Radius: {fmt(bowToRadius(state.bowPostUm, state.waferDiameterMm), 2)} m
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label htmlFor="radius-pre">
                  Pre-Deposition Radius (R<sub>pre</sub>) <span className="unit">m</span>
                </label>
                <input
                  id="radius-pre"
                  type="number"
                  step="10"
                  value={state.radiusPreM}
                  onChange={(e) => setState((p) => ({ ...p, radiusPreM: Number(e.target.value) || 0 }))}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>
                  Use 10000 or ±∞ for flat bare wafer
                </span>
              </div>
              <div className="field">
                <label htmlFor="radius-post">
                  Post-Deposition Radius (R<sub>post</sub>) <span className="unit">m</span>
                </label>
                <input
                  id="radius-post"
                  type="number"
                  step="5"
                  value={state.radiusPostM}
                  onChange={(e) => setState((p) => ({ ...p, radiusPostM: Number(e.target.value) || 0 }))}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>
                  Equivalent Bow: {fmt(radiusToBow(state.radiusPostM, state.waferDiameterMm), 1)} µm
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Temperature Conditions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="field">
            <label htmlFor="temp-dep">
              Deposition Temp (T<sub>dep</sub>) <span className="unit">°C</span>
            </label>
            <input
              id="temp-dep"
              type="number"
              step="25"
              value={state.tempDepositionC}
              onChange={(e) => setState((p) => ({ ...p, tempDepositionC: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="field">
            <label htmlFor="temp-meas">
              Measurement Temp (T<sub>room</sub>) <span className="unit">°C</span>
            </label>
            <input
              id="temp-meas"
              type="number"
              step="1"
              value={state.tempMeasurementC}
              onChange={(e) => setState((p) => ({ ...p, tempMeasurementC: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={!result.ok}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Summary' : 'Copy Summary'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={!result.ok}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </section>

      {/* Right Column: Key Stress Metrics & Interactive Cross Section */}
      <section className="panel" aria-labelledby="stress-results-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="stress-results-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Residual Stress & Wafer Distortion
          </h2>
          {result.ok && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor:
                  result.stressType === 'tensile'
                    ? '#fee2e2'
                    : result.stressType === 'compressive'
                      ? '#dbeafe'
                      : 'var(--paper)',
                color:
                  result.stressType === 'tensile'
                    ? '#991b1b'
                    : result.stressType === 'compressive'
                      ? '#1e40af'
                      : 'var(--ink-soft)',
              }}
            >
              {result.stressType === 'tensile' && <ArrowUpRight size={14} />}
              {result.stressType === 'compressive' && <ArrowDownRight size={14} />}
              {result.stressType.toUpperCase()} STRESS
            </span>
          )}
        </div>

        {/* Primary Metric: Total Stress */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '10px',
            background:
              result.stressType === 'tensile'
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                : result.stressType === 'compressive'
                  ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                  : 'var(--paper)',
            border:
              result.stressType === 'tensile'
                ? '1px solid #fecaca'
                : result.stressType === 'compressive'
                  ? '1px solid #bfdbfe'
                  : '1px solid var(--line)',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)' }}>
                Total Film Residual Stress (Stoney)
              </span>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginTop: '4px' }}>
                {result.ok ? fmt(result.totalStressMPa, 2) : '—'}{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--muted)' }}>MPa</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Thickness Ratio (t<sub>f</sub>/t<sub>s</sub>)</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: result.isThicknessRatioValid ? 'var(--teal)' : 'var(--amber)' }}>
                {result.ok ? `${(result.thicknessRatio * 100).toFixed(3)}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown: Thermal vs Intrinsic Stress */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)' }}>
              <Sparkles size={14} style={{ color: 'var(--teal)' }} />
              Thermal Mismatch (σ<sub>th</sub>)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
              {result.ok ? fmt(result.thermalStressMPa, 2) : '—'}{' '}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--muted)' }}>MPa</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              Δα: {(state.thermalExpansionSubstratePpm - state.thermalExpansionFilmPpm).toFixed(2)} ppm/°C
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)' }}>
              <Layers size={14} style={{ color: 'var(--amber)' }} />
              Intrinsic Deposition (σ<sub>int</sub>)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
              {result.ok ? fmt(result.intrinsicStressMPa, 2) : '—'}{' '}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--muted)' }}>MPa</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              σ<sub>total</sub> − σ<sub>th</sub>
            </div>
          </div>
        </div>

        {/* Wafer Distortion Metrics: Bow Delta & Warp */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--paper)' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Wafer Bow Delta (ΔBow)</span>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {result.ok ? fmt(result.bowDeltaUm, 1) : '—'}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400 }}>µm</span>
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--paper)' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Post Warp Estimate</span>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {result.ok ? fmt(result.warpPostUm, 1) : '—'}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400 }}>µm</span>
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--paper)' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Critical Thickness (h<sub>c</sub>)</span>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: result.exceedsCriticalThickness ? 'var(--red)' : 'var(--ink)',
                marginTop: '2px',
              }}
            >
              {result.ok && Number.isFinite(result.criticalThicknessNm) ? fmt(result.criticalThicknessNm, 0) : '—'}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400 }}>nm</span>
            </div>
          </div>
        </div>

        {/* Visual Cross-Section Diagram */}
        <div
          style={{
            padding: '16px',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Wafer Bending Profile Cross-Section
            </span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {result.stressType === 'tensile'
                ? 'Concave Up (Smiling) · Film in Tension'
                : result.stressType === 'compressive'
                  ? 'Convex Dome (Frowning) · Film in Compression'
                  : 'Flat Wafer'}
            </span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox="0 0 560 180"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px' }}
              role="img"
              aria-label="Wafer cross section bending diagram"
            >
              <defs>
                {/* Linear gradient for substrate */}
                <linearGradient id="subGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                {/* Marker arrows */}
                <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="var(--muted)" />
                </marker>
                <marker id="stressArrowLeft" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                  <path d="M6,0 L6,6 L0,3 z" fill={result.stressType === 'tensile' ? '#ef4444' : '#3b82f6'} />
                </marker>
                <marker id="stressArrowRight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill={result.stressType === 'tensile' ? '#ef4444' : '#3b82f6'} />
                </marker>
              </defs>

              {/* Reference neutral horizon line */}
              <line
                x1="40"
                y1="90"
                x2="520"
                y2="90"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x="45" y="85" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                Zero Deflection Reference
              </text>

              {/* Substrate Ribbon Body */}
              <path
                d={`M 50,${leftY} Q 280,${centerY} 510,${rightY} L 510,${rightY + subThickness} Q 280,${centerY + subThickness} 50,${leftY + subThickness} Z`}
                fill="url(#subGrad)"
                stroke="#475569"
                strokeWidth="1"
              />

              {/* Thin Film Layer (colored on top of substrate) */}
              <path
                d={`M 50,${leftY - filmThicknessPx} Q 280,${centerY - filmThicknessPx} 510,${rightY - filmThicknessPx} L 510,${rightY} Q 280,${centerY} 50,${leftY} Z`}
                fill={filmColor}
                stroke={filmColor}
                strokeWidth="0.5"
              />

              {/* Stress Vector Arrows along the Film Layer */}
              {result.ok && result.stressType === 'tensile' && (
                <g>
                  {/* Tensile: film contracts towards center (arrows point inward) */}
                  <line
                    x1="120"
                    y1={((leftY + centerY) / 2) - 10}
                    x2="170"
                    y2={((leftY + centerY) / 2) - 10}
                    stroke="#ef4444"
                    strokeWidth="2"
                    markerEnd="url(#stressArrowRight)"
                  />
                  <line
                    x1="440"
                    y1={((rightY + centerY) / 2) - 10}
                    x2="390"
                    y2={((rightY + centerY) / 2) - 10}
                    stroke="#ef4444"
                    strokeWidth="2"
                    markerEnd="url(#stressArrowRight)"
                  />
                  <text x="280" y="45" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="600">
                    Contraction / Tensile Stress (Pulling Inward)
                  </text>
                </g>
              )}

              {result.ok && result.stressType === 'compressive' && (
                <g>
                  {/* Compressive: film expands outwards (arrows point outward) */}
                  <line
                    x1="180"
                    y1={((leftY + centerY) / 2) - 10}
                    x2="130"
                    y2={((leftY + centerY) / 2) - 10}
                    stroke="#2563eb"
                    strokeWidth="2"
                    markerEnd="url(#stressArrowRight)"
                  />
                  <line
                    x1="380"
                    y1={((rightY + centerY) / 2) - 10}
                    x2="430"
                    y2={((rightY + centerY) / 2) - 10}
                    stroke="#2563eb"
                    strokeWidth="2"
                    markerEnd="url(#stressArrowRight)"
                  />
                  <text x="280" y="45" textAnchor="middle" fill="#1d4ed8" fontSize="11" fontWeight="600">
                    Expansion / Compressive Stress (Pushing Outward)
                  </text>
                </g>
              )}

              {/* Central sagitta / bow height indicator */}
              {Math.abs(def) > 3 && (
                <g>
                  <line
                    x1="280"
                    y1="90"
                    x2="280"
                    y2={centerY}
                    stroke="#0d9488"
                    strokeWidth="2"
                    markerEnd="url(#arrowHead)"
                  />
                  <text
                    x="290"
                    y={90 + def / 2 + 4}
                    fill="#0d9488"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    Bow: {result.bowPostUm > 0 ? `+${fmt(result.bowPostUm, 1)}` : fmt(result.bowPostUm, 1)} µm
                  </text>
                </g>
              )}

              {/* Wafer labels */}
              <text x="60" y="165" fill="#64748b" fontSize="11" fontWeight="500">
                Wafer Edge ({state.waferDiameterMm} mm)
              </text>
              <g transform="translate(380, 155)">
                <rect x="0" y="0" width="12" height="10" fill={filmColor} rx="2" />
                <text x="18" y="9" fill="var(--ink)" fontSize="11">
                  Film Layer ({state.filmThicknessNm} nm)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Warnings / Boundary Condition Alerts */}
        {result.ok && result.warnings.length > 0 && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <AlertTriangle size={16} />
              Process & Chucking Warnings
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
              {result.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Recipe Scenarios */}
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Recipe Presets
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setState((p) => ({
                  ...p,
                  substrateId: 'si100',
                  biaxialModulusGPa: 180.5,
                  thermalExpansionSubstratePpm: 2.6,
                  waferDiameterMm: 300,
                  substrateThicknessUm: 775,
                  filmId: 'sio2-thermal',
                  filmThicknessNm: 500,
                  youngsModulusFilmGPa: 70,
                  poissonRatioFilm: 0.17,
                  thermalExpansionFilmPpm: 0.5,
                  fractureToughness: 4.0,
                  curvatureMode: 'bow',
                  bowPreUm: 0,
                  bowPostUm: -85,
                  tempDepositionC: 1000,
                  tempMeasurementC: 25,
                }));
              }}
            >
              Thermal Oxide on 300mm Si
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setState((p) => ({
                  ...p,
                  substrateId: 'si100',
                  biaxialModulusGPa: 180.5,
                  thermalExpansionSubstratePpm: 2.6,
                  waferDiameterMm: 300,
                  substrateThicknessUm: 775,
                  filmId: 'si3n4-pecvd',
                  filmThicknessNm: 300,
                  youngsModulusFilmGPa: 220,
                  poissonRatioFilm: 0.25,
                  thermalExpansionFilmPpm: 2.8,
                  fractureToughness: 5.0,
                  curvatureMode: 'bow',
                  bowPreUm: 0,
                  bowPostUm: 95,
                  tempDepositionC: 400,
                  tempMeasurementC: 25,
                }));
              }}
            >
              PECVD Nitride Passivation
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setState((p) => ({
                  ...p,
                  substrateId: 'si100',
                  biaxialModulusGPa: 180.5,
                  thermalExpansionSubstratePpm: 2.6,
                  waferDiameterMm: 300,
                  substrateThicknessUm: 775,
                  filmId: 'cu-sputtered',
                  filmThicknessNm: 800,
                  youngsModulusFilmGPa: 110,
                  poissonRatioFilm: 0.34,
                  thermalExpansionFilmPpm: 16.5,
                  fractureToughness: 10.0,
                  curvatureMode: 'bow',
                  bowPreUm: 0,
                  bowPostUm: 110,
                  tempDepositionC: 250,
                  tempMeasurementC: 25,
                }));
              }}
            >
              Sputtered Cu Metallization
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
