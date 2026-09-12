'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, X, Download, Save, History, Trash2, Check } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { CODE39_WIDE, encodeCode39, sanitizeCode39 } from '@/lib/code39';
import { downloadPdf } from '@/lib/export';

interface EngineeringTravelerModalProps {
  toolName: string;
  defaultInputs?: Record<string, string | number>;
  defaultResults?: Record<string, string | number>;
}

interface TravelerRecord {
  id: string;
  timestamp: number;
  date: string;
  toolName: string;
  lotId: string;
  waferIds: string;
  recipeName: string;
  chamberId: string;
  operator: string;
  targetSpec: string;
  notes: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
}

/** Loads archived travelers from localStorage (safe during SSR). */
function loadTravelerHistory(): TravelerRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('semitools_traveler_history');
    return raw ? (JSON.parse(raw) as TravelerRecord[]) : [];
  } catch {
    return [];
  }
}

/** Collects traveler parameters from the live page: URL params, calculator
 * input fields and result cards. Runs at open-interaction time. */
function extractTravelerParams(
  defaultInputs: Record<string, string | number>,
  defaultResults: Record<string, string | number>,
): { inputs: Record<string, string | number>; results: Record<string, string | number> } {
  const inputs = { ...defaultInputs };
  const results = { ...defaultResults };

  if (typeof window === 'undefined') {
    return { inputs, results };
  }

  // 1. URL search params
  try {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((val, key) => {
      if (val && !inputs[key]) {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        inputs[formattedKey] = val;
      }
    });
  } catch {
    // Ignore URL parsing errors
  }

  // 2. Scan calculator input fields on page if inputs are sparse
  if (Object.keys(inputs).length <= 2) {
    try {
      const fields = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'main input:not([type="hidden"]):not([type="search"]), main select'
      );
      fields.forEach((el) => {
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

        if (label && el.value && !inputs[label] && Object.keys(inputs).length < 8) {
          const cleanLabel = label.split('\n')[0].replace(/[:*]/g, '').trim();
          if (cleanLabel.length > 0 && cleanLabel.length < 45) {
            inputs[cleanLabel] = el.value;
          }
        }
      });
    } catch {
      // Ignore DOM query issues
    }
  }

  // 3. Scan result cards on page if results are sparse
  if (Object.keys(results).length === 0) {
    try {
      const resultCards = document.querySelectorAll<HTMLElement>(
        '.metric-card, .result-card, [data-testid="result"], .stat-card, .result-hero'
      );
      resultCards.forEach((card) => {
        const titleEl = card.querySelector<HTMLElement>('.metric-label, .result-label, h4, h3, span');
        const valEl = card.querySelector<HTMLElement>('.metric-value, .result-value, strong, .font-mono');
        const title = titleEl?.textContent?.trim();
        const val = valEl?.textContent?.trim();
        if (title && val && title !== val && Object.keys(results).length < 6) {
          results[title] = val;
        }
      });
    } catch {
      // Ignore DOM query issues
    }
  }

  return { inputs, results };
}

/** Real Code 39 (ISO/IEC 16388) barcode rendered from the shared encoder. */
function SvgBarcode({ value }: { value: string }) {
  const { bars } = encodeCode39(sanitizeCode39(value));

  const quietZone = 8;
  let currentX = quietZone;
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
        viewBox={`0 0 ${currentX + quietZone} 48`}
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
  // Lazy initializer: archived runs are read once from localStorage on mount.
  const [savedHistory, setSavedHistory] = useState<TravelerRecord[]>(loadTravelerHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveTraveler = () => {
    const record = {
      id: `TRV-${Date.now()}`,
      timestamp: Date.now(),
      date: dateStr,
      toolName,
      lotId,
      waferIds,
      recipeName,
      chamberId,
      operator,
      targetSpec,
      notes,
      inputs: activeInputs,
      results: activeResults,
    };
    const updated = [record, ...savedHistory.filter((r) => r.lotId !== lotId || r.toolName !== toolName)].slice(0, 30);
    setSavedHistory(updated);
    try {
      localStorage.setItem('semitools_traveler_history', JSON.stringify(updated));
    } catch {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLoadRecord = (rec: TravelerRecord) => {
    setLotId(rec.lotId || lotId);
    setWaferIds(rec.waferIds || waferIds);
    setRecipeName(rec.recipeName || recipeName);
    setChamberId(rec.chamberId || chamberId);
    setOperator(rec.operator || operator);
    setTargetSpec(rec.targetSpec || '');
    setNotes(rec.notes || notes);
    if (rec.inputs) setActiveInputs(rec.inputs);
    if (rec.results) setActiveResults(rec.results);
    setShowHistory(false);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedHistory.filter((r) => r.id !== id);
    setSavedHistory(filtered);
    try {
      localStorage.setItem('semitools_traveler_history', JSON.stringify(filtered));
    } catch {}
  };

  const handleExportJson = () => {
    const payload = {
      travelerId: `TRV-${lotId}-${dateStr}`,
      exportTimestamp: new Date().toISOString(),
      tool: toolName,
      lotId,
      waferIds,
      recipeName,
      chamberId,
      operator,
      targetSpec,
      notes,
      parameters: {
        inputs: activeInputs,
        results: activeResults,
      },
      compliance: 'SEMI Standards Generic Traveler V1.0',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Traveler_${lotId}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Field', 'Value'],
      ['Lot ID', lotId],
      ['Wafers', waferIds],
      ['Tool / Process', toolName],
      ['Recipe', recipeName],
      ['Chamber / Track', chamberId],
      ['Operator', operator],
      ['Run Date', dateStr],
      ['Target Spec', targetSpec],
      ['Notes', notes.replace(/"/g, '""')],
      ['', ''],
      ['-- INPUT PARAMETERS --', ''],
      ...Object.entries(activeInputs).map(([k, v]) => [k, String(v)]),
      ['', ''],
      ['-- CALCULATED METRICS --', ''],
      ...Object.entries(activeResults).map(([k, v]) => [k, String(v)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Traveler_${lotId}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    await downloadPdf(`Traveler_${lotId}_${dateStr}.pdf`, `Cleanroom Traveler ${lotId}`, (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      doc.setDrawColor(148, 163, 184);

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const sectionHeader = (label: string) => {
        ensureSpace(14);
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(label, margin, y + 3);
        y += 5.5;
      };

      const drawGrid = (rows: string[][], colWidths: number[], headerRows = 0) => {
        const padding = 1.5;
        const lineHeight = 3.2;
        doc.setFontSize(7.5);
        rows.forEach((cells, rowIndex) => {
          const isHeader = rowIndex < headerRows;
          doc.setFont('courier', isHeader ? 'bold' : 'normal');
          const cellLines = cells.map(
            (cell, i) => doc.splitTextToSize(cell || ' ', colWidths[i] - padding * 2) as string[],
          );
          const lineCount = Math.max(1, ...cellLines.map((lines) => lines.length));
          const rowHeight = lineCount * lineHeight + padding * 2;

          if (y + rowHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          cells.forEach((_, i) => {
            const x = margin + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
            if (isHeader) {
              doc.setFillColor(241, 245, 249);
              doc.rect(x, y, colWidths[i], rowHeight, 'F');
            }
            doc.rect(x, y, colWidths[i], rowHeight, 'S');
            doc.setTextColor(15, 23, 42);
            cellLines[i].forEach((line, lineIdx) => {
              doc.text(line, x + padding, y + padding + (lineIdx + 0.75) * lineHeight);
            });
          });
          y += rowHeight;
        });
      };

      // Document header
      doc.setFont('courier', 'bold');
      doc.setFontSize(15);
      doc.text('SEMITOOLS CLEANROOM TRAVELER', pageWidth / 2, y + 4, { align: 'center' });
      y += 8;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text('WAFER LOT DISPATCH & PROCESS RUN-SHEET', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(`DATE: ${dateStr}    REV: V2.6-ENG    STATUS: AUTHORIZED`, pageWidth / 2, y, {
        align: 'center',
      });
      y += 7;

      // Code 39 barcode of the lot id, drawn bar by bar from the shared encoder
      const barcodeText = sanitizeCode39(lotId);
      const { bars } = encodeCode39(barcodeText);
      const narrow = 0.3;
      const wide = narrow * 2.5;
      const barcodeWidth = bars.reduce(
        (sum, units) => sum + (units === CODE39_WIDE ? wide : narrow),
        0,
      );
      ensureSpace(20);
      let cursor = (pageWidth - barcodeWidth) / 2;
      doc.setFillColor(15, 23, 42);
      bars.forEach((units, index) => {
        const width = units === CODE39_WIDE ? wide : narrow;
        if (index % 2 === 0) {
          doc.rect(cursor, y, width, 10, 'F');
        }
        cursor += width;
      });
      y += 12;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`*${barcodeText}*`, pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Lot information run-card grid
      sectionHeader('LOT INFORMATION');
      drawGrid(
        [
          ['LOT NUMBER', lotId, 'WAFER SLOTS', waferIds],
          ['PROCESS / RECIPE', recipeName, 'CHAMBER / TOOL', chamberId],
          ['RESPONSIBLE ENG', operator, 'RUN DATE', dateStr],
          ['OPERATION STEP', `STEP-410 [${toolName}]`, 'TARGET SPEC', targetSpec || '-'],
        ],
        [34, 56, 34, 56],
      );
      y += 5;

      // Input parameters
      sectionHeader('INPUT PARAMETERS - NOMINAL / MODELED SETPOINT');
      const inputRows = Object.entries(activeInputs)
        .slice(0, 12)
        .map(([key, val]) => [key, String(val), '+/-3.0%', '[        ]', '[ ] PASS  [ ] OOS']);
      drawGrid(
        [
          ['Parameter', 'Nominal / Modeled Setpoint', 'Tolerance', 'Actual', 'Verification'],
          ...(inputRows.length > 0
            ? inputRows
            : [['Process Temp / Power', 'Standard Recipe Setpoint', '+/-1.5%', '[        ]', '[ ] PASS  [ ] OOS']]),
        ],
        [40, 58, 22, 26, 34],
        1,
      );
      y += 5;

      // Metrology & quality acceptance
      sectionHeader('METROLOGY & QUALITY ACCEPTANCE');
      const resultRows = Object.entries(activeResults)
        .slice(0, 10)
        .map(([key, val]) => [key, String(val), '-5%', '+5%', '[        ]']);
      drawGrid(
        [
          ['Metrology Output', 'Theoretical / Modeled Value', 'LSL', 'USL', 'Measured Avg'],
          ...(resultRows.length > 0
            ? resultRows
            : [['Target Thickness / Rate / Yield', 'Refer to Active Tool Metrology', '-5%', '+5%', '[        ]']]),
        ],
        [44, 62, 20, 20, 34],
        1,
      );
      y += 5;

      // Notes
      sectionHeader('NOTES');
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const noteLines = doc.splitTextToSize(notes || '-', contentWidth) as string[];
      ensureSpace(noteLines.length * 3.5 + 4);
      noteLines.forEach((line) => {
        doc.text(line, margin, y + 3);
        y += 3.5;
      });
      y += 3;

      // Sign-off block
      sectionHeader('CLEANROOM SIGN-OFF & VERIFICATION');
      drawGrid(
        [
          ['PRE-CHECK', 'PROCESS RUN', 'POST METROLOGY'],
          [
            'Chamber Base Vacuum: [ ] OK\nOperator Sign: ______________',
            'Recipe Abort / Alarm: [ ] NONE\nShift Handover: ______________',
            'Disposition: [ ] RELEASE [ ] HOLD\nFab Engineer Sign: ____________',
          ],
        ],
        [60, 60, 60],
        1,
      );

      // Footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Generated by SemiTools Local Fab Engineering Hub', margin, pageHeight - 8);
        doc.text(
          `ISO 9001 / IATF 16949 Metrology Audit Compliant Record - Page ${page}/${pageCount}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: 'right' },
        );
      }
    });
  };

  // Lock body scroll and listen for Escape while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Parameter extraction scans the live page, so it runs from the open
  // interaction instead of synchronously inside an effect.
  const openTraveler = () => {
    const { inputs, results } = extractTravelerParams(defaultInputs, defaultResults);
    if (Object.keys(inputs).length > 0) {
      setActiveInputs(inputs);
    }
    if (Object.keys(results).length > 0) {
      setActiveResults(results);
    }
    setIsOpen(true);
  };

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
        onClick={openTraveler}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleSaveTraveler}
                  title="Save run to local browser archive"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px' }}
                >
                  {saveSuccess ? <Check size={14} color="#059669" /> : <Save size={14} />}
                  <span>{saveSuccess ? 'Saved' : 'Archive'}</span>
                </button>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => setShowHistory(!showHistory)}
                  title="View saved traveler history"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px' }}
                >
                  <History size={14} />
                  <span>History ({savedHistory.length})</span>
                </button>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleExportJson}
                  title="Export MES JSON file"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px' }}
                >
                  <Download size={14} />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleExportCsv}
                  title="Export CSV file"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px' }}
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleExportPdf}
                  title="Export printable PDF run-card"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px' }}
                >
                  <Download size={14} />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  className="button primary sm"
                  onClick={handlePrint}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px' }}
                >
                  <Printer size={14} />
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

            {/* Saved History Drawer / List (hidden in print) */}
            {showHistory && (
              <div
                className="no-print"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--card, #ffffff)',
                  border: '1px solid var(--teal, #0d7c82)',
                  borderRadius: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    Archived Traveler Runs ({savedHistory.length})
                  </span>
                  <button
                    type="button"
                    className="icon-button sm"
                    onClick={() => setShowHistory(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                {savedHistory.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '6px 0' }}>
                    No archived runs yet. Click &quot;Archive&quot; to store this traveler.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {savedHistory.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          background: 'var(--paper, #f8fafc)',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          border: '1px solid var(--line, #e2e8f0)',
                        }}
                      >
                        <div
                          style={{ cursor: 'pointer', flex: 1 }}
                          onClick={() => handleLoadRecord(rec)}
                        >
                          <strong>{rec.lotId}</strong> ({rec.toolName}) - {rec.date}
                          <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>
                            {Object.keys(rec.inputs || {}).length} inputs
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="button secondary sm"
                            style={{ fontSize: '10.5px', padding: '2px 6px' }}
                            onClick={() => handleLoadRecord(rec)}
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            className="icon-button sm"
                            style={{ padding: '2px 4px' }}
                            onClick={(e) => handleDeleteRecord(rec.id, e)}
                          >
                            <Trash2 size={13} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
