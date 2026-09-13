'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  calculateFourPointProbe,
  getSiliconMobility,
} from '@/lib/four-point-probe';
import { useUrlParamsState } from '@/lib/use-url-state';
import { downloadCsv, downloadPdf, downloadSvg, downloadXlsx } from '@/lib/export';
import { useGlossary } from '@/lib/i18n/glossary';

interface FormState {
  [key: string]: string | number | boolean;
  voltageMv: string;
  currentMa: string;
  probeSpacingMm: string;
  waferThicknessUm: string;
  waferDiameterMm: string;
  dopantType: 'p-type' | 'n-type';
}

const INITIAL_STATE: FormState = {
  voltageMv: '12.5',
  currentMa: '1.0',
  probeSpacingMm: '1.0',
  waferThicknessUm: '725',
  waferDiameterMm: '200',
  dopantType: 'p-type',
};

export default function FourPointProbeCalculator() {
  const g = useGlossary();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useUrlParamsState(form, setForm);

  const voltageId = useId();
  const currentId = useId();
  const spacingId = useId();
  const thicknessId = useId();
  const diameterId = useId();
  const dopantId = useId();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const vMv = Number.parseFloat(form.voltageMv) || 0;
  const iMa = Number.parseFloat(form.currentMa) || 0;
  const sMm = Number.parseFloat(form.probeSpacingMm) || 1.0;
  const tUm = Number.parseFloat(form.waferThicknessUm) || 0;
  const dMm = Number.parseFloat(form.waferDiameterMm) || 200;

  const result = useMemo(() => {
    return calculateFourPointProbe({
      voltageMv: vMv,
      currentMa: iMa,
      probeSpacingMm: sMm,
      waferThicknessUm: tUm > 0 ? tUm : undefined,
      waferDiameterMm: dMm,
      dopantType: form.dopantType,
    });
  }, [vMv, iMa, sMm, tUm, dMm, form.dopantType]);

  const mobility = useMemo(() => {
    if (!result.estimatedDopingCm3) return null;
    return getSiliconMobility(form.dopantType, result.estimatedDopingCm3);
  }, [result.estimatedDopingCm3, form.dopantType]);

  const copySummary = async () => {
    const lines = [
      'Four-Point Probe (ASTM F84 / SEMI MF84) Results:',
      `V = ${vMv} mV, I = ${iMa} mA, s = ${sMm} mm`,
      `Measured R: ${result.resistanceOhm.toFixed(4)} Ω`,
      `Sheet Resistance Rs: ${result.sheetResistanceOhmSq.toFixed(4)} Ω/□`,
      result.resistivityOhmCm !== null
        ? `Resistivity ρ: ${result.resistivityOhmCm.toExponential(4)} Ω·cm`
        : '',
      result.estimatedDopingCm3 !== null
        ? `Estimated Dopant N: ${result.estimatedDopingCm3.toExponential(3)} cm⁻³ (${form.dopantType})`
        : '',
      `Thickness Correction F(t/s): ${result.thicknessCorrectionFactor.toFixed(4)}`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const buildExportRows = () => {
    const headers = [
      'parameter',
      'value',
      'unit',
    ];
    const rows = [
      ['voltage', vMv, 'mV'],
      ['current', iMa, 'mA'],
      ['probe_spacing', sMm, 'mm'],
      ['wafer_thickness', tUm, 'um'],
      ['wafer_diameter', dMm, 'mm'],
      ['resistance', result.resistanceOhm.toFixed(6), 'ohm'],
      ['sheet_resistance', result.sheetResistanceOhmSq.toFixed(6), 'ohm_per_sq'],
      ['resistivity', result.resistivityOhmCm !== null ? result.resistivityOhmCm.toExponential(6) : 'N/A', 'ohm_cm'],
      ['dopant_density', result.estimatedDopingCm3 !== null ? result.estimatedDopingCm3.toExponential(4) : 'N/A', 'cm^-3'],
      ['dopant_type', form.dopantType, 'string'],
      ['thickness_correction_factor', result.thicknessCorrectionFactor.toFixed(6), 'ratio'],
      ['diameter_correction_factor', result.diameterCorrectionFactor.toFixed(6), 'ratio'],
    ];
    return { headers, rows };
  };

  const exportCsvFile = () => {
    const { headers, rows } = buildExportRows();
    downloadCsv('four-point-probe-astm-f84.csv', headers, rows);
  };

  const exportXlsxFile = async () => {
    const { headers, rows } = buildExportRows();
    await downloadXlsx('four-point-probe-astm-f84.xlsx', 'ASTM F84 Results', headers, rows);
  };

  const exportPdfFile = async () => {
    const { headers, rows } = buildExportRows();
    await downloadPdf('four-point-probe-astm-f84.pdf', 'Four-Point Probe (ASTM F84) Report', (doc) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Four-Point Probe (ASTM F84) Report', pageWidth / 2, y + 5, { align: 'center' });
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
      <section className="panel" aria-labelledby="fpp-inputs">
        <h2 id="fpp-inputs">Probe and wafer parameters</h2>

        <div className="field">
          <label htmlFor={voltageId}>Measured voltage V (mV)</label>
          <input
            id={voltageId}
            type="number"
            step="any"
            value={form.voltageMv}
            onChange={(e) => update('voltageMv', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor={currentId}>Applied current I (mA)</label>
          <input
            id={currentId}
            type="number"
            step="any"
            value={form.currentMa}
            onChange={(e) => update('currentMa', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor={spacingId}>Probe pin spacing s (mm)</label>
          <select
            id={spacingId}
            value={form.probeSpacingMm}
            onChange={(e) => update('probeSpacingMm', e.target.value)}
          >
            <option value="1.0">1.000 mm (Standard Metric Collinear)</option>
            <option value="1.5875">1.5875 mm (62.5 mil / Standard Imperial)</option>
            <option value="0.635">0.635 mm (25.0 mil Micro-probe)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={thicknessId}>Wafer thickness t (μm, optional)</label>
          <input
            id={thicknessId}
            type="number"
            step="any"
            placeholder="e.g. 725 for 200mm, 775 for 300mm"
            value={form.waferThicknessUm}
            onChange={(e) => update('waferThicknessUm', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor={diameterId}>Wafer diameter D (mm)</label>
          <select
            id={diameterId}
            value={form.waferDiameterMm}
            onChange={(e) => update('waferDiameterMm', e.target.value)}
          >
            <option value="100">100 mm (4-inch)</option>
            <option value="150">150 mm (6-inch)</option>
            <option value="200">200 mm (8-inch)</option>
            <option value="300">300 mm (12-inch)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={dopantId}>Silicon dopant species</label>
          <select
            id={dopantId}
            value={form.dopantType}
            onChange={(e) => update('dopantType', e.target.value as 'p-type' | 'n-type')}
          >
            <option value="p-type">p-type (Boron B-doped)</option>
            <option value="n-type">n-type (Phosphorus / Arsenic P/As-doped)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={copySummary}>
            {copied ? 'Copied!' : 'Copy results'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCsvFile}>
            Export CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportXlsxFile}>
            Export XLSX
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportPdfFile}>
            Export PDF
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="fpp-results">
        <h2 id="fpp-results">ASTM F84 / SEMI MF84 results</h2>

        {/* Physics Boundary Advisories */}
        {iMa > 10 && (
          <div className="physics-alert danger">
            <strong>Joule heating warning:</strong> Current &gt; 10 mA may cause local thermal dissipation
            under tungsten carbide probe tips, skewing intrinsic carrier density and resistivity reading.
          </div>
        )}

        {vMv > 0 && vMv < 0.2 && (
          <div className="physics-alert">
            <strong>Thermal EMF noise advisory:</strong> Voltage &lt; 0.2 mV approaches probe Seebeck / thermal
            electromotive offset. Consider reversing current polarity to cancel out offset voltages.
          </div>
        )}

        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Measured resistance (R = V/I)</span>
            <span className="metric-value">{result.resistanceOhm.toFixed(4)} Ω</span>
          </div>

          <div className="metric-card highlight">
            <span className="metric-label">{g('sheetResistance')} (Rs)</span>
            <span className="metric-value">{result.sheetResistanceOhmSq.toFixed(3)} Ω/□</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Bulk resistivity (ρ)</span>
            <span className="metric-value">
              {result.resistivityOhmCm !== null
                ? `${result.resistivityOhmCm.toExponential(4)} Ω·cm`
                : 'Enter thickness'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Inverted dopant density (N)</span>
            <span className="metric-value">
              {result.estimatedDopingCm3 !== null
                ? `${result.estimatedDopingCm3.toExponential(3)} cm⁻³`
                : 'N/A'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Thickness factor F(t/s)</span>
            <span className="metric-value">{result.thicknessCorrectionFactor.toFixed(4)}</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Est. carrier mobility (μ)</span>
            <span className="metric-value">
              {mobility !== null ? `${mobility.toFixed(1)} cm²/(V·s)` : 'N/A'}
            </span>
          </div>
        </div>

        {/* 4PP Probe Collinear Configuration SVG Diagram */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
              Collinear 4-Point Probe Physical Cross-Section
            </h3>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '3px 8px' }}
              onClick={() => {
                if (svgRef.current) {
                  downloadSvg(svgRef.current, 'four-point-probe-schematic.svg');
                }
              }}
            >
              Save SVG
            </button>
          </div>

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
            <svg
              ref={svgRef}
              viewBox="0 0 540 220"
              style={{ width: '100%', maxWidth: '540px', height: 'auto', display: 'block' }}
            >
              {/* Wafer Substrate */}
              <rect x="40" y="110" width="460" height="80" rx="4" fill="#3b4d61" />
              <text x="270" y="155" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle" opacity="0.9">
                Semiconductor Wafer ({form.dopantType}, t = {tUm > 0 ? `${tUm} μm` : 'Bulk'})
              </text>

              {/* Current Streamlines */}
              <path
                d="M 120 110 Q 270 195 420 110"
                fill="none"
                stroke="#dfa243"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <text x="270" y="195" fill="#dfa243" fontSize="10.5" fontWeight="600" textAnchor="middle">
                Current Flux I ({iMa} mA)
              </text>

              {/* Equipotential Lines between Pin 2 & 3 */}
              <path
                d="M 220 110 Q 270 145 320 110"
                fill="none"
                stroke="#4a90e2"
                strokeWidth="1.5"
              />
              <text x="270" y="132" fill="#4a90e2" fontSize="10" fontWeight="600" textAnchor="middle">
                ΔV ({vMv} mV)
              </text>

              {/* Four Probe Tips */}
              {/* Probe 1 (I+) */}
              <polygon points="115,40 125,40 121,110 119,110" fill="#99a8b8" stroke="#1d2630" strokeWidth="1" />
              <circle cx="120" cy="35" r="7" fill="#dfa243" />
              <text x="120" y="38.5" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">I+</text>

              {/* Probe 2 (V+) */}
              <polygon points="215,40 225,40 221,110 219,110" fill="#99a8b8" stroke="#1d2630" strokeWidth="1" />
              <circle cx="220" cy="35" r="7" fill="#4a90e2" />
              <text x="220" y="38.5" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">V+</text>

              {/* Probe 3 (V-) */}
              <polygon points="315,40 325,40 321,110 319,110" fill="#99a8b8" stroke="#1d2630" strokeWidth="1" />
              <circle cx="320" cy="35" r="7" fill="#4a90e2" />
              <text x="320" y="38.5" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">V-</text>

              {/* Probe 4 (I-) */}
              <polygon points="415,40 425,40 421,110 419,110" fill="#99a8b8" stroke="#1d2630" strokeWidth="1" />
              <circle cx="420" cy="35" r="7" fill="#dfa243" />
              <text x="420" y="38.5" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">I-</text>

              {/* Probe Spacing Dimension Lines */}
              <line x1="120" y1="95" x2="220" y2="95" stroke="#ffffff" strokeWidth="1" />
              <text x="170" y="90" fill="#ffffff" fontSize="10" textAnchor="middle">s = {sMm} mm</text>

              <line x1="220" y1="95" x2="320" y2="95" stroke="#ffffff" strokeWidth="1" />
              <text x="270" y="90" fill="#ffffff" fontSize="10" textAnchor="middle">s</text>

              <line x1="320" y1="95" x2="420" y2="95" stroke="#ffffff" strokeWidth="1" />
              <text x="370" y="90" fill="#ffffff" fontSize="10" textAnchor="middle">s</text>
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
