'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateMosfetThreshold,
  DIELECTRIC_PRESETS,
  GATE_PRESETS,
  type MosfetChannelType,
} from '@/lib/mosfet-threshold';

const INITIAL = {
  channelType: 'nmos' as MosfetChannelType,
  substrateDoping: '1e17',
  toxNm: '2.0',
  dielectricId: 'sio2',
  customEpsR: '3.9',
  gateId: 'n_poly',
  customWorkFunction: '4.05',
  bodyBiasVsb: '0.0',
  fixedChargeQox: '1e10',
};

function parseSci(str: string): number {
  const trimmed = str.trim().replace(/×10\^?/i, 'e').replace(/\^/g, '');
  return Number(trimmed);
}

export default function MosfetThresholdCalculator() {
  const [state, setState] = useState(INITIAL);
  const [copied, setCopied] = useState(false);

  const selectedDielectric = DIELECTRIC_PRESETS.find((d) => d.id === state.dielectricId);
  const selectedGate = GATE_PRESETS.find((g) => g.id === state.gateId);

  const epsR =
    state.dielectricId === 'custom'
      ? parseSci(state.customEpsR)
      : (selectedDielectric?.epsR ?? 3.9);

  const gateWf =
    state.gateId === 'custom'
      ? parseSci(state.customWorkFunction)
      : (selectedGate?.workFunctionEv ?? 4.05);

  const result = useMemo(() => {
    const nSub = parseSci(state.substrateDoping);
    const tox = parseSci(state.toxNm);
    const vsb = parseSci(state.bodyBiasVsb);
    const qox = parseSci(state.fixedChargeQox);

    return calculateMosfetThreshold({
      channelType: state.channelType,
      substrateDopingCm3: nSub,
      toxNm: tox,
      dielectricEpsR: epsR,
      gateWorkFunctionEv: gateWf,
      bodyBiasV: vsb,
      qoxPerQ: qox,
    });
  }, [state, epsR, gateWf]);

  const copy = async () => {
    if (!result.ok) return;
    const lines = [
      `MOSFET Threshold & Dielectric Analysis (${result.channelType.toUpperCase()})`,
      `Substrate Doping: ${result.substrateDopingCm3.toExponential(2)} cm⁻³`,
      `Physical Dielectric Thickness (tox): ${result.toxNm} nm`,
      `Dielectric Permittivity (εr): ${result.dielectricEpsR}`,
      `Equivalent Oxide Thickness (EOT): ${fmt(result.eotNm)} nm`,
      `Gate Oxide Capacitance (Cox): ${fmt(result.coxFFPerUm2)} fF/µm²`,
      `Flatband Voltage (Vfb): ${fmt(result.vfbV)} V`,
      `Zero-bias Threshold Voltage (Vth0): ${fmt(result.vth0V)} V`,
      `Body Bias (Vsb): ${result.bodyBiasV} V`,
      `Threshold Voltage with Body Bias (Vth): ${fmt(result.vthV)} V`,
      `Body Effect Coefficient (γ): ${fmt(result.gammaV05)} V^0.5`,
      `Subthreshold Swing (S): ${fmt(result.subthresholdSwingMVPerDec)} mV/decade`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel">
        <h2>Transistor & Gate Stack Inputs</h2>

        <div className="field">
          <span className="field-label">Channel Type</span>
          <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`button ${state.channelType === 'nmos' ? 'primary' : 'secondary'}`}
              onClick={() => setState((p) => ({ ...p, channelType: 'nmos', gateId: 'n_poly' }))}
            >
              NMOS (p-substrate)
            </button>
            <button
              type="button"
              className={`button ${state.channelType === 'pmos' ? 'primary' : 'secondary'}`}
              onClick={() => setState((p) => ({ ...p, channelType: 'pmos', gateId: 'p_poly' }))}
            >
              PMOS (n-substrate)
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="sub-doping">
            {state.channelType === 'nmos' ? 'Substrate Acceptor Na' : 'Substrate Donor Nd'} (cm⁻³)
          </label>
          <input
            id="sub-doping"
            type="text"
            value={state.substrateDoping}
            onChange={(e) => setState((p) => ({ ...p, substrateDoping: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="tox-nm">Physical Dielectric Thickness tox (nm)</label>
          <input
            id="tox-nm"
            type="text"
            value={state.toxNm}
            onChange={(e) => setState((p) => ({ ...p, toxNm: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="dielectric-sel">Dielectric Material</label>
          <select
            id="dielectric-sel"
            value={state.dielectricId}
            onChange={(e) => setState((p) => ({ ...p, dielectricId: e.target.value }))}
          >
            {DIELECTRIC_PRESETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (εr = {d.epsR})
              </option>
            ))}
          </select>
        </div>

        {state.dielectricId === 'custom' && (
          <div className="field">
            <label htmlFor="custom-eps">Custom Relative Permittivity (εr)</label>
            <input
              id="custom-eps"
              type="text"
              value={state.customEpsR}
              onChange={(e) => setState((p) => ({ ...p, customEpsR: e.target.value }))}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="gate-sel">Gate Electrode Material</label>
          <select
            id="gate-sel"
            value={state.gateId}
            onChange={(e) => setState((p) => ({ ...p, gateId: e.target.value }))}
          >
            {GATE_PRESETS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (Φm = {g.workFunctionEv} eV)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="vsb-bias">Body-to-Source Reverse Bias Vsb (V)</label>
          <input
            id="vsb-bias"
            type="text"
            value={state.bodyBiasVsb}
            onChange={(e) => setState((p) => ({ ...p, bodyBiasVsb: e.target.value }))}
          />
        </div>

        <div className="action-row" style={{ marginTop: '16px' }}>
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
        <h2>Threshold Voltage & Electrostatics</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Effective Threshold Voltage (Vth)</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.vthV)} <span className="result-suffix">V</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Zero-bias Vth0</span>
                <strong>{fmt(result.vth0V)} V</strong>
              </div>
              <div className="metric">
                <span>Equivalent Oxide EOT</span>
                <strong>{fmt(result.eotNm)} nm</strong>
              </div>
              <div className="metric">
                <span>Gate Cap Cox</span>
                <strong>{fmt(result.coxFFPerUm2)} fF/µm²</strong>
              </div>
              <div className="metric">
                <span>Flatband Voltage Vfb</span>
                <strong>{fmt(result.vfbV)} V</strong>
              </div>
              <div className="metric">
                <span>Work Function Diff Φms</span>
                <strong>{fmt(result.phiMsV)} V</strong>
              </div>
              <div className="metric">
                <span>Body Effect γ</span>
                <strong>{fmt(result.gammaV05)} V½</strong>
              </div>
              <div className="metric">
                <span>Subthreshold Swing S</span>
                <strong>{fmt(result.subthresholdSwingMVPerDec)} mV/dec</strong>
              </div>
              <div className="metric">
                <span>Bulk Potential 2ϕB</span>
                <strong>{fmt(2 * result.phiBV)} V</strong>
              </div>
            </div>

            <MosfetBandDiagram result={result} />
          </>
        )}
      </section>
    </div>
  );
}

function MosfetBandDiagram({ result }: { result: ReturnType<typeof calculateMosfetThreshold> & { ok: true } }) {
  const width = 460;
  const height = 170;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--ink)' }}>
        MOS Gate Stack Schematic
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '6px' }}
        role="img"
        aria-label="MOS gate stack diagram"
      >
        {/* Gate Electrode */}
        <rect x="30" y="30" width="90" height="100" fill="#a4b4c4" rx="4" />
        <text x="75" y="75" fontSize="11" fill="#1b2a3a" fontWeight="600" textAnchor="middle">
          Gate Metal
        </text>
        <text x="75" y="93" fontSize="10" fill="#445566" textAnchor="middle">
          {fmt(result.gateWorkFunctionEv)} eV
        </text>

        {/* Dielectric */}
        <rect x="125" y="30" width="65" height="100" fill="var(--teal)" fillOpacity="0.25" stroke="var(--teal)" strokeWidth="1.5" rx="2" />
        <text x="157" y="75" fontSize="10" fill="var(--teal-dark)" fontWeight="600" textAnchor="middle">
          Dielectric
        </text>
        <text x="157" y="90" fontSize="9" fill="var(--muted)" textAnchor="middle">
          {result.toxNm} nm
        </text>
        <text x="157" y="103" fontSize="9" fill="var(--muted)" textAnchor="middle">
          EOT: {fmt(result.eotNm)} nm
        </text>

        {/* Silicon Channel & Depletion */}
        <rect x="195" y="30" width="235" height="100" fill="#e8eee8" rx="4" />
        <rect x="195" y="30" width="70" height="100" fill="#d0dfd0" />
        <text x="230" y="75" fontSize="10" fill="#2d5530" fontWeight="600" textAnchor="middle">
          Depletion
        </text>
        <text x="230" y="90" fontSize="9" fill="#4a704d" textAnchor="middle">
          Wdep,max
        </text>

        <text x="350" y="75" fontSize="11" fill="#2d5530" fontWeight="600" textAnchor="middle">
          {result.channelType === 'nmos' ? 'p-Si Substrate' : 'n-Si Substrate'}
        </text>
        <text x="350" y="93" fontSize="10" fill="#557555" textAnchor="middle">
          {result.substrateDopingCm3.toExponential(1)} cm⁻³
        </text>

        {/* Subthreshold swing badge */}
        <text x="230" y="152" fontSize="11" fill="var(--muted)" textAnchor="middle">
          Subthreshold Swing: <tspan fontWeight="600" fill="var(--ink)">{fmt(result.subthresholdSwingMVPerDec)} mV/dec</tspan> (limit 60 mV/dec at 300K)
        </text>
      </svg>
    </div>
  );
}
