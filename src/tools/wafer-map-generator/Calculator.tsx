'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, FileText, Upload } from 'lucide-react';
import { generateWaferMap, validateWaferMapInputs, type Die, type DieStatus } from '@/lib/wafer';
import { exportSemiG85, parseSemiG85, analyzeDefectClusters } from '@/lib/wafer-map-g85';
import { downloadSvg } from '@/lib/export';

const INITIAL = { diameter: 300, edge: 3, width: 10, height: 10, xPitch: 10.1, yPitch: 10.1, xOffset: 0, yOffset: 0 };

const STATUSES: DieStatus[] = ['Good', 'Defect', 'Skip', 'Edge'];

const STATUS_COLORS: Record<DieStatus, string> = {
  Good: '#3c9aa4',
  Defect: '#d1625a',
  Skip: '#b4bec4',
  Edge: '#dfa243',
};

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
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
  const [showG85Import, setShowG85Import] = useState(false);
  const [g85InputText, setG85InputText] = useState('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = (key: keyof typeof INITIAL, value: number) => setValues((previous) => ({ ...previous, [key]: value }));

  // Validation is shown before generating so an impossible geometry explains
  // itself instead of rendering an empty map.
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
    setDies(
      generateWaferMap(values.diameter, values.edge, values.width, values.height, values.xPitch, values.yPitch, values.xOffset, values.yOffset),
    );
  };

  const reset = () => {
    setValues(INITIAL);
    setDies([]);
    setSelected(null);
    setLookup('');
    setShowG85Import(false);
    setG85InputText('');
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
    if (!selected) {
      return;
    }

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
    const text = exportSemiG85(dies, 'WAFER_01', {
      stepX: values.xPitch,
      stepY: values.yPitch,
    });
    download('wafer-map-semi-g85.txt', text, 'text/plain;charset=utf-8');
  };

  const handleImportG85 = () => {
    if (!g85InputText.trim()) return;
    const parsed = parseSemiG85(g85InputText);
    if (parsed.dies.length === 0) return;

    // Map parsed dies to Die structure
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
    setShowG85Import(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setG85InputText(content);
        const parsed = parseSemiG85(content);
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
        }
      }
    };
    reader.readAsText(file);
  };

  const mapScale = 470;

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="map-inputs">
        <h2 id="map-inputs">Map inputs</h2>

        <Num label="Wafer diameter" value={values.diameter} unit="mm" onChange={(value) => update('diameter', value)} />

        <Num label="Edge exclusion" value={values.edge} unit="mm" onChange={(value) => update('edge', value)} />

        <div className="form-row">
          <Num label="Die width" value={values.width} unit="mm" onChange={(value) => update('width', value)} />
          <Num label="Die height" value={values.height} unit="mm" onChange={(value) => update('height', value)} />
        </div>

        <div className="form-row">
          <Num label="X pitch" value={values.xPitch} unit="mm" onChange={(value) => update('xPitch', value)} />
          <Num label="Y pitch" value={values.yPitch} unit="mm" onChange={(value) => update('yPitch', value)} />
        </div>

        <div className="form-row">
          <Num label="X offset" value={values.xOffset} unit="mm" onChange={(value) => update('xOffset', value)} />
          <Num label="Y offset" value={values.yOffset} unit="mm" onChange={(value) => update('yOffset', value)} />
        </div>

        {errors.length > 0 ? (
          <div className="error" role="alert">
            {errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : null}

        <div className="action-row">
          <button className="button primary" type="button" onClick={generate} disabled={errors.length > 0}>
            Generate wafer map
          </button>
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setShowG85Import(!showG85Import)}
          >
            <Upload size={14} aria-hidden="true" /> SEMI G85 Import
          </button>
        </div>

        {showG85Import && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--panel-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>SEMI G85 ASCII Map Import</h3>
            <p className="note" style={{ marginBottom: '8px' }}>
              Paste standard SEMI G85 ASCII wafer map or select a map file (.txt / .g85).
            </p>
            <textarea
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              placeholder="WAFER_ID:W01&#10;MAP_DATA:&#10;...000100...&#10;...001100..."
              value={g85InputText}
              onChange={(e) => setG85InputText(e.target.value)}
            />
            <div className="action-row" style={{ marginTop: '8px' }}>
              <button type="button" className="button primary" onClick={handleImportG85}>
                Parse & Load Map
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.g85,.map,.csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
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

        {dies.length === 0 ? (
          <p className="note">Set geometry inputs on the left and click &quot;Generate wafer map&quot; to begin.</p>
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
                      <title>{`Die #${die.dieNumber} — ${die.status}`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>

            <ul className="map-legend">
              {STATUSES.map((status) => (
                <li key={status}>
                  <span className="legend-swatch" style={{ backgroundColor: STATUS_COLORS[status] }} aria-hidden="true" />
                  {status}
                </li>
              ))}
            </ul>

            <div className="metric-grid">
              <div className="metric">
                <span>Placed dies</span>
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
                <Trash2 size={14} aria-hidden="true" /> Clear defects
              </button>
            </div>

            <p className="note">
              CSV columns: dieNumber, x, y, row, column, centerX, centerY, status. SEMI G85 format supports direct fab wafer prober map integration.
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
      <input id={id} type="number" min={min} step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
