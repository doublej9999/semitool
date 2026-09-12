'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FilmStackProject,
  FilmLayer,
  SubstrateMaterial,
  SUBSTRATE_CATALOG,
  calculateFilmStackPhysics,
  INDUSTRIAL_STACK_TEMPLATES,
  loadActiveWorkspaceProject,
  saveActiveWorkspaceProject,
  createDefaultFilmStackProject,
} from '@/lib/film-stack';
import { useLocale } from '@/lib/i18n/context';

interface FabWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FabWorkspaceModal({ isOpen, onClose }: FabWorkspaceModalProps) {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  const [project, setProject] = useState<FilmStackProject>(() => createDefaultFilmStackProject());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on initial open
  useEffect(() => {
    if (isOpen) {
      const active = loadActiveWorkspaceProject();
      setProject(active);
      if (active.layers.length > 0) {
        setSelectedLayerId(active.layers[0].id);
      }
    }
  }, [isOpen]);

  // Sync to LocalStorage whenever project updates
  const updateProject = (updater: (prev: FilmStackProject) => FilmStackProject) => {
    setProject((prev) => {
      const next = updater(prev);
      saveActiveWorkspaceProject(next);
      return next;
    });
  };

  const physics = useMemo(() => {
    return calculateFilmStackPhysics(
      project.substrate.material,
      project.substrate.thicknessUm,
      project.waferDiameterMm,
      project.layers,
      project.thermalBudgetHistory
    );
  }, [project]);

  if (!isOpen) return null;

  // Add new layer
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: FilmLayer = {
      id: newId,
      name: `Layer ${project.layers.length + 1}`,
      material: 'SiO2',
      processType: 'cvd',
      thicknessNm: 100,
      residualStressMpa: -150,
      refractiveIndex: 1.46,
      extinctionCoefficient: 0,
      addedAtIsoDate: new Date().toISOString(),
      colorHex: '#38bdf8',
    };

    updateProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));
    setSelectedLayerId(newId);
  };

  // Remove layer
  const handleRemoveLayer = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Move layer up / down
  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.layers.length) return;

    updateProject((prev) => {
      const newLayers = [...prev.layers];
      const temp = newLayers[index];
      newLayers[index] = newLayers[targetIndex];
      newLayers[targetIndex] = temp;
      return { ...prev, layers: newLayers };
    });
  };

  // Update selected layer property
  const handleUpdateSelectedLayer = (updates: Partial<FilmLayer>) => {
    if (!selectedLayerId) return;
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    }));
  };

  // Apply industrial template
  const handleApplyTemplate = (templateKey: string) => {
    const tmpl = INDUSTRIAL_STACK_TEMPLATES[templateKey];
    if (!tmpl) return;

    updateProject((prev) => ({
      ...prev,
      name: tmpl.name,
      description: tmpl.description,
      waferDiameterMm: tmpl.waferDiameterMm,
      substrate: { ...tmpl.substrate },
      layers: tmpl.layers.map((l) => ({ ...l, id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      thermalBudgetHistory: [...tmpl.thermalBudgetHistory],
    }));
    setIsTemplateDropdownOpen(false);
  };

  // Export JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-workspace.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.schemaVersion === '1.0.0' && Array.isArray(parsed.layers)) {
          updateProject(() => parsed);
        } else {
          alert('Invalid project file schema');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse JSON project file');
      }
    };
    reader.readAsText(file);
  };

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--teal, #0d7c82)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}>
                {isZh ? '晶圆工艺堆叠与虚拟工程工作区' : 'Wafer Film Stack & Fab Project Workspace'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #64748b)' }}>
                {isZh ? '统一多层几何厚度、Stoney 综合应力翘曲与热预算跟踪' : 'Unified multi-layer stack, extended Stoney warp & thermal budget ledger'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Template picker */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="button outline"
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              >
                <Sparkles size={14} />
                {isZh ? '预置配方模板' : 'Templates'}
              </button>
              {isTemplateDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: '240px',
                    background: 'var(--card, #ffffff)',
                    border: '1px solid var(--line, #cbd5e1)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('advanced_cmos_gate')}
                  >
                    <strong>28nm HKMG Gate Stack</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>SiO2/HfO2/TiN/Poly-Si</div>
                  </button>
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', borderTop: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('dual_damascene_cu')}
                  >
                    <strong>Cu Damascene BEOL</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>SiCN/Low-k/TaN/Cu</div>
                  </button>
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', borderTop: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('gan_on_si_power')}
                  >
                    <strong>GaN-on-Si Power HEMT</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>AlN/AlGaN/GaN HEMT</div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="button outline"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={handleExportJson}
              title={isZh ? '导出工程文件 (.json)' : 'Export Project JSON'}
            >
              <Download size={14} />
              {isZh ? '导出' : 'Export'}
            </button>

            <button
              type="button"
              className="button outline"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => fileInputRef.current?.click()}
              title={isZh ? '导入工程文件 (.json)' : 'Import Project JSON'}
            >
              <Upload size={14} />
              {isZh ? '导入' : 'Import'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImportJson}
            />

            <button
              type="button"
              className="button secondary"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => updateProject(() => createDefaultFilmStackProject())}
              title={isZh ? '重置工作区' : 'Reset Workspace'}
            >
              <RotateCcw size={14} />
              {isZh ? '重置' : 'Reset'}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                color: 'var(--ink-soft)',
                marginLeft: '0.5rem',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1.2rem', gap: '1.2rem' }}>
          {/* Top Physics Dashboard */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.8rem',
              padding: '0.9rem',
              borderRadius: '8px',
              backgroundColor: 'var(--paper, #f1f5f9)',
              border: '1px solid var(--line, #cbd5e1)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{isZh ? '总薄膜厚度' : 'Total Film Thick.'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal-dark, #0b5e63)' }}>
                {physics.totalFilmThicknessNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                {(physics.totalFilmThicknessNm / 1000).toFixed(3)} µm
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{isZh ? '平均等效应力' : 'Net Avg. Stress'}</div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color:
                    physics.dominantStressRegime === 'tensile'
                      ? 'var(--amber, #d97706)'
                      : physics.dominantStressRegime === 'compressive'
                        ? '#2563eb'
                        : 'var(--ink)',
                }}
              >
                {physics.netAverageStressMpa > 0 ? `+${physics.netAverageStressMpa.toFixed(1)}` : physics.netAverageStressMpa.toFixed(1)}{' '}
                <span style={{ fontSize: '0.8rem' }}>MPa</span>
              </div>
              <div style={{ fontSize: '0.7rem', textTransform: 'capitalize', fontWeight: 600 }}>
                {physics.dominantStressRegime}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{isZh ? '晶圆矢高 / 翘曲' : 'Wafer Bow / Warp'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: Math.abs(physics.waferBowUm) > 60 ? 'var(--red, #dc2626)' : 'var(--ink)' }}>
                {physics.waferBowUm > 0 ? `+${physics.waferBowUm.toFixed(1)}` : physics.waferBowUm.toFixed(1)}{' '}
                <span style={{ fontSize: '0.8rem' }}>µm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                R = {Number.isFinite(physics.radiusOfCurvatureM) ? `${physics.radiusOfCurvatureM.toFixed(1)} m` : '∞'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{isZh ? '特征热扩散长度' : 'Char. Diffusion Length'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                {physics.effectiveDiffusionLengthNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                Σ Dt = {physics.cumulativeDtCm2.toExponential(2)} cm²
              </div>
            </div>
          </div>

          {/* Safety & Focus Warnings */}
          {physics.chuckingWarning && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{physics.chuckingWarning}</div>
            </div>
          )}

          {/* Main Layout: Left = Cross Section Visual + Substrate Info, Right = Layer Table & Editor */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '1.2rem', alignItems: 'start' }}>
            {/* Left Column: Cross Section SVG Visualization */}
            <div
              style={{
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'var(--paper, #f8fafc)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>
                {isZh ? '薄膜层叠剖面图 (Cross-Section)' : 'Layer Cross-Section'}
              </div>

              {/* SVG Cross-section */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  background: '#ffffff',
                  border: '1px solid var(--line, #cbd5e1)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <svg viewBox="0 0 320 220" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                  </defs>

                  {/* Substrate */}
                  <rect x="40" y="140" width="240" height="60" rx="3" fill="url(#subGrad)" />
                  <text x="160" y="175" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                    {SUBSTRATE_CATALOG[project.substrate.material].name}
                  </text>
                  <text x="160" y="190" textAnchor="middle" fill="#e2e8f0" fontSize="10">
                    {project.substrate.thicknessUm} µm | ⌀{project.waferDiameterMm}mm
                  </text>

                  {/* Layers stacked on top */}
                  {project.layers.length === 0 ? (
                    <text x="160" y="100" textAnchor="middle" fill="#94a3b8" fontSize="12" fontStyle="italic">
                      {isZh ? '（暂无薄膜沉积）' : '(No deposited films)'}
                    </text>
                  ) : (
                    (() => {
                      const totalNm = Math.max(1, physics.totalFilmThicknessNm);
                      const maxVisualH = 90; // pixels for all films
                      let currentY = 140;

                      return project.layers.map((layer) => {
                        // allocate proportional height with minimum 12px
                        const layerH = Math.max(12, (layer.thicknessNm / totalNm) * maxVisualH);
                        currentY -= layerH;
                        const isSel = layer.id === selectedLayerId;

                        return (
                          <g
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <rect
                              x="40"
                              y={currentY}
                              width="240"
                              height={layerH}
                              fill={layer.colorHex || '#38bdf8'}
                              stroke={isSel ? '#0d7c82' : '#ffffff'}
                              strokeWidth={isSel ? 2 : 1}
                              opacity={0.9}
                            />
                            <text
                              x="160"
                              y={currentY + layerH / 2 + 3}
                              textAnchor="middle"
                              fill="#0f172a"
                              fontSize="10"
                              fontWeight={isSel ? 'bold' : 'normal'}
                            >
                              {layer.material} ({layer.thicknessNm} nm)
                            </text>
                          </g>
                        );
                      });
                    })()
                  )}
                </svg>
              </div>

              {/* Substrate settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '衬底材料' : 'Substrate Material'}:</span>
                  <select
                    className="select"
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '150px' }}
                    value={project.substrate.material}
                    onChange={(e) => {
                      const mat = e.target.value as SubstrateMaterial;
                      updateProject((prev) => ({
                        ...prev,
                        substrate: {
                          material: mat,
                          thicknessUm: SUBSTRATE_CATALOG[mat].defaultThicknessUm,
                        },
                      }));
                    }}
                  >
                    {Object.values(SUBSTRATE_CATALOG).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {isZh ? sub.nameZh : sub.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '晶圆直径' : 'Wafer Diameter'}:</span>
                  <select
                    className="select"
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '150px' }}
                    value={project.waferDiameterMm}
                    onChange={(e) =>
                      updateProject((prev) => ({
                        ...prev,
                        waferDiameterMm: Number(e.target.value),
                      }))
                    }
                  >
                    {SUBSTRATE_CATALOG[project.substrate.material].standardDiametersMm.map((d) => (
                      <option key={d} value={d}>
                        {d} mm ({(d / 25.4).toFixed(0)} inch)
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '衬底厚度' : 'Substrate Thick.'}:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input"
                      style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '90px' }}
                      value={project.substrate.thicknessUm}
                      onChange={(e) =>
                        updateProject((prev) => ({
                          ...prev,
                          substrate: { ...prev.substrate, thicknessUm: Number(e.target.value) },
                        }))
                      }
                    />
                    <span>µm</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column: Layer List & Layer Property Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Layer List Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  {isZh ? '薄膜工步序列' : 'Film Stack Steps'} ({project.layers.length})
                </div>
                <button
                  type="button"
                  className="button primary"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddLayer}
                >
                  <Plus size={14} />
                  {isZh ? '沉积新薄膜' : 'Add Layer'}
                </button>
              </div>

              {/* Layer Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {project.layers.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                    {isZh ? '当前晶圆尚无薄膜，请点击右上角「沉积新薄膜」或加载预置配方。' : 'No films in stack. Click "+ Add Layer" or pick a template above.'}
                  </div>
                ) : (
                  project.layers.map((layer, idx) => {
                    const isSelected = layer.id === selectedLayerId;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--teal, #0d7c82)' : '1px solid var(--line, #e2e8f0)',
                          backgroundColor: isSelected ? 'var(--teal-soft, rgba(13, 124, 130, 0.08))' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: layer.colorHex || '#38bdf8',
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>
                            {idx + 1}. {layer.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                            [{layer.material}]
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>
                            {layer.thicknessNm} nm
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: layer.residualStressMpa > 0 ? 'var(--amber)' : '#2563eb',
                              fontWeight: 500,
                            }}
                          >
                            {layer.residualStressMpa > 0 ? `+${layer.residualStressMpa}` : layer.residualStressMpa} MPa
                          </span>

                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(idx, 'up');
                              }}
                              disabled={idx === 0}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(idx, 'down');
                              }}
                              disabled={idx === project.layers.length - 1}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === project.layers.length - 1 ? 0.3 : 1 }}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLayer(layer.id);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red, #dc2626)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Layer Detailed Property Editor */}
              {selectedLayer && (
                <div
                  style={{
                    border: '1px solid var(--line, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    backgroundColor: 'var(--paper, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>
                    {isZh ? '选定层工艺与物理参数编辑' : 'Edit Selected Layer Parameters'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '层名称' : 'Layer Name'}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.name}
                        onChange={(e) => handleUpdateSelectedLayer({ name: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '材料配方' : 'Material'}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.material}
                        onChange={(e) => handleUpdateSelectedLayer({ material: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '膜厚 (nm)' : 'Thickness (nm)'}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.thicknessNm}
                        onChange={(e) => handleUpdateSelectedLayer({ thicknessNm: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '固有应力 (MPa)' : 'Stress (MPa)'}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.residualStressMpa}
                        onChange={(e) => handleUpdateSelectedLayer({ residualStressMpa: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '折射率 n (@633nm)' : 'Refractive Index n'}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.refractiveIndex}
                        onChange={(e) => handleUpdateSelectedLayer({ refractiveIndex: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{isZh ? '工艺方法' : 'Process'}</span>
                      <select
                        className="select"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.processType}
                        onChange={(e) => handleUpdateSelectedLayer({ processType: e.target.value as any })}
                      >
                        <option value="thermal_oxidation">Thermal Oxidation</option>
                        <option value="cvd">CVD / PECVD / LPCVD</option>
                        <option value="ald">ALD (Atomic Layer)</option>
                        <option value="plating">Electroplating (ECP)</option>
                        <option value="pvd_sputter">PVD / Sputter</option>
                        <option value="spin_coating">Spin-Coating</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.4rem',
            borderTop: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper, #f8fafc)',
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={15} style={{ color: 'var(--teal)' }} />
            <span>{isZh ? '工作区数据已通过 LocalStorage 自动离线保存。快捷键 Ctrl+W 随时唤出。' : 'Auto-saved to offline local storage. Toggle anytime with Ctrl+W.'}</span>
          </div>

          <button type="button" className="button primary" onClick={onClose}>
            {isZh ? '完成并关闭' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
export { FabWorkspaceModal };
