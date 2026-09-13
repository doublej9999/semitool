
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  CURRENT_UNITS,
  LENGTH_UNITS,
  VOLTAGE_UNITS,
  calculateSheetResistance,
  convertSheetAndResistivity,
  type CurrentUnit,
  type LengthUnit,
  type VoltageUnit,
} from '@/lib/sheet-resistance';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

type Mode = 'probe' | 'convert';

type ProbeState = {
  spacing: string;
  spacingUnit: LengthUnit;
  currentValue: string;
  currentUnit: CurrentUnit;
  voltage: string;
  voltageUnit: VoltageUnit;
  thickness: string;
  thicknessUnit: LengthUnit;
};

type ConvertState = {
  sheetResistance: string;
  resistivity: string;
  thickness: string;
  thicknessUnit: LengthUnit;
};

const INITIAL_PROBE: ProbeState = {
  spacing: '1',
  spacingUnit: 'mm',
  currentValue: '1',
  currentUnit: 'mA',
  voltage: '100',
  voltageUnit: 'mV',
  thickness: '100',
  thicknessUnit: 'nm',
};

const INITIAL_CONVERT: ConvertState = {
  sheetResistance: '100',
  resistivity: '',
  thickness: '100',
  thicknessUnit: 'nm',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Switches to exponential notation only when a fixed-point number stops being readable. */
function fmt(value: number, significant = 4): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(3);
  return Number(value.toPrecision(significant + 2)).toString();
}

function UnitSelect<T extends string>({
  label,
  value,
  units,
  onChange,
}: {
  label: string;
  value: T;
  units: readonly T[];
  onChange: (unit: T) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      style={{ flex: '0 0 auto', width: 'auto' }}
    >
      {units.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </select>
  );
}

function Measurement<T extends string>({
  id,
  label,
  value,
  unit,
  units,
  onValue,
  onUnit,
}: {
  id: string;
  label: string;
  value: string;
  unit: T;
  units: readonly T[];
  onValue: (value: string) => void;
  onUnit: (unit: T) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="inline-field">
        <input id={id} type="number" min="0" step="any" value={value} onChange={(event) => onValue(event.target.value)} />
        <UnitSelect label={`${label} unit`} value={unit} units={units} onChange={onUnit} />
      </div>
    </div>
  );
}

export default function SheetResistanceCalculator() {
  const g = useGlossary();
  const [modeState, setModeState] = useState({ mode: 'probe' as Mode });
  useUrlParamsState(modeState, setModeState);
  const mode = modeState.mode;
  const setMode = (next: Mode) => setModeState({ mode: next });
  const [probe, setProbe] = useState<ProbeState>(INITIAL_PROBE);
  useUrlParamsState(probe, setProbe);
  const [convert, setConvert] = useState<ConvertState>(INITIAL_CONVERT);
  useUrlParamsState(convert, setConvert);
  const { copied, copy } = useCopyToClipboard();

  const probeResult = useMemo(
    () =>
      calculateSheetResistance({
        spacing: num(probe.spacing),
        spacingUnit: probe.spacingUnit,
        current: num(probe.currentValue),
        currentUnit: probe.currentUnit,
        voltage: num(probe.voltage),
        voltageUnit: probe.voltageUnit,
        thickness: num(probe.thickness),
        thicknessUnit: probe.thicknessUnit,
      }),
    [probe],
  );

  const convertResult = useMemo(
    () =>
      convertSheetAndResistivity({
        sheetResistance: num(convert.sheetResistance),
        resistivity: num(convert.resistivity),
        thickness: num(convert.thickness),
        thicknessUnit: convert.thicknessUnit,
      }),
    [convert],
  );

  const copyResult = async () => {
    let lines: string[] = [];

    if (mode === 'probe' && probeResult.ok) {
      lines = [
        `Probe spacing: ${probe.spacing} ${probe.spacingUnit}`,
        `Current: ${probe.currentValue} ${probe.currentUnit}`,
        `Voltage: ${probe.voltage} ${probe.voltageUnit}`,
        `Film thickness: ${probe.thickness} ${probe.thicknessUnit}`,
        `Sheet resistance: ${fmt(probeResult.sheetResistance)} ohm/sq`,
        `Resistivity: ${fmt(probeResult.resistivity)} ohm-cm`,
        `Conductivity: ${fmt(probeResult.conductivity)} S/cm`,
        `Thickness / spacing: ${fmt(probeResult.thicknessOverSpacing)}`,
      ];
    }

    if (mode === 'convert' && convertResult.ok) {
      lines = [
        `Film thickness: ${convert.thickness} ${convert.thicknessUnit}`,
        `Sheet resistance: ${fmt(convertResult.sheetResistance)} ohm/sq`,
        `Resistivity: ${fmt(convertResult.resistivity)} ohm-cm`,
        `Conductivity: ${fmt(convertResult.conductivity)} S/cm`,
      ];
    }

    if (lines.length === 0) return;

    await copy(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="sheet-inputs">
        <h2 id="sheet-inputs">Measurement</h2>

        <div className="field">
          <label htmlFor="sheet-mode">Mode</label>
          <select id="sheet-mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
            <option value="probe">Four-point probe measurement</option>
            <option value="convert">Sheet resistance to resistivity</option>
          </select>
        </div>

        {mode === 'probe' ? (
          <>
            <Measurement
              id="sheet-spacing"
              label={g('probeSpacing')}
              value={probe.spacing}
              unit={probe.spacingUnit}
              units={LENGTH_UNITS}
              onValue={(value) => setProbe((previous) => ({ ...previous, spacing: value }))}
              onUnit={(unit) => setProbe((previous) => ({ ...previous, spacingUnit: unit }))}
            />
            <div className="form-row">
              <Measurement
                id="sheet-current"
                label={g('current')}
                value={probe.currentValue}
                unit={probe.currentUnit}
                units={CURRENT_UNITS}
                onValue={(value) => setProbe((previous) => ({ ...previous, currentValue: value }))}
                onUnit={(unit) => setProbe((previous) => ({ ...previous, currentUnit: unit }))}
              />
              <Measurement
                id="sheet-voltage"
                label={g('voltage')}
                value={probe.voltage}
                unit={probe.voltageUnit}
                units={VOLTAGE_UNITS}
                onValue={(value) => setProbe((previous) => ({ ...previous, voltage: value }))}
                onUnit={(unit) => setProbe((previous) => ({ ...previous, voltageUnit: unit }))}
              />
            </div>
            <Measurement
              id="sheet-thickness"
              label={g('filmThickness')}
              value={probe.thickness}
              unit={probe.thicknessUnit}
              units={LENGTH_UNITS}
              onValue={(value) => setProbe((previous) => ({ ...previous, thickness: value }))}
              onUnit={(unit) => setProbe((previous) => ({ ...previous, thicknessUnit: unit }))}
            />
            <p className="note">
              Enter the current you forced through the outer probes and the voltage you measured across the inner pair.
              The spacing is used to check whether the film is thin enough for the relation being used.
            </p>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="field">
                <label htmlFor="convert-sheet">
                  Sheet resistance<span className="unit">Ω/sq</span>
                </label>
                <input
                  id="convert-sheet"
                  type="number"
                  min="0"
                  step="any"
                  value={convert.sheetResistance}
                  onChange={(event) => setConvert((previous) => ({ ...previous, sheetResistance: event.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="convert-rho">
                  Resistivity<span className="unit">Ω·cm</span>
                </label>
                <input
                  id="convert-rho"
                  type="number"
                  min="0"
                  step="any"
                  value={convert.resistivity}
                  onChange={(event) => setConvert((previous) => ({ ...previous, resistivity: event.target.value }))}
                />
              </div>
            </div>
            <Measurement
              id="convert-thickness"
              label={g('filmThickness')}
              value={convert.thickness}
              unit={convert.thicknessUnit}
              units={LENGTH_UNITS}
              onValue={(value) => setConvert((previous) => ({ ...previous, thickness: value }))}
              onUnit={(unit) => setConvert((previous) => ({ ...previous, thicknessUnit: unit }))}
            />
            <p className="note">Fill in exactly one of the two values; the other one is derived from the thickness.</p>
          </>
        )}

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setProbe(INITIAL_PROBE);
              setConvert(INITIAL_CONVERT);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="sheet-result">
        <h2 id="sheet-result">{mode === 'probe' ? 'Sheet resistance' : 'Converted value'}</h2>

        {mode === 'probe' ? (
          !probeResult.ok ? (
            <div className="error" role="alert">
              {probeResult.errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          ) : (
            <>
              <span className="unit">Sheet resistance</span>
              <div className="result-value" aria-live="polite">
                {fmt(probeResult.sheetResistance)}
                <span className="result-suffix"> Ω/sq</span>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <span>Resistivity</span>
                  <strong>{fmt(probeResult.resistivity)} Ω·cm</strong>
                </div>
                <div className="metric">
                  <span>Conductivity</span>
                  <strong>{fmt(probeResult.conductivity)} S/cm</strong>
                </div>
                <div className="metric">
                  <span>Thickness / spacing</span>
                  <strong>{fmt(probeResult.thicknessOverSpacing)}</strong>
                </div>
                <div className="metric">
                  <span>Thin-film check</span>
                  <strong>{probeResult.thinFilmValid ? 'inside limit' : 'outside limit'}</strong>
                </div>
              </div>

              {probeResult.thinFilmValid ? (
                <p className="note">
                  Thickness / spacing is {fmt(probeResult.thicknessOverSpacing)}, inside the thin-film limit of 0.5, so the
                  two-dimensional relation π / ln 2 × V / I applies.
                </p>
              ) : (
                <p className="note">
                  Thickness / spacing is {fmt(probeResult.thicknessOverSpacing)}, above the thin-film limit of 0.5. The
                  relation used here is not valid for a film that thick, so treat this number as indicative and apply a
                  thickness correction before relying on it.
                </p>
              )}

              <div className="action-row">
                <button className="button primary" type="button" onClick={copyResult}>
                  <Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy result'}
                </button>
              </div>
            </>
          )
        ) : !convertResult.ok ? (
          <div className="error" role="alert">
            {convertResult.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Resistivity</span>
            <div className="result-value" aria-live="polite">
              {fmt(convertResult.resistivity)}
              <span className="result-suffix"> Ω·cm</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Sheet resistance</span>
                <strong>{fmt(convertResult.sheetResistance)} Ω/sq</strong>
              </div>
              <div className="metric">
                <span>Thickness</span>
                <strong>{fmt(convertResult.thicknessCm, 3)} cm</strong>
              </div>
              <div className="metric">
                <span>Conductivity</span>
                <strong>{fmt(convertResult.conductivity)} S/cm</strong>
              </div>
            </div>

            <p className="note">
              Resistivity is the sheet resistance multiplied by the thickness, converted to centimetres so the answer is
              in ohm-centimetres.
            </p>

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy result'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
