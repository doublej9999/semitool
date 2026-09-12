import type { Metadata } from 'next';
import type { Tool } from '@/tools/tools.types';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

/**
 * Builds the dynamic OG-image route URL. Rendered by `src/app/api/og/route.tsx`
 * with next/og; keeps text ASCII-safe so the default font renders every glyph.
 */
export function ogImageUrl(params: { title: string; category?: string }): string {
  const search = new URLSearchParams({ title: params.title });
  if (params.category) search.set('category', params.category);
  return `/api/og?${search.toString()}`;
}

/**
 * Canonical metadata for a tool page: title/description/keywords from the
 * registry entry, canonical URL, and OG + Twitter cards pointing at the
 * dynamically generated OG image.
 */
export function buildToolMetadata(tool: Tool): Metadata {
  const ogImage = ogImageUrl({ title: tool.name, category: tool.category });
  const ogTitle = `${tool.name} — ${SITE_NAME}`;
  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: tool.path },
    openGraph: {
      title: ogTitle,
      description: tool.description,
      url: absoluteUrl(tool.path),
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: tool.description,
      images: [ogImage],
    },
  };
}
