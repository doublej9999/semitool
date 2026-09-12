'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * Shared accessible modal shell.
 *
 * Renders a fixed overlay plus a dialog panel with the same visual treatment
 * the app's other modals use: the overlay markup mirrors FabWorkspaceModal's
 * overlay (fixed, inset 0, `rgba(15, 23, 42, 0.65)` backdrop, `blur(4px)`,
 * z-index 9999, centered flex with 1rem padding), while per-modal panel
 * styling is supplied through the `className` prop.
 *
 * Behavior:
 * - Renders nothing while closed.
 * - Escape closes; clicking the backdrop closes unless `closeOnBackdrop` is false.
 * - Body scroll is locked while open (same pattern as EngineeringHandbookModal).
 * - Focus management follows the CommandPalette pattern: on open the previously
 *   focused element is stored and the panel (tabIndex={-1}) is focused; on close
 *   focus is restored to the stored element. Tab / Shift+Tab cycle within the
 *   panel; if it has no focusable descendants, focus stays on the panel.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** id of the element (usually the title) that labels the dialog. */
  labelledById?: string;
  /** Accessible name for the dialog when there is no labelling element. */
  ariaLabel?: string;
  children: ReactNode;
  /** Panel classes (sizing, surface, border, shadow). */
  className?: string;
  /** Whether clicking the backdrop closes the modal. Defaults to true. */
  closeOnBackdrop?: boolean;
}

export default function ModalShell({
  open,
  onClose,
  labelledById,
  ariaLabel,
  children,
  className,
  closeOnBackdrop = true,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while the modal is open, restoring the previous value.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Move focus into the panel when it opens and back to the previously
  // focused element when it closes. Restoring from the cleanup also covers
  // the modal being unmounted while open. Ref reads stay inside the effect.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, [open]);

  // Escape closes the modal; Tab cycles within the panel.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      event.preventDefault();

      if (focusables.length === 0) {
        panel.focus();
        return;
      }

      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
      const lastIndex = focusables.length - 1;
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? lastIndex
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === lastIndex
          ? 0
          : currentIndex + 1;

      focusables[nextIndex].focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={
        closeOnBackdrop
          ? (event) => {
              if (event.target === event.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-label={labelledById ? undefined : ariaLabel}
        tabIndex={-1}
        className={className}
        style={{ outline: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
