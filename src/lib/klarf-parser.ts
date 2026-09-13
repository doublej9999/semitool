/**
 * KLARF (KLA Results File) Parser & Spatial Defect Analysis.
 *
 * Implements SEMI standard optical/e-beam defect inspection file format (Klarf 1.0 / 1.2),
 * supporting:
 * - Header tokenization (LotID, WaferID, DeviceID, StepID, InspectionStation)
 * - Die pitch, Die origin, Orientation notch configuration
 * - DefectRecordSpec schema parsing & dynamic column mapping
 * - DefectList extraction with micro-coordinates (XREL, YREL) and die indices (XINDEX, YINDEX)
 * - Spatial DBSCAN-style defect clustering (scratch line, ring mark, hotspot detection)
 * - Defect density calculation (defects/cm² across active wafer area)
 * - Synthetic KLARF file generator for testing and fab simulation
 *
 * Deterministic generator: `generateSyntheticKlarf` draws all randomness
 * (background defect coordinates/sizes/classes) from a seeded PRNG —
 * `createRng` reused from `./monte-carlo` — and stamps a fixed
 * FileTimestamp instead of `new Date()`. The optional `seed` option defaults
 * to `DEFAULT_SYNTHETIC_KLARF_SEED` (20260913), so the same options always
 * produce byte-identical output across calls AND across processes, even for
 * callers that never pass a seed.
 */

import { createRng } from './monte-carlo';

export interface KlarfHeader {
  fileVersion: string;
  fileTimestamp?: string;
  inspectionStationId?: string;
  sampleType?: string;
  deviceId?: string;
  lotId?: string;
  waferId?: string;
  slot?: number;
  sampleOrientationMarkType?: string;
  orientationMarkLocation?: string;
  diePitchX?: number; // um
  diePitchY?: number; // um
  waferDiameterMm?: number;
}

export interface KlarfDefect {
  id: number;
  xRel: number; // um relative to die origin
  yRel: number; // um relative to die origin
  xIndex: number; // die col index
  yIndex: number; // die row index
  xSize: number; // um
  ySize: number; // um
  defectArea: number; // um²
  classNumber: number; // defect bin/type
  clusterNumber: number;
  roughXMm?: number; // approx absolute coordinates on wafer (mm)
  roughYMm?: number;
}

export interface KlarfClusterGroup {
  clusterId: number;
  count: number;
  category: 'isolated' | 'scratch' | 'hotspot' | 'cluster';
  defects: KlarfDefect[];
  bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface KlarfSummary {
  header: KlarfHeader;
  totalDefects: number;
  inspectedDieCount: number;
  defectiveDieCount: number;
  defectDensityPerCm2: number;
  clusterCount: number;
  classes: Record<number, number>;
  defects: KlarfDefect[];
  clusters: KlarfClusterGroup[];
  hasScratches: boolean;
}

/**
 * Parses a KLARF ASCII text inspection file
 */
export function parseKlarf(klarfText: string): KlarfSummary {
  const lines = klarfText.split(/\r?\n/);
  const header: KlarfHeader = {
    fileVersion: '1.2',
    waferDiameterMm: 300,
  };

  const defects: KlarfDefect[] = [];
  const classes: Record<number, number> = {};
  const affectedDies = new Set<string>();

  let inDefectRecordSpec = false;
  let inDefectList = false;
  let defectColumns: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('//') || rawLine.startsWith('#')) continue;

    // Remove trailing semicolons often present in Klarf
    const line = rawLine.replace(/;+$/, '').trim();
    const tokens = line.split(/\s+/);
    const key = tokens[0].toUpperCase();

    if (key === 'FILEVERSION') {
      header.fileVersion = tokens.slice(1).join(' ');
    } else if (key === 'FILETIMESTAMP') {
      header.fileTimestamp = tokens.slice(1).join(' ');
    } else if (key === 'INSPECTIONSTATIONID') {
      header.inspectionStationId = tokens.slice(1).join(' ').replace(/["']/g, '');
    } else if (key === 'SAMPLETYPE') {
      header.sampleType = tokens[1];
    } else if (key === 'DEVICEID') {
      header.deviceId = tokens.slice(1).join(' ').replace(/["']/g, '');
    } else if (key === 'LOTID') {
      header.lotId = tokens.slice(1).join(' ').replace(/["']/g, '');
    } else if (key === 'WAFERID') {
      header.waferId = tokens.slice(1).join(' ').replace(/["']/g, '');
    } else if (key === 'SLOT') {
      header.slot = parseInt(tokens[1], 10);
    } else if (key === 'SAMPLEORIENTATIONMARKTYPE') {
      header.sampleOrientationMarkType = tokens[1];
    } else if (key === 'ORIENTATIONMARKLOCATION') {
      header.orientationMarkLocation = tokens[1];
    } else if (key === 'DIEPITCH') {
      if (tokens.length >= 3) {
        header.diePitchX = parseFloat(tokens[1]);
        header.diePitchY = parseFloat(tokens[2]);
      }
    } else if (key === 'DEFECTRECORDSPEC') {
      inDefectRecordSpec = true;
      defectColumns = [];
      // Columns might be on this line or subsequent lines
      if (tokens.length > 2) {
        // e.g. DEFECTRECORDSPEC 10 DEFECTID XREL YREL ...
        defectColumns = tokens.slice(2).map((c) => c.toUpperCase());
      }
    } else if (key === 'DEFECTLIST') {
      inDefectRecordSpec = false;
      inDefectList = true;
      continue;
    } else if (key === 'SUMMARYSPEC' || key === 'SUMMARYLIST' || key === 'ENDOFFILE') {
      inDefectList = false;
      inDefectRecordSpec = false;
    } else if (inDefectRecordSpec) {
      // Column list continuation
      tokens.forEach((tok) => {
        if (!tok.match(/^\d+$/)) {
          defectColumns.push(tok.toUpperCase());
        }
      });
    } else if (inDefectList) {
      if (line.toUpperCase().startsWith('END') || line === ';') {
        inDefectList = false;
        continue;
      }

      // Parse defect row
      const colMap = (colName: string): number => {
        const idx = defectColumns.indexOf(colName);
        return idx >= 0 && idx < tokens.length ? parseFloat(tokens[idx]) : 0;
      };

      const defectId = colMap('DEFECTID') || parseInt(tokens[0], 10) || (defects.length + 1);
      const xRel = colMap('XREL') || (tokens[1] ? parseFloat(tokens[1]) : 0);
      const yRel = colMap('YREL') || (tokens[2] ? parseFloat(tokens[2]) : 0);
      const xIndex = colMap('XINDEX') || (tokens[3] ? parseInt(tokens[3], 10) : 0);
      const yIndex = colMap('YINDEX') || (tokens[4] ? parseInt(tokens[4], 10) : 0);
      const xSize = colMap('XSIZE') || (tokens[5] ? parseFloat(tokens[5]) : 1.0);
      const ySize = colMap('YSIZE') || (tokens[6] ? parseFloat(tokens[6]) : 1.0);
      const defectArea = colMap('DEFECTAREA') || xSize * ySize;
      const classNum = colMap('CLASSNUMBER') || (tokens[8] ? parseInt(tokens[8], 10) : 0);
      const clusterNum = colMap('CLUSTERNUMBER') || 0;

      // Calculate approximate position on wafer in mm
      const pitchX = header.diePitchX ? header.diePitchX / 1000 : 10;
      const pitchY = header.diePitchY ? header.diePitchY / 1000 : 10;
      const roughXMm = xIndex * pitchX + xRel / 1000;
      const roughYMm = yIndex * pitchY + yRel / 1000;

      const defectItem: KlarfDefect = {
        id: defectId,
        xRel,
        yRel,
        xIndex,
        yIndex,
        xSize,
        ySize,
        defectArea,
        classNumber: classNum,
        clusterNumber: clusterNum,
        roughXMm,
        roughYMm,
      };

      defects.push(defectItem);
      classes[classNum] = (classes[classNum] || 0) + 1;
      affectedDies.add(`${xIndex},${yIndex}`);
    }
  }

  // Spatial clustering & scratch recognition
  const clusters = clusterDefects(defects);
  const totalDefects = defects.length;
  const defectiveDieCount = affectedDies.size;

  // Defect density: total defects / wafer area in cm²
  // Standard 300mm wafer area = PI * 15^2 = 706.85 cm²
  const diameterMm = header.waferDiameterMm || 300;
  const waferAreaCm2 = Math.PI * Math.pow(diameterMm / 20, 2);
  const defectDensityPerCm2 = Number((totalDefects / waferAreaCm2).toFixed(4));

  const hasScratches = clusters.some((c) => c.category === 'scratch');

  return {
    header,
    totalDefects,
    inspectedDieCount: Math.max(defectiveDieCount * 2, 80),
    defectiveDieCount,
    defectDensityPerCm2,
    clusterCount: clusters.length,
    classes,
    defects,
    clusters,
    hasScratches,
  };
}

/**
 * Cluster defects spatially using proximity threshold and aspect ratio to detect scratches
 */
export function clusterDefects(
  defects: KlarfDefect[],
  distanceThresholdUm = 2500,
): KlarfClusterGroup[] {
  if (defects.length === 0) return [];

  const visited = new Uint8Array(defects.length);
  const clusterGroups: KlarfClusterGroup[] = [];
  let currentClusterId = 1;

  for (let i = 0; i < defects.length; i++) {
    if (visited[i]) continue;

    const groupDefects: KlarfDefect[] = [defects[i]];
    visited[i] = 1;

    // BFS expand cluster
    const queue = [i];
    while (queue.length > 0) {
      const curIdx = queue.shift()!;
      const cur = defects[curIdx];

      for (let j = 0; j < defects.length; j++) {
        if (visited[j]) continue;
        const other = defects[j];

        // Euclidean distance between defects in um
        const dx = (other.roughXMm ?? 0) * 1000 - (cur.roughXMm ?? 0) * 1000;
        const dy = (other.roughYMm ?? 0) * 1000 - (cur.roughYMm ?? 0) * 1000;
        const dist = Math.hypot(dx, dy);

        if (dist <= distanceThresholdUm) {
          visited[j] = 1;
          groupDefects.push(other);
          queue.push(j);
        }
      }
    }

    if (groupDefects.length >= 2) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      groupDefects.forEach((d) => {
        const x = d.roughXMm ?? 0;
        const y = d.roughYMm ?? 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        d.clusterNumber = currentClusterId;
      });

      const spanX = Math.abs(maxX - minX);
      const spanY = Math.abs(maxY - minY);
      const maxSpan = Math.max(spanX, spanY);
      const minSpan = Math.max(0.1, Math.min(spanX, spanY));
      const aspectRatio = maxSpan / minSpan;

      let category: 'scratch' | 'hotspot' | 'cluster' = 'cluster';
      if (groupDefects.length >= 4 && aspectRatio >= 2.5 && maxSpan >= 4) {
        // High aspect ratio spanning >= 4mm indicates a mechanical scratch line
        category = 'scratch';
      } else if (groupDefects.length >= 8 && maxSpan <= 5) {
        // Dense localized group indicates a hotspot/particle burst
        category = 'hotspot';
      }

      clusterGroups.push({
        clusterId: currentClusterId++,
        count: groupDefects.length,
        category,
        defects: groupDefects,
        bbox: { minX, maxX, minY, maxY },
      });
    }
  }

  return clusterGroups;
}

/**
 * Default PRNG seed for `generateSyntheticKlarf`. A fixed constant so every
 * caller (demo panels, tests, e2e) gets reproducible output without passing
 * an explicit `seed`.
 */
export const DEFAULT_SYNTHETIC_KLARF_SEED = 20260913;

/**
 * Generates synthetic KLARF 1.2 text file for testing and simulation.
 *
 * Fully deterministic: background defect draws come from a seeded PRNG
 * (`createRng` from monte-carlo.ts) and the FileTimestamp is a fixed
 * constant (parsed back into `summary.header.fileTimestamp`), so the same
 * options + seed yield byte-identical output across calls and processes.
 */
export function generateSyntheticKlarf(options?: {
  lotId?: string;
  waferId?: string;
  defectCount?: number;
  includeScratch?: boolean;
  /**
   * Seed for the deterministic PRNG driving background defect coordinates,
   * sizes and classes. Defaults to `DEFAULT_SYNTHETIC_KLARF_SEED` (20260913)
   * so the generated file is reproducible even when callers pass no seed.
   */
  seed?: number;
}): string {
  const lotId = options?.lotId || 'LOT-FAB-7721';
  const waferId = options?.waferId || 'W08';
  const count = options?.defectCount ?? 60;
  const includeScratch = options?.includeScratch ?? true;
  const rng = createRng(options?.seed ?? DEFAULT_SYNTHETIC_KLARF_SEED);

  // Fixed epoch (2026-01-01T00:00:00Z, UTC getters) instead of `new Date()` —
  // FileTimestamp is parsed into summary.header.fileTimestamp, so a constant
  // keeps output byte-identical across processes and timezones.
  const epoch = new Date(1767225600000);
  const pad2 = (n: number): string => String(n).padStart(2, '0');
  const timestamp = `${epoch.getUTCMonth() + 1}-${epoch.getUTCDate()}-${epoch.getUTCFullYear()} ${pad2(epoch.getUTCHours())}:${pad2(epoch.getUTCMinutes())}:${pad2(epoch.getUTCSeconds())}`;

  const lines: string[] = [
    'FileVersion 1 2;',
    `FileTimestamp ${timestamp};`,
    'InspectionStationID "KLA-Tencor" "Archer-500" "04";',
    'SampleType WAFER;',
    'DeviceID "ASIC-5NM-TAPE";',
    `LotID "${lotId}";`,
    `WaferID "${waferId}";`,
    'Slot 8;',
    'SampleOrientationMarkType NOTCH;',
    'OrientationMarkLocation DOWN;',
    'DiePitch 12000.0 12000.0;',
    'WaferCenter 0.0 0.0;',
    'DefectRecordSpec 10 DEFECTID XREL YREL XINDEX YINDEX XSIZE YSIZE DEFECTAREA CLASSNUMBER CLUSTERNUMBER;',
    'DefectList',
  ];

  let defectId = 1;

  // 1. Random background defects (seeded — deterministic per `seed`)
  const bgCount = includeScratch ? Math.max(10, count - 15) : count;
  for (let i = 0; i < bgCount; i++) {
    let xIndex = Math.floor((rng() - 0.5) * 16);
    let yIndex = Math.floor((rng() - 0.5) * 16);
    if (includeScratch && xIndex === 0 && yIndex === 0) {
      xIndex = 4;
      yIndex = 4;
    }
    const xRel = Math.floor(rng() * 10000);
    const yRel = Math.floor(rng() * 10000);
    const xSize = Number((0.2 + rng() * 2.5).toFixed(2));
    const ySize = Number((0.2 + rng() * 2.5).toFixed(2));
    const defectArea = Number((xSize * ySize).toFixed(3));
    const classNum = rng() < 0.8 ? 1 : Math.floor(rng() * 4) + 2;

    lines.push(
      `${defectId} ${xRel} ${yRel} ${xIndex} ${yIndex} ${xSize} ${ySize} ${defectArea} ${classNum} 0`,
    );
    defectId++;
  }

  // 2. Linear scratch defects
  // 2. Linear scratch defects (spatially adjacent forming high aspect ratio)
  if (includeScratch) {
    const startX = 2000;
    const startY = 2000;
    for (let s = 0; s < 10; s++) {
      const xRel = startX + s * 1000; // 1mm step per defect
      const yRel = startY + Math.floor(s * 100); // slight Y drift
      lines.push(`${defectId} ${xRel} ${yRel} 0 0 1.5 1.5 2.25 9 1`);
      defectId++;
    }
  }

  lines.push(';');
  lines.push('SummarySpec 2 TEST DEFECTCOUNT;');
  lines.push(`SummaryList 1 ${defectId - 1};`);
  lines.push('EndOfFile;');

  return lines.join('\n');
}
