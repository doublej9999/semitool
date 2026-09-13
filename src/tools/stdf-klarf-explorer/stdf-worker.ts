/**
 * Web Worker entry point for the STDF / KLARF Explorer.
 *
 * Runs `parseStdfV4` and `parseKlarf` off the main thread so large datalogs
 * do not freeze the UI. Protocol:
 * - main thread -> worker: `{ type: 'parse', id, buffer }` (ArrayBuffer,
 *   transferred, so it becomes unusable on the main thread) or
 *   `{ type: 'parse-klarf', id, text }` (KLARF ASCII source, structured
 *   cloned — the main thread keeps its own copy).
 * - worker -> main thread: `{ type: 'parsed', id, summary }`,
 *   `{ type: 'klarf-parsed', id, summary }` or
 *   `{ type: 'error', id, message, buffer? }`. On a parse error the STDF
 *   input buffer is transferred back so the caller can fall back to an
 *   inline parse (KLARF needs no such hand-back: the text never left the
 *   main thread). The `id` echoes the request so concurrent loads cannot
 *   consume each other's response.
 *
 * Both summaries are plain JSON-safe data (no functions, no class instances
 * — the parsers never retain their readers), so they cross the worker
 * boundary via structured clone unchanged.
 *
 * Inside this worker the STDF parser's PTR retention cap is raised from the
 * default 5,000 to 200,000 records: off the main thread the memory cost is
 * acceptable and deep datalogs keep their full parametric sample. The
 * main-thread fallback keeps the default cap.
 */

/// <reference lib="webworker" />

import { parseKlarf } from '@/lib/klarf-parser';
import type { KlarfSummary } from '@/lib/klarf-parser';
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

export interface KlarfParseRequest {
  type: 'parse-klarf';
  /** Echoed in the response so concurrent requests can be matched. */
  id: number;
  text: string;
}

export type WorkerRequest = StdfParseRequest | KlarfParseRequest;

export type StdfParseResponse = { type: 'parsed'; id: number; summary: StdfParseSummary };
export type KlarfParseResponse = { type: 'klarf-parsed'; id: number; summary: KlarfSummary };
export type WorkerErrorResponse = { type: 'error'; id: number; message: string; buffer?: ArrayBuffer };

export type WorkerResponse = StdfParseResponse | KlarfParseResponse | WorkerErrorResponse;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (!request) return;

  try {
    if (request.type === 'parse') {
      const summary = parseStdfV4(request.buffer, { ptrLimit: WORKER_PTR_LIMIT });
      ctx.postMessage({ type: 'parsed', id: request.id, summary } satisfies WorkerResponse);
    } else if (request.type === 'parse-klarf') {
      const summary = parseKlarf(request.text);
      ctx.postMessage({ type: 'klarf-parsed', id: request.id, summary } satisfies WorkerResponse);
    } else {
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Hand the STDF buffer back (transferred) so the main thread can retry
    // inline; KLARF requests carry no transferable payload.
    const buffer = request.type === 'parse' ? request.buffer : undefined;
    const canReturnBuffer = Boolean(buffer?.byteLength);
    try {
      if (canReturnBuffer) {
        ctx.postMessage(
          { type: 'error', id: request.id, message, buffer } satisfies WorkerResponse,
          [buffer] as unknown as Transferable[],
        );
      } else {
        ctx.postMessage({ type: 'error', id: request.id, message } satisfies WorkerResponse);
      }
    } catch {
      // Detached or unclonable payload — nothing more we can do here.
    }
  }
};
