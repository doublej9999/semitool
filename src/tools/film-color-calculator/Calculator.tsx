'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Layers, Sliders } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateFilmColor,
  FILM_MATERIALS,
  PLISKIN_OXIDE_BANDS,
  type FilmColorResult,
} from '@/lib/film-color';
import {
  calculateMultilayerOpticalSpectrum,
  calculateOptimalSingleLayerArc,
  OPTICAL_MATERIALS,
  type OpticalLayerConfig,
  type PolarizationMode,
  type OpticalTmmSpectrumResult,
  getMaterialIndexAt,
} from '@/lib/optical-tmm';
import MathFormula from '@/components/tools/MathFormula';

type ThicknessUnit = 'nm' | 'angstrom';
type CalcMode = 'single' | 'tmm';

const QUICK_PRESETS = [50, 100, 150, 200, 250, 300, 400, 500];

const INITIAL_SINGLE_STATE = {
  materialId: 'sio2',
  thicknessInput: '100',
  unit: 'nm' as ThicknessUnit,
  customN: '1.65',
};

interface TmmStackLayer {
  id: string;
  materialId: string;
  name: string;
  thicknessNm: number;
  customN?: number;
  customK?: number;
}

const TMM_PRESET_STACKS: { name: string; description: string; incident: string; substrate: string; layers: TmmStackLayer[] }[] = [
  {
    name: 'Thermal Oxide (100nm SiO₂ / Si)',
    description: 'Classic semiconductor thermal gate/field dielectric on c-Si substrate',
    incident: 'air',
    substrate: 'si',
    layers: [
      { id: 'l1', materialId: 'sio2', name: 'Thermal Oxide', thicknessNm: 100 },
    ],
  },
  {
    name: 'Single-Layer ARC (75nm Si₃N₄ / Si)',
    description: 'Quarter-wave anti-reflective coating optimized for visible spectrum solar / metrology',
    incident: 'air',
    substrate: 'si',
    layers: [
      { id: 'l1', materialId: 'si3n4', name: 'Silicon Nitride ARC', thicknessNm: 75 },
    ],
  },
  {
    name: 'Dual-Layer Broadband ARC (MgF₂ / TiO₂ / Si)',
    description: 'High-efficiency dual index ARC for optical sensor windows and solar cells',
    incident: 'air',
    substrate: 'si',
    layers: [
      { id: 'l1', materialId: 'mgf2', name: 'MgF₂ Low-index', thicknessNm: 95 },
      { id: 'l2', materialId: 'tio2', name: 'TiO₂ High-index', thicknessNm: 55 },
    ],
  },
  {
    name: 'High-K Metal Gate (TiN / HfO₂ / SiO₂ / Si)',
    description: 'Advanced HKMG front-end transistor gate stack (28nm / FinFET)',
    incident: 'air',
    substrate: 'si',
    layers: [
      { id: 'l1', materialId: 'tin', name: 'TiN Work-Function Metal', thicknessNm: 5 },
      { id: 'l2', materialId: 'hfo2', name: 'HfO₂ High-k Dielectric', thicknessNm: 3 },
      { id: 'l3', materialId: 'sio2', name: 'Interfacial Oxide', thicknessNm: 1.2 },
    ],
  },
  {
    name: 'DUV Lithography (Photoresist / BARC / Poly / SiO₂)',
    description: 'Photolithography stack with Bottom Anti-Reflective Coating on Poly-Si gate',
    incident: 'air',
    substrate: 'si',
    layers: [
      { id: 'l1', materialId: 'photoresist', name: 'DUV Resist', thicknessNm: 320 },
      { id: 'l2', materialId: 'si3n4', name: 'Organic BARC', thicknessNm: 45 },
      { id: 'l3', materialId: 'poly_si', name: 'Poly-Si Gate', thicknessNm: 100 },
      { id: 'l4', materialId: 'sio2', name: 'Pad Oxide', thicknessNm: 10 },
    ],
  },
  {
    name: 'Damascene Capping (Si₃N₄ / Cu / SiO₂)',
    description: 'Copper interconnect metallization with SiN dielectric diffusion barrier',
    incident: 'air',
    substrate: 'sio2',
    layers: [
      { id: 'l1', materialId: 'si3n4', name: 'SiN Diffusion Barrier', thicknessNm: 35 },
      { id: 'l2', materialId: 'cu', name: 'Electroplated Cu', thicknessNm: 150 },
    ],
  },
];

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function FilmColorCalculator() {
  const [calcMode, setCalcMode] = useState<CalcMode>('single');

  // Single-layer state
  const [singleState, setSingleState] = useState(INITIAL_SINGLE_STATE);
  const [singleCopied, setSingleCopied] = useState(false);

  // Multilayer TMM state
  const [tmmIncident, setTmmIncident] = useState<string>('air');
  const [tmmSubstrate, setTmmSubstrate] = useState<string>('si');
  const [tmmAngleDeg, setTmmAngleDeg] = useState<number>(0);
  const [tmmPolarization, setTmmPolarization] = useState<PolarizationMode>('unpolarized');
  const [tmmLayers, setTmmLayers] = useState<TmmStackLayer[]>(TMM_PRESET_STACKS[0].layers);
  const [tmmCopied, setTmmCopied] = useState(false);
  const [showR, setShowR] = useState(true);
  const [showT, setShowT] = useState(true);
  const [showA, setShowA] = useState(true);

  // ARC Optimizer state
  const [arcTargetWl, setArcTargetWl] = useState<number>(550);

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

  // -------------------------------------------------------------------------
  // Multilayer TMM Logic
  // -------------------------------------------------------------------------
  const tmmOptions = useMemo(() => {
    const opticalLayers: OpticalLayerConfig[] = tmmLayers.map((layer) => {
      if (layer.materialId === 'custom') {
        return {
          name: layer.name,
          thicknessNm: Math.max(0, layer.thicknessNm || 0),
          refractiveIndex: layer.customN ?? 1.5,
          extinctionCoefficient: layer.customK ?? 0,
        };
      }
      return {
        materialId: layer.materialId,
        name: layer.name,
        thicknessNm: Math.max(0, layer.thicknessNm || 0),
      };
    });

    return {
      incidentMediumId: tmmIncident,
      substrateMediumId: tmmSubstrate,
      layers: opticalLayers,
      angleDeg: tmmAngleDeg,
      polarization: tmmPolarization,
    };
  }, [tmmLayers, tmmIncident, tmmSubstrate, tmmAngleDeg, tmmPolarization]);

  const tmmResult: OpticalTmmSpectrumResult = useMemo(() => {
    return calculateMultilayerOpticalSpectrum(tmmOptions, 380, 780, 5);
  }, [tmmOptions]);

  // Optimal ARC calculation
  const arcOptimization = useMemo(() => {
    const nInc = tmmIncident === 'water' ? 1.33 : 1.0;
    const subIdx = getMaterialIndexAt({ materialId: tmmSubstrate, thicknessNm: 0 }, arcTargetWl);
    return calculateOptimalSingleLayerArc(arcTargetWl, nInc, subIdx.r);
  }, [arcTargetWl, tmmIncident, tmmSubstrate]);

  const addTmmLayer = () => {
    const newLayer: TmmStackLayer = {
      id: `l_${Date.now()}`,
      materialId: 'sio2',
      name: 'New SiO₂ Layer',
      thicknessNm: 50,
    };
    setTmmLayers((prev) => [...prev, newLayer]);
  };

  const removeTmmLayer = (index: number) => {
    setTmmLayers((prev) => prev.filter((_, i) => i !== index));
  };

  const moveTmmLayer = (index: number, direction: 'up' | 'down') => {
    setTmmLayers((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const updateTmmLayer = (index: number, patch: Partial<TmmStackLayer>) => {
    setTmmLayers((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  };

  const loadTmmPreset = (presetIdx: number) => {
    const p = TMM_PRESET_STACKS[presetIdx];
    if (!p) return;
    setTmmIncident(p.incident);
    setTmmSubstrate(p.substrate);
    setTmmLayers(p.layers.map((l, idx) => ({ ...l, id: `p_${idx}_${Date.now()}` })));
  };

  const applyArcToStack = () => {
    const arcLayer: TmmStackLayer = {
      id: `arc_${Date.now()}`,
      materialId: 'custom',
      name: `Optimized ARC (${arcTargetWl} nm)`,
      thicknessNm: Number(arcOptimization.quarterWaveThicknessNm.toFixed(1)),
      customN: Number(arcOptimization.optimalIndex.toFixed(3)),
      customK: 0,
    };
    setTmmLayers((prev) => [arcLayer, ...prev]);
  };

  const copyTmmResults = async () => {
    const lines = [
      'Multilayer Optical Transfer Matrix (TMM) Spectrum Simulation',
      `Incident Medium: ${tmmIncident.toUpperCase()} | Substrate: ${tmmSubstrate.toUpperCase()}`,
      `Angle of Incidence: ${tmmAngleDeg}° | Polarization: ${tmmPolarization}`,
      `Stack Layers: ${tmmLayers.length} layer(s)`,
      ...tmmLayers.map((l, i) => `  #${i + 1} ${l.name} (${l.materialId}): ${l.thicknessNm} nm`),
      `Average Reflectance (vis): ${(tmmResult.avgReflectance * 100).toFixed(2)}%`,
      `Average Transmittance (vis): ${(tmmResult.avgTransmittance * 100).toFixed(2)}%`,
      `Average Absorptance (vis): ${(tmmResult.avgAbsorptance * 100).toFixed(2)}%`,
      `Simulated Reflected Color: ${tmmResult.colorHex}`,
      `Tristimulus (X, Y, Z): (${tmmResult.tristimulus.X.toFixed(3)}, ${tmmResult.tristimulus.Y.toFixed(3)}, ${tmmResult.tristimulus.Z.toFixed(3)})`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setTmmCopied(true);
      window.setTimeout(() => setTmmCopied(false), 1600);
    } catch {
      setTmmCopied(false);
    }
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
              <label htmlFor="film-material">Film Material</label>
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
                  Refractive Index (n)
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
      {/* MULTILAYER TMM SOLVER MODE                                                 */}
      {/* ========================================================================= */}
      {calcMode === 'tmm' && (
        <div className="calc-grid">
          {/* INPUTS PANEL */}
          <section className="panel" aria-labelledby="tmm-inputs-heading">
            <h2 id="tmm-inputs-heading">Multilayer Optical Stack Configuration</h2>

            {/* Presets Selector */}
            <div className="field">
              <label htmlFor="tmm-preset">Industry Multilayer Presets</label>
              <select
                id="tmm-preset"
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if (!isNaN(idx)) loadTmmPreset(idx);
                }}
                defaultValue=""
              >
                <option value="" disabled>Choose an industrial film stack preset...</option>
                {TMM_PRESET_STACKS.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optical Environment Row (Incident & Substrate) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label htmlFor="tmm-incident">Incident Medium</label>
                <select
                  id="tmm-incident"
                  value={tmmIncident}
                  onChange={(e) => setTmmIncident(e.target.value)}
                >
                  <option value="air">Air (n = 1.0)</option>
                  <option value="water">Water / Immersion (n ≈ 1.33)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="tmm-substrate">Substrate Material</label>
                <select
                  id="tmm-substrate"
                  value={tmmSubstrate}
                  onChange={(e) => setTmmSubstrate(e.target.value)}
                >
                  <option value="si">Silicon (c-Si, n ≈ 3.88)</option>
                  <option value="sio2">Fused Silica / Quartz (SiO₂)</option>
                  <option value="al2o3">Sapphire (Al₂O₃)</option>
                  <option value="gaas">Gallium Arsenide (GaAs)</option>
                  <option value="gan">Gallium Nitride (GaN)</option>
                  <option value="sic">Silicon Carbide (4H-SiC)</option>
                </select>
              </div>
            </div>

            {/* Illumination Settings: Angle & Polarization */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label htmlFor="tmm-angle">
                  Incident Angle θ₀
                  <span className="unit">deg</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    id="tmm-angle"
                    type="number"
                    min="0"
                    max="85"
                    step="1"
                    value={tmmAngleDeg}
                    onChange={(e) => setTmmAngleDeg(Math.max(0, Math.min(85, Number(e.target.value) || 0)))}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 45, 65].map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`button secondary ${tmmAngleDeg === a ? 'primary' : ''}`}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setTmmAngleDeg(a)}
                      >
                        {a}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="tmm-pol">Polarization</label>
                <select
                  id="tmm-pol"
                  value={tmmPolarization}
                  onChange={(e) => setTmmPolarization(e.target.value as PolarizationMode)}
                >
                  <option value="unpolarized">Unpolarized (Average)</option>
                  <option value="TE">TE (s-polarization, E ⊥ plane)</option>
                  <option value="TM">TM (p-polarization, E ∥ plane)</option>
                </select>
              </div>
            </div>

            {/* Layer Stack Table */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  Thin Film Layers (Surface Top → Substrate Bottom)
                </span>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={addTmmLayer}
                >
                  <Plus size={13} /> Add Layer
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tmmLayers.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', background: 'var(--paper)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                    No thin film layers. Simulating bare substrate reflection.
                  </div>
                ) : (
                  tmmLayers.map((layer, idx) => (
                    <div
                      key={layer.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'var(--paper)',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal-dark)', width: '24px' }}>
                        #{idx + 1}
                      </span>

                      {/* Material select */}
                      <select
                        value={layer.materialId}
                        onChange={(e) => updateTmmLayer(idx, { materialId: e.target.value, name: OPTICAL_MATERIALS[e.target.value]?.name || 'Custom' })}
                        style={{ flex: 1, minWidth: '120px', fontSize: '12px' }}
                      >
                        <option value="sio2">SiO₂ (Oxide)</option>
                        <option value="si3n4">Si₃N₄ (Nitride)</option>
                        <option value="poly_si">Poly-Si</option>
                        <option value="tin">TiN (Metal Gate)</option>
                        <option value="hfo2">HfO₂ (High-k)</option>
                        <option value="al2o3">Al₂O₃ (Alumina)</option>
                        <option value="photoresist">Photoresist (PR)</option>
                        <option value="mgf2">MgF₂ (Low Index)</option>
                        <option value="tio2">TiO₂ (High Index)</option>
                        <option value="al">Aluminium (Al)</option>
                        <option value="cu">Copper (Cu)</option>
                        <option value="custom">Custom (n, k)</option>
                      </select>

                      {/* Thickness input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '90px' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={layer.thicknessNm}
                          onChange={(e) => updateTmmLayer(idx, { thicknessNm: Number(e.target.value) || 0 })}
                          style={{ width: '60px', padding: '4px 6px', fontSize: '12px' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>nm</span>
                      </div>

                      {/* Custom n & k if custom */}
                      {layer.materialId === 'custom' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.05"
                            placeholder="n"
                            title="Refractive index n"
                            value={layer.customN ?? 1.5}
                            onChange={(e) => updateTmmLayer(idx, { customN: Number(e.target.value) || 1.5 })}
                            style={{ width: '50px', padding: '4px 4px', fontSize: '11px' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="k"
                            title="Extinction coefficient k"
                            value={layer.customK ?? 0}
                            onChange={(e) => updateTmmLayer(idx, { customK: Number(e.target.value) || 0 })}
                            style={{ width: '45px', padding: '4px 4px', fontSize: '11px' }}
                          />
                        </div>
                      )}

                      {/* Reorder and delete controls */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: '3px', borderRadius: '4px' }}
                          onClick={() => moveTmmLayer(idx, 'up')}
                          disabled={idx === 0}
                          title="Move layer up towards surface"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: '3px', borderRadius: '4px' }}
                          onClick={() => moveTmmLayer(idx, 'down')}
                          disabled={idx === tmmLayers.length - 1}
                          title="Move layer down towards substrate"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: '3px', borderRadius: '4px', color: 'var(--red)' }}
                          onClick={() => removeTmmLayer(idx)}
                          title="Delete layer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Antireflective Coating (ARC) Quarter-Wave Assistant */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--paper)',
                border: '1px dashed var(--line-strong)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal-dark)' }}>
                  Quarter-Wave Single Layer ARC Designer (n = √(n₀·nₛ), d = λ₀/4n)
                </span>
                <button
                  type="button"
                  className="button secondary"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={applyArcToStack}
                >
                  + Add Ideal ARC Layer
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Target λ₀:</span>
                  <input
                    type="number"
                    value={arcTargetWl}
                    onChange={(e) => setArcTargetWl(Number(e.target.value) || 550)}
                    style={{ width: '70px', padding: '3px 6px', fontSize: '12px' }}
                  />
                  <span>nm</span>
                </div>
                <div>
                  Optimal Index: <strong>n = {arcOptimization.optimalIndex.toFixed(3)}</strong>
                </div>
                <div>
                  Quarter-Wave Thickness: <strong>d = {arcOptimization.quarterWaveThicknessNm.toFixed(1)} nm</strong>
                </div>
              </div>
            </div>

            {/* Matrix Abelès kaTeX formula */}
            <div style={{ marginTop: '16px' }}>
              <MathFormula
                block
                label="Abelès Transfer Matrix Formalism for Multilayer Interference"
                math="M = \begin{pmatrix} M_{11} & M_{12} \\ M_{21} & M_{22} \end{pmatrix} = \prod_{m=1}^N \begin{pmatrix} \cos\delta_m & -\frac{i}{p_m} \sin\delta_m \\ -i p_m \sin\delta_m & \cos\delta_m \end{pmatrix}, \quad r = \frac{p_0 (M_{11} + M_{12} p_s) - (M_{21} + M_{22} p_s)}{p_0 (M_{11} + M_{12} p_s) + (M_{21} + M_{22} p_s)}"
              />
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setTmmLayers(TMM_PRESET_STACKS[0].layers);
                  setTmmAngleDeg(0);
                  setTmmPolarization('unpolarized');
                }}
              >
                <RotateCcw size={15} /> Reset Stack
              </button>
              <button
                type="button"
                className="button primary"
                onClick={copyTmmResults}
              >
                <Copy size={15} /> {tmmCopied ? 'Copied summary!' : 'Copy summary'}
              </button>
            </div>
          </section>

          {/* RESULTS PANEL */}
          <section className="panel" aria-labelledby="tmm-results-heading">
            <h2 id="tmm-results-heading">TMM Optical Response & Colorimetry</h2>

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
                  backgroundColor: tmmResult.colorHex,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid var(--line)',
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {tmmResult.colorHex}
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CIE 1931 D65 Visual Color Rendering
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                  Perceived Reflected Color: {tmmResult.colorHex}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  Tristimulus (X, Y, Z):{' '}
                  <code style={{ fontFamily: 'var(--font-mono)' }}>
                    ({tmmResult.tristimulus.X.toFixed(2)}, {tmmResult.tristimulus.Y.toFixed(2)}, {tmmResult.tristimulus.Z.toFixed(2)})
                  </code>
                </div>
              </div>
            </div>

            {/* Key Optical Metrics Grid */}
            <div className="metric-grid">
              <div className="metric">
                <span>Avg Reflectance R̄</span>
                <strong style={{ color: '#38bdf8' }}>{(tmmResult.avgReflectance * 100).toFixed(1)}%</strong>
              </div>
              <div className="metric">
                <span>Avg Transmittance T̄</span>
                <strong style={{ color: '#4ade80' }}>{(tmmResult.avgTransmittance * 100).toFixed(1)}%</strong>
              </div>
              <div className="metric">
                <span>Avg Absorptance Ā</span>
                <strong style={{ color: '#f87171' }}>{(tmmResult.avgAbsorptance * 100).toFixed(1)}%</strong>
              </div>
              <div className="metric">
                <span>Energy Balance (R+T+A)</span>
                <strong>
                  {((tmmResult.avgReflectance + tmmResult.avgTransmittance + tmmResult.avgAbsorptance) * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            {/* TMM Spectral Chart */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--ink)', margin: 0 }}>
                  Multilayer Optical Spectra (380–780 nm)
                </h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
                    <input
                      type="checkbox"
                      checked={showR}
                      onChange={(e) => setShowR(e.target.checked)}
                    />
                    Reflectance R
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#4ade80' }}>
                    <input
                      type="checkbox"
                      checked={showT}
                      onChange={(e) => setShowT(e.target.checked)}
                    />
                    Transmittance T
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#f87171' }}>
                    <input
                      type="checkbox"
                      checked={showA}
                      onChange={(e) => setShowA(e.target.checked)}
                    />
                    Absorptance A
                  </label>
                </div>
              </div>

              <TmmSpectrumChart
                spectrum={tmmResult.spectrum}
                showR={showR}
                showT={showT}
                showA={showA}
              />
            </div>
          </section>
        </div>
      )}
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

/**
 * Multilayer TMM Spectral Curves (Reflectance, Transmittance, Absorptance)
 */
function TmmSpectrumChart({
  spectrum,
  showR,
  showT,
  showA,
}: {
  spectrum: { wavelengthNm: number; reflectance: number; transmittance: number; absorptance: number }[];
  showR: boolean;
  showT: boolean;
  showA: boolean;
}) {
  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const minX = 380;
  const maxX = 780;
  const maxY = 1.0;

  const getX = (wl: number) => padding.left + ((wl - minX) / (maxX - minX)) * plotW;
  const getY = (val: number) => padding.top + (1 - Math.max(0, Math.min(1, val)) / maxY) * plotH;

  const rPts = spectrum.map((p) => `${getX(p.wavelengthNm).toFixed(1)},${getY(p.reflectance).toFixed(1)}`);
  const tPts = spectrum.map((p) => `${getX(p.wavelengthNm).toFixed(1)},${getY(p.transmittance).toFixed(1)}`);
  const aPts = spectrum.map((p) => `${getX(p.wavelengthNm).toFixed(1)},${getY(p.absorptance).toFixed(1)}`);

  const pathR = `M ${rPts.join(' L ')}`;
  const pathT = `M ${tPts.join(' L ')}`;
  const pathA = `M ${aPts.join(' L ')}`;

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
        aria-label="TMM Optical Response Plot"
      >
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="#1c2b33"
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

        {/* Curves */}
        {showA && (
          <path
            d={pathA}
            fill="none"
            stroke="#f87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {showT && (
          <path
            d={pathT}
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {showR && (
          <path
            d={pathR}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

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
          Intensity Ratio (R, T, A)
        </text>
      </svg>
    </div>
  );
}