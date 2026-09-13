'use client';

import { REPO_URL } from '@/lib/site';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function AboutPageContent() {
  const locale = useLocale();
  const t = getTranslation(locale);

  return (
    <div className="prose-page">
      <div className="eyebrow">{t.aboutEyebrow}</div>
      <h1>{t.aboutHeading}</h1>
      <p>{t.aboutLead}</p>

      <h2>{t.aboutSec1Title}</h2>
      <p>{t.aboutSec1Text}</p>

      <h2>{t.aboutSec2Title}</h2>
      <p>{t.aboutSec2Text}</p>

      <h2>{t.aboutSec3Title}</h2>
      <p>
        {t.aboutSec3Text}{' '}
        <a className="text-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
