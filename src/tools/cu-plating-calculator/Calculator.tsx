'use client';

import React, { useState, useMemo } from 'react';
import { Download, Share2, AlertTriangle, Check, Layers, Zap } from 'lucide-react';
import { useUrlParamsState } from '@/lib/use-url-state';
import { calculateCuPlating } from '@/lib/cu-plating';
import { useGlossary } from '@/lib/i18n/glossary';

interface CuPlatingState {
  [key: string]: string | number | boolean;
  currentDensityMaCm2: number;
  platingTimeSec: number;
  currentEfficiencyPercent: number;
  waferDiameterMm: number;
  seedSheetResistanceOhmSq: number;
  trenchWidthNm: number;
  trenchDepthNm: number;
  acceleratorRatio: number;
  suppressorRatio: number;
  levelerRatio: number;
}

const INITIAL_STATE: CuPlatingState = {
  currentDensityMaCm2: 15,
  platingTimeSec: 90,
  currentEfficiencyPercent: 98,
  waferDiameterMm: 300,
  seedSheetResistanceOhmSq: 1.2,
  trenchWidthNm: 65,
  trenchDepthNm: 180,
  acceleratorRatio: 1.2,
  suppressorRatio: 1.0,
  levelerRatio: 1.0,
};

export default function CuPlatingCalculator() {
  const [state, setState] = useState<CuPlatingState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'radial' | 'trench'>('radial');

  useUrlParamsState(state, setState);
  const g = useGlossary();

  const results = useMemo(() => {
    return calculateCuPlating({
      currentDensityMaCm2: state.currentDensityMaCm2,
      platingTimeSec: state.platingTimeSec,
      currentEfficiency: state.currentEfficiencyPercent / 100,
      waferDiameterMm: state.waferDiameterMm,
      seedSheetResistanceOhmSq: state.seedSheetResistanceOhmSq,
      trenchWidthNm: state.trenchWidthNm,
      trenchDepthNm: state.trenchDepthNm,
      acceleratorRatio: state.acceleratorRatio,
      suppressorRatio: state.suppressorRatio,
      levelerRatio: state.levelerRatio,
    });
  }, [state]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Radius (mm)', 'Normalized Radius', 'Current Density (mA/cm2)', 'Thickness (nm)'],
      ...results.radialProfile.map((p) => [
        p.radiusMm,
        p.normalizedRadius,
        p.currentDensityMaCm2,
        p.filmThicknessNm,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cu_plating_profile_${state.waferDiameterMm}mm.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="calculator-wrapper">
      <div className="calculator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Parameter Inputs */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card, #ffffff)', border: '1px solid var(--line, #e2e8f0)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink, #0f172a)' }}>
            <Zap size={18} color="var(--teal, #0d7c82)" />
            Electrolysis & Plating Conditions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                Cathodic Current Density <i>J</i> (mA/cm²)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                step={0.5}
                className="input-field"
                value={state.currentDensityMaCm2}
                onChange={(e) => setState({ ...state, currentDensityMaCm2: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--line)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted, #64748b)' }}>Nominal fab process window: 10 – 30 mA/cm²</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Plating Time (s)
                </label>
                <input
                  type="number"
                  min={5}
                  max={1200}
                  className="input-field"
                  value={state.platingTimeSec}
                  onChange={(e) => setState({ ...state, platingTimeSec: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Current Efficiency (%)
                </label>
                <input
                  type="number"
                  min={80}
                  max={100}
                  step={0.5}
                  className="input-field"
                  value={state.currentEfficiencyPercent}
                  onChange={(e) => setState({ ...state, currentEfficiencyPercent: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Wafer Size
                </label>
                <select
                  value={state.waferDiameterMm}
                  onChange={(e) => setState({ ...state, waferDiameterMm: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                >
                  <option value={300}>300 mm (12-inch)</option>
                  <option value={200}>200 mm (8-inch)</option>
                  <option value={150}>150 mm (6-inch)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Seed Sheet R (Ω/□)
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="input-field"
                  value={state.seedSheetResistanceOhmSq}
                  onChange={(e) => setState({ ...state, seedSheetResistanceOhmSq: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0.5rem 0' }} />

            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink)' }}>
              <Layers size={16} color="var(--teal)" />
              Damascene Trench Geometry & Additives
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Trench Width (nm)
                </label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  className="input-field"
                  value={state.trenchWidthNm}
                  onChange={(e) => setState({ ...state, trenchWidthNm: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                  Trench Depth (nm)
                </label>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  className="input-field"
                  value={state.trenchDepthNm}
                  onChange={(e) => setState({ ...state, trenchDepthNm: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>
                  SPS (Accelerator)
                </label>
                <input
                  type="number"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={state.acceleratorRatio}
                  onChange={(e) => setState({ ...state, acceleratorRatio: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>
                  PEG (Suppressor)
                </label>
                <input
                  type="number"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={state.suppressorRatio}
                  onChange={(e) => setState({ ...state, suppressorRatio: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>
                  JGB (Leveler)
                </label>
                <input
                  type="number"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={state.levelerRatio}
                  onChange={(e) => setState({ ...state, levelerRatio: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics & Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
            <div className="metric-card" style={{ padding: '1rem', backgroundColor: 'var(--paper, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{g('depositionRate')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--teal-dark, #0f766e)' }}>{results.nominalRateNmMin}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>nm/min</div>
            </div>

            <div className="metric-card" style={{ padding: '1rem', backgroundColor: 'var(--paper, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Nominal Thickness</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>{results.nominalThicknessNm}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>nm deposited</div>
            </div>

            <div className="metric-card" style={{ padding: '1rem', backgroundColor: 'var(--paper, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Radial Non-uniformity</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: results.radialUniformityPercent > 12 ? 'var(--amber, #d97706)' : 'var(--teal)' }}>
                {results.radialUniformityPercent}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Edge vs Center</div>
            </div>

            {results.damascene && (
              <div className="metric-card" style={{ padding: '1rem', backgroundColor: 'var(--paper, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Aspect Ratio</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>{results.damascene.aspectRatio}:1</div>
                <div style={{ fontSize: '0.75rem', color: results.damascene.pinchOffRisk === 'high' ? 'var(--red, #ef4444)' : 'var(--teal)' }}>
                  {results.damascene.pinchOffRisk.toUpperCase()} VOID RISK
                </div>
              </div>
            )}
          </div>

          {/* Warnings Banner */}
          {results.warnings.length > 0 && (
            <div className="physics-alert" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.9rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e', fontSize: '0.85rem' }}>
              {results.warnings.map((w, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visualization Container */}
          <div className="card" style={{ padding: '1.2rem', backgroundColor: 'var(--card, #ffffff)', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`button ${activeTab === 'radial' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveTab('radial')}
                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Wafer Radial Terminal Profile
                </button>
                <button
                  type="button"
                  className={`button ${activeTab === 'trench' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveTab('trench')}
                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Damascene Trench Fill
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="button secondary" onClick={handleExportCsv} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={13} />
                  CSV
                </button>
                <button type="button" className="button secondary" onClick={handleShare} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {copied ? <Check size={13} color="green" /> : <Share2 size={13} />}
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>

            {/* SVG Plot 1: Radial Profile */}
            {activeTab === 'radial' && (
              <div>
                <svg viewBox="0 0 500 220" style={{ width: '100%', height: 'auto', backgroundColor: '#fcfdfd', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="50" y2="180" stroke="#e2e8f0" strokeDasharray="3,3" />
                  <line x1="270" y1="20" x2="270" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="470" y1="20" x2="470" y2="180" stroke="#e2e8f0" strokeDasharray="3,3" />
                  <line x1="50" y1="180" x2="470" y2="180" stroke="#94a3b8" />

                  {/* Profile Path */}
                  {(() => {
                    const maxT = Math.max(...results.radialProfile.map((p) => p.filmThicknessNm), 1);
                    const minT = Math.min(...results.radialProfile.map((p) => p.filmThicknessNm), 0);
                    const range = Math.max(1, maxT - minT);

                    const points = results.radialProfile.map((p) => {
                      const x = 270 + p.normalizedRadius * 200;
                      const y = 160 - ((p.filmThicknessNm - minT) / range) * 120;
                      return `${x},${y}`;
                    });

                    // Mirror across center
                    const mirrorPoints = [...results.radialProfile].reverse().map((p) => {
                      const x = 270 - p.normalizedRadius * 200;
                      const y = 160 - ((p.filmThicknessNm - minT) / range) * 120;
                      return `${x},${y}`;
                    });

                    const fullPoints = [...mirrorPoints, ...points].join(' ');

                    return (
                      <>
                        <polyline fill="none" stroke="var(--teal, #0d7c82)" strokeWidth="3" points={fullPoints} />
                        <path d={`M 70 180 L ${fullPoints} L 470 180 Z`} fill="rgba(13, 124, 130, 0.08)" />
                      </>
                    );
                  })()}

                  {/* Labels */}
                  <text x="270" y="200" textAnchor="middle" fontSize="11" fill="#475569">Wafer Center (0 mm)</text>
                  <text x="70" y="200" textAnchor="middle" fontSize="10" fill="#64748b">Left Edge (-{state.waferDiameterMm / 2} mm)</text>
                  <text x="470" y="200" textAnchor="middle" fontSize="10" fill="#64748b">Right Edge (+{state.waferDiameterMm / 2} mm)</text>

                  <text x="60" y="45" fontSize="11" fill="var(--teal-dark, #0a5f66)" fontWeight="600">
                    Center: {results.centerThicknessNm} nm
                  </text>
                  <text x="360" y="45" fontSize="11" fill="var(--teal-dark, #0a5f66)" fontWeight="600">
                    Edge: {results.edgeThicknessNm} nm
                  </text>
                </svg>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                  Seed layer terminal IR-drop produces edge current crowding, causing center-thinner plating.
                </p>
              </div>
            )}

            {/* SVG Plot 2: Damascene Trench Cross-Section */}
            {activeTab === 'trench' && (
              <div>
                <svg viewBox="0 0 500 240" style={{ width: '100%', height: 'auto', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                  {/* Dielectric Substrate */}
                  <rect x="50" y="80" width="160" height="130" fill="#94a3b8" />
                  <rect x="290" y="80" width="160" height="130" fill="#94a3b8" />
                  <text x="130" y="150" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle">SiO2 / Low-k</text>
                  <text x="370" y="150" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle">SiO2 / Low-k</text>

                  {/* Trench Cavity */}
                  <rect x="210" y="80" width="80" height="130" fill="#f1f5f9" />

                  {/* Deposited Copper Layer */}
                  {/* Bottom superfilled copper */}
                  <rect x="210" y="130" width="80" height="80" fill="#b45309" opacity="0.85" />
                  <path d="M 210 130 Q 250 145 290 130 L 290 210 L 210 210 Z" fill="#d97706" />

                  {/* Overburden Cu on top */}
                  <rect x="50" y="60" width="400" height="20" fill="#b45309" opacity="0.9" />

                  {/* Annotations */}
                  <text x="250" y="175" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Cu Superfill</text>
                  <text x="250" y="75" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle">Cu Overburden ({results.damascene?.overburdenThicknessNm || 50} nm)</text>

                  {/* Dimension markers */}
                  <line x1="210" y1="225" x2="290" y2="225" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="250" y="238" fontSize="10" fill="#0f172a" textAnchor="middle">Width: {state.trenchWidthNm} nm</text>

                  <line x1="300" y1="80" x2="300" y2="210" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="350" y="115" fontSize="10" fill="#0f172a">Depth: {state.trenchDepthNm} nm</text>
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.5rem' }}>
                  <span>Bottom-up Velocity Ratio: <strong>{results.damascene?.bottomUpVelocityRatio}x</strong></span>
                  <span>Fill Time: <strong>{results.damascene?.timeToFillTrenchSec} s</strong></span>
                  <span>Void Probability: <strong>{results.damascene?.voidRiskPercent}%</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
