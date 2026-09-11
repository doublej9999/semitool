'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { parseSubgroups, xbarRChart } from '@/lib/spc';

const SAMPLE = [
  '10.1, 10.3, 9.9, 10.1',
  '10.2, 10.4, 10.0, 10.2',
  '9.8, 10.0, 9.6, 9.8',
  '10.3, 10.5, 10.1, 10.3',
  '10.0, 10.2, 9.8, 10.0',
  '10.1, 10.1, 9.9, 10.3',
].join('\n');

const INITIAL = { subgroups: SAMPLE };

export default function SpcControlChartCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      const subgroups = parseSubgroups(state.subgroups);
      return { ok: true as const, ...xbarRChart(subgroups) };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The data could not be charted.'],
      };
    }
  }, [state.subgroups]);

  const signalCount = result.ok
    ? result.meansOutOfControl.length + result.rangesOutOfControl.length + result.runs.length
    : 0;

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'X-bar and R chart',
      `Subgroups = ${result.subgroupCount}, size = ${result.subgroupSize}`,
      `Grand mean = ${fmt(result.grandMean)}`,
      `Mean range = ${fmt(result.meanRange)}`,
      `X-bar limits = ${fmt(result.xbarLcl)} to ${fmt(result.xbarUcl)}`,
      `R limits = ${fmt(result.rangeLcl)} to ${fmt(result.rangeUcl)}`,
      `Within-subgroup sigma = ${fmt(result.sigmaHat)}`,
      `Signals = ${signalCount}`,
    ];
    result.meansOutOfControl.forEach((index) =>
      head.push(`Subgroup ${index + 1} mean is outside the limits`),
    );
    result.rangesOutOfControl.forEach((index) =>
      head.push(`Subgroup ${index + 1} range is outside the limits`),
    );
    result.runs.forEach((run) =>
      head.push(
        `Subgroups ${run.startIndex + 1} to ${run.endIndex + 1} run ${run.side} the centre line`,
      ),
    );
    return head;
  }, [result, signalCount]);

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
          <label htmlFor="spc-subgroups">Subgroups, one per line, readings separated by commas</label>
          <textarea
            id="spc-subgroups"
            rows={8}
            spellCheck={false}
            value={state.subgroups}
            onChange={(event) => setState({ subgroups: event.target.value })}
          />
        </div>
        <p className="note">
          Every subgroup must hold the same number of readings: a constant subgroup size is what makes the range
          meaningful. Lines starting with # are ignored, so you can paste a block from a datalog and comment the
          ones you exclude.
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
            <span className="unit">Grand mean</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.grandMean)}
            </div>
            <dl className="metric-grid">
              <div>
                <dt>X-bar UCL</dt>
                <dd>{fmt(result.xbarUcl)}</dd>
              </div>
              <div>
                <dt>X-bar LCL</dt>
                <dd>{fmt(result.xbarLcl)}</dd>
              </div>
              <div>
                <dt>R UCL</dt>
                <dd>{fmt(result.rangeUcl)}</dd>
              </div>
              <div>
                <dt>R LCL</dt>
                <dd>{fmt(result.rangeLcl)}</dd>
              </div>
              <div>
                <dt>Mean range</dt>
                <dd>{fmt(result.meanRange)}</dd>
              </div>
              <div>
                <dt>Within-subgroup sigma</dt>
                <dd>{fmt(result.sigmaHat)}</dd>
              </div>
              <div>
                <dt>Subgroup size</dt>
                <dd>{result.subgroupSize}</dd>
              </div>
              <div>
                <dt>Signals</dt>
                <dd>{signalCount}</dd>
              </div>
            </dl>
            <table className="model-table">
              <caption>Per-subgroup mean and range against the limits</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Mean</th>
                  <th scope="col">Range</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.means.map((mean, index) => {
                  const meanOut = result.meansOutOfControl.includes(index);
                  const rangeOut = result.rangesOutOfControl.includes(index);
                  const run = result.runs.find(
                    (entry) => index >= entry.startIndex && index <= entry.endIndex,
                  );
                  const status = [
                    meanOut ? 'mean out of limits' : null,
                    rangeOut ? 'range out of limits' : null,
                    run ? `run ${run.side}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={index}>
                      <th scope="row">{index + 1}</th>
                      <td>{fmt(mean)}</td>
                      <td>{fmt(result.ranges[index])}</td>
                      <td>{status === '' ? 'in control' : status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="note">
              Control limits come from the variation inside the subgroups, not from the specification. An
              in-control chart says the process is stable, not that it is capable: put the same data through the
              process capability calculator for the specification question.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
