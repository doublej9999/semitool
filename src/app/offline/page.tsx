import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="prose-page">
      <p className="eyebrow">Offline</p>
      <h1>You&apos;re offline</h1>
      <p>
        This page hasn&apos;t been cached yet. Previously visited tools still work offline.
      </p>
      <p>
        <Link className="button primary" href="/">
          Go to the homepage
        </Link>{' '}
        <Link className="button secondary" href="/tools">
          Browse tools
        </Link>
      </p>
    </div>
  );
}
