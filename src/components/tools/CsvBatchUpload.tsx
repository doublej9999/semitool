'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Check } from 'lucide-react';
import { parseDelimitedText, buildCsv } from '@/lib/batch-processing';

interface CsvBatchUploadProps {
  onDataLoaded: (values: number[], filename?: string) => void;
  currentSummary?: {
    mean: number;
    min: number;
    max: number;
    range: number;
    sigma: number | null;
    halfRangePercent: number | null;
  } | null;
  unit?: string;
}

export default function CsvBatchUpload({ onDataLoaded, currentSummary, unit = 'nm' }: CsvBatchUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastLoadedCount, setLastLoadedCount] = useState<number | null>(null);

  const processText = (text: string, filename?: string) => {
    const rawRows = parseDelimitedText(text);
    const numbers: number[] = [];

    for (const row of rawRows) {
      for (const cell of row) {
        const cleaned = cell.trim().replace(/^[^0-9.-]+/, '');
        const val = Number(cleaned);
        if (Number.isFinite(val) && cleaned.length > 0) {
          numbers.push(val);
        }
      }
    }

    if (numbers.length > 0) {
      onDataLoaded(numbers, filename);
      setLastLoadedCount(numbers.length);
      setTimeout(() => setLastLoadedCount(null), 3000);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        processText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const exportSummaryCsv = () => {
    if (!currentSummary) return;
    const headers = ['Metric', `Value (${unit})`];
    const rows = [
      ['Mean', currentSummary.mean.toFixed(3)],
      ['Minimum', currentSummary.min.toFixed(3)],
      ['Maximum', currentSummary.max.toFixed(3)],
      ['Range', currentSummary.range.toFixed(3)],
      ['Sample Sigma (1σ)', currentSummary.sigma !== null ? currentSummary.sigma.toFixed(3) : 'N/A'],
      ['Uniformity (± Half Range %)', currentSummary.halfRangePercent !== null ? currentSummary.halfRangePercent.toFixed(2) + '%' : 'N/A'],
    ];

    const csvText = buildCsv(headers, rows);
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uniformity-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: '14px', marginBottom: '16px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--teal)' : 'var(--line-strong)'}`,
          borderRadius: '8px',
          padding: '12px 14px',
          background: dragOver ? 'var(--teal-soft)' : 'var(--paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} color="var(--teal)" />
          <span style={{ fontSize: '13px', color: 'var(--ink)' }}>
            {lastLoadedCount !== null ? (
              <span style={{ color: 'var(--teal-dark)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Loaded {lastLoadedCount} readings from CSV!
              </span>
            ) : (
              'Drop raw metrology CSV/TSV file or import from machine'
            )}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="button secondary"
            style={{ fontSize: '12px', padding: '4px 9px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={13} aria-hidden="true" />
            <span>Upload CSV</span>
          </button>

          {currentSummary && (
            <button
              type="button"
              className="button secondary"
              style={{ fontSize: '12px', padding: '4px 9px' }}
              onClick={exportSummaryCsv}
              title="Export summary results as RFC 4180 CSV report"
            >
              <Download size={13} aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
