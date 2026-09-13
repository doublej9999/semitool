'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Persisted UI preferences (collapsed sidebar categories, collapsed rail,
 * cleanroom glove mode, color theme).
 *
 * Stored in a module-level external store instead of component state for the
 * same reason as the favorites store: the value lives in localStorage, which is
 * not readable during render, so the first client snapshot must equal the server
 * snapshot. `useHydratePreferences` (called once from the shell) reads storage
 * inside an effect and notifies subscribers.
 */
const COLLAPSED_KEY = 'semitools:collapsed-categories';
const RAIL_KEY = 'semitools:rail-collapsed';
const GLOVE_KEY = 'semitools_glove_mode';
const THEME_KEY = 'semitools:theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const EMPTY_COLLAPSED: Record<string, boolean> = {};

/** The user-facing theme choice; 'system' follows prefers-color-scheme. */
export type ThemeSetting = 'light' | 'dark' | 'system';
/** The theme actually painted after resolving 'system'. */
export type ResolvedTheme = 'light' | 'dark';

let collapsedGroups: Record<string, boolean> = EMPTY_COLLAPSED;
let railCollapsed = false;
let gloveMode = false;
let themeSetting: ThemeSetting = 'light';
let systemPrefersDark = false;
let mediaQuery: MediaQueryList | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota): preferences then do not persist.
  }
}

function parseCollapsed(raw: string | null): Record<string, boolean> {
  if (!raw) {
    return EMPTY_COLLAPSED;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return EMPTY_COLLAPSED;
    }

    const result: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') {
        result[key] = value;
      }
    }

    return result;
  } catch {
    return EMPTY_COLLAPSED;
  }
}

function loadFromStorage(): void {
  collapsedGroups = parseCollapsed(readItem(COLLAPSED_KEY));
  railCollapsed = readItem(RAIL_KEY) === '1';
  // Legacy writes stored 'true'/'false'; current writes use '1'/'0'.
  const savedGlove = readItem(GLOVE_KEY);
  gloveMode = savedGlove === '1' || savedGlove === 'true';
  applyGloveClass(gloveMode);
  // Re-apply the theme here too so hydration and cross-tab 'storage' events
  // both end up with data-theme matching the persisted setting.
  themeSetting = parseThemeSetting(readItem(THEME_KEY));
  const query = getMediaQuery();
  systemPrefersDark = query ? query.matches : false;
  applyTheme();
}

function applyGloveClass(on: boolean): void {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('cleanroom-glove-mode', on);
}

function parseThemeSetting(raw: string | null): ThemeSetting {
  return raw === 'dark' || raw === 'system' ? raw : 'light';
}

function getMediaQuery(): MediaQueryList | null {
  if (mediaQuery) return mediaQuery;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  return mediaQuery;
}

function resolveTheme(setting: ThemeSetting, prefersDark: boolean): ResolvedTheme {
  if (setting === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return setting;
}

/** Mirrors the resolved theme onto <html data-theme='dark'|'light'>. */
function applyTheme(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolveTheme(themeSetting, systemPrefersDark);
}

export function setGroupCollapsed(category: string, collapsed: boolean): void {
  collapsedGroups = { ...collapsedGroups, [category]: collapsed };
  writeItem(COLLAPSED_KEY, JSON.stringify(collapsedGroups));
  emit();
}

export function setRailCollapsed(collapsed: boolean): void {
  railCollapsed = collapsed;
  writeItem(RAIL_KEY, collapsed ? '1' : '0');
  emit();
}

/** Toggles cleanroom glove mode; also mirrors the state onto <body> as a class. */
export function setGloveMode(on: boolean): void {
  gloveMode = on;
  writeItem(GLOVE_KEY, on ? '1' : '0');
  applyGloveClass(on);
  emit();
}

/**
 * Persists the theme choice and immediately paints it via
 * <html data-theme>. 'system' resolves through prefers-color-scheme.
 */
export function setThemeSetting(setting: ThemeSetting): void {
  themeSetting = setting;
  writeItem(THEME_KEY, setting);
  if (setting === 'system') {
    const query = getMediaQuery();
    systemPrefersDark = query ? query.matches : false;
  }
  applyTheme();
  emit();
}

/** The theme currently painted ('light' | 'dark'), after resolving 'system'. */
export function getResolvedTheme(): ResolvedTheme {
  if (!hydrated) {
    // Mirror the no-flash bootstrap: honor the OS preference without waiting
    // for the hydrate effect, so early callers (e.g. charts) agree with paint.
    const query = getMediaQuery();
    return resolveTheme(themeSetting, query ? query.matches : false);
  }
  return resolveTheme(themeSetting, systemPrefersDark);
}

/** Reads stored preferences once after mount. Call from the application shell. */
export function useHydratePreferences(): void {
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      loadFromStorage();
      emit();
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key === COLLAPSED_KEY || event.key === RAIL_KEY || event.key === THEME_KEY) {
        loadFromStorage();
        emit();
      }
    };

    // While 'system' is selected, follow live prefers-color-scheme changes.
    const query = getMediaQuery();
    const onMediaChange = (event: MediaQueryListEvent): void => {
      systemPrefersDark = event.matches;
      if (themeSetting === 'system') {
        applyTheme();
        emit();
      }
    };
    query?.addEventListener('change', onMediaChange);

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      query?.removeEventListener('change', onMediaChange);
    };
  }, []);
}

export function useCollapsedGroups(): Record<string, boolean> {
  return useSyncExternalStore(
    subscribe,
    () => (hydrated ? collapsedGroups : EMPTY_COLLAPSED),
    () => EMPTY_COLLAPSED,
  );
}

export function useRailCollapsed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated && railCollapsed,
    () => false,
  );
}

export function useGloveMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated && gloveMode,
    () => false,
  );
}

export function useThemeSetting(): ThemeSetting {
  return useSyncExternalStore(
    subscribe,
    () => (hydrated ? themeSetting : 'light'),
    () => 'light',
  );
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => (hydrated ? resolveTheme(themeSetting, systemPrefersDark) : 'light'),
    () => 'light',
  );
}
