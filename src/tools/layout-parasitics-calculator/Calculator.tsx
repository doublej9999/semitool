'use client';

import { useId, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';
import { downloadCsv, downloadPdf, downloadXlsx } from '@/lib/export';
import { formatNumber as fmt } from '@/lib/format';
import {
  DIELECTRICS,
  METAL_LAYERS,
  POLY_LAYERS,
  estimateCapacitance,
  estimateIRDrop,
  estimateRcDelay,
  estimateResistance,
  getDielectric,
  type ConductorLayerSpec,
} from '@/lib/layout-parasitics';

interface FormState {
  [key: string]: string | number | boolean;
  materialId: string;
  dielectricId: string;
  lengthUm: number;
  widthUm: number;
  thicknessUm: number;
  spacingUm: number;
  ildThicknessUm: number;
  temperatureC: number;
  currentMa: number;
  vddVolt: number;
}

const INITIAL_STATE: FormState = {
  materialId: 'cu',
  dielectricId: 'sio2',
  lengthUm: 1000,
  widthUm: 0.18,
  thicknessUm: 0.3,
  spacingUm: 0.5,
  ildThicknessUm: 0.5,
  temperatureC: 25,
  currentMa: 1,
  vddVolt: 1.2,
};

function ConductorSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const renderGroup = (title: string, layers: readonly ConductorLayerSpec[]) => (
    <optgroup key={title} label={title}>
      {layers.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.label}
        </option>
      ))}
    </optgroup>
  );
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {renderGroup('Metals', METAL_LAYERS)}
      {renderGroup('Polysilicon', POLY_LAYERS)}
    </select>
  );
}

export default function LayoutParasiticsCalculator() {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const { copied, copy } = useCopyToClipboard();

  useUrlParamsState(state, setState);

  const materialId = useId();
  const dielectricId = useId();
  const lengthId = useId();
  const widthId = useId();
  const thicknessId = useId();
  const spacingId = useId();
  const ildThicknessId = useId();
  const temperatureId = useId();
  const currentId = useId();
  const vddId = useId();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const dielectric = getDielectric(state.dielectricId) ?? DIELECTRICS[0];

  const results = useMemo(() => {
    const resistance = estimateResistance({
      lengthUm: state.lengthUm,
      widthUm: state.widthUm,
      thicknessUm: state.thicknessUm,
      material: state.materialId,
      temperatureC: state.temperatureC,
    });
    const capacitance = estimateCapacitance({
      lengthUm: state.lengthUm,
      widthUm: state.widthUm,
      thicknessUm: state.ildThicknessUm,
      spacingUm: state.spacingUm,
      dielectricK: dielectric.k,
    });
    const irDrop = estimateIRDrop(resistance.resistanceOhm, state.currentMa, state.vddVolt);
    const rcDelay = estimateRcDelay(resistance.resistanceOhm, capacitance.capacitanceF);
    return { resistance, capacitance, irDrop, rcDelay };
  }, [state, dielectric.k]);

  const warnings = [...results.resistance.warnings, ...results.capacitance.warnings, ...results.irDrop.warnings];

  const dropPercent = results.irDrop.dropPercentOfVdd;
  const dropTone =
    dropPercent === null
      ? 'var(--ink)'
      : dropPercent > 10
        ? 'var(--red, #dc2626)'
        : dropPercent > 5
          ? 'var(--amber, #d97706)'
          : 'var(--teal)';

  const copySummary = () => {
    const r = results.resistance;
    const c = results.capacitance;
    const lines = [
      'IC Layout Parasitics Estimate:',
      `Line: L = ${state.lengthUm} um, W = ${state.widthUm} um, t = ${state.thicknessUm} um (${r.materialLabel})`,
      `ILD: ${dielectric.label}, k = ${dielectric.k}, height = ${c.dielectricThicknessUm} um, spacing s = ${c.spacingUm} um`,
      `T = ${r.temperatureC} C, rho_eff = ${r.effectiveResistivityUohmCm !== null ? `${fmt(r.effectiveResistivityUohmCm)} uOhm·cm` : 'N/A'}`,
      `Rs = ${fmt(r.sheetResistanceOhmSq)} Ohm/sq, squares = ${fmt(r.squares)}`,
      `R = ${fmt(r.resistanceOhm)} Ohm`,
      `C = ${fmt(c.capacitanceFf)} fF (plate ${fmt(c.plateCapacitanceF * 1e15)} fF + fringe ${fmt(c.fringeCapacitanceF * 1e15)} fF, ${fmt(c.fringeFraction * 100)}%)`,
      `IR drop @ ${state.currentMa} mA = ${fmt(results.irDrop.voltageDropMv)} mV${dropPercent !== null ? ` (${fmt(dropPercent)}% of VDD)` : ''}`,
      `RC delay: t_p50 = 0.69·RC = ${fmt(results.rcDelay.propDelay50Ps)} ps, t_r(10-90%) = 0.35·RC = ${fmt(results.rcDelay.riseTime10To90Ps)} ps`,
    ];
    void copy(lines.join('\n'));
  };

  const buildExportRows = () => {
    const r = results.resistance;
    const c = results.capacitance;
    return {
      headers: ['parameter', 'value', 'unit'],
      rows: [
        ['material', r.materialLabel, 'string'],
        ['dielectric', dielectric.label, 'string'],
        ['dielectric_k', dielectric.k, 'relative'],
        ['length', state.lengthUm, 'um'],
        ['width', state.widthUm, 'um'],
        ['metal_thickness', state.thicknessUm, 'um'],
        ['neighbour_spacing', c.spacingUm, 'um'],
        ['ild_height', c.dielectricThicknessUm, 'um'],
        ['temperature', r.temperatureC, 'C'],
        ['effective_resistivity', r.effectiveResistivityUohmCm !== null ? r.effectiveResistivityUohmCm.toFixed(4) : 'N/A', 'uohm_cm'],
        ['sheet_resistance', r.sheetResistanceOhmSq.toFixed(6), 'ohm_per_sq'],
        ['squares', r.squares.toFixed(4), 'L/W'],
        ['line_resistance', r.resistanceOhm.toFixed(6), 'ohm'],
        ['plate_capacitance', (c.plateCapacitanceF * 1e15).toFixed(6), 'fF'],
        ['fringe_capacitance', (c.fringeCapacitanceF * 1e15).toFixed(6), 'fF'],
        ['total_capacitance', c.capacitanceFf.toFixed(6), 'fF'],
        ['fringe_fraction', (c.fringeFraction * 100).toFixed(2), 'percent'],
        ['current', state.currentMa, 'mA'],
        ['ir_drop', results.irDrop.voltageDropMv.toFixed(4), 'mV'],
        ['ir_drop_of_vdd', dropPercent !== null ? dropPercent.toFixed(2) : 'N/A', 'percent'],
        ['rc_time_constant', (results.rcDelay.rcTimeConstantS * 1e12).toFixed(4), 'ps'],
        ['prop_delay_50pct_0.69RC', results.rcDelay.propDelay50Ps.toFixed(4), 'ps'],
        ['rise_time_10_90_0.35RC', results.rcDelay.riseTime10To90Ps.toFixed(4), 'ps'],
      ] as (string | number)[][],
    };
  };

  const exportCsvFile = () => {
    const { headers, rows } = buildExportRows();
    downloadCsv('layout-parasitics-estimate.csv', headers, rows);
  };

  const exportXlsxFile = async () => {
    const { headers, rows } = buildExportRows();
    await downloadXlsx('layout-parasitics-estimate.xlsx', 'Parasitics Estimate', headers, rows);
  };

  const exportPdfFile = async () => {
    const { headers, rows } = buildExportRows();
    await downloadPdf('layout-parasitics-estimate.pdf', 'IC Layout Parasitics Estimate', (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('IC Layout Parasitics Estimate', pageWidth / 2, y + 5, { align: 'center' });
      y += 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 7;

      const contentWidth = pageWidth - margin * 2;
      const colWidths = headers.map(() => contentWidth / headers.length);
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

      drawRow(headers, true);
      rows.forEach((row) => drawRow(row.map(String), false));
    });
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="lp-inputs">
        <h2 id="lp-inputs">Drawn geometry and stack</h2>

        <div className="field">
          <label htmlFor={materialId}>Conductor layer</label>
          <ConductorSelect id={materialId} value={state.materialId} onChange={(v) => update('materialId', v)} />
        </div>

        <div className="field">
          <label htmlFor={dielectricId}>ILD dielectric</label>
          <select id={dielectricId} value={state.dielectricId} onChange={(e) => update('dielectricId', e.target.value)}>
            {DIELECTRICS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} (k ≈ {d.k})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={lengthId}>Line length L (µm)</label>
          <input
            id={lengthId}
            type="number"
            step="any"
            min={0}
            value={state.lengthUm}
            onChange={(e) => update('lengthUm', Number.parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <label htmlFor={widthId}>Line width W (µm)</label>
          <input
            id={widthId}
            type="number"
            step="any"
            min={0}
            value={state.widthUm}
            onChange={(e) => update('widthUm', Number.parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <label htmlFor={thicknessId}>Metal thickness t (µm)</label>
          <input
            id={thicknessId}
            type="number"
            step="any"
            min={0}
            value={state.thicknessUm}
            onChange={(e) => update('thicknessUm', Number.parseFloat(e.target.value) || 0)}
          />
          <small>Poly entries are specified by Ω/□ — thickness only feeds the derived resistivity readout.</small>
        </div>

        <div className="field">
          <label htmlFor={spacingId}>Neighbour spacing s (µm)</label>
          <input
            id={spacingId}
            type="number"
            step="any"
            min={0}
            value={state.spacingUm}
            onChange={(e) => update('spacingUm', Number.parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <label htmlFor={ildThicknessId}>ILD height to plane (µm)</label>
          <input
            id={ildThicknessId}
            type="number"
            step="any"
            min={0}
            value={state.ildThicknessUm}
            onChange={(e) => update('ildThicknessUm', Number.parseFloat(e.target.value) || 0)}
          />
          <small>Dielectric height from the line bottom down to the reference plane (substrate or lower metal).</small>
        </div>

        <div className="field">
          <label htmlFor={temperatureId}>Temperature (°C)</label>
          <input
            id={temperatureId}
            type="number"
            step="any"
            min={-55}
            max={175}
            value={state.temperatureC}
            onChange={(e) => update('temperatureC', Number.parseFloat(e.target.value) || 0)}
          />
          <small>Linear TCR model, validated −55…175 °C (values outside are clamped).</small>
        </div>

        <div className="field">
          <label htmlFor={currentId}>Line current I (mA)</label>
          <input
            id={currentId}
            type="number"
            step="any"
            min={0}
            value={state.currentMa}
            onChange={(e) => update('currentMa', Number.parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <label htmlFor={vddId}>Supply voltage V<sub>DD</sub> (V)</label>
          <input
            id={vddId}
            type="number"
            step="any"
            min={0}
            value={state.vddVolt}
            onChange={(e) => update('vddVolt', Number.parseFloat(e.target.value) || 0)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={copySummary}>
            {copied ? 'Copied!' : 'Copy results'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCsvFile}>
            <Download size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Export CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportXlsxFile}>
            <Download size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Export XLSX
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportPdfFile}>
            <Download size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Export PDF
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="lp-results">
        <h2 id="lp-results">Estimated parasitics</h2>

        {warnings.length > 0 && (
          <div className="physics-alert">
            {warnings.map((w, idx) => (
              <div key={idx}>{w}</div>
            ))}
          </div>
        )}

        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Line resistance R = ρ·L/(W·t)</span>
            <span className="metric-value">{fmt(results.resistance.resistanceOhm)} Ω</span>
            <span className="metric-label">
              Rs = {fmt(results.resistance.sheetResistanceOhmSq)} Ω/□ · {fmt(results.resistance.squares)} squares
            </span>
          </div>

          <div className="metric-card highlight">
            <span className="metric-label">Line capacitance C (plate + fringe)</span>
            <span className="metric-value">{fmt(results.capacitance.capacitanceFf)} fF</span>
            <span className="metric-label">
              plate {fmt(results.capacitance.plateCapacitanceF * 1e15)} · fringe{' '}
              {fmt(results.capacitance.fringeCapacitanceF * 1e15)} fF ({fmt(results.capacitance.fringeFraction * 100)}%)
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">IR drop V = I·R</span>
            <span className="metric-value" style={{ color: dropTone }}>
              {fmt(results.irDrop.voltageDropMv)} mV
            </span>
            <span className="metric-label">
              {dropPercent !== null ? `${fmt(dropPercent)} % of V_DD = ${state.vddVolt} V` : 'V_DD not set'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">RC delay (single pole)</span>
            <span className="metric-value">{fmt(results.rcDelay.propDelay50Ps)} ps</span>
            <span className="metric-label">
              t_p,50% = 0.69·RC · t_r,10–90% = 0.35·RC = {fmt(results.rcDelay.riseTime10To90Ps)} ps
            </span>
          </div>
        </div>

        <div className="metric-grid" style={{ marginTop: '12px' }}>
          <div className="metric-card">
            <span className="metric-label">Effective resistivity ρ_eff(T)</span>
            <span className="metric-value">
              {results.resistance.effectiveResistivityUohmCm !== null
                ? `${fmt(results.resistance.effectiveResistivityUohmCm)} µΩ·cm`
                : 'N/A (Rs entry)'}
            </span>
            <span className="metric-label">T factor ×{results.resistance.temperatureFactor.toFixed(4)} at {results.resistance.temperatureC} °C</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">RC time constant R·C</span>
            <span className="metric-value">{fmt(results.rcDelay.rcTimeConstantS * 1e12)} ps</span>
            <span className="metric-label">R = {fmt(results.resistance.resistanceOhm)} Ω · C = {fmt(results.capacitance.capacitanceFf)} fF</span>
          </div>
        </div>

        {/* Cross-section schematic: metal line over the substrate reference plane */}
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              background: 'var(--panel-bg)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 560 250" style={{ width: '100%', maxWidth: '560px', height: 'auto', display: 'block' }} role="img" aria-label="Cross-section of a metal line over a substrate reference plane">
              {/* Si substrate (reference plane) */}
              <rect x="20" y="195" width="520" height="40" rx="3" fill="#3b4d61" />
              <text x="280" y="220" fill="#ffffff" fontSize="11.5" fontWeight="600" textAnchor="middle" opacity="0.9">
                Si substrate / reference plane (grounded)
              </text>

              {/* ILD dielectric */}
              <rect x="20" y="95" width="520" height="100" fill="#cbd5e1" />
              <text x="80" y="115" fill="#475569" fontSize="11.5" fontWeight="600">
                {dielectric.label}, k ≈ {dielectric.k}
              </text>

              {/* Neighbour metal line */}
              <rect x="360" y="125" width="70" height="30" fill="#94a3b8" stroke="#64748b" />
              <text x="395" y="118" fill="#475569" fontSize="10.5" textAnchor="middle">
                neighbour
              </text>

              {/* Main metal line */}
              <rect x="200" y="125" width="110" height="30" fill="#b45309" stroke="#7c2d12" />
              <text x="255" y="145" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                {results.resistance.materialKind === 'poly' ? 'poly' : 'metal'} W × t
              </text>

              {/* Metal thickness dimension */}
              <line x1="188" y1="125" x2="188" y2="155" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="183" y1="125" x2="193" y2="125" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="183" y1="155" x2="193" y2="155" stroke="#0f172a" strokeWidth="1.2" />
              <text x="180" y="144" fill="#0f172a" fontSize="10.5" textAnchor="end">
                t = {state.thicknessUm} µm
              </text>

              {/* Width dimension */}
              <line x1="200" y1="185" x2="310" y2="185" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="200" y1="180" x2="200" y2="190" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="310" y1="180" x2="310" y2="190" stroke="#0f172a" strokeWidth="1.2" />
              <text x="255" y="180" fill="#0f172a" fontSize="10.5" textAnchor="middle">
                W = {state.widthUm} µm
              </text>

              {/* Spacing dimension */}
              <line x1="310" y1="140" x2="360" y2="140" stroke="#7c2d12" strokeWidth="1.4" />
              <line x1="310" y1="135" x2="310" y2="145" stroke="#7c2d12" strokeWidth="1.4" />
              <line x1="360" y1="135" x2="360" y2="145" stroke="#7c2d12" strokeWidth="1.4" />
              <text x="335" y="132" fill="#7c2d12" fontSize="10.5" fontWeight="600" textAnchor="middle">
                s = {state.spacingUm} µm
              </text>

              {/* Plate path (ILD height) dimension */}
              <line x1="255" y1="155" x2="255" y2="195" stroke="#0d7c82" strokeWidth="1.4" strokeDasharray="4 3" />
              <line x1="250" y1="155" x2="260" y2="155" stroke="#0d7c82" strokeWidth="1.4" />
              <line x1="250" y1="195" x2="260" y2="195" stroke="#0d7c82" strokeWidth="1.4" />
              <text x="268" y="178" fill="#0d7c82" fontSize="10.5" fontWeight="600">
                t_ILD = {results.capacitance.dielectricThicknessUm} µm (plate path W·L/t)
              </text>

              {/* Length note */}
              <text x="280" y="248" fill="#475569" fontSize="10.5" textAnchor="middle">
                L = {state.lengthUm} µm into the page · schematic not to scale
              </text>
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
