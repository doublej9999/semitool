'use client';

/**
 * Trigger + open-state plumbing for the Engineering Handbook. The heavy drawer
 * UI (tabs, search, formulas/constants/materials/cleanroom tables) lives in
 * `EngineeringHandbookPanel.tsx`, code-split into its own chunk via next/dynamic
 * and only fetched while the handbook is open.
 */

import { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

const EngineeringHandbookPanel = dynamic(() => import('./EngineeringHandbookPanel'), { ssr: false });

interface EngineeringHandbookModalProps {
  /** Controlled open state (set by AppShell for the Alt+H shortcut). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EngineeringHandbookModal({ open, onOpenChange }: EngineeringHandbookModalProps = {}) {
  const locale = useLocale();
  const t = getTranslation(locale);
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

  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!effectiveOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveOpen, closeModal]);

  return (
    <>
      {/* Trigger Button in toolbar or header */}
      <button
        type="button"
        className="icon-button handbook-trigger"
        aria-label={t.handbookBtnTitle}
        title={t.handbookBtnTitle}
        onClick={openModal}
      >
        <BookOpen size={18} aria-hidden="true" />
      </button>

      {/* Modal Drawer (lazy chunk) */}
      {effectiveOpen && <EngineeringHandbookPanel open={effectiveOpen} onClose={closeModal} />}
    </>
  );
}
