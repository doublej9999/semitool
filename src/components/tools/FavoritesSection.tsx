'use client';

import ToolCard from './ToolCard';
import { useFavorites, useFavoritesHydrated } from '@/lib/favorites';

/**
 * Favorites block on the home page.
 *
 * Renders nothing until the store is hydrated, so the server HTML and the first
 * client render agree (localStorage is not readable during SSR).
 */
export default function FavoritesSection() {
  const { favorites } = useFavorites();
  const ready = useFavoritesHydrated();

  if (!ready) {
    return null;
  }

  if (favorites.length === 0) {
    return (
      <p className="empty-state">
        No favorites yet. Use the star on a tool card — or press <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> to search —
        and your most-used tools will be listed here on every visit.
      </p>
    );
  }

  return (
    <div className="tool-grid">
      {favorites.map((tool) => (
        <ToolCard key={tool.path} path={tool.path} />
      ))}
    </div>
  );
}
