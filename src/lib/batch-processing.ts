/**
 * Batch processing utilities for semiconductor metrology and kinetic data.
 *
 * Supports parsing tabular text (CSV, TSV, semicolon, whitespace-delimited),
 * batch processing for Film Uniformity, CD Uniformity, and Arrhenius Extrapolation,
 * plus summary generation and RFC 4180 compliant CSV export.
 */

import { BOLTZMANN_EV_PER_K, KELVIN_OFFSET } from './arrhenius';

// ============================================================================
// Generic Batch Types & CSV Utilities
// ============================================================================

export interface BatchResult<TRow, TSummary> {
  rows: TRow[];
  summary: TSummary;
  errors: string[];
}

/**
 * Parses CSV/TSV/delimited text into rows of string tokens.
 * Handles:
 * - Quoted fields (including escaped quotes `""`)
 * - Comma, tab, semicolon delimiters (auto-detected or standard)
 * - Trims whitespace around tokens
 * - Skips empty or whitespace-only lines
 * - Handles Windows (\r\n) and Unix (\n) line breaks
 */
export function parseDelimitedText(text: string): string[][] {
  if (!text || typeof text !== 'string') return [];

  const rawLines = text.split(/\r\n|\r|\n/);
  const result: string[][] = [];

  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    const row = parseLineTokens(trimmedLine);
    if (row.length > 0) {
      result.push(row);
    }
  }

  return result;
}

/**
 * Helper to parse a single line into tokens respecting quotes and common delimiters.
 */
function parseLineTokens(line: string): string[] {
  // If line contains tabs and no unquoted commas, delimiter is tab
  // Or auto-detect primary delimiter among tab, comma, semicolon
  let delimiter = ',';
  let inQuotes = false;
  let tabCount = 0;
  let commaCount = 0;
  let semiCount = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === '\t') tabCount++;
      else if (char === ',') commaCount++;
      else if (char === ';') semiCount++;
    }
  }

  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const tokens: string[] = [];
  let currentToken = '';
  inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentToken += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      tokens.push(currentToken.trim());
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  tokens.push(currentToken.trim());
  return tokens;
}

/**
 * Escapes a field for CSV according to RFC 4180:
 * - If it contains comma, double quote, newline, or tab, wrap in double quotes.
 * - Escape any double quotes with `""`.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\t\r\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds CSV string from an array of headers and rows.
 */
export function buildCsv(headers: string[], rows: (unknown[])[]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\n');
}

/**
 * Parses a string of readings separated by spaces, commas, tabs, or semicolons.
 */
export function parseReadingNumbers(input: string | string[]): number[] {
  let tokens: string[] = [];
  if (Array.isArray(input)) {
    for (const item of input) {
      tokens.push(...item.split(/[\s,;]+/).map((t) => t.trim()));
    }
  } else {
    tokens = input.split(/[\s,;]+/).map((t) => t.trim());
  }

  const numbers: number[] = [];
  for (const token of tokens) {
    if (token === '') continue;
    const n = Number(token);
    if (Number.isFinite(n)) {
      numbers.push(n);
    }
  }
  return numbers;
}

// ============================================================================
// Film Uniformity Batch Processing
// ============================================================================

export interface FilmUniformityBatchRow {
  id: string;
  sampleId: string;
  n: number;
  target: number | null;
  mean: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  sigma: number | null;
  threeSigma: number | null;
  rangePercent: number | null;
  halfRangePercent: number | null;
  targetDelta: number | null;
  error: string | null;
}

export interface FilmUniformityBatchSummary {
  totalSamples: number;
  validSamples: number;
  averageMean: number | null;
  averageSigma: number | null;
  bestUniformity: { sampleId: string; halfRangePercent: number } | null;
  worstUniformity: { sampleId: string; halfRangePercent: number } | null;
}

export function processFilmUniformityBatch(
  csvText: string,
): BatchResult<FilmUniformityBatchRow, FilmUniformityBatchSummary> {
  const parsedRows = parseDelimitedText(csvText);
  const errors: string[] = [];
  const rows: FilmUniformityBatchRow[] = [];

  if (parsedRows.length === 0) {
    return {
      rows: [],
      summary: {
        totalSamples: 0,
        validSamples: 0,
        averageMean: null,
        averageSigma: null,
        bestUniformity: null,
        worstUniformity: null,
      },
      errors: ['No data found in input text.'],
    };
  }

  // Check if first row is a header
  let startIndex = 0;
  const firstRow = parsedRows[0];
  const isHeader =
    firstRow.length > 0 &&
    firstRow.some((col) =>
      /^(sample|id|wafer|target|readings|p1|site)/i.test(col.trim()),
    );
  if (isHeader) {
    startIndex = 1;
  }

  for (let rowIndex = startIndex; rowIndex < parsedRows.length; rowIndex++) {
    const rawCols = parsedRows[rowIndex];
    if (rawCols.length === 0) continue;

    const sampleId = rawCols[0]?.trim() || `Row_${rowIndex + 1}`;
    const targetRaw = rawCols[1]?.trim();
    const target =
      targetRaw !== undefined && targetRaw !== '' && Number.isFinite(Number(targetRaw))
        ? Number(targetRaw)
        : null;

    // Readings can be in col 2 as a single string of numbers or across cols 2..end
    const readingsTokens: string[] = rawCols.slice(2);
    const readings = parseReadingNumbers(readingsTokens);

    const n = readings.length;

    if (n < 2) {
      rows.push({
        id: sampleId,
        sampleId,
        n,
        target,
        mean: n === 1 ? readings[0] : null,
        min: n === 1 ? readings[0] : null,
        max: n === 1 ? readings[0] : null,
        range: n === 1 ? 0 : null,
        sigma: null,
        threeSigma: null,
        rangePercent: null,
        halfRangePercent: null,
        targetDelta: n === 1 && target !== null ? readings[0] - target : null,
        error: n === 0 ? 'No numeric readings found.' : 'At least 2 points required for uniformity statistics.',
      });
      continue;
    }

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const sum = readings.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const range = max - min;

    const variance =
      readings.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1);
    const sigma = Math.sqrt(variance);
    const threeSigma = 3 * sigma;

    const rangePercent = mean !== 0 ? (range / mean) * 100 : null;
    const halfRangePercent = mean !== 0 ? (range / (2 * mean)) * 100 : null;
    const targetDelta = target !== null ? mean - target : null;

    rows.push({
      id: sampleId,
      sampleId,
      n,
      target,
      mean,
      min,
      max,
      range,
      sigma,
      threeSigma,
      rangePercent,
      halfRangePercent,
      targetDelta,
      error: null,
    });
  }

  // Calculate batch summary
  const validRows = rows.filter((r) => r.error === null && r.halfRangePercent !== null);
  const totalSamples = rows.length;
  const validSamples = validRows.length;

  let averageMean: number | null = null;
  let averageSigma: number | null = null;
  let bestUniformity: { sampleId: string; halfRangePercent: number } | null = null;
  let worstUniformity: { sampleId: string; halfRangePercent: number } | null = null;

  if (validSamples > 0) {
    const meanSum = validRows.reduce((acc, r) => acc + (r.mean ?? 0), 0);
    averageMean = meanSum / validSamples;

    const sigmaRows = validRows.filter((r) => r.sigma !== null);
    if (sigmaRows.length > 0) {
      const sigmaSum = sigmaRows.reduce((acc, r) => acc + (r.sigma ?? 0), 0);
      averageSigma = sigmaSum / sigmaRows.length;
    }

    let minUniformityRow = validRows[0];
    let maxUniformityRow = validRows[0];

    for (const r of validRows) {
      if ((r.halfRangePercent ?? Infinity) < (minUniformityRow.halfRangePercent ?? Infinity)) {
        minUniformityRow = r;
      }
      if ((r.halfRangePercent ?? -Infinity) > (maxUniformityRow.halfRangePercent ?? -Infinity)) {
        maxUniformityRow = r;
      }
    }

    bestUniformity = {
      sampleId: minUniformityRow.sampleId,
      halfRangePercent: minUniformityRow.halfRangePercent as number,
    };
    worstUniformity = {
      sampleId: maxUniformityRow.sampleId,
      halfRangePercent: maxUniformityRow.halfRangePercent as number,
    };
  }

  return {
    rows,
    summary: {
      totalSamples,
      validSamples,
      averageMean,
      averageSigma,
      bestUniformity,
      worstUniformity,
    },
    errors,
  };
}

export function exportFilmUniformityBatchCsv(rows: FilmUniformityBatchRow[]): string {
  const headers = [
    'Sample_ID',
    'N',
    'Target_nm',
    'Mean_nm',
    'Min_nm',
    'Max_nm',
    'Range_nm',
    'Sigma_nm',
    'ThreeSigma_nm',
    'Range_Percent',
    'HalfRange_NonUniformity_Percent',
    'TargetDelta_nm',
    'Status',
  ];

  const dataRows = rows.map((r) => [
    r.sampleId,
    r.n,
    r.target !== null ? r.target.toFixed(2) : '',
    r.mean !== null ? r.mean.toFixed(3) : '',
    r.min !== null ? r.min.toFixed(3) : '',
    r.max !== null ? r.max.toFixed(3) : '',
    r.range !== null ? r.range.toFixed(3) : '',
    r.sigma !== null ? r.sigma.toFixed(4) : '',
    r.threeSigma !== null ? r.threeSigma.toFixed(4) : '',
    r.rangePercent !== null ? r.rangePercent.toFixed(3) : '',
    r.halfRangePercent !== null ? r.halfRangePercent.toFixed(3) : '',
    r.targetDelta !== null ? r.targetDelta.toFixed(3) : '',
    r.error ?? 'OK',
  ]);

  return buildCsv(headers, dataRows);
}

export function getFilmUniformitySampleCsv(): string {
  return [
    'Sample_ID,Target_nm,P1,P2,P3,P4,P5,P6,P7,P8,P9',
    'Wafer_01,100,100.5,101.2,99.4,100.8,102.1,98.9,100.0,101.5,99.8',
    'Wafer_02,100,102.3,103.1,101.8,102.9,103.5,101.2,102.0,102.8,101.9',
    'Wafer_03,100,98.2,99.0,97.5,98.8,99.5,97.1,98.0,98.9,97.7',
    'Wafer_04,100,"100.1, 100.4, 99.9, 100.2, 100.0"',
  ].join('\n');
}

// ============================================================================
// CD Uniformity Batch Processing
// ============================================================================

export interface CdUniformityBatchRow {
  id: string;
  sampleId: string;
  n: number;
  target: number | null;
  mean: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  sigma: number | null;
  threeSigma: number | null;
  cvPercent: number | null;
  halfRangePercent: number | null;
  targetDelta: number | null;
  error: string | null;
}

export interface CdUniformityBatchSummary {
  totalSamples: number;
  validSamples: number;
  averageMean: number | null;
  averageThreeSigma: number | null;
  bestCdUniformity: { sampleId: string; threeSigma: number } | null;
  worstCdUniformity: { sampleId: string; threeSigma: number } | null;
}

export function processCdUniformityBatch(
  csvText: string,
): BatchResult<CdUniformityBatchRow, CdUniformityBatchSummary> {
  const parsedRows = parseDelimitedText(csvText);
  const errors: string[] = [];
  const rows: CdUniformityBatchRow[] = [];

  if (parsedRows.length === 0) {
    return {
      rows: [],
      summary: {
        totalSamples: 0,
        validSamples: 0,
        averageMean: null,
        averageThreeSigma: null,
        bestCdUniformity: null,
        worstCdUniformity: null,
      },
      errors: ['No data found in input text.'],
    };
  }

  let startIndex = 0;
  const firstRow = parsedRows[0];
  const isHeader =
    firstRow.length > 0 &&
    firstRow.some((col) =>
      /^(sample|id|wafer|target|readings|cd|p1|site)/i.test(col.trim()),
    );
  if (isHeader) {
    startIndex = 1;
  }

  for (let rowIndex = startIndex; rowIndex < parsedRows.length; rowIndex++) {
    const rawCols = parsedRows[rowIndex];
    if (rawCols.length === 0) continue;

    const sampleId = rawCols[0]?.trim() || `Row_${rowIndex + 1}`;
    const targetRaw = rawCols[1]?.trim();
    const target =
      targetRaw !== undefined && targetRaw !== '' && Number.isFinite(Number(targetRaw))
        ? Number(targetRaw)
        : null;

    const readingsTokens = rawCols.slice(2);
    const readings = parseReadingNumbers(readingsTokens);
    const n = readings.length;

    if (n < 2) {
      rows.push({
        id: sampleId,
        sampleId,
        n,
        target,
        mean: n === 1 ? readings[0] : null,
        min: n === 1 ? readings[0] : null,
        max: n === 1 ? readings[0] : null,
        range: n === 1 ? 0 : null,
        sigma: null,
        threeSigma: null,
        cvPercent: null,
        halfRangePercent: null,
        targetDelta: n === 1 && target !== null ? readings[0] - target : null,
        error: n === 0 ? 'No numeric readings found.' : 'At least 2 points required for CD uniformity calculations.',
      });
      continue;
    }

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const sum = readings.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const range = max - min;

    const variance =
      readings.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1);
    const sigma = Math.sqrt(variance);
    const threeSigma = 3 * sigma;

    const cvPercent = mean !== 0 ? (sigma / mean) * 100 : null;
    const halfRangePercent = mean !== 0 ? (range / (2 * mean)) * 100 : null;
    const targetDelta = target !== null ? mean - target : null;

    rows.push({
      id: sampleId,
      sampleId,
      n,
      target,
      mean,
      min,
      max,
      range,
      sigma,
      threeSigma,
      cvPercent,
      halfRangePercent,
      targetDelta,
      error: null,
    });
  }

  const validRows = rows.filter((r) => r.error === null && r.threeSigma !== null);
  const totalSamples = rows.length;
  const validSamples = validRows.length;

  let averageMean: number | null = null;
  let averageThreeSigma: number | null = null;
  let bestCdUniformity: { sampleId: string; threeSigma: number } | null = null;
  let worstCdUniformity: { sampleId: string; threeSigma: number } | null = null;

  if (validSamples > 0) {
    const meanSum = validRows.reduce((acc, r) => acc + (r.mean ?? 0), 0);
    averageMean = meanSum / validSamples;

    const threeSigmaSum = validRows.reduce((acc, r) => acc + (r.threeSigma ?? 0), 0);
    averageThreeSigma = threeSigmaSum / validSamples;

    let minRow = validRows[0];
    let maxRow = validRows[0];

    for (const r of validRows) {
      if ((r.threeSigma ?? Infinity) < (minRow.threeSigma ?? Infinity)) {
        minRow = r;
      }
      if ((r.threeSigma ?? -Infinity) > (maxRow.threeSigma ?? -Infinity)) {
        maxRow = r;
      }
    }

    bestCdUniformity = {
      sampleId: minRow.sampleId,
      threeSigma: minRow.threeSigma as number,
    };
    worstCdUniformity = {
      sampleId: maxRow.sampleId,
      threeSigma: maxRow.threeSigma as number,
    };
  }

  return {
    rows,
    summary: {
      totalSamples,
      validSamples,
      averageMean,
      averageThreeSigma,
      bestCdUniformity,
      worstCdUniformity,
    },
    errors,
  };
}

export function exportCdUniformityBatchCsv(rows: CdUniformityBatchRow[]): string {
  const headers = [
    'Sample_ID',
    'N',
    'Target_nm',
    'Mean_nm',
    'Min_nm',
    'Max_nm',
    'Range_nm',
    'Sigma_nm',
    'ThreeSigma_nm',
    'CV_Percent',
    'HalfRange_Percent',
    'TargetDelta_nm',
    'Status',
  ];

  const dataRows = rows.map((r) => [
    r.sampleId,
    r.n,
    r.target !== null ? r.target.toFixed(2) : '',
    r.mean !== null ? r.mean.toFixed(3) : '',
    r.min !== null ? r.min.toFixed(3) : '',
    r.max !== null ? r.max.toFixed(3) : '',
    r.range !== null ? r.range.toFixed(3) : '',
    r.sigma !== null ? r.sigma.toFixed(4) : '',
    r.threeSigma !== null ? r.threeSigma.toFixed(4) : '',
    r.cvPercent !== null ? r.cvPercent.toFixed(3) : '',
    r.halfRangePercent !== null ? r.halfRangePercent.toFixed(3) : '',
    r.targetDelta !== null ? r.targetDelta.toFixed(3) : '',
    r.error ?? 'OK',
  ]);

  return buildCsv(headers, dataRows);
}

export function getCdUniformitySampleCsv(): string {
  return [
    'Sample_ID,Target_nm,CD1,CD2,CD3,CD4,CD5,CD6,CD7,CD8,CD9',
    'Field_A,42.0,42.1,41.8,42.4,41.9,42.6,42.0,42.3,41.7,42.2',
    'Field_B,42.0,41.5,41.6,41.4,41.7,41.9,41.5,41.8,41.6,41.5',
    'Field_C,42.0,42.8,43.1,42.6,43.2,42.9,43.0,42.7,43.3,42.9',
    'Field_D,42.0,"42.0, 42.1, 41.9, 42.0, 42.2"',
  ].join('\n');
}

// ============================================================================
// Arrhenius Extrapolation Batch Processing
// ============================================================================

export interface ArrheniusBatchRow {
  id: string;
  sampleId: string;
  t1C: number;
  rate1: number;
  t2C: number;
  rate2: number;
  extrapolateTC: number | null;
  activationEnergyEv: number | null;
  prefactorA: number | null;
  extrapolatedRate: number | null;
  error: string | null;
}

export interface ArrheniusBatchSummary {
  totalSamples: number;
  validSamples: number;
  averageEa: number | null;
  minEa: { sampleId: string; eaEv: number } | null;
  maxEa: { sampleId: string; eaEv: number } | null;
}

export function processArrheniusBatch(
  csvText: string,
): BatchResult<ArrheniusBatchRow, ArrheniusBatchSummary> {
  const parsedRows = parseDelimitedText(csvText);
  const errors: string[] = [];
  const rows: ArrheniusBatchRow[] = [];

  if (parsedRows.length === 0) {
    return {
      rows: [],
      summary: {
        totalSamples: 0,
        validSamples: 0,
        averageEa: null,
        minEa: null,
        maxEa: null,
      },
      errors: ['No data found in input text.'],
    };
  }

  let startIndex = 0;
  const firstRow = parsedRows[0];
  const isHeader =
    firstRow.length > 0 &&
    firstRow.some((col) =>
      /^(sample|id|t1|rate1|temp|activation)/i.test(col.trim()),
    );
  if (isHeader) {
    startIndex = 1;
  }

  for (let rowIndex = startIndex; rowIndex < parsedRows.length; rowIndex++) {
    const rawCols = parsedRows[rowIndex];
    if (rawCols.length === 0) continue;

    const sampleId = rawCols[0]?.trim() || `Row_${rowIndex + 1}`;
    const t1Raw = Number(rawCols[1]);
    const r1Raw = Number(rawCols[2]);
    const t2Raw = Number(rawCols[3]);
    const r2Raw = Number(rawCols[4]);
    const extRaw = rawCols[5] !== undefined && rawCols[5].trim() !== '' ? Number(rawCols[5]) : null;

    // Validation
    const validationErrors: string[] = [];
    if (!Number.isFinite(t1Raw) || t1Raw <= -KELVIN_OFFSET) {
      validationErrors.push('T1 must be > -273.15 °C.');
    }
    if (!Number.isFinite(r1Raw) || r1Raw <= 0) {
      validationErrors.push('Rate1 must be > 0.');
    }
    if (!Number.isFinite(t2Raw) || t2Raw <= -KELVIN_OFFSET) {
      validationErrors.push('T2 must be > -273.15 °C.');
    }
    if (!Number.isFinite(r2Raw) || r2Raw <= 0) {
      validationErrors.push('Rate2 must be > 0.');
    }
    if (Number.isFinite(t1Raw) && Number.isFinite(t2Raw) && t1Raw === t2Raw) {
      validationErrors.push('T1 and T2 must be distinct temperatures.');
    }
    if (extRaw !== null && (!Number.isFinite(extRaw) || extRaw <= -KELVIN_OFFSET)) {
      validationErrors.push('Extrapolate_T_C must be > -273.15 °C.');
    }

    if (validationErrors.length > 0) {
      rows.push({
        id: sampleId,
        sampleId,
        t1C: t1Raw,
        rate1: r1Raw,
        t2C: t2Raw,
        rate2: r2Raw,
        extrapolateTC: extRaw,
        activationEnergyEv: null,
        prefactorA: null,
        extrapolatedRate: null,
        error: validationErrors.join(' '),
      });
      continue;
    }

    const t1K = t1Raw + KELVIN_OFFSET;
    const t2K = t2Raw + KELVIN_OFFSET;

    // Arrhenius calculation:
    // Ea = -k * ln(k2 / k1) / (1/T2 - 1/T1)
    // k = BOLTZMANN_EV_PER_K (8.617333262145e-5 eV/K)
    const k = BOLTZMANN_EV_PER_K;
    const activationEnergyEv = -k * Math.log(r2Raw / r1Raw) / (1 / t2K - 1 / t1K);

    // Prefactor A = Rate1 / exp(-Ea / (k * T1_K))
    const prefactorA = r1Raw / Math.exp(-activationEnergyEv / (k * t1K));

    // Extrapolated rate if Extrapolate_T_C provided
    let extrapolatedRate: number | null = null;
    if (extRaw !== null) {
      const extK = extRaw + KELVIN_OFFSET;
      extrapolatedRate = prefactorA * Math.exp(-activationEnergyEv / (k * extK));
    }

    rows.push({
      id: sampleId,
      sampleId,
      t1C: t1Raw,
      rate1: r1Raw,
      t2C: t2Raw,
      rate2: r2Raw,
      extrapolateTC: extRaw,
      activationEnergyEv,
      prefactorA,
      extrapolatedRate,
      error: null,
    });
  }

  const validRows = rows.filter((r) => r.error === null && r.activationEnergyEv !== null);
  const totalSamples = rows.length;
  const validSamples = validRows.length;

  let averageEa: number | null = null;
  let minEa: { sampleId: string; eaEv: number } | null = null;
  let maxEa: { sampleId: string; eaEv: number } | null = null;

  if (validSamples > 0) {
    const eaSum = validRows.reduce((acc, r) => acc + (r.activationEnergyEv ?? 0), 0);
    averageEa = eaSum / validSamples;

    let minRow = validRows[0];
    let maxRow = validRows[0];

    for (const r of validRows) {
      if ((r.activationEnergyEv ?? Infinity) < (minRow.activationEnergyEv ?? Infinity)) {
        minRow = r;
      }
      if ((r.activationEnergyEv ?? -Infinity) > (maxRow.activationEnergyEv ?? -Infinity)) {
        maxRow = r;
      }
    }

    minEa = {
      sampleId: minRow.sampleId,
      eaEv: minRow.activationEnergyEv as number,
    };
    maxEa = {
      sampleId: maxRow.sampleId,
      eaEv: maxRow.activationEnergyEv as number,
    };
  }

  return {
    rows,
    summary: {
      totalSamples,
      validSamples,
      averageEa,
      minEa,
      maxEa,
    },
    errors,
  };
}

export function exportArrheniusBatchCsv(rows: ArrheniusBatchRow[]): string {
  const headers = [
    'Sample_ID',
    'T1_C',
    'Rate1',
    'T2_C',
    'Rate2',
    'Extrapolate_T_C',
    'Ea_eV',
    'Prefactor_A',
    'Extrapolated_Rate',
    'Status',
  ];

  const dataRows = rows.map((r) => [
    r.sampleId,
    Number.isFinite(r.t1C) ? r.t1C : '',
    Number.isFinite(r.rate1) ? r.rate1.toExponential(4) : '',
    Number.isFinite(r.t2C) ? r.t2C : '',
    Number.isFinite(r.rate2) ? r.rate2.toExponential(4) : '',
    r.extrapolateTC !== null && Number.isFinite(r.extrapolateTC) ? r.extrapolateTC : '',
    r.activationEnergyEv !== null ? r.activationEnergyEv.toFixed(4) : '',
    r.prefactorA !== null ? r.prefactorA.toExponential(4) : '',
    r.extrapolatedRate !== null ? r.extrapolatedRate.toExponential(4) : '',
    r.error ?? 'OK',
  ]);

  return buildCsv(headers, dataRows);
}

export function getArrheniusSampleCsv(): string {
  return [
    'Sample_ID,T1_C,Rate1,T2_C,Rate2,Extrapolate_T_C',
    'Boron_Diff,1000,1.53e-14,1100,1.52e-13,1050',
    'Phosphorus_Diff,950,2.10e-15,1050,3.40e-14,1000',
    'Oxidation_Dry,900,5.0e-3,1000,2.5e-2,1100',
  ].join('\n');
}
