'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Copy, RotateCcw, AlertTriangle, Download } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateIonImplantation,
  generateDepthProfile,
  parseScientificNumber,
  SPECIES_CATALOG,
  type IonSpecies,
} from '@/lib/ion-implantation';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv, downloadSvg, downloadXlsx } from '@/lib/export';
import { useGlossary } from '@/lib/i18n/glossary';

interface FormState {
  [key: string]: string | number | boolean;
  species: IonSpecies;
  energyKeV: string;
  doseCm2: string;
  backgroundDopingCm3: string;
  customRpNm: string;
  customDeltaRpNm: string;
  showCustomOverrides: boolean;
}

const INITIAL_STATE: FormState = {
  species: 'B',
  energyKeV: '50',
  doseCm2: '1e14',
  backgroundDopingCm3: '1e15',
  customRpNm: '',
  customDeltaRpNm: '',
  showCustomOverrides: false,
};

export default function IonImplantationCalculator() {
  const g = useGlossary();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useUrlParamsState(form, setForm);

  // Accessible IDs for inputs
  const speciesId = useId();
  const energyId = useId();
  const doseId = useId();
  const backgroundId = useId();
  const customRpId = useId();
  const customDeltaRpId = useId();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parsedEnergy = Number(form.energyKeV);
  const parsedDose = parseScientificNumber(form.doseCm2);
  const parsedBackground = parseScientificNumber(form.backgroundDopingCm3);

  const customRpNum = form.customRpNm.trim() !== '' ? Number(form.customRpNm) : null;
  const customDeltaRpNum = form.customDeltaRpNm.trim() !== '' ? Number(form.customDeltaRpNm) : null;

  const result = useMemo(() => {
    return calculateIonImplantation({
      species: form.species,
      energyKeV: parsedEnergy,
      doseCm2: parsedDose,
      backgroundDopingCm3: parsedBackground,
      customRpNm: form.species === 'Custom' || form.showCustomOverrides ? customRpNum : undefined,
      customDeltaRpNm: form.species === 'Custom' || form.showCustomOverrides ? customDeltaRpNum : undefined,
    });
  }, [
    form.species,
    form.showCustomOverrides,
    parsedEnergy,
    parsedDose,
    parsedBackground,
    customRpNum,
    customDeltaRpNum,
  ]);

  const profilePoints = useMemo(() => {
    if (!result.ok) return [];
    return generateDepthProfile(result, 160);
  }, [result]);

  const copySummary = async () => {
    if (!result.ok) return;

    const textLines = [
      'Ion Implantation & Doping Calculation',
      `Species: ${result.speciesName}`,
      `Energy: ${fmt(result.energyKeV)} keV`,
      `Dose: ${result.doseCm2.toExponential(3)} cm⁻²`,
      `Background Doping: ${result.backgroundDopingCm3.toExponential(3)} cm⁻³`,
      `Projected Range (Rp): ${fmt(result.rpNm)} nm (${fmt(result.rpUm)} µm)`,
      `Projected Straggle (ΔRp): ${fmt(result.deltaRpNm)} nm (${fmt(result.deltaRpUm)} µm)`,
      `Peak Concentration (Np): ${result.peakConcentrationCm3.toExponential(3)} cm⁻³`,
      `Surface Concentration N(0): ${result.surfaceConcentrationCm3.toExponential(3)} cm⁻³`,
      result.junctionDepthNm !== null
        ? `Junction Depth (xj): ${fmt(result.junctionDepthNm)} nm (${fmt(result.junctionDepthUm ?? 0)} µm)`
        : 'Junction Depth (xj): Not formed (Np ≤ Nb)',
      `Dose Retention in Silicon: ${result.retentionPercent.toFixed(2)}%`,
    ];

    try {
      await navigator.clipboard.writeText(textLines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const buildExportRows = () => {
    if (!result.ok || profilePoints.length === 0) return null;
    const headers = [
      'depth_nm',
      'depth_um',
      'concentration_cm3',
      'species',
      'energy_keV',
      'dose_cm2',
      'rp_nm',
      'delta_rp_nm',
      'junction_depth_nm',
      'amorphized',
    ];
    const rows = profilePoints.map((pt) => [
      pt.depthNm.toFixed(2),
      pt.depthUm.toFixed(4),
      pt.concentrationCm3.toExponential(4),
      result.species,
      result.energyKeV,
      result.doseCm2.toExponential(3),
      result.rpNm.toFixed(2),
      result.deltaRpNm.toFixed(2),
      result.junctionDepthNm !== null ? result.junctionDepthNm.toFixed(2) : 'N/A',
      result.isAmorphized ? 'YES' : 'NO',
    ]);
    return {
      headers,
      rows,
      filename: `ion-implant-${result.species}-${result.energyKeV}keV`,
    };
  };

  const exportCsv = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv(`${data.filename}.csv`, data.headers, data.rows);
  };

  const exportXlsx = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx(`${data.filename}.xlsx`, 'Implant Profile', data.headers, data.rows);
  };

  // SVG dimensions and coordinate mapping
  const svgWidth = 560;
  const svgHeight = 280;
  const margin = { top: 25, right: 30, bottom: 45, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const chartData = useMemo(() => {
    if (!result.ok || profilePoints.length === 0) return null;

    const maxDepth = profilePoints[profilePoints.length - 1].depthNm;
    const logNb = Math.log10(Math.max(1, result.backgroundDopingCm3));
    const logNp = Math.log10(Math.max(1, result.peakConcentrationCm3));

    // Dynamic vertical log range
    const yMinLog = Math.max(12, Math.floor(Math.min(logNb - 1, 14)));
    const yMaxLog = Math.max(yMinLog + 3, Math.ceil(logNp + 0.6));

    const scaleX = (xNm: number) => margin.left + (xNm / maxDepth) * plotWidth;
    const scaleY = (logC: number) => {
      const clamped = Math.max(yMinLog, Math.min(yMaxLog, logC));
      return margin.top + (1 - (clamped - yMinLog) / (yMaxLog - yMinLog)) * plotHeight;
    };

    // Construct SVG path for N(x)
    const pathD = profilePoints
      .map((p, idx) => {
        const sx = scaleX(p.depthNm);
        const sy = scaleY(p.logConcentration);
        return `${idx === 0 ? 'M' : 'L'} ${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(' ');

    // Area path under curve down to baseline
    const areaD = `${pathD} L ${scaleX(maxDepth).toFixed(1)},${(margin.top + plotHeight).toFixed(1)} L ${scaleX(0).toFixed(1)},${(margin.top + plotHeight).toFixed(1)} Z`;

    const rpX = scaleX(result.rpNm);
    const rpY = scaleY(Math.log10(result.peakConcentrationCm3));

    const xjX = result.junctionDepthNm !== null ? scaleX(result.junctionDepthNm) : null;
    const nbY = scaleY(logNb);

    // Y ticks
    const yTicks: { logVal: number; label: string; y: number }[] = [];
    for (let l = Math.ceil(yMinLog); l <= Math.floor(yMaxLog); l += 1) {
      yTicks.push({
        logVal: l,
        label: `10${toSuperscript(l)}`,
        y: scaleY(l),
      });
    }

    // X ticks (5 intervals)
    const xTicks: { depthNm: number; label: string; x: number }[] = [];
    const xStep = Math.round(maxDepth / 5 / 10) * 10 || Math.round(maxDepth / 5);
    for (let d = 0; d <= maxDepth; d += xStep) {
      if (d > 0 && d <= maxDepth) {
        xTicks.push({
          depthNm: d,
          label: `${d}`,
          x: scaleX(d),
        });
      }
    }

    return {
      maxDepth,
      yMinLog,
      yMaxLog,
      scaleX,
      scaleY,
      pathD,
      areaD,
      rpX,
      rpY,
      xjX,
      nbY,
      yTicks,
      xTicks,
    };
  }, [result, profilePoints, plotWidth, plotHeight, margin.left, margin.top]);

  return (
    <div className="calc-grid">
      {/* Inputs Column */}
      <section className="panel" aria-labelledby="implant-inputs-heading">
        <h2 id="implant-inputs-heading">Implant Parameters</h2>

        <div className="field">
          <label htmlFor={speciesId}>Ion Species</label>
          <select
            id={speciesId}
            value={form.species}
            onChange={(e) => {
              const newSpecies = e.target.value as IonSpecies;
              setForm((prev) => ({
                ...prev,
                species: newSpecies,
                showCustomOverrides: newSpecies === 'Custom' ? true : prev.showCustomOverrides,
              }));
            }}
          >
            <option value="B">Boron (¹¹B in Si) — p-type</option>
            <option value="P">Phosphorus (³¹P in Si) — n-type</option>
            <option value="As">Arsenic (⁷⁵As in Si) — n-type</option>
            <option value="BF2">BF₂ (⁴⁹BF₂ in Si) — p-type</option>
            <option value="Custom">Custom Parameters</option>
          </select>
          <span className="note" style={{ marginTop: '4px' }}>
            {SPECIES_CATALOG[form.species].description}
          </span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={energyId}>
              Energy<span className="unit">keV</span>
            </label>
            <input
              id={energyId}
              type="number"
              min="0.1"
              max="1000"
              step="any"
              value={form.energyKeV}
              onChange={(e) => update('energyKeV', e.target.value)}
              placeholder="e.g. 50"
            />
          </div>

          <div className="field">
            <label htmlFor={doseId}>
              {g('implantDose')} (Φ)<span className="unit">cm⁻²</span>
            </label>
            <input
              id={doseId}
              type="text"
              value={form.doseCm2}
              onChange={(e) => update('doseCm2', e.target.value)}
              placeholder="e.g. 1e14 or 10^14"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor={backgroundId}>
            Background Wafer Doping (Nb)<span className="unit">cm⁻³</span>
          </label>
          <input
            id={backgroundId}
            type="text"
            value={form.backgroundDopingCm3}
            onChange={(e) => update('backgroundDopingCm3', e.target.value)}
            placeholder="e.g. 1e15 or 5e14"
          />
        </div>

        {form.species !== 'Custom' && (
          <div style={{ margin: '10px 0' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={form.showCustomOverrides}
                onChange={(e) => update('showCustomOverrides', e.target.checked)}
              />
              Override standard Rp and ΔRp models manually
            </label>
          </div>
        )}

        {(form.species === 'Custom' || form.showCustomOverrides) && (
          <div className="form-row" style={{ background: 'var(--paper)', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="field">
              <label htmlFor={customRpId}>
                Projected Range (Rp)<span className="unit">nm</span>
              </label>
              <input
                id={customRpId}
                type="number"
                min="0"
                step="any"
                value={form.customRpNm}
                onChange={(e) => update('customRpNm', e.target.value)}
                placeholder="e.g. 175"
              />
            </div>

            <div className="field">
              <label htmlFor={customDeltaRpId}>
                Straggle (ΔRp)<span className="unit">nm</span>
              </label>
              <input
                id={customDeltaRpId}
                type="number"
                min="0.1"
                step="any"
                value={form.customDeltaRpNm}
                onChange={(e) => update('customDeltaRpNm', e.target.value)}
                placeholder="e.g. 56"
              />
            </div>
          </div>
        )}

        <div className="action-row">
          <button
            type="button"
            className="button primary"
            onClick={copySummary}
            disabled={!result.ok}
          >
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy result'}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setForm(INITIAL_STATE)}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={exportCsv}
            disabled={!result.ok}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={exportXlsx}
            disabled={!result.ok}
          >
            <Download size={16} aria-hidden="true" />
            Export XLSX
          </button>
        </div>
      </section>

      {/* Results & Profile Graph Column */}
      <section className="panel" aria-labelledby="implant-results-heading">
        <h2 id="implant-results-heading">Doping Profile & Junction Analysis</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">Peak Concentration (Np)</span>
            <div className="result-value" aria-live="polite">
              {result.peakConcentrationCm3.toExponential(3)}
              <span className="result-suffix" style={{ fontSize: '18px', color: 'var(--muted)' }}> cm⁻³</span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Projected Range (Rp)</span>
                <strong>{fmt(result.rpNm)} nm</strong>
                <span style={{ fontSize: '11px' }}>{fmt(result.rpUm)} µm</span>
              </div>

              <div className="metric">
                <span>Projected Straggle (ΔRp)</span>
                <strong>{fmt(result.deltaRpNm)} nm</strong>
                <span style={{ fontSize: '11px' }}>{fmt(result.deltaRpUm)} µm</span>
              </div>

              <div className="metric">
                <span>{g('junctionDepth')} (xj)</span>
                {result.junctionDepthNm !== null ? (
                  <>
                    <strong>{fmt(result.junctionDepthNm)} nm</strong>
                    <span style={{ fontSize: '11px' }}>{fmt(result.junctionDepthUm ?? 0)} µm</span>
                  </>
                ) : (
                  <strong style={{ color: 'var(--amber)' }}>No Junction</strong>
                )}
              </div>

              <div className="metric">
                <span>Surface Conc. N(0)</span>
                <strong>{result.surfaceConcentrationCm3.toExponential(2)}</strong>
                <span style={{ fontSize: '11px' }}>cm⁻³</span>
              </div>

              <div className="metric">
                <span>Silicon Retention</span>
                <strong>{result.retentionPercent.toFixed(2)}%</strong>
                <span style={{ fontSize: '11px' }}>integrated fluence</span>
              </div>

              <div className="metric">
                <span>Solubility Limit</span>
                <strong>~{result.solidSolubilityLimitCm3.toExponential(1)}</strong>
                <span style={{ fontSize: '11px' }}>cm⁻³ in Si</span>
              </div>

              <div className="metric">
                <span>Substrate State</span>
                <strong style={{ color: result.isAmorphized ? '#b0413a' : '#0d7c82' }}>
                  {result.isAmorphized ? 'Amorphized' : 'Damaged C-Si'}
                </strong>
                <span style={{ fontSize: '11px' }}>
                  {result.criticalAmorphizationDoseCm2 ? `Φcrit ~ ${result.criticalAmorphizationDoseCm2.toExponential(1)}` : 'threshold'}
                </span>
              </div>
            </div>

            {/* Warnings Alert */}
            {result.warnings.length > 0 && (
              <div
                style={{
                  background: '#fef8ea',
                  border: '1px solid #fae29f',
                  color: 'var(--amber)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {result.warnings.map((warn) => (
                  <div key={warn} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive SVG Concentration Depth Profile Curve */}
            {chartData && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                    Implant Concentration Depth Profile N(x)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      Logarithmic Y-axis
                    </span>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => svgRef.current && downloadSvg(svgRef.current, `implant-${result.species}-${result.energyKeV}keV.svg`)}
                    >
                      <Download size={13} aria-hidden="true" /> Save SVG
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '8px',
                    overflowX: 'auto',
                  }}
                >
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    role="img"
                    aria-label="Concentration profile curve vs depth"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Plot area background */}
                    <rect
                      x={margin.left}
                      y={margin.top}
                      width={plotWidth}
                      height={plotHeight}
                      fill="#fafbfc"
                      stroke="var(--line)"
                      strokeWidth="1"
                    />

                    {/* Horizontal grid lines for Y-axis (orders of magnitude) */}
                    {chartData.yTicks.map((tick) => (
                      <g key={tick.logVal}>
                        <line
                          x1={margin.left}
                          y1={tick.y}
                          x2={margin.left + plotWidth}
                          y2={tick.y}
                          stroke="#e6ebee"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={margin.left - 8}
                          y={tick.y + 4}
                          fontSize="10"
                          fill="var(--muted)"
                          textAnchor="end"
                          fontFamily="var(--font-mono)"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Vertical grid lines for X-axis (depth nm) */}
                    {chartData.xTicks.map((tick) => (
                      <g key={tick.depthNm}>
                        <line
                          x1={tick.x}
                          y1={margin.top}
                          x2={tick.x}
                          y2={margin.top + plotHeight}
                          stroke="#edf1f3"
                        />
                        <text
                          x={tick.x}
                          y={margin.top + plotHeight + 14}
                          fontSize="10"
                          fill="var(--muted)"
                          textAnchor="middle"
                          fontFamily="var(--font-mono)"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* X and Y Axis Titles */}
                    <text
                      x={margin.left + plotWidth / 2}
                      y={margin.top + plotHeight + 32}
                      fontSize="11"
                      fontWeight="500"
                      fill="var(--ink-soft)"
                      textAnchor="middle"
                    >
                      Depth x (nm)
                    </text>

                    <text
                      x={16}
                      y={margin.top + plotHeight / 2}
                      fontSize="11"
                      fontWeight="500"
                      fill="var(--ink-soft)"
                      textAnchor="middle"
                      transform={`rotate(-90, 16, ${margin.top + plotHeight / 2})`}
                    >
                      Concentration (cm⁻³)
                    </text>

                    {/* Background Wafer Doping Baseline Nb */}
                    {chartData.nbY >= margin.top && chartData.nbY <= margin.top + plotHeight && (
                      <g>
                        <line
                          x1={margin.left}
                          y1={chartData.nbY}
                          x2={margin.left + plotWidth}
                          y2={chartData.nbY}
                          stroke="#b0413a"
                          strokeWidth="1.5"
                          strokeDasharray="5 3"
                        />
                        <text
                          x={margin.left + plotWidth - 6}
                          y={chartData.nbY - 4}
                          fontSize="10"
                          fontWeight="600"
                          fill="#b0413a"
                          textAnchor="end"
                        >
                          Nb Substrate ({result.backgroundDopingCm3.toExponential(1)})
                        </text>
                      </g>
                    )}

                    {/* Shaded Area under Profile Curve */}
                    <path d={chartData.areaD} fill="rgba(13, 124, 130, 0.08)" />

                    {/* Main Gaussian Concentration Curve N(x) */}
                    <path
                      d={chartData.pathD}
                      fill="none"
                      stroke="var(--teal)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Peak Marker Rp */}
                    <line
                      x1={chartData.rpX}
                      y1={margin.top}
                      x2={chartData.rpX}
                      y2={margin.top + plotHeight}
                      stroke="var(--teal-dark)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={chartData.rpX}
                      cy={chartData.rpY}
                      r="4"
                      fill="var(--teal)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={chartData.rpX}
                      y={margin.top - 6}
                      fontSize="10.5"
                      fontWeight="600"
                      fill="var(--teal-dark)"
                      textAnchor="middle"
                    >
                      Rp = {Math.round(result.rpNm)} nm
                    </text>

                    {/* Junction Depth Marker xj */}
                    {chartData.xjX !== null && chartData.xjX <= margin.left + plotWidth && (
                      <g>
                        <line
                          x1={chartData.xjX}
                          y1={margin.top}
                          x2={chartData.xjX}
                          y2={margin.top + plotHeight}
                          stroke="#dfa243"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={chartData.xjX}
                          cy={chartData.nbY}
                          r="4.5"
                          fill="#dfa243"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={chartData.xjX}
                          y={margin.top - 6}
                          fontSize="10.5"
                          fontWeight="600"
                          fill="#915a13"
                          textAnchor="middle"
                        >
                          xj = {Math.round(result.junctionDepthNm!)} nm
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Graph Legend */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '12px',
                    marginTop: '8px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '3px', background: 'var(--teal)', display: 'inline-block' }} />
                    <span>Dopant Profile N(x)</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '2px', background: '#b0413a', borderBottom: '1px dashed #b0413a', display: 'inline-block' }} />
                    <span>Wafer Substrate Nb</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dfa243', display: 'inline-block' }} />
                    <span>{g('junctionDepth')} (xj)</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/** Helper to render power superscripts in SVG e.g. 10¹⁶ */
function toSuperscript(num: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(num)
    .split('')
    .map((char) => map[char] ?? char)
    .join('');
}
