'use client';

import { useMemo, useState, useRef } from 'react';
import { Copy, RotateCcw, AlertTriangle, ShieldCheck, Info, Download, ImageIcon } from 'lucide-react';
import { formatNumber as fmt } from '@/lib/format';
import {
  calculateRecipeVolumes,
  solveC1V1,
  RECIPE_PRESETS,
  type WetBenchRecipePreset,
} from '@/lib/chemical-dilution';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv, downloadSvg } from '@/lib/export';

const PALETTE = ['#0284c7', '#0d9488', '#ea580c', '#d97706', '#6366f1', '#ec4899'];

const INITIAL = {
  mode: 'recipe', // 'recipe' | 'c1v1'
  recipeId: 'sc1-standard',
  bathVolumeLiters: '10',
  stockConcentration: '49',
  targetConcentration: '1',
  c1v1VolumeLiters: '5',
};

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

export default function ChemicalDilutionCalculator() {
  const [state, setState] = useState(INITIAL);
  useUrlParamsState(state, setState);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedPreset: WetBenchRecipePreset = useMemo(() => {
    return RECIPE_PRESETS.find((p) => p.id === state.recipeId) || RECIPE_PRESETS[0];
  }, [state.recipeId]);

  interface PhysicsWarning {
    level: 'warning' | 'danger';
    title: string;
    message: string;
  }

  const physicsWarnings = useMemo<PhysicsWarning[]>(() => {
    const warnings: PhysicsWarning[] = [];
    if (state.mode === 'c1v1') {
      const c1 = num(state.stockConcentration);
      const c2 = num(state.targetConcentration);
      const v2 = num(state.c1v1VolumeLiters);

      if (Number.isFinite(c1) && c1 > 100) {
        warnings.push({
          level: 'danger',
          title: 'Physical Concentration Exceeded (C1 > 100%)',
          message: `Stock chemical concentration C1 = ${c1}% exceeds 100%, which is physically impossible for chemical solutions.`,
        });
      }

      if (Number.isFinite(c1) && Number.isFinite(c2) && c2 > c1) {
        warnings.push({
          level: 'danger',
          title: 'Physical Impossibility (C2 > C1 Dilution Violation)',
          message: `Target concentration C2 (${c2}%) cannot exceed stock chemical concentration C1 (${c1}%). Standard wet bench dilution with DI water can only decrease solute concentration, never concentrate it without evaporation.`,
        });
      }

      if (Number.isFinite(c1) && Number.isFinite(c2) && c1 > 0 && c1 === c2) {
        warnings.push({
          level: 'warning',
          title: 'Zero Dilution Needed (C1 = C2)',
          message: 'Target concentration equals stock concentration. The required stock chemical volume equals the target volume (V1 = V2) with zero DI water required.',
        });
      }

      if (Number.isFinite(v2) && v2 > 200) {
        warnings.push({
          level: 'warning',
          title: 'Extremely Large Tank Volume (> 200 L)',
          message: 'Standard semiconductor cleanroom tanks are usually 5–50 L. Ensure overflow, exhaust, and containment berms support 200+ L.',
        });
      }
    } else {
      const vol = num(state.bathVolumeLiters);
      if (Number.isFinite(vol) && vol > 100) {
        warnings.push({
          level: 'warning',
          title: 'Excessive Bath Volume (> 100 L)',
          message: 'Wet bench immersion tanks in semiconductor fabs are typically 5 to 30 L (up to 50 L for 300 mm wafer automated wet stations). 100+ L tanks present severe exothermic runaway and drainage risks.',
        });
      }
      if (Number.isFinite(vol) && vol > 0 && vol < 0.5) {
        warnings.push({
          level: 'warning',
          title: 'Sub-Liter Micro Tank (< 500 mL)',
          message: 'Bath volume is below 500 mL. Small beaker volumes suffer rapid evaporative concentration drift and thermal instability.',
        });
      }
      if (selectedPreset.category === 'piranha') {
        warnings.push({
          level: 'danger',
          title: 'Piranha (SPM) Exothermic Reaction Hazard',
          message: 'Sulfuric acid and hydrogen peroxide react with high exothermicity (> 100 °C). ALWAYS add H₂O₂ to H₂SO₄ slowly; NEVER add water to acid. Explosion risk if organic solvent (IPA/acetone) contacts piranha.',
        });
      }
      if (selectedPreset.category === 'hf-clean') {
        warnings.push({
          level: 'danger',
          title: 'Hydrofluoric Acid (HF) Toxicity',
          message: 'HF penetrates skin to attack calcium bone structure without immediate burn sensation. Calcium gluconate antidote gel and HF-resistant PPE (neoprene gloves) are mandatory.',
        });
      }
    }
    return warnings;
  }, [state.mode, state.stockConcentration, state.targetConcentration, state.c1v1VolumeLiters, state.bathVolumeLiters, selectedPreset]);


  const recipeResult = useMemo(() => {
    const vol = num(state.bathVolumeLiters);
    if (!Number.isFinite(vol) || vol <= 0) return null;
    return calculateRecipeVolumes(selectedPreset, vol);
  }, [selectedPreset, state.bathVolumeLiters]);

  const c1v1Result = useMemo(() => {
    const c1 = num(state.stockConcentration);
    const c2 = num(state.targetConcentration);
    const v2 = num(state.c1v1VolumeLiters);
    if (!Number.isFinite(c1) || !Number.isFinite(c2) || !Number.isFinite(v2) || c1 <= 0 || c2 <= 0 || v2 <= 0) {
      return null;
    }
    return solveC1V1({ stockConcentration: c1, targetConcentration: c2, targetVolumeLiters: v2 });
  }, [state.stockConcentration, state.targetConcentration, state.c1v1VolumeLiters]);

  const copyResult = async () => {
    const lines: string[] = [];
    if (state.mode === 'recipe' && recipeResult) {
      lines.push(`Semiconductor Wet Bench Recipe: ${recipeResult.recipeName}`);
      lines.push(`Total Bath Volume: ${recipeResult.totalVolumeLiters} L (${fmt(recipeResult.totalMassGrams)} g)`);
      lines.push(`Nominal Bath Temperature: ${recipeResult.temperatureC} °C`);
      lines.push('Component Breakdown:');
      for (const c of recipeResult.components) {
        lines.push(
          ` - ${c.name}: ${fmt(c.volumeMl)} mL (${fmt(c.volumeLiters, 3)} L) | ${fmt(c.volumePct, 1)} vol% | ${fmt(c.massPct, 1)} wt% (${fmt(c.activeChemicalMassGrams, 1)} g active)`,
        );
      }
      if (recipeResult.estimatedEtchRateAngstromsPerMin) {
        lines.push(`Thermal SiO2 Etch Rate: ~${fmt(recipeResult.estimatedEtchRateAngstromsPerMin)} Å/min`);
        if (recipeResult.estimatedTimeToClear100nmMinutes) {
          lines.push(`Estimated Time to Strip 100 nm Oxide: ${fmt(recipeResult.estimatedTimeToClear100nmMinutes, 1)} min`);
        }
      }
    } else if (state.mode === 'c1v1' && c1v1Result) {
      lines.push('Chemical Dilution (C1·V1 = C2·V2) Calculation');
      lines.push(`Stock Concentration (C1): ${c1v1Result.stockConcentration}%`);
      lines.push(`Target Concentration (C2): ${c1v1Result.targetConcentration}%`);
      lines.push(`Target Volume (V2): ${c1v1Result.targetVolumeLiters} L`);
      lines.push(`Required Stock Volume (V1): ${fmt(c1v1Result.stockVolumeMl)} mL (${fmt(c1v1Result.stockVolumeLiters, 4)} L)`);
      lines.push(`Required Diluent Water (DIW): ${fmt(c1v1Result.solventWaterVolumeMl)} mL (${fmt(c1v1Result.solventWaterVolumeLiters, 4)} L)`);
      lines.push(`Dilution Factor: ${fmt(c1v1Result.dilutionFactor, 1)}x`);
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  const handleExportCsv = () => {
    if (state.mode === 'recipe' && recipeResult) {
      const headers = [
        'Component',
        'Chemical Key',
        'Ratio Parts',
        'Volume (mL)',
        'Volume (L)',
        'Volume Percent (%)',
        'Total Mass (g)',
        'Active Chemical Mass (g)',
        'Effective Wt Percent (%)',
      ];
      const rows = recipeResult.components.map((c) => [
        c.name,
        c.chemicalKey,
        c.ratioPart,
        c.volumeMl.toFixed(1),
        c.volumeLiters.toFixed(4),
        c.volumePct.toFixed(2),
        c.massGrams.toFixed(1),
        c.activeChemicalMassGrams.toFixed(1),
        c.effectiveConcentrationWtPct.toFixed(2),
      ]);
      downloadCsv(`recipe_${recipeResult.recipeName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${recipeResult.totalVolumeLiters}L`, headers, rows);
    } else if (state.mode === 'c1v1' && c1v1Result) {
      const headers = ['Parameter', 'Value', 'Unit'];
      const rows = [
        ['Stock Concentration (C1)', c1v1Result.stockConcentration, '%'],
        ['Target Concentration (C2)', c1v1Result.targetConcentration, '%'],
        ['Target Volume (V2)', c1v1Result.targetVolumeLiters, 'L'],
        ['Required Stock Volume (V1)', c1v1Result.stockVolumeMl.toFixed(1), 'mL'],
        ['Required Stock Volume (V1, L)', c1v1Result.stockVolumeLiters.toFixed(4), 'L'],
        ['Required DI Water Volume', c1v1Result.solventWaterVolumeMl.toFixed(1), 'mL'],
        ['Required DI Water Volume (L)', c1v1Result.solventWaterVolumeLiters.toFixed(4), 'L'],
        ['Dilution Factor', c1v1Result.dilutionFactor.toFixed(2), 'x'],
      ];
      downloadCsv(`c1v1_dilution_${c1v1Result.stockConcentration}pct_to_${c1v1Result.targetConcentration}pct`, headers, rows);
    }
  };
  const handleExportSvg = () => {
    if (svgRef.current) {
      downloadSvg(
        svgRef.current,
        state.mode === 'recipe'
          ? `recipe_composition_${recipeResult?.recipeName.replace(/[^a-zA-Z0-9_-]/g, '_') ?? state.recipeId}`
          : `c1v1_dilution_${state.stockConcentration}pct_to_${state.targetConcentration}pct`
      );
    }
  };


  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="clean-inputs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="clean-inputs" style={{ margin: 0 }}>Dilution & Recipe Setup</h2>
          <div className="button-group" role="tablist" aria-label="Calculation Mode">
            <button
              type="button"
              className={`button ${state.mode === 'recipe' ? 'primary' : 'secondary'}`}
              onClick={() => setState((p) => ({ ...p, mode: 'recipe' }))}
            >
              Standard Recipe
            </button>
            <button
              type="button"
              className={`button ${state.mode === 'c1v1' ? 'primary' : 'secondary'}`}
              onClick={() => setState((p) => ({ ...p, mode: 'c1v1' }))}
            >
              C1·V1 = C2·V2
            </button>
          </div>
        </div>

        {state.mode === 'recipe' ? (
          <>
            <div className="field">
              <label htmlFor="recipe-select">Wet Bench Process Recipe Preset</label>
              <select
                id="recipe-select"
                value={state.recipeId}
                onChange={(e) => setState((p) => ({ ...p, recipeId: e.target.value }))}
              >
                <optgroup label="RCA Standard Cleans">
                  {RECIPE_PRESETS.filter((p) => p.category === 'rca').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Piranha Organic / Resist Strips (SPM)">
                  {RECIPE_PRESETS.filter((p) => p.category === 'piranha').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="HF Oxide Strips & Passivation">
                  {RECIPE_PRESETS.filter((p) => p.category === 'hf-clean').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Nitride Strips">
                  {RECIPE_PRESETS.filter((p) => p.category === 'nitride-strip').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <p className="note" style={{ marginBottom: '16px' }}>
              <strong>Description:</strong> {selectedPreset.description}<br />
              <strong>Primary Objective:</strong> {selectedPreset.primaryFunction}
            </p>

            <div className="field">
              <label htmlFor="bath-volume">
                Total Bath Tank Volume<span className="unit">Liters (L)</span>
              </label>
              <input
                id="bath-volume"
                type="number"
                min="0.1"
                step="0.5"
                value={state.bathVolumeLiters}
                onChange={(e) => setState((p) => ({ ...p, bathVolumeLiters: e.target.value }))}
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="stock-conc">
                Stock Chemical Concentration (C1)<span className="unit">wt% or M</span>
              </label>
              <input
                id="stock-conc"
                type="number"
                min="0.01"
                step="1"
                placeholder="e.g. 49 for 49% HF"
                value={state.stockConcentration}
                onChange={(e) => setState((p) => ({ ...p, stockConcentration: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="target-conc">
                Target Diluted Concentration (C2)<span className="unit">wt% or M</span>
              </label>
              <input
                id="target-conc"
                type="number"
                min="0.001"
                step="0.1"
                placeholder="e.g. 1 for 1% HF"
                value={state.targetConcentration}
                onChange={(e) => setState((p) => ({ ...p, targetConcentration: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="c1v1-vol">
                Target Final Bath Volume (V2)<span className="unit">Liters (L)</span>
              </label>
              <input
                id="c1v1-vol"
                type="number"
                min="0.1"
                step="0.5"
                value={state.c1v1VolumeLiters}
                onChange={(e) => setState((p) => ({ ...p, c1v1VolumeLiters: e.target.value }))}
              />
            </div>
          </>
        )}

        <div className="action-row" style={{ marginTop: '24px' }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => setState(INITIAL)}
          >
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
          <button
            className="button primary"
            type="button"
            onClick={copyResult}
          >
            <Copy size={14} aria-hidden="true" /> {copied ? 'Copied Recipe!' : 'Copy Summary'}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={handleExportCsv}
          >
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={handleExportSvg}
            disabled={state.mode === 'recipe' ? !recipeResult : !c1v1Result}
          >
            <ImageIcon size={14} aria-hidden="true" /> Save SVG
          </button>
        </div>

        <div className="note" style={{ marginTop: '20px' }}>
          <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
          <strong>Wet Bench Protocol:</strong> Always mix chemicals in a certified chemical wet bench with laminar exhaust flow. Always add acid to water (never water to concentrated acid).
        </div>
      </section>

      <section className="panel" aria-labelledby="clean-results">
        <h2 id="clean-results">Volumetric & Concentration Breakdown</h2>
        {physicsWarnings.map((w, idx) => (
          <div key={idx} className={`physics-alert ${w.level === 'danger' ? 'danger' : ''}`} role="alert" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} className="physics-alert-icon" />
            <div className="physics-alert-content">
              <strong>{w.title}:</strong> {w.message}
            </div>
          </div>
        ))}

        {state.mode === 'recipe' && recipeResult ? (
          <>
            <div>
              <span className="unit">Total Bath Volume</span>
              <div className="result-value">
                {recipeResult.totalVolumeLiters} <span style={{ fontSize: '18px', fontWeight: 400 }}>Liters</span>
                <span style={{ fontSize: '14px', color: 'var(--ink-soft)', marginLeft: '10px' }}>
                  ({fmt(recipeResult.totalMassGrams)} g total mass)
                </span>
              </div>
            </div>
            {/* SVG Component Volume Stacked Bar Chart */}
            <div style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Volumetric Composition Breakdown</span>
                <span style={{ color: 'var(--ink-soft)' }}>{recipeResult.components.length} Components</span>
              </div>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-soft)' }}>
                <svg
                  ref={state.mode === 'recipe' ? svgRef : undefined}
                  viewBox="0 0 600 56"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  role="img"
                  aria-label="Wet bench recipe volumetric breakdown"
                >
                  <rect width="600" height="56" fill="var(--surface-sunken)" rx="4" />
                  {(() => {
                    let currentX = 0;
                    const totalW = 600;
                    const barY = 8;
                    const barH = 24;
                    return recipeResult.components.map((c, i) => {
                      const w = (c.volumePct / 100) * totalW;
                      const x = currentX;
                      currentX += w;
                      const color = PALETTE[i % PALETTE.length];
                      return (
                        <g key={c.chemicalKey}>
                          <rect x={x} y={barY} width={w} height={barH} fill={color} rx="2" />
                          {w > 30 && (
                            <text
                              x={x + w / 2}
                              y={barY + barH / 2 + 4}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="600"
                              fontFamily="system-ui, sans-serif"
                            >
                              {fmt(c.volumePct, 1)}%
                            </text>
                          )}
                          {w > 50 && (
                            <text
                              x={x + w / 2}
                              y={barY + barH + 16}
                              textAnchor="middle"
                              fill="var(--ink-soft)"
                              fontSize="10"
                              fontFamily="system-ui, sans-serif"
                            >
                              {c.name.split(' ')[0]} ({fmt(c.volumeMl)} mL)
                            </text>
                          )}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
                {recipeResult.components.map((c, i) => (
                  <div key={c.chemicalKey} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span style={{ fontWeight: 500 }}>{c.name}:</span>
                    <span style={{ color: 'var(--ink-soft)' }}>{fmt(c.volumePct, 1)}% ({fmt(c.volumeMl)} mL)</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '8px 4px' }}>Component</th>
                    <th style={{ padding: '8px 4px' }}>Parts</th>
                    <th style={{ padding: '8px 4px' }}>Volume (mL)</th>
                    <th style={{ padding: '8px 4px' }}>Volume (L)</th>
                    <th style={{ padding: '8px 4px' }}>Vol %</th>
                    <th style={{ padding: '8px 4px' }}>Mass (g)</th>
                    <th style={{ padding: '8px 4px' }}>Effective wt%</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeResult.components.map((c) => (
                    <tr key={c.chemicalKey} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 600 }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '10px 4px' }}>{c.ratioPart}</td>
                      <td style={{ padding: '10px 4px', fontWeight: 500 }}>{fmt(c.volumeMl)} mL</td>
                      <td style={{ padding: '10px 4px' }}>{fmt(c.volumeLiters, 3)} L</td>
                      <td style={{ padding: '10px 4px' }}>{fmt(c.volumePct, 1)}%</td>
                      <td style={{ padding: '10px 4px' }}>{fmt(c.massGrams, 0)} g</td>
                      <td style={{ padding: '10px 4px', color: 'var(--accent)' }}>
                        {fmt(c.effectiveConcentrationWtPct, 2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="metric-grid" style={{ marginTop: '20px' }}>
              <div className="metric">
                <span>Process Temperature</span>
                <strong>{recipeResult.temperatureC} °C</strong>
              </div>
              <div className="metric">
                <span>Estimated Oxide Etch Rate</span>
                <strong>
                  {recipeResult.estimatedEtchRateAngstromsPerMin
                    ? `${fmt(recipeResult.estimatedEtchRateAngstromsPerMin)} Å/min`
                    : 'Negligible / Passivating'}
                </strong>
              </div>
              {recipeResult.estimatedTimeToClear100nmMinutes && (
                <div className="metric">
                  <span>Time to Clear 100 nm Oxide</span>
                  <strong>{fmt(recipeResult.estimatedTimeToClear100nmMinutes, 1)} min</strong>
                </div>
              )}
            </div>

            {recipeResult.safetyNotes.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 600, marginBottom: '6px' }}>
                  <AlertTriangle size={18} />
                  <span>Chemical Safety Advisory</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--ink)' }}>
                  {recipeResult.safetyNotes.map((note, idx) => (
                    <li key={idx} style={{ marginTop: '4px' }}>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : state.mode === 'c1v1' && c1v1Result ? (
          <>
            <div>
              <span className="unit">Required Stock Chemical Volume (V1)</span>
              <div className="result-value">
                {fmt(c1v1Result.stockVolumeMl)} <span style={{ fontSize: '18px', fontWeight: 400 }}>mL</span>
                <span style={{ fontSize: '14px', color: 'var(--ink-soft)', marginLeft: '10px' }}>
                  ({fmt(c1v1Result.stockVolumeLiters, 4)} L)
                </span>
              </div>
            </div>
            {/* SVG Dilution Proportions Bar */}
            <div style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Dilution Volume Proportions</span>
                <span style={{ color: 'var(--ink-soft)' }}>
                  {fmt(c1v1Result.targetVolumeLiters)} L Total
                </span>
              </div>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-soft)' }}>
                <svg
                  ref={state.mode === 'c1v1' ? svgRef : undefined}
                  viewBox="0 0 600 56"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  role="img"
                  aria-label="C1V1 chemical dilution breakdown"
                >
                  <rect width="600" height="56" fill="var(--surface-sunken)" rx="4" />
                  {(() => {
                    const totalVol = c1v1Result.targetVolumeLiters;
                    const v1Pct = totalVol > 0 ? (c1v1Result.stockVolumeLiters / totalVol) * 100 : 0;
                    const vWaterPct = Math.max(0, 100 - v1Pct);
                    const totalW = 600;
                    const barY = 8;
                    const barH = 24;
                    const w1 = (v1Pct / 100) * totalW;
                    const wWater = totalW - w1;

                    return (
                      <g>
                        <rect x={0} y={barY} width={w1} height={barH} fill="#ea580c" rx="2" />
                        <rect x={w1} y={barY} width={wWater} height={barH} fill="#0284c7" rx="2" />
                        {w1 > 35 && (
                          <text
                            x={w1 / 2}
                            y={barY + barH / 2 + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                          >
                            {fmt(v1Pct, 1)}%
                          </text>
                        )}
                        {w1 > 50 && (
                          <text
                            x={w1 / 2}
                            y={barY + barH + 16}
                            textAnchor="middle"
                            fill="var(--ink-soft)"
                            fontSize="10"
                            fontFamily="system-ui, sans-serif"
                          >
                            Stock ({fmt(c1v1Result.stockVolumeMl)} mL)
                          </text>
                        )}
                        {wWater > 35 && (
                          <text
                            x={w1 + wWater / 2}
                            y={barY + barH / 2 + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="system-ui, sans-serif"
                          >
                            {fmt(vWaterPct, 1)}%
                          </text>
                        )}
                        {wWater > 50 && (
                          <text
                            x={w1 + wWater / 2}
                            y={barY + barH + 16}
                            textAnchor="middle"
                            fill="var(--ink-soft)"
                            fontSize="10"
                            fontFamily="system-ui, sans-serif"
                          >
                            DIW ({fmt(c1v1Result.solventWaterVolumeMl)} mL)
                          </text>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ea580c' }} />
                  <span style={{ fontWeight: 500 }}>Stock Chemical (V1):</span>
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {fmt(c1v1Result.stockVolumeMl)} mL ({fmt((c1v1Result.stockVolumeLiters / c1v1Result.targetVolumeLiters) * 100, 1)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#0284c7' }} />
                  <span style={{ fontWeight: 500 }}>DI Water Diluent:</span>
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {fmt(c1v1Result.solventWaterVolumeMl)} mL ({fmt((c1v1Result.solventWaterVolumeLiters / c1v1Result.targetVolumeLiters) * 100, 1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="metric-grid" style={{ marginTop: '20px' }}>
              <div className="metric">
                <span>Diluent Water Volume (DIW)</span>
                <strong>{fmt(c1v1Result.solventWaterVolumeMl)} mL ({fmt(c1v1Result.solventWaterVolumeLiters, 3)} L)</strong>
              </div>
              <div className="metric">
                <span>Total Diluted Volume (V2)</span>
                <strong>{c1v1Result.targetVolumeLiters} L</strong>
              </div>
              <div className="metric">
                <span>Stock Concentration (C1)</span>
                <strong>{c1v1Result.stockConcentration} %</strong>
              </div>
              <div className="metric">
                <span>Target Concentration (C2)</span>
                <strong>{c1v1Result.targetConcentration} %</strong>
              </div>
              <div className="metric">
                <span>Dilution Factor (C1/C2)</span>
                <strong>{fmt(c1v1Result.dilutionFactor, 1)} ×</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 600, marginBottom: '4px' }}>
                <ShieldCheck size={18} />
                <span>Mixing Instructions</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)' }}>
                Pour approximately <strong>{fmt(c1v1Result.solventWaterVolumeMl)} mL</strong> of DI water into the bath tank first, then carefully dispense <strong>{fmt(c1v1Result.stockVolumeMl)} mL</strong> of stock chemical into the water while stirring.
              </p>
            </div>
          </>
        ) : (
          <div className="error" role="alert">
            Please enter valid non-zero numerical values for volumes and concentrations.
          </div>
        )}
      </section>
    </div>
  );
}
