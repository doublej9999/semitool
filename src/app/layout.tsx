import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import AppShell from '@/components/shell/AppShell';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { ogImageUrl } from '@/lib/seo';
import 'katex/dist/katex.min.css';
import './globals.css';

const defaultOgImage = ogImageUrl({ title: 'Semiconductor Engineering Tools' });

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
    images: [{ url: defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Semiconductor Engineering Tools`,
    description: SITE_DESCRIPTION,
    images: [defaultOgImage],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // No-flash theme bootstrap: resolves the persisted setting ('light' | 'dark' |
  // 'system') and paints <html data-theme> before first render. Must stay plain
  // and tiny — it runs before hydration, so it cannot use store code.
  const themeBootstrap =
    "try{var t=localStorage.getItem('semitools:theme');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}";

  return (
    // suppressHydrationWarning: the inline bootstrap legitimately mutates
    // data-theme before React hydrates — the mismatch on <html> is by design.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        {/* Dormant anonymous analytics: Cloudflare Web Analytics is cookie-free
            and aggregates page-view counts only (no personal data, no
            fingerprinting). The beacon renders ONLY when
            NEXT_PUBLIC_CF_BEACON_TOKEN is set at build time — unset (the
            default) nothing renders: zero requests, zero DOM change. The
            matching conditional CSP lives in next.config.ts. */}
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? (
          <Script
            defer
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
