'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ensureDictionary, isDictionaryLoaded } from './translations';
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
  void Promise.all([ensureDictionary(locale), ensureToolTranslations(locale)]).then(() => {
    if (currentLocale === locale) {
      readyLocale = locale;
      notify();
    }
  });
}

/**
 * Maps an ISO 3166-1 alpha-2 country code (from IP geolocation) or navigator.language
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
 * Fallback detection from browser languages (navigator.languages) if IP lookup is unavailable.
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

/**
 * Detects visitor location by calling lightweight, non-blocking Geo IP API endpoint,
 * with fast fallback to browser languages.
 */
async function detectGeoLocale(): Promise<SupportedLocale> {
  try {
    // Non-blocking geo-detection from free fast GeoIP
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.country_code === 'string') {
        return matchLocaleFromCountry(data.country_code);
      }
    }
  } catch {
    // Network or CORS error: fallback to browser language
  }

  if (typeof navigator !== 'undefined' && navigator.languages) {
    return matchLocaleFromBrowser(navigator.languages);
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
 * 2. If first visit, detects location via IP, falling back to navigator.languages.
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

    // First visit: detect via IP
    detectGeoLocale().then((detected) => {
      setLocale(detected, true);
    });
  }, []);
}
