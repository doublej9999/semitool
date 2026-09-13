
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { calculateFilmStress, BIAXIAL_PRESETS, radiusFromBow } from '@/lib/stress';
import { LENGTH_LABELS, LENGTH_UNITS, toMm, type LengthUnit } from '@/lib/units';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useGlossary } from '@/lib/i18n/glossary';

type Direction = 'tensile' | 'compressive';
type CurvatureMode = 'radius' | 'bow';

const INITIAL = {
  filmThickness: '100',
  filmUnit: 'nm' as LengthUnit,
  substrateThickness: '775',
  substrateUnit: 'µm' as LengthUnit,
  presetId: 'si100',
  youngsGPa: '130',
  poisson: '0.28',
  curvatureMode: 'radius' as CurvatureMode,
  radius: '100',
  scanLength: '100',
  bow: '10',
  direction: 'tensile' as Direction,
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));
const metres = (value: string, unit: LengthUnit) => toMm(num(value), unit) / 1000;

export default function FilmStressCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();
  const g = useGlossary();

  const bowResult = useMemo(
    () => radiusFromBow(num(state.scanLength) / 1000, num(state.bow) / 1e6),
    [state.scanLength, state.bow],
  );

  const radiusM = state.curvatureMode === 'radius' ? num(state.radius) : bowResult.radiusM;

  const result = useMemo(
    () =>
      calculateFilmStress({
        filmThicknessM: metres(state.filmThickness, state.filmUnit),
        substrateThicknessM: metres(state.substrateThickness, state.substrateUnit),
        youngsModulusPa: num(state.youngsGPa) * 1e9,
        poissonRatio: num(state.poisson),
        radiusM,
        tensile: state.direction === 'tensile',
      }),
    [state, radiusM],
  );

  const copyResult = () => {
    if (!result.ok) return;
    const lines = [
      `Film thickness: ${state.filmThickness} ${LENGTH_LABELS[state.filmUnit]}`,
      `Substrate thickness: ${state.substrateThickness} ${LENGTH_LABELS[state.substrateUnit]}`,
      `Biaxial modulus: ${fmt(result.biaxialModulusPa / 1e9)} GPa`,
      `Curvature radius: ${fmt(radiusM)} m`,
      `Film stress: ${fmt(result.stressPa / 1e6)} MPa (${result.tensile ? 'tensile' : 'compressive'})`,
      `Thickness ratio: ${fmt(result.thicknessRatio)}`,
    ];
    void copy(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="stress-inputs">
        <h2 id="stress-inputs">Stack and measurement</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="stress-film">
              {g('filmThickness')}<span className="unit">{LENGTH_LABELS[state.filmUnit]}</span>
            </label>
            <div className="inline-field">
              <input
                id="stress-film"
                type="number"
                min="0"
                step="any"
                value={state.filmThickness}
                onChange={(event) => setState((previous) => ({ ...previous, filmThickness: event.target.value }))}
              />
              <select
                aria-label="Film thickness unit"
                value={state.filmUnit}
                onChange={(event) => setState((previous) => ({ ...previous, filmUnit: event.target.value as LengthUnit }))}
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {LENGTH_LABELS[unit]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="stress-substrate">
              {g('substrateThickness')}<span className="unit">{LENGTH_LABELS[state.substrateUnit]}</span>
            </label>
            <div className="inline-field">
              <input
                id="stress-substrate"
                type="number"
                min="0"
                step="any"
                value={state.substrateThickness}
                onChange={(event) => setState((previous) => ({ ...previous, substrateThickness: event.target.value }))}
              />
              <select
                aria-label="Substrate thickness unit"
                value={state.substrateUnit}
                onChange={(event) =>
                  setState((previous) => ({ ...previous, substrateUnit: event.target.value as LengthUnit }))
                }
                style={{ flex: '0 0 auto', width: 'auto' }}
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {LENGTH_LABELS[unit]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="stress-preset">Substrate</label>
          <select
            id="stress-preset"
            value={state.presetId}
            onChange={(event) => {
              const preset = BIAXIAL_PRESETS.find((item) => item.id === event.target.value);
              setState((previous) => ({
                ...previous,
                presetId: event.target.value,
                youngsGPa: preset ? String(preset.youngsGPa) : previous.youngsGPa,
                poisson: preset ? String(preset.poisson) : previous.poisson,
              }));
            }}
          >
            {BIAXIAL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="stress-youngs">
              {g('youngsModulus')}<span className="unit">GPa</span>
            </label>
            <input
              id="stress-youngs"
              type="number"
              min="0"
              step="any"
              value={state.youngsGPa}
              onChange={(event) =>
                setState((previous) => ({ ...previous, youngsGPa: event.target.value, presetId: 'custom' }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="stress-poisson">
              {g('poissonRatio')}<span className="unit">nu</span>
            </label>
            <input
              id="stress-poisson"
              type="number"
              step="any"
              value={state.poisson}
              onChange={(event) =>
                setState((previous) => ({ ...previous, poisson: event.target.value, presetId: 'custom' }))
              }
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="stress-curvature-mode">Curvature input</label>
          <select
            id="stress-curvature-mode"
            value={state.curvatureMode}
            onChange={(event) =>
              setState((previous) => ({ ...previous, curvatureMode: event.target.value as CurvatureMode }))
            }
          >
            <option value="radius">Radius of curvature</option>
            <option value="bow">Bow across a scan</option>
          </select>
        </div>

        {state.curvatureMode === 'radius' ? (
          <div className="field">
            <label htmlFor="stress-radius">
              Radius of curvature<span className="unit">m</span>
            </label>
            <input
              id="stress-radius"
              type="number"
              min="0"
              step="any"
              value={state.radius}
              onChange={(event) => setState((previous) => ({ ...previous, radius: event.target.value }))}
            />
          </div>
        ) : (
          <div className="form-row">
            <div className="field">
              <label htmlFor="stress-scan">
                Scan length<span className="unit">mm</span>
              </label>
              <input
                id="stress-scan"
                type="number"
                min="0"
                step="any"
                value={state.scanLength}
                onChange={(event) => setState((previous) => ({ ...previous, scanLength: event.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="stress-bow">
                {g('bowHeight')}<span className="unit">um</span>
              </label>
              <input
                id="stress-bow"
                type="number"
                min="0"
                step="any"
                value={state.bow}
                onChange={(event) => setState((previous) => ({ ...previous, bow: event.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="stress-direction">Curvature direction</label>
          <select
            id="stress-direction"
            value={state.direction}
            onChange={(event) => setState((previous) => ({ ...previous, direction: event.target.value as Direction }))}
          >
            <option value="tensile">Concave toward the film side (tensile)</option>
            <option value="compressive">Convex toward the film side (compressive)</option>
          </select>
        </div>

        <p className="note">
          The Stoney relation assumes the film is much thinner than the substrate. The direction is a selection rather
          than something read from a signed curvature, because curvature sign conventions differ between tools.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="stress-result">
        <h2 id="stress-result">{g('filmStress')}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{g('filmStress')}</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.stressPa / 1e6)}
              <span className="result-suffix"> MPa</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Type</span>
                <strong>{result.tensile ? 'Tensile' : 'Compressive'}</strong>
              </div>
              <div className="metric">
                <span>Magnitude</span>
                <strong>{fmt(result.magnitudePa / 1e9)} GPa</strong>
              </div>
              <div className="metric">
                <span>Biaxial modulus</span>
                <strong>{fmt(result.biaxialModulusPa / 1e9)} GPa</strong>
              </div>
              <div className="metric">
                <span>Curvature radius</span>
                <strong>{fmt(radiusM)} m</strong>
              </div>
              <div className="metric">
                <span>Film / substrate</span>
                <strong>{fmt(result.thicknessRatio, 3)}</strong>
              </div>
              <div className="metric">
                <span>Stoney check</span>
                <strong>{result.ratioWithinStoney ? 'inside limit' : 'outside limit'}</strong>
              </div>
            </div>

            {result.ratioWithinStoney ? (
              <p className="note">
                The film is {fmt(result.thicknessRatio * 100, 3)} percent of the substrate thickness, inside the one
                percent rule of thumb, so the thin-film Stoney assumption holds.
              </p>
            ) : (
              <p className="note">
                The film is {fmt(result.thicknessRatio * 100, 3)} percent of the substrate thickness, above the one
                percent rule of thumb. Stoney underestimates stress for a thick film, so treat this as a lower bound and
                use a two-layer model that accounts for the film stiffness.
              </p>
            )}

            <p className="note">
              Stoney gives the magnitude sigma equals M_s t_s squared over six t_f R. The type comes from which way the
              wafer curved, which is why it is a selection. Confirm the sign convention of your own curvature tool before
              reading anything into tensile against compressive.
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
