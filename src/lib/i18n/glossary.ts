import { useCallback } from 'react';
import { useLocale } from './context';
import { en, GLOSSARY } from './glossary/en';
import type { SupportedLocale } from './context';

export type GlossaryKey = keyof typeof GLOSSARY;

// Like translations.ts: English ships eagerly, other locales load on demand
// (context.ts pulls the glossary chunk alongside the dictionary chunk).
const cache: Partial<Record<SupportedLocale, Record<string, string>>> = { en };

const GLOSSARY_LOADERS: Record<SupportedLocale, () => Promise<Record<string, string>>> = {
  en: () => Promise.resolve(en),
  'zh-CN': () => import('./glossary/zh-CN').then((m) => m.GLOSSARY_ZH_CN),
  'zh-TW': () => import('./glossary/zh-TW').then((m) => m.GLOSSARY_ZH_TW),
  ko: () => import('./glossary/ko').then((m) => m.GLOSSARY_KO),
  ja: () => import('./glossary/ja').then((m) => m.GLOSSARY_JA),
};

export function isGlossaryLoaded(locale: SupportedLocale): boolean {
  return Boolean(cache[locale]);
}

/** Installs a glossary into the sync cache. Used by the lazy loader and by tests. */
export function registerGlossary(locale: SupportedLocale, map: Record<string, string>): void {
  cache[locale] = map;
}

export function getGlossaryTerm(locale: SupportedLocale, key: string): string {
  return cache[locale]?.[key] ?? en[key] ?? key;
}

export async function ensureGlossary(locale: SupportedLocale): Promise<void> {
  if (cache[locale]) return;
  try {
    registerGlossary(locale, await GLOSSARY_LOADERS[locale]());
  } catch (error) {
    console.error(`[i18n] failed to load glossary for ${locale}`, error);
  }
}

/**
 * Returns a lookup function for shared fab-term labels: `const g = useGlossary(); g('waferDiameter')`.
 * Falls back to English while the locale chunk loads, then to the key itself for unknown keys.
 */
export function useGlossary(): (key: GlossaryKey) => string {
  const locale = useLocale();
  return useCallback((key: GlossaryKey) => getGlossaryTerm(locale, key), [locale]);
}
