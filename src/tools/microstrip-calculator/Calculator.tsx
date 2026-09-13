'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { microstripAnalyze, microstripSynthesize, SPEED_OF_LIGHT_MPS } from '@/lib/tline';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

type Mode = 'analyze' | 'synthesize';

const MODE_LABELS: Record<Mode, string> = {
  analyze: 'Geometry → impedance',
  synthesize: 'Impedance → width',
};

const INITIAL = {
  mode: 'analyze' as Mode,
  widthUm: '3000',
  targetZ0: '50',
  heightUm: '1500',
  er: '4.4',
  frequencyGhz: '1',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function MicrostripCalculator() {
  const g = useGlossary();
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  const update = (key: keyof typeof INITIAL, value: string) =>
    setState((previous) => ({ ...previous, [key]: value }));

  const result = useMemo(() => {
    const heightUm = num(state.heightUm);
    const er = num(state.er);
    const frequencyGhz = num(state.frequencyGhz);
    const widthUm = num(state.widthUm);
    const targetZ0 = num(state.targetZ0);
    const needed = [heightUm, er, frequencyGhz];
    if (!needed.every(Number.isFinite)) {
      return { ok: false as const, errors: ['Enter the substrate height, permittivity and frequency.'] };
    }
    try {
      if (state.mode === 'analyze') {
        if (!Number.isFinite(widthUm)) {
          return { ok: false as const, errors: ['Enter the trace width.'] };
        }
        const analysis = microstripAnalyze({ widthUm, heightUm, er, frequencyHz: frequencyGhz * 1e9 });
        return { ok: true as const, mode: state.mode, ...analysis, widthUm };
      }
      if (!Number.isFinite(targetZ0)) {
        return { ok: false as const, errors: ['Enter the target impedance.'] };
      }
      const synthesis = microstripSynthesize({
        targetZ0Ohm: targetZ0,
        heightUm,
        er,
        frequencyHz: frequencyGhz * 1e9,
      });
      return { ok: true as const, mode: state.mode, ...synthesis, targetZ0 };
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : 'The line could not be solved.'],
      };
    }
  }, [state.mode, state.widthUm, state.targetZ0, state.heightUm, state.er, state.frequencyGhz]);

  const lines = useMemo(() => {
    if (!result.ok) return [];
    const head = [
      'Microstrip',
      `Substrate height = ${fmt(num(state.heightUm))} µm`,
      `Relative permittivity = ${fmt(num(state.er))}`,
      `Frequency = ${fmt(num(state.frequencyGhz))} GHz`,
    ];
    if (result.mode === 'synthesize') {
      head.push(`Target impedance = ${fmt(result.targetZ0 ?? 0)} Ω`);
      head.push(`Trace width = ${fmt(result.widthUm)} µm`);
    } else {
      head.push(`Trace width = ${fmt(result.widthUm)} µm`);
    }
    head.push(`Width / height = ${fmt(result.ratio)}`);
    head.push(`Characteristic impedance = ${fmt(result.z0Ohm)} Ω`);
    head.push(`Effective permittivity = ${fmt(result.effectiveEr)}`);
    head.push(`Guided wavelength = ${fmt(result.guidedWavelengthM * 1e3)} mm`);
    head.push(
      `Phase velocity = ${fmt(result.phaseVelocityMps / SPEED_OF_LIGHT_MPS)} c`,
    );
    head.push(`Delay = ${fmt(result.delayPsPerMm)} ps/mm`);
    return head;
  }, [result, state.heightUm, state.er, state.frequencyGhz]);

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Inputs</h2>
        <div className="field">
          <label htmlFor="ms-mode">Direction</label>
          <select
            id="ms-mode"
            value={state.mode}
            onChange={(event) => update('mode', event.target.value as Mode)}
          >
            {(Object.keys(MODE_LABELS) as Mode[]).map((entry) => (
              <option key={entry} value={entry}>
                {MODE_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
        {state.mode === 'analyze' ? (
          <div className="field">
            <label htmlFor="ms-width">Trace width (µm)</label>
            <input
              id="ms-width"
              type="number"
              inputMode="decimal"
              value={state.widthUm}
              onChange={(event) => update('widthUm', event.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ms-target">Target impedance (Ω)</label>
            <input
              id="ms-target"
              type="number"
              inputMode="decimal"
              value={state.targetZ0}
              onChange={(event) => update('targetZ0', event.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="ms-height">Substrate height (µm)</label>
          <input
            id="ms-height"
            type="number"
            inputMode="decimal"
            value={state.heightUm}
            onChange={(event) => update('heightUm', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ms-er">Relative permittivity εr</label>
          <input
            id="ms-er"
            type="number"
            inputMode="decimal"
            value={state.er}
            onChange={(event) => update('er', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ms-freq">{g('frequencyLabel')} (GHz)</label>
          <input
            id="ms-freq"
            type="number"
            inputMode="decimal"
            value={state.frequencyGhz}
            onChange={(event) => update('frequencyGhz', event.target.value)}
          />
        </div>
        <p className="note">
          Quasi-static Hammerstad-Jensen model: no dispersion, no radiation and no copper thickness. In the
          impedance to width direction the fit is refined by solving the forward model, so the width shown
          reproduces the target impedance rather than carrying the fit&apos;s own error.
        </p>
        <div className="action-row">
          <button type="button" className="button primary" onClick={() => void copy(lines.join('\n'))} disabled={!result.ok}>
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
        <h2>{g('resultLabel')}</h2>
        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{result.mode === 'synthesize' ? 'Trace width' : g('impedanceLabel')}</span>
            <div className="result-value" aria-live="polite">
              {result.mode === 'synthesize' ? fmt(result.widthUm) : fmt(result.z0Ohm)}
              <span className="result-suffix">{result.mode === 'synthesize' ? ' µm' : ' Ω'}</span>
            </div>
            <dl className="metric-grid">
              <div>
                <dt>Characteristic impedance</dt>
                <dd>{fmt(result.z0Ohm)} Ω</dd>
              </div>
              <div>
                <dt>Trace width</dt>
                <dd>{fmt(result.widthUm)} µm</dd>
              </div>
              <div>
                <dt>Width / height</dt>
                <dd>{fmt(result.ratio)}</dd>
              </div>
              <div>
                <dt>Effective permittivity</dt>
                <dd>{fmt(result.effectiveEr)}</dd>
              </div>
              <div>
                <dt>Guided wavelength</dt>
                <dd>{fmt(result.guidedWavelengthM * 1e3)} mm</dd>
              </div>
              <div>
                <dt>Phase velocity</dt>
                <dd>{fmt(result.phaseVelocityMps / SPEED_OF_LIGHT_MPS)} c</dd>
              </div>
              <div>
                <dt>Delay</dt>
                <dd>{fmt(result.delayPsPerMm)} ps/mm</dd>
              </div>
            </dl>
            <p className="note">
              The guided wavelength and delay follow from the effective permittivity, not from εr, because the
              field is only partly in the substrate. That is why a microstrip is always shorter than the same
              line in a uniform dielectric.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
