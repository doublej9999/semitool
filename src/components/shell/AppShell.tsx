'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, GitFork, Keyboard, Layers } from 'lucide-react';
import CommandPalette from './CommandPalette';
import EngineeringHandbookModal from '@/components/common/EngineeringHandbookModal';
import FabScratchpadModal from '@/components/common/FabScratchpadModal';
import ModalShell from '@/components/common/ModalShell';
import VirtualGenealogyModal from '@/components/common/VirtualGenealogyModal';
import FabWorkspaceModal from '@/components/common/FabWorkspaceModal';
import PwaStatusIndicator from '@/components/common/PwaStatusIndicator';
import ThemeToggle from '@/components/common/ThemeToggle';
import LanguagePicker from './LanguagePicker';
import ToolSidebar from './ToolSidebar';
import { useHydrateLocale, useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { useHydrateFavorites } from '@/lib/favorites';
import { useHydrateFabSession } from '@/lib/fab-session';
import { setGloveMode, setRailCollapsed, useGloveMode, useHydratePreferences, useRailCollapsed } from '@/lib/preferences';
import { TRAVELER_OPEN_EVENT } from '@/lib/shell-events';
import { REPO_URL, SITE_NAME } from '@/lib/site';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const railCollapsed = useRailCollapsed();
  const gloveMode = useGloveMode();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [handbookOpen, setHandbookOpen] = useState<boolean>(false);
  const [scratchpadOpen, setScratchpadOpen] = useState<boolean>(false);
  const [genealogyOpen, setGenealogyOpen] = useState<boolean>(false);
  const [shortcutsHintOpen, setShortcutsHintOpen] = useState<boolean>(false);
  const [workspaceOpen, setWorkspaceOpen] = useState<boolean>(false);

  const drawerOpen = drawerPath === pathname;
  const locale = useLocale();
  const t = getTranslation(locale);

  useHydrateFavorites();
  useHydratePreferences();
  useHydrateLocale();
  useHydrateFabSession();

  // Global cleanroom keyboard shortcuts. Alt-based on purpose: the old Ctrl+T/W/S/H
  // combos are browser-reserved (new tab / close tab / save / history) and cannot be
  // reliably intercepted with preventDefault.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // '?' -> show fab shortcuts help modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShortcutsHintOpen((prev) => !prev);
        return;
      }

      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case 'h':
        case 'H':
          e.preventDefault();
          setHandbookOpen(true);
          break;
        case 't':
        case 'T':
          // The traveler mounts inside tool pages (ToolPageActions), so the shell
          // opens it through an explicit typed event instead of DOM queries.
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(TRAVELER_OPEN_EVENT));
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setScratchpadOpen(true);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setGenealogyOpen((prev) => !prev);
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          setWorkspaceOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);

  const shellClass = ['app-shell', railCollapsed ? 'is-rail-collapsed' : '', drawerOpen ? 'is-drawer-open' : '']
    .filter(Boolean)
    .join(' ');

  const shortcutRows: Array<{ label: string; keys: string }> = [
    { label: t.scHandbook, keys: 'Alt + H' },
    { label: t.scTraveler, keys: 'Alt + T' },
    { label: t.scGenealogy, keys: 'Alt + G' },
    { label: t.scWorkspace, keys: 'Alt + W' },
    { label: t.scScratchpad, keys: 'Alt + S' },
    { label: t.scPalette, keys: 'Ctrl + K' },
    { label: t.scShowShortcuts, keys: '?' },
  ];

  return (
    <div className={shellClass}>
      <a className="skip-link" href="#main-content">
        {t.skipToContent}
      </a>

      <aside className="app-sider" id="tool-navigation" aria-label="Tool navigation">
        <ToolSidebar onNavigate={() => setDrawerPath(null)} />
      </aside>

      <div className="app-main">
        <header className="app-toolbar">
          <button
            type="button"
            className="icon-button drawer-toggle"
            aria-label={drawerOpen ? t.closeToolMenu : t.openToolMenu}
            aria-expanded={drawerOpen}
            aria-controls="tool-navigation"
            onClick={() => setDrawerPath(drawerOpen ? null : pathname)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-button rail-toggle"
            aria-label={railCollapsed ? t.showToolMenu : t.hideToolMenu}
            aria-expanded={!railCollapsed}
            aria-controls="tool-navigation"
            onClick={() => setRailCollapsed(!railCollapsed)}
          >
            {railCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>

          <Link className="icon-button" href="/" aria-label={`${SITE_NAME} ${t.homeTitle}`}>
            <Home size={18} aria-hidden="true" />
          </Link>

          <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Cleanroom Glove-Friendly Mode Toggle */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setGloveMode(!gloveMode)}
              aria-label={t.cleanroomMode}
              aria-pressed={gloveMode}
              title={`${t.cleanroomMode} (${gloveMode ? t.gloveModeOn : t.gloveModeOff})`}
              style={{
                color: gloveMode ? '#ffffff' : 'var(--ink-soft)',
                backgroundColor: gloveMode ? 'var(--teal, #0d7c82)' : 'transparent',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={18} />
            </button>

            {/* Theme: light / dark / system */}
            <ThemeToggle />

            {/* Virtual Lot Genealogy Button */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setGenealogyOpen(true)}
              aria-label={`${t.genealogyTitle} (Alt+G)`}
              title={`${t.genealogyTitle} (Alt+G)`}
            >
              <GitFork size={18} />
            </button>

            {/* Film Stack & Fab Project Workspace */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setWorkspaceOpen(true)}
              aria-label={`${t.workspaceTitle} (Alt+W)`}
              title={`${t.workspaceTitle} (Alt+W)`}
            >
              <Layers size={18} />
            </button>

            {/* Global Shortcuts Help Button */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setShortcutsHintOpen((prev) => !prev)}
              aria-label={`${t.shortcutsGuide} (?)`}
              title={`${t.shortcutsGuide} (?)`}
            >
              <Keyboard size={17} />
            </button>

            <EngineeringHandbookModal open={handbookOpen} onOpenChange={setHandbookOpen} />
            <FabScratchpadModal open={scratchpadOpen} onOpenChange={setScratchpadOpen} />
            <PwaStatusIndicator />
            <CommandPalette />
            <LanguagePicker />
          </div>
        </header>

        <main id="main-content" className="app-view">
          {children}
        </main>

        <footer className="app-footer">
          <div>
            <Link href="/tools">{t.toolbox}</Link>
            <Link href="/about">{t.about}</Link>
            <Link href="/privacy">{t.cmdPrivacy}</Link>
            <Link href="/contact">{t.contact}</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <p>
            {SITE_NAME} — {t.footerTagline}
          </p>
        </footer>
      </div>

      {drawerOpen ? (
        <button type="button" className="app-scrim" aria-label={t.closeToolMenu} onClick={() => setDrawerPath(null)} />
      ) : null}

      {/* Lot Genealogy Modal */}
      <VirtualGenealogyModal
        isOpen={genealogyOpen}
        onClose={() => setGenealogyOpen(false)}
      />

      {/* Fab Film Stack Workspace Modal */}
      <FabWorkspaceModal
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
      />

      {/* Cleanroom Keyboard Shortcuts Dialog */}
      <ModalShell
        open={shortcutsHintOpen}
        onClose={() => setShortcutsHintOpen(false)}
        ariaLabel={t.shortcutsGuide}
        className="w-full max-w-[460px] rounded-[10px] bg-[var(--card,#ffffff)] p-[1.4rem] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink, #0f172a)' }}>
            {t.shortcutsGuide}
          </div>
          <button
            type="button"
            onClick={() => setShortcutsHintOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--ink-soft)' }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
          {shortcutRows.map((row) => (
            <div key={row.keys + row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ink-soft, #475569)' }}>{row.label}:</span>
              <kbd
                style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--paper, #f1f5f9)',
                  border: '1px solid var(--line, #cbd5e1)',
                  fontWeight: 600,
                }}
              >
                {row.keys}
              </kbd>
            </div>
          ))}
        </div>
      </ModalShell>
    </div>
  );
}
