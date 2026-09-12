import { describe, expect, it } from 'vitest';
import { exportSemiG85, parseSemiG85, analyzeDefectClusters } from './wafer-map-g85';
import type { Die } from './wafer';

describe('SEMI G85 wafer map export and parsing', () => {
  it('exports and parses SEMI G85 format accurately', () => {
    const mockDies: Die[] = [
      { dieNumber: 1, x: 0, y: 0, row: 0, column: 0, centerX: 0, centerY: 0, status: 'Good' },
      { dieNumber: 2, x: 1, y: 0, row: 0, column: 1, centerX: 10, centerY: 0, status: 'Defect' },
      { dieNumber: 3, x: 0, y: 1, row: 1, column: 0, centerX: 0, centerY: 10, status: 'Skip' },
      { dieNumber: 4, x: 1, y: 1, row: 1, column: 1, centerX: 10, centerY: 10, status: 'Edge' },
    ];

    const ascii = exportSemiG85(mockDies, 'TEST_WAFER_01');
    expect(ascii).toContain('FORMAT:SEMI_G85_ASCII');
    expect(ascii).toContain('WAFER_ID:TEST_WAFER_01');
    expect(ascii).toContain('ROW_COUNT:2');
    expect(ascii).toContain('COL_COUNT:2');
    expect(ascii).toContain('01'); // row 0: Good(0) Defect(1)
    expect(ascii).toContain('SE'); // row 1: Skip(S) Edge(E)

    const parsed = parseSemiG85(ascii);
    expect(parsed.waferId).toBe('TEST_WAFER_01');
    expect(parsed.rowCount).toBe(2);
    expect(parsed.colCount).toBe(2);
    expect(parsed.dies.length).toBe(4);
    expect(parsed.dies[0].status).toBe('Good');
    expect(parsed.dies[1].status).toBe('Defect');
    expect(parsed.dies[2].status).toBe('Skip');
    expect(parsed.dies[3].status).toBe('Edge');
  });

  it('detects clean wafer with no defects', () => {
    const dies: Die[] = [
      { dieNumber: 1, x: 0, y: 0, row: 0, column: 0, centerX: 0, centerY: 0, status: 'Good' },
      { dieNumber: 2, x: 1, y: 0, row: 0, column: 1, centerX: 10, centerY: 0, status: 'Good' },
    ];
    const analysis = analyzeDefectClusters(dies);
    expect(analysis.patternType).toBe('clean');
    expect(analysis.defectCount).toBe(0);
    expect(analysis.clusterCount).toBe(0);
  });

  it('detects macro defect clusters', () => {
    // 4 connected defect dies
    const dies: Die[] = [
      { dieNumber: 1, x: 0, y: 0, row: 0, column: 0, centerX: 0, centerY: 0, status: 'Defect' },
      { dieNumber: 2, x: 1, y: 0, row: 0, column: 1, centerX: 10, centerY: 0, status: 'Defect' },
      { dieNumber: 3, x: 0, y: 1, row: 1, column: 0, centerX: 0, centerY: 10, status: 'Defect' },
      { dieNumber: 4, x: 1, y: 1, row: 1, column: 1, centerX: 10, centerY: 10, status: 'Defect' },
      { dieNumber: 5, x: 5, y: 5, row: 5, column: 5, centerX: 50, centerY: 50, status: 'Good' },
    ];
    const analysis = analyzeDefectClusters(dies);
    expect(analysis.clusterCount).toBe(1);
    expect(analysis.largestClusterSize).toBe(4);
    expect(analysis.patternType).toBe('clustered');
    expect(analysis.clusterFractionPercent).toBe(100);
  });

  it('detects isolated random defects', () => {
    const dies: Die[] = [
      { dieNumber: 1, x: 0, y: 0, row: 0, column: 0, centerX: 0, centerY: 0, status: 'Defect' },
      { dieNumber: 2, x: 5, y: 5, row: 5, column: 5, centerX: 50, centerY: 50, status: 'Defect' },
      { dieNumber: 3, x: 10, y: 10, row: 10, column: 10, centerX: 100, centerY: 100, status: 'Good' },
    ];
    const analysis = analyzeDefectClusters(dies);
    expect(analysis.clusterCount).toBe(2);
    expect(analysis.largestClusterSize).toBe(1);
    expect(analysis.isolatedDefectCount).toBe(2);
    expect(analysis.patternType).toBe('random');
  });
});
