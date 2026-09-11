
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { parseAndRollup } from '@/lib/bin';

const SAMPLE = `PASS 9000 *
OPEN 480
SHORT 300
LEAK 220`;

const INITIAL = { bins: SAMPLE };

export default function BinYieldCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      return { ok: true as const, rollup: parseAndRollup(state.bins) };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The bin list could not be read.'],
      };
    }
  }, [state.bins]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const { rollup } = result;
    return [
      'Bin yield rollup',
      `Total die = ${rollup.total}`,
      `Pass bin = ${rollup.passLabel ?? 'n/a'} (${rollup.passCount}, ${fmt(rollup.passFraction * 100)} %)`,
      `Fail = ${fmt(rollup.failFraction * 100)} % = ${fmt(rollup.failDppm)} DPPM`,
      ...rollup.rows.map(
        (row) => `${row.label}: ${row.count} = ${fmt(row.fraction * 100)} % (cum. ${fmt(row.cumulative * 100)} %)`,
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
          <label htmlFor="bin-list">Bin counts, one per line as &lt;bin&gt; &lt;count&gt;</label>
          <textarea
            id="bin-list"
            rows={8}
            spellCheck={false}
            value={state.bins}
            onChange={(event) => setState({ bins: event.target.value })}
          />
        </div>
        <p className="note">
          Separate the label and the count with a space, a comma or a tab, so a line pasted from a datalog works. Add a
          * to the pass bin; if no bin is marked, the largest bin is assumed to be the pass bin. Labels that repeat are
          summed, and lines starting with # are ignored.
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
            <span className="unit">Pass yield</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.rollup.passFraction * 100)}
              <span className="result-suffix"> %</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Total die</dt>
                <dd>{fmt(result.rollup.total)}</dd>
              </div>
              <div>
                <dt>Pass bin</dt>
                <dd>{result.rollup.passLabel ?? 'n/a'}</dd>
              </div>
              <div>
                <dt>Pass die</dt>
                <dd>{fmt(result.rollup.passCount)}</dd>
              </div>
              <div>
                <dt>Fail</dt>
                <dd>{fmt(result.rollup.failFraction * 100)} %</dd>
              </div>
              <div>
                <dt>Defect rate</dt>
                <dd>{fmt(result.rollup.failDppm)} DPPM</dd>
              </div>
            </dl>
            {!result.rollup.passMarked ? (
              <p className="note">
                No pass bin was marked with a *, so the largest bin ({result.rollup.passLabel}) is treated as the pass
                bin. Mark the real pass bin if that is not it.
              </p>
            ) : null}
            <div className="table-scroll">
              <table className="model-table">
                <thead>
                  <tr>
                    <th scope="col">Bin</th>
                    <th scope="col">Count</th>
                    <th scope="col">Share</th>
                    <th scope="col">Cumulative</th>
                    <th scope="col">DPPM</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rollup.rows.map((row) => (
                    <tr key={row.label}>
                      <td>
                        {row.label}
                        {row.pass ? ' (pass)' : ''}
                      </td>
                      <td>{fmt(row.count)}</td>
                      <td>{fmt(row.fraction * 100)} %</td>
                      <td>{fmt(row.cumulative * 100)} %</td>
                      <td>{fmt(row.dppm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
