import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PreferencesModule from './preferences';

type Preferences = typeof PreferencesModule;

const THEME_KEY = 'semitools:theme';

/**
 * preferences.ts keeps its state in module-level variables, so every test loads
 * a fresh instance after vi.resetModules() to isolate them from each other.
 */
async function loadStore(): Promise<Preferences> {
  return import('./preferences');
}

type MediaController = {
  fire: (matches: boolean) => void;
};

/**
 * jsdom's matchMedia cannot be flipped at runtime, so replace window.matchMedia
 * with a controlled stub. Must be installed before mount: the hydrate effect
 * reads the query and subscribes to changes.
 */
function stubMatchMedia(initialMatches: boolean): MediaController {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => false,
  };

  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

  return {
    fire(matches: boolean) {
      mql.matches = matches;
      const event = { matches, media: mql.media } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

/** Mounts the store hooks the way a client component would: hydrate + subscribe. */
function mountTheme(store: Preferences) {
  return renderHook(() => {
    store.useHydratePreferences();
    return {
      setting: store.useThemeSetting(),
      resolved: store.useResolvedTheme(),
    };
  });
}

describe('theme store', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('cycles settings, persists them, and paints data-theme immediately', async () => {
    stubMatchMedia(false);
    const store = await loadStore();
    const { result } = mountTheme(store);

    expect(result.current.setting).toBe('light');
    expect(store.getResolvedTheme()).toBe('light');

    act(() => {
      store.setThemeSetting('dark');
    });

    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(result.current.setting).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(store.getResolvedTheme()).toBe('dark');

    act(() => {
      store.setThemeSetting('light');
    });

    expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(store.getResolvedTheme()).toBe('light');
  });

  it('resolves "system" through matchMedia and follows live OS changes', async () => {
    const media = stubMatchMedia(true);
    const store = await loadStore();
    const { result } = mountTheme(store);

    act(() => {
      store.setThemeSetting('system');
    });

    expect(window.localStorage.getItem(THEME_KEY)).toBe('system');
    // OS currently prefers dark, so system resolves to dark.
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(result.current.setting).toBe('system');
    expect(result.current.resolved).toBe('dark');
    expect(store.getResolvedTheme()).toBe('dark');

    // The OS preference flips to light while the app is open.
    act(() => {
      media.fire(false);
    });

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(result.current.resolved).toBe('light');
    expect(store.getResolvedTheme()).toBe('light');

    // A manual choice stops following the media query.
    act(() => {
      media.fire(true);
      store.setThemeSetting('light');
    });
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('applies the stored theme during hydration, matching the no-flash bootstrap', async () => {
    window.localStorage.setItem(THEME_KEY, 'dark');
    stubMatchMedia(false);
    const store = await loadStore();
    const { result } = mountTheme(store);

    // The hydrate effect ran loadFromStorage, which mirrors the inline
    // bootstrap in layout.tsx by setting data-theme before anything renders.
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(result.current.setting).toBe('dark');
    expect(result.current.resolved).toBe('dark');

    // A brand new module instance (second page load / another tab) agrees.
    cleanup();
    vi.resetModules();
    const second = await loadStore();
    const { result: reloaded } = mountTheme(second);
    expect(reloaded.current.setting).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('re-reads the theme from a cross-tab storage event', async () => {
    stubMatchMedia(false);
    const store = await loadStore();
    const { result } = mountTheme(store);
    expect(result.current.setting).toBe('light');

    // Another tab writes 'dark' to storage; the event carries the same value.
    act(() => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: 'dark' }));
    });

    expect(result.current.setting).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // A removal in another tab falls back to light.
    act(() => {
      window.localStorage.removeItem(THEME_KEY);
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: null }));
    });

    expect(result.current.setting).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    // Unrelated keys leave the theme alone.
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'semitools:locale', newValue: 'zh-CN' }),
      );
    });
    expect(result.current.setting).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('falls back to light for missing or invalid stored values', async () => {
    window.localStorage.setItem(THEME_KEY, 'midnight');
    stubMatchMedia(true);
    const store = await loadStore();
    const { result } = mountTheme(store);

    expect(result.current.setting).toBe('light');
    // Even with a dark OS preference, an invalid value means light — it is not
    // 'system', so the OS preference is ignored.
    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
