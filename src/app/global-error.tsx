'use client';

// Last-resort boundary: replaces the root layout when it or the template
// crashes, so it must render its own <html>/<body> and cannot rely on
// globals.css — every style below is inline. The light palette mirrors the
// app's light tokens; the theme bootstrap script does not run here.
import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
export default function GlobalError({
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
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f4f6f5',
          color: '#152127',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 15,
          lineHeight: 1.6,
        }}
      >
        <main
          style={{
            maxWidth: 460,
            width: '100%',
            boxSizing: 'border-box',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: 28,
            background: '#ffffff',
            border: '1px solid #dbe2e4',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(21, 33, 39, 0.09)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>{t.errorHeading}</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64737b' }}>{t.errorLead}</p>
          {error.digest ? (
            <p style={{ margin: 0, fontSize: 12.5, color: '#64737b' }}>
              {t.errorId}:{' '}
              <code
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.86em',
                  background: '#e6f2f2',
                  color: '#0a5f66',
                  padding: '1px 5px',
                  borderRadius: 5,
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid transparent',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: 500,
                cursor: 'pointer',
                background: '#0d7c82',
                color: '#ffffff',
              }}
            >
              {t.errorTryAgain}
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #c3cdd0',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: 500,
                cursor: 'pointer',
                background: '#ffffff',
                color: '#33454e',
                textDecoration: 'none',
              }}
            >
              {t.errorGoHome}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
