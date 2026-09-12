import { useEffect, useSyncExternalStore } from 'react';
import type { FilmStackProject } from './film-stack';
import type { LotGenealogy } from './lot-genealogy';

/**
 * Unified Fab Workspace session: the one place where the film-stack project,
 * the virtual genealogy lot, the latest metrology import, workflow progress and
 * user-defined flows meet. Persisted as a single localStorage document and
 * exposed through the same module-store pattern as preferences/favorites.
 */
export const FAB_SESSION_STORAGE_KEY = 'semitools_fab_session_v1';

/** Legacy keys migrated once into the session document on first load. */
const LEGACY_WORKSPACE_KEY = 'semitools_fab_workspace_project_v1';
const LEGACY_GENEALOGY_KEY = 'semitools_lot_genealogy_active';

export interface FabMetrologySummary {
  /** Where the data came from (tool name / pasted label). */
  source: string;
  subgroupCount: number;
  totalPoints: number;
  mean: number;
  stdDev: number;
  outlierMethod: 'tukey' | 'three_sigma' | 'none';
  target?: number;
  lsl?: number;
  usl?: number;
  timestampIso: string;
}

export interface CustomFlow {
  id: string;
  name: string;
  /** Ordered registry tool paths. */
  toolPaths: string[];
  createdAtIso: string;
}

export interface FabSessionState {
  activeProject: FilmStackProject | null;
  activeLot: LotGenealogy | null;
  lastMetrology: FabMetrologySummary | null;
  /** flowId -> completed step indices. */
  flowProgress: Record<string, number[]>;
  customFlows: CustomFlow[];
}

const EMPTY_SESSION: FabSessionState = {
  activeProject: null,
  activeLot: null,
  lastMetrology: null,
  flowProgress: {},
  customFlows: [],
};

let state: FabSessionState = EMPTY_SESSION;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeThrough(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAB_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the session still works in-memory for this page.
  }
}

function readJson(key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function loadFromStorage(): void {
  if (typeof window === 'undefined') return;
  const next: FabSessionState = { ...EMPTY_SESSION, flowProgress: {}, customFlows: [] };

  const raw = readJson(FAB_SESSION_STORAGE_KEY);
  if (raw) {
    if (isRecord(raw.activeProject)) next.activeProject = raw.activeProject as unknown as FilmStackProject;
    if (isRecord(raw.activeLot)) next.activeLot = raw.activeLot as unknown as LotGenealogy;
    if (isRecord(raw.lastMetrology)) next.lastMetrology = raw.lastMetrology as unknown as FabMetrologySummary;
    if (isRecord(raw.flowProgress)) {
      const progress: Record<string, number[]> = {};
      for (const [flowId, indices] of Object.entries(raw.flowProgress)) {
        if (Array.isArray(indices)) {
          progress[flowId] = indices.filter((i): i is number => typeof i === 'number');
        }
      }
      next.flowProgress = progress;
    }
    if (Array.isArray(raw.customFlows)) {
      next.customFlows = raw.customFlows.filter(isRecord).map((flow) => ({
        id: String(flow.id ?? ''),
        name: String(flow.name ?? 'Custom flow'),
        toolPaths: Array.isArray(flow.toolPaths) ? flow.toolPaths.map(String) : [],
        createdAtIso: String(flow.createdAtIso ?? ''),
      }));
    }
  } else {
    // One-time migration from the pre-session per-feature keys.
    const legacyProject = readJson(LEGACY_WORKSPACE_KEY);
    if (legacyProject && legacyProject.schemaVersion === '1.0.0') {
      next.activeProject = legacyProject as unknown as FilmStackProject;
    }
    const legacyLot = readJson(LEGACY_GENEALOGY_KEY);
    if (legacyLot && Array.isArray(legacyLot.branches)) {
      next.activeLot = legacyLot as unknown as LotGenealogy;
    }
  }

  state = next;
  hydrated = true;
  emit();
}

/** Current session snapshot; safe to call outside React (empty until hydration). */
export function getFabSession(): FabSessionState {
  return hydrated ? state : EMPTY_SESSION;
}

export function setActiveProject(project: FilmStackProject): void {
  state = { ...state, activeProject: project };
  writeThrough();
  emit();
}

export function setActiveLot(lot: LotGenealogy | null): void {
  state = { ...state, activeLot: lot };
  writeThrough();
  emit();
}

export function setLastMetrology(summary: FabMetrologySummary | null): void {
  state = { ...state, lastMetrology: summary };
  writeThrough();
  emit();
}

export function toggleFlowStep(flowId: string, stepIndex: number): void {
  const done = state.flowProgress[flowId] ?? [];
  const next = done.includes(stepIndex) ? done.filter((i) => i !== stepIndex) : [...done, stepIndex];
  state = { ...state, flowProgress: { ...state.flowProgress, [flowId]: next } };
  writeThrough();
  emit();
}

export function resetFlowProgress(flowId: string): void {
  const { [flowId]: _removed, ...rest } = state.flowProgress;
  state = { ...state, flowProgress: rest };
  writeThrough();
  emit();
}

export function addCustomFlow(name: string, toolPaths: string[]): CustomFlow {
  const flow: CustomFlow = {
    id: `flow-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    toolPaths,
    createdAtIso: new Date().toISOString(),
  };
  state = { ...state, customFlows: [...state.customFlows, flow] };
  writeThrough();
  emit();
  return flow;
}

export function removeCustomFlow(id: string): void {
  state = { ...state, customFlows: state.customFlows.filter((flow) => flow.id !== id) };
  writeThrough();
  emit();
}

export function useFabSession(): FabSessionState {
  return useSyncExternalStore(subscribe, () => (hydrated ? state : EMPTY_SESSION), () => EMPTY_SESSION);
}

/** Loads the session once after mount. Call from the application shell. */
export function useHydrateFabSession(): void {
  useEffect(() => {
    if (!hydrated) {
      loadFromStorage();
    }
    const onStorage = (event: StorageEvent): void => {
      if (event.key === FAB_SESSION_STORAGE_KEY) {
        loadFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
