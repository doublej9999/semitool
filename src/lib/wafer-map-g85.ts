/**
 * SEMI G85 / ASCII Wafer Map Parser, Exporter & Defect Spatial Clustering Analysis.
 *
 * Implements standard wafer map grid serialization based on SEMI G85-1101 specifications
 * and spatial defect pattern recognition (clustering, isolated defects, edge signatures).
 */

import type { Die, DieStatus } from './wafer';

export interface SemiG85MapData {
  waferId: string;
  rowCount: number;
  colCount: number;
  flatNotch: string;
  stepX?: number;
  stepY?: number;
  dies: {
    row: number;
    col: number;
    status: DieStatus;
    binCode: string;
  }[];
}

export interface DefectCluster {
  id: number;
  size: number;
  dies: { row: number; col: number }[];
}

export interface DefectClusterAnalysis {
  totalDies: number;
  goodCount: number;
  defectCount: number;
  skipCount: number;
  edgeCount: number;
  defectRatePercent: number;
  clusterCount: number;
  largestClusterSize: number;
  isolatedDefectCount: number;
  clusterFractionPercent: number;
  patternType: 'clean' | 'random' | 'clustered' | 'edge-ring';
  diagnosis: string;
  clusters: DefectCluster[];
}

const BIN_CHAR_MAP: Record<DieStatus, string> = {
  Good: '0',
  Defect: '1',
  Skip: 'S',
  Edge: 'E',
};

const CHAR_BIN_MAP: Record<string, DieStatus> = {
  '0': 'Good',
  '.': 'Good',
  'G': 'Good',
  '1': 'Defect',
  'X': 'Defect',
  'D': 'Defect',
  'S': 'Skip',
  'E': 'Edge',
  '#': 'Edge',
};

/**
 * Serializes wafer dies into SEMI G85 ASCII format
 */
export function exportSemiG85(
  dies: Die[],
  waferId = 'WAFER_01',
  extraMeta: { flatNotch?: string; stepX?: number; stepY?: number } = {},
): string {
  if (dies.length === 0) {
    return `WAFER_ID:${waferId}\nROW_COUNT:0\nCOL_COUNT:0\nMAP_DATA:\n`;
  }

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  const dieLookup = new Map<string, DieStatus>();

  for (const die of dies) {
    if (die.row < minRow) minRow = die.row;
    if (die.row > maxRow) maxRow = die.row;
    if (die.column < minCol) minCol = die.column;
    if (die.column > maxCol) maxCol = die.column;
    dieLookup.set(`${die.row},${die.column}`, die.status);
  }

  const rowCount = maxRow - minRow + 1;
  const colCount = maxCol - minCol + 1;

  const lines: string[] = [
    `FORMAT:SEMI_G85_ASCII`,
    `WAFER_ID:${waferId}`,
    `FLAT_NOTCH_DIR:${extraMeta.flatNotch ?? 'SOUTH'}`,
    `ROW_COUNT:${rowCount}`,
    `COL_COUNT:${colCount}`,
  ];

  if (extraMeta.stepX) lines.push(`STEP_X:${extraMeta.stepX}`);
  if (extraMeta.stepY) lines.push(`STEP_Y:${extraMeta.stepY}`);
  lines.push('BIN_LEGEND:0=Good,1=Defect,S=Skip,E=Edge,.=Empty');
  lines.push('MAP_DATA:');

  for (let r = minRow; r <= maxRow; r += 1) {
    let rowStr = '';
    for (let c = minCol; c <= maxCol; c += 1) {
      const status = dieLookup.get(`${r},${c}`);
      if (!status) {
        rowStr += '.';
      } else {
        rowStr += BIN_CHAR_MAP[status] ?? '.';
      }
    }
    lines.push(rowStr);
  }

  return lines.join('\n');
}

/**
 * Parses SEMI G85 ASCII text back into structured wafer map data
 */
export function parseSemiG85(content: string): SemiG85MapData {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let waferId = 'WAFER_01';
  let flatNotch = 'SOUTH';
  let stepX: number | undefined;
  let stepY: number | undefined;
  let mapDataStarted = false;

  const mapRows: string[] = [];

  for (const line of lines) {
    if (mapDataStarted) {
      mapRows.push(line);
      continue;
    }

    if (line.startsWith('WAFER_ID:')) {
      waferId = line.substring(9).trim();
    } else if (line.startsWith('FLAT_NOTCH_DIR:')) {
      flatNotch = line.substring(15).trim();
    } else if (line.startsWith('STEP_X:')) {
      stepX = Number(line.substring(7).trim());
    } else if (line.startsWith('STEP_Y:')) {
      stepY = Number(line.substring(7).trim());
    } else if (line.startsWith('MAP_DATA:') || line === 'MAP_DATA') {
      mapDataStarted = true;
    }
  }

  const dies: SemiG85MapData['dies'] = [];
  const rowCount = mapRows.length;
  let colCount = 0;

  for (let r = 0; r < rowCount; r += 1) {
    const rowStr = mapRows[r];
    if (rowStr.length > colCount) colCount = rowStr.length;

    for (let c = 0; c < rowStr.length; c += 1) {
      const char = rowStr[c];
      if (char === '.' || char === ' ') continue;

      const status = CHAR_BIN_MAP[char] ?? 'Good';
      dies.push({
        row: r,
        col: c,
        status,
        binCode: char,
      });
    }
  }

  return {
    waferId,
    rowCount,
    colCount,
    flatNotch,
    stepX,
    stepY,
    dies,
  };
}

/**
 * Performs defect spatial clustering analysis on wafer dies
 */
export function analyzeDefectClusters(dies: Die[]): DefectClusterAnalysis {
  const totalDies = dies.length;
  if (totalDies === 0) {
    return {
      totalDies: 0,
      goodCount: 0,
      defectCount: 0,
      skipCount: 0,
      edgeCount: 0,
      defectRatePercent: 0,
      clusterCount: 0,
      largestClusterSize: 0,
      isolatedDefectCount: 0,
      clusterFractionPercent: 0,
      patternType: 'clean',
      diagnosis: 'No dies placed on wafer.',
      clusters: [],
    };
  }

  let goodCount = 0;
  let defectCount = 0;
  let skipCount = 0;
  let edgeCount = 0;

  const defectDiePositions = new Set<string>();
  const dieByCoord = new Map<string, Die>();

  for (const die of dies) {
    dieByCoord.set(`${die.row},${die.column}`, die);
    if (die.status === 'Good') goodCount += 1;
    else if (die.status === 'Defect') {
      defectCount += 1;
      defectDiePositions.add(`${die.row},${die.column}`);
    } else if (die.status === 'Skip') skipCount += 1;
    else if (die.status === 'Edge') edgeCount += 1;
  }

  const defectRatePercent = totalDies > 0 ? (defectCount / totalDies) * 100 : 0;

  if (defectCount === 0) {
    return {
      totalDies,
      goodCount,
      defectCount: 0,
      skipCount,
      edgeCount,
      defectRatePercent: 0,
      clusterCount: 0,
      largestClusterSize: 0,
      isolatedDefectCount: 0,
      clusterFractionPercent: 0,
      patternType: 'clean',
      diagnosis: 'Clean wafer: No defects detected across the active exposure field.',
      clusters: [],
    };
  }

  // Find clusters using 8-connected BFS
  const visited = new Set<string>();
  const clusters: DefectCluster[] = [];
  let nextClusterId = 1;

  for (const key of defectDiePositions) {
    if (visited.has(key)) continue;

    const clusterDies: { row: number; col: number }[] = [];
    const queue: string[] = [key];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const [rStr, cStr] = current.split(',');
      const r = Number(rStr);
      const c = Number(cStr);
      clusterDies.push({ row: r, col: c });

      // 8-neighbor directions
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nKey = `${r + dr},${c + dc}`;
          if (defectDiePositions.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push(nKey);
          }
        }
      }
    }

    clusters.push({
      id: nextClusterId++,
      size: clusterDies.length,
      dies: clusterDies,
    });
  }

  // Sort clusters largest first
  clusters.sort((a, b) => b.size - a.size);

  const clusterCount = clusters.length;
  const largestClusterSize = clusters.length > 0 ? clusters[0].size : 0;
  const isolatedDefectCount = clusters.filter((c) => c.size === 1).length;
  const clusteredDefectDies = clusters.filter((c) => c.size >= 2).reduce((sum, c) => sum + c.size, 0);
  const clusterFractionPercent = defectCount > 0 ? (clusteredDefectDies / defectCount) * 100 : 0;

  // Check edge ratio
  let edgeDefectCount = 0;
  for (const key of defectDiePositions) {
    const die = dieByCoord.get(key);
    if (die) {
      const dist = Math.hypot(die.centerX, die.centerY);
      const maxRadius = dies.reduce((max, d) => Math.max(max, Math.hypot(d.centerX, d.centerY)), 0);
      if (dist >= maxRadius * 0.85) {
        edgeDefectCount += 1;
      }
    }
  }

  const edgeDefectRatio = defectCount > 0 ? edgeDefectCount / defectCount : 0;

  let patternType: DefectClusterAnalysis['patternType'] = 'random';
  let diagnosis = '';

  if (edgeDefectRatio > 0.65 && defectCount >= 4) {
    patternType = 'edge-ring';
    diagnosis =
      'Edge-ring defect pattern detected. Likely caused by CMP edge over-polishing, edge bead removal (EBR) solvent splashing, or wafer bevel ring delamination.';
  } else if (clusterFractionPercent >= 50 && largestClusterSize >= 3) {
    patternType = 'clustered';
    diagnosis =
      'Macro-defect cluster detected. Indicates localized particulate contamination, wafer chuck mechanical contact scratch, spin-coat resist dispense void, or CVD pin mark.';
  } else {
    patternType = 'random';
    diagnosis =
      'Spatially random defect distribution (Poisson model applicable). Consistent with background cleanroom airborne particle fallout or gate dielectric intrinsic breakdown.';
  }

  return {
    totalDies,
    goodCount,
    defectCount,
    skipCount,
    edgeCount,
    defectRatePercent,
    clusterCount,
    largestClusterSize,
    isolatedDefectCount,
    clusterFractionPercent,
    patternType,
    diagnosis,
    clusters,
  };
}
