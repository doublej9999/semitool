
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  dppmFromFit,
  fractionFailed,
  reliability,
  sigmaFromYield,
  timeToFractionFailures,
  validateLifeTest,
} from '@/lib/reliability';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';

const INITIAL = { failures: '10', devices: '1000', hours: '1000', mission: '8760' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function FitMtbfCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy: copyResult } = useCopyToClipboard();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const failures = num(state.failures);
    const devices = num(state.devices);
    const hours = num(state.hours);
    const mission = num(state.mission);

    const invalid = validateLifeTest({ failures, devices, hours });
    if (invalid) return { ok: false as const, errors: [invalid] };
    if (!Number.isFinite(mission) || mission <= 0) {
      return { ok: false as const, errors: ['The mission time must be greater than 0 hours.'] };
    }

    const base = reliability({ failures, devices, hours });
    const dppm = dppmFromFit(base.fit, mission);
    const failed = fractionFailed(base.fit, mission);
    return {
      ok: true as const,
      ...base,
      mission,
      dppm,
      missionFailedPercent: failed * 100,
      sigma: failed > 0 && failed < 1 ? sigmaFromYield(1 - failed) : null,
      t1: base.failureRate > 0 ? timeToFractionFailures(base.failureRate, 0.01) : Infinity,
      t10: base.failureRate > 0 ? timeToFractionFailures(base.failureRate, 0.1) : Infinity,
    };
  }, [state]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'FIT / MTBF',
      `Device hours = ${fmt(result.deviceHours)}`,
      `Failure rate = ${fmt(result.failureRate)} per hour`,
      `FIT = ${fmt(result.fit)}`,
      result.mtbfHours === Infinity ? 'MTBF = no failures observed' : `MTBF = ${fmt(result.mtbfHours)} h`,
      `MTBF = ${fmt(result.mtbfYears)} years`,
      `DPPM over ${fmt(result.mission)} h = ${fmt(result.dppm)}`,
      `Time to 1% failed = ${fmt(result.t1)} h`,
      `Time to 10% failed = ${fmt(result.t10)} h`,
    ];
  }, [result]);

  const copy = () => {
    void copyResult(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="fit-failures">Failures observed</label>
          <input
            id="fit-failures"
            type="number"
            inputMode="decimal"
            min="0"
            value={state.failures}
            onChange={(event) => update('failures', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fit-devices">Devices on test</label>
          <input
            id="fit-devices"
            type="number"
            inputMode="decimal"
            min="1"
            value={state.devices}
            onChange={(event) => update('devices', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fit-hours">Test duration (hours)</label>
          <input
            id="fit-hours"
            type="number"
            inputMode="decimal"
            min="1"
            value={state.hours}
            onChange={(event) => update('hours', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="fit-mission">Mission time for DPPM (hours)</label>
          <input
            id="fit-mission"
            type="number"
            inputMode="decimal"
            min="1"
            value={state.mission}
            onChange={(event) => update('mission', event.target.value)}
          />
        </div>
        <p className="note">
          The exponential (constant failure rate) model is assumed, which is what FIT and MTBF mean. Real parts have a
          burn-in tail and wear-out, so a rate fitted over one window should not be extrapolated far beyond it.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={copy} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Result</h2>
        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">FIT</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.fit)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Device hours</dt>
                <dd>{fmt(result.deviceHours)}</dd>
              </div>
              <div>
                <dt>Failure rate</dt>
                <dd>{fmt(result.failureRate)} /h</dd>
              </div>
              <div>
                <dt>MTBF</dt>
                <dd>{result.mtbfHours === Infinity ? 'no failures' : `${fmt(result.mtbfHours)} h`}</dd>
              </div>
              <div>
                <dt>MTBF</dt>
                <dd>{result.mtbfHours === Infinity ? '—' : `${fmt(result.mtbfYears)} years`}</dd>
              </div>
              <div>
                <dt>DPPM over {fmt(result.mission)} h</dt>
                <dd>{fmt(result.dppm)}</dd>
              </div>
              <div>
                <dt>Failed by mission</dt>
                <dd>{fmt(result.missionFailedPercent)} %</dd>
              </div>
              <div>
                <dt>Equivalent sigma</dt>
                <dd>{result.sigma === null ? '—' : fmt(result.sigma)}</dd>
              </div>
              <div>
                <dt>Time to 1% failed</dt>
                <dd>{fmt(result.t1)} h</dd>
              </div>
              <div>
                <dt>Time to 10% failed</dt>
                <dd>{fmt(result.t10)} h</dd>
              </div>
            </dl>
            <p className="note">
              FIT is failures per billion device-hours, so FIT = failure rate × 1e9. A life test with no failures gives a
              zero rate and an unbounded MTBF: report it as a lower confidence bound instead of as a number.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
