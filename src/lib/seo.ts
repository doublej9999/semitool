import type { Metadata } from 'next';
import type { Tool } from '@/tools/tools.types';
import type { SupportedLocale } from '@/lib/i18n/context';
import { getTranslatedTool } from '@/lib/i18n/tool-translations';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

/**
 * Builds the dynamic OG-image route URL. Rendered by `src/app/api/og/route.tsx`
 * with next/og. URLSearchParams safely encodes localized titles and labels.
 */
export function ogImageUrl(params: { title: string; category?: string; tagline?: string }): string {
  const search = new URLSearchParams({ title: params.title });
  if (params.category) search.set('category', params.category);
  if (params.tagline) search.set('tagline', params.tagline);
  return `/api/og?${search.toString()}`;
}

/**
 * Canonical metadata for a tool page. The optional locale is intentionally
 * explicit: route metadata is generated on the server and cannot read the
 * browser's localStorage preference. Client surfaces can pass the active
 * locale when updating metadata after hydration; omitted keeps the stable
 * English default used by crawlers and canonical URLs.
 */
export function buildToolMetadata(tool: Tool, locale?: SupportedLocale): Metadata {
  const translated = locale ? getTranslatedTool(tool, locale) : tool;
  const ogImage = ogImageUrl({ title: translated.name, category: tool.category });
  const ogTitle = `${translated.name} — ${SITE_NAME}`;
  return {
    title: translated.name,
    description: translated.description,
    keywords: translated.keywords,
    alternates: { canonical: tool.path },
    openGraph: {
      title: ogTitle,
      description: translated.description,
      url: absoluteUrl(tool.path),
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: translated.description,
      images: [ogImage],
    },
  };
}
