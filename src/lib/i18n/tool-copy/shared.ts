import type { CopyLocale, CopyMessages, CopyResource } from './types';

/** Shared validation/common copy; tool-specific strings belong to tool resources. */
export const SHARED_COPY: CopyResource = {
  'zh-CN': {},
  'zh-TW': {},
  ko: {},
  ja: {},
};

const SHARED_LOADERS: Record<CopyLocale, () => Promise<CopyMessages>> = {
  'zh-CN': () => import('./resources/shared/zh-CN').then((module) => module.SHARED_ZH_CN),
  'zh-TW': () => import('./resources/shared/zh-TW').then((module) => module.SHARED_ZH_TW),
  ko: () => import('./resources/shared/ko').then((module) => module.SHARED_KO),
  ja: () => import('./resources/shared/ja').then((module) => module.SHARED_JA),
};

const loadedLocales = new Set<CopyLocale>();
const pendingLoads: Partial<Record<CopyLocale, Promise<void>>> = {};

export function isSharedCopyLoaded(locale: CopyLocale): boolean {
  return loadedLocales.has(locale);
}

export function registerSharedCopy(locale: CopyLocale, messages: CopyMessages): void {
  SHARED_COPY[locale] = messages;
  loadedLocales.add(locale);
}

export function ensureSharedCopy(locale: CopyLocale): Promise<void> {
  if (loadedLocales.has(locale)) return Promise.resolve();
  if (pendingLoads[locale]) return pendingLoads[locale];

  const pending = SHARED_LOADERS[locale]()
    .then((messages) => {
      registerSharedCopy(locale, messages);
    })
    .catch((error) => {
      console.error(`[i18n] failed to load shared tool copy for ${locale}`, error);
    })
    .finally(() => {
      delete pendingLoads[locale];
    });
  pendingLoads[locale] = pending;
  return pending;
}
