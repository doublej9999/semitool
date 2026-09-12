'use client';

import { useState } from 'react';
import { BookOpen, X, Search, Atom, Layers, ShieldCheck, Sigma } from 'lucide-react';
import {
  FUNDAMENTAL_CONSTANTS,
  MATERIAL_PROPERTIES_TABLE,
  CLEANROOM_STANDARDS,
  HANDBOOK_FORMULAS,
} from '@/lib/semiconductor-constants';

type Tab = 'formulas' | 'constants' | 'materials' | 'cleanroom';

export default function EngineeringHandbookModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('formulas');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFormulas = HANDBOOK_FORMULAS.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.formulaPlain.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredConstants = FUNDAMENTAL_CONSTANTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Trigger Button in toolbar or footer */}
      <button
        type="button"
        className="icon-button handbook-trigger"
        aria-label="Open Semiconductor Engineering Handbook & Formula Reference"
        title="Semiconductor Engineering Handbook & Formulas"
        onClick={() => setIsOpen(true)}
      >
        <BookOpen size={18} aria-hidden="true" />
      </button>

      {/* Modal Drawer */}
      {isOpen && (
        <div
          className="handbook-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(21, 33, 39, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="handbook-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="handbook-title"
            style={{
              width: '100%',
              maxWidth: '680px',
              height: '100%',
              backgroundColor: 'var(--panel)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--teal)" aria-hidden="true" />
                <h2 id="handbook-title" style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: 'var(--ink)' }}>
                  Fab Engineering Handbook
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close Handbook"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                padding: '0 20px',
                gap: '8px',
                background: 'var(--panel-subtle)',
              }}
            >
              <button
                type="button"
                className={`tab-button ${activeTab === 'formulas' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('formulas')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'formulas' ? '2px solid var(--teal)' : '2px solid transparent',
                  fontWeight: activeTab === 'formulas' ? '600' : '400',
                  color: activeTab === 'formulas' ? 'var(--teal)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <Sigma size={15} /> Formulas
              </button>

              <button
                type="button"
                className={`tab-button ${activeTab === 'constants' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('constants')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'constants' ? '2px solid var(--teal)' : '2px solid transparent',
                  fontWeight: activeTab === 'constants' ? '600' : '400',
                  color: activeTab === 'constants' ? 'var(--teal)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <Atom size={15} /> Physical Constants
              </button>

              <button
                type="button"
                className={`tab-button ${activeTab === 'materials' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('materials')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'materials' ? '2px solid var(--teal)' : '2px solid transparent',
                  fontWeight: activeTab === 'materials' ? '600' : '400',
                  color: activeTab === 'materials' ? 'var(--teal)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <Layers size={15} /> Materials
              </button>

              <button
                type="button"
                className={`tab-button ${activeTab === 'cleanroom' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('cleanroom')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'cleanroom' ? '2px solid var(--teal)' : '2px solid transparent',
                  fontWeight: activeTab === 'cleanroom' ? '600' : '400',
                  color: activeTab === 'cleanroom' ? 'var(--teal)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <ShieldCheck size={15} /> Cleanroom
              </button>
            </div>

            {/* Search Input for Formulas & Constants */}
            {(activeTab === 'formulas' || activeTab === 'constants') && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }}
                  />
                  <input
                    type="search"
                    placeholder={`Filter ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '32px',
                      paddingRight: '12px',
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {activeTab === 'formulas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filteredFormulas.map((f) => (
                    <article
                      key={f.id}
                      style={{
                        background: 'var(--panel-subtle)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--ink)' }}>
                          {f.title}
                        </h3>
                        <span
                          style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(13, 124, 130, 0.1)',
                            color: 'var(--teal)',
                            fontWeight: '600',
                          }}
                        >
                          {f.category}
                        </span>
                      </div>

                      <div
                        style={{
                          background: 'var(--panel)',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: 'var(--ink)',
                          margin: '8px 0',
                          overflowX: 'auto',
                        }}
                      >
                        {f.formulaPlain}
                      </div>

                      <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: 'var(--ink)', margin: '8px 0' }}>
                        {f.explanation}
                      </p>

                      <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                        <strong>Variables: </strong>
                        {f.variables.map((v, i) => (
                          <span key={v.symbol}>
                            <code>{v.symbol}</code> ({v.meaning} [{v.unit}])
                            {i < f.variables.length - 1 ? '; ' : ''}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 10px',
                          background: 'rgba(223, 162, 67, 0.08)',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          color: '#73460f',
                        }}
                      >
                        <strong>Fab Application:</strong> {f.fabRelevance}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'constants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredConstants.map((c) => (
                    <div
                      key={c.symbol}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--panel-subtle)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--ink)' }}>
                          {c.name} <code style={{ color: 'var(--teal)', fontSize: '13px' }}>({c.symbol})</code>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                          {c.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '13px', color: 'var(--ink)' }}>
                          {c.value.toExponential(4)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{c.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {MATERIAL_PROPERTIES_TABLE.map((mat) => (
                    <div key={mat.category}>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: '6px',
                          marginBottom: '10px',
                          color: 'var(--ink)',
                        }}
                      >
                        {mat.category}
                      </h3>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {mat.properties.map((p) => (
                          <div
                            key={p.property}
                            style={{
                              padding: '8px 10px',
                              background: 'var(--panel-subtle)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>
                              {p.property} {p.symbol !== '—' && <span>({p.symbol})</span>}
                            </div>
                            <div style={{ fontWeight: '600', color: 'var(--ink)', marginTop: '2px' }}>
                              {p.value} <span style={{ fontWeight: 'normal', color: 'var(--ink-soft)' }}>{p.unit}</span>
                            </div>
                            {p.notes && (
                              <div style={{ fontSize: '10.5px', color: '#915a13', marginTop: '2px' }}>
                                * {p.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'cleanroom' && (
                <div>
                  <p className="note" style={{ marginBottom: '14px' }}>
                    Airborne particulate cleanliness classes under ISO 14644-1 and equivalent US Federal Standard 209E.
                  </p>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--panel-subtle)' }}>
                        <th style={{ padding: '8px 10px' }}>ISO Class</th>
                        <th style={{ padding: '8px 10px' }}>Fed Std 209E</th>
                        <th style={{ padding: '8px 10px' }}>Max ≥0.1 µm / m³</th>
                        <th style={{ padding: '8px 10px' }}>Max ≥0.5 µm / m³</th>
                        <th style={{ padding: '8px 10px' }}>Application</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CLEANROOM_STANDARDS.map((s, idx) => (
                        <tr
                          key={s.isoClass}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: idx % 2 === 0 ? 'transparent' : 'var(--panel-subtle)',
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontWeight: '600' }}>{s.isoClass}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--ink-soft)' }}>{s.fedStd}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{s.max01um}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{s.max05um}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--ink-soft)' }}>{s.application}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
