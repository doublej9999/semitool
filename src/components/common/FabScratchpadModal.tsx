'use client';

/**
 * Trigger + open-state plumbing for the Fab Scratchpad. The heavy UI (unit
 * converters, quick math, cleanroom notes) lives in `FabScratchpadPanel.tsx`,
 * code-split into its own chunk via next/dynamic and only fetched while the
 * scratchpad is open.
 */

import { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calculator } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

const FabScratchpadPanel = dynamic(() => import('./FabScratchpadPanel'), { ssr: false });

interface FabScratchpadModalProps {
  /** Controlled open state (set by AppShell for the Alt+S shortcut). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FabScratchpadModal({ open, onOpenChange }: FabScratchpadModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = open !== undefined;
  const effectiveOpen = isControlled ? open : isOpen;
  const openModal = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);
  const locale = useLocale();
  const t = getTranslation(locale);

  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!effectiveOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveOpen, closeModal]);

  return (
    <>
      <button
        type="button"
        className="icon-button fab-scratchpad-trigger"
        aria-label={t.scratchpadBtnTitle}
        title={t.scratchpadBtnTitle}
        onClick={openModal}
      >
        <Calculator size={18} aria-hidden="true" />
      </button>

      {/* Scratchpad Drawer (lazy chunk) */}
      {effectiveOpen && <FabScratchpadPanel open={effectiveOpen} onClose={closeModal} />}
    </>
  );
}
