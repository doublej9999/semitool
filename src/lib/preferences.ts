'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Persisted UI preferences (collapsed sidebar categories, collapsed rail).
 *
 * Stored in a module-level external store instead of component state for the
 * same reason as the favorites store: the value lives in localStorage, which is
 * not readable during render, so the first client snapshot must equal the server
 * snapshot. `useHydratePreferences` (called once from the shell) reads storage
 * inside an effect and notifies subscribers.
 */
const COLLAPSED_KEY = 'semitools:collapsed-categories';
const RAIL_KEY = 'semitools:rail-collapsed';
const EMPTY_COLLAPSED: Record<string, boolean> = {};

let collapsedGroups: Record<string, boolean> = EMPTY_COLLAPSED;
let railCollapsed = false;
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

/** Reads stored preferences once after mount. Call from the application shell. */
export function useHydratePreferences(): void {
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      loadFromStorage();
      emit();
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key === COLLAPSED_KEY || event.key === RAIL_KEY) {
        loadFromStorage();
        emit();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
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
