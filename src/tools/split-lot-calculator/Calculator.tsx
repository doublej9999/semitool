'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  analyzeSplitLot,
  type RecipeParameter,
  type SplitRecipe,
} from '@/lib/split-lot';
import { downloadCsv, downloadSvg } from '@/lib/export';
import { AlertTriangle, Plus, Trash2, Download, Copy, Check } from 'lucide-react';

const DEFAULT_PARAMS: RecipeParameter[] = [
  { name: 'RF Source Power', unit: 'W', baseline: 650 },
  { name: 'Bias Power', unit: 'W', baseline: 150 },
  { name: 'Chamber Pressure', unit: 'mTorr', baseline: 15 },
  { name: 'Cl2 Process Gas', unit: 'sccm', baseline: 90 },
  { name: 'BCl3 Process Gas', unit: 'sccm', baseline: 30 },
  { name: 'Process Time', unit: 's', baseline: 45 },
];

const DEFAULT_SPLITS: SplitRecipe[] = [
  {
    id: 'split-a',
    name: 'Split A (High Source Power)',
    wafers: 'W#01 - W#06',
    parameters: {
      'RF Source Power': 750,
      'Bias Power': 150,
      'Chamber Pressure': 15,
      'Cl2 Process Gas': 90,
      'BCl3 Process Gas': 30,
      'Process Time': 45,
    },
    targetResponse: 540,
  },
  {
    id: 'split-b',
    name: 'Split B (High Bias / Low Pressure)',
    wafers: 'W#07 - W#12',
    parameters: {
      'RF Source Power': 650,
      'Bias Power': 220,
      'Chamber Pressure': 10,
      'Cl2 Process Gas': 90,
      'BCl3 Process Gas': 30,
      'Process Time': 45,
    },
    targetResponse: 610,
  },
  {
    id: 'split-c',
    name: 'Split C (Higher Cl2 Chemistry)',
    wafers: 'W#13 - W#18',
    parameters: {
      'RF Source Power': 650,
      'Bias Power': 150,
      'Chamber Pressure': 15,
      'Cl2 Process Gas': 120,
      'BCl3 Process Gas': 30,
      'Process Time': 40,
    },
    targetResponse: 585,
  },
];

export default function SplitLotCalculator() {
  const [params, setParams] = useState<RecipeParameter[]>(DEFAULT_PARAMS);
  const [splits, setSplits] = useState<SplitRecipe[]>(DEFAULT_SPLITS);
  const [baselineResponse, setBaselineResponse] = useState<number>(480);
  const [responseLabel, setResponseLabel] = useState<string>('Etch Rate');
  const [responseUnit, setResponseUnit] = useState<string>('nm/min');
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const baselineRespId = useId();
  const respLabelId = useId();
  const respUnitId = useId();

  const analysis = useMemo(() => {
    return analyzeSplitLot(params, splits, baselineResponse, responseUnit);
  }, [params, splits, baselineResponse, responseUnit]);

  const updateParamBaseline = (index: number, val: number) => {
    setParams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], baseline: val };
      return next;
    });
  };

  const updateSplitParam = (splitId: string, paramName: string, val: number) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        return {
          ...s,
          parameters: {
            ...s.parameters,
            [paramName]: val,
          },
        };
      }),
    );
  };

  const updateSplitMeta = (
    splitId: string,
    field: 'name' | 'wafers' | 'targetResponse',
    value: string | number,
  ) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        return { ...s, [field]: value };
      }),
    );
  };

  const addSplit = () => {
    const newId = `split-${Date.now()}`;
    const initialParams: Record<string, number> = {};
    for (const p of params) {
      initialParams[p.name] = p.baseline;
    }
    setSplits((prev) => [
      ...prev,
      {
        id: newId,
        name: `Split ${String.fromCharCode(65 + prev.length)}`,
        wafers: `W#${String(prev.length * 6 + 1).padStart(2, '0')}-W#${String(prev.length * 6 + 6).padStart(2, '0')}`,
        parameters: initialParams,
        targetResponse: baselineResponse,
      },
    ]);
  };

  const removeSplit = (splitId: string) => {
    if (splits.length <= 1) return;
    setSplits((prev) => prev.filter((s) => s.id !== splitId));
  };

  const exportSplitCsv = () => {
    const headers = [
      'Parameter Name',
      'Unit',
      'Baseline (POR)',
      ...splits.map((s) => `${s.name} (${s.wafers})`),
    ];

    const rows: (string | number)[][] = params.map((p) => {
      return [
        p.name,
        p.unit,
        p.baseline,
        ...splits.map((s) => s.parameters[p.name] ?? p.baseline),
      ];
    });

    // Add target response row
    rows.push([
      `Target Response: ${responseLabel}`,
      responseUnit,
      baselineResponse,
      ...splits.map((s) => s.targetResponse ?? 'N/A'),
    ]);

    downloadCsv('split_lot_recipe_overlay.csv', headers, rows);
  };

  const copySummary = async () => {
    let summaryText = `--- Split-Lot DOE Comparison Matrix ---\n`;
    summaryText += `Baseline Response (${responseLabel}): ${baselineResponse} ${responseUnit}\n\n`;
    for (const s of splits) {
      summaryText += `[${s.name} | ${s.wafers}]\n`;
      for (const p of params) {
        const val = s.parameters[p.name] ?? p.baseline;
        const delta = val - p.baseline;
        const pct = p.baseline !== 0 ? (delta / p.baseline) * 100 : 0;
        summaryText += `  • ${p.name}: ${val} ${p.unit} (Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} ${p.unit}, ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)\n`;
      }
      if (s.targetResponse !== undefined) {
        const dResp = s.targetResponse - baselineResponse;
        const pResp = baselineResponse !== 0 ? (dResp / baselineResponse) * 100 : 0;
        summaryText += `  => Response: ${s.targetResponse} ${responseUnit} (Delta: ${dResp > 0 ? '+' : ''}${dResp.toFixed(1)} ${responseUnit}, ${pResp > 0 ? '+' : ''}${pResp.toFixed(1)}%)\n`;
      }
      summaryText += '\n';
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <div className="calc-form">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Target Response Definition</h3>
            <button
              type="button"
              className="button secondary sm"
              onClick={addSplit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Add Recipe Split
            </button>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor={respLabelId}>Response Name</label>
              <input
                id={respLabelId}
                type="text"
                value={responseLabel}
                onChange={(e) => setResponseLabel(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={respUnitId}>Response Unit</label>
              <input
                id={respUnitId}
                type="text"
                value={responseUnit}
                onChange={(e) => setResponseUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor={baselineRespId}>Baseline (POR) Response ({responseUnit})</label>
            <input
              id={baselineRespId}
              type="number"
              value={baselineResponse}
              onChange={(e) => setBaselineResponse(Number.parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Recipe Parameters & Split Matrix */}
        <div className="panel">
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>DOE Recipe Overlay Matrix</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Parameter</th>
                  <th style={{ padding: '6px 8px' }}>Unit</th>
                  <th style={{ padding: '6px 8px', background: 'rgba(13, 124, 130, 0.08)' }}>POR Baseline</th>
                  {splits.map((s) => (
                    <th key={s.id} style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{s.name}</span>
                        {splits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSplit(s.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0 }}
                            title="Remove split"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 'normal' }}>
                        {s.wafers}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p, idx) => (
                  <tr key={p.name} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{p.unit}</td>
                    <td style={{ padding: '6px 8px', background: 'rgba(13, 124, 130, 0.05)' }}>
                      <input
                        type="number"
                        style={{ width: '80px', padding: '3px 6px', fontSize: 12 }}
                        value={p.baseline}
                        onChange={(e) => updateParamBaseline(idx, Number.parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {splits.map((s) => {
                      const val = s.parameters[p.name] ?? p.baseline;
                      const delta = val - p.baseline;
                      const pct = p.baseline !== 0 ? (delta / p.baseline) * 100 : 0;
                      const isHighVar = Math.abs(pct) > 20;

                      return (
                        <td key={s.id} style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            style={{
                              width: '80px',
                              padding: '3px 6px',
                              fontSize: 12,
                              borderColor: isHighVar ? 'var(--gold)' : undefined,
                            }}
                            value={val}
                            onChange={(e) => updateSplitParam(s.id, p.name, Number.parseFloat(e.target.value) || 0)}
                          />
                          {delta !== 0 && (
                            <div
                              style={{
                                fontSize: 10,
                                color: isHighVar ? 'var(--gold)' : 'var(--muted)',
                                marginTop: 2,
                              }}
                            >
                              {delta > 0 ? '+' : ''}{delta} ({pct > 0 ? '+' : ''}{pct.toFixed(0)}%)
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Target Response Row */}
                <tr style={{ borderTop: '2px solid var(--border)', background: 'rgba(21, 33, 39, 0.03)' }}>
                  <td style={{ padding: '8px 8px', fontWeight: 600 }}>{responseLabel}</td>
                  <td style={{ padding: '8px 8px', color: 'var(--muted)' }}>{responseUnit}</td>
                  <td style={{ padding: '8px 8px', fontWeight: 600 }}>{baselineResponse}</td>
                  {splits.map((s) => (
                    <td key={s.id} style={{ padding: '8px 8px' }}>
                      <input
                        type="number"
                        style={{ width: '80px', padding: '3px 6px', fontSize: 12 }}
                        value={s.targetResponse ?? ''}
                        onChange={(e) =>
                          updateSplitMeta(s.id, 'targetResponse', Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {analysis.summary.isSignificantVariance && (
          <div className="physics-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color="var(--gold)" />
              <strong>High Process Variance Detected (Max Δ &gt; 15%)</strong>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>
              Recipe splits vary by up to {analysis.summary.maxDeltaPct.toFixed(1)}% from POR baseline. Verify plasma stability, gas residence time, and potential chamber seasoning drift between splits.
            </p>
          </div>
        )}
      </div>

      <div className="calc-result">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Response Comparison Chart</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="button secondary sm"
                onClick={() => svgRef.current && downloadSvg(svgRef.current, 'split_lot_response_overlay.svg')}
                title="Export Chart as SVG"
              >
                <Download size={13} /> SVG
              </button>
              <button
                type="button"
                className="button secondary sm"
                onClick={exportSplitCsv}
                title="Export Split-Lot matrix as CSV"
              >
                <Download size={13} /> CSV
              </button>
            </div>
          </div>

          {/* SVG Overlay Bar Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              ref={svgRef}
              viewBox="0 0 460 220"
              style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: 6 }}
              aria-label="Split-Lot Response Comparison"
            >
              {/* Axes and Grid */}
              <line x1="60" y1="20" x2="60" y2="170" stroke="var(--border)" strokeWidth="1" />
              <line x1="60" y1="170" x2="430" y2="170" stroke="var(--border)" strokeWidth="1" />

              {/* Baseline reference line */}
              {(() => {
                const maxVal = Math.max(
                  baselineResponse,
                  ...splits.map((s) => s.targetResponse ?? 0),
                ) * 1.25 || 100;

                const baselineY = 170 - (baselineResponse / maxVal) * 140;
                const totalBars = splits.length + 1;
                const barWidth = Math.min(48, 320 / (totalBars * 1.5));

                return (
                  <>
                    <line
                      x1="60"
                      y1={baselineY}
                      x2="430"
                      y2={baselineY}
                      stroke="var(--teal)"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <text
                      x="425"
                      y={baselineY - 4}
                      textAnchor="end"
                      fill="var(--teal)"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      Baseline: {baselineResponse} {responseUnit}
                    </text>

                    {/* Bars */}
                    {/* 1. Baseline Bar */}
                    <rect
                      x="80"
                      y={baselineY}
                      width={barWidth}
                      height={170 - baselineY}
                      fill="var(--teal)"
                      opacity="0.85"
                      rx="3"
                    />
                    <text
                      x={80 + barWidth / 2}
                      y="186"
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--ink)"
                    >
                      POR
                    </text>
                    <text
                      x={80 + barWidth / 2}
                      y={baselineY - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--ink)"
                      fontWeight="600"
                    >
                      {baselineResponse}
                    </text>

                    {/* Split Bars */}
                    {splits.map((s, i) => {
                      const val = s.targetResponse ?? 0;
                      const barY = 170 - (val / maxVal) * 140;
                      const barX = 80 + (i + 1) * (barWidth + 24);
                      const delta = val - baselineResponse;
                      const isUp = delta >= 0;

                      return (
                        <g key={s.id}>
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={Math.max(2, 170 - barY)}
                            fill={isUp ? 'var(--blue, #2563eb)' : 'var(--red, #dc2626)'}
                            opacity="0.8"
                            rx="3"
                          />
                          <text
                            x={barX + barWidth / 2}
                            y="186"
                            textAnchor="middle"
                            fontSize="9"
                            fill="var(--ink)"
                          >
                            {s.name.replace(/Split\s*/, 'Spl ')}
                          </text>
                          <text
                            x={barX + barWidth / 2}
                            y={barY - 5}
                            textAnchor="middle"
                            fontSize="10"
                            fill="var(--ink)"
                            fontWeight="600"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          <div style={{ marginTop: 14 }}>
            <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>Split Performance Summary</h4>
            <div className="metric-grid">
              {splits.map((s) => {
                const resp = s.targetResponse ?? 0;
                const d = resp - baselineResponse;
                const pct = baselineResponse !== 0 ? (d / baselineResponse) * 100 : 0;
                return (
                  <div key={s.id} className="metric" style={{ border: '1px solid var(--border)', padding: 8, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, margin: '2px 0' }}>
                      {resp} <span style={{ fontSize: 11, fontWeight: 'normal' }}>{responseUnit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: d >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                      {d >= 0 ? '+' : ''}{d.toFixed(1)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="button secondary"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={copySummary}
            >
              {copied ? <Check size={14} color="var(--teal)" /> : <Copy size={14} />}
              {copied ? 'Summary Copied' : 'Copy Split Run Summary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
