/**
 * Copy-layer types and interpolation.
 *
 * Kept free of React and of the 'use client' boundary so generated resource
 * modules, server components and scripts can all import it.
 */
import type { SupportedLocale } from '../context';

/** Locales that need an explicit translation map (English is the msgid). */
export type CopyLocale = Exclude<SupportedLocale, 'en'>;

export const COPY_LOCALES: readonly CopyLocale[] = ['zh-CN', 'zh-TW', 'ko', 'ja'];

export type CopyMessages = Record<string, string>;
export type CopyResource = Partial<Record<CopyLocale, CopyMessages>>;
export type CopyParams = Record<string, string | number>;

/** Replaces `{name}` placeholders; unknown placeholders are left untouched. */
export function interpolateCopy(template: string, params?: CopyParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

export function resolveCopyMessage(
  resource: CopyResource | undefined,
  shared: CopyMessages | undefined,
  locale: SupportedLocale,
  msgid: string,
  params?: CopyParams,
): string {
  if (locale === 'en') return interpolateCopy(msgid, params);
  const copyLocale = locale as CopyLocale;
  const raw = resource?.[copyLocale]?.[msgid];
  const text = raw && raw !== msgid ? raw : (shared?.[msgid] ?? raw ?? msgid);
  return interpolateCopy(text, params);
}
