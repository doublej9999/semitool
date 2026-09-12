'use client';

import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function I18nHeading({
  id,
  translationKey,
  fallback,
}: {
  id?: string;
  translationKey: 'formulaMethod' | 'notesAssumptions' | 'faq' | 'relatedTools';
  fallback: string;
}) {
  const locale = useLocale();
  const t = getTranslation(locale);
  return <h2 id={id}>{t[translationKey] || fallback}</h2>;
}
