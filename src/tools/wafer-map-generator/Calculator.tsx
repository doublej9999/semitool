'use client';

import { useMemo, useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { generateWaferMap, validateWaferMapInputs, type Die, type DieStatus } from '@/lib/wafer';

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
  };

  const counts = useMemo(
    () => dies.reduce<Record<DieStatus, number>>((accumulator, die) => {
      accumulator[die.status] += 1;
      return accumulator;
    }, { Good: 0, Defect: 0, Skip: 0, Edge: 0 }),
    [dies],
  );

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
          <Num label="X offset" value={values.xOffset} unit="mm" onChange={(value) => update('xOffset', value)} min={-1000} />
          <Num label="Y offset" value={values.yOffset} unit="mm" onChange={(value) => update('yOffset', value)} min={-1000} />
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
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>

        {dies.length > 0 ? (
          <>
            <h2>Die inspector</h2>

            <div className="field">
              <label htmlFor="map-die-number">
                Die number<span className="unit">1–{dies.length}</span>
              </label>
              <div className="inline-field">
                <input
                  id="map-die-number"
                  type="number"
                  min={1}
                  max={dies.length}
                  value={lookup}
                  onChange={(event) => setLookup(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      selectByNumber();
                    }
                  }}
                />
                <button className="button secondary" type="button" onClick={selectByNumber}>
                  Select die
                </button>
              </div>
            </div>

            {selected ? (
              <div className="die-info" aria-live="polite">
                <strong>Die #{selected.dieNumber}</strong>
                <br />
                Center: ({selected.centerX.toFixed(2)}, {selected.centerY.toFixed(2)}) mm
                <br />
                Row {selected.row} / Column {selected.column} (1-based grid index, origin at wafer center)
                <br />
                Status: <strong>{selected.status}</strong>
                <div className="action-row">
                  {STATUSES.map((status) => (
                    <button className="button secondary" type="button" key={status} onClick={() => applyStatus(status)}>
                      Set {status}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="note">Click a die on the map, or enter a die number and press Enter, to inspect and reclassify it.</p>
            )}
          </>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="map-preview">
        <h2 id="map-preview">Map preview</h2>

        {dies.length === 0 ? (
          <p className="note">
            {errors.length > 0
              ? 'Fix the highlighted inputs, then generate a map.'
              : 'Set the wafer and die parameters, then generate a map. Die centres outside the effective radius are not placed.'}
          </p>
        ) : (
          <>
            <div className="map-wrap">
              <svg viewBox="0 0 500 500" role="img" aria-label={`Wafer die map with ${dies.length} placed dies`}>
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

            <div className="action-row">
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
                <Trash2 size={14} aria-hidden="true" /> Clear defect statuses
              </button>
            </div>

            <p className="note">
              CSV columns: dieNumber, x, y, row, column, centerX, centerY, status. Coordinates are die centres in
              millimetres relative to the wafer centre.
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
