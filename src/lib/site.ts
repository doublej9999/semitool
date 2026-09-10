/**
 * Single source of truth for absolute URLs.
 *
 * The canonical host is overridable through `NEXT_PUBLIC_SITE_URL` so that a
 * custom domain can be attached later without touching metadata, the sitemap or
 * robots.txt. The default matches the current production deployment.
 */
const fallbackUrl = 'https://semitool.vercel.app';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/+$/, '');

export const SITE_NAME = 'SemiTools';

export const SITE_DESCRIPTION =
  'Free, transparent semiconductor engineering calculators for wafer marks, die count, wafer maps and yield. Client-side, no login.';

export const REPO_URL = 'https://github.com/doublej9999/semitool';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
