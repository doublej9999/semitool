'use client';

// Last-resort boundary: replaces the root layout when it or the template
// crashes, so it must render its own <html>/<body> and cannot rely on
// globals.css — every style below is inline. The light palette mirrors the
// app's light tokens; the theme bootstrap script does not run here.
// Recovers with reset(); "Go home" is a plain <a> because a full document
// navigation is the only reliable escape when the root layout is broken.
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <h1 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64737b' }}>
            A critical error interrupted the app. Try again, or go home.
          </p>
          {error.digest ? (
            <p style={{ margin: 0, fontSize: 12.5, color: '#64737b' }}>
              Error ID:{' '}
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
              Try again
            </button>
            {/* Intentional plain <a>: the root layout has already crashed, so a
                full document navigation is the reliable way home — next/link
                would depend on the very router that just failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate full document navigation, see comment above */}
            <a
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
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
