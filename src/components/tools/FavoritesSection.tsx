'use client';

import ToolCard from './ToolCard';
import { useFavorites, useFavoritesHydrated } from '@/lib/favorites';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

/**
 * Favorites block on the home page.
 *
 * Renders nothing until the store is hydrated, so the server HTML and the first
 * client render agree (localStorage is not readable during SSR).
 */
export default function FavoritesSection() {
  const locale = useLocale();
  const t = getTranslation(locale);
  const { favorites } = useFavorites();
  const ready = useFavoritesHydrated();

  if (!ready) {
    return null;
  }

  if (favorites.length === 0) {
    return (
      <p className="empty-state">
        {t.noFavorites}
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
