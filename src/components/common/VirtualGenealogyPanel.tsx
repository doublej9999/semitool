'use client';

/**
 * Heavy UI for the Virtual Lot Genealogy & Multi-Step Traveler dialog, lazily
 * loaded by `VirtualGenealogyModal` (next/dynamic) so it stays out of every
 * page bundle. Mounts only while the modal is open. All user-facing strings
 * come from the typed i18n dictionaries (`genealogy*` keys) via
 * getTranslation(locale).
 */

import React, { useState } from 'react';
import {
  GitFork,
  X,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import {
  LotGenealogy,
  createNewLot,
  addStepExecution,
  splitLotBranch,
  generateGenealogyMesJson,
  generateGenealogyCsv,
  evaluateBranchMetrology,
} from '@/lib/lot-genealogy';
import { setActiveLot, useFabSession } from '@/lib/fab-session';
import ModalShell from '@/components/common/ModalShell';

interface VirtualGenealogyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentToolName?: string;
  currentToolPath?: string;
}

const DEFAULT_GENEALOGY_LOT: LotGenealogy = createNewLot('LOT-W7409-A', 'SOC-N3-GPU', 300, 25, 'FOUP-08');

export default function VirtualGenealogyPanel({
  isOpen,
  onClose,
  currentToolName,
  currentToolPath,
}: VirtualGenealogyPanelProps) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const session = useFabSession();
  // Local working copy wins until the next mutation; otherwise follow the unified
  // session (hydrated after mount) and finally the demo lot. Every mutation is
  // written straight through to the session store, which persists to localStorage.
  const [localLot, setLocalLot] = useState<LotGenealogy | null>(null);
  const lot = localLot ?? session.activeLot ?? DEFAULT_GENEALOGY_LOT;
  const updateLot = (next: LotGenealogy): void => {
    setLocalLot(next);
    setActiveLot(next);
  };

  const [activeBranchId, setActiveBranchId] = useState<string>('main');
  const [showSplitDialog, setShowSplitDialog] = useState<boolean>(false);
  const [splitNameInput, setSplitNameInput] = useState<string>('');
  const [splitSlotsInput, setSplitSlotsInput] = useState<string>('13-25');
  const [splitNotesInput, setSplitNotesInput] = useState<string>('');

  // Keep activeBranchId valid when the lot is replaced. React-recommended
  // "adjust state when tracked state changes" pattern: compare against the
  // previous lot during render instead of inside an effect (avoids the
  // cascading renders flagged by react-hooks/set-state-in-effect).
  const [prevLot, setPrevLot] = useState(lot);
  if (prevLot !== lot) {
    setPrevLot(lot);
    if (!lot.branches.some((b) => b.branchId === activeBranchId)) {
      setActiveBranchId(lot.branches[0]?.branchId || 'main');
    }
  }

  if (!isOpen) return null;

  const currentBranch = lot.branches.find((b) => b.branchId === activeBranchId) || lot.branches[0];
  const branchMetrics = evaluateBranchMetrology(currentBranch);

  const handleCreateNewLot = () => {
    const lotId = prompt(t.genealogyPromptLotId, `LOT-${Date.now().toString().slice(-5)}`);
    if (!lotId) return;
    const partNo = prompt(t.genealogyPromptPartNo, 'N3-TEST-CHIP') || 'DEV-PART';
    const newLot = createNewLot(lotId, partNo, 300, 25);
    updateLot(newLot);
    setActiveBranchId('main');
  };

  const handleRecordCurrentStep = () => {
    if (typeof window === 'undefined') return;

    // Harvest active query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });

    const stepName = currentToolName || t.genealogyCurrentProcessStep;
    const path = currentToolPath || window.location.pathname;
    const updated = addStepExecution(lot, activeBranchId, {
      stageName: stepName,
      toolPath: path,
      toolName: stepName,
      recipeId: `RCP-${Math.floor(Math.random() * 900 + 100)}`,
      equipmentId: `EQP-${Math.floor(Math.random() * 90 + 10)}`,
      operatorId: 'OP-CLEANROOM',
      recipeParams: Object.keys(params).length > 0 ? params : { status: 'standard_recipe' },
      metrologyResults: [
        {
          parameter: 'Uniformity / CD',
          nominal: 100,
          measured: Math.round((98 + Math.random() * 4) * 10) / 10,
          usl: 105,
          lsl: 95,
          unit: 'nm',
        },
      ],
      disposition: 'PASS',
      notes: t.genealogyBusNotes,
    });

    updateLot(updated);
  };

  const handleExecuteSplit = () => {
    if (!splitNameInput.trim()) {
      alert(t.genealogyProvideSplitName);
      return;
    }

    // Parse wafer slots
    let slots: number[] = [];
    if (splitSlotsInput.includes('-')) {
      const parts = splitSlotsInput.split('-').map((p) => parseInt(p.trim(), 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        for (let s = Math.min(parts[0], parts[1]); s <= Math.max(parts[0], parts[1]); s++) {
          slots.push(s);
        }
      }
    } else {
      slots = splitSlotsInput
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((s) => !isNaN(s));
    }

    // Filter to slots valid in current branch
    slots = slots.filter((s) => currentBranch.waferSlots.includes(s));

    if (slots.length === 0 || slots.length >= currentBranch.waferSlots.length) {
      alert(t.genealogyInvalidSlots);
      return;
    }

    try {
      const updated = splitLotBranch(lot, activeBranchId, splitNameInput, slots, splitNotesInput);
      updateLot(updated);
      setShowSplitDialog(false);
      setSplitNameInput('');
      setSplitNotesInput('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error executing split');
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = generateGenealogyMesJson(lot);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lot.lotId}_SEMI_E90_Genealogy.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = generateGenealogyCsv(lot);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lot.lotId}_Traveler_History.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      labelledById="virtual-genealogy-modal-title"
      className="genealogy-modal-panel card w-full max-w-[1020px] max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-[var(--card,#ffffff)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
    >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            backgroundColor: 'var(--paper, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(13, 124, 130, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--teal, #0d7c82)',
              }}
            >
              <GitFork size={18} />
            </div>
            <div>
              <div
                id="virtual-genealogy-modal-title"
                style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}
              >
                {t.genealogyModalTitle}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #64748b)' }}>
                {lot.lotId} • {lot.devicePartNumber} • {lot.waferDiameterMm} mm • {lot.totalWafers} Wafers • {lot.carrierFoupId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={handleCreateNewLot}
              className="button secondary sm"
              style={{ fontSize: '0.75rem' }}
            >
              {t.genealogyNewLot}
            </button>
            <button
              onClick={handleDownloadJson}
              className="button secondary sm"
              title="SEMI E90 MES JSON"
              style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Download size={13} />
              <span>JSON</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="button secondary sm"
              title="MES CSV Run-Card"
              style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="button secondary sm"
              title="Print Traveler Run-Card"
              style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Printer size={13} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.3rem',
                color: 'var(--ink-soft, #64748b)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sub-header / Lot Split Branch Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 1.4rem',
            backgroundColor: 'var(--paper, #f1f5f9)',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink-soft, #64748b)' }}>
              {t.genealogySplitBranches}
            </span>
            {lot.branches.map((b) => {
              const isSelected = b.branchId === activeBranchId;
              return (
                <button
                  key={b.branchId}
                  onClick={() => setActiveBranchId(b.branchId)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--teal, #0d7c82)' : '1px solid var(--line, #cbd5e1)',
                    backgroundColor: isSelected ? 'var(--teal, #0d7c82)' : 'var(--card, #ffffff)',
                    color: isSelected ? '#ffffff' : 'var(--ink, #0f172a)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Layers size={12} />
                  <span>{b.splitName}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      opacity: 0.85,
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {b.waferSlots.length} {t.genealogyWafersUnit}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setShowSplitDialog(true)}
              className="button secondary sm"
              style={{
                fontSize: '0.72rem',
                padding: '0.3rem 0.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <GitFork size={12} />
              <span>{t.genealogySplitWafers}</span>
            </button>
          </div>

          <button
            onClick={handleRecordCurrentStep}
            className="button primary sm"
            style={{
              fontSize: '0.76rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Sparkles size={13} />
            <span>{t.genealogyLogActiveTool}</span>
          </button>
        </div>

        {/* Wafer Slots Pill Bar */}
        <div
          style={{
            padding: '0.5rem 1.4rem',
            backgroundColor: 'var(--card, #ffffff)',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--ink-soft, #64748b)', fontWeight: 600 }}>
              {t.genealogyAssignedWafers}
            </span>
            {currentBranch.waferSlots.map((slot) => (
              <span
                key={slot}
                style={{
                  display: 'inline-block',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(13, 124, 130, 0.1)',
                  color: 'var(--teal-dark, #0a5f66)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              >
                {slot}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--ink-soft, #64748b)' }}>
            <span>
              {t.genealogySteps} <strong>{branchMetrics.totalSteps}</strong>
            </span>
            <span>
              {t.genealogyMetrologyPass}{' '}
              <strong style={{ color: branchMetrics.passRate === 100 ? '#059669' : '#d97706' }}>
                {branchMetrics.passRate}%
              </strong>
            </span>
          </div>
        </div>

        {/* Modal Body / Steps Timeline */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.2rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {showSplitDialog && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--paper, #f8fafc)',
                borderRadius: '8px',
                border: '1px solid var(--teal, #0d7c82)',
                marginBottom: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.6rem', color: 'var(--teal-dark, #0a5f66)' }}>
                {t.genealogyCreateSplitTitle}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--ink-soft, #64748b)' }}>
                    {t.genealogySplitNameLabel}
                  </label>
                  <input
                    type="text"
                    value={splitNameInput}
                    onChange={(e) => setSplitNameInput(e.target.value)}
                    placeholder="e.g. Split-1 (High Bias Etch)"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--ink-soft, #64748b)' }}>
                    {t.genealogySplitSlotsLabel}
                  </label>
                  <input
                    type="text"
                    value={splitSlotsInput}
                    onChange={(e) => setSplitSlotsInput(e.target.value)}
                    placeholder="13-25"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button
                  onClick={() => setShowSplitDialog(false)}
                  className="button secondary sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {t.genealogyCancel}
                </button>
                <button
                  onClick={handleExecuteSplit}
                  className="button primary sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {t.genealogyConfirmSplit}
                </button>
              </div>
            </div>
          )}

          {currentBranch.steps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--ink-soft, #64748b)',
              }}
            >
              <GitFork size={36} style={{ opacity: 0.35, margin: '0 auto 0.8rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                {t.genealogyEmptyTitle}
              </div>
              <div style={{ fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto 1.2rem' }}>
                {t.genealogyEmptyDesc}
              </div>
              <button onClick={handleRecordCurrentStep} className="button primary sm" style={{ fontSize: '0.8rem' }}>
                {t.genealogyRecordInitial}
              </button>
            </div>
          ) : (
            currentBranch.steps.map((step, idx) => {
              const isPassed = step.disposition === 'PASS';
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    position: 'relative',
                  }}
                >
                  {/* Step Timeline Line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--teal, #0d7c82)' : '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {step.stepNumber}
                    </div>
                    {idx < currentBranch.steps.length - 1 && (
                      <div
                        style={{
                          width: '2px',
                          flex: 1,
                          backgroundColor: 'var(--line, #e2e8f0)',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>

                  {/* Step Details Card */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--paper, #f8fafc)',
                      border: '1px solid var(--line, #e2e8f0)',
                      borderRadius: '8px',
                      padding: '0.85rem 1.1rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink, #0f172a)' }}>
                          {step.stageName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft, #64748b)', marginLeft: '0.6rem' }}>
                          [{step.recipeId}] • {step.equipmentId} • {step.operatorId}
                        </span>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isPassed ? '#059669' : '#b45309',
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        <span>{step.disposition}</span>
                      </span>
                    </div>

                    {/* Parameters & Metrology Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', fontSize: '0.76rem' }}>
                      <div style={{ backgroundColor: 'var(--card, #ffffff)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--line, #e2e8f0)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--teal-dark, #0a5f66)', marginBottom: '0.3rem' }}>
                          {t.genealogyRecipeParams}
                        </div>
                        {Object.entries(step.recipeParams).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft, #475569)' }}>
                            <span>{k}:</span>
                            <strong style={{ color: 'var(--ink, #0f172a)' }}>{String(v)}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ backgroundColor: 'var(--card, #ffffff)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--line, #e2e8f0)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--teal-dark, #0a5f66)', marginBottom: '0.3rem' }}>
                          {t.genealogyMetrologyVerification}
                        </div>
                        {step.metrologyResults.map((result, rIdx) => (
                          <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft, #475569)' }}>
                            <span>{result.parameter}:</span>
                            <strong style={{ color: result.usl && result.measured > result.usl ? '#dc2626' : 'var(--ink, #0f172a)' }}>
                              {result.measured} {result.unit}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
    </ModalShell>
  );
}
