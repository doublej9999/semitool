/**
 * User data inventory for the privacy page ("Your data, your control").
 *
 * Enumerates, exports and clears every piece of user data SemiTools keeps on
 * the device. Two storage layers exist:
 *
 * - localStorage, under the well-known keys listed in `describeUserDataKeys`.
 *   The key literals are repeated here (with their owning module noted) because
 *   most owning modules keep them private, and importing them would drag heavy
 *   modules (e.g. the `@/tools` registry via favorites.ts) into the privacy
 *   route bundle;
 * - the IndexedDB database 'semitools-stdf-cache' — the STDF/KLARF Explorer's
 *   cached last-parsed file summary (src/tools/stdf-klarf-explorer/idb.ts,
 *   which exposes `loadCachedStdf` but no clear API, so the deletion is
 *   hand-rolled here against the same DB name).
 *
 * Nothing here touches the network: the export is a JSON document the user
 * downloads, clearing only removes local keys/databases. All functions guard
 * for SSR and for unavailable storage (private mode, quota).
 */

import {
  FAB_SESSION_EXPORT_KIND,
  FAB_SESSION_EXPORT_VERSION,
  FAB_SESSION_STORAGE_KEY,
  importFabSessionJson,
} from './fab-session';
import type { FabSessionState } from './fab-session';
import { loadCachedStdf } from '@/tools/stdf-klarf-explorer/idb';

/** Envelope kind/version of the JSON document produced by `collectUserData`. */
export const USER_DATA_EXPORT_KIND = 'semitools-user-data';
export const USER_DATA_EXPORT_VERSION = 1;

// ---------------------------------------------------------------------------
// Key manifest (grep `localStorage` across src/ to re-verify this list).
// ---------------------------------------------------------------------------

// UI preferences (kept by default when clearing).
const LOCALE_KEY = 'semitools:locale'; // src/lib/i18n/context.ts
const THEME_KEY = 'semitools:theme'; // src/lib/preferences.ts + no-flash bootstrap in src/app/layout.tsx
const COLLAPSED_KEY = 'semitools:collapsed-categories'; // src/lib/preferences.ts
const RAIL_KEY = 'semitools:rail-collapsed'; // src/lib/preferences.ts
const GLOVE_KEY = 'semitools_glove_mode'; // src/lib/preferences.ts

// User content.
const FAVORITES_KEY = 'semitools:favorite-tools'; // src/lib/favorites.ts
const SCRATCHPAD_KEY = 'semitools_fab_scratchpad'; // src/components/common/FabScratchpadPanel.tsx
const TRAVELER_HISTORY_KEY = 'semitools_traveler_history'; // src/components/common/EngineeringTravelerModal.tsx
// FAB_SESSION_STORAGE_KEY ('semitools_fab_session_v1') — imported from ./fab-session.

// Legacy keys, only read once for migration into the Fab session document
// (src/lib/fab-session.ts, src/lib/film-stack.ts). Safe to remove outright.
const LEGACY_WORKSPACE_KEY = 'semitools_fab_workspace_project_v1';
const LEGACY_GENEALOGY_KEY = 'semitools_lot_genealogy_active';

const CONTENT_KEYS: readonly string[] = [
  FAVORITES_KEY,
  SCRATCHPAD_KEY,
  TRAVELER_HISTORY_KEY,
  FAB_SESSION_STORAGE_KEY,
  LEGACY_WORKSPACE_KEY,
  LEGACY_GENEALOGY_KEY,
];

const PREFERENCE_KEYS: readonly string[] = [LOCALE_KEY, THEME_KEY, COLLAPSED_KEY, RAIL_KEY, GLOVE_KEY];

/** Human-readable manifest entry consumed by the privacy page UI and tests. */
export interface UserDatumKeyInfo {
  /** The raw localStorage key. */
  key: string;
  /** Short English label describing what the key holds. */
  label: string;
  /** 'content' = user data proper; 'preference' = UI setting kept across clears. */
  kind: 'content' | 'preference';
}

/** Every localStorage key SemiTools may write, in stable manifest order. */
export function describeUserDataKeys(): UserDatumKeyInfo[] {
  return [
    { key: LOCALE_KEY, label: 'Interface language', kind: 'preference' },
    { key: THEME_KEY, label: 'Color theme (light / dark / system)', kind: 'preference' },
    { key: COLLAPSED_KEY, label: 'Collapsed sidebar categories', kind: 'preference' },
    { key: RAIL_KEY, label: 'Collapsed navigation rail', kind: 'preference' },
    { key: GLOVE_KEY, label: 'Cleanroom glove mode', kind: 'preference' },
    { key: FAVORITES_KEY, label: 'Favorite tools', kind: 'content' },
    { key: SCRATCHPAD_KEY, label: 'Fab scratchpad notes', kind: 'content' },
    { key: TRAVELER_HISTORY_KEY, label: 'Archived engineering travelers', kind: 'content' },
    { key: FAB_SESSION_STORAGE_KEY, label: 'Fab Workspace session (film stack, lot, metrology, flows)', kind: 'content' },
    { key: LEGACY_WORKSPACE_KEY, label: 'Legacy film-stack workspace project (migrated)', kind: 'content' },
    { key: LEGACY_GENEALOGY_KEY, label: 'Legacy virtual lot genealogy (migrated)', kind: 'content' },
  ];
}

/** Export document shape written by `collectUserData`. */
export interface UserDataExport {
  kind: typeof USER_DATA_EXPORT_KIND;
  version: typeof USER_DATA_EXPORT_VERSION;
  exportedAtIso: string;
  /** Raw stored value per manifest key; null when the key is absent. */
  localStorage: Record<string, string | null>;
  idb: {
    /** The STDF/KLARF Explorer's cached last-parsed file summary, or null. */
    lastStdfSummary: unknown | null;
  };
}

/**
 * Reads every known storage location into a versioned JSON-exportable object.
 *
 * Async because the IndexedDB read is async; localStorage values are raw
 * strings (no parsing), so malformed entries are exported as-is rather than
 * throwing. On the server (or when storage is unavailable) every value is
 * null.
 */
export async function collectUserData(): Promise<UserDataExport> {
  const localStorageExport: Record<string, string | null> = {};

  const canRead = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  for (const info of describeUserDataKeys()) {
    if (!canRead) {
      localStorageExport[info.key] = null;
      continue;
    }
    try {
      localStorageExport[info.key] = window.localStorage.getItem(info.key);
    } catch {
      // Storage disabled (private mode, security policy): treat as absent.
      localStorageExport[info.key] = null;
    }
  }

  let lastStdfSummary: unknown | null = null;
  if (typeof window !== 'undefined') {
    // Resolves to null on any IndexedDB failure (unavailable, quota, Safari
    // private mode) — see idb.ts; never throws.
    lastStdfSummary = await loadCachedStdf();
  }

  return {
    kind: USER_DATA_EXPORT_KIND,
    version: USER_DATA_EXPORT_VERSION,
    exportedAtIso: new Date().toISOString(),
    localStorage: localStorageExport,
    idb: { lastStdfSummary },
  };
}

export interface ClearUserDataOptions {
  /**
   * When true (the default), UI preferences (locale, theme, rail, collapsed
   * categories, glove mode) are preserved and only user content is cleared.
   */
  keepPreferences?: boolean;
}

/** The empty session document fab-session.ts stores before any user action. */
const EMPTY_FAB_SESSION: FabSessionState = {
  activeProject: null,
  activeLot: null,
  lastMetrology: null,
  flowProgress: {},
  customFlows: [],
};

// Keep in sync with DB_NAME in src/tools/stdf-klarf-explorer/idb.ts (not exported).
const STDF_CACHE_DB_NAME = 'semitools-stdf-cache';

/**
 * Deletes the STDF/KLARF Explorer's whole cache database. Hand-rolled because
 * idb.ts exposes a load API but no clear API. Best-effort: resolves on error
 * or on 'blocked' (a stuck connection) so the post-clear reload is never held
 * up — a failed deletion only means the cache survives.
 */
function clearStdfIdbCache(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }
    try {
      const request = indexedDB.deleteDatabase(STDF_CACHE_DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Fires the same 'storage' event the browser would deliver to *other* tabs, so
 * stores that have no write API (favorites) re-read storage and un-stale their
 * in-memory state in this tab too. No-op when the constructor is unavailable.
 */
function dispatchStorageRemoved(key: string): void {
  try {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
  } catch {
    // Very old engines without the StorageEvent constructor: the reload that
    // follows clearing fixes the store state anyway.
  }
}

/**
 * Clears user data from localStorage and the STDF IndexedDB cache.
 *
 * Returns a promise (deviating from a plain `void` on purpose): the IndexedDB
 * deletion is asynchronous, and the caller reloads the page afterwards — the
 * deletion must settle *before* that reload or a navigation could cancel it
 * and leave cleared content behind.
 *
 * Store re-sync decisions (removing a key behind a module store leaves its
 * in-memory state stale):
 * - Fab session: written through its own import API (`importFabSessionJson`
 *   with an empty document), which resets memory AND storage atomically; the
 *   key it re-writes is removed right after so storage ends up truly empty.
 * - Favorites: no clear API exists and `toggleFavoritePath` is unsafe here
 *   (it ADDS paths that are absent from memory), so the key is removed and
 *   the store's own cross-tab sync channel (a synthetic 'storage' event) is
 *   used to re-read it. The page reload after clearing is the fallback.
 * - Traveler history / scratchpad: plain component state re-read on reload;
 *   key removal is sufficient.
 * - Preferences (only when `keepPreferences` is false): removed and re-synced
 *   through the preferences store's 'storage' listener where it has one
 *   (collapsed/rail/theme; glove mode re-reads on reload).
 */
export async function clearUserData(options: ClearUserDataOptions = {}): Promise<void> {
  const { keepPreferences = true } = options;
  if (typeof window === 'undefined') return;

  // 1. Remove the raw keys (best-effort: storage may be unavailable).
  const remove = (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage disabled: nothing persisted in the first place.
    }
  };
  for (const key of CONTENT_KEYS) {
    remove(key);
  }
  if (!keepPreferences) {
    for (const key of PREFERENCE_KEYS) {
      remove(key);
    }
  }

  // 2. Re-sync the module stores (see the doc comment above).
  const emptyEnvelope = {
    kind: FAB_SESSION_EXPORT_KIND,
    version: FAB_SESSION_EXPORT_VERSION,
    exportedAtIso: new Date().toISOString(),
    state: EMPTY_FAB_SESSION,
  };
  if (importFabSessionJson(JSON.stringify(emptyEnvelope)).ok) {
    // The import writes an empty session document back; drop the key so the
    // next load starts from a clean slate instead of an empty document.
    remove(FAB_SESSION_STORAGE_KEY);
  }
  dispatchStorageRemoved(FAVORITES_KEY);
  if (!keepPreferences) {
    // The preferences store's listener re-reads these three keys (glove mode
    // and locale have no listener and refresh on the reload that follows).
    dispatchStorageRemoved(COLLAPSED_KEY);
    dispatchStorageRemoved(RAIL_KEY);
    dispatchStorageRemoved(THEME_KEY);
  }

  // 3. IndexedDB: await so the caller can reload immediately after.
  await clearStdfIdbCache();
}
