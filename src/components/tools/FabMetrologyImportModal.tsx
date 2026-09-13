'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle,
  ExternalLink,
  Download,
  Filter,
  Layers,
  BarChart2,
} from 'lucide-react';
import {
  parseMetrologyCsv,
  formatSubgroupsForSpc,
  buildSpcCalculatorUrl,
  buildCapabilityCalculatorUrl,
  generateFabSampleCsv,
  type MetrologyDataset,
} from '@/lib/metrology-batch';
import { setLastMetrology } from '@/lib/fab-session';
import { downloadCsv } from '@/lib/export';
import ModalShell from '@/components/common/ModalShell';

type OutlierMethod = 'tukey' | 'three_sigma' | 'none';

interface FabMetrologyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySubgroups?: (subgroupsText: string) => void;
  onApplyStats?: (mean: number, sigma: number, lsl?: number, usl?: number, unit?: string) => void;
  defaultUnit?: string;
}

export default function FabMetrologyImportModal({
  isOpen,
  onClose,
  onApplySubgroups,
  onApplyStats,
  defaultUnit = 'nm',
}: FabMetrologyImportModalProps) {
  const [inputText, setInputText] = useState('');
  const [subgroupSize, setSubgroupSize] = useState<number>(5);
  const [outlierMethod, setOutlierMethod] = useState<OutlierMethod>('tukey');
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse dataset dynamically
  const dataset: MetrologyDataset = useMemo(() => {
    return parseMetrologyCsv(inputText, {
      subgroupSize,
      outlierMethod,
      unit: defaultUnit,
    });
  }, [inputText, subgroupSize, outlierMethod, defaultUnit]);

  if (!isOpen) return null;

  const stats = dataset.statistics;
  const effectiveMean = excludeOutliers ? stats.cleanMean : stats.mean;
  const effectiveStdDev = excludeOutliers ? stats.cleanStdDev : stats.stdDev;
  const hasData = stats.count > 0;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const loadPreset = (preset: 'gate_cd' | 'oxide_thickness' | 'cmp_erosion' | 'sheet_resistance') => {
    const sample = generateFabSampleCsv(preset);
    setInputText(sample);
  };

  const recordMetrologyToSession = (): void => {
    if (!hasData) return;
    setLastMetrology({
      source: `Fab Metrology Import (${typeof window !== 'undefined' ? window.location.pathname : ''})`,
      subgroupCount: dataset.subgroups.length,
      totalPoints: stats.count,
      mean: Number(effectiveMean.toFixed(4)),
      stdDev: Number(effectiveStdDev.toFixed(4)),
      outlierMethod,
      target: dataset.limits.target,
      lsl: dataset.limits.lsl,
      usl: dataset.limits.usl,
      timestampIso: new Date().toISOString(),
    });
  };

  const handleApply = () => {
    recordMetrologyToSession();
    if (onApplySubgroups && dataset.subgroups.length > 0) {
      onApplySubgroups(formatSubgroupsForSpc(dataset.subgroups));
    }
    if (onApplyStats && hasData) {
      onApplyStats(
        effectiveMean,
        effectiveStdDev,
        dataset.limits.lsl,
        dataset.limits.usl,
        dataset.limits.unit || defaultUnit,
      );
    }
    onClose();
  };

  const handleExportCsv = () => {
    if (!hasData) return;
    const headers = ['WaferId', 'Site', 'Value', 'IsOutlier'];
    const rows = dataset.rows.map((r) => [
      r.waferId || 'W01',
      String(r.site ?? '1'),
      r.value.toFixed(4),
      r.isOutlier ? 'YES' : 'NO',
    ]);
    downloadCsv(`fab-metrology-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const spcUrl = hasData ? buildSpcCalculatorUrl(dataset) : '#';
  const capabilityUrl = hasData ? buildCapabilityCalculatorUrl(dataset, excludeOutliers) : '#';

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      labelledById="fab-metrology-import-modal-title"
      className="w-full max-w-[860px] max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-[var(--paper,#fdfbf7)] border border-[var(--line-strong,#dcd5c9)] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
    >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--line, #e2dcd2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--card, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--teal, #0d7c82)' }} />
            <div>
              <h2
                id="fab-metrology-import-modal-title"
                style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink, #1f2937)', margin: 0 }}
              >
                Fab Metrology Batch CSV Import & SPC Linkage
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted, #64748b)', margin: 0 }}>
                Automated multi-wafer lot parsing, outlier screening &amp; direct bridge to SPC &amp; Monte Carlo
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted, #64748b)',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Presets & Drop zone */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)' }}>Fab Presets:</span>
              <button
                type="button"
                className="button outline sm"
                onClick={() => loadPreset('gate_cd')}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Gate CD-SEM (20 wfr × 5)
              </button>
              <button
                type="button"
                className="button outline sm"
                onClick={() => loadPreset('oxide_thickness')}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Furnace Oxide (25 wfr × 5)
              </button>
              <button
                type="button"
                className="button outline sm"
                onClick={() => loadPreset('cmp_erosion')}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Cu CMP Erosion (16 wfr × 3)
              </button>
              <button
                type="button"
                className="button outline sm"
                onClick={() => loadPreset('sheet_resistance')}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Implant Rs (18 wfr × 5)
              </button>
            </div>

            <button
              type="button"
              className="button sm outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
            >
              <Upload size={13} />
              <span>Browse CSV / TSV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.dat"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </div>

          {/* Drag & Drop / Input area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--teal, #0d7c82)' : 'var(--line-strong, #dcd5c9)'}`,
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: dragOver ? 'var(--teal-soft, #e6f4f4)' : 'var(--card, #ffffff)',
              transition: 'all 0.15s ease',
            }}
          >
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw metrology tabular text or drop CSV here...&#10;Supports: Subgroup matrices (Wafer, Site1, Site2...), Long tables (Wafer, Site, Value), or single-column datalogs.&#10;Tip: Header comments like # Target=28, LSL=26.5, USL=29.5, Unit=nm are automatically recognized."
              spellCheck={false}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                color: 'var(--ink, #1f2937)',
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* Options row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              backgroundColor: 'var(--paper, #fdfbf7)',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--line, #e2dcd2)',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} style={{ color: 'var(--teal)' }} />
              <label htmlFor="outlier-select" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                Outlier Screening:
              </label>
              <select
                id="outlier-select"
                value={outlierMethod}
                onChange={(e) => setOutlierMethod(e.target.value as OutlierMethod)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--line)',
                  fontSize: '11px',
                  backgroundColor: 'var(--card)',
                }}
              >
                <option value="tukey">Tukey Boxplot (1.5 × IQR)</option>
                <option value="three_sigma">3-Sigma Shewhart Fence</option>
                <option value="none">None (Keep All Data)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={excludeOutliers}
                onChange={(e) => setExcludeOutliers(e.target.checked)}
                disabled={outlierMethod === 'none' || stats.outliers.length === 0}
              />
              <span style={{ color: 'var(--ink)' }}>Exclude detected outliers from summary</span>
            </label>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label htmlFor="sg-size" style={{ color: 'var(--muted)' }}>
                Subgroup Size (n):
              </label>
              <select
                id="sg-size"
                value={subgroupSize}
                onChange={(e) => setSubgroupSize(Number(e.target.value))}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--line)',
                  fontSize: '11px',
                  backgroundColor: 'var(--card)',
                }}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistical Results & Summary */}
          {hasData ? (
            <div
              style={{
                backgroundColor: 'var(--card, #ffffff)',
                border: '1px solid var(--line, #e2dcd2)',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--teal-soft)',
                      color: 'var(--teal-dark, #06595e)',
                      fontWeight: 600,
                    }}
                  >
                    Format: {dataset.format.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--ink)' }}>
                    Total Readings: <strong>{stats.count}</strong> across{' '}
                    <strong>{dataset.subgroups.length}</strong> subgroups (n = {dataset.subgroupSize})
                  </span>
                </div>

                {stats.outliers.length > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--amber, #b45309)',
                      backgroundColor: 'var(--amber-soft, #fffbeb)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      border: '1px solid #fde68a',
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>
                      {stats.outliers.length} Outlier(s) Flagged [{stats.outliers.map((o) => o.toFixed(2)).join(', ')}]
                    </span>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                <div style={{ padding: '8px', background: 'var(--paper)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Process Mean (μ)
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                    {effectiveMean.toFixed(3)} {dataset.limits.unit}
                  </div>
                  {excludeOutliers && stats.outliers.length > 0 && (
                    <div style={{ fontSize: '9.5px', color: 'var(--muted)' }}>Raw: {stats.mean.toFixed(3)}</div>
                  )}
                </div>

                <div style={{ padding: '8px', background: 'var(--paper)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Sample Sigma (1s)
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                    {effectiveStdDev.toFixed(3)} {dataset.limits.unit}
                  </div>
                  {excludeOutliers && stats.outliers.length > 0 && (
                    <div style={{ fontSize: '9.5px', color: 'var(--muted)' }}>Raw: {stats.stdDev.toFixed(3)}</div>
                  )}
                </div>

                <div style={{ padding: '8px', background: 'var(--paper)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Median & IQR</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                    {stats.median.toFixed(3)}
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)' }}>IQR: {stats.iqr.toFixed(3)}</div>
                </div>

                <div style={{ padding: '8px', background: 'var(--paper)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Min / Max / Range</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                    {stats.min.toFixed(2)} .. {stats.max.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--muted)' }}>Range: {stats.range.toFixed(2)}</div>
                </div>

                <div style={{ padding: '8px', background: 'var(--paper)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Spec Limits</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                    {dataset.limits.lsl !== undefined && dataset.limits.usl !== undefined
                      ? `[${dataset.limits.lsl}, ${dataset.limits.usl}]`
                      : 'None detected'}
                  </div>
                  {dataset.limits.target !== undefined && (
                    <div style={{ fontSize: '9.5px', color: 'var(--teal-dark)' }}>Target: {dataset.limits.target}</div>
                  )}
                </div>
              </div>

              {/* Direct tool linkage banners */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  alignItems: 'center',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <a
                  href={spcUrl}
                  onClick={recordMetrologyToSession}
                  target="_blank"
                  rel="noreferrer"
                  className="button outline sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                  }}
                >
                  <BarChart2 size={13} />
                  <span>Open in SPC Control Chart</span>
                  <ExternalLink size={11} />
                </a>

                <a
                  href={capabilityUrl}
                  onClick={recordMetrologyToSession}
                  target="_blank"
                  rel="noreferrer"
                  className="button outline sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                  }}
                >
                  <Layers size={13} />
                  <span>Run Monte Carlo Capability</span>
                  <ExternalLink size={11} />
                </a>

                <button
                  type="button"
                  className="button outline sm"
                  onClick={handleExportCsv}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    marginLeft: 'auto',
                  }}
                >
                  <Download size={13} />
                  <span>Export Cleaned CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--muted)',
                fontSize: '13px',
                backgroundColor: 'var(--card)',
                borderRadius: '8px',
                border: '1px dashed var(--line)',
              }}
            >
              No metrology data parsed yet. Select a preset above or paste raw wafer data into the box.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--line, #e2dcd2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--card, #ffffff)',
          }}
        >
          <button type="button" className="button outline sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button primary sm"
            onClick={handleApply}
            disabled={!hasData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Check size={14} />
            <span>Apply to Active Calculator</span>
          </button>
        </div>
    </ModalShell>
  );
}
