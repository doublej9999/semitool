'use client';

/**
 * Heavy UI for the Fab Film Stack Workspace, lazily loaded by
 * `FabWorkspaceModal` (next/dynamic) so it stays out of every page bundle.
 * Mounts only while the modal is open.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  FileCheck,
  GitBranch,
  Sigma,
} from 'lucide-react';
import {
  FilmStackProject,
  FilmLayer,
  SubstrateMaterial,
  SubstrateProperties,
  SUBSTRATE_CATALOG,
  INDUSTRIAL_STACK_TEMPLATES,
  type LayerProcessType,
  calculateFilmStackPhysics,
  loadActiveWorkspaceProject,
  saveActiveWorkspaceProject,
  createDefaultFilmStackProject,
} from '@/lib/film-stack';
import ModalShell from '@/components/common/ModalShell';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import type { Translations } from '@/lib/i18n/types';
import { useFabSession } from '@/lib/fab-session';

interface FabWorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Substrate display names resolved through the typed dictionaries; unknown ids fall back to the catalog name. */
const FAB_WS_SUBSTRATE_NAME_KEYS: Record<string, keyof Translations> = {
  si100: 'fabWsSubSi100',
  si111: 'fabWsSubSi111',
  sic4h: 'fabWsSubSiC4h',
  gaas: 'fabWsSubGaas',
  sapphire: 'fabWsSubSapphire',
  gan: 'fabWsSubGan',
  fused_silica: 'fabWsSubFusedSilica',
};

function getSubstrateName(sub: SubstrateProperties, t: Translations): string {
  const key = FAB_WS_SUBSTRATE_NAME_KEYS[sub.id];
  return key ? t[key] : sub.name;
}

export default function FabWorkspacePanel({ isOpen, onClose }: FabWorkspacePanelProps) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const { activeLot, lastMetrology } = useFabSession();

  const [project, setProject] = useState<FilmStackProject>(() => createDefaultFilmStackProject());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload from LocalStorage every time the modal opens. React-recommended
  // "adjust state when a prop changes" pattern: track the previous value and
  // adjust state during render instead of inside an effect (avoids the
  // cascading-render cascade flagged by react-hooks/set-state-in-effect).
  // This panel only mounts while the modal is open (the modal wrapper renders
  // it conditionally), so "previous" always starts closed and the very first
  // render performs the load exactly like an open transition.
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const active = loadActiveWorkspaceProject();
      setProject(active);
      if (active.layers.length > 0) {
        setSelectedLayerId(active.layers[0].id);
      }
    }
  }

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

  // Export JSON file
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.substrate && parsed.layers) {
          updateProject(() => parsed);
        }
      } catch (err) {
        console.error('Failed to parse project JSON:', err);
      }
    };
    reader.readAsText(file);
  };

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId) || null;

  const localizedWarpWarning = () => {
    const absBow = Math.abs(physics.waferBowUm);
    if (absBow > 150) {
      return t.fabWsSevereWarp.replace('{bow}', absBow.toFixed(1));
    }
    if (absBow > 60) {
      return t.fabWsModerateWarp.replace('{bow}', absBow.toFixed(1));
    }
    return null;
  };

  const stressRegimeLabel = () => {
    if (physics.dominantStressRegime === 'tensile') return t.fabWsStressTensile;
    if (physics.dominantStressRegime === 'compressive') return t.fabWsStressCompressive;
    return t.fabWsStressNeutral;
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      labelledById="fab-workspace-modal-title"
      className="w-full max-w-[1080px] max-h-[92vh] flex flex-col overflow-hidden rounded-xl bg-[var(--card,#ffffff)] border border-[var(--line,#cbd5e1)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--teal, #0d7c82)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div
                id="fab-workspace-modal-title"
                style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}
              >
                {t.fabWsTitle}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #64748b)' }}>
                {t.fabWsSubtitle}
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
                {t.fabWsTemplates}
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
              title={t.fabWsExportTitle}
            >
              <Download size={14} />
              {t.fabWsExport}
            </button>

            <button
              type="button"
              className="button outline"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => fileInputRef.current?.click()}
              title={t.fabWsImportTitle}
            >
              <Upload size={14} />
              {t.fabWsImport}
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
              title={t.fabWsResetTitle}
            >
              <RotateCcw size={14} />
              {t.fabWsReset}
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
                padding: '0 0.3rem',
                marginLeft: '0.4rem',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Linked context: active lot genealogy + latest metrology import (read-only) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.6rem',
            padding: '0.6rem 1.4rem',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            background: 'var(--card, #ffffff)',
          }}
        >
          <div
            style={{
              border: '1px solid var(--line, #cbd5e1)',
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              backgroundColor: 'var(--paper, #f8fafc)',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--teal-dark, #0b5e63)',
              }}
            >
              <GitBranch size={12} />
              {t.fabWsLinkedLot}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                marginTop: '3px',
                color: activeLot ? 'var(--ink, #0f172a)' : 'var(--ink-soft, #64748b)',
              }}
            >
              {activeLot
                ? `${activeLot.lotId} · ${activeLot.devicePartNumber} · ${t.fabWsBranchesLabel.replace('{count}', String(activeLot.branches.length))}`
                : t.fabWsNoLotLinked}
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--line, #cbd5e1)',
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              backgroundColor: 'var(--paper, #f8fafc)',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--teal-dark, #0b5e63)',
              }}
            >
              <Sigma size={12} />
              {t.fabWsLinkedMetrology}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                marginTop: '3px',
                color: lastMetrology ? 'var(--ink, #0f172a)' : 'var(--ink-soft, #64748b)',
              }}
            >
              {lastMetrology
                ? `${lastMetrology.source} · n=${lastMetrology.totalPoints} · mean=${lastMetrology.mean.toFixed(3)} · σ=${lastMetrology.stdDev.toFixed(3)}`
                : t.fabWsNoMetrology}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Top Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.8rem',
              backgroundColor: 'var(--paper, #f8fafc)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--line, #cbd5e1)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{t.fabWsTotalFilmThick}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal-dark, #0b5e63)' }}>
                {physics.totalFilmThicknessNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                {(physics.totalFilmThicknessNm / 1000).toFixed(3)} µm
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{t.fabWsNetAvgStress}</div>
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
              <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {stressRegimeLabel()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{t.fabWsWaferBowWarp}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: Math.abs(physics.waferBowUm) > 60 ? 'var(--red, #dc2626)' : 'var(--ink)' }}>
                {physics.waferBowUm > 0 ? `+${physics.waferBowUm.toFixed(1)}` : physics.waferBowUm.toFixed(1)}{' '}
                <span style={{ fontSize: '0.8rem' }}>µm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                R = {Number.isFinite(physics.radiusOfCurvatureM) ? `${physics.radiusOfCurvatureM.toFixed(1)} m` : '∞'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{t.fabWsCharDiffLength}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                {physics.effectiveDiffusionLengthNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                Σ Dt = {physics.cumulativeDtCm2.toExponential(2)} cm²
              </div>
            </div>
          </div>

          {/* Safety & Focus Warnings */}
          {localizedWarpWarning() && (
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
              <div>{localizedWarpWarning()}</div>
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
                {t.fabWsLayerCrossSection}
              </div>

              {/* SVG Cross-section */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  background: 'var(--card, #ffffff)',
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
                    {getSubstrateName(SUBSTRATE_CATALOG[project.substrate.material], t)}
                  </text>
                  <text x="160" y="190" textAnchor="middle" fill="#e2e8f0" fontSize="10">
                    {project.substrate.thicknessUm} µm | ⌀{project.waferDiameterMm}mm
                  </text>

                  {/* Layers stacked on top */}
                  {project.layers.length === 0 ? (
                    <text x="160" y="100" textAnchor="middle" fill="#94a3b8" fontSize="12" fontStyle="italic">
                      {t.fabWsNoFilmsVisual}
                    </text>
                  ) : (
                    (() => {
                      const totalNm = Math.max(1, physics.totalFilmThicknessNm);
                      const maxVisualH = 90; // pixels for all films
                      let currentY = 140;

                      return project.layers.map((layer) => {
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
                  <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsSubstrateMaterial}:</span>
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
                        {getSubstrateName(sub, t)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsWaferDiameter}:</span>
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
                  <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsSubstrateThick}:</span>
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
                  {t.fabWsFilmStackSteps} ({project.layers.length})
                </div>
                <button
                  type="button"
                  className="button primary"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddLayer}
                >
                  <Plus size={14} />
                  {t.fabWsAddLayer}
                </button>
              </div>

              {/* Layer Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {project.layers.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                    {t.fabWsEmptyStackPrompt}
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
                    {t.fabWsEditLayerParams}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsLayerName}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.name}
                        onChange={(e) => handleUpdateSelectedLayer({ name: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsMaterial}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.material}
                        onChange={(e) => handleUpdateSelectedLayer({ material: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsThickness}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.thicknessNm}
                        onChange={(e) => handleUpdateSelectedLayer({ thicknessNm: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsStress}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.residualStressMpa}
                        onChange={(e) => handleUpdateSelectedLayer({ residualStressMpa: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsRefractiveIndex}</span>
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
                      <span style={{ color: 'var(--ink-soft)' }}>{t.fabWsProcess}</span>
                      <select
                        className="select"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.processType}
                        onChange={(e) =>
                          handleUpdateSelectedLayer({ processType: e.target.value as LayerProcessType })
                        }
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
            <span>{t.fabWsAutoSavedNotice}</span>
          </div>

          <button type="button" className="button primary" onClick={onClose}>
            {t.fabWsDoneClose}
          </button>
        </div>
    </ModalShell>
  );
}
