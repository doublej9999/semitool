'use client';

import { Star } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { getTranslatedTool } from '@/lib/i18n/tool-translations';
import type { Tool } from '@/tools/tools.types';

/**
 * Star toggle for a tool. Keyboard accessible (real button, `aria-pressed`)
 * and safe to render before favorites are hydrated: the store returns an empty
 * snapshot on the server and on the first client render.
 */
export default function FavoriteButton({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(tool.path);
  const translated = getTranslatedTool(tool, locale);

  return (
    <button
      type="button"
      className={`favorite-button${active ? ' is-active' : ''}${compact ? ' is-compact' : ''}`}
      aria-pressed={active}
      aria-label={active ? `${t.removeFromFavorites}: ${translated.name}` : `${t.addToFavorites}: ${translated.name}`}
      title={active ? t.removeFromFavorites : t.addToFavorites}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(tool.path);
      }}
    >
      <Star size={15} aria-hidden="true" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
