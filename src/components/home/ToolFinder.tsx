'use client';

import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import ToolCard from '@/components/tools/ToolCard';
import { tools } from '@/tools';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { findToolsForQuery, type ToolMatch } from '@/lib/tool-finder';

const EXAMPLE_QUERY = 'how many dies fit on a 300mm wafer';

export default function ToolFinder() {
  const locale = useLocale();
  const t = getTranslation(locale);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ToolMatch[] | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMatches(findToolsForQuery(query, locale, tools));
  }

  return (
    <section className="section" aria-labelledby="tool-finder-heading">
      <div className="section-head">
        <div>
          <h2 id="tool-finder-heading">{t.toolFinderTitle}</h2>
          <p>{t.toolFinderLead.replace('{example}', EXAMPLE_QUERY)}</p>
        </div>
      </div>

      <form className="field" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="tool-finder-input">
          {t.toolFinderLabel}
        </label>
        <textarea
          id="tool-finder-input"
          name="task"
          rows={2}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.toolFinderPlaceholder.replace('{example}', EXAMPLE_QUERY)}
        />
        <div style={{ marginTop: 10 }}>
          <button className="button primary" type="submit">
            <Sparkles size={15} aria-hidden="true" /> {t.toolFinderSubmit}
          </button>
        </div>
      </form>

      {matches === null ? null : matches.length > 0 ? (
        <div>
          <p>
            <strong>{matches.length}</strong> {t.results}
          </p>
          <div className="tool-grid">
            {matches.map((match) => (
              <ToolCard key={match.tool.path} path={match.tool.path} />
            ))}
          </div>
        </div>
      ) : (
        <p>{t.noToolMatches}</p>
      )}
    </section>
  );
}
