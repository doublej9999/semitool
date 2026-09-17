'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/wire-bonding-calculator';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';
import {
  calculateWireBonding,
  WIRE_MATERIALS,
} from '@/lib/wire-bonding';

const INITIAL = {
  materialId: 'gold',
  wireLengthMm: '2.0',
  wireDiameterUm: '25.4', // 1 mil
  frequencyMHz: '1000', // 1 GHz
  operatingCurrentA: '0.1', // 100 mA
  ambientTempC: '25',
};

export default function WireBondingCalculator() {
  const t = useToolCopy(copyResource);
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const len = Number(state.wireLengthMm);
    const diam = Number(state.wireDiameterUm);
    const freq = Number(state.frequencyMHz) * 1e6;
    const curr = Number(state.operatingCurrentA);
    const temp = Number(state.ambientTempC);

    return calculateWireBonding({
      materialId: state.materialId,
      wireLengthMm: len,
      wireDiameterUm: diam,
      frequencyHz: freq,
      operatingCurrentA: curr,
      ambientTempC: temp,
    });
  }, [state]);

  const copy = async () => {
    if (!result.ok) return;
    const lines = [
      `Wire Bonding Parasitics Analysis (${result.material.name})`,
      `Wire Length: ${result.wireLengthMm} mm, Diameter: ${result.wireDiameterUm} µm (${result.wireDiameterMils.toFixed(2)} mils)`,
      `Frequency: ${(result.frequencyHz / 1e6).toFixed(1)} MHz`,
      `Self Inductance: ${fmt(result.inductanceNh)} nH`,
      `DC Resistance: ${fmt(result.dcResistanceMOhm)} mΩ`,
      `AC Resistance (Skin Effect): ${fmt(result.acResistanceMOhm)} mΩ (ratio: ${fmt(result.skinEffectRatio)}x)`,
      `Skin Depth: ${fmt(result.deltaSkinUm)} µm`,
      `HF Impedance |Z|: ${fmt(result.impedanceOhm)} Ω`,
      `Preece Fusing Current: ${fmt(result.fusingCurrentA)} A`,
      `JEDEC Safe DC Current: ${fmt(result.safeCurrentA)} A`,
      `Current Utilization: ${fmt(result.utilizationPct)}%`,
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
        <h2>{t("Wire Geometry & Operating Conditions")}</h2>

        <div className="field">
          <label htmlFor="material-sel">{t("Wire Material")}</label>
          <select
            id="material-sel"
            value={state.materialId}
            onChange={(e) => setState((p) => ({ ...p, materialId: e.target.value }))}
          >
            {WIRE_MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (ρ = {(m.resistivityOhmM * 1e8).toFixed(2)} {t("µΩ·cm)")}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="wire-len">{t("Wire Length (mm)")}</label>
          <input
            id="wire-len"
            type="number"
            step="any"
            value={state.wireLengthMm}
            onChange={(e) => setState((p) => ({ ...p, wireLengthMm: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="wire-diam">{t("Wire Diameter (µm, 25.4 µm = 1.0 mil)")}</label>
          <input
            id="wire-diam"
            type="number"
            step="any"
            value={state.wireDiameterUm}
            onChange={(e) => setState((p) => ({ ...p, wireDiameterUm: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="freq-mhz">{t("Signal Frequency (MHz)")}</label>
          <input
            id="freq-mhz"
            type="number"
            step="any"
            value={state.frequencyMHz}
            onChange={(e) => setState((p) => ({ ...p, frequencyMHz: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="curr-a">{t("Operating DC/RMS Current (A)")}</label>
          <input
            id="curr-a"
            type="number"
            step="any"
            value={state.operatingCurrentA}
            onChange={(e) => setState((p) => ({ ...p, operatingCurrentA: e.target.value }))}
          />
        </div>

        <div className="action-row" style={{ marginTop: '16px' }}>
          <button type="button" className="button primary" onClick={copy} disabled={!result.ok}>
            <Copy size={16} aria-hidden="true" />
            {copied ? t("Copied") : t("Copy result")}
          </button>
          <button type="button" className="button secondary" onClick={() => setState(INITIAL)}>
            <RotateCcw size={16} aria-hidden="true" />
            {t("Reset")}</button>
        </div>
      </section>

      <section className="panel">
        <h2>{t("Parasitics & Current Limits")}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{t("Total Self Inductance")}</span>
            <div className="result-value" aria-live="polite">
              {fmt(result.inductanceNh)} <span className="result-suffix">nH</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>{t("DC Resistance")}</span>
                <strong>{fmt(result.dcResistanceMOhm)} {t("mΩ")}</strong>
              </div>
              <div className="metric">
                <span>{t("AC Resistance (Skin)")}</span>
                <strong>{fmt(result.acResistanceMOhm)} {t("mΩ")}</strong>
              </div>
              <div className="metric">
                <span>{t("Skin Depth (δ)")}</span>
                <strong>{fmt(result.deltaSkinUm)} {t("µm")}</strong>
              </div>
              <div className="metric">
                <span>{t("Total Impedance |Z|")}</span>
                <strong>{fmt(result.impedanceOhm)} Ω</strong>
              </div>
              <div className="metric">
                <span>{t("Preece Fusing Current")}</span>
                <strong>{fmt(result.fusingCurrentA)} A</strong>
              </div>
              <div className="metric">
                <span>{t("JEDEC Safe Current")}</span>
                <strong>{fmt(result.safeCurrentA)} A</strong>
              </div>
              <div className="metric">
                <span>{t("Current Utilization")}</span>
                <strong style={{ color: result.isCurrentSafe ? 'var(--teal)' : 'var(--red)' }}>
                  {fmt(result.utilizationPct)}%
                </strong>
              </div>
              <div className="metric">
                <span>{t("Diameter in Mils")}</span>
                <strong>{result.wireDiameterMils.toFixed(2)} mils</strong>
              </div>
            </div>

            <WireBondDiagram result={result} />
          </>
        )}
      </section>
    </div>
  );
}

function WireBondDiagram({ result }: { result: ReturnType<typeof calculateWireBonding> & { ok: true } }) {
  const t = useToolCopy(copyResource);
  const width = 460;
  const height = 150;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--ink)' }}>
        {t("Bond Wire Interconnect Model")}</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '6px' }}
        role="img"
        aria-label={t("Wire bonding loop diagram")}
      >
        {/* Silicon Die & Bond Pad */}
        <rect x="30" y="90" width="80" height="40" fill="#cbd5e1" rx="3" />
        <rect x="70" y="85" width="25" height="6" fill="#f59e0b" rx="1" />
        <text x="70" y="120" fontSize="10" fill="#334155" fontWeight="600" textAnchor="middle">
          {t("Die Pad")}</text>

        {/* Leadframe / Substrate Pad */}
        <rect x="350" y="90" width="80" height="40" fill="#cbd5e1" rx="3" />
        <rect x="365" y="85" width="25" height="6" fill="#f59e0b" rx="1" />
        <text x="390" y="120" fontSize="10" fill="#334155" fontWeight="600" textAnchor="middle">
          {t("Leadframe")}</text>

        {/* Arched Bond Wire Curve */}
        <path
          d="M 82 85 Q 230 15 377 85"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Labels on Arch */}
        <text x="230" y="38" fontSize="11" fill="var(--ink)" fontWeight="600" textAnchor="middle">
          {result.material.name} {t("(L =")}{result.wireLengthMm} {t("mm)")}</text>
        <text x="230" y="55" fontSize="10" fill="var(--teal-dark)" textAnchor="middle">
          {t("L ≈")}{fmt(result.inductanceNh)} {t("nH, Rac ≈")}{fmt(result.acResistanceMOhm)} {t("mΩ")}</text>
      </svg>
    </div>
  );
}
