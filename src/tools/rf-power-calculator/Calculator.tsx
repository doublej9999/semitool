
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  voltsRmsFromWatts,
  vrmsToVpp,
  vrmsToVpeak,
  wattsFrom,
  wattsFromVoltsRms,
  wattsToDbm,
  wattsToDbw,
  type PowerUnit,
} from '@/lib/power';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

type Mode = 'power' | 'voltage';

const POWER_INPUTS: { id: PowerUnit; label: string }[] = [
  { id: 'dBm', label: 'dBm' },
  { id: 'dBW', label: 'dBW' },
  { id: 'W', label: 'W' },
  { id: 'mW', label: 'mW' },
];

const VOLTAGE_INPUTS = [
  { id: 'vrms', label: 'V RMS', toRms: (value: number) => value },
  { id: 'vpeak', label: 'V peak', toRms: (value: number) => value / Math.SQRT2 },
  { id: 'vpp', label: 'V peak-to-peak', toRms: (value: number) => value / (2 * Math.SQRT2) },
];

const IMPEDANCES = [50, 75, 600];

const INITIAL = { mode: 'power' as Mode, value: '0', powerUnit: 'dBm' as PowerUnit, voltageUnit: 'vrms', impedance: '50' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function RfPowerCalculator() {
  const g = useGlossary();
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const ohms = num(state.impedance);

  const result = useMemo(() => {
    const raw = num(state.value);
    if (!Number.isFinite(raw)) return { ok: false as const, errors: ['Enter a value to convert.'] };
    if (!Number.isFinite(ohms) || ohms <= 0) {
      return { ok: false as const, errors: ['System impedance must be greater than 0 Ω.'] };
    }

    let watts: number;
    if (state.mode === 'power') {
      watts = wattsFrom(raw, state.powerUnit);
    } else {
      const entry = VOLTAGE_INPUTS.find((item) => item.id === state.voltageUnit) ?? VOLTAGE_INPUTS[0];
      watts = wattsFromVoltsRms(entry.toRms(raw), ohms);
    }
    if (watts < 0) return { ok: false as const, errors: ['Power cannot be negative.'] };

    const vrms = voltsRmsFromWatts(watts, ohms);
    return {
      ok: true as const,
      watts,
      milliwatts: watts * 1e3,
      dbm: wattsToDbm(watts),
      dbw: wattsToDbw(watts),
      vrms,
      vpeak: vrmsToVpeak(vrms),
      vpp: vrmsToVpp(vrms),
      ohms,
    };
  }, [state.mode, state.value, state.powerUnit, state.voltageUnit, ohms]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'RF power',
      `Impedance = ${fmt(result.ohms)} Ω`,
      `Power = ${fmt(result.watts)} W = ${fmt(result.milliwatts)} mW`,
      `Level = ${fmt(result.dbm)} dBm = ${fmt(result.dbw)} dBW`,
      `Voltage = ${fmt(result.vrms)} V RMS = ${fmt(result.vpeak)} V peak = ${fmt(result.vpp)} V peak-to-peak`,
    ];
  }, [result]);

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="rf-mode">What do you have?</label>
          <select id="rf-mode" value={state.mode} onChange={(event) => update('mode', event.target.value as Mode)}>
            <option value="power">A power or level (dBm, dBW, W, mW)</option>
            <option value="voltage">A voltage into the load (RMS, peak, peak-to-peak)</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="rf-value">{g('valueLabel2')}</label>
            <input
              id="rf-value"
              type="number"
              inputMode="decimal"
              value={state.value}
              onChange={(event) => update('value', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rf-unit">{g('unitLabel')}</label>
            {state.mode === 'power' ? (
              <select
                id="rf-unit"
                value={state.powerUnit}
                onChange={(event) => update('powerUnit', event.target.value as PowerUnit)}
              >
                {POWER_INPUTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="rf-unit"
                value={state.voltageUnit}
                onChange={(event) => update('voltageUnit', event.target.value)}
              >
                {VOLTAGE_INPUTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="rf-z">System impedance (Ω)</label>
          <input
            id="rf-z"
            type="number"
            inputMode="decimal"
            value={state.impedance}
            onChange={(event) => update('impedance', event.target.value)}
          />
        </div>
        <p className="note">
          Common systems: {IMPEDANCES.join(' Ω, ')} Ω. A 50 Ω system turns 0 dBm (1 mW) into 223.6 mV RMS.
        </p>

        <div className="action-row">
          <button type="button" className="button primary" onClick={() => void copy(lines.join('\n'))} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setState({ ...INITIAL, mode: state.mode })}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>{g('resultLabel')}</h2>
        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Level into {fmt(result.ohms)} Ω</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.dbm)}
              <span className="result-suffix"> dBm</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>{g('powerLabel')}</dt>
                <dd>{fmt(result.watts)} W</dd>
              </div>
              <div>
                <dt>{g('powerLabel')}</dt>
                <dd>{fmt(result.milliwatts)} mW</dd>
              </div>
              <div>
                <dt>Level dBW</dt>
                <dd>{fmt(result.dbw)} dBW</dd>
              </div>
              <div>
                <dt>Voltage RMS</dt>
                <dd>{fmt(result.vrms)} V</dd>
              </div>
              <div>
                <dt>Voltage peak</dt>
                <dd>{fmt(result.vpeak)} V</dd>
              </div>
              <div>
                <dt>Voltage peak-to-peak</dt>
                <dd>{fmt(result.vpp)} V</dd>
              </div>
            </dl>
            <p className="note">
              Sine wave into a real {fmt(result.ohms)} Ω load: V RMS = sqrt(P R), V peak = sqrt(2) x V RMS, V
              peak-to-peak = 2 sqrt(2) x V RMS. Power alone (W, mW, kW, hp and the rest) is in the power converter.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
