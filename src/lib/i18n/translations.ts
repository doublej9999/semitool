import type { SupportedLocale } from './context';
import type { Translations } from './types';
import { en } from './dictionaries/en';

export type { Translations } from './types';

// Only the English dictionary ships in the initial bundle; every other locale is a
// dynamic chunk pulled in by ensureDictionary() when the user's locale is known.
const cache: Partial<Record<SupportedLocale, Translations>> = { en };

const DICTIONARY_LOADERS: Record<SupportedLocale, () => Promise<Translations>> = {
  en: () => Promise.resolve(en),
  'zh-CN': () => import('./dictionaries/zh-CN').then((m) => m.zhCN),
  'zh-TW': () => import('./dictionaries/zh-TW').then((m) => m.zhTW),
  ko: () => import('./dictionaries/ko').then((m) => m.ko),
  ja: () => import('./dictionaries/ja').then((m) => m.ja),
};

export function isDictionaryLoaded(locale: SupportedLocale): boolean {
  return Boolean(cache[locale]);
}

/** Installs a dictionary into the sync cache. Used by the lazy loader and by tests. */
export function registerDictionary(locale: SupportedLocale, dictionary: Translations): void {
  cache[locale] = dictionary;
}

export function getTranslation(locale: SupportedLocale): Translations {
  return cache[locale] ?? en;
}

export async function ensureDictionary(locale: SupportedLocale): Promise<void> {
  if (cache[locale]) return;
  try {
    registerDictionary(locale, await DICTIONARY_LOADERS[locale]());
  } catch (error) {
    console.error(`[i18n] failed to load dictionary for ${locale}`, error);
  }
}

export function translateCategory(categoryName: string, locale: SupportedLocale): string {
  const t = getTranslation(locale);
  switch (categoryName) {
    case 'Wafer & Die':
      return t.catWaferDie;
    case 'Yield & Quality':
      return t.catYieldQuality;
    case 'Metrology & Layout':
      return t.catMetrologyLayout;
    case 'Thin Film & Deposition':
      return t.catThinFilmDeposition;
    case 'Thermal & Diffusion':
      return t.catThermalDiffusion;
    case 'Lithography & Etch':
      return t.catLithographyEtch;
    case 'RF & Signal':
      return t.catRFSignal;
    case 'Unit Conversion':
      return t.catUnitConversion;
    case 'Mark & Traceability':
      return t.catMarkTraceability;
    case 'Wet Process & Clean':
      return t.catWetProcess;
    default:
      return categoryName;
  }
}
