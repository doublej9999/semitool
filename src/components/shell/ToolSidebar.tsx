'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronRight, Star, Wrench } from 'lucide-react';
import { toolsByCategory } from '@/tools';
import { useFavorites } from '@/lib/favorites';
import { setGroupCollapsed, useCollapsedGroups } from '@/lib/preferences';
import type { Tool } from '@/tools/tools.types';

interface MenuGroup {
  name: string;
  tools: Tool[];
  /** Categories the user can fold away; the favorites group always stays open. */
  collapsible: boolean;
}

/**
 * Sider menu: brand hero, favorites and one foldable group per category.
 * Mirrors the it-tools sidebar, without drag-to-reorder (a small registry does
 * not need it yet).
 */
export default function ToolSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const collapsed = useCollapsedGroups();
  const { favorites } = useFavorites();

  const groups = useMemo<MenuGroup[]>(() => {
    const categoryGroups: MenuGroup[] = toolsByCategory.map((group) => ({
      name: group.name,
      tools: group.components,
      collapsible: true,
    }));

    if (favorites.length === 0) {
      return categoryGroups;
    }

    return [{ name: 'Favorites', tools: favorites, collapsible: false }, ...categoryGroups];
  }, [favorites]);

  return (
    <div className="sider-inner">
      <Link className="sider-hero" href="/" onClick={onNavigate}>
        <span className="sider-hero-mark" aria-hidden="true">
          <Wrench size={15} />
        </span>
        <span className="sider-hero-title">
          SEMI<span>-TOOLS</span>
        </span>
        <span className="sider-hero-sub">Semiconductor engineering tools</span>
      </Link>

      <nav className="sider-menu" aria-label="Tools">
        {groups.map((group) => {
          const isCollapsed = group.collapsible && collapsed[group.name] === true;

          return (
            <div className="menu-group" key={group.name}>
              {group.collapsible ? (
                <button
                  type="button"
                  className="menu-group-label is-interactive"
                  aria-expanded={!isCollapsed}
                  onClick={() => setGroupCollapsed(group.name, !isCollapsed)}
                >
                  <ChevronRight size={13} className={`chevron${isCollapsed ? ' is-collapsed' : ''}`} aria-hidden="true" />
                  {group.name}
                </button>
              ) : (
                <p className="menu-group-label">
                  <Star size={12} aria-hidden="true" />
                  {group.name}
                </p>
              )}

              {!isCollapsed ? (
                <ul className="menu-list">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.path;

                    return (
                      <li key={tool.path}>
                        <Link
                          className={`menu-link${isActive ? ' is-active' : ''}`}
                          href={tool.path}
                          onClick={onNavigate}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon size={15} aria-hidden="true" />
                          {tool.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="sider-footer">
        <p>
          <Link href="/tools">Toolbox</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </p>
        <p>
          All calculations run locally <span className="sider-version">v1.0</span>
        </p>
      </div>
    </div>
  );
}
