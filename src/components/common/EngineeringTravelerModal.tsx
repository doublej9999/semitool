'use client';

import { useState } from 'react';
import { FileText, Printer, X, CheckSquare, Sparkles } from 'lucide-react';

interface EngineeringTravelerModalProps {
  toolName: string;
  defaultInputs?: Record<string, string | number>;
  defaultResults?: Record<string, string | number>;
}

export default function EngineeringTravelerModal({
  toolName,
  defaultInputs = {},
  defaultResults = {},
}: EngineeringTravelerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lotId, setLotId] = useState('LOT-2026-ENG-042');
  const [waferIds, setWaferIds] = useState('#01 - #25');
  const [recipeName, setRecipeName] = useState(`${toolName.replace(/\s+/g, '_').toUpperCase()}_V1.0`);
  const [chamberId, setChamberId] = useState('MODULE-C02 (CH-A)');
  const [operator, setOperator] = useState('FAB_ENG_982');
  const [targetSpec, setTargetSpec] = useState('');
  const [notes, setNotes] = useState('Cleanroom pilot run. Verify metrology within ±3% target tolerance.');
  const [dateStr] = useState(() => new Date().toISOString().split('T')[0]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      <button
        type="button"
        className="button secondary tool-action-btn"
        onClick={() => setIsOpen(true)}
        title="Generate Cleanroom Wafer Traveler / Run-Sheet"
      >
        <FileText size={14} aria-hidden="true" />
        <span>Run Sheet / Traveler</span>
      </button>

      {isOpen && (
        <div
          className="traveler-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(21, 33, 39, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="traveler-modal-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="traveler-title"
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              backgroundColor: 'var(--panel-bg, #ffffff)',
              color: 'var(--foreground, #1e293b)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: '1.5rem',
            }}
          >
            {/* Header controls (hidden in print) */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--teal, #0d9488)" />
                <h2 id="traveler-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  Cleanroom Engineering Traveler / Run-Sheet
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button primary"
                  onClick={handlePrint}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={15} />
                  <span>Print Traveler (PDF)</span>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close traveler modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Editor Controls (hidden in print) */}
            <div
              className="no-print"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                padding: '0.75rem',
                backgroundColor: 'var(--subtle-bg, #f8fafc)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem' }}>Lot ID:</label>
                <input
                  type="text"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem' }}>Wafer Slots:</label>
                <input
                  type="text"
                  value={waferIds}
                  onChange={(e) => setWaferIds(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem' }}>Chamber / Tool:</label>
                <input
                  type="text"
                  value={chamberId}
                  onChange={(e) => setChamberId(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.2rem' }}>Operator / Eng:</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            {/* Printable Cleanroom Traveler Body */}
            <div
              className="traveler-printable-sheet print-only-sheet"
              style={{
                padding: '1.5rem',
                border: '2px solid #0f172a',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {/* Document Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    SEMITOOLS CLEANROOM TRAVELER
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                    WAFER LOT DISPATCH &amp; PROCESS RUN-SHEET
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div><strong>DATE:</strong> {dateStr}</div>
                  <div><strong>REV:</strong> V2.6-ENG</div>
                  <div><strong>STATUS:</strong> <span style={{ color: '#0d9488', fontWeight: 700 }}>AUTHORIZED</span></div>
                </div>
              </div>

              {/* Top Lot Meta Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc', width: '20%' }}><strong>LOT NUMBER:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', width: '30%' }}>{lotId}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc', width: '20%' }}><strong>WAFER SLOTS:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', width: '30%' }}>{waferIds}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>PROCESS / RECIPE:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{recipeName}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>CHAMBER / TOOL:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{chamberId}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>RESPONSIBLE ENG:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>{operator}</td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px', background: '#f8fafc' }}><strong>OPERATION STEP:</strong></td>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 10px' }}>STEP-410 [{toolName}]</td>
                  </tr>
                </tbody>
              </table>

              {/* Recipe Setpoints & Target Parameters */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  1. Target Recipe Setpoints &amp; Nominal Conditions
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.82rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Parameter</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Nominal / Calculated Setpoint</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Tolerance / Spec</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Actual Readout</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(defaultInputs).length > 0 ? (
                      Object.entries(defaultInputs).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', fontWeight: 600 }}>{k}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>{String(v)}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>±3.0%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>□ PASS &nbsp; □ OOS</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Process Temp / Power</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Standard Recipe Setpoint</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>±1.5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>□ PASS &nbsp; □ OOS</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Metrology & Quality Acceptance */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  2. In-Line Metrology Targets &amp; Output Expectations
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.82rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Metrology Output</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left' }}>Theoretical / Modeled Value</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>LSL</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>USL</th>
                      <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>Measured Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(defaultResults).length > 0 ? (
                      Object.entries(defaultResults).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', fontWeight: 600 }}>{k}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', color: '#0369a1' }}>{String(v)}</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>-5%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center', color: '#64748b' }}>+5%</td>
                          <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Target Thickness / Rate / Yield</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px' }}>Refer to Active Tool Window</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>-5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>+5%</td>
                        <td style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'center' }}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cleanroom Sign-Off & Verification Box */}
              <div style={{ marginTop: '1.5rem', border: '1px solid #94a3b8', padding: '0.75rem', background: '#fafafa' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  3. Cleanroom Quality &amp; Engineering Sign-off
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>Pre-Run Checklist:</strong></div>
                    <div>Chamber Base Vacuum: □ OK</div>
                    <div>Particle Monitor (&lt;0.1µm): □ OK</div>
                    <div>Operator Sign: ________________</div>
                  </div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>Run Completion:</strong></div>
                    <div>Recipe Abort / Alarm: □ NONE</div>
                    <div>Wafers Unloaded: [ 25 / 25 ]</div>
                    <div>Shift Handover: ________________</div>
                  </div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: '0.4rem' }}>
                    <div><strong>QA / Process Release:</strong></div>
                    <div>Disposition: □ RELEASE &nbsp; □ HOLD</div>
                    <div>Deviation Report #: ____________</div>
                    <div>Fab Engineer Sign: _____________</div>
                  </div>
                </div>
              </div>

              {/* Micro-footer */}
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '0.4rem',
                }}
              >
                <span>Generated by SemiTools Local Fab Engineering Hub</span>
                <span>ISO 9001 / IATF 16949 Metrology Audit Compliant Record</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
