import { describe, it, expect } from 'vitest';
import {
  PROCESS_PIPELINE_PRESETS,
  calculatePipelineMetrics,
} from './process-pipeline';

describe('Process Pipeline and Recipe Sequencing', () => {
  it('loads standard preset pipelines (HKMG and Cu Damascene)', () => {
    expect(PROCESS_PIPELINE_PRESETS.length).toBeGreaterThanOrEqual(2);
    const hkmg = PROCESS_PIPELINE_PRESETS.find((p) => p.id === 'hkmg-gate-stack');
    expect(hkmg).toBeDefined();
    expect(hkmg?.steps.length).toBe(6);
  });

  it('calculates cumulative thickness and thermal budget metrics accurately', () => {
    const hkmg = PROCESS_PIPELINE_PRESETS.find((p) => p.id === 'hkmg-gate-stack')!;
    const metrics = calculatePipelineMetrics(hkmg.steps);

    expect(metrics.totalSteps).toBe(6);
    // 0 + 0.8 + 2.2 + 5.0 + 60.0 + 0 = 68.0 nm
    expect(metrics.totalThicknessNm).toBe(68.0);
    // Thermal budget accumulation from 850C and 1050C steps
    expect(metrics.cumulativeThermalBudgetDtCm2).toBeGreaterThan(0);
    // Cascade yield remains realistic (> 98%)
    expect(metrics.estimatedCumulativeYield).toBeGreaterThan(0.98);
    expect(metrics.estimatedCumulativeYield).toBeLessThan(1.0);
  });

  it('calculates dual damascene net interconnect metal deposition', () => {
    const damascene = PROCESS_PIPELINE_PRESETS.find((p) => p.id === 'cu-damascene-flow')!;
    const metrics = calculatePipelineMetrics(damascene.steps);

    expect(metrics.totalSteps).toBe(5);
    // Net thickness change through deposition, etch, plating, and CMP
    expect(metrics.totalThicknessNm).toBe(154.0); // 150 - 150 + 4 + 600 - 450 = 154 nm
  });
});
