import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as FavoritesModule from './favorites';

type Favorites = typeof FavoritesModule;

const STORAGE_KEY = 'semitools:favorite-tools';
const TOOL_A = '/tools/wafer-area-calculator';
const TOOL_B = '/tools/yield-calculator';

/**
 * favorites.ts keeps its state in module-level variables, so every test loads a
 * fresh instance after vi.resetModules() to isolate them from each other.
 */
async function loadStore(): Promise<Favorites> {
  return import('./favorites');
}

/** Mounts the store hooks the way a client component would: hydrate + subscribe. */
function mountFavorites(store: Favorites) {
  return renderHook(() => {
    store.useHydrateFavorites();
    return store.useFavorites();
  });
}

describe('favorites store', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('toggles a path on and off and notifies subscribers', async () => {
    const store = await loadStore();
    const { result } = mountFavorites(store);

    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite(TOOL_A)).toBe(false);

    act(() => {
      store.toggleFavoritePath(TOOL_A);
    });

    // The hook re-rendered through useSyncExternalStore after the toggle.
    expect(result.current.isFavorite(TOOL_A)).toBe(true);
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0]?.path).toBe(TOOL_A);

    act(() => {
      store.toggleFavoritePath(TOOL_A);
    });

    expect(result.current.isFavorite(TOOL_A)).toBe(false);
    expect(result.current.favorites).toEqual([]);
  });

  it('persists toggles to localStorage and re-reads them in a fresh module instance', async () => {
    const store = await loadStore();
    mountFavorites(store);

    act(() => {
      store.toggleFavoritePath(TOOL_A);
    });
    act(() => {
      store.toggleFavoritePath(TOOL_B);
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify([TOOL_A, TOOL_B]),
    );

    // Simulates a second page load / another tab: brand new module state.
    vi.resetModules();
    const second = await loadStore();
    const { result: reloaded } = mountFavorites(second);

    expect(reloaded.current.isFavorite(TOOL_A)).toBe(true);
    expect(reloaded.current.favorites.map((tool) => tool.path)).toEqual([TOOL_A, TOOL_B]);
  });

  it('ignores malformed and non-array localStorage values on hydration', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'not-json');
    const store = await loadStore();
    const { result } = mountFavorites(store);
    expect(result.current.favorites).toEqual([]);

    cleanup();
    vi.resetModules();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['valid', 42, null, '']));
    const second = await loadStore();
    const { result: secondResult } = mountFavorites(second);
    // Only non-empty strings survive the parse, but `favorites` maps paths
    // through the tool registry, so a non-registry path yields no Tool.
    expect(secondResult.current.isFavorite('valid')).toBe(true);
    expect(secondResult.current.favorites).toEqual([]);
  });

  it('re-reads favorites from a cross-tab storage event', async () => {
    const store = await loadStore();
    const { result } = mountFavorites(store);
    expect(result.current.favorites).toEqual([]);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify([TOOL_B]),
        }),
      );
    });

    expect(result.current.isFavorite(TOOL_B)).toBe(true);
    expect(result.current.favorites.map((tool) => tool.path)).toEqual([TOOL_B]);

    // Unrelated keys are ignored.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'semitools:locale',
          newValue: '["/tools/other"]',
        }),
      );
    });
    expect(result.current.favorites.map((tool) => tool.path)).toEqual([TOOL_B]);

    // A removal in another tab (newValue null) empties the list.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }),
      );
    });
    expect(result.current.favorites).toEqual([]);
  });

  it('reports hydration through useFavoritesHydrated', async () => {
    const store = await loadStore();
    const { result } = renderHook(() => {
      store.useHydrateFavorites();
      return store.useFavoritesHydrated();
    });

    // The hydrate effect runs on mount, so the store notifies and flips true.
    expect(result.current).toBe(true);
  });
});
