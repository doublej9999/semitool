'use client';

import { useCallback, useState, useEffect } from 'react';
import { Calculator, X, Copy, Check, Download, Trash2 } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

type Tab = 'converters' | 'scratchpad';

interface FabScratchpadModalProps {
  /** Controlled open state (set by AppShell for the Alt+S shortcut). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FabScratchpadModal({ open, onOpenChange }: FabScratchpadModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = open !== undefined;
  const effectiveOpen = isControlled ? open : isOpen;
  const openModal = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);
  const [activeTab, setActiveTab] = useState<Tab>('converters');

  // Converter states
  // 1. Pressure
  const [pressureVal, setPressureVal] = useState<number>(1);
  const [pressureUnit, setPressureUnit] = useState<'torr' | 'mtorr' | 'pa' | 'mbar' | 'psi'>('torr');

  // 2. Thickness
  const [thicknessVal, setThicknessVal] = useState<number>(100);
  const [thicknessUnit, setThicknessUnit] = useState<'angstrom' | 'nm' | 'um' | 'mil'>('nm');

  // 3. Temperature
  const [tempVal, setTempVal] = useState<number>(25);
  const [tempUnit, setTempUnit] = useState<'C' | 'K' | 'F'>('C');

  // 4. RF Power Density
  const [rfPowerVal, setRfPowerVal] = useState<number>(1500); // Watts
  const [waferDiamMm, setWaferDiamMm] = useState<number>(300);

  // Scratchpad notes
  const [notes, setNotes] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem('semitools_fab_scratchpad') ?? '';
    } catch {
      return '';
    }
  });
  const [copied, setCopied] = useState(false);
  const [quickCalc, setQuickCalc] = useState<string>('');
  const [calcResult, setCalcResult] = useState<string>('');
  const locale = useLocale();
  const t = getTranslation(locale);
  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!effectiveOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveOpen, closeModal]);
  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('semitools_fab_scratchpad', val);
    }
  };

  const handleCopyNotes = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(notes);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fab_notes_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const insertSnippet = (snippet: string) => {
    const next = notes ? `${notes}\n\n${snippet}` : snippet;
    handleNotesChange(next);
  };

  // Safe arithmetic evaluator
  const evaluateCalc = (expr: string) => {
    setQuickCalc(expr);
    try {
      // allow digits, operators, parens, decimal point
      const clean = expr.replace(/[^0-9+\-*/().eE]/g, '');
      if (!clean) {
        setCalcResult('');
        return;
      }
      const res = Function(`"use strict"; return (${clean})`)();
      if (typeof res === 'number' && !Number.isNaN(res) && Number.isFinite(res)) {
        setCalcResult(String(Number(res.toPrecision(7))));
      } else {
        setCalcResult('');
      }
    } catch {
      setCalcResult('');
    }
  };

  // Conversions
  // Pressure to Torr base
  const toTorr = (val: number, unit: string) => {
    switch (unit) {
      case 'torr': return val;
      case 'mtorr': return val / 1000;
      case 'pa': return val / 133.322368;
      case 'mbar': return val * 0.750062;
      case 'psi': return val * 51.7149;
      default: return val;
    }
  };
  const torrBase = toTorr(pressureVal, pressureUnit);
  const convPressure = {
    torr: torrBase,
    mtorr: torrBase * 1000,
    pa: torrBase * 133.322368,
    mbar: torrBase / 0.750062,
    psi: torrBase / 51.7149,
    atm: torrBase / 760,
  };

  // Thickness to nm base
  const toNm = (val: number, unit: string) => {
    switch (unit) {
      case 'angstrom': return val / 10;
      case 'nm': return val;
      case 'um': return val * 1000;
      case 'mil': return val * 25400;
      default: return val;
    }
  };
  const nmBase = toNm(thicknessVal, thicknessUnit);
  const convThickness = {
    angstrom: nmBase * 10,
    nm: nmBase,
    um: nmBase / 1000,
    mil: nmBase / 25400,
    m: nmBase * 1e-9,
  };

  // Temp to Celsius base
  const toCelsius = (val: number, unit: string) => {
    switch (unit) {
      case 'C': return val;
      case 'K': return val - 273.15;
      case 'F': return (val - 32) * (5 / 9);
      default: return val;
    }
  };
  const cBase = toCelsius(tempVal, tempUnit);
  const convTemp = {
    C: cBase,
    K: cBase + 273.15,
    F: (cBase * 9) / 5 + 32,
  };

  // RF Power Density
  const waferAreaCm2 = Math.PI * Math.pow(waferDiamMm / 20, 2);
  const rfDensity = waferAreaCm2 > 0 ? rfPowerVal / waferAreaCm2 : 0;
  const rfDbm = rfPowerVal > 0 ? 10 * Math.log10(rfPowerVal * 1000) : 0;

  return (
    <>
      <button
        type="button"
        className="icon-button fab-scratchpad-trigger"
        aria-label={t.scratchpadBtnTitle}
        title={t.scratchpadBtnTitle}
        onClick={openModal}
      >
        <Calculator size={18} aria-hidden="true" />
      </button>

      {effectiveOpen && (
        <div
          className="scratchpad-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="scratchpad-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scratchpad-title"
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calculator size={20} color="var(--teal, #0d9488)" />
                <h2 id="scratchpad-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                  {t.scratchpadTitle}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => closeModal()}
                aria-label={t.cmdClose}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: 'var(--subtle-bg, #f8fafc)',
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  border: 'none',
                  borderBottom: activeTab === 'converters' ? '2px solid var(--teal, #0d9488)' : '2px solid transparent',
                  background: 'none',
                  fontWeight: activeTab === 'converters' ? 600 : 400,
                  color: activeTab === 'converters' ? 'var(--teal, #0d9488)' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                onClick={() => setActiveTab('converters')}
              >
                {t.scratchpadTabConverters}
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  border: 'none',
                  borderBottom: activeTab === 'scratchpad' ? '2px solid var(--teal, #0d9488)' : '2px solid transparent',
                  background: 'none',
                  fontWeight: activeTab === 'scratchpad' ? 600 : 400,
                  color: activeTab === 'scratchpad' ? 'var(--teal, #0d9488)' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                onClick={() => setActiveTab('scratchpad')}
              >
                {t.scratchpadTabNotes}
              </button>
            </div>

            {/* Content Area */}
            <div className="scratchpad-body">
              {activeTab === 'converters' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Quick Math Inline Evaluator */}
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--subtle-bg, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted, #64748b)', marginBottom: '0.4rem' }}>
                      {t.scratchpadQuickMath}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={t.scratchpadQuickMathPlaceholder}
                        value={quickCalc}
                        onChange={(e) => evaluateCalc(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color, #cbd5e1)',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                        }}
                      />
                      {calcResult && (
                        <div
                          style={{
                            padding: '0.4rem 0.75rem',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            borderRadius: '6px',
                            color: 'var(--teal, #0d9488)',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                          }}
                        >
                          = {calcResult}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. Pressure Converter */}
                  <div className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {t.scratchpadPressureTitle}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="number"
                        value={pressureVal}
                        onChange={(e) => setPressureVal(Number(e.target.value))}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <select
                        value={pressureUnit}
                        onChange={(e) => setPressureUnit(e.target.value as typeof pressureUnit)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      >
                        <option value="torr">Torr</option>
                        <option value="mtorr">mTorr</option>
                        <option value="pa">Pa</option>
                        <option value="mbar">mbar</option>
                        <option value="psi">psi</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--subtle-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                      <div><strong>Torr:</strong> {convPressure.torr.toPrecision(4)}</div>
                      <div><strong>mTorr:</strong> {convPressure.mtorr.toPrecision(4)}</div>
                      <div><strong>Pa:</strong> {convPressure.pa.toPrecision(4)}</div>
                      <div><strong>mbar:</strong> {convPressure.mbar.toPrecision(4)}</div>
                      <div><strong>psi:</strong> {convPressure.psi.toPrecision(4)}</div>
                      <div><strong>atm:</strong> {convPressure.atm.toPrecision(4)}</div>
                    </div>
                  </div>

                  {/* 2. Thickness Converter */}
                  <div className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {t.scratchpadThicknessTitle}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="number"
                        value={thicknessVal}
                        onChange={(e) => setThicknessVal(Number(e.target.value))}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <select
                        value={thicknessUnit}
                        onChange={(e) => setThicknessUnit(e.target.value as typeof thicknessUnit)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      >
                        <option value="angstrom">Å (Angstrom)</option>
                        <option value="nm">nm</option>
                        <option value="um">µm (Micron)</option>
                        <option value="mil">mil</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--subtle-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                      <div><strong>Å:</strong> {convThickness.angstrom.toPrecision(4)}</div>
                      <div><strong>nm:</strong> {convThickness.nm.toPrecision(4)}</div>
                      <div><strong>µm:</strong> {convThickness.um.toPrecision(4)}</div>
                      <div><strong>mil:</strong> {convThickness.mil.toPrecision(4)}</div>
                    </div>
                  </div>

                  {/* 3. RF Power Density */}
                  <div className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {t.scratchpadRfTitle}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.scratchpadRfPower}</label>
                        <input
                          type="number"
                          value={rfPowerVal}
                          onChange={(e) => setRfPowerVal(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                      <div style={{ width: '140px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.scratchpadWaferDiam}</label>
                        <select
                          value={waferDiamMm}
                          onChange={(e) => setWaferDiamMm(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        >
                          <option value={100}>100 mm (4&quot;)</option>
                          <option value={150}>150 mm (6&quot;)</option>
                          <option value={200}>200 mm (8&quot;)</option>
                          <option value={300}>300 mm (12&quot;)</option>
                          <option value={450}>450 mm (18&quot;)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--subtle-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                      <div><strong>Power:</strong> {rfPowerVal} W</div>
                      <div><strong>{t.scratchpadPowerDensity}:</strong> {rfDensity.toFixed(3)} W/cm²</div>
                      <div><strong>RF Level:</strong> {rfDbm.toFixed(1)} dBm</div>
                    </div>
                  </div>

                  {/* 4. Temperature */}
                  <div className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {t.scratchpadTempTitle}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="number"
                        value={tempVal}
                        onChange={(e) => setTempVal(Number(e.target.value))}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <select
                        value={tempUnit}
                        onChange={(e) => setTempUnit(e.target.value as typeof tempUnit)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      >
                        <option value="C">°C (Celsius)</option>
                        <option value="K">K (Kelvin)</option>
                        <option value="F">°F (Fahrenheit)</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--subtle-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                      <div><strong>°C:</strong> {convTemp.C.toFixed(2)} °C</div>
                      <div><strong>K:</strong> {convTemp.K.toFixed(2)} K</div>
                      <div><strong>°F:</strong> {convTemp.F.toFixed(2)} °F</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Scratchpad & Cleanroom Log */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => insertSnippet(`[${new Date().toLocaleTimeString()}] SHIFT LOG: Wafer slots #01-25 loaded into loadlock A.`)}
                    >
                      {t.scratchpadInsertLog}
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => insertSnippet(`LEAK CHECK:\nChamber Base Pressure: 2.4e-7 Torr\nRate of Rise: 0.08 mTorr/min (Spec: <0.20)\nStatus: PASS`)}
                    >
                      + Leak Rate
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => insertSnippet(`SPLIT EXPERIMENT:\nSplit A (POR): Std recipe\nSplit B: Temp +15C\nSplit C: Gas flow +10%`)}
                    >
                      {t.scratchpadInsertSplit}
                    </button>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder={t.scratchpadPlaceholderNotes}
                    style={{
                      flex: 1,
                      minHeight: '260px',
                      padding: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      backgroundColor: 'var(--panel-bg, #ffffff)',
                      color: 'var(--foreground, #1e293b)',
                      resize: 'none',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ fontSize: '0.8rem', color: '#e11d48' }}
                      onClick={() => {
                        if (confirm('Clear scratchpad notes?')) handleNotesChange('');
                      }}
                    >
                      <Trash2 size={13} style={{ marginRight: '0.25rem' }} />
                      {t.scratchpadClearNotes}
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handleCopyNotes}
                      >
                        {copied ? <Check size={13} color="var(--teal)" /> : <Copy size={13} />}
                        <span style={{ marginLeft: '0.25rem' }}>{copied ? t.copied : t.scratchpadCopyNotes}</span>
                      </button>
                      <button
                        type="button"
                        className="button primary"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handleDownloadNotes}
                      >
                        <Download size={13} style={{ marginRight: '0.25rem' }} />
                        {t.scratchpadDownloadTxt}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
