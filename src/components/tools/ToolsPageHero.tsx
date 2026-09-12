'use client';

import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { tools } from '@/tools';

export default function ToolsPageHero() {
  const locale = useLocale();
  const t = getTranslation(locale);

  return (
    <header className="page-hero">
      <p className="kicker">{t.toolsPageKicker}</p>
      <h1>{t.toolsPageTitle}</h1>
      <p className="lead">
        {tools.length} {t.toolsPageLead}
      </p>
    </header>
  );
}
