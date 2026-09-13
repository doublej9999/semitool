'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

/**
 * Command palette (it-tools `command-palette` equivalent). The heavy overlay,
 * combobox input, and results listbox live in `CommandPalettePanel.tsx`,
 * code-split into their own chunk via next/dynamic and only fetched while the
 * palette is open. This file keeps the always-mounted parts: the trigger
 * button, the global Ctrl+K / '/' shortcut listener, and focus restore.
 *
 * Keyboard support:
 * - Ctrl/Cmd + K opens and closes the palette, `/` opens it when no input is focused;
 * - inside the panel: ArrowUp / ArrowDown / Home / End move the highlighted
 *   entry, Enter opens it, Escape closes and restores focus to the trigger.
 */
const CommandPalettePanel = dynamic(() => import('./CommandPalettePanel'), { ssr: false });

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = getTranslation(locale);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
  }, []);

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

  // Restore focus to the trigger when the palette closes. Focusing the panel
  // input happens inside the panel itself: on the very first open the lazy
  // chunk may still be loading, so the input does not exist yet in this tree.
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }

    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

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
        <span className="palette-trigger-label">{t.cmdPlaceholder}</span>
        <kbd>/</kbd>
      </button>

      {open ? <CommandPalettePanel open={open} onClose={close} /> : null}
    </>
  );
}
