'use client';

import { Star } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';
import type { Tool } from '@/tools/tools.types';

/**
 * Star toggle for a tool. Keyboard accessible (real button, `aria-pressed`)
 * and safe to render before favorites are hydrated: the store returns an empty
 * snapshot on the server and on the first client render.
 */
export default function FavoriteButton({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(tool.path);

  return (
    <button
      type="button"
      className={`favorite-button${active ? ' is-active' : ''}${compact ? ' is-compact' : ''}`}
      aria-pressed={active}
      aria-label={active ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
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
