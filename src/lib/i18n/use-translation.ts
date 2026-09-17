'use client';

import { useLocale } from './context';
import { getTranslation } from './translations';
import type { Translations } from './types';

/**
 * Reactive shell/product dictionary for client components. The returned object is
 * the source-locale (English) dictionary until the visitor's locale chunk has
 * loaded, which keeps the server HTML and the first client render identical.
 */
export function useTranslation(): Translations {
  return getTranslation(useLocale());
}
