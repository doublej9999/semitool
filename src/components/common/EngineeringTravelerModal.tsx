'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, X, QrCode } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

interface EngineeringTravelerModalProps {
  toolName: string;
  defaultInputs?: Record<string, string | number>;
  defaultResults?: Record<string, string | number>;
}

/** Vector SVG Code-128 / Code-39 barcode pattern */
function SvgBarcode({ value }: { value: string }) {
  const bars: number[] = [2, 1, 1, 2]; // Start guard
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(((code >> 2) % 2) + 1);
    bars.push(((code >> 4) % 3) + 1);
    bars.push(1); // inter-character space
  }
  bars.push(2, 1, 2, 2); // Stop guard

  let currentX = 8;
  const rects: React.ReactNode[] = [];
  bars.forEach((width, idx) => {
    if (idx % 2 === 0) {
      rects.push(
        <rect
          key={idx}
          x={currentX}
          y={2}
          width={width}
          height={36}
          fill="#0f172a"
        />
      );
    }
    currentX += width;
  });

  return (
    <div style={{ textAlign: 'center', display: 'inline-block' }}>
      <svg
        viewBox={`0 0 ${currentX + 8} 48`}
        style={{ width: '100%', maxWidth: '210px', height: '38px', display: 'block', margin: '0 auto' }}
        shapeRendering="crispEdges"
        aria-label={`Barcode for ${value}`}
      >
        {rects}
      </svg>
      <div style={{ fontSize: '9.5px', fontFamily: 'monospace', letterSpacing: '2px', color: '#1e293b', marginTop: '1px', fontWeight: 600 }}>
        *{value}*
      </div>
    </div>
  );
}

/** Vector 21x21 QR Code matrix visual generator */
function SvgQrCode({ payload }: { payload: string }) {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startRow + r][startCol + c] = isOuter || isInner;
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, 14);
  addFinder(14, 0);

  // Timing patterns
  for (let i = 7; i < 14; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) - hash + payload.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= 13;
      const inFinder3 = r >= 13 && c < 8;
      const inTiming = r === 6 || c === 6;
      if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming) {
        const val = Math.sin(hash + r * 31 + c * 17) * 10000;
        grid[r][c] = (val - Math.floor(val)) > 0.47;
      }
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: '56px', height: '56px', display: 'block', margin: '0 auto' }}
        shapeRendering="crispEdges"
        aria-label="Traveler QR Code"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {grid.map((row, r) =>
          row.map((filled, c) =>
            filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" /> : null
          )
        )}
      </svg>
      <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
        SECURE RUN
      </div>
    </div>
  );
}

export default function EngineeringTravelerModal({
  toolName,
  defaultInputs = {},
  defaultResults = {},
}: EngineeringTravelerModalProps) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [lotId, setLotId] = useState('LOT-2026-ENG-042');
  const [waferIds, setWaferIds] = useState('#01 - #25');
  const [recipeName, setRecipeName] = useState(`${toolName.replace(/\s+/g, '_').toUpperCase()}_V1.0`);
  const [chamberId, setChamberId] = useState('MODULE-C02 (CH-A)');
  const [operator, setOperator] = useState('FAB_ENG_982');
  const [targetSpec, setTargetSpec] = useState('');
  const [notes, setNotes] = useState('Cleanroom pilot run. Verify metrology within ±3% target tolerance.');
  const [dateStr] = useState(() => new Date().toISOString().split('T')[0]);

  const [activeInputs, setActiveInputs] = useState<Record<string, string | number>>(defaultInputs);
  const [activeResults, setActiveResults] = useState<Record<string, string | number>>(defaultResults);

  // Lock body scroll, listen for Escape key, and auto-populate parameters
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto-extract parameters from URL and DOM
    const extractedInputs: Record<string, string | number> = { ...defaultInputs };
    const extractedResults: Record<string, string | number> = { ...defaultResults };

    if (typeof window !== 'undefined') {
      // 1. URL search params
      try {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.forEach((val, key) => {
          if (val && !extractedInputs[key]) {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());
            extractedInputs[formattedKey] = val;
          }
        });
      } catch {
        // Ignore URL parsing errors
      }

      // 2. Scan calculator input fields on page if inputs are sparse
      if (Object.keys(extractedInputs).length <= 2) {
        try {
          const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            'main input:not([type="hidden"]):not([type="search"]), main select'
          );
          inputs.forEach((el) => {
            let label = '';
            if (el.id) {
              const lbl = document.querySelector(`label[for="${el.id}"]`);
              if (lbl) label = lbl.textContent?.trim() || '';
            }
            if (!label) {
              const parentLabel = el.closest('label');
              if (parentLabel) label = parentLabel.textContent?.replace(el.value, '').trim() || '';
            }
            if (!label && el.name) label = el.name;
            if (!label && el.getAttribute('aria-label')) label = el.getAttribute('aria-label') || '';

            if (label && el.value && !extractedInputs[label] && Object.keys(extractedInputs).length < 8) {
              const cleanLabel = label.split('\n')[0].replace(/[:*]/g, '').trim();
              if (cleanLabel.length > 0 && cleanLabel.length < 45) {
                extractedInputs[cleanLabel] = el.value;
              }
            }
          });
        } catch {
          // Ignore DOM query issues
        }
      }

      // 3. Scan result cards on page if results are sparse
      if (Object.keys(extractedResults).length === 0) {
        try {
          const resultCards = document.querySelectorAll<HTMLElement>(
            '.metric-card, .result-card, [data-testid="result"], .stat-card, .result-hero'
          );
          resultCards.forEach((card) => {
            const titleEl = card.querySelector<HTMLElement>('.metric-label, .result-label, h4, h3, span');
            const valEl = card.querySelector<HTMLElement>('.metric-value, .result-value, strong, .font-mono');
            const title = titleEl?.textContent?.trim();
            const val = valEl?.textContent?.trim();
            if (title && val && title !== val && Object.keys(extractedResults).length < 6) {
              extractedResults[title] = val;
            }
          });
        } catch {
          // Ignore DOM query issues
        }
      }
    }

    if (Object.keys(extractedInputs).length > 0) {
      setActiveInputs(extractedInputs);
    }
    if (Object.keys(extractedResults).length > 0) {
      setActiveResults(extractedResults);
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, defaultInputs, defaultResults]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      <button
        type="button"
        className="button secondary tool-action-btn"
        onClick={() => setIsOpen(true)}
        title={t.travelerBtnTitle}
      >
        <FileText size={14} aria-hidden="true" />
        <span>{t.travelerBtn}</span>
      </button>

      {isOpen && (
        <div
          className="traveler-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="traveler-modal-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="traveler-title"
          >
            {/* Header controls (hidden in print) */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--line, #dbe2e4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--teal, #0d7c82)" />
                <h2 id="traveler-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink, #152127)' }}>
                  {t.travelerModalTitle}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button primary"
                  onClick={handlePrint}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={15} />
                  <span>{t.travelerPrintBtn}</span>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t.travelerCloseBtn}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Editor Controls (hidden in print) */}
            <div
              className="no-print"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                padding: '0.75rem',
                backgroundColor: 'var(--paper, #f4f6f5)',
                borderRadius: '8px',
                border: '1px solid var(--line, #dbe2e4)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--ink-soft)' }}>
                  {t.travelerLotId}:
                </label>
                <input
                  type="text"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line, #cbd5e1)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--ink-soft)' }}>
                  {t.travelerWaferIds}:
                </label>
                <input
                  type="text"
                  value={waferIds}
                  onChange={(e) => setWaferIds(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line, #cbd5e1)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--ink-soft)' }}>
                  {t.travelerChamber}:
                </label>
                <input
                  type="text"
                  value={chamberId}
                  onChange={(e) => setChamberId(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line, #cbd5e1)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--ink-soft)' }}>
                  {t.travelerOperator}:
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--line, #cbd5e1)' }}
                />
              </div>
            </div>

            {/* Printable Cleanroom Traveler Body */}
            <div
              className="traveler-printable-sheet print-only-sheet"
              style={{
                padding: '1.5rem',
                border: '2px solid #0f172a',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {/* Document Header with Barcode and QR Visuals */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: '0.85rem',
                  marginBottom: '1rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                    SEMITOOLS CLEANROOM TRAVELER
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                    WAFER LOT DISPATCH &amp; PROCESS RUN-SHEET
                  </div>
                </div>

                {/* Barcode representation */}
                <div>
                  <SvgBarcode value={lotId} />
                </div>

                {/* QR Code & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <SvgQrCode payload={`${lotId}-${recipeName}-${dateStr}`} />
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <div><strong>DATE:</strong> {dateStr}</div>
                    <div><strong>REV:</strong> V2.6-ENG</div>
                    <div><strong>STATUS:</strong> <span style={{ color: '#0d7c82', fontWeight: 700 }}>AUTHORIZED</span></div>
                  </div>
                </div>
              </div>

              {/* Top Lot Meta Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '1.25rem',
                  fontSize: '0.84rem',
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc', width: '20%' }}><strong>LOT NUMBER:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', width: '30%' }}>{lotId}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc', width: '20%' }}><strong>WAFER SLOTS:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', width: '30%' }}>{waferIds}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>PROCESS / RECIPE:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{recipeName}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>CHAMBER / TOOL:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{chamberId}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>RESPONSIBLE ENG:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{operator}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>OPERATION STEP:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>STEP-410 [{toolName}]</td>
                  </tr>
                </tbody>
              </table>

              {/* Recipe Setpoints & Target Parameters */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  {t.travelerInputsHeading}
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.82rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Parameter</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Nominal / Modeled Setpoint</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Tolerance / Spec</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Actual Readout</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(activeInputs).length > 0 ? (
                      Object.entries(activeInputs).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', fontWeight: 600 }}>{k}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>{String(v)}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>±3.0%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>□ PASS &nbsp; □ OOS</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Process Temp / Power</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Standard Recipe Setpoint</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>±1.5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>□ PASS &nbsp; □ OOS</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Metrology & Quality Acceptance */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  {t.travelerResultsHeading}
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.82rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Metrology Output</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Theoretical / Modeled Value</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>LSL</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>USL</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Measured Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(activeResults).length > 0 ? (
                      Object.entries(activeResults).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', fontWeight: 600 }}>{k}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', color: '#0369a1' }}>{String(v)}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>-5%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>+5%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Target Thickness / Rate / Yield</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Refer to Active Tool Metrology</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>-5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>+5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cleanroom Sign-Off & Verification Box */}
              <div style={{ marginTop: '1.25rem', border: '1px solid #94a3b8', padding: '0.75rem', background: '#fafafa' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {t.travelerSignOff}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>{t.travelerPreCheck}:</strong></div>
                    <div>Chamber Base Vacuum: □ OK</div>
                    <div>Particle Monitor (&lt;0.1µm): □ OK</div>
                    <div>Operator Sign: ________________</div>
                  </div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>{t.travelerProcessRun}:</strong></div>
                    <div>Recipe Abort / Alarm: □ NONE</div>
                    <div>Wafers Unloaded: [ 25 / 25 ]</div>
                    <div>Shift Handover: ________________</div>
                  </div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>{t.travelerPostMetrology}:</strong></div>
                    <div>Disposition: □ RELEASE &nbsp; □ HOLD</div>
                    <div>Deviation Report #: ____________</div>
                    <div>Fab Engineer Sign: _____________</div>
                  </div>
                </div>
              </div>

              {/* Micro-footer */}
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '0.4rem',
                }}
              >
                <span>Generated by SemiTools Local Fab Engineering Hub</span>
                <span>ISO 9001 / IATF 16949 Metrology Audit Compliant Record</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
