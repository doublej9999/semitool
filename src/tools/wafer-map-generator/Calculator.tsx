'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, FileText, Upload, Sparkles, AlertTriangle, Layers } from 'lucide-react';
import { generateWaferMap, validateWaferMapInputs, type Die, type DieStatus } from '@/lib/wafer';
import { exportSemiG85, parseSemiG85, analyzeDefectClusters } from '@/lib/wafer-map-g85';
import { parseStdfV4, generateSyntheticStdfV4, type StdfParseSummary } from '@/lib/stdf-parser';
import { parseKlarf, generateSyntheticKlarf, type KlarfSummary } from '@/lib/klarf-parser';
import { downloadSvg } from '@/lib/export';

const INITIAL = { diameter: 300, edge: 3, width: 10, height: 10, xPitch: 10.1, yPitch: 10.1, xOffset: 0, yOffset: 0 };

const STATUSES: DieStatus[] = ['Good', 'Defect', 'Skip', 'Edge'];

const STATUS_COLORS: Record<DieStatus, string> = {
  Good: '#3c9aa4',
  Defect: '#d1625a',
  Skip: '#b4bec4',
  Edge: '#dfa243',
};

function download(filename: string, content: string | Uint8Array, type: string) {
  const blob = new Blob([content as unknown as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function WaferMapGenerator() {
  const [values, setValues] = useState(INITIAL);
  const [dies, setDies] = useState<Die[]>([]);
  const [selected, setSelected] = useState<Die | null>(null);
  const [lookup, setLookup] = useState('');
  
  // Format import state
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [importTab, setImportTab] = useState<'g85' | 'stdf' | 'klarf'>('stdf');
  const [rawTextInput, setRawTextInput] = useState('');
  const [stdfSummary, setStdfSummary] = useState<StdfParseSummary | null>(null);
  const [klarfSummary, setKlarfSummary] = useState<KlarfSummary | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = (key: keyof typeof INITIAL, value: number) => setValues((previous) => ({ ...previous, [key]: value }));

  const errors = useMemo(
    () =>
      validateWaferMapInputs({
        diameter: values.diameter,
        edgeExclusion: values.edge,
        dieWidth: values.width,
        dieHeight: values.height,
        pitchX: values.xPitch,
        pitchY: values.yPitch,
      }),
    [values],
  );

  const generate = () => {
    setSelected(null);
    setStdfSummary(null);
    setKlarfSummary(null);
    setDies(
      generateWaferMap(values.diameter, values.edge, values.width, values.height, values.xPitch, values.yPitch, values.xOffset, values.yOffset),
    );
  };

  const reset = () => {
    setValues(INITIAL);
    setDies([]);
    setSelected(null);
    setLookup('');
    setShowImportDrawer(false);
    setRawTextInput('');
    setStdfSummary(null);
    setKlarfSummary(null);
  };

  const counts = useMemo(
    () => dies.reduce<Record<DieStatus, number>>((accumulator, die) => {
      accumulator[die.status] += 1;
      return accumulator;
    }, { Good: 0, Defect: 0, Skip: 0, Edge: 0 }),
    [dies],
  );

  const defectAnalysis = useMemo(() => analyzeDefectClusters(dies), [dies]);

  const applyStatus = (status: DieStatus) => {
    if (!selected) return;
    const next = { ...selected, status };
    setSelected(next);
    setDies((previous) => previous.map((die) => (die.dieNumber === next.dieNumber ? next : die)));
  };

  const selectByNumber = () => {
    const target = Number.parseInt(lookup, 10);
    const match = dies.find((die) => die.dieNumber === target);
    setSelected(match ?? null);
  };

  const exportCsv = () => {
    const header = 'dieNumber,x,y,row,column,centerX,centerY,status';
    const rows = dies.map((die) =>
      [die.dieNumber, die.x, die.y, die.row, die.column, die.centerX.toFixed(4), die.centerY.toFixed(4), die.status].join(','),
    );
    download('wafer-map.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  };

  const exportJson = () => {
    download('wafer-map.json', JSON.stringify(dies, null, 2), 'application/json');
  };

  const exportSemiG85Text = () => {
    const text = exportSemiG85(dies, stdfSummary?.wrr?.waferId || klarfSummary?.header.waferId || 'WAFER_01', {
      stepX: values.xPitch,
      stepY: values.yPitch,
    });
    download('wafer-map-semi-g85.txt', text, 'text/plain;charset=utf-8');
  };

  // Convert STDF summary into Die[]
  const applyStdfToMap = (summary: StdfParseSummary) => {
    setStdfSummary(summary);
    setKlarfSummary(null);

    const pitchX = summary.wcr?.dieWidthMm || values.xPitch;
    const pitchY = summary.wcr?.dieHeightMm || values.yPitch;

    const newDies: Die[] = summary.parts.map((p, idx) => ({
      dieNumber: idx + 1,
      x: p.xCoord,
      y: p.yCoord,
      row: p.yCoord,
      column: p.xCoord,
      centerX: p.xCoord * pitchX,
      centerY: p.yCoord * pitchY,
      status: p.passed ? 'Good' : 'Defect',
    }));

    setDies(newDies);
    setShowImportDrawer(false);
  };

  // Convert KLARF summary into Die[]
  const applyKlarfToMap = (summary: KlarfSummary) => {
    setKlarfSummary(summary);
    setStdfSummary(null);

    // If dies already exist, mark defective ones
    const defectDieCoords = new Set(summary.defects.map((d) => `${d.xIndex},${d.yIndex}`));

    if (dies.length > 0) {
      const updated = dies.map((d) => {
        if (defectDieCoords.has(`${d.x},${d.y}`) || defectDieCoords.has(`${d.column},${d.row}`)) {
          return { ...d, status: 'Defect' as DieStatus };
        }
        return d;
      });
      setDies(updated);
    } else {
      // Generate grid based on KLARF defects or synthetic layout
      const diameter = summary.header.waferDiameterMm || 300;
      const baseDies = generateWaferMap(diameter, 3, 12, 12, 12, 12, 0, 0);
      const updated = baseDies.map((d) => {
        if (defectDieCoords.has(`${d.x},${d.y}`)) {
          return { ...d, status: 'Defect' as DieStatus };
        }
        return d;
      });
      setDies(updated);
    }
    setShowImportDrawer(false);
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
      centerX: (d.col - parsed.colCount / 2) * values.xPitch,
      centerY: (parsed.rowCount / 2 - d.row) * values.yPitch,
      status: d.status,
    }));

    setDies(importedDies);
    setStdfSummary(null);
    setKlarfSummary(null);
    setShowImportDrawer(false);
  };

  // Load Synthetic Data Presets
  const loadSyntheticStdfPreset = () => {
    const rawBinary = generateSyntheticStdfV4({
      lotId: 'LOT-DEMO-9912',
      waferId: 'W14-ATE',
      dieCount: 160,
      yieldPercent: 86.5,
      waferDiameterMm: values.diameter,
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
            centerX: (d.col - parsed.colCount / 2) * values.xPitch,
            centerY: (parsed.rowCount / 2 - d.row) * values.yPitch,
            status: d.status,
          }));
          setDies(importedDies);
          setStdfSummary(null);
          setKlarfSummary(null);
          setShowImportDrawer(false);
        }
      }
    };
    reader.readAsText(file);
  };

  const mapScale = 470;

  return (
    <div className="layout-two-column">
      <section className="panel" aria-labelledby="map-inputs">
        <h2 id="map-inputs">Wafer geometry</h2>

        <div className="grid">
          <Num label="Wafer diameter" value={values.diameter} unit="mm" onChange={(val) => update('diameter', val)} min={25} />
          <Num label="Edge exclusion" value={values.edge} unit="mm" onChange={(val) => update('edge', val)} min={0} />
        </div>

        <div className="grid">
          <Num label="Die width" value={values.width} unit="mm" onChange={(val) => update('width', val)} min={0.1} />
          <Num label="Die height" value={values.height} unit="mm" onChange={(val) => update('height', val)} min={0.1} />
        </div>

        <div className="grid">
          <Num label="Pitch X" value={values.xPitch} unit="mm" onChange={(val) => update('xPitch', val)} min={0.1} />
          <Num label="Pitch Y" value={values.yPitch} unit="mm" onChange={(val) => update('yPitch', val)} min={0.1} />
        </div>

        <div className="grid">
          <Num label="Offset X" value={values.xOffset} unit="mm" onChange={(val) => update('xOffset', val)} />
          <Num label="Offset Y" value={values.yOffset} unit="mm" onChange={(val) => update('yOffset', val)} />
        </div>

        {errors.length > 0 ? (
          <ul className="field-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <div className="action-row">
          <button className="button primary" type="button" onClick={generate} disabled={errors.length > 0}>
            Generate Wafer Map
          </button>
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setShowImportDrawer(!showImportDrawer)}
          >
            <Upload size={14} aria-hidden="true" /> Native Fab Import
          </button>
        </div>

        {/* Native Fab Format Import Panel (SEMI G85 / STDF V4 / KLARF) */}
        {showImportDrawer && (
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
        )}

        <hr className="divider" />

        <div className="field">
          <label htmlFor="map-lookup">Select die by number</label>
          <div className="input-with-button">
            <input
              id="map-lookup"
              type="number"
              min="1"
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              placeholder="e.g. 1"
            />
            <button className="button secondary" type="button" onClick={selectByNumber}>
              Find
            </button>
          </div>
        </div>

        {selected ? (
          <div className="selected-die-panel">
            <h3>Die #{selected.dieNumber}</h3>
            <p className="note">
              Position: ({selected.x}, {selected.y}) · Centre: ({selected.centerX.toFixed(2)}, {selected.centerY.toFixed(2)}) mm
            </p>
            <div className="status-buttons">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  className={selected.status === status ? 'status-button is-active' : 'status-button'}
                  type="button"
                  style={{ borderColor: STATUS_COLORS[status] }}
                  onClick={() => applyStatus(status)}
                >
                  <span className="legend-swatch" style={{ backgroundColor: STATUS_COLORS[status] }} aria-hidden="true" />
                  {status}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="note">Click a die on the map or type its number above to change its status.</p>
        )}
      </section>

      <section className="panel" aria-labelledby="map-preview">
        <h2 id="map-preview">Wafer map</h2>

        {/* STDF Metadata Banner */}
        {stdfSummary && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 14px',
              background: 'rgba(60, 154, 164, 0.08)',
              border: '1px solid var(--teal)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong>STDF V4 ATE Lot: {stdfSummary.mir?.lotId || 'N/A'}</strong>
              <span style={{ color: 'var(--teal-dark)', fontWeight: '600' }}>
                Wafer ID: {stdfSummary.wrr?.waferId || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--ink-soft)' }}>
              <span>Total Tested: <strong>{stdfSummary.totalParts}</strong></span>
              <span>Yield: <strong style={{ color: stdfSummary.yieldPercent > 80 ? '#1b806a' : '#b0413a' }}>{stdfSummary.yieldPercent.toFixed(1)}%</strong></span>
              <span>Tester: <strong>{stdfSummary.mir?.testerType || 'ATE'}</strong></span>
            </div>
          </div>
        )}

        {/* KLARF Defect Metadata Banner */}
        {klarfSummary && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 14px',
              background: klarfSummary.hasScratches ? 'rgba(209, 98, 90, 0.08)' : 'rgba(223, 162, 67, 0.08)',
              border: `1px solid ${klarfSummary.hasScratches ? '#d1625a' : '#dfa243'}`,
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {klarfSummary.hasScratches && <AlertTriangle size={14} color="#d1625a" />}
                KLARF Defect Inspection: {klarfSummary.header.lotId || 'N/A'} ({klarfSummary.header.waferId || 'W01'})
              </strong>
              <span style={{ fontWeight: '600', color: klarfSummary.hasScratches ? '#b0413a' : '#915a13' }}>
                {klarfSummary.hasScratches ? 'MECHANICAL SCRATCH DETECTED' : 'DEFECT CLUSTERS DETECTED'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--ink-soft)' }}>
              <span>Total Defects: <strong>{klarfSummary.totalDefects}</strong></span>
              <span>Density: <strong>{klarfSummary.defectDensityPerCm2} defects/cm²</strong></span>
              <span>Clusters: <strong>{klarfSummary.clusterCount}</strong></span>
              <span>Tool: <strong>{klarfSummary.header.inspectionStationId || 'Optical'}</strong></span>
            </div>
          </div>
        )}

        {dies.length === 0 ? (
          <p className="note">Set geometry inputs on the left or load a native fab file to begin.</p>
        ) : (
          <>
            <div className="map-wrapper">
              <svg
                ref={svgRef}
                className="wafer-map-svg"
                viewBox="0 0 500 500"
                width="100%"
                height="100%"
                role="img"
                aria-label="Interactive wafer die map"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Wafer die map</title>
                <circle cx="250" cy="250" r="235" fill="#ffffff" stroke="#152127" strokeWidth="2" />
                <circle
                  cx="250"
                  cy="250"
                  r={235 * ((values.diameter / 2 - values.edge) / (values.diameter / 2))}
                  fill="none"
                  stroke="#dfa243"
                  strokeDasharray="5 5"
                />
                {dies.map((die) => {
                  const cx = 250 + (die.centerX / values.diameter) * mapScale;
                  const cy = 250 - (die.centerY / values.diameter) * mapScale;
                  const dieW = (values.width / values.diameter) * mapScale;
                  const dieH = (values.height / values.diameter) * mapScale;

                  return (
                    <rect
                      key={die.dieNumber}
                      x={cx - dieW / 2}
                      y={cy - dieH / 2}
                      width={dieW}
                      height={dieH}
                      fill={STATUS_COLORS[die.status]}
                      stroke="#ffffff"
                      strokeWidth="0.6"
                      onClick={() => {
                        setSelected(die);
                        setLookup(String(die.dieNumber));
                      }}
                      className={selected?.dieNumber === die.dieNumber ? 'map-die is-selected' : 'map-die'}
                    >
                      <title>{`Die #${die.dieNumber} (${die.x}, ${die.y}) — ${die.status}`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>

            <div className="metric-grid" style={{ marginTop: '16px' }}>
              <div className="metric">
                <span>Total dies</span>
                <strong>{dies.length}</strong>
              </div>
              {STATUSES.map((status) => (
                <div className="metric" key={status}>
                  <span>{status} dies</span>
                  <strong>{counts[status]}</strong>
                </div>
              ))}
            </div>

            {/* Defect Cluster Analysis Diagnostics */}
            {defectAnalysis.defectCount > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  background: 'var(--panel-subtle)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
                    Defect Spatial Pattern Analysis
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background:
                        defectAnalysis.patternType === 'clustered'
                          ? 'rgba(209, 98, 90, 0.15)'
                          : defectAnalysis.patternType === 'edge-ring'
                            ? 'rgba(223, 162, 67, 0.15)'
                            : 'rgba(60, 154, 164, 0.15)',
                      color:
                        defectAnalysis.patternType === 'clustered'
                          ? '#b0413a'
                          : defectAnalysis.patternType === 'edge-ring'
                            ? '#915a13'
                            : '#0d7c82',
                    }}
                  >
                    {defectAnalysis.patternType.toUpperCase()} PATTERN
                  </span>
                </div>

                <div className="metric-grid" style={{ marginBottom: '8px' }}>
                  <div className="metric">
                    <span>Clusters</span>
                    <strong>{defectAnalysis.clusterCount}</strong>
                  </div>
                  <div className="metric">
                    <span>Max Cluster Size</span>
                    <strong>{defectAnalysis.largestClusterSize} dies</strong>
                  </div>
                  <div className="metric">
                    <span>Isolated Defects</span>
                    <strong>{defectAnalysis.isolatedDefectCount}</strong>
                  </div>
                  <div className="metric">
                    <span>Clustered Fraction</span>
                    <strong>{defectAnalysis.clusterFractionPercent.toFixed(1)}%</strong>
                  </div>
                </div>

                <p className="note" style={{ margin: 0, color: 'var(--ink-soft)' }}>
                  <strong>Fab Root-Cause Diagnosis:</strong> {defectAnalysis.diagnosis}
                </p>
              </div>
            )}

            <div className="action-row" style={{ marginTop: '16px' }}>
              <button
                className="button secondary"
                type="button"
                onClick={() => svgRef.current && downloadSvg(svgRef.current, 'wafer-map.svg')}
              >
                <Download size={14} aria-hidden="true" /> Save SVG
              </button>
              <button className="button secondary" type="button" onClick={exportSemiG85Text}>
                <FileText size={14} aria-hidden="true" /> Export SEMI G85
              </button>
              <button className="button secondary" type="button" onClick={exportCsv}>
                <Download size={14} aria-hidden="true" /> Export CSV
              </button>
              <button className="button secondary" type="button" onClick={exportJson}>
                <Download size={14} aria-hidden="true" /> Export JSON
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  setDies((previous) => previous.map((die) => (die.status === 'Edge' ? die : { ...die, status: 'Good' })))
                }
              >
                <Trash2 size={14} aria-hidden="true" /> Clear Defects
              </button>
            </div>

            <p className="note">
              Supported industry formats: SEMI G85 ASCII map, ATE Binary STDF V4 (.std/.stdf), and KLA Defect Inspection (.klarf/.001).
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function Num({
  label,
  value,
  unit,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  min?: number;
}) {
  const id = `map-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        <span className="unit">{unit}</span>
      </label>
      <input
        id={id}
        type="number"
        value={Number.isNaN(value) ? '' : value}
        min={min}
        step={0.1}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
      />
    </div>
  );
}
