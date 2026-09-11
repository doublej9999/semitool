'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { stubMatch, stubVerification } from '@/lib/stub';

const INITIAL = {
  z0Ohm: '50',
  loadR: '100',
  loadX: '-30',
  frequencyGhz: '2.4',
  er: '4.4',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Deviation formatted as a power of ten, because it is a numerical check. */
function fmtDeviation(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return value.toExponential(1);
}

export default function StubMatchingCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const z0Ohm = num(state.z0Ohm);
    const loadR = num(state.loadR);
    const loadX = num(state.loadX);
    const frequencyGhz = num(state.frequencyGhz);
    const er = num(state.er);
    if (![z0Ohm, loadR, loadX, frequencyGhz, er].every(Number.isFinite)) {
      return { ok: false as const, errors: ['Fill in the line, the load, the frequency and the permittivity.'] };
    }
    const input = { z0Ohm, loadR, loadX, frequencyHz: frequencyGhz * 1e9, er };
    try {
      const match = stubMatch(input);
      const rows = match.solutions.flatMap((solution, index) =>
        (['short', 'open'] as const).map((stubKind) => {
          const stubLengthM =
            stubKind === 'short' ? solution.shortStubLengthM : solution.openStubLengthM;
          const check = stubVerification({
            ...input,
            distanceM: solution.distanceM,
            stubLengthM,
            stubKind,
          });
          return {
            key: `${index}-${stubKind}`,
            solution: index + 1,
            stubKind,
            distanceM: solution.distanceM,
            stubLengthM,
            deviation: check.deviation,
          };
        }),
      );
      return { ok: true as const, ...match, frequencyGhz, rows };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The stub match could not be solved.'],
      };
    }
  }, [state.z0Ohm, state.loadR, state.loadX, state.frequencyGhz, state.er]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'Shunt stub match',
      `Line impedance = ${fmt(num(state.z0Ohm))} Ω`,
      `Load = ${fmt(num(state.loadR))} ${num(state.loadX) < 0 ? '−' : '+'} j${fmt(Math.abs(num(state.loadX)))} Ω`,
      `Frequency = ${fmt(result.frequencyGhz)} GHz`,
      `Guided wavelength = ${fmt(result.lambdaM * 1e3)} mm`,
    ];
    return head.concat(
      result.rows.map(
        (row) =>
          `Solution ${row.solution} ${row.stubKind} stub: d = ${fmt(row.distanceM * 1e3)} mm, l = ${fmt(
            row.stubLengthM * 1e3,
          )} mm, re-check |y − 1| = ${fmtDeviation(row.deviation)}`,
      ),
    );
  }, [result, state.z0Ohm, state.loadR, state.loadX]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="st-z0">Line impedance Z₀ (Ω)</label>
          <input
            id="st-z0"
            type="number"
            inputMode="decimal"
            value={state.z0Ohm}
            onChange={(event) => update('z0Ohm', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="st-r">Load resistance (Ω)</label>
          <input
            id="st-r"
            type="number"
            inputMode="decimal"
            value={state.loadR}
            onChange={(event) => update('loadR', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="st-x">Load reactance (Ω, negative for capacitive)</label>
          <input
            id="st-x"
            type="number"
            inputMode="decimal"
            value={state.loadX}
            onChange={(event) => update('loadX', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="st-freq">Frequency (GHz)</label>
          <input
            id="st-freq"
            type="number"
            inputMode="decimal"
            value={state.frequencyGhz}
            onChange={(event) => update('frequencyGhz', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="st-er">Line relative permittivity εr</label>
          <input
            id="st-er"
            type="number"
            inputMode="decimal"
            value={state.er}
            onChange={(event) => update('er', event.target.value)}
          />
        </div>
        <p className="note">
          Lossless line. A load of exactly Z₀ is already matched and has no stub solution, so the tool says that
          rather than returning a zero-length stub. Use εr = 1 for an air line.
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
            <span className="unit">Guided wavelength</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.lambdaM * 1e3)}
              <span className="result-suffix"> mm</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Load resistance</dt>
                <dd>{fmt(num(state.loadR))} Ω</dd>
              </div>
              <div>
                <dt>Load reactance</dt>
                <dd>
                  {num(state.loadX) < 0 ? '−' : '+'}j{fmt(Math.abs(num(state.loadX)))} Ω
                </dd>
              </div>
              <div>
                <dt>Normalised load</dt>
                <dd>
                  {fmt(result.normalizedLoadR)} {result.normalizedLoadX < 0 ? '−' : '+'} j
                  {fmt(Math.abs(result.normalizedLoadX))}
                </dd>
              </div>
              <div>
                <dt>Solutions</dt>
                <dd>{result.solutions.length}</dd>
              </div>
            </dl>
            <table className="model-table">
              <caption>Stub placement and length, with the re-simulated admittance</caption>
              <thead>
                <tr>
                  <th scope="col">Solution</th>
                  <th scope="col">Stub</th>
                  <th scope="col">Distance d</th>
                  <th scope="col">Stub length</th>
                  <th scope="col">Re-check |y − 1|</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.solution}</th>
                    <td>{row.stubKind === 'short' ? 'short' : 'open'}</td>
                    <td>{fmt(row.distanceM * 1e3)} mm</td>
                    <td>{fmt(row.stubLengthM * 1e3)} mm</td>
                    <td>{fmtDeviation(row.deviation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">
              The last column is not part of the closed form: the distance and the stub length are fed back through
              the transmission-line equations and the resulting normalised admittance is compared with 1. A value
              near machine precision means the placement really does match the load.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
