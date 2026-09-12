
'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { calculateLithography, K1_DIFFRACTION_LIMIT, MAX_IMMERSION_NA, WAVELENGTHS } from '@/lib/lithography';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  wavelengthId: 'arf',
  customWavelength: '',
  numericalAperture: '0.93',
  k1: '0.35',
  k2: '0.5',
};

const num = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export default function LithographyResolutionCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const { copied, copy } = useCopyToClipboard();

  const wavelengthNm =
    state.wavelengthId === 'custom'
      ? num(state.customWavelength)
      : (WAVELENGTHS.find((preset) => preset.id === state.wavelengthId)?.nm ?? Number.NaN);

  const result = useMemo(
    () =>
      calculateLithography({
        wavelengthNm,
        numericalAperture: num(state.numericalAperture),
        k1: num(state.k1),
        k2: num(state.k2),
      }),
    [wavelengthNm, state.numericalAperture, state.k1, state.k2],
  );

  const copyResult = () => {
    if (!result.ok) return;
    const lines = [
      `Wavelength: ${fmt(wavelengthNm)} nm`,
      `Numerical aperture: ${state.numericalAperture}`,
      `k1: ${state.k1}, k2: ${state.k2}`,
      `Resolution: ${fmt(result.resolutionNm)} nm`,
      `Depth of focus: ${fmt(result.depthOfFocusNm)} nm`,
    ];
    void copy(lines.join('\n'));
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="litho-inputs">
        <h2 id="litho-inputs">Optics and process</h2>

        <div className="field">
          <label htmlFor="litho-wavelength">Exposure wavelength</label>
          <select
            id="litho-wavelength"
            value={state.wavelengthId}
            onChange={(event) => setState((previous) => ({ ...previous, wavelengthId: event.target.value }))}
          >
            {WAVELENGTHS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom wavelength</option>
          </select>
        </div>

        {state.wavelengthId === 'custom' ? (
          <div className="field">
            <label htmlFor="litho-custom-wavelength">
              Wavelength<span className="unit">nm</span>
            </label>
            <input
              id="litho-custom-wavelength"
              type="number"
              min="0"
              step="any"
              value={state.customWavelength}
              onChange={(event) => setState((previous) => ({ ...previous, customWavelength: event.target.value }))}
            />
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="litho-na">
            Numerical aperture<span className="unit">NA</span>
          </label>
          <input
            id="litho-na"
            type="number"
            min="0"
            step="any"
            value={state.numericalAperture}
            onChange={(event) => setState((previous) => ({ ...previous, numericalAperture: event.target.value }))}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="litho-k1">
              k1<span className="unit">resolution factor</span>
            </label>
            <input
              id="litho-k1"
              type="number"
              min="0"
              step="any"
              value={state.k1}
              onChange={(event) => setState((previous) => ({ ...previous, k1: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="litho-k2">
              k2<span className="unit">focus factor</span>
            </label>
            <input
              id="litho-k2"
              type="number"
              min="0"
              step="any"
              value={state.k2}
              onChange={(event) => setState((previous) => ({ ...previous, k2: event.target.value }))}
            />
          </div>
        </div>

        <p className="note">
          k1 near 0.35 and k2 near 0.5 describe a mature single-exposure process. The diffraction limit for a single
          exposure is k1 = {K1_DIFFRACTION_LIMIT}.
        </p>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="litho-result">
        <h2 id="litho-result">Predicted limit</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Resolution (half pitch)</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.resolutionNm)}
              <span className="result-suffix"> nm</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Depth of focus</span>
                <strong>{fmt(result.depthOfFocusNm)} nm</strong>
              </div>
              <div className="metric">
                <span>Depth of focus</span>
                <strong>{fmt(result.depthOfFocusNm / 1000)} um</strong>
              </div>
              <div className="metric">
                <span>NA squared</span>
                <strong>{fmt(result.naSquared)}</strong>
              </div>
              <div className="metric">
                <span>k1 against limit</span>
                <strong>{result.belowDiffractionLimit ? 'below 0.25' : 'at or above 0.25'}</strong>
              </div>
            </div>

            {result.belowDiffractionLimit ? (
              <p className="note">
                k1 below {K1_DIFFRACTION_LIMIT} is under the two-beam diffraction limit for a single exposure. A real
                process only reaches it with resolution enhancement such as off-axis illumination, phase-shift masks or
                optical proximity correction, or by splitting the layer across two exposures. Treat the number as a
                target that needs those techniques, not as something plain illumination delivers.
              </p>
            ) : (
              <p className="note">
                At k1 {state.k1} the pattern is inside what single-exposure illumination can print. The depth of focus is
                the paraxial estimate k2 x lambda / NA squared; resist thickness, topography and lens aberrations reduce
                the usable window below it.
              </p>
            )}

            {Number(state.numericalAperture) > 1 ? (
              <p className="note">
                A numerical aperture above 1 is only reached with immersion, where the medium whose refractive index
                multiplies NA is a liquid rather than air. {MAX_IMMERSION_NA} is the practical ceiling for 193 nm water
                immersion.
              </p>
            ) : null}

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
