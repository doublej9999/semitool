'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  History,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
// Type-only imports: the parsers themselves are loaded on demand (see the
// `import('@/lib/...')` fallback call sites below). Normal parsing runs in
// the background worker — which bundles its own copies — so the main-thread
// parsers are only fetched when the worker is unavailable or failed, keeping
// them (and monte-carlo, via klarf-parser) out of the initial route bundle.
import type { StdfParseSummary, StdfParametricTestRecord } from '@/lib/stdf-parser';
import type { KlarfSummary } from '@/lib/klarf-parser';
import {
  binSummary,
  groupByTest,
  splitTestGroupKey,
  summarizeTest,
  trendValues,
} from '@/lib/parametric-analysis';
import { downloadCsv } from '@/lib/export';
import { formatSubgroupsForSpc } from '@/lib/metrology-batch';
import { useUrlParamsState } from '@/lib/use-url-state';
import { useGlossary } from '@/lib/i18n/glossary';
import { loadCachedStdf, saveCachedStdf, type CachedStdfEntry } from './idb';
import type { WorkerRequest, WorkerResponse } from './stdf-worker';

interface TestRow {
  key: string;
  name: string;
  units: string;
  testNumber: number;
  records: StdfParametricTestRecord[];
  trend: number[];
  lsl?: number;
  usl?: number;
  summary: ReturnType<typeof summarizeTest>;
}

interface LimitInput {
  lsl: string;
  usl: string;
}

const round = (value: number): number => Number(value.toFixed(4));
const formatLimit = (value: number): string => String(Number(value.toPrecision(6)));

function parseLimit(text: string | undefined): number | undefined {
  const trimmed = (text ?? '').trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** First finite low/high limit found in a test's PTR records (the file's own specs). */
function fileDefaultLimits(records: StdfParametricTestRecord[]): { lsl?: number; usl?: number } {
  let lsl: number | undefined;
  let usl: number | undefined;
  for (const record of records) {
    if (lsl === undefined && Number.isFinite(record.lowLimit)) lsl = record.lowLimit;
    if (usl === undefined && Number.isFinite(record.highLimit)) usl = record.highLimit;
    if (lsl !== undefined && usl !== undefined) break;
  }
  return { lsl, usl };
}

/**
 * Serializes a test's results into the SPC Control Chart deep link using the
 * same `subgroups` URL contract as `buildSpcCalculatorUrl` in metrology-batch:
 * comma-separated readings per line, fixed subgroup size, at least 2 subgroups.
 */
function buildSpcUrl(values: number[], subgroupSize = 5): string | null {
  const usableCount = Math.floor(values.length / subgroupSize) * subgroupSize;
  if (usableCount / subgroupSize < 2) return null;

  const subgroups: number[][] = [];
  for (let index = 0; index < usableCount; index += subgroupSize) {
    subgroups.push(values.slice(index, index + subgroupSize));
  }

  const params = new URLSearchParams();
  params.set('subgroups', formatSubgroupsForSpc(subgroups));
  return `/tools/spc-control-chart-calculator?${params.toString()}`;
}

function looksLikeKlarfText(text: string): boolean {
  return /FileVersion\s|DefectRecordSpec|WaferID\s|InspectionStationID/i.test(text.slice(0, 2000));
}

function looksLikeKlarfBuffer(buffer: ArrayBuffer): boolean {
  const sample = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 1024)));
  return looksLikeKlarfText(sample);
}

/**
 * Normalizes file bytes into a plain, exactly-sized ArrayBuffer for the
 * worker message (copying only when a Uint8Array view is not its whole
 * buffer, e.g. a sliced view).
 */
function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  return data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
    ? (data.buffer as ArrayBuffer)
    : (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
}

/** Parse failure that may carry a buffer the main thread can retry with. */
class WorkerParseError extends Error {
  /** Valid buffer for an inline retry, when one survived. */
  buffer?: ArrayBuffer;

  constructor(message: string, buffer?: ArrayBuffer) {
    super(message);
    this.name = 'WorkerParseError';
    this.buffer = buffer;
  }
}

/**
 * Correlation view lives in its own chunk: it only renders once STDF data is
 * loaded, so the initial route bundle does not pay for the scatter plot and
 * correlation tables.
 */
const CorrelationPanel = dynamic(() => import('./CorrelationPanel'), {
  ssr: false,
  loading: () => <CorrelationPanelFallback />,
});

/** Placeholder styled like the correlation panel, shown while its chunk loads. */
function CorrelationPanelFallback() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px',
        background: 'var(--panel-subtle)',
      }}
    >
      <h3 style={{ marginTop: 0 }}>PTR correlation</h3>
      <p role="status" className="note" style={{ marginBottom: 0 }}>
        Loading correlation panel…
      </p>
    </div>
  );
}

export default function StdfKlarfExplorer() {
  const [stdf, setStdf] = useState<StdfParseSummary | null>(null);
  const [klarf, setKlarf] = useState<KlarfSummary | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [cachedEntry, setCachedEntry] = useState<CachedStdfEntry | null>(null);
  const [limits, setLimits] = useState<Record<string, LimitInput>>({});
  const [loadId, setLoadId] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const workerFailedRef = useRef(false);
  const nextRequestIdRef = useRef(1);
  const [urlState, setUrlState] = useState({ q: '' });
  useUrlParamsState(urlState, setUrlState);
  const search = urlState.q;
  const g = useGlossary();

  // Best-effort look at the IndexedDB cache on mount — offered as a restore
  // button, never auto-loaded.
  useEffect(() => {
    let cancelled = false;
    void loadCachedStdf().then((entry) => {
      if (!cancelled && entry) setCachedEntry(entry);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Terminate the background parser when the explorer unmounts.
  useEffect(() => () => workerRef.current?.terminate(), []);

  const groups = useMemo(
    () => (stdf ? [...groupByTest(stdf.parametricTests).entries()] : []),
    [stdf],
  );

  const testRows = useMemo<TestRow[]>(
    () =>
      groups.map(([key, records]) => {
        const { name, units } = splitTestGroupKey(key);
        const saved = limits[key] ?? { lsl: '', usl: '' };
        const lsl = parseLimit(saved.lsl);
        const usl = parseLimit(saved.usl);
        return {
          key,
          name,
          units,
          testNumber: records[0]?.testNumber ?? 0,
          records,
          trend: trendValues(records),
          lsl,
          usl,
          summary: summarizeTest(records, { lsl, usl }),
        };
      }),
    [groups, limits],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return testRows;
    return testRows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.units.toLowerCase().includes(query) ||
        String(row.testNumber).includes(query),
    );
  }, [testRows, search]);

  const bins = useMemo(() => (stdf ? binSummary(stdf.parts) : []), [stdf]);

  /** Validates and applies a parsed STDF summary; returns false when the file has no recognizable content. */
  const applyStdfSummary = useCallback((summary: StdfParseSummary, name: string): boolean => {
    const hasContent = Boolean(summary.mir || summary.wrr) || summary.totalParts > 0 || summary.parametricTests.length > 0;
    if (!hasContent) {
      setError(`"${name}" does not contain recognizable STDF V4 records (FAR / MIR / PRR / PTR).`);
      return false;
    }

    const nextLimits: Record<string, LimitInput> = {};
    for (const [key, records] of groupByTest(summary.parametricTests)) {
      const defaults = fileDefaultLimits(records);
      nextLimits[key] = {
        lsl: defaults.lsl !== undefined ? formatLimit(defaults.lsl) : '',
        usl: defaults.usl !== undefined ? formatLimit(defaults.usl) : '',
      };
    }

    setStdf(summary);
    setLimits(nextLimits);
    setKlarf(null);
    setFileName(name);
    setError(null);
    // Remounts the correlation panel so its test selection resets per load.
    setLoadId((id) => id + 1);
    return true;
  }, []);

  /**
   * Sends one request to the background parser worker and resolves with the
   * matching summary. Handles worker construction (marking the session as
   * worker-less when unavailable), request-id matching so concurrent loads
   * cannot consume each other's response, and the failure path: any error
   * terminates the worker, so the caller retries inline.
   */
  const requestWorkerParse = useCallback(
    async <S,>(
      build: (id: number) => { request: WorkerRequest; transfer: Transferable[] },
      successType: 'parsed' | 'klarf-parsed',
    ): Promise<S> => {
      let worker = workerRef.current;
      if (!worker) {
        try {
          worker = new Worker(new URL('./stdf-worker.ts', import.meta.url));
        } catch (error) {
          // Worker construction is unavailable (old browser, locked-down env):
          // degrade to inline parsing for the rest of the session.
          workerFailedRef.current = true;
          throw new WorkerParseError(error instanceof Error ? error.message : String(error));
        }
        workerRef.current = worker;
      }

      const requestId = nextRequestIdRef.current++;
      const { request, transfer } = build(requestId);
      return await new Promise<S>((resolve, reject) => {
        const active = worker!;
        const cleanup = () => {
          active.removeEventListener('message', onMessage);
          active.removeEventListener('error', onError);
        };
        const fail = (message: string, buffer?: ArrayBuffer) => {
          cleanup();
          active.terminate();
          workerRef.current = null;
          reject(new WorkerParseError(message, buffer));
        };
        const onMessage = (event: MessageEvent<WorkerResponse>) => {
          const response = event.data;
          // Responses carry the request id: ignore anything not ours (a
          // concurrent load owns its own listener).
          if (!response || response.id !== requestId) return;
          if (response.type === successType) {
            cleanup();
            resolve(response.summary as S);
          } else if (response.type === 'error') {
            // The worker hands the input buffer back (STDF only) so we can
            // retry inline.
            fail(response.message, response.buffer);
          }
        };
        const onError = (event: ErrorEvent) => {
          // The worker crashed (transferred buffer is unrecoverable): stop
          // using workers for the session to avoid repeat crashes.
          workerFailedRef.current = true;
          fail(event.message || `Background ${successType === 'parsed' ? 'STDF' : 'KLARF'} parser crashed.`);
        };
        active.addEventListener('message', onMessage);
        active.addEventListener('error', onError);
        active.postMessage(request, transfer);
      });
    },
    [],
  );

  /**
   * Parses STDF in the background worker (raised PTR cap). Rejects with a
   * `WorkerParseError` carrying a usable buffer whenever one survived, so
   * the caller can retry inline.
   */
  const parseStdfViaWorker = useCallback(
    (buffer: ArrayBuffer): Promise<StdfParseSummary> =>
      requestWorkerParse<StdfParseSummary>(
        (id) => ({ request: { type: 'parse', id, buffer }, transfer: [buffer] }),
        'parsed',
      ),
    [requestWorkerParse],
  );

  /**
   * Parses KLARF in the background worker. The request text is structured
   * cloned (not transferred), so the main thread keeps its own copy and can
   * always retry inline after a `WorkerParseError`.
   */
  const parseKlarfViaWorker = useCallback(
    (text: string): Promise<KlarfSummary> =>
      requestWorkerParse<KlarfSummary>(
        (id) => ({ request: { type: 'parse-klarf', id, text }, transfer: [] }),
        'klarf-parsed',
      ),
    [requestWorkerParse],
  );

  const loadStdf = useCallback(
    async (data: ArrayBuffer | Uint8Array, name: string) => {
      setParsing(true);
      setError(null);
      try {
        const buffer = toArrayBuffer(data);
        let summary: StdfParseSummary | null = null;
        let workerFailure: WorkerParseError | null = null;

        // Main-thread parser, fetched on demand: only the worker-less and
        // worker-failed fallbacks ever pay for this chunk.
        const parseStdfInline = async (inlineBuffer: ArrayBuffer): Promise<StdfParseSummary | null> => {
          try {
            const { parseStdfV4 } = await import('@/lib/stdf-parser');
            return parseStdfV4(inlineBuffer);
          } catch {
            return null;
          }
        };

        // STDF parsing runs off the main thread when workers are available;
        // SSR, tests and locked-down environments take the synchronous
        // fallback path with the parser's default PTR cap (5,000).
        if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && !workerFailedRef.current) {
          try {
            summary = await parseStdfViaWorker(buffer);
          } catch (error) {
            workerFailure = error instanceof WorkerParseError ? error : new WorkerParseError(String(error));
            const retryBuffer =
              workerFailure.buffer && workerFailure.buffer.byteLength > 0
                ? workerFailure.buffer
                : buffer.byteLength > 0
                  ? buffer
                  : null;
            if (retryBuffer) {
              summary = await parseStdfInline(retryBuffer);
            }
          }
        } else if (buffer.byteLength > 0) {
          summary = await parseStdfInline(buffer);
        }

        if (summary && applyStdfSummary(summary, name)) {
          // Best-effort local cache of the last parsed file (IndexedDB).
          void saveCachedStdf({ fileName: name, timestamp: Date.now(), summary });
        } else if (!summary) {
          setError(
            workerFailure
              ? `Background STDF parsing failed (${workerFailure.message}). Drop the file again to retry.`
              : `"${name}" could not be parsed as STDF V4.`,
          );
        }
      } finally {
        setParsing(false);
      }
    },
    [applyStdfSummary, parseStdfViaWorker],
  );

  /**
   * Generates and loads the synthetic demo STDF. The generator chunk
   * (`./demo`) is imported on demand: the demo is a one-shot convenience, so
   * the initial route bundle does not pay for it.
   */
  const loadDemoStdf = useCallback(async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    setError(null);
    try {
      const { buildDemoStdf } = await import('./demo');
      await loadStdf(buildDemoStdf(), 'synthetic-demo.std');
    } catch (error) {
      setError(
        `Failed to generate the synthetic demo: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setDemoLoading(false);
    }
  }, [demoLoading, loadStdf]);

  /**
   * Parses KLARF with the same ladder as STDF: background worker when
   * available, inline retry after a worker failure, inline directly when
   * workers are unavailable. The request text is never transferred, so the
   * inline retry is always possible.
   */
  const loadKlarf = useCallback(
    async (text: string, name: string) => {
      setParsing(true);
      setError(null);
      try {
        // Main-thread parser, fetched on demand: only the worker-less and
        // worker-failed fallbacks ever pay for this chunk (and monte-carlo,
        // which klarf-parser pulls in).
        const parseKlarfInline = async (): Promise<KlarfSummary | null> => {
          try {
            const { parseKlarf } = await import('@/lib/klarf-parser');
            return parseKlarf(text);
          } catch {
            return null;
          }
        };

        let summary: KlarfSummary | null = null;
        let workerFailure: WorkerParseError | null = null;

        if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && !workerFailedRef.current) {
          try {
            summary = await parseKlarfViaWorker(text);
          } catch (error) {
            workerFailure = error instanceof WorkerParseError ? error : new WorkerParseError(String(error));
            summary = await parseKlarfInline();
          }
        } else {
          // SSR, tests and locked-down environments parse inline.
          summary = await parseKlarfInline();
        }

        const hasContent =
          Boolean(summary?.header.lotId || summary?.header.waferId) || (summary?.totalDefects ?? 0) > 0;
        if (summary && hasContent) {
          setKlarf(summary);
          setStdf(null);
          setLimits({});
          setFileName(name);
          setError(null);
        } else if (summary) {
          setError(`"${name}" does not contain recognizable KLARF records (LotID / WaferID / DefectList).`);
        } else {
          setError(
            workerFailure
              ? `Background KLARF parsing failed (${workerFailure.message}). Drop the file again to retry.`
              : `"${name}" could not be parsed as KLARF.`,
          );
        }
      } finally {
        setParsing(false);
      }
    },
    [parseKlarfViaWorker],
  );

  /**
   * Generates (chunk fetched on demand) and loads the synthetic demo KLARF.
   */
  const loadDemoKlarf = useCallback(async () => {
    try {
      const { generateSyntheticKlarf } = await import('@/lib/klarf-parser');
      await loadKlarf(generateSyntheticKlarf({ lotId: 'LOT-DEMO-7721', waferId: 'W08' }), 'synthetic-demo.klarf');
    } catch (error) {
      setError(`Failed to generate the demo KLARF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [loadKlarf]);

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        const lowerName = file.name.toLowerCase();
        const isKlarfByExtension = lowerName.endsWith('.klarf') || lowerName.endsWith('.001');
        const isStdfByExtension = lowerName.endsWith('.std') || lowerName.endsWith('.stdf');
        const asKlarf = isKlarfByExtension || (!isStdfByExtension && looksLikeKlarfBuffer(buffer));

        if (asKlarf) {
          await loadKlarf(new TextDecoder().decode(buffer), file.name);
        } else {
          await loadStdf(buffer, file.name);
        }
      } catch (loadError) {
        setError(`Failed to read "${file.name}": ${loadError instanceof Error ? loadError.message : String(loadError)}`);
      }
    },
    [loadKlarf, loadStdf],
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const files = event.clipboardData?.files;
    if (files && files.length > 0) {
      event.preventDefault();
      void handleFile(files[0]);
      return;
    }
    const text = event.clipboardData?.getData('text') ?? '';
    if (text && looksLikeKlarfText(text)) {
      event.preventDefault();
      void loadKlarf(text, 'pasted-klarf.txt');
    }
  };

  const reset = () => {
    setStdf(null);
    setKlarf(null);
    setFileName('');
    setError(null);
    setLimits({});
    setUrlState({ q: '' });
  };

  /** Reloads the last cached parse — offered as a button, never automatic. */
  const restoreCached = () => {
    if (!cachedEntry) return;
    applyStdfSummary(cachedEntry.summary, cachedEntry.fileName || 'restored-stdf.std');
  };

  const updateLimit = (key: string, side: 'lsl' | 'usl', value: string) => {
    setLimits((previous) => ({
      ...previous,
      [key]: { lsl: previous[key]?.lsl ?? '', usl: previous[key]?.usl ?? '', [side]: value },
    }));
  };

  const exportSummaryCsv = () => {
    downloadCsv(
      'stdf-test-summary.csv',
      ['Test', 'Units', 'Test Number', 'N', 'Mean', 'Median', 'StdDev', 'Min', 'Max', 'P95', 'LSL', 'USL', 'Out of Spec', 'Cpk'],
      testRows.map((row) => [
        row.name,
        row.units,
        row.testNumber,
        row.summary.n,
        round(row.summary.mean),
        round(row.summary.median),
        round(row.summary.stdDev),
        round(row.summary.min),
        round(row.summary.max),
        round(row.summary.p95),
        row.lsl ?? '',
        row.usl ?? '',
        row.summary.outOfSpec,
        row.summary.cpk !== undefined ? round(row.summary.cpk) : '',
      ]),
    );
  };

  return (
    <div className="layout-two-column">
      <section className="panel" aria-labelledby="explorer-inputs">
        <h2 id="explorer-inputs">Load test data</h2>

        <div
          className={`drop-zone${dragActive ? ' is-active' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Drop an STDF or KLARF file, click to browse, or paste KLARF text"
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          onClick={() => document.getElementById('explorer-file-input')?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              document.getElementById('explorer-file-input')?.click();
            }
          }}
          style={{
            border: `2px dashed ${dragActive ? 'var(--teal)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'rgba(60, 154, 164, 0.06)' : 'transparent',
          }}
        >
          <Upload size={22} aria-hidden="true" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--teal)' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Drop a file, click to browse, or paste KLARF text</p>
          <p className="note" style={{ margin: '4px 0 0' }}>
            STDF V4 binary (.std / .stdf) parsed as ArrayBuffer · KLARF 1.x (.klarf / .001) parsed as text
          </p>
          <input
            id="explorer-file-input"
            type="file"
            accept=".std,.stdf,.klarf,.001,.txt"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
          />
        </div>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            disabled={parsing || demoLoading}
            onClick={() => void loadDemoStdf()}
          >
            <Sparkles size={14} aria-hidden="true" /> {demoLoading ? 'Generating demo…' : 'Load synthetic demo (STDF)'}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={parsing}
            onClick={() => void loadDemoKlarf()}
          >
            <Sparkles size={14} aria-hidden="true" /> Load demo KLARF
          </button>
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>

        {error ? (
          <p role="alert" style={{ color: '#b0413a', fontWeight: 600, marginTop: '12px' }}>
            <AlertTriangle size={14} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            {error}
          </p>
        ) : null}

        {parsing ? (
          <p role="status" className="note" style={{ marginTop: '12px', fontWeight: 600 }}>
            Parsing in a background worker…
          </p>
        ) : null}

        {cachedEntry && !stdf && !klarf ? (
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="button secondary" type="button" onClick={restoreCached}>
              <History size={14} aria-hidden="true" /> Restore last file: {cachedEntry.fileName || 'STDF'} (
              {new Date(cachedEntry.timestamp).toLocaleString()})
            </button>
          </div>
        ) : null}

        <hr className="divider" />

        <h3>Loaded source</h3>
        {stdf ? (
          <p className="note" style={{ margin: 0 }}>
            <strong>{fileName || 'STDF V4 datalog'}</strong>
            <br />
            Lot {stdf.mir?.lotId || 'N/A'} · Wafer {stdf.wrr?.waferId || 'N/A'} · Device {stdf.mir?.partType || 'N/A'} ·
            Tester {stdf.mir?.testerType || 'ATE'}
            <br />
            {stdf.parametricTests.length} PTR records across {testRows.length} tests · endian:{' '}
            {stdf.isLittleEndian ? 'little' : 'big'}
          </p>
        ) : klarf ? (
          <p className="note" style={{ margin: 0 }}>
            <strong>{fileName || 'KLARF inspection file'}</strong>
            <br />
            Lot {klarf.header.lotId || 'N/A'} · Wafer {klarf.header.waferId || 'N/A'} · Station{' '}
            {klarf.header.inspectionStationId || 'N/A'} · Klarf v{klarf.header.fileVersion}
            <br />
            {klarf.totalDefects} defects · {klarf.clusterCount} clusters
          </p>
        ) : (
          <p className="note" style={{ margin: 0 }}>
            Nothing loaded yet. Everything runs locally in your browser — no file is uploaded. STDF and KLARF are
            parsed in a background worker (STDF PTR cap raised to 200,000 records) and the last parsed STDF file is
            cached locally in IndexedDB so it can be restored after a reload.
          </p>
        )}

        {stdf && testRows.length > 0 ? (
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="button secondary" type="button" onClick={exportSummaryCsv}>
              <Download size={14} aria-hidden="true" /> Export test summary CSV
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="explorer-results">
        <h2 id="explorer-results">Results</h2>

        {!stdf && !klarf ? (
          <p className="note">Load an STDF or KLARF file (or the synthetic demo) to explore bins, parametrics and defects.</p>
        ) : null}

        {stdf ? (
          <>
            <div className="metric-grid">
              <div className="metric">
                <span>Total tested</span>
                <strong>{stdf.totalParts}</strong>
              </div>
              <div className="metric">
                <span>Good parts</span>
                <strong>{stdf.goodParts}</strong>
              </div>
              <div className="metric">
                <span>Failed parts</span>
                <strong>{stdf.failedParts}</strong>
              </div>
              <div className="metric">
                <span>{g('yieldLabel')}</span>
                <strong style={{ color: stdf.yieldPercent >= 80 ? '#1b806a' : '#b0413a' }}>
                  {stdf.yieldPercent.toFixed(1)}%
                </strong>
              </div>
            </div>

            {bins.length > 0 ? (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>Bin distribution (soft bin, hard bin fallback)</h3>
                <div className="table-scroll">
                  <table className="model-table">
                    <thead>
                      <tr>
                        <th scope="col">Bin</th>
                        <th scope="col">Count</th>
                        <th scope="col">Percent</th>
                        <th scope="col">Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bins.map((entry) => (
                        <tr key={entry.bin}>
                          <td>{entry.bin}</td>
                          <td>{entry.count}</td>
                          <td>{entry.percent.toFixed(1)}%</td>
                          <td style={{ minWidth: '120px' }}>
                            <span
                              aria-hidden="true"
                              style={{
                                display: 'inline-block',
                                height: '8px',
                                width: `${Math.max(2, entry.percent)}%`,
                                minWidth: '6px',
                                borderRadius: '4px',
                                background: entry.bin === 1 || entry.bin === 100 ? '#3c9aa4' : '#d1625a',
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {testRows.length > 0 ? (
              <div style={{ marginTop: '20px' }}>
                <div className="field">
                  <label htmlFor="explorer-search">
                    Filter tests
                    <span className="unit">{filteredRows.length} / {testRows.length}</span>
                  </label>
                  <input
                    id="explorer-search"
                    type="search"
                    value={search}
                    placeholder="Test name, units or test number…"
                    onChange={(event) => setUrlState({ q: event.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                  {filteredRows.map((row) => (
                    <TestCard
                      key={row.key}
                      row={row}
                      saved={limits[row.key] ?? { lsl: '', usl: '' }}
                      onLimitChange={updateLimit}
                    />
                  ))}
                  {filteredRows.length === 0 ? <p className="note">No test matches the filter.</p> : null}
                </div>
              </div>
            ) : (
              <p className="note" style={{ marginTop: '16px' }}>
                This datalog contains no PTR parametric records — only bin / yield data is available.
              </p>
            )}

            {testRows.length >= 2 ? (
              <div style={{ marginTop: '24px' }}>
                {/* Keyed per load so the test selection resets with the file. */}
                <CorrelationPanel key={loadId} groups={groups} />
              </div>
            ) : null}
          </>
        ) : null}

        {klarf ? <KlarfView summary={klarf} /> : null}
      </section>
    </div>
  );
}

function TestCard({
  row,
  saved,
  onLimitChange,
}: {
  row: TestRow;
  saved: LimitInput;
  onLimitChange: (key: string, side: 'lsl' | 'usl', value: string) => void;
}) {
  const { summary } = row;
  const spcHref = buildSpcUrl(row.trend);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px',
        background: 'var(--panel-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <strong>
          {row.name}
          {row.units ? <span className="unit"> [{row.units}]</span> : null}
        </strong>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="note" style={{ margin: 0 }}>
            #{row.testNumber}
          </span>
          <CpkBadge cpk={summary.cpk} />
        </span>
      </div>

      <div style={{ marginTop: '10px' }}>
        <Sparkline values={row.trend} lsl={row.lsl} usl={row.usl} />
      </div>

      <div className="metric-grid" style={{ marginTop: '10px' }}>
        <div className="metric">
          <span>n</span>
          <strong>{summary.n}</strong>
        </div>
        <div className="metric">
          <span>Mean</span>
          <strong>{round(summary.mean)}</strong>
        </div>
        <div className="metric">
          <span>Median</span>
          <strong>{round(summary.median)}</strong>
        </div>
        <div className="metric">
          <span>σ (n−1)</span>
          <strong>{round(summary.stdDev)}</strong>
        </div>
        <div className="metric">
          <span>Min</span>
          <strong>{round(summary.min)}</strong>
        </div>
        <div className="metric">
          <span>Max</span>
          <strong>{round(summary.max)}</strong>
        </div>
        <div className="metric">
          <span>P95</span>
          <strong>{round(summary.p95)}</strong>
        </div>
        <div className="metric">
          <span>Out of spec</span>
          <strong style={{ color: summary.outOfSpec > 0 ? '#b0413a' : undefined }}>{summary.outOfSpec}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '12px' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`lsl-${row.key}`}>LSL</label>
          <input
            id={`lsl-${row.key}`}
            type="number"
            step="any"
            style={{ width: '120px' }}
            value={saved.lsl}
            placeholder="—"
            onChange={(event) => onLimitChange(row.key, 'lsl', event.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`usl-${row.key}`}>USL</label>
          <input
            id={`usl-${row.key}`}
            type="number"
            step="any"
            style={{ width: '120px' }}
            value={saved.usl}
            placeholder="—"
            onChange={(event) => onLimitChange(row.key, 'usl', event.target.value)}
          />
        </div>
        {spcHref ? (
          <a className="button secondary" href={spcHref}>
            <ExternalLink size={14} aria-hidden="true" /> Open in SPC
          </a>
        ) : (
          <button className="button secondary" type="button" disabled title="Need at least 10 results for two subgroups of 5">
            <ExternalLink size={14} aria-hidden="true" /> Open in SPC
          </button>
        )}
      </div>
    </div>
  );
}

function CpkBadge({ cpk }: { cpk: number | undefined }) {
  if (cpk === undefined) {
    return (
      <span className="note" style={{ margin: 0 }}>
        Cpk —
      </span>
    );
  }

  const level = cpk >= 1.33 ? 'good' : cpk >= 1 ? 'marginal' : 'poor';
  const color = level === 'good' ? '#1b806a' : level === 'marginal' ? '#915a13' : '#b0413a';
  const background = level === 'good' ? 'rgba(60, 154, 164, 0.15)' : level === 'marginal' ? 'rgba(223, 162, 67, 0.18)' : 'rgba(209, 98, 90, 0.15)';

  return (
    <span
      title="Cpk = min((USL − μ) / 3σ, (μ − LSL) / 3σ), sample σ"
      style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        color,
        background,
      }}
    >
      Cpk {cpk.toFixed(2)}
    </span>
  );
}

function Sparkline({ values, lsl, usl }: { values: number[]; lsl?: number; usl?: number }) {
  if (values.length === 0) {
    return <p className="note" style={{ margin: 0 }}>No finite results to plot.</p>;
  }

  // Display-cap long trends by step sampling.
  const maxPoints = 400;
  const step = Math.max(1, Math.ceil(values.length / maxPoints));
  const shown = step > 1 ? values.filter((_, index) => index % step === 0) : values;

  const width = 320;
  const height = 56;
  const pad = 3;

  let min = Math.min(...shown);
  let max = Math.max(...shown);
  if (lsl !== undefined) min = Math.min(min, lsl);
  if (usl !== undefined) max = Math.max(max, usl);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;

  const x = (index: number) => pad + (index / Math.max(1, shown.length - 1)) * (width - 2 * pad);
  const y = (value: number) => height - pad - ((value - min) / span) * (height - 2 * pad);
  const points = shown.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Trend of ${values.length} results${lsl !== undefined || usl !== undefined ? ' with spec limits' : ''}`}
    >
      {lsl !== undefined ? (
        <line x1={pad} x2={width - pad} y1={y(lsl)} y2={y(lsl)} stroke="var(--chart-limit)" strokeDasharray="4 3" strokeWidth="1" />
      ) : null}
      {usl !== undefined ? (
        <line x1={pad} x2={width - pad} y1={y(usl)} y2={y(usl)} stroke="var(--chart-limit)" strokeDasharray="4 3" strokeWidth="1" />
      ) : null}
      <polyline points={points} fill="none" stroke="var(--chart-accent)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Documented exception to the --chart-* tokens: these four hues are semantic
// defect categories of the KLARF spatial analysis (isolated / scratch /
// hotspot / cluster), not theme-dependent chart styling — they stay hardcoded
// so the category legend reads identically in light and dark mode.
const CLUSTER_COLORS: Record<KlarfSummary['clusters'][number]['category'], string> = {
  isolated: '#b4bec4',
  scratch: '#d1625a',
  hotspot: '#dfa243',
  cluster: '#3c9aa4',
};

function KlarfView({ summary }: { summary: KlarfSummary }) {
  const g = useGlossary();
  const classEntries = Object.entries(summary.classes)
    .map(([classNumber, count]) => ({ classNumber: Number(classNumber), count }))
    .sort((a, b) => a.classNumber - b.classNumber);
  const topClusters = [...summary.clusters].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <>
      <div
        style={{
          marginBottom: '12px',
          padding: '10px 14px',
          background: summary.hasScratches ? 'rgba(209, 98, 90, 0.08)' : 'rgba(223, 162, 67, 0.08)',
          border: `1px solid ${summary.hasScratches ? '#d1625a' : '#dfa243'}`,
          borderRadius: '8px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {summary.hasScratches ? <AlertTriangle size={14} color="#d1625a" /> : null}
            Lot {summary.header.lotId || 'N/A'} · Wafer {summary.header.waferId || 'N/A'}
          </strong>
          <span style={{ fontWeight: 700, color: summary.hasScratches ? '#b0413a' : '#915a13' }}>
            {summary.hasScratches ? 'MECHANICAL SCRATCH DETECTED' : 'INSPECTION COMPLETE'}
          </span>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span>Total defects</span>
          <strong>{summary.totalDefects}</strong>
        </div>
        <div className="metric">
          <span>Defective die</span>
          <strong>{summary.defectiveDieCount}</strong>
        </div>
        <div className="metric">
          <span>{g('densityLabel')}</span>
          <strong>{summary.defectDensityPerCm2}/cm²</strong>
        </div>
        <div className="metric">
          <span>Clusters</span>
          <strong>{summary.clusterCount}</strong>
        </div>
      </div>

      <p className="note" style={{ marginTop: '10px' }}>
        Device {summary.header.deviceId || 'N/A'} · Step/Station {summary.header.inspectionStationId || 'N/A'} · Slot{' '}
        {summary.header.slot ?? '—'} · Die pitch {summary.header.diePitchX ?? '—'}×{summary.header.diePitchY ?? '—'} µm
      </p>

      {classEntries.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '8px' }}>Defect count per class (bin)</h3>
          <div className="table-scroll">
            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Count</th>
                  <th scope="col">Percent</th>
                </tr>
              </thead>
              <tbody>
                {classEntries.map((entry) => (
                  <tr key={entry.classNumber}>
                    <td>{entry.classNumber}</td>
                    <td>{entry.count}</td>
                    <td>{((entry.count / Math.max(1, summary.totalDefects)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {topClusters.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '8px' }}>Top defect clusters</h3>
          <div className="table-scroll">
            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">Cluster</th>
                  <th scope="col">Category</th>
                  <th scope="col">Defects</th>
                  <th scope="col">Bounding box (mm)</th>
                </tr>
              </thead>
              <tbody>
                {topClusters.map((cluster) => (
                  <tr key={cluster.clusterId}>
                    <td>#{cluster.clusterId}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: '#152127',
                          background: CLUSTER_COLORS[cluster.category],
                        }}
                      >
                        {cluster.category}
                      </span>
                    </td>
                    <td>{cluster.count}</td>
                    <td>
                      ({cluster.bbox.minX.toFixed(1)}, {cluster.bbox.minY.toFixed(1)}) → ({cluster.bbox.maxX.toFixed(1)},{' '}
                      {cluster.bbox.maxY.toFixed(1)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="note" style={{ marginTop: '16px' }}>
          No multi-defect clusters detected — defect population is essentially isolated.
        </p>
      )}
    </>
  );
}
