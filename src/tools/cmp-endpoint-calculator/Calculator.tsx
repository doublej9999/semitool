'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Download, Info, AlertTriangle } from 'lucide-react';
import MathFormula from '@/components/tools/MathFormulaClient';
import {
  calculateCmpEndpoint,
  calculateOpticalOscillationPeriod,
  calculatePadLife,
} from '@/lib/cmp-endpoint';
import { downloadCsv, downloadPdf, downloadXlsx } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';

interface CmpState {
  [key: string]: string | number | boolean;
  filmThickness: number; // nm
  removalRate: number; // nm/min
  overpolishPercent: number; // %
  underlayerDelaySec: number; // s
  wavelengthNm: number; // nm
  refractiveIndex: number; // n
  currentWafers: number;
  maxPadLifeWafers: number;
  conditioningCutRateUmPerHour: number; // um/hr
  initialPadGrooveDepthMm: number; // mm
  minAllowedGrooveDepthMm: number; // mm
  conditioningSecPerWafer: number; // s
}

const INITIAL_STATE: CmpState = {
  filmThickness: 800,
  removalRate: 250,
  overpolishPercent: 15,
  underlayerDelaySec: 5,
  wavelengthNm: 633,
  refractiveIndex: 1.46,
  currentWafers: 450,
  maxPadLifeWafers: 1200,
  conditioningCutRateUmPerHour: 18,
  initialPadGrooveDepthMm: 1.2,
  minAllowedGrooveDepthMm: 0.3,
  conditioningSecPerWafer: 60,
};

export default function CmpEndpointCalculator() {
  const [state, setState] = useState<CmpState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  useUrlParamsState(state, setState);
  const g = useGlossary();

  const results = useMemo(() => {
    if (
      state.filmThickness <= 0 ||
      state.removalRate <= 0 ||
      state.wavelengthNm <= 0 ||
      state.refractiveIndex < 1 ||
      state.maxPadLifeWafers <= 0 ||
      state.initialPadGrooveDepthMm <= state.minAllowedGrooveDepthMm
    ) {
      return null;
    }

    try {
      const endpoint = calculateCmpEndpoint({
        filmThickness: state.filmThickness,
        removalRate: state.removalRate,
        underlayerDelaySec: Math.max(0, state.underlayerDelaySec),
        overpolishPercent: Math.max(0, state.overpolishPercent),
      });

      const optical = calculateOpticalOscillationPeriod({
        wavelengthNm: state.wavelengthNm,
        refractiveIndex: state.refractiveIndex,
        removalRate: state.removalRate,
        filmThickness: state.filmThickness,
      });

      const padLife = calculatePadLife({
        currentWafers: Math.max(0, state.currentWafers),
        maxPadLifeWafers: state.maxPadLifeWafers,
        conditioningCutRateUmPerHour: Math.max(0, state.conditioningCutRateUmPerHour),
        initialPadGrooveDepthMm: state.initialPadGrooveDepthMm,
        minAllowedGrooveDepthMm: state.minAllowedGrooveDepthMm,
        conditioningSecPerWafer: Math.max(1, state.conditioningSecPerWafer),
      });

      // Remaining hours: wafer processing hours remaining
      const remainingPolishHours = (padLife.remainingWafers * endpoint.totalTimeSec) / 3600;
      // Conditioning hours left purely on pad groove depth
      const remainingConditioningHours = state.conditioningCutRateUmPerHour > 0
        ? (padLife.grooveDepthRemainingMm * 1000) / state.conditioningCutRateUmPerHour
        : Infinity;

      return {
        endpoint,
        optical,
        padLife,
        remainingPolishHours,
        remainingConditioningHours,
      };
    } catch {
      return null;
    }
  }, [state]);

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  const handleCopy = async () => {
    if (!results) return;
    const { endpoint, optical, padLife, remainingPolishHours } = results;

    const lines = [
      'CMP Endpoint & Pad Life Calculator Results',
      '-------------------------------------------',
      `Film Thickness: ${state.filmThickness} nm`,
      `Removal Rate: ${state.removalRate} nm/min`,
      `Time to Endpoint (Interface Clear): ${fmt(endpoint.timeToInterfaceSec, 1)} s (${fmt(endpoint.timeToInterfaceMin, 2)} min)`,
      `Underlayer Detection Delay: ${state.underlayerDelaySec} s`,
      `Overpolish Time (${state.overpolishPercent}%): ${fmt(endpoint.overpolishDurationSec, 1)} s`,
      `Total Polish Recipe Time: ${fmt(endpoint.totalTimeSec, 1)} s (${fmt(endpoint.totalTimeMin, 2)} min)`,
      `Total Equivalent Removed: ${fmt(endpoint.totalThicknessRemovedNm, 1)} nm`,
      `Laser Wavelength: ${state.wavelengthNm} nm (n = ${state.refractiveIndex})`,
      `Interference Fringe Period: ${fmt(optical.oscillationPeriodSec, 1)} s`,
      `Thickness Per Fringe: ${fmt(optical.thicknessPerCycleNm, 1)} nm`,
      `Expected Fringe Count: ${fmt(optical.expectedFringes ?? 0, 2)} fringes`,
      `Current Pad Wafers: ${padLife.currentWafers} / ${padLife.maxPadLifeWafers}`,
      `Remaining Pad Life: ${padLife.remainingWafers} wafers (~${fmt(remainingPolishHours, 1)} polish hours)`,
      `Current Pad Groove Depth: ${fmt(padLife.currentGrooveDepthMm, 3)} mm (Min: ${state.minAllowedGrooveDepthMm} mm)`,
      `Remaining Usable Groove: ${fmt(padLife.grooveDepthRemainingMm, 3)} mm`,
      `Pad Limiting Factor: ${padLife.limitingFactor === 'groove_wear' ? 'Groove Wear Out' : 'Wafer Count Limit'}`,
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
    const { endpoint, optical, padLife, remainingPolishHours, remainingConditioningHours } = results;

    const headers = ['Category', 'Parameter', 'Value', 'Unit', 'Notes'];
    const rows: (string | number)[][] = [
      ['Input', 'Initial Film Thickness', state.filmThickness, 'nm', 'Dielectric / metal film to polish'],
      ['Input', 'Removal Rate', state.removalRate, 'nm/min', 'Preston CMP polish rate'],
      ['Input', 'Overpolish Margin', state.overpolishPercent, '%', 'Overpolish past endpoint'],
      ['Input', 'Underlayer Detection Delay', state.underlayerDelaySec, 's', 'Debounce / filter time on motor current'],
      ['Output', 'Time to Endpoint (Interface)', fmt(endpoint.timeToInterfaceSec, 1), 's', `${fmt(endpoint.timeToInterfaceMin, 2)} min`],
      ['Output', 'Overpolish Duration', fmt(endpoint.overpolishDurationSec, 1), 's', 'Post-endpoint clear buffer'],
      ['Output', 'Total Polish Recipe Time', fmt(endpoint.totalTimeSec, 1), 's', `${fmt(endpoint.totalTimeMin, 2)} min total cycle`],
      ['Output', 'Total Thickness Removed', fmt(endpoint.totalThicknessRemovedNm, 1), 'nm', 'Including delay and overpolish'],
      ['Input', 'Optical Laser Wavelength', state.wavelengthNm, 'nm', 'Reflectometry monitor wavelength'],
      ['Input', 'Film Refractive Index (n)', state.refractiveIndex, '—', 'Optical index for path length'],
      ['Output', 'Optical Fringe Thickness', fmt(optical.thicknessPerCycleNm, 2), 'nm', 'lambda / (2 * n)'],
      ['Output', 'Optical Fringe Period', fmt(optical.oscillationPeriodSec, 1), 's', 'Constructive interference cycle'],
      ['Output', 'Expected Total Fringes', fmt(optical.expectedFringes ?? 0, 2), 'cycles', 'Total oscillations to endpoint'],
      ['Input', 'Current Wafer Count', state.currentWafers, 'wafers', 'Polished on current pad'],
      ['Input', 'Max Qualified Pad Life', state.maxPadLifeWafers, 'wafers', 'Fab recipe qualification limit'],
      ['Input', 'Conditioning Cut Rate', state.conditioningCutRateUmPerHour, 'um/hr', 'Diamond disc wear rate on pad'],
      ['Input', 'Initial Groove Depth', state.initialPadGrooveDepthMm, 'mm', 'Fresh pad specification'],
      ['Input', 'Min Allowed Groove Depth', state.minAllowedGrooveDepthMm, 'mm', 'Slurry transport starvation limit'],
      ['Output', 'Current Groove Depth', fmt(padLife.currentGrooveDepthMm, 3), 'mm', 'Pad groove remaining from base'],
      ['Output', 'Usable Groove Depth Left', fmt(padLife.grooveDepthRemainingMm, 3), 'mm', 'Above minimum cutoff'],
      ['Output', 'Remaining Pad Life (Wafers)', padLife.remainingWafers, 'wafers', `Limiting factor: ${padLife.limitingFactor}`],
      ['Output', 'Remaining Polish Hours', fmt(remainingPolishHours, 1), 'hr', 'Based on recipe total time'],
      ['Output', 'Remaining Conditioning Hours', fmt(remainingConditioningHours, 1), 'hr', 'Hours of cut time before groove min'],
      ['Output', 'Pad Life Used', fmt(padLife.percentLifeUsed, 1), '%', 'Fraction of qualified lifespan'],
    ];

    return { headers, rows };
  };

  const handleExportCsv = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv('cmp-endpoint-padlife.csv', data.headers, data.rows);
  };

  const handleExportXlsx = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx('cmp-endpoint-padlife.xlsx', 'CMP Endpoint & Pad Life', data.headers, data.rows);
  };

  const handleExportPdf = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadPdf('cmp-endpoint-padlife.pdf', 'CMP Endpoint & Pad Life', (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CMP Endpoint & Pad Life', pageWidth / 2, y + 5, { align: 'center' });
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
      {/* Left Column: Process & Hardware Inputs */}
      <section className="panel" aria-labelledby="cmp-inputs">
        <h2 id="cmp-inputs">CMP Endpoint & Pad Parameters</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="film-thick">
              {g('filmThickness')}<span className="unit">nm</span>
            </label>
            <input
              id="film-thick"
              type="number"
              step="50"
              min="10"
              value={state.filmThickness}
              onChange={(e) => setState((p) => ({ ...p, filmThickness: Math.max(1, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="removal-rate">
              {g('removalRate')}<span className="unit">nm/min</span>
            </label>
            <input
              id="removal-rate"
              type="number"
              step="10"
              min="1"
              value={state.removalRate}
              onChange={(e) => setState((p) => ({ ...p, removalRate: Math.max(1, Number(e.target.value) || 0) }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="overpolish">
              Overpolish<span className="unit">%</span>
            </label>
            <input
              id="overpolish"
              type="number"
              step="1"
              min="0"
              max="100"
              value={state.overpolishPercent}
              onChange={(e) => setState((p) => ({ ...p, overpolishPercent: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="transition-delay">
              Underlayer Delay<span className="unit">s</span>
            </label>
            <input
              id="transition-delay"
              type="number"
              step="1"
              min="0"
              value={state.underlayerDelaySec}
              onChange={(e) => setState((p) => ({ ...p, underlayerDelaySec: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="wavelength">
              Laser Wavelength (λ)<span className="unit">nm</span>
            </label>
            <input
              id="wavelength"
              type="number"
              step="1"
              min="200"
              max="1100"
              value={state.wavelengthNm}
              onChange={(e) => setState((p) => ({ ...p, wavelengthNm: Math.max(1, Number(e.target.value) || 0) }))}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '11px' }}>
              <button
                type="button"
                className="button-link"
                style={{ fontSize: '11px', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                onClick={() => setState((p) => ({ ...p, wavelengthNm: 633, refractiveIndex: 1.46 }))}
              >
                HeNe (633nm / SiO₂)
              </button>
              <span>·</span>
              <button
                type="button"
                className="button-link"
                style={{ fontSize: '11px', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                onClick={() => setState((p) => ({ ...p, wavelengthNm: 670, refractiveIndex: 2.0 }))}
              >
                Diode (670nm / SiN)
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="refractive-idx">
              {g('refractiveIndex')} (n)
            </label>
            <input
              id="refractive-idx"
              type="number"
              step="0.01"
              min="1"
              max="5"
              value={state.refractiveIndex}
              onChange={(e) => setState((p) => ({ ...p, refractiveIndex: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '14px', marginTop: '16px', marginBottom: '8px', color: 'var(--ink)' }}>
          Pad Conditioning & Groove Wear
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="current-wafers">
              Current Wafers on Pad
            </label>
            <input
              id="current-wafers"
              type="number"
              step="25"
              min="0"
              value={state.currentWafers}
              onChange={(e) => setState((p) => ({ ...p, currentWafers: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="max-pad-life">
              Max Pad Life<span className="unit">wafers</span>
            </label>
            <input
              id="max-pad-life"
              type="number"
              step="50"
              min="10"
              value={state.maxPadLifeWafers}
              onChange={(e) => setState((p) => ({ ...p, maxPadLifeWafers: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cut-rate">
            Conditioning Cut Rate<span className="unit">μm/hour</span>
          </label>
          <input
            id="cut-rate"
            type="number"
            step="1"
            min="0"
            value={state.conditioningCutRateUmPerHour}
            onChange={(e) => setState((p) => ({ ...p, conditioningCutRateUmPerHour: Math.max(0, Number(e.target.value) || 0) }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="field">
            <label htmlFor="init-groove">
              Initial Groove Depth<span className="unit">mm</span>
            </label>
            <input
              id="init-groove"
              type="number"
              step="0.05"
              min="0.1"
              value={state.initialPadGrooveDepthMm}
              onChange={(e) => setState((p) => ({ ...p, initialPadGrooveDepthMm: Math.max(0.1, Number(e.target.value) || 0.1) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="min-groove">
              Min Allowed Groove<span className="unit">mm</span>
            </label>
            <input
              id="min-groove"
              type="number"
              step="0.05"
              min="0"
              value={state.minAllowedGrooveDepthMm}
              onChange={(e) => setState((p) => ({ ...p, minAllowedGrooveDepthMm: Math.max(0, Number(e.target.value) || 0) }))}
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

      {/* Right Column: Timing, Optical Fringes & Pad Health */}
      <section className="panel" aria-labelledby="cmp-results">
        <h2 id="cmp-results">Endpoint Timing & Pad Life Status</h2>

        {results ? (
          <>
            {results.padLife.isExpired && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                }}
              >
                <AlertTriangle size={18} />
                <strong>Pad Expired!</strong> Pad has reached its {results.padLife.limitingFactor === 'groove_wear' ? 'minimum groove depth transport limit' : 'maximum qualified wafer capacity'}. Pad change required.
              </div>
            )}

            <div className="highlight-metric">
              <div className="highlight-label">Total Polish Recipe Duration</div>
              <div className="highlight-value" style={{ fontSize: '28px', color: 'var(--primary)' }}>
                {fmt(results.endpoint.totalTimeSec, 1)}{' '}
                <span style={{ fontSize: '16px', fontWeight: 400 }}>seconds</span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--ink-soft)', marginLeft: '6px' }}>
                  ({fmt(results.endpoint.totalTimeMin, 2)} min)
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Time to endpoint interface: {fmt(results.endpoint.timeToInterfaceSec, 1)} s · Overpolish: {fmt(results.endpoint.overpolishDurationSec, 1)} s
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Time to Endpoint</span>
                <strong>{fmt(results.endpoint.timeToInterfaceSec, 1)} s</strong>
              </div>
              <div className="metric">
                <span>Overpolish Time</span>
                <strong>{fmt(results.endpoint.overpolishDurationSec, 1)} s</strong>
              </div>
              <div className="metric">
                <span>Fringe Period (T)</span>
                <strong>{fmt(results.optical.oscillationPeriodSec, 1)} s</strong>
              </div>
              <div className="metric">
                <span>Expected Fringes</span>
                <strong>{fmt(results.optical.expectedFringes ?? 0, 2)}</strong>
              </div>
              <div className="metric">
                <span>Thickness / Fringe</span>
                <strong>{fmt(results.optical.thicknessPerCycleNm, 1)} nm</strong>
              </div>
              <div className="metric">
                <span>Remaining Wafers</span>
                <strong style={{ color: results.padLife.remainingWafers < 100 ? '#ef4444' : 'inherit' }}>
                  {results.padLife.remainingWafers}
                </strong>
              </div>
              <div className="metric">
                <span>Remaining Pad Life</span>
                <strong>{fmt(results.remainingPolishHours, 1)} hrs</strong>
              </div>
              <div className="metric">
                <span>Current Groove Depth</span>
                <strong style={{ color: results.padLife.grooveDepthRemainingMm < 0.1 ? '#ef4444' : 'inherit' }}>
                  {fmt(results.padLife.currentGrooveDepthMm, 3)} mm
                </strong>
              </div>
            </div>

            {/* Visual SVG Diagram: Film Stack & Optical Reflectometry */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--ink-soft)' }}>
                Film Stack Interface & Optical Reflectance Fringes
              </h3>
              <CmpEndpointDiagram
                filmThicknessNm={state.filmThickness}
                removalRateNmMin={state.removalRate}
                totalTimeSec={results.endpoint.totalTimeSec}
                timeToEndpointSec={results.endpoint.timeToInterfaceSec}
                fringePeriodSec={results.optical.oscillationPeriodSec}
                expectedFringes={results.optical.expectedFringes ?? 3}
                wavelengthNm={state.wavelengthNm}
                refractiveIndex={state.refractiveIndex}
                currentGrooveDepthMm={results.padLife.currentGrooveDepthMm}
                initialGrooveDepthMm={state.initialPadGrooveDepthMm}
                minGrooveDepthMm={state.minAllowedGrooveDepthMm}
                percentLifeUsed={results.padLife.percentLifeUsed}
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
            Please enter positive values for film thickness, removal rate, wavelength, and valid groove depth.
          </div>
        )}
      </section>

      {/* LaTeX Formula Block with MathFormula */}
      <section className="panel" style={{ gridColumn: '1 / -1' }} aria-labelledby="cmp-formula-reference">
        <h2 id="cmp-formula-reference" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} />
          CMP Physics & Endpoint Model References
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
          <MathFormula
            block
            label="Motor Current / Friction Endpoint & Overpolish"
            math="t_{\text{endpoint}} = \frac{d_0}{\text{RR}} \times 60\,\text{s}, \quad t_{\text{total}} = t_{\text{endpoint}} + t_{\text{delay}} + t_{\text{endpoint}} \left(\frac{\text{OP}\%}{100}\right)"
          />
          <MathFormula
            block
            label="Optical Reflectometry Fringe Thickness"
            math="\Delta d = \frac{\lambda}{2n}, \quad T_{\text{fringe}} = \frac{\lambda}{2n \cdot \text{RR}} \times 60\,\text{s}, \quad N_{\text{fringes}} = \frac{d_0}{\Delta d}"
          />
          <MathFormula
            block
            label="Diamond Conditioning Pad Wear per Wafer"
            math="w_{\text{wafer}} = \text{CutRate} \times \left(\frac{t_{\text{cond}}}{3600}\right) \,[\mu\text{m/wafer}]"
          />
          <MathFormula
            block
            label="Pad Groove Depth Decay & Slurry Transport Limit"
            math="d_{\text{groove}}(N) = d_{\text{initial}} - N \cdot w_{\text{wafer}} \ge d_{\text{min}}"
          />
        </div>
      </section>
    </div>
  );
}

interface CmpEndpointDiagramProps {
  filmThicknessNm: number;
  removalRateNmMin: number;
  totalTimeSec: number;
  timeToEndpointSec: number;
  fringePeriodSec: number;
  expectedFringes: number;
  wavelengthNm: number;
  refractiveIndex: number;
  currentGrooveDepthMm: number;
  initialGrooveDepthMm: number;
  minGrooveDepthMm: number;
  percentLifeUsed: number;
}

function CmpEndpointDiagram({
  filmThicknessNm,
  totalTimeSec,
  timeToEndpointSec,
  fringePeriodSec,
  expectedFringes,
  wavelengthNm,
  currentGrooveDepthMm,
  initialGrooveDepthMm,
  minGrooveDepthMm,
  percentLifeUsed,
}: CmpEndpointDiagramProps) {
  // SVG ViewBox: 440 wide, 240 high
  const svgWidth = 440;
  const svgHeight = 240;

  // Split view:
  // Top half: Optical Reflectometry Interference Signal (Oscilloscope trace) (Y: 10 to 125)
  // Bottom half: CMP Film Stack Cross-Section & Pad Groove Gauge (Y: 145 to 230)

  // Generate sine wave path for reflectometry fringes up to endpoint, then flat line through overpolish
  const oscX0 = 45;
  const oscX1 = 415;
  const oscW = oscX1 - oscX0;
  const oscMidY = 65;
  const oscAmp = 28;

  // Fraction of time spent before endpoint interface
  const endpointFrac = Math.min(0.85, Math.max(0.3, timeToEndpointSec / (totalTimeSec || 1)));
  const endpointX = oscX0 + oscW * endpointFrac;

  // Generate points for the reflectometry trace
  const numCycles = Math.max(1, Math.min(8, expectedFringes));
  const points: string[] = [];

  for (let px = oscX0; px <= oscX1; px += 2) {
    if (px <= endpointX) {
      const frac = (px - oscX0) / (endpointX - oscX0);
      const phase = frac * numCycles * 2 * Math.PI;
      const y = oscMidY - oscAmp * Math.cos(phase);
      points.push(`${px},${y.toFixed(1)}`);
    } else {
      // Transition step and flat signal into barrier layer
      const decayFrac = Math.min(1, (px - endpointX) / 15);
      const y = oscMidY + oscAmp * 0.45 * (1 - decayFrac) + oscAmp * 0.15;
      points.push(`${px},${y.toFixed(1)}`);
    }
  }

  const fringePolyline = points.join(' ');

  // Laser color based on wavelength
  const laserColor = wavelengthNm < 600 ? '#22c55e' : '#ef4444';

  // Groove wear bar width:
  const grooveFraction = Math.max(
    0,
    Math.min(
      1,
      (currentGrooveDepthMm - minGrooveDepthMm) /
        Math.max(0.01, initialGrooveDepthMm - minGrooveDepthMm)
    )
  );

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
        aria-label="CMP optical reflectometry fringes and film stack profile"
      >
        <defs>
          <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset={`${endpointFrac * 100}%`} stopColor="#06b6d4" />
            <stop offset={`${endpointFrac * 100 + 2}%`} stopColor="#eab308" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="padGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* --- SECTION 1: Optical Reflectometer Waveform Display --- */}
        {/* Oscilloscope Background Frame */}
        <rect
          x="20"
          y="12"
          width="400"
          height="115"
          rx="6"
          fill="var(--surface)"
          stroke="var(--line)"
          strokeWidth="1"
        />

        {/* Grid lines inside oscilloscope */}
        <line x1="20" y1={oscMidY} x2="420" y2={oscMidY} stroke="var(--line)" strokeDasharray="3 3" strokeWidth="0.8" />
        <line x1="20" y1={oscMidY - oscAmp} x2="420" y2={oscMidY - oscAmp} stroke="var(--line)" strokeDasharray="2 4" strokeWidth="0.5" />
        <line x1="20" y1={oscMidY + oscAmp} x2="420" y2={oscMidY + oscAmp} stroke="var(--line)" strokeDasharray="2 4" strokeWidth="0.5" />
        <line x1={endpointX} y1="12" x2={endpointX} y2="127" stroke="#ef4444" strokeDasharray="4 2" strokeWidth="1.2" />

        {/* Header label inside oscilloscope */}
        <text x="32" y="27" fill="var(--ink-soft)" fontSize="10" fontWeight="600">
          In Situ Optical Reflectance Signal (λ = {wavelengthNm} nm)
        </text>

        {/* Endpoint interface label */}
        <text x={endpointX + 4} y="27" fill="#ef4444" fontSize="9.5" fontWeight="600">
          Interface Endpoint ({timeToEndpointSec.toFixed(0)}s)
        </text>

        {/* Fringes Curve */}
        <polyline
          fill="none"
          stroke="url(#traceGrad)"
          strokeWidth="2"
          points={fringePolyline}
        />

        {/* Fringe Period T dimension arrow between first 2 peaks */}
        {numCycles >= 1 && (
          <g>
            <line
              x1={oscX0}
              y1={oscMidY - oscAmp - 5}
              x2={oscX0 + (endpointX - oscX0) / numCycles}
              y2={oscMidY - oscAmp - 5}
              stroke="var(--primary)"
              strokeWidth="1"
            />
            <text
              x={oscX0 + (endpointX - oscX0) / (2 * numCycles)}
              y={oscMidY - oscAmp - 8}
              fill="var(--primary)"
              fontSize="9"
              textAnchor="middle"
              fontWeight="600"
            >
              T = {fringePeriodSec.toFixed(1)}s
            </text>
          </g>
        )}

        {/* Overpolish region label */}
        <rect
          x={endpointX}
          y="108"
          width={oscX1 - endpointX}
          height="16"
          fill="#eab308"
          fillOpacity="0.15"
          rx="2"
        />
        <text
          x={endpointX + (oscX1 - endpointX) / 2}
          y="120"
          fill="#ca8a04"
          fontSize="9.5"
          fontWeight="600"
          textAnchor="middle"
        >
          Overpolish Region
        </text>

        {/* --- SECTION 2: CMP Film Stack & Pad Groove Gauge --- */}
        {/* Left Side: Film Stack */}
        <g transform="translate(20, 140)">
          {/* Silicon Substrate */}
          <rect x="0" y="52" width="180" height="26" fill="var(--line)" stroke="var(--ink)" strokeWidth="1" rx="2" />
          <text x="90" y="68" fill="var(--ink)" fontSize="9" fontWeight="600" textAnchor="middle">
            Silicon Substrate
          </text>

          {/* Underlayer / Barrier (e.g. SiN, TaN) */}
          <rect x="0" y="42" width="180" height="10" fill="#f59e0b" fillOpacity="0.6" stroke="#d97706" strokeWidth="0.8" />
          <text x="90" y="50" fill="#78350f" fontSize="8" fontWeight="600" textAnchor="middle">
            Barrier Layer
          </text>

          {/* Target Film (SiO2) being thinned */}
          <rect x="0" y="16" width="180" height="26" fill="#38bdf8" fillOpacity="0.35" stroke="#0284c7" strokeWidth="1" />
          <text x="90" y="32" fill="#0369a1" fontSize="9" fontWeight="600" textAnchor="middle">
            Film ({filmThicknessNm} nm)
          </text>

          {/* Optical Probe Laser Beam pointing up through substrate window */}
          <line x1="45" y1="88" x2="45" y2="42" stroke={laserColor} strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="50" y1="42" x2="50" y2="88" stroke={laserColor} strokeWidth="1" strokeOpacity="0.7" />
          <polygon points="45,42 42,47 48,47" fill={laserColor} />
          <text x="47" y="93" fill={laserColor} fontSize="8" fontWeight="600" textAnchor="middle">
            Laser Beam
          </text>
        </g>

        {/* Right Side: Pad Groove Wear Life Meter */}
        <g transform="translate(225, 140)">
          <rect x="0" y="0" width="195" height="88" rx="6" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />

          <text x="12" y="18" fill="var(--ink)" fontSize="10.5" fontWeight="600">
            Pad Groove Life Status
          </text>

          <text x="12" y="35" fill="var(--ink-soft)" fontSize="9.5">
            Current Depth: <strong style={{ color: 'var(--ink)' }}>{currentGrooveDepthMm.toFixed(2)} mm</strong>
          </text>
          <text x="12" y="49" fill="var(--ink-soft)" fontSize="9.5">
            Initial: {initialGrooveDepthMm.toFixed(2)} mm · Min Limit: {minGrooveDepthMm.toFixed(2)} mm
          </text>

          {/* Progress bar container */}
          <rect x="12" y="56" width="170" height="12" rx="4" fill="var(--line)" />
          {/* Usable Groove Remaining Bar */}
          <rect
            x="12"
            y="56"
            width={Math.max(4, 170 * grooveFraction)}
            height="12"
            rx="4"
            fill={grooveFraction > 0.3 ? '#10b981' : grooveFraction > 0.1 ? '#f59e0b' : '#ef4444'}
          />

          <text x="12" y="80" fill="var(--ink-soft)" fontSize="9">
            Pad Life Used: {percentLifeUsed.toFixed(0)}%
          </text>
          <text x="182" y="80" fill="var(--ink-soft)" fontSize="9" textAnchor="end">
            {(grooveFraction * 100).toFixed(0)}% groove left
          </text>
        </g>
      </svg>
    </div>
  );
}
