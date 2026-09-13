'use client';

import { useMemo, useState, useRef } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Download,
  Copy,
  Check,
  Timer,
  Activity,
  Waves,
} from 'lucide-react';
import {
  calculateBathDegradation,
  calculateRcaParticleCleanEfficiency,
  calculateSpikeDosing,
  WET_BENCH_RECIPES,
  type WetBenchRecipe,
} from '@/lib/wet-bench';
import { downloadCsv, downloadPdf, downloadXlsx } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';

interface WetBenchState {
  [key: string]: string | number | boolean;
  recipeId: string;
  bathVolumeL: number;
  currentConc: number;
  targetConc: number;
  sourceConc: number;
  bathTempC: number;
  runHours: number;
  bathLifeHours: number;
  dissolvedSiliconGL: number;
  maxLoadingGL: number;
  initialEtchRateNmMin: number;
  megasonicPowerW: number;
}

const DEFAULT_RECIPE_ID = 'sc-1';
const defaultRecipe = WET_BENCH_RECIPES[DEFAULT_RECIPE_ID];

const INITIAL_STATE: WetBenchState = {
  recipeId: DEFAULT_RECIPE_ID,
  bathVolumeL: defaultRecipe.defaultBathVolumeL,
  currentConc: defaultRecipe.defaultCurrentConc,
  targetConc: defaultRecipe.defaultTargetConc,
  sourceConc: defaultRecipe.defaultSourceConc,
  bathTempC: defaultRecipe.defaultTempC,
  runHours: defaultRecipe.defaultRunHours,
  bathLifeHours: defaultRecipe.defaultBathLifeHours,
  dissolvedSiliconGL: defaultRecipe.defaultDissolvedLoadingGL,
  maxLoadingGL: defaultRecipe.defaultMaxLoadingGL,
  initialEtchRateNmMin: defaultRecipe.defaultInitialEtchRateNmMin,
  megasonicPowerW: defaultRecipe.defaultMegasonicPowerW ?? 400,
};

const SELECTABLE_RECIPES = [
  { id: 'sc-1', label: 'SC-1 (NH₄OH:H₂O₂:H₂O)' },
  { id: 'sc-2', label: 'SC-2 (HCl:H₂O₂:H₂O)' },
  { id: 'spm', label: 'SPM Piranha (H₂SO₄:H₂O₂)' },
  { id: 'boe-6-1', label: 'BOE 6:1 (NH₄F:HF)' },
  { id: 'dhf-50-1', label: 'dHF 50:1 (Dilute HF)' },
];

export default function WetBenchCalculator() {
  const [state, setState] = useState<WetBenchState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  useUrlParamsState(state, setState);

  const selectedRecipe: WetBenchRecipe = useMemo(() => {
    return WET_BENCH_RECIPES[state.recipeId] || WET_BENCH_RECIPES['sc-1'];
  }, [state.recipeId]);

  const handleSelectRecipe = (id: string) => {
    const r = WET_BENCH_RECIPES[id];
    if (!r) return;
    setState({
      recipeId: id,
      bathVolumeL: r.defaultBathVolumeL,
      currentConc: r.defaultCurrentConc,
      targetConc: r.defaultTargetConc,
      sourceConc: r.defaultSourceConc,
      bathTempC: r.defaultTempC,
      runHours: r.defaultRunHours,
      bathLifeHours: r.defaultBathLifeHours,
      dissolvedSiliconGL: r.defaultDissolvedLoadingGL,
      maxLoadingGL: r.defaultMaxLoadingGL,
      initialEtchRateNmMin: r.defaultInitialEtchRateNmMin,
      megasonicPowerW: r.defaultMegasonicPowerW ?? 0,
    });
  };

  const handleReset = () => {
    handleSelectRecipe(state.recipeId);
  };

  // Calculations
  const calculations = useMemo(() => {
    let spikeVolumeL = 0;
    let spikeError: string | null = null;

    try {
      spikeVolumeL = calculateSpikeDosing(
        state.bathVolumeL,
        state.currentConc,
        state.targetConc,
        state.sourceConc,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        spikeError = err.message;
      } else {
        spikeError = 'Invalid spike parameters';
      }
    }

    let degradation = null;
    let degradationError: string | null = null;
    try {
      degradation = calculateBathDegradation({
        initialEtchRateNmMin: state.initialEtchRateNmMin,
        dissolvedSiliconGL: state.dissolvedSiliconGL,
        maxLoadingGL: state.maxLoadingGL,
        runHours: state.runHours,
        bathLifeHours: state.bathLifeHours,
        bathTempC: state.bathTempC,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        degradationError = err.message;
      } else {
        degradationError = 'Degradation calculation failed';
      }
    }

    let rcaClean = null;
    if (state.recipeId === 'sc-1') {
      try {
        rcaClean = calculateRcaParticleCleanEfficiency(
          state.bathTempC,
          state.megasonicPowerW,
          { nh4oh: 1, h2o2: 1, h2o: 5 },
        );
      } catch {
        rcaClean = null;
      }
    }

    const spikeVolumeMl = spikeVolumeL * 1000;
    const newBathVolumeL = state.bathVolumeL + spikeVolumeL;
    const loadingSaturationRatio = state.maxLoadingGL > 0
      ? (state.dissolvedSiliconGL / state.maxLoadingGL) * 100
      : 0;

    return {
      spikeVolumeL,
      spikeVolumeMl,
      newBathVolumeL,
      spikeError,
      degradation,
      degradationError,
      rcaClean,
      loadingSaturationRatio,
    };
  }, [state]);

  // Physics warnings
  const warnings = useMemo(() => {
    const list: { level: 'warning' | 'danger'; title: string; message: string }[] = [];

    // SPM high-temperature hazard warning (> 120°C)
    if (state.recipeId === 'spm' && state.bathTempC > 120) {
      list.push({
        level: 'danger',
        title: 'SPM Chemical Exotherm Hazard (> 120°C)',
        message: `SPM Piranha bath is operating at ${state.bathTempC}°C. High-temperature piranha undergoes rapid self-accelerating H₂O₂ thermal decomposition. If heavy organic photoresist is introduced, violent boiling or tank rupture risk increases. Ensure acid vapor scrubbing and temperature trip interlocks are active.`,
      });
    }

    // Loading saturation warning (> 85% of capacity)
    if (calculations.loadingSaturationRatio >= 85) {
      list.push({
        level: 'danger',
        title: 'Bath Loading Saturation Critical (> 85%)',
        message: `Dissolved silicon/oxide loading has reached ${calculations.loadingSaturationRatio.toFixed(1)}% of saturation capacity (${state.dissolvedSiliconGL} g/L of ${state.maxLoadingGL} g/L). Severe etch rate loss (>50%) and insoluble precipitate redeposition onto wafers will occur. Full tank drain, rinse, and recharge is strongly recommended.`,
      });
    } else if (calculations.loadingSaturationRatio >= 60) {
      list.push({
        level: 'warning',
        title: 'Elevated Bath Dissolved Loading',
        message: `Dissolved solids are at ${calculations.loadingSaturationRatio.toFixed(1)}% of maximum capacity. Etch rate is depressed by ${calculations.degradation ? calculations.degradation.etchRateReductionPercent.toFixed(1) : '0'}%. Prepare chemical recharge cycle.`,
      });
    }

    // Bath lifetime expired
    if (state.runHours >= state.bathLifeHours) {
      list.push({
        level: 'danger',
        title: 'Bath Qualified Lifetime Expired',
        message: `Operating time (${state.runHours} h) has reached or exceeded the qualified chemical lifetime (${state.bathLifeHours} h). Chemical bath must be retired to prevent defectivity and micro-roughness.`,
      });
    }

    // Concentration parameter anomalies
    if (state.currentConc > state.targetConc) {
      list.push({
        level: 'warning',
        title: 'Current Concentration Exceeds Target',
        message: `Current chemical concentration (${state.currentConc}%) is above target (${state.targetConc}%). Do not spike concentrated chemical; bath requires DI water top-off or standard bath replacement.`,
      });
    }

    if (state.sourceConc <= state.targetConc) {
      list.push({
        level: 'danger',
        title: 'Physical Infeasibility: Source Conc ≤ Target Conc',
        message: `Source chemical (${state.sourceConc}%) is not concentrated enough to raise bath to target (${state.targetConc}%). Spiking requires a higher concentration stock source.`,
      });
    }

    return list;
  }, [state, calculations]);

  const handleCopySummary = async () => {
    const lines = [
      '--- Wet Bench Chemical Lifetime & Spike Dosing Summary ---',
      `Recipe: ${selectedRecipe.name} (${selectedRecipe.chemicalSystem})`,
      `Bath Volume: ${state.bathVolumeL} L`,
      `Current Active Conc: ${state.currentConc}%`,
      `Target Conc: ${state.targetConc}%`,
      `Source Chemical Conc: ${state.sourceConc}%`,
      `Operating Temperature: ${state.bathTempC} °C`,
      `Run Hours: ${state.runHours} h / Max Life: ${state.bathLifeHours} h`,
      `Dissolved Loading: ${state.dissolvedSiliconGL} g/L / Max: ${state.maxLoadingGL} g/L`,
      '----------------------------------------------------',
      calculations.spikeError
        ? `Spike Status: ${calculations.spikeError}`
        : `Required Spike Volume: ${calculations.spikeVolumeL >= 1 ? `${fmt(calculations.spikeVolumeL, 3)} L` : `${fmt(calculations.spikeVolumeMl, 1)} mL`}`,
      calculations.degradation
        ? `Current Etch Rate: ${fmt(calculations.degradation.currentEtchRateNmMin, 2)} nm/min (Decay: ${fmt(calculations.degradation.etchRateReductionPercent, 1)}%)`
        : 'Current Etch Rate: N/A',
      calculations.degradation
        ? `Remaining Bath Life: ${fmt(calculations.degradation.remainingLifeHours, 1)} h (${fmt(calculations.degradation.remainingLifePercent, 1)}%)`
        : 'Remaining Bath Life: N/A',
      `Loading Saturation: ${fmt(calculations.loadingSaturationRatio, 1)}%`,
      calculations.degradation
        ? `Evaporation Loss: ${fmt(calculations.degradation.waterEvaporationLossRateLPerHour, 3)} L/h`
        : 'Evaporation Loss: N/A',
      calculations.rcaClean
        ? `RCA SC-1 PRE: ${fmt(calculations.rcaClean.prePercent, 1)}% | Ra Delta: ${fmt(calculations.rcaClean.roughnessDeltaRaNm, 3)} nm`
        : '',
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const buildExportRows = () => {
    const headers = ['Category', 'Parameter', 'Value', 'Unit', 'Notes'];
    const rows: (string | number)[][] = [
      ['Recipe', 'Selected Recipe', selectedRecipe.name, '', selectedRecipe.chemicalSystem],
      ['Recipe', 'Active Chemical', selectedRecipe.targetChemical, '', 'Targeted for spike replenishment'],
      ['Input', 'Bath Volume', state.bathVolumeL, 'L', 'Current liquid volume'],
      ['Input', 'Current Active Concentration', state.currentConc, '%', 'Measured via titration or conductivity'],
      ['Input', 'Target Active Concentration', state.targetConc, '%', 'Process specification baseline'],
      ['Input', 'Source Chemical Concentration', state.sourceConc, '%', 'Stock chemical drum concentration'],
      ['Input', 'Bath Operating Temperature', state.bathTempC, '°C', 'Tank temperature controller setting'],
      ['Input', 'Bath Run Time', state.runHours, 'hours', 'Cumulative hours since last fresh charge'],
      ['Input', 'Maximum Bath Life', state.bathLifeHours, 'hours', 'Chemical expiration limit'],
      ['Input', 'Dissolved Oxide/Silicon Loading', state.dissolvedSiliconGL, 'g/L', 'Dissolved mass in solution'],
      ['Input', 'Max Loading Saturation Limit', state.maxLoadingGL, 'g/L', 'Critical loading saturation threshold'],
      ['Input', 'Initial Etch Rate', state.initialEtchRateNmMin, 'nm/min', 'Fresh bath etch rate'],
    ];

    if (calculations.spikeVolumeL >= 0 && !calculations.spikeError) {
      rows.push(
        ['Result', 'Required Spike Volume (L)', fmt(calculations.spikeVolumeL, 4), 'L', 'Calculated spike dosing volume'],
        ['Result', 'Required Spike Volume (mL)', fmt(calculations.spikeVolumeMl, 1), 'mL', 'Volume in milliliters'],
        ['Result', 'New Total Bath Volume', fmt(calculations.newBathVolumeL, 3), 'L', 'Volume after spike chemical addition'],
      );
    }

    if (calculations.degradation) {
      rows.push(
        ['Result', 'Current Etch Rate', fmt(calculations.degradation.currentEtchRateNmMin, 3), 'nm/min', 'Decayed by dissolved mass loading'],
        ['Result', 'Etch Rate Reduction', fmt(calculations.degradation.etchRateReductionPercent, 2), '%', 'Etch rate lost due to loading'],
        ['Result', 'Remaining Bath Life', fmt(calculations.degradation.remainingLifeHours, 1), 'hours', 'Hours until bath expires'],
        ['Result', 'Remaining Life Fraction', fmt(calculations.degradation.remainingLifePercent, 1), '%', 'Percent lifetime remaining'],
        ['Result', 'Loading Saturation', fmt(calculations.loadingSaturationRatio, 1), '%', 'Fraction of max loading capacity reached'],
        ['Result', 'Water Evaporation Loss Rate', fmt(calculations.degradation.waterEvaporationLossRateLPerHour, 4), 'L/h', 'Antoine vapor loss model'],
        ['Result', 'Water Vapor Pressure', fmt(calculations.degradation.vaporPressureKPa, 2), 'kPa', 'Saturated vapor pressure at temp'],
      );
    }

    if (calculations.rcaClean) {
      rows.push(
        ['Result', 'RCA SC-1 PRE', fmt(calculations.rcaClean.prePercent, 1), '%', 'Particle removal efficiency'],
        ['Result', 'Surface Roughness Delta Ra', fmt(calculations.rcaClean.roughnessDeltaRaNm, 4), 'nm', 'Surface micro-roughness increase'],
        ['Result', 'SC-1 Clean Regime', calculations.rcaClean.regime, '', 'Process operating window'],
      );
    }

    return { headers, rows };
  };

  const handleExportCsv = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv(`wet-bench-spike-${state.recipeId}.csv`, data.headers, data.rows);
  };

  const handleExportXlsx = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx(`wet-bench-spike-${state.recipeId}.xlsx`, 'Wet Bench Report', data.headers, data.rows);
  };

  const handleExportPdf = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadPdf(`wet-bench-spike-${state.recipeId}.pdf`, `Wet Bench Spike Report: ${selectedRecipe.name}`, (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Wet Bench Spike Report: ${selectedRecipe.name}`, pageWidth / 2, y + 5, { align: 'center' });
      y += 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 7;

      const contentWidth = pageWidth - margin * 2;
      const colWidths = data.headers.map(() => contentWidth / data.headers.length);
      doc.setFontSize(7.5);
      const drawRow = (cells: string[], bold: boolean) => {
        const cellLines = cells.map((cell, i) =>
          doc.splitTextToSize(cell, colWidths[i] - 3) as string[],
        );
        const rowHeight = Math.max(1, ...cellLines.map((l) => l.length)) * 3.4 + 2.6;
        if (y + rowHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        cells.forEach((_, i) => {
          const x = margin + i * colWidths[i];
          if (bold) {
            doc.setFillColor(241, 245, 249);
            doc.rect(x, y, colWidths[i], rowHeight, 'F');
          }
          doc.rect(x, y, colWidths[i], rowHeight, 'S');
          cellLines[i].forEach((line, li) => doc.text(line, x + 1.5, y + 2 + (li + 0.75) * 3.4));
        });
        y += rowHeight;
      };

      drawRow(data.headers, true);
      data.rows.forEach((row) => drawRow(row.map(String), false));
    });
  };

  // Prepare data points for the interactive chart
  const chartData = useMemo(() => {
    const maxH = Math.max(state.bathLifeHours * 1.1, state.runHours * 1.25, 24);
    const steps = 60;
    const dt = maxH / steps;

    // Decay rate constant for concentration based on temperature and recipe
    // Arrhenius-like approximation: H2O2 in SC-1 decomposes faster at higher temp
    const baseDecayRate = state.recipeId === 'spm' ? 0.04 : state.recipeId === 'sc-1' ? 0.02 : 0.006;
    const tempFactor = Math.exp((state.bathTempC - 65) / 35);
    const kConc = baseDecayRate * Math.max(0.3, tempFactor);

    // Replenishment trigger is when concentration drops to targetConc * 0.82
    const replenishThresholdConc = state.targetConc * 0.82;

    const points = [];
    for (let i = 0; i <= steps; i++) {
      const h = Number((i * dt).toFixed(2));
      // Progressive loading: assumed linear with operating hours up to current or extrapolated
      const loadingProgress = state.runHours > 0
        ? (state.dissolvedSiliconGL / state.runHours) * h
        : (state.maxLoadingGL / state.bathLifeHours) * h;
      const loadingRatio = state.maxLoadingGL > 0 ? loadingProgress / state.maxLoadingGL : 0;
      const etchRateFactor = Math.max(0, 1 - Math.pow(Math.min(loadingRatio, 1), 1.5));
      const etchRate = state.initialEtchRateNmMin * etchRateFactor;

      // Simulated concentration curve: starts at targetConc and decays exponentially
      const conc = Math.max(0.01, state.targetConc * Math.exp(-kConc * h));

      points.push({
        h,
        etchRate,
        conc,
        loading: loadingProgress,
      });
    }

    const maxRate = Math.max(state.initialEtchRateNmMin * 1.1, 1);
    const maxConc = Math.max(state.targetConc * 1.25, 1);

    return {
      points,
      maxH,
      maxRate,
      maxConc,
      replenishThresholdConc,
    };
  }, [state]);

  return (
    <div className="calc-grid">
      {/* Left Column: Form & Inputs */}
      <div className="calc-form">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Waves size={18} /> Wet Bench Chemical Setup
            </h2>
            <button
              type="button"
              className="button secondary sm"
              onClick={handleReset}
              title="Reset parameters to recipe defaults"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Chemical Recipe Selector */}
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="recipe-selector" style={{ fontWeight: 600 }}>Chemical Bath Selection</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 6,
                marginTop: 6,
              }}
            >
              {SELECTABLE_RECIPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectRecipe(item.id)}
                  className={`button sm ${state.recipeId === item.id ? 'primary' : 'secondary'}`}
                  style={{
                    textAlign: 'center',
                    padding: '6px 8px',
                    fontSize: 12,
                    fontWeight: state.recipeId === item.id ? 600 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>
              Formula: <strong>{selectedRecipe.ratioDescription}</strong>
            </div>
          </div>

          {/* Tank & Temperature Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label htmlFor="bath-volume">
                Bath Volume <span className="unit">(L)</span>
              </label>
              <input
                id="bath-volume"
                type="number"
                min="1"
                max="500"
                step="1"
                value={state.bathVolumeL}
                onChange={(e) => setState((p) => ({ ...p, bathVolumeL: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>

            <div className="field">
              <label htmlFor="bath-temp">
                Bath Operating Temp <span className="unit">(°C)</span>
              </label>
              <input
                id="bath-temp"
                type="number"
                min="15"
                max="160"
                step="1"
                value={state.bathTempC}
                onChange={(e) => setState((p) => ({ ...p, bathTempC: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <h3 style={{ fontSize: 14, marginTop: 18, marginBottom: 10, fontWeight: 600 }}>
            Chemical Concentrations & Spiking
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="field">
              <label htmlFor="current-conc">
                Current Conc <span className="unit">(%)</span>
              </label>
              <input
                id="current-conc"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={state.currentConc}
                onChange={(e) => setState((p) => ({ ...p, currentConc: Math.max(0, Number(e.target.value) || 0) }))}
              />
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                Target: {selectedRecipe.targetChemical}
              </span>
            </div>

            <div className="field">
              <label htmlFor="target-conc">
                Target Conc <span className="unit">(%)</span>
              </label>
              <input
                id="target-conc"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={state.targetConc}
                onChange={(e) => setState((p) => ({ ...p, targetConc: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>

            <div className="field">
              <label htmlFor="source-conc">
                Source Chemical <span className="unit">(%)</span>
              </label>
              <input
                id="source-conc"
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={state.sourceConc}
                onChange={(e) => setState((p) => ({ ...p, sourceConc: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>
          </div>

          <h3 style={{ fontSize: 14, marginTop: 18, marginBottom: 10, fontWeight: 600 }}>
            Lifetime & Mass Loading Decay
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label htmlFor="run-hours">
                Run Time <span className="unit">(hours)</span>
              </label>
              <input
                id="run-hours"
                type="number"
                min="0"
                max="500"
                step="1"
                value={state.runHours}
                onChange={(e) => setState((p) => ({ ...p, runHours: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>

            <div className="field">
              <label htmlFor="bath-life">
                Max Bath Life <span className="unit">(hours)</span>
              </label>
              <input
                id="bath-life"
                type="number"
                min="1"
                max="500"
                step="1"
                value={state.bathLifeHours}
                onChange={(e) => setState((p) => ({ ...p, bathLifeHours: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
            <div className="field">
              <label htmlFor="dissolved-loading">
                Dissolved Loading <span className="unit">(g/L)</span>
              </label>
              <input
                id="dissolved-loading"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={state.dissolvedSiliconGL}
                onChange={(e) => setState((p) => ({ ...p, dissolvedSiliconGL: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>

            <div className="field">
              <label htmlFor="max-loading">
                Max Loading Limit <span className="unit">(g/L)</span>
              </label>
              <input
                id="max-loading"
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                value={state.maxLoadingGL}
                onChange={(e) => setState((p) => ({ ...p, maxLoadingGL: Math.max(0.1, Number(e.target.value) || 1) }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
            <div className="field">
              <label htmlFor="initial-etch-rate">
                Initial Etch Rate (ER₀) <span className="unit">(nm/min)</span>
              </label>
              <input
                id="initial-etch-rate"
                type="number"
                min="0.01"
                max="500"
                step="0.1"
                value={state.initialEtchRateNmMin}
                onChange={(e) => setState((p) => ({ ...p, initialEtchRateNmMin: Math.max(0, Number(e.target.value) || 0) }))}
              />
            </div>

            {state.recipeId === 'sc-1' ? (
              <div className="field">
                <label htmlFor="megasonic-power">
                  Megasonic Power <span className="unit">(W)</span>
                </label>
                <input
                  id="megasonic-power"
                  type="number"
                  min="0"
                  max="1500"
                  step="50"
                  value={state.megasonicPowerW}
                  onChange={(e) => setState((p) => ({ ...p, megasonicPowerW: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
            ) : (
              <div className="field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Recipe Chemistry:</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecipe.chemicalSystem}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Results & Interactive Visualization */}
      <div className="calc-results">
        {/* Physics Warnings Banner */}
        {warnings.map((w, idx) => (
          <div
            key={idx}
            className={`physics-alert ${w.level === 'danger' ? 'danger' : ''}`}
            role="alert"
            style={{ marginBottom: 12 }}
          >
            <AlertTriangle size={18} className="physics-alert-icon" />
            <div className="physics-alert-content">
              <strong>{w.title}</strong>
              <div style={{ marginTop: 2, fontSize: 12 }}>{w.message}</div>
            </div>
          </div>
        ))}

        {/* 4 Required Primary Metric Cards */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} /> Process Status & Replenishment Metrics
          </h2>

          <div className="metric-grid">
            {/* Metric 1: Required Spike Volume */}
            <div className="metric">
              <span>Required Spike Volume</span>
              <strong style={{ color: calculations.spikeError ? '#ef4444' : 'var(--primary)' }}>
                {calculations.spikeError
                  ? 'Infeasible'
                  : calculations.spikeVolumeL >= 1
                  ? `${fmt(calculations.spikeVolumeL, 3)} L`
                  : `${fmt(calculations.spikeVolumeMl, 1)} mL`}
              </strong>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                {calculations.spikeError
                  ? calculations.spikeError
                  : `New Bath Vol: ${fmt(calculations.newBathVolumeL, 2)} L`}
              </span>
            </div>

            {/* Metric 2: Current Etch Rate */}
            <div className="metric">
              <span>Current Etch Rate</span>
              <strong>
                {calculations.degradation
                  ? `${fmt(calculations.degradation.currentEtchRateNmMin, 2)} nm/min`
                  : 'N/A'}
              </strong>
              <span style={{ fontSize: 11, color: calculations.degradation && calculations.degradation.etchRateReductionPercent > 25 ? '#ef4444' : 'var(--ink-soft)' }}>
                {calculations.degradation
                  ? `-${fmt(calculations.degradation.etchRateReductionPercent, 1)}% from ER₀ (${state.initialEtchRateNmMin})`
                  : 'Decayed by loading'}
              </span>
            </div>

            {/* Metric 3: Remaining Bath Life */}
            <div className="metric">
              <span>Remaining Bath Life</span>
              <strong style={{ color: calculations.degradation?.isExpired ? '#ef4444' : 'inherit' }}>
                {calculations.degradation
                  ? `${fmt(calculations.degradation.remainingLifeHours, 1)} h`
                  : 'N/A'}
              </strong>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                {calculations.degradation
                  ? `${fmt(calculations.degradation.remainingLifePercent, 1)}% of ${state.bathLifeHours} h max`
                  : ''}
              </span>
            </div>

            {/* Metric 4: Loading Saturation Ratio */}
            <div className="metric">
              <span>Loading Saturation</span>
              <strong style={{ color: calculations.loadingSaturationRatio >= 85 ? '#ef4444' : calculations.loadingSaturationRatio >= 60 ? '#f59e0b' : 'inherit' }}>
                {fmt(calculations.loadingSaturationRatio, 1)}%
              </strong>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                {state.dissolvedSiliconGL} of {state.maxLoadingGL} g/L limit
              </span>
            </div>
          </div>

          {/* Secondary Detail Row: Evaporation & RCA PRE (if SC-1) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: state.recipeId === 'sc-1' ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: 10,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--ink-soft)', display: 'block' }}>Water Evaporation Rate</span>
              <strong>{calculations.degradation ? `${fmt(calculations.degradation.waterEvaporationLossRateLPerHour, 3)} L/h` : 'N/A'}</strong>
              <span style={{ color: 'var(--ink-soft)', fontSize: 10, marginLeft: 4 }}>
                ({calculations.degradation ? `${fmt(calculations.degradation.vaporPressureKPa, 1)} kPa` : ''})
              </span>
            </div>

            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--ink-soft)', display: 'block' }}>Etch Rate Retention</span>
              <strong>
                {calculations.degradation ? `${fmt(calculations.degradation.etchRateFactor * 100, 1)}%` : 'N/A'}
              </strong>
              <span style={{ color: 'var(--ink-soft)', fontSize: 10, marginLeft: 4 }}>
                (Loading exponent 1.5)
              </span>
            </div>

            {state.recipeId === 'sc-1' && calculations.rcaClean && (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--ink-soft)', display: 'block' }}>Particle Clean Eff (PRE)</span>
                <strong>{fmt(calculations.rcaClean.prePercent, 1)}%</strong>
                <span style={{ color: 'var(--ink-soft)', fontSize: 10, marginLeft: 4 }}>
                  (ΔRa: +{fmt(calculations.rcaClean.roughnessDeltaRaNm, 3)} nm)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive SVG Line Chart */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Timer size={16} /> Etch Rate & Chemical Concentration Decay Profile
            </h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 3, backgroundColor: '#0284c7', display: 'inline-block' }} />
                Etch Rate (nm/min)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 3, backgroundColor: '#f59e0b', display: 'inline-block' }} />
                Conc (%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 1, borderTop: '2px dashed #ef4444', display: 'inline-block' }} />
                Replenish Trigger
              </span>
            </div>
          </div>

          <div
            ref={chartContainerRef}
            style={{ position: 'relative', width: '100%', userSelect: 'none' }}
            onMouseLeave={() => setHoveredHour(null)}
          >
            <WetBenchSvgChart
              chartData={chartData}
              runHours={state.runHours}
              bathLifeHours={state.bathLifeHours}
              hoveredHour={hoveredHour}
              onHoverHour={setHoveredHour}
            />
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="action-row" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="button secondary"
            onClick={handleCopySummary}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Summary!' : 'Copy Summary'}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleExportCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Export CSV Report
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleExportXlsx}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Export XLSX Report
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleExportPdf}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Export PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}

interface SvgChartProps {
  chartData: {
    points: { h: number; etchRate: number; conc: number; loading: number }[];
    maxH: number;
    maxRate: number;
    maxConc: number;
    replenishThresholdConc: number;
  };
  runHours: number;
  bathLifeHours: number;
  hoveredHour: number | null;
  onHoverHour: (h: number | null) => void;
}

function WetBenchSvgChart({
  chartData,
  runHours,
  bathLifeHours,
  hoveredHour,
  onHoverHour,
}: SvgChartProps) {
  const { points, maxH, maxRate, maxConc, replenishThresholdConc } = chartData;

  const width = 560;
  const height = 250;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 20;
  const padBottom = 30;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const toX = (h: number) => padLeft + (h / maxH) * plotW;
  const toYRate = (r: number) => padTop + plotH - (r / maxRate) * plotH;
  const toYConc = (c: number) => padTop + plotH - (c / maxConc) * plotH;

  // Build SVG path for etch rate
  const ratePathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.h).toFixed(1)} ${toYRate(p.etchRate).toFixed(1)}`)
    .join(' ');

  // Build SVG path for concentration
  const concPathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.h).toFixed(1)} ${toYConc(p.conc).toFixed(1)}`)
    .join(' ');

  // Current operating point coordinates
  const currentX = toX(runHours);
  const maxLifeX = toX(bathLifeHours);
  const replenishY = toYConc(replenishThresholdConc);

  // Find nearest point for hovered hour
  const activeHour = hoveredHour !== null ? hoveredHour : runHours;
  const nearestPoint = points.reduce((prev, curr) =>
    Math.abs(curr.h - activeHour) < Math.abs(prev.h - activeHour) ? curr : prev,
  );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xClient = e.clientX - rect.left;
    const svgX = (xClient / rect.width) * width;
    if (svgX >= padLeft && svgX <= padLeft + plotW) {
      const hFraction = (svgX - padLeft) / plotW;
      const hour = hFraction * maxH;
      onHoverHour(hour);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      onMouseMove={handleMouseMove}
    >
      {/* Background Grid */}
      <rect
        x={padLeft}
        y={padTop}
        width={plotW}
        height={plotH}
        fill="var(--background)"
        stroke="var(--border)"
        strokeWidth="1"
      />

      {/* Grid lines horizontal */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = padTop + plotH * frac;
        return (
          <line
            key={frac}
            x1={padLeft}
            x2={padLeft + plotW}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeDasharray="2 2"
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Grid lines vertical */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const x = padLeft + plotW * frac;
        return (
          <line
            key={frac}
            x1={x}
            x2={x}
            y1={padTop}
            y2={padTop + plotH}
            stroke="var(--border)"
            strokeDasharray="2 2"
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Replenishment Threshold Horizontal Line */}
      {replenishY >= padTop && replenishY <= padTop + plotH && (
        <g>
          <line
            x1={padLeft}
            x2={padLeft + plotW}
            y1={replenishY}
            y2={replenishY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={padLeft + plotW - 4}
            y={replenishY - 4}
            fill="#ef4444"
            fontSize="9"
            textAnchor="end"
            fontWeight="bold"
          >
            Spike Replenish Threshold ({replenishThresholdConc.toFixed(2)}%)
          </text>
        </g>
      )}

      {/* Max Bath Life Vertical Marker */}
      {maxLifeX <= padLeft + plotW && (
        <g>
          <line
            x1={maxLifeX}
            x2={maxLifeX}
            y1={padTop}
            y2={padTop + plotH}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x={maxLifeX + 3}
            y={padTop + 12}
            fill="#64748b"
            fontSize="9"
            fontWeight="500"
          >
            Max Life ({bathLifeHours}h)
          </text>
        </g>
      )}

      {/* Etch Rate Curve */}
      <path
        d={ratePathD}
        fill="none"
        stroke="#0284c7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Concentration Curve */}
      <path
        d={concPathD}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Current Run Time Marker Line */}
      {currentX <= padLeft + plotW && (
        <g>
          <line
            x1={currentX}
            x2={currentX}
            y1={padTop}
            y2={padTop + plotH}
            stroke="#6366f1"
            strokeWidth="2"
          />
          <circle
            cx={currentX}
            cy={toYRate(nearestPoint.etchRate)}
            r="4"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle
            cx={currentX}
            cy={toYConc(nearestPoint.conc)}
            r="4"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={currentX}
            y={padTop + plotH + 15}
            fill="#6366f1"
            fontSize="10"
            textAnchor="middle"
            fontWeight="600"
          >
            {runHours}h (Now)
          </text>
        </g>
      )}

      {/* Left Axis: Etch Rate */}
      <text
        x={padLeft - 6}
        y={padTop + 8}
        fill="#0284c7"
        fontSize="10"
        textAnchor="end"
        fontWeight="600"
      >
        {maxRate.toFixed(1)}
      </text>
      <text
        x={padLeft - 6}
        y={padTop + plotH}
        fill="#0284c7"
        fontSize="10"
        textAnchor="end"
      >
        0
      </text>
      <text
        x={12}
        y={padTop + plotH / 2}
        fill="#0284c7"
        fontSize="10"
        textAnchor="middle"
        transform={`rotate(-90 12 ${padTop + plotH / 2})`}
        fontWeight="500"
      >
        Etch Rate (nm/min)
      </text>

      {/* Right Axis: Chemical Concentration */}
      <text
        x={padLeft + plotW + 6}
        y={padTop + 8}
        fill="#f59e0b"
        fontSize="10"
        textAnchor="start"
        fontWeight="600"
      >
        {maxConc.toFixed(1)}%
      </text>
      <text
        x={padLeft + plotW + 6}
        y={padTop + plotH}
        fill="#f59e0b"
        fontSize="10"
        textAnchor="start"
      >
        0%
      </text>
      <text
        x={width - 10}
        y={padTop + plotH / 2}
        fill="#f59e0b"
        fontSize="10"
        textAnchor="middle"
        transform={`rotate(90 ${width - 10} ${padTop + plotH / 2})`}
        fontWeight="500"
      >
        Concentration (%)
      </text>

      {/* Bottom Axis: Hours */}
      <text
        x={padLeft}
        y={padTop + plotH + 15}
        fill="var(--ink-soft)"
        fontSize="10"
        textAnchor="start"
      >
        0h
      </text>
      <text
        x={padLeft + plotW}
        y={padTop + plotH + 15}
        fill="var(--ink-soft)"
        fontSize="10"
        textAnchor="end"
      >
        {maxH.toFixed(0)}h
      </text>
      <text
        x={padLeft + plotW / 2}
        y={padTop + plotH + 24}
        fill="var(--ink)"
        fontSize="11"
        textAnchor="middle"
        fontWeight="500"
      >
        Bath Operating Hours (h)
      </text>

      {/* Hover Tooltip Box */}
      {hoveredHour !== null && (
        <g transform={`translate(${Math.min(padLeft + plotW - 130, Math.max(padLeft + 10, toX(nearestPoint.h) - 60))}, ${padTop + 10})`}>
          <rect
            width="125"
            height="56"
            rx="4"
            fill="var(--card-bg, #1e293b)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.95"
          />
          <text x="8" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">
            T = {nearestPoint.h.toFixed(1)} hours
          </text>
          <text x="8" y="28" fill="#38bdf8" fontSize="9">
            ER: {nearestPoint.etchRate.toFixed(2)} nm/min
          </text>
          <text x="8" y="40" fill="#fbbf24" fontSize="9">
            Conc: {nearestPoint.conc.toFixed(2)}%
          </text>
          <text x="8" y="50" fill="#cbd5e1" fontSize="8">
            Loading: {nearestPoint.loading.toFixed(2)} g/L
          </text>
        </g>
      )}
    </svg>
  );
}
