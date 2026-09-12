'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import {
  SILICON_DOPANTS,
  type DopantSpecies,
  getDiffusionCoefficient,
  getSolidSolubility,
  calculatePredeposition,
  calculateDriveIn,
  calculateMinimumOxideMaskThickness,
} from '@/lib/dopant-diffusion';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';

const INITIAL = {
  dopant: 'B' as DopantSpecies,
  processType: 'predeposition', // 'predeposition' | 'drive-in'
  tempCelsius: 1000,
  timeMinutes: 60,
  useSolidSolubility: true,
  customCsCm3: '1e20',
  doseQCm2: '1e15', // for drive-in
  backgroundDopingCm3: '1e16',
};

export default function DopantDiffusionCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  useUrlParamsState(state, setState);

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const dopantInfo = SILICON_DOPANTS[state.dopant];

  const solidSolubility = useMemo(() => {
    return getSolidSolubility(state.dopant, state.tempCelsius);
  }, [state.dopant, state.tempCelsius]);

  const D_Si = useMemo(() => {
    return getDiffusionCoefficient(state.dopant, state.tempCelsius, 'Si');
  }, [state.dopant, state.tempCelsius]);

  const timeSeconds = state.timeMinutes * 60;

  const predepResult = useMemo(() => {
    if (state.processType !== 'predeposition') return null;
    const cs = state.useSolidSolubility
      ? solidSolubility
      : Number.parseFloat(state.customCsCm3) || 1e20;
    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;

    try {
      return calculatePredeposition({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
        surfaceConcentrationCm3: cs,
        backgroundConcentrationCm3: cb,
      });
    } catch {
      return null;
    }
  }, [state, solidSolubility, timeSeconds]);

  const driveInResult = useMemo(() => {
    if (state.processType !== 'drive-in') return null;
    const Q = Number.parseFloat(state.doseQCm2) || 1e15;
    const cb = Number.parseFloat(state.backgroundDopingCm3) || 1e16;

    try {
      return calculateDriveIn({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
        doseCm2: Q,
        backgroundConcentrationCm3: cb,
      });
    } catch {
      return null;
    }
  }, [state, timeSeconds]);

  const oxideMask = useMemo(() => {
    try {
      return calculateMinimumOxideMaskThickness({
        dopant: state.dopant,
        tempCelsius: state.tempCelsius,
        timeSeconds,
      });
    } catch {
      return null;
    }
  }, [state.dopant, state.tempCelsius, timeSeconds]);

  const copyResult = async () => {
    const isPredep = state.processType === 'predeposition';
    const active = isPredep ? predepResult : driveInResult;
    if (!active) return;

    const summary = [
      `Dopant: ${dopantInfo.name} (${dopantInfo.symbol}, ${dopantInfo.dopantType})`,
      `Process Regime: ${isPredep ? 'Constant Source (Predeposition / erfc)' : 'Limited Source (Drive-in / Gaussian)'}`,
      `Diffusion Temperature: ${state.tempCelsius} °C`,
      `Diffusion Time: ${state.timeMinutes} min (${timeSeconds} s)`,
      `Diffusion Coefficient D(Si): ${D_Si.toExponential(4)} cm²/s`,
      `Diffusion Length 2√(Dt): ${(active.characteristicLengthUm * 2).toFixed(4)} μm (${(active.characteristicLengthUm * 2000).toFixed(1)} nm)`,
      isPredep
        ? `Surface Concentration Cs: ${predepResult?.surfaceConcentrationCm3.toExponential(3)} cm⁻³`
        : `Surface Concentration Cs: ${driveInResult?.surfaceConcentrationCm3.toExponential(3)} cm⁻³`,
      isPredep
        ? `Incorporated Dose Q: ${predepResult?.doseQ.toExponential(3)} atoms/cm²`
        : `Initial Dose Q: ${driveInResult?.doseQ.toExponential(3)} atoms/cm²`,
      `Background Doping C_sub: ${Number.parseFloat(state.backgroundDopingCm3).toExponential(3)} cm⁻³`,
      `Metallurgical Junction Depth (xj): ${active.junctionDepthUm ? active.junctionDepthUm.toFixed(4) + ' μm (' + (active.junctionDepthUm * 1000).toFixed(1) + ' nm)' : 'N/A (Cs <= C_sub)'}`,
      oxideMask ? `Minimum SiO2 Masking Oxide: ${oxideMask.minThickness3xNm.toFixed(1)} nm (conservative 4x: ${oxideMask.minThickness4xNm.toFixed(1)} nm)` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="dopant-inputs">
        <h2 id="dopant-inputs">Thermal Diffusion Parameters</h2>

        <div className="field">
          <label>Process Profile Model</label>
          <div className="segmented-control" role="group" aria-label="Process type">
            <button
              type="button"
              className={state.processType === 'predeposition' ? 'active' : ''}
              onClick={() => update('processType', 'predeposition')}
            >
              Predeposition (erfc)
            </button>
            <button
              type="button"
              className={state.processType === 'drive-in' ? 'active' : ''}
              onClick={() => update('processType', 'drive-in')}
            >
              Drive-in (Gaussian)
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="dopant-select">Dopant Species</label>
            <select
              id="dopant-select"
              value={state.dopant}
              onChange={(e) => update('dopant', e.target.value as DopantSpecies)}
            >
              <option value="B">Boron (B) — p-type (Acceptor)</option>
              <option value="P">Phosphorus (P) — n-type (Donor)</option>
              <option value="As">Arsenic (As) — n-type (Donor)</option>
              <option value="Sb">Antimony (Sb) — n-type (Donor)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="temp-c">Temperature (°C)</label>
            <input
              id="temp-c"
              type="number"
              min={700}
              max={1300}
              step={10}
              value={state.tempCelsius}
              onChange={(e) => update('tempCelsius', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="time-min">Furnace Time (min)</label>
            <input
              id="time-min"
              type="number"
              min={1}
              step={5}
              value={state.timeMinutes}
              onChange={(e) => update('timeMinutes', Math.max(0.1, Number(e.target.value)))}
            />
          </div>

          <div className="field">
            <label htmlFor="cb-sub">Substrate Doping C_B (cm⁻³)</label>
            <input
              id="cb-sub"
              type="text"
              value={state.backgroundDopingCm3}
              onChange={(e) => update('backgroundDopingCm3', e.target.value)}
              placeholder="e.g. 1e16"
            />
          </div>
        </div>

        {state.processType === 'predeposition' ? (
          <div className="field">
            <label>Surface Concentration (Cs)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  checked={state.useSolidSolubility}
                  onChange={() => update('useSolidSolubility', true)}
                />
                Solid Solubility Limit ({solidSolubility.toExponential(2)} cm⁻³)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  checked={!state.useSolidSolubility}
                  onChange={() => update('useSolidSolubility', false)}
                />
                Custom Cs
              </label>
            </div>
            {!state.useSolidSolubility && (
              <input
                type="text"
                value={state.customCsCm3}
                onChange={(e) => update('customCsCm3', e.target.value)}
                placeholder="e.g. 5e19"
              />
            )}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="dose-q">Predeposition / Implantation Dose Q (atoms/cm²)</label>
            <input
              id="dose-q"
              type="text"
              value={state.doseQCm2}
              onChange={(e) => update('doseQCm2', e.target.value)}
              placeholder="e.g. 1e15"
            />
          </div>
        )}

        <div className="action-row" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>
          <button type="button" className="button" onClick={copyResult}>
            <Copy size={14} aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy Results'}</span>
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="dopant-results">
        <h2 id="dopant-results">Junction Depth & Doping Profile</h2>

        {(() => {
          const isPredep = state.processType === 'predeposition';
          const active = isPredep ? predepResult : driveInResult;

          if (!active) {
            return <div className="notice warning">Invalid diffusion conditions. Check substrate and surface concentrations.</div>;
          }

          const xjUm = active.junctionDepthUm;
          const xjNm = active.junctionDepthNm;

          return (
            <>
              <div className="result-hero" style={{ marginBottom: 16 }}>
                <span className="result-label">Metallurgical Junction Depth (x_j)</span>
                <span className="result-value">
                  {xjUm !== undefined ? fmt(xjUm, 4) : 'N/A'}
                  <span className="result-suffix"> μm</span>
                </span>
                <span className="result-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  {xjNm !== undefined ? `= ${fmt(xjNm, 1)} nm at background doping C(x_j) = C_B` : 'C_s does not exceed background doping C_B'}
                </span>
              </div>

              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">Diffusion Coefficient D</span>
                  <span className="metric-value">{D_Si.toExponential(3)}</span>
                  <span className="metric-unit">cm² / s in Si</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Diffusion Length 2√(Dt)</span>
                  <span className="metric-value">{fmt(active.characteristicLengthUm * 2, 4)}</span>
                  <span className="metric-unit">μm ({fmt(active.characteristicLengthUm * 2000, 1)} nm)</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Surface Concentration C_s</span>
                  <span className="metric-value">{active.surfaceConcentrationCm3.toExponential(3)}</span>
                  <span className="metric-unit">cm⁻³</span>
                </div>

                <div className="metric">
                  <span className="metric-label">{isPredep ? 'Incorporated Dose Q' : 'Dopant Dose Q'}</span>
                  <span className="metric-value">
                    {isPredep ? predepResult?.doseQ.toExponential(3) : driveInResult?.doseQ.toExponential(3)}
                  </span>
                  <span className="metric-unit">atoms / cm²</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Solid Solubility Limit</span>
                  <span className="metric-value">{solidSolubility.toExponential(3)}</span>
                  <span className="metric-unit">cm⁻³ at {state.tempCelsius} °C</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Thermal Budget D·t</span>
                  <span className="metric-value">{(D_Si * timeSeconds).toExponential(3)}</span>
                  <span className="metric-unit">cm²</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Min. SiO₂ Mask (3x)</span>
                  <span className="metric-value">{oxideMask ? fmt(oxideMask.minThickness3xNm, 1) : '—'}</span>
                  <span className="metric-unit">nm (3√(D_ox·t))</span>
                </div>

                <div className="metric">
                  <span className="metric-label">Safe SiO₂ Mask (4x)</span>
                  <span className="metric-value">{oxideMask ? fmt(oxideMask.minThickness4xNm, 1) : '—'}</span>
                  <span className="metric-unit">nm (4√(D_ox·t))</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  borderRadius: 6,
                  background: 'var(--surface-sunken)',
                  borderLeft: '4px solid var(--teal)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>
                  Profile Description:
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  {isPredep ? (
                    <>
                      <strong>Constant Source (Complementary Error Function erfc)</strong>: Constant dopant flux from gaseous source (e.g. BBr₃, POCl₃, or spin-on dopant) maintains surface saturation at {active.surfaceConcentrationCm3.toExponential(2)} cm⁻³.
                    </>
                  ) : (
                    <>
                      <strong>Limited Source (Gaussian Distribution)</strong>: Finite fixed dopant dose Q is redistributed into the silicon bulk during high-temperature drive-in annealing, dropping surface concentration Cs over time.
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </section>
    </div>
  );
}
