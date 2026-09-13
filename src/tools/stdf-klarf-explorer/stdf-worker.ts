/**
 * Web Worker entry point for the STDF / KLARF Explorer.
 *
 * Runs `parseStdfV4` off the main thread so large datalogs do not freeze the
 * UI. Protocol:
 * - main thread -> worker: `{ type: 'parse', id, buffer }` (ArrayBuffer,
 *   transferred, so it becomes unusable on the main thread)
 * - worker -> main thread: `{ type: 'parsed', id, summary }` or
 *   `{ type: 'error', id, message, buffer? }`. On a parse error the input
 *   buffer is transferred back so the caller can fall back to an inline
 *   parse. The `id` echoes the request so concurrent loads cannot consume
 *   each other's response.
 *
 * `StdfParseSummary` is plain JSON-safe data (no functions, no class
 * instances — the parser never retains `StdfBinaryReader`), so it crosses
 * the worker boundary via structured clone unchanged.
 *
 * Inside this worker the parser's PTR retention cap is raised from the
 * default 5,000 to 200,000 records: off the main thread the memory cost is
 * acceptable and deep datalogs keep their full parametric sample. The
 * main-thread fallback keeps the default cap.
 */

/// <reference lib="webworker" />

import { parseStdfV4 } from '@/lib/stdf-parser';
import type { StdfParseSummary } from '@/lib/stdf-parser';

/** Raised PTR retention cap for background parsing. */
export const WORKER_PTR_LIMIT = 200000;

export interface StdfParseRequest {
  type: 'parse';
  /** Echoed in the response so concurrent requests can be matched. */
  id: number;
  buffer: ArrayBuffer;
}

export type StdfParseResponse =
  | { type: 'parsed'; id: number; summary: StdfParseSummary }
  | { type: 'error'; id: number; message: string; buffer?: ArrayBuffer };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<StdfParseRequest>) => {
  const request = event.data;
  if (!request || request.type !== 'parse') return;

  try {
    const summary = parseStdfV4(request.buffer, { ptrLimit: WORKER_PTR_LIMIT });
    ctx.postMessage({ type: 'parsed', id: request.id, summary } satisfies StdfParseResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Hand the buffer back (transferred) so the main thread can retry inline.
    const canReturnBuffer = Boolean(request.buffer?.byteLength);
    try {
      if (canReturnBuffer) {
        ctx.postMessage(
          { type: 'error', id: request.id, message, buffer: request.buffer } satisfies StdfParseResponse,
          [request.buffer] as unknown as Transferable[],
        );
      } else {
        ctx.postMessage({ type: 'error', id: request.id, message } satisfies StdfParseResponse);
      }
    } catch {
      // Detached or unclonable payload — nothing more we can do here.
    }
  }
};
