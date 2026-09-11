'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { matchLNetwork, type MatchSolution } from '@/lib/impedance';

const INITIAL = { frequencyMhz: '100', sourceOhm: '50', loadOhm: '200' };

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Inductance with the unit that keeps the number readable. */
function fmtInductance(henry: number | null): string {
  if (henry === null || !Number.isFinite(henry)) return '—';
  if (Math.abs(henry) >= 1e-6) return `${fmt(henry * 1e6)} µH`;
  if (Math.abs(henry) >= 1e-9) return `${fmt(henry * 1e9)} nH`;
  return `${fmt(henry * 1e12)} pH`;
}

/** Capacitance with the unit that keeps the number readable. */
function fmtCapacitance(farad: number | null): string {
  if (farad === null || !Number.isFinite(farad)) return '—';
  if (Math.abs(farad) >= 1e-9) return `${fmt(farad * 1e9)} nF`;
  if (Math.abs(farad) >= 1e-12) return `${fmt(farad * 1e12)} pF`;
  return `${fmt(farad * 1e15)} fF`;
}

function elementValue(solution: MatchSolution, kind: 'series' | 'shunt'): string {
  if (kind === 'series') {
    return solution.seriesInductanceH !== null
      ? `L ${fmtInductance(solution.seriesInductanceH)}`
      : `C ${fmtCapacitance(solution.seriesCapacitanceF)}`;
  }
  return solution.shuntInductanceH !== null
    ? `L ${fmtInductance(solution.shuntInductanceH)}`
    : `C ${fmtCapacitance(solution.shuntCapacitanceF)}`;
}

export default function ImpedanceMatchingCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const frequencyMhz = num(state.frequencyMhz);
    const sourceOhm = num(state.sourceOhm);
    const loadOhm = num(state.loadOhm);
    if (![frequencyMhz, sourceOhm, loadOhm].every(Number.isFinite)) {
      return { ok: false as const, errors: ['Enter the frequency and both resistances.'] };
    }
    try {
      const match = matchLNetwork({
        frequencyHz: frequencyMhz * 1e6,
        sourceOhm,
        loadOhm,
      });
      return { ok: true as const, ...match, frequencyMhz };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The match could not be solved.'],
      };
    }
  }, [state.frequencyMhz, state.sourceOhm, state.loadOhm]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    return [
      'L-network match',
      `Frequency = ${fmt(result.frequencyMhz)} MHz`,
      `Loaded Q = ${fmt(result.q)}`,
      `Bandwidth ≈ ${fmt(result.bandwidthHz / 1e6)} MHz`,
      `Shunt element sits across the ${result.shuntSide}`,
      ...result.solutions.map(
        (solution) =>
          `${solution.label}: series ${elementValue(solution, 'series')}, shunt ${elementValue(solution, 'shunt')}`,
      ),
    ];
  }, [result]);

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
          <label htmlFor="im-freq">Design frequency (MHz)</label>
          <input
            id="im-freq"
            type="number"
            inputMode="decimal"
            value={state.frequencyMhz}
            onChange={(event) => update('frequencyMhz', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="im-source">Source resistance (Ω)</label>
          <input
            id="im-source"
            type="number"
            inputMode="decimal"
            value={state.sourceOhm}
            onChange={(event) => update('sourceOhm', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="im-load">Load resistance (Ω)</label>
          <input
            id="im-load"
            type="number"
            inputMode="decimal"
            value={state.loadOhm}
            onChange={(event) => update('loadOhm', event.target.value)}
          />
        </div>
        <p className="note">
          Both terminations are treated as real resistances. The shunt element always sits across the larger
          resistance, so which resistors you enter decides the topology. A complex load needs the stub or a
          transformer instead.
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
            <span className="unit">Loaded Q</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.q)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Bandwidth estimate</dt>
                <dd>{fmt(result.bandwidthHz / 1e6)} MHz</dd>
              </div>
              <div>
                <dt>Shunt element sits across</dt>
                <dd>{result.shuntSide}</dd>
              </div>
              <div>
                <dt>Series element reactance</dt>
                <dd>{fmt(result.solutions[0].seriesReactanceOhm)} Ω</dd>
              </div>
              <div>
                <dt>Shunt element reactance</dt>
                <dd>{fmt(result.solutions[0].shuntReactanceOhm)} Ω</dd>
              </div>
            </dl>
            <table className="model-table">
              <caption>Both solutions at {fmt(result.frequencyMhz)} MHz</caption>
              <thead>
                <tr>
                  <th scope="col">Topology</th>
                  <th scope="col">Series</th>
                  <th scope="col">Shunt</th>
                </tr>
              </thead>
              <tbody>
                {result.solutions.map((solution) => (
                  <tr key={solution.id}>
                    <th scope="row">{solution.label}</th>
                    <td>{elementValue(solution, 'series')}</td>
                    <td>{elementValue(solution, 'shunt')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">
              The two rows are the same match built two ways: pick the low-pass pair when you want to attenuate
              harmonics, the high-pass pair when you want to block below-band content.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
