'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, FileText, Search, X } from 'lucide-react';
import { tools } from '@/tools';
import { groupByCategory, searchTools } from '@/lib/search';
import { REPO_URL } from '@/lib/site';
import type { Tool } from '@/tools/tools.types';

interface QuickLink {
  name: string;
  description: string;
  href: string;
  keywords: string[];
  external?: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  { name: 'All tools', description: 'Browse every SemiTools calculator', href: '/tools', keywords: ['index', 'browse', 'catalog', 'list'] },
  { name: 'About SemiTools', description: 'How these calculations work and their limits', href: '/about', keywords: ['about', 'method', 'disclaimer'] },
  { name: 'Privacy', description: 'What data is and is not collected', href: '/privacy', keywords: ['privacy', 'data', 'gdpr'] },
  { name: 'Contact', description: 'Send a correction or feature request', href: '/contact', keywords: ['contact', 'email', 'feedback'] },
  { name: 'GitHub repository', description: 'Source code and issue tracker', href: REPO_URL, keywords: ['github', 'source', 'code', 'issues'], external: true },
];

type PaletteEntry =
  | { kind: 'tool'; id: string; tool: Tool }
  | { kind: 'link'; id: string; link: QuickLink };

/**
 * Command palette (it-tools `command-palette` equivalent) with fuzzy search.
 *
 * Keyboard support:
 * - Ctrl/Cmd + K opens and closes the palette, `/` opens it when no input is focused;
 * - ArrowUp / ArrowDown / Home / End move the highlighted entry;
 * - Enter opens the highlighted entry, Escape closes and restores focus to the trigger.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matchingTools = useMemo(() => searchTools(query, tools), [query]);

  const groups = useMemo(() => groupByCategory(matchingTools, 5), [matchingTools]);

  const matchingLinks = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (trimmed.length === 0) {
      return QUICK_LINKS;
    }

    return QUICK_LINKS.filter(
      (link) =>
        link.name.toLowerCase().includes(trimmed) ||
        link.keywords.some((keyword) => keyword.includes(trimmed)),
    );
  }, [query]);

  const entries = useMemo<PaletteEntry[]>(
    () => [
      ...groups.flatMap((group) => group.tools.map((tool) => ({ kind: 'tool' as const, id: `tool:${tool.path}`, tool }))),
      ...matchingLinks.map((link) => ({ kind: 'link' as const, id: `link:${link.href}`, link })),
    ],
    [groups, matchingLinks],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const runEntry = useCallback(
    (entry: PaletteEntry) => {
      if (entry.kind === 'tool') {
        setOpen(false);
        setQuery('');
        setActiveIndex(0);
        router.push(entry.tool.path);
        return;
      }

      if (entry.link.external) {
        window.open(entry.link.href, '_blank', 'noopener,noreferrer');
        close();
        return;
      }

      setOpen(false);
      setQuery('');
      setActiveIndex(0);
      router.push(entry.link.href);
    },
    [close, router],
  );

  // Global shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();

        if (open) {
          close();
        } else {
          openPalette();
        }

        return;
      }

      if (event.key === '/' && !open && !isTyping) {
        event.preventDefault();
        openPalette();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, open, openPalette]);

  // Move focus into the panel when it opens, and back to the trigger when it
  // closes. Both ref reads live inside the effect, never during render.
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      inputRef.current?.focus();
      return;
    }

    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  // Keyboard navigation inside the palette.
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
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
  }, [activeIndex, close, entries, open, runEntry]);

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
    <>
      <button
        ref={triggerRef}
        type="button"
        className="palette-trigger"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={15} aria-hidden="true" />
        <span className="palette-trigger-label">Search tools</span>
        <kbd>/</kbd>
      </button>

      {open ? (
        <div className="palette-overlay" role="presentation">
          <button type="button" className="palette-backdrop" aria-label="Close search" onClick={close} />

          <div className="palette-panel" role="dialog" aria-modal="true" aria-label="Search tools">
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
                placeholder="Search tools, e.g. wafer, yield, map…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
              />
              <button type="button" className="palette-close" onClick={close} aria-label="Close search">
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <ul id="palette-results" role="listbox" aria-label="Search results" ref={listRef} className="palette-list">
              {entries.length === 0 ? (
                <li className="palette-empty">No tool matches “{query}”.</li>
              ) : (
                entries.map((entry, index) => {
                  const isActive = index === activeIndex;

                  if (entry.kind === 'tool') {
                    const Icon = entry.tool.icon;

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
                            {entry.tool.name}
                            {entry.tool.isNew ? <em className="badge-new">New</em> : null}
                          </span>
                          <span className="palette-option-desc">{entry.tool.description}</span>
                        </span>
                        <span className="palette-option-cat">{entry.tool.category}</span>
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
                <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>
                  <CornerDownLeft size={11} aria-hidden="true" />
                </kbd>{' '}
                open
              </span>
              <span>
                <kbd>Esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
