'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ToolCard from './ToolCard';
import { groupByCategory, searchTools } from '@/lib/search';
import { tools } from '@/tools';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation, translateCategory } from '@/lib/i18n/translations';

function categoryId(category: string): string {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Client-side filter over the tool registry. The unfiltered list is rendered on
 * the server as well (empty query returns every tool), so /tools stays crawlable.
 */
export default function ToolExplorer() {
  const [query, setQuery] = useState('');
  const locale = useLocale();
  const t = getTranslation(locale);
  const groups = useMemo(() => groupByCategory(searchTools(query, tools, locale)), [query, locale]);

  return (
    <div>
      <div className="explorer-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder || "Filter tools: name, keyword or unit"}
          aria-label="Filter tools"
        />
      </div>

      {groups.length === 0 ? (
        <p className="empty-state">
          No tool matches “{query.trim()}”. Try “wafer”, “die”, “yield”, “mark”, “mm” or “export”.
        </p>
      ) : (
        groups.map((group) => (
          <section className="category-section" key={group.category} aria-labelledby={categoryId(group.category)}>
            <h2 id={categoryId(group.category)}>{translateCategory(group.category, locale)}</h2>
            <div className="tool-grid">
              {group.tools.map((tool) => (
                <ToolCard key={tool.path} path={tool.path} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
