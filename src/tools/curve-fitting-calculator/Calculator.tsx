'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  fitArrhenius,
  fitDealGrove,
  linearRegression,
  parseTwoColumnData,
  type ArrheniusFitResult,
  type DealGroveFitResult,
  type LinearRegressionResult,
} from '@/lib/curve-fitting';
import { downloadCsv, downloadSvg, downloadXlsx } from '@/lib/export';
import { Download, Copy, Check, Info } from 'lucide-react';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useCopyToClipboard } from '@/lib/use-result-clipboard';

type FitMode = 'arrhenius' | 'deal-grove' | 'linear';

const PRESET_ARRHENIUS = `# Temperature (°C), Deposition/Etch Rate (nm/min)
550, 1.8
575, 4.2
600, 9.5
625, 20.8
650, 42.0
`;

const PRESET_DEAL_GROVE = `# Oxidation Time (hr), Oxide Thickness (μm)
# 1000°C Wet Oxidation of Si(100)
0.25, 0.12
0.50, 0.19
1.00, 0.30
2.00, 0.45
4.00, 0.67
8.00, 0.98
`;

const PRESET_LINEAR = `# X (Independent Variable), Y (Dependent Variable)
1.0, 2.45
2.0, 4.88
3.0, 7.32
4.0, 9.75
5.0, 12.18
`;

export default function CurveFittingCalculator() {
  const [state, setState] = useState({ mode: 'arrhenius' as FitMode, inputText: PRESET_ARRHENIUS });
  useUrlParamsState(state, setState);
  const { mode, inputText } = state;
  const setMode = (value: FitMode) => setState((previous) => ({ ...previous, mode: value }));
  const setInputText = (value: string) => setState((previous) => ({ ...previous, inputText: value }));
  const { copied, copy } = useCopyToClipboard();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const textId = useId();

  const handleModeChange = (newMode: FitMode) => {
    setMode(newMode);
    if (newMode === 'arrhenius') setInputText(PRESET_ARRHENIUS);
    else if (newMode === 'deal-grove') setInputText(PRESET_DEAL_GROVE);
    else setInputText(PRESET_LINEAR);
  };

  const rawPoints = useMemo(() => {
    return parseTwoColumnData(inputText);
  }, [inputText]);

  // Arrhenius calculation
  const arrheniusResult: ArrheniusFitResult | null = useMemo(() => {
    if (mode !== 'arrhenius' || rawPoints.length < 2) return null;
    return fitArrhenius(rawPoints.map((p) => ({ temperatureCelsius: p.x, rate: p.y })));
  }, [mode, rawPoints]);

  // Deal-Grove calculation
  const dealGroveResult: DealGroveFitResult | null = useMemo(() => {
    if (mode !== 'deal-grove' || rawPoints.length < 2) return null;
    return fitDealGrove(rawPoints.map((p) => ({ timeHours: p.x, thicknessUm: p.y })));
  }, [mode, rawPoints]);

  // General linear regression
  const linearResult: LinearRegressionResult | null = useMemo(() => {
    if (mode !== 'linear' || rawPoints.length < 2) return null;
    return linearRegression(rawPoints);
  }, [mode, rawPoints]);

  const buildExportRows = () => {
    if (mode === 'arrhenius' && arrheniusResult) {
      return {
        filename: 'arrhenius_fit_results',
        sheetName: 'Arrhenius Fit',
        headers: ['Temp (°C)', 'Temp (K)', '1000/T (K⁻¹)', 'Measured Rate', 'ln(Rate)', 'Predicted Rate'],
        rows: arrheniusResult.points.map((pt) => [
          pt.tempC,
          pt.tempK.toFixed(2),
          pt.invTK.toFixed(4),
          pt.rate,
          pt.lnRate.toFixed(4),
          pt.predictedRate.toFixed(4),
        ]),
      };
    }
    if (mode === 'deal-grove' && dealGroveResult) {
      return {
        filename: 'deal_grove_fit_results',
        sheetName: 'Deal-Grove Fit',
        headers: ['Oxidation Time (hr)', 'Oxide Thickness (μm)', 'Deal-Grove Predicted Time (hr)'],
        rows: dealGroveResult.points.map((pt) => [
          pt.timeHours,
          pt.thicknessUm,
          pt.predictedTimeHours.toFixed(4),
        ]),
      };
    }
    if (mode === 'linear' && linearResult) {
      return {
        filename: 'linear_regression_results',
        sheetName: 'Linear Regression',
        headers: ['X', 'Y', 'Predicted Y', 'Residual (Y - Y_pred)'],
        rows: rawPoints.map((pt) => {
          const yPred = linearResult.slope * pt.x + linearResult.intercept;
          return [pt.x, pt.y, yPred.toFixed(4), (pt.y - yPred).toFixed(4)];
        }),
      };
    }
    return null;
  };

  const exportFitCsv = () => {
    const data = buildExportRows();
    if (!data) return;
    downloadCsv(data.filename, data.headers, data.rows);
  };

  const exportFitXlsx = async () => {
    const data = buildExportRows();
    if (!data) return;
    await downloadXlsx(`${data.filename}.xlsx`, data.sheetName, data.headers, data.rows);
  };

  const copySummary = () => {
    let summaryText = '';
    if (mode === 'arrhenius' && arrheniusResult) {
      summaryText = `Arrhenius Activation Energy Extraction:\n` +
        `Ea: ${arrheniusResult.activationEnergyEv.toFixed(3)} eV\n` +
        `Pre-exponential Factor A: ${arrheniusResult.preExponentialA.toExponential(3)}\n` +
        `Goodness of Fit R²: ${arrheniusResult.rSquared.toFixed(4)}\n` +
        `Data Points: ${arrheniusResult.points.length}\n`;
    } else if (mode === 'deal-grove' && dealGroveResult) {
      summaryText = `Deal-Grove Oxidation Kinetic Parameter Extraction:\n` +
        `Parabolic Rate Constant B: ${dealGroveResult.parabolicRateConstantB.toFixed(4)} μm²/hr\n` +
        `Linear Rate Constant B/A: ${dealGroveResult.linearRateConstantBoverA.toFixed(4)} μm/hr\n` +
        `Characteristic Thickness A: ${dealGroveResult.parameterA.toFixed(4)} μm\n` +
        `Goodness of Fit R²: ${dealGroveResult.rSquared.toFixed(4)}\n`;
    } else if (mode === 'linear' && linearResult) {
      summaryText = `Linear Least-Squares Regression:\n` +
        `Slope (m): ${linearResult.slope.toFixed(4)}\n` +
        `Intercept (c): ${linearResult.intercept.toFixed(4)}\n` +
        `R²: ${linearResult.rSquared.toFixed(4)}\n` +
        `Standard Error: ${linearResult.standardError.toFixed(4)}\n`;
    }

    void copy(summaryText);
  };

  return (
    <div className="calc-grid">
      <div className="calc-form">
        {/* Model Selector Tabs */}
        <div className="panel" style={{ padding: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`button ${mode === 'arrhenius' ? 'primary' : 'secondary'}`}
              style={{ flex: 1 }}
              onClick={() => handleModeChange('arrhenius')}
            >
              Arrhenius (Ea)
            </button>
            <button
              type="button"
              className={`button ${mode === 'deal-grove' ? 'primary' : 'secondary'}`}
              style={{ flex: 1 }}
              onClick={() => handleModeChange('deal-grove')}
            >
              Deal-Grove (B, B/A)
            </button>
            <button
              type="button"
              className={`button ${mode === 'linear' ? 'primary' : 'secondary'}`}
              style={{ flex: 1 }}
              onClick={() => handleModeChange('linear')}
            >
              Linear Regression
            </button>
          </div>
        </div>

        {/* Raw Data Input */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label htmlFor={textId} style={{ fontWeight: 600, fontSize: 14 }}>
              {mode === 'arrhenius' && 'Temperature (°C) and Rate (nm/min or s⁻¹)'}
              {mode === 'deal-grove' && 'Oxidation Time (hr) and Oxide Thickness (μm)'}
              {mode === 'linear' && 'Independent X and Dependent Y Data'}
            </label>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {rawPoints.length} valid points parsed
            </span>
          </div>

          <textarea
            id={textId}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 8 }}
            placeholder="# Enter X, Y data points separated by comma, space, or tab"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            <Info size={14} />
            <span>Format: CSV or space-separated columns. Lines starting with # are comments.</span>
          </div>
        </div>
      </div>

      <div className="calc-result">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Fitted Kinetic Parameters</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="button secondary sm"
                onClick={() => svgRef.current && downloadSvg(svgRef.current, 'curve_fitting_plot.svg')}
                title="Export plot as SVG"
              >
                <Download size={13} /> SVG
              </button>
              <button
                type="button"
                className="button secondary sm"
                onClick={exportFitCsv}
                title="Export regression data as CSV"
              >
                <Download size={13} /> CSV
              </button>
              <button
                type="button"
                className="button secondary sm"
                onClick={exportFitXlsx}
                title="Export regression data as XLSX"
              >
                <Download size={13} /> XLSX
              </button>
            </div>
          </div>

          {/* Extracted Parameter Metrics */}
          {mode === 'arrhenius' && arrheniusResult && (
            <>
              <div className="metric-grid">
                <div className="metric">
                  <span className="metric-label">Activation Energy Ea</span>
                  <div className="result-value" style={{ color: 'var(--teal)', fontSize: 24 }}>
                    {arrheniusResult.activationEnergyEv.toFixed(3)}{' '}
                    <span style={{ fontSize: 14, fontWeight: 'normal' }}>eV</span>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-label">Goodness of Fit R²</span>
                  <div className="result-value" style={{ fontSize: 24 }}>
                    {arrheniusResult.rSquared.toFixed(4)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 12 }}>
                <strong>Arrhenius Pre-exponential A:</strong> {arrheniusResult.preExponentialA.toExponential(3)}
              </div>
            </>
          )}

          {mode === 'deal-grove' && dealGroveResult && (
            <>
              <div className="metric-grid">
                <div className="metric">
                  <span className="metric-label">Parabolic Rate Constant B</span>
                  <div className="result-value" style={{ color: 'var(--teal)', fontSize: 22 }}>
                    {dealGroveResult.parabolicRateConstantB.toFixed(4)}{' '}
                    <span style={{ fontSize: 12, fontWeight: 'normal' }}>μm²/hr</span>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-label">Linear Rate Constant B/A</span>
                  <div className="result-value" style={{ fontSize: 22 }}>
                    {dealGroveResult.linearRateConstantBoverA.toFixed(4)}{' '}
                    <span style={{ fontSize: 12, fontWeight: 'normal' }}>μm/hr</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, marginBottom: 12 }}>
                <strong>Characteristic Thickness A:</strong> {dealGroveResult.parameterA.toFixed(4)} μm |{' '}
                <strong>R²:</strong> {dealGroveResult.rSquared.toFixed(4)}
              </div>
            </>
          )}

          {mode === 'linear' && linearResult && (
            <>
              <div className="metric-grid">
                <div className="metric">
                  <span className="metric-label">Slope (m)</span>
                  <div className="result-value" style={{ color: 'var(--teal)', fontSize: 24 }}>
                    {linearResult.slope.toFixed(4)}
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-label">Intercept (c)</span>
                  <div className="result-value" style={{ fontSize: 24 }}>
                    {linearResult.intercept.toFixed(4)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, marginBottom: 12 }}>
                <strong>Goodness of Fit R²:</strong> {linearResult.rSquared.toFixed(4)} |{' '}
                <strong>Standard Error:</strong> {linearResult.standardError.toFixed(4)}
              </div>
            </>
          )}

          {/* Live SVG Scatter & Regression Line Chart */}
          <div style={{ width: '100%', overflowX: 'auto', marginTop: 10 }}>
            <svg
              ref={svgRef}
              viewBox="0 0 460 220"
              style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: 6 }}
              aria-label="Curve Fitting Scatter and Fit Line"
            >
              {/* Axes */}
              <line x1="50" y1="20" x2="50" y2="180" stroke="var(--border)" strokeWidth="1" />
              <line x1="50" y1="180" x2="430" y2="180" stroke="var(--border)" strokeWidth="1" />

              {/* Render dynamic scatter points & fit curve based on mode */}
              {mode === 'arrhenius' && arrheniusResult && (() => {
                const pts = arrheniusResult.points;
                const minX = Math.min(...pts.map((p) => p.invTK));
                const maxX = Math.max(...pts.map((p) => p.invTK));
                const minY = Math.min(...pts.map((p) => p.lnRate));
                const maxY = Math.max(...pts.map((p) => p.lnRate));
                const spanX = (maxX - minX) || 1;
                const spanY = (maxY - minY) || 1;

                const toSvgX = (invT: number) => 50 + ((invT - minX) / spanX) * 360;
                const toSvgY = (lnR: number) => 180 - ((lnR - minY) / spanY) * 150;

                const first = pts[0];
                const last = pts[pts.length - 1];

                return (
                  <>
                    <line
                      x1={toSvgX(first.invTK)}
                      y1={toSvgY(Math.log(first.predictedRate))}
                      x2={toSvgX(last.invTK)}
                      y2={toSvgY(Math.log(last.predictedRate))}
                      stroke="var(--teal)"
                      strokeWidth="2"
                    />
                    {pts.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={toSvgX(p.invTK)}
                        cy={toSvgY(p.lnRate)}
                        r="4"
                        fill="var(--teal)"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    ))}
                    <text x="240" y="205" textAnchor="middle" fontSize="11" fill="var(--ink)">
                      1000 / T (K⁻¹)
                    </text>
                    <text x="20" y="100" textAnchor="middle" fontSize="11" fill="var(--ink)" transform="rotate(-90 20 100)">
                      ln(Rate)
                    </text>
                  </>
                );
              })()}

              {mode === 'deal-grove' && dealGroveResult && (() => {
                const pts = dealGroveResult.points;
                const maxX = Math.max(...pts.map((p) => p.thicknessUm)) * 1.15 || 1;
                const maxY = Math.max(...pts.map((p) => p.timeHours)) * 1.15 || 1;

                const toSvgX = (x: number) => 50 + (x / maxX) * 360;
                const toSvgY = (y: number) => 180 - (y / maxY) * 150;

                // Create path for Deal-Grove curve
                const steps = 30;
                let pathD = `M ${toSvgX(0)} ${toSvgY(0)}`;
                for (let i = 1; i <= steps; i++) {
                  const tox = (maxX * i) / steps;
                  const t = (tox ** 2 + dealGroveResult.parameterA * tox) / dealGroveResult.parabolicRateConstantB;
                  pathD += ` L ${toSvgX(tox)} ${toSvgY(t)}`;
                }

                return (
                  <>
                    <path d={pathD} fill="none" stroke="var(--teal)" strokeWidth="2" />
                    {pts.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={toSvgX(p.thicknessUm)}
                        cy={toSvgY(p.timeHours)}
                        r="4"
                        fill="var(--teal)"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    ))}
                    <text x="240" y="205" textAnchor="middle" fontSize="11" fill="var(--ink)">
                      Oxide Thickness x_ox (μm)
                    </text>
                    <text x="20" y="100" textAnchor="middle" fontSize="11" fill="var(--ink)" transform="rotate(-90 20 100)">
                      Time (hr)
                    </text>
                  </>
                );
              })()}

              {mode === 'linear' && linearResult && (() => {
                const minX = Math.min(...rawPoints.map((p) => p.x));
                const maxX = Math.max(...rawPoints.map((p) => p.x));
                const minY = Math.min(...rawPoints.map((p) => p.y));
                const maxY = Math.max(...rawPoints.map((p) => p.y));
                const spanX = (maxX - minX) || 1;
                const spanY = (maxY - minY) || 1;

                const toSvgX = (x: number) => 50 + ((x - minX) / spanX) * 360;
                const toSvgY = (y: number) => 180 - ((y - minY) / spanY) * 150;

                const y1 = linearResult.slope * minX + linearResult.intercept;
                const y2 = linearResult.slope * maxX + linearResult.intercept;

                return (
                  <>
                    <line
                      x1={toSvgX(minX)}
                      y1={toSvgY(y1)}
                      x2={toSvgX(maxX)}
                      y2={toSvgY(y2)}
                      stroke="var(--teal)"
                      strokeWidth="2"
                    />
                    {rawPoints.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={toSvgX(p.x)}
                        cy={toSvgY(p.y)}
                        r="4"
                        fill="var(--teal)"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    ))}
                    <text x="240" y="205" textAnchor="middle" fontSize="11" fill="var(--ink)">
                      Independent X
                    </text>
                    <text x="20" y="100" textAnchor="middle" fontSize="11" fill="var(--ink)" transform="rotate(-90 20 100)">
                      Dependent Y
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="button secondary"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={copySummary}
            >
              {copied ? <Check size={14} color="var(--teal)" /> : <Copy size={14} />}
              {copied ? 'Extraction Summary Copied' : 'Copy Extracted Parameters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
