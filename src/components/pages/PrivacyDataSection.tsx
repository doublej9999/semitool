'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { clearUserData, collectUserData, describeUserDataKeys } from '@/lib/user-data';
import { loadCachedStdf } from '@/tools/stdf-klarf-explorer/idb';

/**
 * Privacy page section: inventory of everything SemiTools keeps on the device,
 * with a JSON export and a two-step "clear browsing data" action.
 *
 * The privacy page is dictionary-driven, but new dictionary keys are owned
 * elsewhere — so this section reuses the page's `getTranslation` pattern for
 * the generic "Export" label (t.fabWsExport) and keeps the remaining copy in
 * minimal inline English.
 */

const MANIFEST = describeUserDataKeys();

const BADGE_STYLE: CSSProperties = {
  display: 'inline-block',
  padding: '1px 8px',
  borderRadius: 999,
  border: '1px solid var(--line-strong)',
  fontSize: 11,
  color: 'var(--ink-soft)',
  whiteSpace: 'nowrap',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: '6px 12px',
};

const KEY_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 11.5,
  color: 'var(--muted)',
  wordBreak: 'break-all',
};

export default function PrivacyDataSection() {
  const locale = useLocale();
  const t = getTranslation(locale);

  // null until measured in the mount effect: server and first client render
  // must agree (localStorage is not readable during SSR).
  const [presence, setPresence] = useState<Record<string, boolean> | null>(null);
  const [idbPresent, setIdbPresent] = useState<boolean | null>(null);
  const [clearArmed, setClearArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const measurePresence = useCallback(() => {
    if (typeof window === 'undefined') return;
    const next: Record<string, boolean> = {};
    for (const info of MANIFEST) {
      try {
        next[info.key] = window.localStorage.getItem(info.key) !== null;
      } catch {
        next[info.key] = false;
      }
    }
    setPresence(next);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Deferred out of the effect body (react-hooks/set-state-in-effect): the
    // localStorage read happens after mount only, never during SSR render.
    queueMicrotask(measurePresence);

    let cancelled = false;
    void loadCachedStdf()
      .catch(() => null)
      .then((entry) => {
        if (!cancelled) setIdbPresent(entry !== null);
      });
    return () => {
      cancelled = true;
    };
  }, [measurePresence]);

  /** Same Blob + anchor download pattern as src/lib/export.ts downloadCsv. */
  const handleExport = useCallback(async () => {
    if (typeof window === 'undefined' || busy) return;
    setBusy(true);
    try {
      const data = await collectUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `semitools-user-data-${data.exportedAtIso.slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  /**
   * Two-step confirm: the first click only arms the button; the second clears
   * content (UI preferences are kept) and reloads so plain-component state
   * (scratchpad, traveler history) and any stale store memory re-read storage.
   */
  const handleClearClick = useCallback(async () => {
    if (typeof window === 'undefined' || busy) return;
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    setBusy(true);
    try {
      await clearUserData();
    } finally {
      window.location.reload();
    }
  }, [busy, clearArmed]);

  const presenceBadge = (present: boolean | null): CSSProperties => ({
    ...BADGE_STYLE,
    ...(present === null
      ? {}
      : present
        ? { borderColor: 'var(--teal)', color: 'var(--teal-dark, var(--teal))' }
        : { opacity: 0.65 }),
  });

  const presenceLabel = (present: boolean | null): string => {
    if (present === null) return '…';
    return present ? 'Stored' : 'Empty';
  };

  return (
    <>
      <h2>Your data, your control</h2>
      <p>
        Everything listed below is stored only in this browser — nothing is ever uploaded. You can
        download a JSON copy of all of it, or wipe it from this device. UI preferences such as your
        language and theme are kept when clearing.
      </p>

      <ul className="contact-list" style={{ fontSize: 13 }}>
        {MANIFEST.map((info) => {
          const present = presence ? presence[info.key] ?? null : null;
          return (
            <li key={info.key}>
              <div style={ROW_STYLE}>
                <strong style={{ color: 'var(--ink)' }}>{info.label}</strong>
                <span style={BADGE_STYLE}>{info.kind}</span>
                <span style={presenceBadge(present)}>{presenceLabel(present)}</span>
              </div>
              <code style={KEY_STYLE}>{info.key}</code>
            </li>
          );
        })}
        <li>
          <div style={ROW_STYLE}>
            <strong style={{ color: 'var(--ink)' }}>Cached STDF file summary (STDF / KLARF Explorer)</strong>
            <span style={BADGE_STYLE}>content</span>
            <span style={presenceBadge(idbPresent)}>{presenceLabel(idbPresent)}</span>
          </div>
          <code style={KEY_STYLE}>IndexedDB: semitools-stdf-cache</code>
        </li>
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        <button type="button" className="button primary" onClick={() => void handleExport()} disabled={busy}>
          {t.fabWsExport} all data (JSON)
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => void handleClearClick()}
          onBlur={() => setClearArmed(false)}
          disabled={busy}
          style={
            clearArmed
              ? { background: 'var(--red, #dc2626)', borderColor: 'var(--red, #dc2626)', color: '#fff' }
              : undefined
          }
        >
          {clearArmed ? 'Click again to confirm' : 'Clear browsing data'}
        </button>
      </div>
    </>
  );
}
