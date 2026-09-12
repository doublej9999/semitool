import type { SupportedLocale } from './context';
import type { Tool } from '@/tools/tools.types';
import type { ToolTranslation } from './types';
import { en } from './tool-dictionaries/en';

export type { ToolTranslation } from './types';

// Like translations.ts: English ships eagerly, other locales load on demand.
const cache: Partial<Record<SupportedLocale, Record<string, ToolTranslation>>> = { en };

const TOOL_DICTIONARY_LOADERS: Record<SupportedLocale, () => Promise<Record<string, ToolTranslation>>> = {
  en: () => Promise.resolve(en),
  'zh-CN': () => import('./tool-dictionaries/zh-CN').then((m) => m.zhCN),
  'zh-TW': () => import('./tool-dictionaries/zh-TW').then((m) => m.zhTW),
  ko: () => import('./tool-dictionaries/ko').then((m) => m.ko),
  ja: () => import('./tool-dictionaries/ja').then((m) => m.ja),
};

export function isToolDictionaryLoaded(locale: SupportedLocale): boolean {
  return Boolean(cache[locale]);
}

/** Installs a tool-translation map into the sync cache. Used by the lazy loader and by tests. */
export function registerToolTranslations(locale: SupportedLocale, map: Record<string, ToolTranslation>): void {
  cache[locale] = map;
}

export function getToolTranslations(locale: SupportedLocale): Record<string, ToolTranslation> {
  return cache[locale] ?? {};
}

export async function ensureToolTranslations(locale: SupportedLocale): Promise<void> {
  if (cache[locale]) return;
  try {
    registerToolTranslations(locale, await TOOL_DICTIONARY_LOADERS[locale]());
  } catch (error) {
    console.error(`[i18n] failed to load tool translations for ${locale}`, error);
  }
}

export function getTranslatedTool(
  tool: Tool,
  locale: SupportedLocale,
): { name: string; description: string; keywords: string[] } {
  const dict = cache[locale];
  if (dict && dict[tool.path]) {
    return {
      name: dict[tool.path].name,
      description: dict[tool.path].description,
      keywords: dict[tool.path].keywords || tool.keywords,
    };
  }
  return {
    name: tool.name,
    description: tool.description,
    keywords: tool.keywords,
  };
}

export function translateToolName(path: string, locale: SupportedLocale): string {
  const dict = cache[locale];
  if (dict && dict[path]) {
    return dict[path].name;
  }
  return path;
}
