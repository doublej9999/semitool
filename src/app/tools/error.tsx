'use client';

// Scoped boundary for the /tools segment: a crashing calculator only
// replaces the tool content, so the sidebar shell (rendered by the root
// layout) survives. The app-wide fallback lives in src/app/error.tsx.
import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = getTranslation(useLocale());

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '55vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="panel"
        style={{
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>{t.toolsErrorHeading}</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>{t.toolsErrorLead}</p>
        {error.digest ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
            {t.errorId}: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="action-row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <button type="button" className="button primary" onClick={() => reset()}>
            {t.errorTryAgain}
          </button>
          <Link href="/" className="button secondary">
            {t.errorGoHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
