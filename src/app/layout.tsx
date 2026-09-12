import type { Metadata } from 'next';
import AppShell from '@/components/shell/AppShell';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Semiconductor Engineering Tools`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'semiconductor calculator',
    'wafer map',
    'gross die per wafer',
    'wafer mark',
    'yield calculator',
    'edge exclusion',
    'die per wafer estimate',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — Semiconductor Engineering Tools`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Semiconductor Engineering Tools`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
