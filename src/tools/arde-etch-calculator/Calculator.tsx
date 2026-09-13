'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Download, Info } from 'lucide-react';
import MathFormula from '@/components/tools/MathFormulaClient';
import {
  calculateArdeEtchRate,
  calculateMicroloading,
  calculateEtchSelectivity,
  type ArdeModel,
} from '@/lib/arde-etch';
import { downloadCsv, downloadPdf, downloadXlsx } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

interface ArdeState {
  [key: string]: string | number | boolean;
  nominalRate: number; // nm/min
  cd: number; // in cdUnit
  cdUnit: 'nm' | 'um';
  depth: number; // in depthUnit
  depthUnit: 'nm' | 'um';
  model: ArdeModel;
  modelCoeff: number;
  patternDensity: number; // % (0-100)
  depletionCoeff: number; // eta
  maskEtchRate: number; // nm/min
  overetch: number; // %
  maskThickness: number; // nm
  initialMaskAngleDeg: number; // deg
}

const INITIAL_STATE: ArdeState = {
  nominalRate: 500,
  cd: 100,
  cdUnit: 'nm',
  depth: 500,
  depthUnit: 'nm',
  model: 'coburn-winter',
  modelCoeff: 0.1,
  patternDensity: 30,
  depletionCoeff: 1.0,
  maskEtchRate: 25,
  overetch: 10,
  maskThickness: 200,
  initialMaskAngleDeg: 90,
};

export default function ArdeEtchCalculator() {
  const [state, setState] = useState<ArdeState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  useUrlParamsState(state, setState);
  const g = useGlossary();

  const cdNm = state.cdUnit === 'um' ? state.cd * 1000 : state.cd;
  const depthNm = state.depthUnit === 'um' ? state.depth * 1000 : state.depth;

  const results = useMemo(() => {
    if (cdNm <= 0 || depthNm <= 0 || state.nominalRate <= 0) {
      return null;
    }

    try {
      const arde = calculateArdeEtchRate({
        nominalRate: state.nominalRate,
        depth: depthNm,
        cd: cdNm,
        model: state.model,
        modelCoefficient: state.modelCoeff,
      });

      const densityFraction = Math.max(0, Math.min(1, state.patternDensity / 100));
      const microloading = calculateMicroloading({
        patternDensity: densityFraction,
        neutralDepletionCoeff: state.depletionCoeff,
        isolatedEtchRate: state.nominalRate,
      });

      const selectivity = calculateEtchSelectivity({
        targetEtchRate: state.nominalRate,
        maskEtchRate: Math.max(0, state.maskEtchRate),
        overetchPercent: Math.max(0, state.overetch),
        targetThickness: depthNm,
        maskThickness: state.maskThickness > 0 ? state.maskThickness : undefined,
        initialMaskAngleDeg: state.initialMaskAngleDeg,
      });

      // Combined effective etch rate at trench bottom accounting for both ARDE lag and pattern microloading
      const effectiveBottomRate = arde.etchRate * microloading.microloadingRatio;

      // Realistic total etch time: time to reach depth at effective ARDE rate + overetch %
      const effectiveEtchTimeSec = effectiveBottomRate > 0
        ? (depthNm / effectiveBottomRate) * 60 * (1 + state.overetch / 100)
        : 0;

      return {
        arde,
        microloading,
        selectivity,
        effectiveBottomRate,
        effectiveEtchTimeSec,
        aspectRatio: arde.aspectRatio,
      };
    } catch {
      return null;
    }
  }, [state, cdNm, depthNm]);

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  const handleCopy = async () => {
    if (!results) return;
    const lines = [
      'ARDE & Microloading Calculator Results',
      '---------------------------------------',
      `Critical Dimension (CD): ${state.cd} ${state.cdUnit} (${cdNm} nm)`,
      `Etch Depth: ${state.depth} ${state.depthUnit} (${depthNm} nm)`,
      `Aspect Ratio (AR): ${fmt(results.aspectRatio, 2)}:1`,
      `ARDE Model: ${state.model === 'coburn-winter' ? 'Coburn-Winter (Knudsen)' : 'Exponential Decay'} (k = ${state.modelCoeff})`,
      `Nominal Open-Field Rate: ${state.nominalRate} nm/min`,
      `ARDE Lag Ratio: ${(results.arde.lagRatio * 100).toFixed(1)}%`,
      `ARDE Etch Rate Reduction: ${results.arde.percentageReduction.toFixed(1)}%`,
      `ARDE Bottom Etch Rate: ${fmt(results.arde.etchRate, 2)} nm/min`,
      `Pattern Density: ${state.patternDensity}%`,
      `Microloading Ratio (Dense/Iso): ${fmt(results.microloading.microloadingRatio, 3)}`,
      `Effective Bottom Etch Rate (ARDE + Microloading): ${fmt(results.effectiveBottomRate, 2)} nm/min`,
      `Mask Selectivity: ${results.selectivity.selectivity === Infinity ? 'Infinite' : fmt(results.selectivity.selectivity, 1) + ':1'}`,
      `Sidewall Profile Angle: ${fmt(results.selectivity.profileAngleDeg, 2)}°`,
      `Sidewall Taper Angle: ${fmt(results.selectivity.taperAngleDeg, 2)}°`,
      `Total Etch Time (with ${state.overetch}% OE): ${fmt(results.effectiveEtchTimeSec, 1)} s (${fmt(results.effectiveEtchTimeSec / 60, 2)} min)`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const buildExportRows = () => {
    if (!results) return null;

    const headers = ['Category', 'Parameter', 'Value', 'Unit', 'Notes'];
    const rows: (string | number)[][] = [
      ['Input', 'Nominal Open-Field Etch Rate', state.nominalRate, 'nm/min', 'Unpatterned bulk substrate rate'],
      ['Input', 'Critical Dimension (CD)', state.cd, state.cdUnit, `Equivalent to ${cdNm} nm`],
      ['Input', 'Etch Depth', state.depth, state.depthUnit, `Equivalent to ${depthNm} nm`],
      ['Output', 'Aspect Ratio (Depth / CD)', fmt(results.aspectRatio, 3), ':1', 'Feature aspect ratio'],
      ['Input', 'ARDE Model', state.model, '—', 'Knudsen transport depletion'],
      ['Input', 'Model Attenuation Parameter', state.modelCoeff, '—', state.model === 'coburn-winter' ? 'k factor' : 'alpha factor'],
      ['Output', 'ARDE Lag Ratio R(AR)/R0', fmt(results.arde.lagRatio * 100, 2), '%', 'Fraction of open-field rate'],
      ['Output', 'ARDE Rate Reduction', fmt(results.arde.percentageReduction, 2), '%', 'RIE lag loss percentage'],
      ['Output', 'ARDE Bottom Etch Rate', fmt(results.arde.etchRate, 2), 'nm/min', 'Etch rate at trench bottom (isolated)'],
      ['Input', 'Pattern Open Area Density', state.patternDensity, '%', 'Local active etch area fraction'],
      ['Input', 'Neutral Depletion Coeff (eta)', state.depletionCoeff, '—', 'Mogab loading coefficient'],
      ['Output', 'Microloading Ratio (Dense/Iso)', fmt(results.microloading.microloadingRatio, 4), '—', 'Dense pattern loading factor'],
      ['Output', 'Microloading Depletion', fmt(results.microloading.loadingDepletionPercent, 2), '%', 'Depletion due to dense reactant consumption'],
      ['Output', 'Effective Bottom Etch Rate', fmt(results.effectiveBottomRate, 2), 'nm/min', 'Combined ARDE and microloading bottom rate'],
      ['Input', 'Mask Etch Rate', state.maskEtchRate, 'nm/min', 'Vertical mask erosion rate'],
      ['Output', 'Mask Selectivity', results.selectivity.selectivity === Infinity ? 'Infinite' : fmt(results.selectivity.selectivity, 2), ':1', 'Target / Mask etch rate'],
      ['Output', 'Sidewall Profile Angle', fmt(results.selectivity.profileAngleDeg, 2), 'deg', 'Trench sidewall inclination from horizontal'],
      ['Output', 'Sidewall Taper Angle', fmt(results.selectivity.taperAngleDeg, 2), 'deg', 'Sidewall deviation from vertical (90 - theta)'],
      ['Input', 'Overetch Target', state.overetch, '%', 'Process overetch margin'],
      ['Output', 'Total Etch Time', fmt(results.effectiveEtchTimeSec, 1), 's', `Overetch included (${fmt(results.effectiveEtchTimeSec / 60, 2)} min)`],
      ['Output', 'Mask Loss', fmt(results.selectivity.maskLoss ?? 0, 1), 'nm', 'Mask eroded during complete etch cycle'],
    ];

    return { headers, rows };
  };

  const handleExportCsv = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv('arde-etch-simulation.csv', data.headers, data.rows);
  };

  const handleExportXlsx = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx('arde-etch-simulation.xlsx', 'ARDE Etch Results', data.headers, data.rows);
  };

  const handleExportPdf = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadPdf('arde-etch-simulation.pdf', 'ARDE Etch Simulation', (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ARDE Etch Simulation', pageWidth / 2, y + 5, { align: 'center' });
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

  return (
    <div className="calc-grid">
      {/* Left Column: Inputs */}
      <section className="panel" aria-labelledby="arde-inputs">
        <h2 id="arde-inputs">Etch & Feature Parameters</h2>

        <div className="field">
          <label htmlFor="nominal-rate">
            Nominal Etch Rate (R₀)<span className="unit">nm/min</span>
          </label>
          <input
            id="nominal-rate"
            type="number"
            step="10"
            min="1"
            value={state.nominalRate}
            onChange={(e) => setState((p) => ({ ...p, nominalRate: Math.max(1, Number(e.target.value) || 0) }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="feature-cd">
              {g('criticalDimension')} (CD)
            </label>
            <input
              id="feature-cd"
              type="number"
              step={state.cdUnit === 'um' ? '0.01' : '5'}
              min="0.001"
              value={state.cd}
              onChange={(e) => setState((p) => ({ ...p, cd: Math.max(0.001, Number(e.target.value) || 0) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="cd-unit">{g('unitLabel')}</label>
            <select
              id="cd-unit"
              value={state.cdUnit}
              onChange={(e) => setState((p) => ({ ...p, cdUnit: e.target.value as 'nm' | 'um' }))}
            >
              <option value="nm">nm</option>
              <option value="um">μm</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="feature-depth">
              Etch Depth
            </label>
            <input
              id="feature-depth"
              type="number"
              step={state.depthUnit === 'um' ? '0.05' : '20'}
              min="0.001"
              value={state.depth}
              onChange={(e) => setState((p) => ({ ...p, depth: Math.max(0.001, Number(e.target.value) || 0) }))}
            />
          </div>
          <div className="field">
            <label htmlFor="depth-unit">{g('unitLabel')}</label>
            <select
              id="depth-unit"
              value={state.depthUnit}
              onChange={(e) => setState((p) => ({ ...p, depthUnit: e.target.value as 'nm' | 'um' }))}
            >
              <option value="nm">nm</option>
              <option value="um">μm</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="arde-model">ARDE / RIE Lag Model</label>
          <select
            id="arde-model"
            value={state.model}
            onChange={(e) => setState((p) => ({ ...p, model: e.target.value as ArdeModel }))}
          >
            <option value="coburn-winter">Coburn-Winter (Knudsen Flux: R₀ / (1 + k·AR))</option>
            <option value="exponential">Exponential Decay (R₀ · exp(-α·AR))</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="model-coeff">
            Model Attenuation Coeff ({state.model === 'coburn-winter' ? 'k' : 'α'})
            <span className="unit">{state.model === 'coburn-winter' ? 'default 0.10' : 'default 0.10'}</span>
          </label>
          <input
            id="model-coeff"
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={state.modelCoeff}
            onChange={(e) => setState((p) => ({ ...p, modelCoeff: Math.max(0, Number(e.target.value) || 0) }))}
          />
        </div>

        <div className="field">
          <label htmlFor="pattern-density">
            Pattern Open Area Density (ρ)<span className="unit">% ({state.patternDensity}%)</span>
          </label>
          <input
            id="pattern-density"
            type="range"
            min="1"
            max="100"
            step="1"
            value={state.patternDensity}
            onChange={(e) => setState((p) => ({ ...p, patternDensity: Number(e.target.value) }))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <span>Isolated (&lt; 5%)</span>
            <span>Semi-dense (20–40%)</span>
            <span>Dense (&gt; 70%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="mask-rate">
              Mask Etch Rate<span className="unit">nm/min</span>
            </label>
            <input
              id="mask-rate"
              type="number"
              step="5"
              min="0"
              value={state.maskEtchRate}
              onChange={(e) => setState((p) => ({ ...p, maskEtchRate: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="overetch-pct">
              Overetch Target<span className="unit">%</span>
            </label>
            <input
              id="overetch-pct"
              type="number"
              step="1"
              min="0"
              max="100"
              value={state.overetch}
              onChange={(e) => setState((p) => ({ ...p, overetch: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="mask-thick">
              Mask Thickness<span className="unit">nm</span>
            </label>
            <input
              id="mask-thick"
              type="number"
              step="25"
              min="10"
              value={state.maskThickness}
              onChange={(e) => setState((p) => ({ ...p, maskThickness: Math.max(10, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="depletion-coeff">
              Neutral Depletion (η)
            </label>
            <input
              id="depletion-coeff"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={state.depletionCoeff}
              onChange={(e) => setState((p) => ({ ...p, depletionCoeff: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
        </div>

        <div className="action-row" style={{ marginTop: '16px' }}>
          <button className="button secondary" type="button" onClick={handleReset}>
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </section>

      {/* Right Column: Results & Schematic */}
      <section className="panel" aria-labelledby="arde-results">
        <h2 id="arde-results">ARDE & Profile Results</h2>

        {results ? (
          <>
            <div className="highlight-metric">
              <div className="highlight-label">Effective Etch Rate at Bottom</div>
              <div className="highlight-value" style={{ fontSize: '28px', color: 'var(--primary)' }}>
                {fmt(results.effectiveBottomRate, 2)}{' '}
                <span style={{ fontSize: '16px', fontWeight: 400 }}>nm/min</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Open-field rate: {state.nominalRate} nm/min · Isolated bottom rate: {fmt(results.arde.etchRate, 2)} nm/min
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Aspect Ratio (AR)</span>
                <strong>{fmt(results.aspectRatio, 2)}:1</strong>
              </div>
              <div className="metric">
                <span>ARDE Reduction Ratio</span>
                <strong style={{ color: results.arde.percentageReduction > 30 ? '#ef4444' : 'inherit' }}>
                  {results.arde.percentageReduction.toFixed(1)}%
                </strong>
              </div>
              <div className="metric">
                <span>Microloading Factor</span>
                <strong>{fmt(results.microloading.microloadingRatio, 3)}</strong>
              </div>
              <div className="metric">
                <span>Mask Selectivity</span>
                <strong>
                  {results.selectivity.selectivity === Infinity
                    ? 'Infinite'
                    : `${fmt(results.selectivity.selectivity, 1)} : 1`}
                </strong>
              </div>
              <div className="metric">
                <span>Profile Taper Angle</span>
                <strong>{fmt(results.selectivity.taperAngleDeg, 2)}°</strong>
              </div>
              <div className="metric">
                <span>Sidewall Profile (θ)</span>
                <strong>{fmt(results.selectivity.profileAngleDeg, 2)}°</strong>
              </div>
              <div className="metric">
                <span>Total Etch Time (+OE)</span>
                <strong>{fmt(results.effectiveEtchTimeSec, 1)} s</strong>
              </div>
              <div className="metric">
                <span>Estimated Mask Loss</span>
                <strong>{fmt(results.selectivity.maskLoss ?? 0, 1)} nm</strong>
              </div>
            </div>

            {/* Visual SVG Trench Diagram */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                Trench Cross-Section & ARDE Transport Schematic
              </h3>
              <ArdeTrenchDiagram
                cdNm={cdNm}
                depthNm={depthNm}
                aspectRatio={results.aspectRatio}
                taperAngleDeg={results.selectivity.taperAngleDeg}
                profileAngleDeg={results.selectivity.profileAngleDeg}
                lagRatio={results.arde.lagRatio}
              />
            </div>

            <div className="action-row" style={{ marginTop: '20px' }}>
              <button
                className="button primary"
                type="button"
                onClick={handleCopy}
                disabled={copied}
              >
                <Copy size={15} />
                {copied ? 'Copied to clipboard' : 'Copy Results'}
              </button>
              <button className="button secondary" type="button" onClick={handleExportCsv}>
                <Download size={15} />
                Export to CSV
              </button>
              <button className="button secondary" type="button" onClick={handleExportXlsx}>
                <Download size={15} />
                Export to XLSX
              </button>
              <button className="button secondary" type="button" onClick={handleExportPdf}>
                <Download size={15} />
                Export to PDF
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--ink-soft)', padding: '24px 0' }}>
            Please enter positive values for nominal etch rate, CD, and depth.
          </div>
        )}
      </section>

      {/* LaTeX Formula Block with MathFormula */}
      <section className="panel" style={{ gridColumn: '1 / -1' }} aria-labelledby="formula-reference">
        <h2 id="formula-reference" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} />
          Governing Equations & Physics Reference
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
          <MathFormula
            block
            label="Coburn-Winter Knudsen ARDE Model"
            math="R(\text{AR}) = \frac{R_0}{1 + k \cdot \text{AR}} \quad \text{where} \quad \text{AR} = \frac{D}{\text{CD}}"
          />
          <MathFormula
            block
            label="Exponential Attenuation ARDE Model"
            math="R(\text{AR}) = R_0 \exp(-\alpha \cdot \text{AR})"
          />
          <MathFormula
            block
            label="Mogab Pattern Microloading Ratio"
            math="\frac{R_{\text{dense}}}{R_{\text{iso}}} = \frac{1}{1 + \eta \cdot \rho}"
          />
          <MathFormula
            block
            label="Mask Selectivity & Profile Taper Angle"
            math="S = \frac{R_{\text{target}}}{R_{\text{mask}}}, \quad \tan\theta = S \cdot \tan\theta_{\text{mask}}, \quad \theta_{\text{taper}} = 90^\circ - \theta"
          />
        </div>
      </section>
    </div>
  );
}

interface ArdeTrenchDiagramProps {
  cdNm: number;
  depthNm: number;
  aspectRatio: number;
  taperAngleDeg: number;
  profileAngleDeg: number;
  lagRatio: number;
}

function ArdeTrenchDiagram({
  cdNm,
  depthNm,
  aspectRatio,
  taperAngleDeg,
  profileAngleDeg,
  lagRatio,
}: ArdeTrenchDiagramProps) {
  // SVG Canvas dimensions: 440 wide, 240 tall
  const svgWidth = 440;
  const svgHeight = 240;
  const centerX = svgWidth / 2;

  // Geometry layout:
  // Top mask top: Y = 32, Mask height = 28 -> substrate top surface at Y = 60
  const maskTopY = 30;
  const maskHeight = 26;
  const substrateTopY = maskTopY + maskHeight; // 56

  // Visual scaling of CD and depth:
  // Trench width CD visually scaled between 60px and 160px
  const visualCd = 110;
  // Depth visually scaled based on aspect ratio, max 130px
  const visualDepth = Math.max(45, Math.min(135, visualCd * Math.min(aspectRatio, 2.5) * 0.7));

  // Taper offset at bottom based on profile angle
  const maxTaperOffset = (visualCd / 2) - 8;
  const taperRad = (Math.max(0, taperAngleDeg) * Math.PI) / 180;
  const visualTaperOffset = Math.min(maxTaperOffset, visualDepth * Math.tan(taperRad) * 0.8);

  const topHalfW = visualCd / 2;
  const bottomHalfW = Math.max(10, topHalfW - visualTaperOffset);

  const trenchLeftTop = centerX - topHalfW;
  const trenchRightTop = centerX + topHalfW;
  const trenchLeftBottom = centerX - bottomHalfW;
  const trenchRightBottom = centerX + bottomHalfW;
  const trenchBottomY = substrateTopY + visualDepth;

  // Mask rectangles
  const leftMaskWidth = trenchLeftTop - 20;
  const rightMaskWidth = (svgWidth - 20) - trenchRightTop;

  // Substrate polygon path
  const substratePath = `
    M 20 ${substrateTopY}
    L ${trenchLeftTop} ${substrateTopY}
    L ${trenchLeftBottom} ${trenchBottomY}
    L ${trenchRightBottom} ${trenchBottomY}
    L ${trenchRightTop} ${substrateTopY}
    L ${svgWidth - 20} ${substrateTopY}
    L ${svgWidth - 20} ${svgHeight - 16}
    L 20 ${svgHeight - 16}
    Z
  `;

  // Neutral flux arrow opacity reflecting ARDE Knudsen lag
  const bottomOpacity = Math.max(0.15, Math.min(0.9, lagRatio));

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: '8px',
        border: '1px solid var(--line)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: '440px', height: 'auto', display: 'block' }}
        aria-label="Etch trench aspect ratio and sidewall profile cross-section"
      >
        <defs>
          <linearGradient id="substrateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--line)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--line)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="plasmaIonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={bottomOpacity} />
          </linearGradient>
          <marker
            id="fluxArrow"
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Substrate Bulk */}
        <path d={substratePath} fill="url(#substrateGrad)" stroke="var(--ink)" strokeWidth="1.5" />

        {/* Mask Layer Left & Right */}
        <rect
          x="20"
          y={maskTopY}
          width={leftMaskWidth}
          height={maskHeight}
          fill="#a855f7"
          fillOpacity="0.25"
          stroke="#a855f7"
          strokeWidth="1.5"
          rx="2"
        />
        <rect
          x={trenchRightTop}
          y={maskTopY}
          width={rightMaskWidth}
          height={maskHeight}
          fill="#a855f7"
          fillOpacity="0.25"
          stroke="#a855f7"
          strokeWidth="1.5"
          rx="2"
        />

        {/* Labels for Mask and Substrate */}
        <text x="30" y={maskTopY + 17} fill="#a855f7" fontSize="10" fontWeight="600">
          Hardmask
        </text>
        <text x="30" y={svgHeight - 24} fill="var(--ink-soft)" fontSize="11" fontWeight="500">
          Substrate (Silicon / Dielectric)
        </text>

        {/* Reactive ion / neutral transport Knudsen flux arrows */}
        <g opacity="0.85">
          <line
            x1={centerX - 18}
            y1={10}
            x2={centerX - 18}
            y2={trenchBottomY - 6}
            stroke="url(#plasmaIonGrad)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            markerEnd="url(#fluxArrow)"
          />
          <line
            x1={centerX}
            y1={6}
            x2={centerX}
            y2={trenchBottomY - 6}
            stroke="url(#plasmaIonGrad)"
            strokeWidth="2"
            markerEnd="url(#fluxArrow)"
          />
          <line
            x1={centerX + 18}
            y1={10}
            x2={centerX + 18}
            y2={trenchBottomY - 6}
            stroke="url(#plasmaIonGrad)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            markerEnd="url(#fluxArrow)"
          />
        </g>

        {/* Top CD dimension line */}
        <g stroke="var(--primary)" strokeWidth="1">
          {/* Extension ticks */}
          <line x1={trenchLeftTop} y1={maskTopY - 8} x2={trenchLeftTop} y2={maskTopY - 2} />
          <line x1={trenchRightTop} y1={maskTopY - 8} x2={trenchRightTop} y2={maskTopY - 2} />
          {/* Dimension horizontal line */}
          <line x1={trenchLeftTop + 3} y1={maskTopY - 5} x2={trenchRightTop - 3} y2={maskTopY - 5} />
          {/* Arrow heads */}
          <polygon points={`${trenchLeftTop},${maskTopY - 5} ${trenchLeftTop + 4},${maskTopY - 7} ${trenchLeftTop + 4},${maskTopY - 3}`} fill="var(--primary)" />
          <polygon points={`${trenchRightTop},${maskTopY - 5} ${trenchRightTop - 4},${maskTopY - 7} ${trenchRightTop - 4},${maskTopY - 3}`} fill="var(--primary)" />
        </g>
        <text
          x={centerX}
          y={maskTopY - 9}
          fill="var(--primary)"
          fontSize="10"
          fontWeight="600"
          textAnchor="middle"
        >
          CD = {cdNm} nm
        </text>

        {/* Depth dimension line (Right side) */}
        <g stroke="var(--ink-soft)" strokeWidth="1">
          <line x1={trenchRightTop + 14} y1={substrateTopY} x2={trenchRightTop + 24} y2={substrateTopY} />
          <line x1={trenchRightBottom + 14} y1={trenchBottomY} x2={trenchRightBottom + 24} y2={trenchBottomY} />
          <line x1={trenchRightTop + 19} y1={substrateTopY + 3} x2={trenchRightTop + 19} y2={trenchBottomY - 3} />
          <polygon points={`${trenchRightTop + 19},${substrateTopY} ${trenchRightTop + 17},${substrateTopY + 4} ${trenchRightTop + 21},${substrateTopY + 4}`} fill="var(--ink-soft)" />
          <polygon points={`${trenchRightTop + 19},${trenchBottomY} ${trenchRightTop + 17},${trenchBottomY - 4} ${trenchRightTop + 21},${trenchBottomY - 4}`} fill="var(--ink-soft)" />
        </g>
        <text
          x={trenchRightTop + 28}
          y={substrateTopY + visualDepth / 2 + 3}
          fill="var(--ink-soft)"
          fontSize="10"
          fontWeight="500"
        >
          D = {depthNm} nm
        </text>

        {/* Sidewall Angle Indicator */}
        <text
          x={trenchLeftTop - 8}
          y={substrateTopY + visualDepth / 2}
          fill="var(--ink)"
          fontSize="9.5"
          fontWeight="600"
          textAnchor="end"
        >
          θ = {profileAngleDeg.toFixed(1)}°
        </text>

        {/* Center Aspect Ratio Callout Badge */}
        <rect
          x={centerX - 35}
          y={substrateTopY + visualDepth / 2 - 10}
          width="70"
          height="20"
          rx="4"
          fill="var(--paper)"
          stroke="var(--line)"
          strokeWidth="1"
          opacity="0.92"
        />
        <text
          x={centerX}
          y={substrateTopY + visualDepth / 2 + 4}
          fill="var(--ink)"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
        >
          AR = {aspectRatio.toFixed(1)}:1
        </text>

        {/* Bottom flux / ARDE depletion callout */}
        <text
          x={centerX}
          y={trenchBottomY + 15}
          fill="var(--ink-soft)"
          fontSize="9.5"
          textAnchor="middle"
        >
          Bottom R(AR) = {(lagRatio * 100).toFixed(0)}% of R₀
        </text>
      </svg>
      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
        Aspect Ratio AR = {aspectRatio.toFixed(2)} · Sidewall θ = {profileAngleDeg.toFixed(1)}° (Taper: {taperAngleDeg.toFixed(1)}°)
      </div>
    </div>
  );
}
