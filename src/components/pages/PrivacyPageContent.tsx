'use client';

import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import PrivacyDataSection from './PrivacyDataSection';

export default function PrivacyPageContent() {
  const locale = useLocale();
  const t = getTranslation(locale);

  return (
    <div className="prose-page">
      <div className="eyebrow">{t.privacyEyebrow}</div>
      <h1>{t.privacyHeading}</h1>
      <p>{t.privacyLead}</p>

      <h2>{t.privacySec1Title}</h2>
      <p>{t.privacySec1Text}</p>

      <PrivacyDataSection />

      <h2>{t.privacySec2Title}</h2>
      <p>{t.privacySec2Text}</p>

      <h2>{t.privacySec3Title}</h2>
      <p>{t.privacySec3Text}</p>
    </div>
  );
}
