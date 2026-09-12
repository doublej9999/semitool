'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import {
  SUPPORTED_LOCALES,
  useLocale,
  setLocale,
  type SupportedLocale,
} from '@/lib/i18n/context';

export default function LanguagePicker() {
  const currentLocale = useLocale();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = SUPPORTED_LOCALES.find((item) => item.code === currentLocale) ?? SUPPORTED_LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (locale: SupportedLocale) => {
    setLocale(locale, true);
    setOpen(false);
  };

  return (
    <div className="lang-picker-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-button lang-picker-btn"
        aria-label="Change language / 切换语言"
        title="Change language / 语言切换"
        onClick={() => setOpen((prev) => !prev)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
      >
        <Globe size={16} aria-hidden="true" />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>{selected.flag}</span>
      </button>

      {open && (
        <div
          className="lang-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--card)',
            border: '1px solid var(--line-strong)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            padding: '4px',
            minWidth: '130px',
            zIndex: 1000,
          }}
        >
          {SUPPORTED_LOCALES.map((item) => {
            const isSelected = item.code === currentLocale;
            return (
              <button
                key={item.code}
                type="button"
                className={`lang-option ${isSelected ? 'is-active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '13px',
                  background: isSelected ? 'var(--teal-soft)' : 'transparent',
                  color: isSelected ? 'var(--teal-dark)' : 'var(--ink)',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onClick={() => handleSelect(item.code)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </span>
                {isSelected && <Check size={14} color="var(--teal)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
