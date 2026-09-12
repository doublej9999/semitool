'use client';

import React, { useState, useEffect } from 'react';
import {
  GitFork,
  X,
  Plus,
  Download,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import {
  LotGenealogy,
  createNewLot,
  addStepExecution,
  splitLotBranch,
  generateGenealogyMesJson,
  generateGenealogyCsv,
  evaluateBranchMetrology,
} from '@/lib/lot-genealogy';

interface VirtualGenealogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentToolName?: string;
  currentToolPath?: string;
}

const STORAGE_KEY = 'semitools_lot_genealogy_active';

export function VirtualGenealogyModal({
  isOpen,
  onClose,
  currentToolName,
  currentToolPath,
}: VirtualGenealogyModalProps) {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  const [lot, setLot] = useState<LotGenealogy>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return createNewLot('LOT-W7409-A', 'SOC-N3-GPU', 300, 25, 'FOUP-08');
  });

  const [activeBranchId, setActiveBranchId] = useState<string>('main');
  const [showSplitDialog, setShowSplitDialog] = useState<boolean>(false);
  const [splitNameInput, setSplitNameInput] = useState<string>('');
  const [splitSlotsInput, setSplitSlotsInput] = useState<string>('13-25');
  const [splitNotesInput, setSplitNotesInput] = useState<string>('');

  // Persist lot changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lot));
    }
  }, [lot]);

  // Keep activeBranchId valid
  useEffect(() => {
    if (!lot.branches.some((b) => b.branchId === activeBranchId)) {
      setActiveBranchId(lot.branches[0]?.branchId || 'main');
    }
  }, [lot.branches, activeBranchId]);

  if (!isOpen) return null;

  const currentBranch = lot.branches.find((b) => b.branchId === activeBranchId) || lot.branches[0];
  const branchMetrics = evaluateBranchMetrology(currentBranch);

  const handleCreateNewLot = () => {
    const lotId = prompt(isZh ? '输入新批次号 (Lot ID):' : 'Enter New Lot ID:', `LOT-${Date.now().toString().slice(-5)}`);
    if (!lotId) return;
    const partNo = prompt(isZh ? '输入产品料号 (Part Number):' : 'Enter Device Part Number:', 'N3-TEST-CHIP') || 'DEV-PART';
    const newLot = createNewLot(lotId, partNo, 300, 25);
    setLot(newLot);
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

    const stepName = currentToolName || (isZh ? '当前工艺节点' : 'Current Process Step');
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
      notes: isZh ? '通过 SemiTools 数据总线采集' : 'Captured via SemiTools Data Bus',
    });

    setLot(updated);
  };

  const handleExecuteSplit = () => {
    if (!splitNameInput.trim()) {
      alert(isZh ? '请输入分支名称' : 'Please provide a split branch name');
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
      alert(
        isZh
          ? '所选晶圆编号无效，必须是当前分支的部分晶圆'
          : 'Invalid wafer slot selection. Must be a subset of wafers currently in this branch.'
      );
      return;
    }

    try {
      const updated = splitLotBranch(lot, activeBranchId, splitNameInput, slots, splitNotesInput);
      setLot(updated);
      setShowSplitDialog(false);
      setSplitNameInput('');
      setSplitNotesInput('');
    } catch (e: any) {
      alert(e?.message || 'Error executing split');
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
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
        className="genealogy-modal-panel card"
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
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
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}>
                {isZh ? '晶圆批次谱系与多工序随工单 (Lot Genealogy)' : 'Virtual Lot Genealogy & Multi-Step Traveler'}
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
              {isZh ? '新建批次' : 'New Lot'}
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
              {isZh ? '工艺分支:' : 'Split Branches:'}
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
                    {b.waferSlots.length} wfrs
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
              <span>{isZh ? '分批晶圆 (Split)' : 'Split Wafers'}</span>
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
            <span>{isZh ? '记录当前计算器工序' : 'Log Active Tool as Step'}</span>
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
              {isZh ? '包含晶圆槽位:' : 'Assigned Wafers:'}
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
              {isZh ? '已执行工序:' : 'Steps:'} <strong>{branchMetrics.totalSteps}</strong>
            </span>
            <span>
              {isZh ? '量测合格率:' : 'Metrology Pass:'}{' '}
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
                {isZh ? '创建分批分支 (DoE Split)' : 'Create Wafer Split Branch'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--ink-soft, #64748b)' }}>
                    {isZh ? '分批名称 (Split Name)' : 'Split Name'}:
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
                    {isZh ? '晶圆槽位 (Wafers, 如 13-25 或 13,14,15)' : 'Wafer Slots (e.g. 13-25)'}:
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
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={handleExecuteSplit}
                  className="button primary sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {isZh ? '确认分批' : 'Confirm Split'}
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
                {isZh ? '该分支尚无工序执行记录' : 'No Process Steps Recorded Yet'}
              </div>
              <div style={{ fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto 1.2rem' }}>
                {isZh
                  ? '点击右上角“记录当前计算器工序”，将当前界面的工艺参数与量测结果永久写入随工单。'
                  : 'Click "Log Active Tool as Step" above to link the current calculator parameters directly into the lot run-card.'}
              </div>
              <button onClick={handleRecordCurrentStep} className="button primary sm" style={{ fontSize: '0.8rem' }}>
                {isZh ? '记录第一道工序' : 'Record Initial Step'}
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
                          {isZh ? '工艺配方参数 (Recipe)' : 'Recipe Parameters'}:
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
                          {isZh ? '在机量测数据 (In-line Metrology)' : 'Metrology Verification'}:
                        </div>
                        {step.metrologyResults.map((m, mIdx) => (
                          <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft, #475569)' }}>
                            <span>{m.parameter}:</span>
                            <strong style={{ color: m.usl && m.measured > m.usl ? '#dc2626' : 'var(--ink, #0f172a)' }}>
                              {m.measured} {m.unit}
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
      </div>
    </div>
  );
}

export default VirtualGenealogyModal;
