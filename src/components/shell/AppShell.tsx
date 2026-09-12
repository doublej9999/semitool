'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import CommandPalette from './CommandPalette';
import EngineeringHandbookModal from '@/components/common/EngineeringHandbookModal';
import LanguagePicker from './LanguagePicker';
import ToolSidebar from './ToolSidebar';
import { useHydrateLocale } from '@/lib/i18n/context';
import { useHydrateFavorites } from '@/lib/favorites';
import { setRailCollapsed, useHydratePreferences, useRailCollapsed } from '@/lib/preferences';
import { REPO_URL, SITE_NAME } from '@/lib/site';

/**
 * Application shell: sider + toolbar + content, mirroring the it-tools layout.
 *
 * The mobile drawer is derived from the current pathname instead of being closed
 * by an effect: `drawerPath` records the route the drawer was opened on, so any
 * navigation closes it automatically (and React never has to cascade a render).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const railCollapsed = useRailCollapsed();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);

  const drawerOpen = drawerPath === pathname;

  useHydrateFavorites();
  useHydratePreferences();

  useHydrateLocale();

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

  return (
    <div className={shellClass}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="app-sider" id="tool-navigation" aria-label="Tool navigation">
        <ToolSidebar onNavigate={() => setDrawerPath(null)} />
      </aside>

      <div className="app-main">
        <header className="app-toolbar">
          <button
            type="button"
            className="icon-button drawer-toggle"
            aria-label={drawerOpen ? 'Close tool menu' : 'Open tool menu'}
            aria-expanded={drawerOpen}
            aria-controls="tool-navigation"
            onClick={() => setDrawerPath(drawerOpen ? null : pathname)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-button rail-toggle"
            aria-label={railCollapsed ? 'Show tool menu' : 'Hide tool menu'}
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

          <Link className="icon-button" href="/" aria-label={`${SITE_NAME} home`}>
            <Home size={18} aria-hidden="true" />
          </Link>

          <div className="toolbar-right">
            <EngineeringHandbookModal />
            <CommandPalette />
            <LanguagePicker />
          </div>
        </header>

        <main id="main-content" className="app-view">
          {children}
        </main>

        <footer className="app-footer">
          <div>
            <Link href="/tools">Tools</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <p>
            {SITE_NAME} — semiconductor engineering tools, made clear. Every calculation runs in your browser; results are
            generic estimates unless a tool states otherwise.
          </p>
        </footer>
      </div>

      {drawerOpen ? (
        <button type="button" className="app-scrim" aria-label="Close tool menu" onClick={() => setDrawerPath(null)} />
      ) : null}
    </div>
  );
}
