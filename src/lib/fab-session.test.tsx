import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewLot } from './lot-genealogy';
import { createDefaultFilmStackProject } from './film-stack';

type FabSessionModule = typeof import('./fab-session');

/** Fresh module per test so the module-level store state resets too. */
async function loadFreshModule(): Promise<FabSessionModule> {
  vi.resetModules();
  return import('./fab-session');
}

describe('fab-session store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.resetModules();
  });

  it('starts empty before hydration and persists actions once hydrated', async () => {
    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    expect(result.current.activeProject).toBeNull();

    const project = createDefaultFilmStackProject('Test Project');
    act(() => {
      mod.setActiveProject(project);
    });

    expect(result.current.activeProject?.name).toBe('Test Project');
    const raw = window.localStorage.getItem(mod.FAB_SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).activeProject.name).toBe('Test Project');
  });

  it('migrates legacy workspace and genealogy keys on first load', async () => {
    const legacyProject = createDefaultFilmStackProject('Legacy Project');
    const legacyLot = createNewLot('LOT-LEGACY', 'DEV-OLD', 300, 25);
    window.localStorage.setItem('semitools_fab_workspace_project_v1', JSON.stringify(legacyProject));
    window.localStorage.setItem('semitools_lot_genealogy_active', JSON.stringify(legacyLot));

    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    expect(result.current.activeProject?.name).toBe('Legacy Project');
    expect(result.current.activeLot?.lotId).toBe('LOT-LEGACY');
  });

  it('prefers an existing session document over legacy keys', async () => {
    const mod = await loadFreshModule();
    window.localStorage.setItem(
      mod.FAB_SESSION_STORAGE_KEY,
      JSON.stringify({ customFlows: [{ id: 'f1', name: 'Kept', toolPaths: ['/tools/wet-bench-calculator'], createdAtIso: '2026-01-01' }] }),
    );
    window.localStorage.setItem('semitools_fab_workspace_project_v1', JSON.stringify(createDefaultFilmStackProject('Legacy')));
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    expect(result.current.customFlows[0].name).toBe('Kept');
    expect(result.current.activeProject).toBeNull();
  });

  it('toggles and resets flow progress', async () => {
    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    act(() => {
      mod.toggleFlowStep('flow-a', 0);
      mod.toggleFlowStep('flow-a', 2);
      mod.toggleFlowStep('flow-a', 0); // toggle off
    });
    expect(result.current.flowProgress['flow-a']).toEqual([2]);

    act(() => {
      mod.resetFlowProgress('flow-a');
    });
    expect(result.current.flowProgress['flow-a']).toBeUndefined();
  });

  it('adds and removes custom flows with persistence', async () => {
    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    act(() => {
      mod.addCustomFlow('My Damascene Flow', ['/tools/wet-bench-calculator', '/tools/cmp-preston-calculator']);
      mod.setLastMetrology({
        source: 'test',
        subgroupCount: 5,
        totalPoints: 25,
        mean: 45.12,
        stdDev: 0.8,
        outlierMethod: 'tukey',
        timestampIso: new Date().toISOString(),
      });
      mod.setActiveLot(createNewLot('LOT-X', 'DEV-X', 300, 10));
    });

    expect(result.current.customFlows).toHaveLength(1);
    expect(result.current.customFlows[0].toolPaths).toHaveLength(2);
    expect(result.current.lastMetrology?.totalPoints).toBe(25);
    expect(result.current.activeLot?.lotId).toBe('LOT-X');

    act(() => {
      mod.removeCustomFlow(result.current.customFlows[0].id);
    });
    expect(result.current.customFlows).toHaveLength(0);

    const raw = JSON.parse(window.localStorage.getItem(mod.FAB_SESSION_STORAGE_KEY) as string);
    expect(raw.customFlows).toHaveLength(0);
    expect(raw.lastMetrology.source).toBe('test');
  });
});

describe('fab-session export/import', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.resetModules();
  });

  it('round-trips a full session through export and import', async () => {
    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    act(() => {
      mod.setActiveProject(createDefaultFilmStackProject('Round Trip'));
      mod.setActiveLot(createNewLot('LOT-RT', 'DEV-RT', 300, 12));
      mod.setLastMetrology({
        source: 'round-trip',
        subgroupCount: 2,
        totalPoints: 10,
        mean: 10,
        stdDev: 0.5,
        outlierMethod: 'none',
        timestampIso: '2026-01-02T03:04:05.000Z',
      });
      const flow = mod.addCustomFlow('RT Flow', ['/tools/wet-bench-calculator', '/tools/etch-rate-calculator']);
      mod.toggleFlowStep(flow.id, 1);
    });

    const before = result.current;
    const json = mod.exportFabSessionJson();
    const envelope = JSON.parse(json);
    expect(envelope.kind).toBe('semitools-fab-session');
    expect(envelope.version).toBe(1);
    expect(typeof envelope.exportedAtIso).toBe('string');
    expect(envelope.state.customFlows).toHaveLength(1);

    // Import into a pristine store (fresh module) and require exact equality.
    const mod2 = await loadFreshModule();
    const importResult = mod2.importFabSessionJson(json);
    expect(importResult).toEqual({ ok: true });
    expect(mod2.getFabSession()).toEqual(before);
    expect(JSON.parse(window.localStorage.getItem(mod2.FAB_SESSION_STORAGE_KEY) as string)).toEqual(before);
  });

  it('imports into a pristine (never hydrated) store and persists through', async () => {
    const mod = await loadFreshModule();
    const json = JSON.stringify({
      kind: 'semitools-fab-session',
      version: 1,
      exportedAtIso: '2026-01-01T00:00:00.000Z',
      state: {
        activeProject: null,
        activeLot: null,
        lastMetrology: null,
        flowProgress: { f1: [0, 2] },
        customFlows: [
          { id: 'f1', name: 'Hand Made', toolPaths: ['/tools/wet-bench-calculator', '/tools/etch-rate-calculator'], createdAtIso: '2026-01-01T00:00:00.000Z' },
        ],
      },
    });

    expect(mod.importFabSessionJson(json)).toEqual({ ok: true });
    const session = mod.getFabSession();
    expect(session.customFlows[0].name).toBe('Hand Made');
    expect(session.flowProgress.f1).toEqual([0, 2]);
    expect(JSON.parse(window.localStorage.getItem(mod.FAB_SESSION_STORAGE_KEY) as string).customFlows[0].name).toBe('Hand Made');
  });

  it('rejects corrupt JSON and wrong envelopes without mutating state', async () => {
    const mod = await loadFreshModule();
    const { result } = renderHook(() => {
      mod.useHydrateFabSession();
      return mod.useFabSession();
    });

    act(() => {
      mod.addCustomFlow('Keep Me', ['/tools/wet-bench-calculator', '/tools/etch-rate-calculator']);
    });
    const snapshot = result.current;

    const corrupt = mod.importFabSessionJson('{oops');
    expect(corrupt.ok).toBe(false);
    if (!corrupt.ok) expect(typeof corrupt.error).toBe('string');

    expect(mod.importFabSessionJson(JSON.stringify({ kind: 'other-tool-state', version: 1, state: {} }))).toMatchObject({ ok: false });
    expect(mod.importFabSessionJson(JSON.stringify({ kind: 'semitools-fab-session', version: 99, state: {} }))).toMatchObject({ ok: false });
    expect(mod.importFabSessionJson(JSON.stringify({ kind: 'semitools-fab-session', version: 1, state: { customFlows: 'nope' } }))).toMatchObject({ ok: false });
    expect(
      mod.importFabSessionJson(
        JSON.stringify({
          kind: 'semitools-fab-session',
          version: 1,
          state: { activeProject: null, activeLot: null, lastMetrology: null, flowProgress: { f1: ['zero'] }, customFlows: [] },
        }),
      ),
    ).toMatchObject({ ok: false });
    expect(
      mod.importFabSessionJson(
        JSON.stringify({
          kind: 'semitools-fab-session',
          version: 1,
          state: { activeProject: null, activeLot: null, lastMetrology: null, flowProgress: {}, customFlows: [{ id: 'x', name: 'X', toolPaths: [42] }] },
        }),
      ),
    ).toMatchObject({ ok: false });

    expect(result.current).toEqual(snapshot);
    expect(JSON.parse(window.localStorage.getItem(mod.FAB_SESSION_STORAGE_KEY) as string).customFlows).toHaveLength(1);
  });
});
