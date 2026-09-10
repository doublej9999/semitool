'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getTool } from '@/tools';
import type { Tool } from '@/tools/tools.types';

/**
 * Favorite tools store (used by the sidebar, the tool cards and the home page).
 *
 * Why a module-level store instead of context + useState:
 * - the sidebar, every tool card and the command palette read the same list;
 * - the value is persisted in localStorage, so it must not be read during the
 *   first client render or React would report a hydration mismatch;
 *
 * `hydrated` is flipped inside a `useEffect` (see `useHydrateFavorites`), which
 * guarantees the server snapshot and the first client snapshot are both empty.
 */
const STORAGE_KEY = 'semitools:favorite-tools';
const EMPTY: string[] = [];

let favoritePaths: string[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function parseStoredValue(raw: string | null): string[] {
  if (!raw) {
    return EMPTY;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return EMPTY;
    }

    return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
  } catch {
    return EMPTY;
  }
}

function persist(next: string[]): void {
  favoritePaths = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, quota). Favorites then simply do not persist.
  }

  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string[] {
  return hydrated ? favoritePaths : EMPTY;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

export function toggleFavoritePath(path: string): void {
  const next = favoritePaths.includes(path)
    ? favoritePaths.filter((value) => value !== path)
    : [...favoritePaths, path];

  persist(next);
}

/** Loads favorites from localStorage. Call once from a client component effect. */
export function useHydrateFavorites(): void {
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;

      try {
        favoritePaths = parseStoredValue(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        favoritePaths = EMPTY;
      }

      emit();
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY) {
        favoritePaths = parseStoredValue(event.newValue);
        emit();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, []);
}

export interface FavoritesState {
  /** Favorite tools, in the order the user added them. */
  favorites: Tool[];
  isFavorite: (path: string) => boolean;
  toggle: (path: string) => void;
}

/**
 * True once favorites have been read from localStorage. Lets a component render
 * nothing on the server and on the first client render, then show the real list
 * without a setState-in-effect.
 */
export function useFavoritesHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function useFavorites(): FavoritesState {
  const paths = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((path: string) => toggleFavoritePath(path), []);

  const favorites = paths
    .map((path) => getTool(path))
    .filter((tool): tool is Tool => tool !== undefined);

  return {
    favorites,
    isFavorite: (path: string) => paths.includes(path),
    toggle,
  };
}

export { STORAGE_KEY as FAVORITES_STORAGE_KEY };
