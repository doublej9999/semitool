'use client';

/**
 * Heavy UI for the command palette (overlay, combobox input, results listbox),
 * lazily loaded by `CommandPalette` (next/dynamic) so it stays out of every
 * page bundle. The palette wrapper owns the open state, the trigger button,
 * the global Ctrl+K / '/' shortcut listener, and focus restore to the trigger.
 *
 * This panel mounts only while the palette is open — which is also why the
 * input auto-focus lives here: on the very first open the chunk may still be
 * loading when `open` flips true, so focusing the input must happen after this
 * component mounts, not in the wrapper.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, FileText, Search, X } from 'lucide-react';
import { tools } from '@/tools';
import { groupByCategory, searchTools } from '@/lib/search';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation, translateCategory, type Translations } from '@/lib/i18n/translations';
import { getTranslatedTool } from '@/lib/i18n/tool-translations';
import { REPO_URL } from '@/lib/site';
import type { Tool } from '@/tools/tools.types';

interface QuickLink {
  name: string;
  description: string;
  href: string;
  keywords: string[];
  external?: boolean;
}

function getQuickLinks(t: Translations): QuickLink[] {
  return [
    { name: t.cmdAllTools, description: t.cmdAllToolsDesc, href: '/tools', keywords: ['index', 'browse', 'catalog', 'list'] },
    { name: t.cmdAbout, description: t.cmdAboutDesc, href: '/about', keywords: ['about', 'method', 'disclaimer'] },
    { name: t.cmdPrivacy, description: t.cmdPrivacyDesc, href: '/privacy', keywords: ['privacy', 'data', 'gdpr'] },
    { name: t.cmdContact, description: t.cmdContactDesc, href: '/contact', keywords: ['contact', 'email', 'feedback'] },
    { name: t.cmdGithub, description: t.cmdGithubDesc, href: REPO_URL, keywords: ['github', 'source', 'code', 'issues'], external: true },
  ];
}

type PaletteEntry =
  | { kind: 'tool'; id: string; tool: Tool }
  | { kind: 'link'; id: string; link: QuickLink };

interface CommandPalettePanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Command palette panel with fuzzy search (combobox pattern).
 *
 * Keyboard support (the global open/close shortcuts live in the wrapper):
 * - ArrowUp / ArrowDown / Home / End move the highlighted entry;
 * - Enter opens the highlighted entry, Escape closes (focus restore to the
 *   trigger is handled by the wrapper's open-state effect).
 */
export default function CommandPalettePanel({ open, onClose }: CommandPalettePanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const locale = useLocale();
  const t = getTranslation(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matchingTools = useMemo(() => searchTools(query, tools, locale), [query, locale]);

  const groups = useMemo(() => groupByCategory(matchingTools, 5), [matchingTools]);

  const quickLinks = useMemo(() => getQuickLinks(t), [t]);

  const matchingLinks = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (trimmed.length === 0) {
      return quickLinks;
    }

    return quickLinks.filter(
      (link) =>
        link.name.toLowerCase().includes(trimmed) ||
        link.keywords.some((keyword) => keyword.includes(trimmed)),
    );
  }, [query, quickLinks]);

  const entries = useMemo<PaletteEntry[]>(
    () => [
      ...groups.flatMap((group) => group.tools.map((tool) => ({ kind: 'tool' as const, id: `tool:${tool.path}`, tool }))),
      ...matchingLinks.map((link) => ({ kind: 'link' as const, id: `link:${link.href}`, link })),
    ],
    [groups, matchingLinks],
  );

  const runEntry = useCallback(
    (entry: PaletteEntry) => {
      // Closing first unmounts this panel and lets the wrapper restore focus
      // to the trigger, exactly like the previous single-component version.
      if (entry.kind === 'tool') {
        onClose();
        router.push(entry.tool.path);
        return;
      }

      if (entry.link.external) {
        window.open(entry.link.href, '_blank', 'noopener,noreferrer');
        onClose();
        return;
      }

      onClose();
      router.push(entry.link.href);
    },
    [onClose, router],
  );

  // Move focus into the combobox as soon as the panel is mounted (first open
  // may land after the lazy chunk finished loading).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation inside the palette.
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (entries.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % entries.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + entries.length) % entries.length);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(entries.length - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const entry = entries[Math.min(activeIndex, entries.length - 1)];

        if (entry) {
          runEntry(entry);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, onClose, entries, open, runEntry]);

  // Keep the highlighted option visible while arrowing through the list.
  useEffect(() => {
    if (!open) {
      return;
    }

    const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const activeOptionId = entries[activeIndex] ? `palette-option-${activeIndex}` : undefined;

  return (
    <div className="palette-overlay" role="presentation">
      <button type="button" className="palette-backdrop" aria-label={t.cmdClose} onClick={onClose} />

      <div className="palette-panel" role="dialog" aria-modal="true" aria-label={t.cmdTools}>
        <div className="palette-field">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={t.cmdPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
          />
          <button type="button" className="palette-close" onClick={onClose} aria-label={t.cmdClose}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <ul id="palette-results" role="listbox" aria-label="Search results" ref={listRef} className="palette-list">
          {entries.length === 0 ? (
            <li className="palette-empty">{t.cmdNoResults} “{query}”.</li>
          ) : (
            entries.map((entry, index) => {
              const isActive = index === activeIndex;

              if (entry.kind === 'tool') {
                const Icon = entry.tool.icon;
                const toolInfo = getTranslatedTool(entry.tool, locale);
                return (
                  <li
                    key={entry.id}
                    id={`palette-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    className={`palette-option${isActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runEntry(entry)}
                  >
                    <span className="palette-option-icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <span className="palette-option-text">
                      <span className="palette-option-name">
                        {toolInfo.name}
                        {entry.tool.isNew ? <em className="badge-new">{t.newBadge}</em> : null}
                      </span>
                      <span className="palette-option-desc">{toolInfo.description}</span>
                    </span>
                    <span className="palette-option-cat">{translateCategory(entry.tool.category, locale)}</span>
                  </li>
                );
              }

              return (
                <li
                  key={entry.id}
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  className={`palette-option${isActive ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runEntry(entry)}
                >
                  <span className="palette-option-icon" aria-hidden="true">
                    <FileText size={16} />
                  </span>
                  <span className="palette-option-text">
                    <span className="palette-option-name">{entry.link.name}</span>
                    <span className="palette-option-desc">{entry.link.description}</span>
                  </span>
                </li>
              );
            })
          )}
        </ul>

        <div className="palette-hint">
          <span className="palette-hint-count">
            {entries.length} result{entries.length === 1 ? '' : 's'}
          </span>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t.cmdNavigate}
          </span>
          <span>
            <kbd>
              <CornerDownLeft size={11} aria-hidden="true" />
            </kbd>{' '}
            {t.cmdOpen}
          </span>
          <span>
            <kbd>Esc</kbd> {t.cmdClose}
          </span>
        </div>
      </div>
    </div>
  );
}
