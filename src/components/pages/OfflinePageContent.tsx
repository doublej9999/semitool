'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function OfflinePageContent() {
  const t = getTranslation(useLocale());

  return (
    <div className="prose-page">
      <p className="eyebrow">{t.offlineEyebrow}</p>
      <h1>{t.offlineHeading}</h1>
      <p>{t.offlineLead}</p>
      <p>
        <Link className="button primary" href="/">
          {t.offlineHomeBtn}
        </Link>{' '}
        <Link className="button secondary" href="/tools">
          {t.offlineBrowseBtn}
        </Link>
      </p>
    </div>
  );
}
