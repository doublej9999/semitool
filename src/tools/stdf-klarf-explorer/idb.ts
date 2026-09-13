/**
 * Tiny promise-based IndexedDB cache for the STDF / KLARF Explorer.
 *
 * Stores the LAST successfully parsed STDF summary under the key
 * 'last-stdf-summary' in a database named 'semitools-stdf-cache', so a
 * reload can offer to restore the previous file without re-parsing (and
 * without the raw file, which was never persisted).
 *
 * No dependency: openDB/get/put are hand-rolled. Every entry point resolves
 * instead of throwing — IndexedDB can be unavailable or fail silently
 * (Safari private mode, disabled storage, quota errors), and the cache is
 * strictly best-effort: callers treat any failure as "no cache".
 */

import type { StdfParseSummary } from '@/lib/stdf-parser';

const DB_NAME = 'semitools-stdf-cache';
const DB_VERSION = 1;
const STORE_NAME = 'summaries';
export const LAST_STDF_CACHE_KEY = 'last-stdf-summary';

/** What the tool keeps in memory after reading the cache. */
export interface CachedStdfEntry {
  fileName: string;
  /** Epoch milliseconds of when the summary was parsed. */
  timestamp: number;
  summary: StdfParseSummary;
}

/** Serialized shape actually written to IndexedDB (summary as JSON string). */
interface StoredStdfEntry {
  fileName: string;
  timestamp: number;
  summaryJson: string;
}

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

/**
 * Reads the cached last-parsed STDF summary, or null when absent/unavailable.
 */
export async function loadCachedStdf(): Promise<CachedStdfEntry | null> {
  try {
    const db = await openCacheDb();
    try {
      const stored = await new Promise<StoredStdfEntry | undefined>((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(LAST_STDF_CACHE_KEY);
        request.onsuccess = () => resolve(request.result as StoredStdfEntry | undefined);
        request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB'));
      });
      if (!stored || typeof stored.summaryJson !== 'string') return null;
      return { fileName: stored.fileName, timestamp: stored.timestamp, summary: JSON.parse(stored.summaryJson) as StdfParseSummary };
    } finally {
      db.close();
    }
  } catch {
    // Best-effort cache: unavailable storage (e.g. Safari private mode) = no cache.
    return null;
  }
}

/**
 * Replaces the cached entry with the given parse result.
 * Resolves to false (instead of throwing) when the cache is unavailable.
 */
export async function saveCachedStdf(entry: {
  fileName: string;
  timestamp: number;
  summary: StdfParseSummary;
}): Promise<boolean> {
  try {
    const db = await openCacheDb();
    try {
      // Serialize after the open await so a large summary does not block the
      // post-parse paint.
      const stored: StoredStdfEntry = {
        fileName: entry.fileName,
        timestamp: entry.timestamp,
        summaryJson: JSON.stringify(entry.summary),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(stored, LAST_STDF_CACHE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Failed to write IndexedDB'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
      });
      return true;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}
