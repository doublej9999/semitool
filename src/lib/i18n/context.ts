'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ensureDictionary, isDictionaryLoaded } from './translations';
import { ensureGlossary } from './glossary';
import { ensureToolTranslations } from './tool-translations';

export type SupportedLocale = 'en' | 'zh-CN' | 'zh-TW' | 'ko' | 'ja';

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export const LOCALE_STORAGE_KEY = 'semitools:locale';
export const DEFAULT_LOCALE: SupportedLocale = 'en';

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
// The locale whose dictionary chunk has actually loaded. Components render this
// locale (falling back to English copy until then) so the UI never mixes halves
// of two dictionaries; useLocale() flips once the chunk arrives.
let readyLocale: SupportedLocale = DEFAULT_LOCALE;
let isHydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function loadLocaleDictionary(locale: SupportedLocale) {
  if (isDictionaryLoaded(locale)) {
    if (readyLocale !== locale) {
      readyLocale = locale;
      notify();
    }
    return;
  }
  void Promise.all([ensureDictionary(locale), ensureToolTranslations(locale), ensureGlossary(locale)]).then(() => {
    if (currentLocale === locale) {
      readyLocale = locale;
      notify();
    }
  });
}

/**
 * Maps an ISO 3166-1 alpha-2 country code or navigator.language
 * to our supported languages.
 *
 * Country mapping:
 * - CN -> zh-CN (Simplified Chinese)
 * - TW, HK, MO -> zh-TW (Traditional Chinese)
 * - KR -> ko (Korean)
 * - JP -> ja (Japanese)
 * - Any other country -> en (Default English)
 */
export function matchLocaleFromCountry(countryCode: string): SupportedLocale {
  const upper = countryCode.trim().toUpperCase();
  if (upper === 'CN') return 'zh-CN';
  if (upper === 'TW' || upper === 'HK' || upper === 'MO') return 'zh-TW';
  if (upper === 'KR') return 'ko';
  if (upper === 'JP') return 'ja';
  return 'en';
}

/**
 * Detects the locale from the browser's language preferences
 * (navigator.languages). Used for first-visit locale detection.
 */
export function matchLocaleFromBrowser(languages: readonly string[]): SupportedLocale {
  for (const lang of languages) {
    const lower = lang.toLowerCase();
    if (lower.startsWith('zh-cn') || lower === 'zh' || lower.startsWith('zh-hans') || lower.startsWith('zh-sg')) {
      return 'zh-CN';
    }
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-hant') || lower.startsWith('zh-mo')) {
      return 'zh-TW';
    }
    if (lower.startsWith('ko')) {
      return 'ko';
    }
    if (lower.startsWith('ja')) {
      return 'ja';
    }
    if (lower.startsWith('en')) {
      return 'en';
    }
  }
  return 'en';
}

export function setLocale(locale: SupportedLocale, persist = true) {
  currentLocale = locale;
  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Storage unavailable
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  loadLocaleDictionary(locale);
}

export function useLocale(): SupportedLocale {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => readyLocale,
    () => DEFAULT_LOCALE,
  );
}

/**
 * Initializes locale on client mount:
 * 1. Checks localStorage for existing user memory.
 * 2. On first visit, detects the locale from the browser's language
 *    preferences (navigator.languages) — nothing leaves the browser.
 * 3. Saves choice to localStorage.
 */
export function useHydrateLocale() {
  useEffect(() => {
    if (isHydrated) return;
    isHydrated = true;

    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
      if (saved && SUPPORTED_LOCALES.some((item) => item.code === saved)) {
        setLocale(saved, false);
        return;
      }
    } catch {
      // Ignore storage error
    }

    // First visit: detect from the browser's language preferences.
    const detected = matchLocaleFromBrowser(
      typeof navigator !== 'undefined' && navigator.languages ? navigator.languages : [],
    );
    setLocale(detected, true);
  }, []);
}
