import { describe, it, expect } from 'vitest';
import {
  parseKlarf,
  generateSyntheticKlarf,
  clusterDefects,
  type KlarfDefect,
} from './klarf-parser';

describe('KLARF defect file parser and clustering', () => {
  it('parses synthetic KLARF file and extracts headers, defects, and classes', () => {
    const rawKlarf = generateSyntheticKlarf({
      lotId: 'LOT-9876',
      waferId: 'W12',
      defectCount: 50,
      includeScratch: true,
    });

    const summary = parseKlarf(rawKlarf);

    expect(summary.header.lotId).toBe('LOT-9876');
    expect(summary.header.waferId).toBe('W12');
    expect(summary.header.inspectionStationId).toContain('Archer-500');
    expect(summary.header.diePitchX).toBe(12000);
    expect(summary.totalDefects).toBeGreaterThanOrEqual(45);
    expect(summary.defectiveDieCount).toBeGreaterThan(0);
    expect(summary.defectDensityPerCm2).toBeGreaterThan(0);
    expect(summary.hasScratches).toBe(true);
    expect(summary.clusters.length).toBeGreaterThan(0);
  });

  it('detects mechanical scratch line when defects exhibit high aspect ratio', () => {
    // Generate a deliberate line of defects with small pitch
    const lineDefects: KlarfDefect[] = [];
    for (let i = 0; i < 8; i++) {
      lineDefects.push({
        id: i + 1,
        xRel: 1000,
        yRel: 1000,
        xIndex: i,
        yIndex: 0,
        xSize: 1.0,
        ySize: 1.0,
        defectArea: 1.0,
        classNumber: 9,
        clusterNumber: 0,
        roughXMm: i * 3.0, // spans 0 to 21mm in X
        roughYMm: 0.1 * (i % 2), // spans only 0.1mm in Y -> high aspect ratio
      });
    }

    const clusters = clusterDefects(lineDefects, 4000);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters[0].category).toBe('scratch');
    expect(clusters[0].count).toBe(8);
  });
});

describe('KLARF sample generator determinism', () => {
  it('produces identical output and deep-equal summaries for the same options and seed', () => {
    const opts = { lotId: 'LOT-DET', waferId: 'W-DET', defectCount: 40, includeScratch: true };

    const a = generateSyntheticKlarf({ ...opts, seed: 20260913 });
    const b = generateSyntheticKlarf({ ...opts, seed: 20260913 });

    expect(a).toBe(b);
    const summaryA = parseKlarf(a);
    const summaryB = parseKlarf(b);
    expect(summaryA).toEqual(summaryB);
    expect(summaryA.defects).toEqual(summaryB.defects);
  });

  it('is deterministic by default — no seed passed (fixed default seed 20260913)', () => {
    const a = generateSyntheticKlarf({ defectCount: 40 });
    const b = generateSyntheticKlarf({ defectCount: 40 });

    expect(a).toBe(b);
    expect(parseKlarf(a)).toEqual(parseKlarf(b));
  });

  it('different seeds produce different defect data', () => {
    const a = generateSyntheticKlarf({ defectCount: 40, seed: 1 });
    const b = generateSyntheticKlarf({ defectCount: 40, seed: 2 });

    expect(a).not.toBe(b);
    expect(parseKlarf(a).defects).not.toEqual(parseKlarf(b).defects);
  });
});
