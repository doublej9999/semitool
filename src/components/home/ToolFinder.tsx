'use client';

import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import ToolCard from '@/components/tools/ToolCard';
import { tools } from '@/tools';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { findToolsForQuery, type ToolMatch } from '@/lib/tool-finder';

const EXAMPLE_QUERY = 'how many dies fit on a 300mm wafer';

/**
 * Home-page "AI Semiconductor Assistant" section: describe a task in plain
 * language (English, Chinese, Japanese or Korean) and get the top registry
 * matches. Fully local — the matching runs in findToolsForQuery against the
 * localized registry metadata, no API calls and nothing leaves the browser.
 *
 * Heading/copy note: no existing generic dictionary key fits this section's
 * title, and new keys are not allowed, so the heading and the button keep
 * English copy; the result summary and the empty state reuse the existing
 * `results` / `noToolMatches` keys so they stay localized.
 */
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
          <h2 id="tool-finder-heading">Describe your task &mdash; we&apos;ll find the tool</h2>
          <p>
            Plain language in, calculator out: try &ldquo;{EXAMPLE_QUERY}&rdquo; or a note in your own
            language. Everything runs locally in your browser.
          </p>
        </div>
      </div>

      <form className="field" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="tool-finder-input">
          Describe your task
        </label>
        <textarea
          id="tool-finder-input"
          name="task"
          rows={2}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`e.g. ${EXAMPLE_QUERY}`}
        />
        <div style={{ marginTop: 10 }}>
          <button className="button primary" type="submit">
            <Sparkles size={15} aria-hidden="true" /> Find tools
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
