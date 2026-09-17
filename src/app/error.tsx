'use client';

// Route-segment error boundary: when a client runtime error escapes a page,
// this replaces the page content while the app shell (sidebar, toolbar) from
// the root layout keeps rendering — errors in the root layout itself are
// handled by global-error.tsx instead.
import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = getTranslation(useLocale());

  useEffect(() => {
    // Surface the boundary error in the browser console (React docs pattern).
    // No remote reporting: the app is privacy-first and fully client-side.
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
        <h1 style={{ margin: 0, fontSize: 22 }}>{t.errorHeading}</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>{t.errorLead}</p>
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
