import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The IndexedDB loader is mocked at the module boundary: user-data.ts must pass
 * its result (or null) straight through into the export document. The real
 * loader's own failure handling ("null on any failure") is covered by idb.ts
 * and needs a browser IndexedDB, which jsdom does not provide.
 */
const loadCachedStdfMock = vi.hoisted(() => vi.fn(async (): Promise<unknown> => null));
vi.mock('@/tools/stdf-klarf-explorer/idb', () => ({ loadCachedStdf: loadCachedStdfMock }));

type UserDataModule = typeof import('./user-data');
type FabSessionModule = typeof import('./fab-session');
type FavoritesModule = typeof import('./favorites');

type Modules = {
  userData: UserDataModule;
  fabSession: FabSessionModule;
  favorites: FavoritesModule;
};

/**
 * user-data.ts reaches into the fab-session and favorites module stores, so
 * every test loads a fresh generation of all three modules together after
 * vi.resetModules() — the same pattern as fab-session.test.tsx.
 */
async function loadModules(): Promise<Modules> {
  vi.resetModules();
  const [userData, fabSession, favorites] = await Promise.all([
    import('./user-data'),
    import('./fab-session'),
    import('./favorites'),
  ]);
  return { userData, fabSession, favorites };
}

/** The exact localStorage manifest, mirrored here so key drift is caught. */
const KEYS = {
  locale: 'semitools:locale',
  theme: 'semitools:theme',
  collapsedCategories: 'semitools:collapsed-categories',
  railCollapsed: 'semitools:rail-collapsed',
  gloveMode: 'semitools_glove_mode',
  favorites: 'semitools:favorite-tools',
  scratchpad: 'semitools_fab_scratchpad',
  travelerHistory: 'semitools_traveler_history',
  fabSession: 'semitools_fab_session_v1',
  legacyWorkspace: 'semitools_fab_workspace_project_v1',
  legacyGenealogy: 'semitools_lot_genealogy_active',
} as const;

const PREFERENCE_KEYS = [
  KEYS.locale,
  KEYS.theme,
  KEYS.collapsedCategories,
  KEYS.railCollapsed,
  KEYS.gloveMode,
];

const CONTENT_KEYS = [
  KEYS.favorites,
  KEYS.scratchpad,
  KEYS.travelerHistory,
  KEYS.fabSession,
  KEYS.legacyWorkspace,
  KEYS.legacyGenealogy,
];

function seedAllKeys(): void {
  for (const key of [...PREFERENCE_KEYS, ...CONTENT_KEYS]) {
    window.localStorage.setItem(key, `value-of-${key}`);
  }
}

const EMPTY_FAB_SESSION = {
  activeProject: null,
  activeLot: null,
  lastMetrology: null,
  flowProgress: {},
  customFlows: [],
};

describe('user-data manifest', () => {
  it('lists exactly the storage keys SemiTools writes, with kinds and labels', async () => {
    const { userData } = await loadModules();
    const manifest = userData.describeUserDataKeys();

    expect(manifest.map((entry) => entry.key)).toEqual([
      ...PREFERENCE_KEYS,
      ...CONTENT_KEYS,
    ]);
    expect(manifest.filter((entry) => entry.kind === 'preference')).toHaveLength(5);
    expect(manifest.filter((entry) => entry.kind === 'content')).toHaveLength(6);
    for (const entry of manifest) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe('collectUserData', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loadCachedStdfMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.resetModules();
  });

  it('captures every stored value, kind and version; absent keys export as null', async () => {
    const { userData } = await loadModules();
    window.localStorage.setItem(KEYS.favorites, JSON.stringify(['/tools/wafer-area-calculator']));
    window.localStorage.setItem(KEYS.theme, 'dark');

    const result = await userData.collectUserData();

    expect(result.kind).toBe('semitools-user-data');
    expect(result.version).toBe(1);
    expect(typeof result.exportedAtIso).toBe('string');
    expect(result.localStorage[KEYS.favorites]).toBe(JSON.stringify(['/tools/wafer-area-calculator']));
    expect(result.localStorage[KEYS.theme]).toBe('dark');
    for (const key of [KEYS.locale, KEYS.gloveMode, KEYS.fabSession, KEYS.legacyWorkspace]) {
      expect(result.localStorage[key]).toBeNull();
    }
    expect(Object.keys(result.localStorage)).toHaveLength(11);
    // jsdom has no IndexedDB and the mocked loader resolves to null by default.
    expect(result.idb.lastStdfSummary).toBeNull();
    expect(loadCachedStdfMock).toHaveBeenCalledTimes(1);
  });

  it('exports malformed raw values as-is instead of throwing', async () => {
    const { userData } = await loadModules();
    window.localStorage.setItem(KEYS.favorites, '{not-json');
    window.localStorage.setItem(KEYS.fabSession, '{{{');

    const result = await userData.collectUserData();

    expect(result.localStorage[KEYS.favorites]).toBe('{not-json');
    expect(result.localStorage[KEYS.fabSession]).toBe('{{{');
  });

  it('includes the cached STDF summary from IndexedDB when present', async () => {
    loadCachedStdfMock.mockResolvedValueOnce({
      fileName: 'wafer5.std',
      timestamp: 1760000000000,
      summary: { header: { partCount: 7 } },
    });
    const { userData } = await loadModules();

    const result = await userData.collectUserData();

    expect(result.idb.lastStdfSummary).toEqual({
      fileName: 'wafer5.std',
      timestamp: 1760000000000,
      summary: { header: { partCount: 7 } },
    });
  });

  it('is SSR-safe: without a window nothing is read and the IDB loader is not called', async () => {
    const { userData } = await loadModules();
    vi.stubGlobal('window', undefined);

    try {
      const result = await userData.collectUserData();
      expect(Object.values(result.localStorage).every((value) => value === null)).toBe(true);
      expect(result.idb.lastStdfSummary).toBeNull();
      expect(loadCachedStdfMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('clearUserData', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loadCachedStdfMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.resetModules();
  });

  it('clears content keys and keeps UI preferences by default', async () => {
    const { userData } = await loadModules();
    seedAllKeys();

    await userData.clearUserData();

    for (const key of CONTENT_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    for (const key of PREFERENCE_KEYS) {
      expect(window.localStorage.getItem(key)).toBe(`value-of-${key}`);
    }
  });

  it('clears everything, preferences included, with keepPreferences: false', async () => {
    const { userData } = await loadModules();
    seedAllKeys();

    await userData.clearUserData({ keepPreferences: false });

    for (const key of [...PREFERENCE_KEYS, ...CONTENT_KEYS]) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  });

  it('re-syncs the Fab session store through its own import API', async () => {
    const { userData, fabSession } = await loadModules();
    const imported = fabSession.importFabSessionJson(
      JSON.stringify({
        kind: fabSession.FAB_SESSION_EXPORT_KIND,
        version: fabSession.FAB_SESSION_EXPORT_VERSION,
        exportedAtIso: '2026-01-01T00:00:00.000Z',
        state: {
          ...EMPTY_FAB_SESSION,
          customFlows: [
            { id: 'f1', name: 'Kept', toolPaths: ['/tools/wet-bench-calculator'], createdAtIso: '2026-01-01T00:00:00.000Z' },
          ],
        },
      }),
    );
    expect(imported).toEqual({ ok: true });
    expect(fabSession.getFabSession().customFlows).toHaveLength(1);
    expect(window.localStorage.getItem(KEYS.fabSession)).not.toBeNull();

    await userData.clearUserData();

    // The in-memory store is empty again AND the key is gone from storage.
    expect(fabSession.getFabSession()).toEqual(EMPTY_FAB_SESSION);
    expect(window.localStorage.getItem(KEYS.fabSession)).toBeNull();
  });

  it('re-syncs the favorites store through its storage-event channel', async () => {
    const { userData, favorites } = await loadModules();
    const TOOL_A = '/tools/wafer-area-calculator';
    const { result } = renderHook(() => {
      favorites.useHydrateFavorites();
      return favorites.useFavorites();
    });

    act(() => {
      favorites.toggleFavoritePath(TOOL_A);
    });
    expect(result.current.isFavorite(TOOL_A)).toBe(true);
    expect(window.localStorage.getItem(KEYS.favorites)).not.toBeNull();

    await act(async () => {
      await userData.clearUserData();
    });

    expect(result.current.isFavorite(TOOL_A)).toBe(false);
    expect(result.current.favorites).toEqual([]);
    expect(window.localStorage.getItem(KEYS.favorites)).toBeNull();
  });

  it('tolerates absent and malformed keys', async () => {
    const { userData } = await loadModules();
    window.localStorage.setItem(KEYS.favorites, '{oops');
    window.localStorage.setItem(KEYS.travelerHistory, '][');

    await expect(userData.clearUserData()).resolves.toBeUndefined();
    await expect(userData.clearUserData({ keepPreferences: false })).resolves.toBeUndefined();

    for (const key of [...PREFERENCE_KEYS, ...CONTENT_KEYS]) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  });
});
