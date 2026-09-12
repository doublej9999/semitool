'use client';

import ToolPageActions from './ToolPageActions';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation, translateCategory } from '@/lib/i18n/translations';
import { getTranslatedTool } from '@/lib/i18n/tool-translations';
import { getTool } from '@/tools';

export default function ToolPageHeader({ toolPath }: { toolPath: string }) {
  const tool = getTool(toolPath);
  const locale = useLocale();
  const t = getTranslation(locale);

  if (!tool) {
    return null;
  }

  const translated = getTranslatedTool(tool, locale);

  return (
    <header className="tool-page-header">
      <p className="eyebrow">
        {translateCategory(tool.category, locale)} / {tool.isNew ? (t.newBadge || 'NEW TOOL') : 'TOOL'}
      </p>
      <h1>{translated.name}</h1>
      <span className="tool-page-separator" aria-hidden="true" />
      <p className="tool-page-desc">{translated.description}</p>
      <ToolPageActions toolName={translated.name} />
    </header>
  );
}
