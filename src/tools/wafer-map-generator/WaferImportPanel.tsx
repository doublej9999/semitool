'use client';

import { useRef, useState } from 'react';
import { Upload, Sparkles, Layers } from 'lucide-react';
import { generateWaferMap, type Die, type DieStatus } from '@/lib/wafer';
import { parseSemiG85 } from '@/lib/wafer-map-g85';
import { parseStdfV4, generateSyntheticStdfV4, type StdfParseSummary } from '@/lib/stdf-parser';
import { parseKlarf, generateSyntheticKlarf, type KlarfSummary } from '@/lib/klarf-parser';

/**
 * Result of a successful native fab format import. The parent owns the die map
 * and the STDF/KLARF metadata banners, so parsed results flow back through
 * a single callback that also closes the import drawer.
 */
export interface WaferImportPayload {
  dies: Die[];
  stdfSummary: StdfParseSummary | null;
  klarfSummary: KlarfSummary | null;
}

interface WaferImportPanelProps {
  /** Wafer geometry diameter (mm) used to synthesize the demo STDF stream. */
  diameter: number;
  /** Die pitch (mm) used to convert imported coordinates into map geometry. */
  pitchX: number;
  pitchY: number;
  /** Current die map, needed so KLARF defects can be marked onto an existing map. */
  dies: Die[];
  onImport: (payload: WaferImportPayload) => void;
}

/**
 * Native fab format import panel (SEMI G85 / STDF V4 / KLARF 1.2).
 * Lazily loaded by Calculator.tsx via next/dynamic so the binary/text
 * parsers stay out of the initial route bundle.
 */
export default function WaferImportPanel({ diameter, pitchX, pitchY, dies, onImport }: WaferImportPanelProps) {
  const [importTab, setImportTab] = useState<'g85' | 'stdf' | 'klarf'>('stdf');
  const [rawTextInput, setRawTextInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Convert STDF summary into Die[]
  const applyStdfToMap = (summary: StdfParseSummary) => {
    const diePitchX = summary.wcr?.dieWidthMm || pitchX;
    const diePitchY = summary.wcr?.dieHeightMm || pitchY;

    const newDies: Die[] = summary.parts.map((p, idx) => ({
      dieNumber: idx + 1,
      x: p.xCoord,
      y: p.yCoord,
      row: p.yCoord,
      column: p.xCoord,
      centerX: p.xCoord * diePitchX,
      centerY: p.yCoord * diePitchY,
      status: p.passed ? 'Good' : 'Defect',
    }));

    onImport({ dies: newDies, stdfSummary: summary, klarfSummary: null });
  };

  // Convert KLARF summary into Die[]
  const applyKlarfToMap = (summary: KlarfSummary) => {
    // If dies already exist, mark defective ones
    const defectDieCoords = new Set(summary.defects.map((d) => `${d.xIndex},${d.yIndex}`));

    if (dies.length > 0) {
      const updated = dies.map((d) => {
        if (defectDieCoords.has(`${d.x},${d.y}`) || defectDieCoords.has(`${d.column},${d.row}`)) {
          return { ...d, status: 'Defect' as DieStatus };
        }
        return d;
      });
      onImport({ dies: updated, stdfSummary: null, klarfSummary: summary });
    } else {
      // Generate grid based on KLARF defects or synthetic layout
      const klarfDiameter = summary.header.waferDiameterMm || 300;
      const baseDies = generateWaferMap(klarfDiameter, 3, 12, 12, 12, 12, 0, 0);
      const updated = baseDies.map((d) => {
        if (defectDieCoords.has(`${d.x},${d.y}`)) {
          return { ...d, status: 'Defect' as DieStatus };
        }
        return d;
      });
      onImport({ dies: updated, stdfSummary: null, klarfSummary: summary });
    }
  };

  // SEMI G85 import handler
  const handleImportG85 = () => {
    if (!rawTextInput.trim()) return;
    const parsed = parseSemiG85(rawTextInput);
    if (parsed.dies.length === 0) return;

    const importedDies: Die[] = parsed.dies.map((d, index) => ({
      dieNumber: index + 1,
      x: d.col,
      y: d.row,
      row: d.row,
      column: d.col,
      centerX: (d.col - parsed.colCount / 2) * pitchX,
      centerY: (parsed.rowCount / 2 - d.row) * pitchY,
      status: d.status,
    }));

    onImport({ dies: importedDies, stdfSummary: null, klarfSummary: null });
  };

  // Load Synthetic Data Presets
  const loadSyntheticStdfPreset = () => {
    const rawBinary = generateSyntheticStdfV4({
      lotId: 'LOT-DEMO-9912',
      waferId: 'W14-ATE',
      dieCount: 160,
      yieldPercent: 86.5,
      waferDiameterMm: diameter,
    });
    const parsed = parseStdfV4(rawBinary);
    applyStdfToMap(parsed);
  };

  const loadSyntheticKlarfPreset = () => {
    const klarfText = generateSyntheticKlarf({
      lotId: 'LOT-KLA-778',
      waferId: 'W03',
      defectCount: 80,
      includeScratch: true,
    });
    setRawTextInput(klarfText);
    const parsed = parseKlarf(klarfText);
    applyKlarfToMap(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    // STDF Binary file (.std / .stdf)
    if (name.endsWith('.std') || name.endsWith('.stdf')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buf = event.target?.result as ArrayBuffer;
        if (buf) {
          const parsed = parseStdfV4(buf);
          applyStdfToMap(parsed);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Text-based files (SEMI G85, KLARF)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      setRawTextInput(text);

      if (text.includes('FileVersion') || text.includes('DefectList') || text.includes('DefectRecordSpec')) {
        const parsed = parseKlarf(text);
        applyKlarfToMap(parsed);
      } else {
        const parsed = parseSemiG85(text);
        if (parsed.dies.length > 0) {
          const importedDies: Die[] = parsed.dies.map((d, index) => ({
            dieNumber: index + 1,
            x: d.col,
            y: d.row,
            row: d.row,
            column: d.col,
            centerX: (d.col - parsed.colCount / 2) * pitchX,
            centerY: (parsed.rowCount / 2 - d.row) * pitchY,
            status: d.status,
          }));
          onImport({ dies: importedDies, stdfSummary: null, klarfSummary: null });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '14px',
        background: 'var(--panel-subtle)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} /> Fab Metrology & Test Format Importer
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className={`button small ${importTab === 'stdf' ? 'primary' : 'secondary'}`}
            style={{ fontSize: '11px', padding: '2px 8px' }}
            onClick={() => setImportTab('stdf')}
          >
            STDF V4
          </button>
          <button
            type="button"
            className={`button small ${importTab === 'klarf' ? 'primary' : 'secondary'}`}
            style={{ fontSize: '11px', padding: '2px 8px' }}
            onClick={() => setImportTab('klarf')}
          >
            KLARF 1.2
          </button>
          <button
            type="button"
            className={`button small ${importTab === 'g85' ? 'primary' : 'secondary'}`}
            style={{ fontSize: '11px', padding: '2px 8px' }}
            onClick={() => setImportTab('g85')}
          >
            SEMI G85
          </button>
        </div>
      </div>

      {importTab === 'stdf' && (
        <div>
          <p className="note" style={{ marginBottom: '10px' }}>
            Import ATE Automated Test Equipment binary STDF V4 (.std / .stdf) logs containing FAR, MIR, WRR, and PRR die-level test records.
          </p>
          <div className="action-row">
            <button
              type="button"
              className="button primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Select .std / .stdf Binary
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={loadSyntheticStdfPreset}
            >
              <Sparkles size={13} /> Load Synthetic STDF Stream
            </button>
          </div>
        </div>
      )}

      {importTab === 'klarf' && (
        <div>
          <p className="note" style={{ marginBottom: '10px' }}>
            Import KLA defect inspection format (.klarf / .001) with spatial coordinates, defect classification, and scratch line clustering.
          </p>
          <div className="action-row" style={{ marginBottom: '10px' }}>
            <button
              type="button"
              className="button primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Select .klarf / .001 File
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={loadSyntheticKlarfPreset}
            >
              <Sparkles size={13} /> Load Synthetic Scratch KLARF
            </button>
          </div>
          <textarea
            rows={4}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
            placeholder="Paste raw KLARF 1.2 ASCII text or upload file..."
            value={rawTextInput}
            onChange={(e) => setRawTextInput(e.target.value)}
          />
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: '6px' }}
            onClick={() => {
              if (rawTextInput.trim()) {
                const parsed = parseKlarf(rawTextInput);
                applyKlarfToMap(parsed);
              }
            }}
          >
            Parse Text
          </button>
        </div>
      )}

      {importTab === 'g85' && (
        <div>
          <p className="note" style={{ marginBottom: '8px' }}>
            Paste standard SEMI G85 ASCII wafer map or select a map file (.txt / .g85).
          </p>
          <textarea
            rows={5}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '11px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
            placeholder="WAFER_ID:W01&#10;MAP_DATA:&#10;...000100...&#10;...001100..."
            value={rawTextInput}
            onChange={(e) => setRawTextInput(e.target.value)}
          />
          <div className="action-row" style={{ marginTop: '8px' }}>
            <button type="button" className="button primary" onClick={handleImportG85}>
              Parse & Load G85 Map
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload G85 File
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".std,.stdf,.klarf,.kla,.001,.txt,.g85,.map,.csv"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  );
}
