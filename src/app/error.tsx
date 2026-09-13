'use client';

// Route-segment error boundary: when a client runtime error escapes a page,
// this replaces the page content while the app shell (sidebar, toolbar) from
// the root layout keeps rendering — errors in the root layout itself are
// handled by global-error.tsx instead.
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <h1 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
          An unexpected error interrupted this page. Nothing was lost — every
          calculation runs in your browser. Try again, or head back home.
        </p>
        {error.digest ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
            Error ID: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="action-row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <button type="button" className="button primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="button secondary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
