'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  calculateMultilayerOpticalSpectrum,
  calculateOptimalSingleLayerArc,
  OPTICAL_MATERIALS,
  type OpticalLayerConfig,
  type PolarizationMode,
  type OpticalTmmSpectrumResult,
  getMaterialIndexAt,
} from '@/lib/optical-tmm';
import MathFormula from '@/components/tools/MathFormulaClient';

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

/**
 * Multilayer optical TMM solver mode (Abelès transfer matrix).
 * Lazily loaded by Calculator.tsx via next/dynamic; owns all TMM-only state.
 */
export default function TmmMode() {
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
