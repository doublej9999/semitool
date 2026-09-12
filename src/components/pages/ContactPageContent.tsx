'use client';

import { REPO_URL } from '@/lib/site';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function ContactPageContent() {
  const locale = useLocale();
  const t = getTranslation(locale);

  return (
    <div className="prose-page">
      <div className="eyebrow">{t.contactEyebrow}</div>
      <h1>{t.contactHeading}</h1>
      <p>{t.contactLead}</p>

      <ul className="contact-list">
        <li>
          <strong>{t.contactBugTitle}</strong>
          <br />
          <a className="text-link" href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">
            {t.contactBugLink}
          </a>
        </li>
        <li>
          <strong>{t.contactSourceTitle}</strong>
          <br />
          <a className="text-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            github.com/doublej9999/semitool
          </a>
        </li>
      </ul>

      <h2>{t.contactReportTitle}</h2>
      <p>{t.contactReportText}</p>
    </div>
  );
}
