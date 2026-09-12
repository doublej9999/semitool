'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function NotFoundPageContent() {
  const locale = useLocale();
  const t = getTranslation(locale);

  return (
    <div className="prose-page">
      <p className="eyebrow">{t.notFoundEyebrow}</p>
      <h1>{t.notFoundHeading}</h1>
      <p>{t.notFoundLead}</p>
      <p>
        <Link className="button primary" href="/tools">
          {t.notFoundBrowseBtn} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}
