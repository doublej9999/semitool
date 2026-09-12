import { describe, it, expect } from 'vitest';
import {
  createNewLot,
  addStepExecution,
  splitLotBranch,
  generateGenealogyMesJson,
  generateGenealogyCsv,
  evaluateBranchMetrology,
} from './lot-genealogy';

describe('Virtual Lot Genealogy Engine', () => {
  it('creates a new 25-wafer lot with main control branch', () => {
    const lot = createNewLot('LOT-A9910', 'SOC-N3-GPU', 300, 25, 'FOUP-12');
    expect(lot.lotId).toBe('LOT-A9910');
    expect(lot.devicePartNumber).toBe('SOC-N3-GPU');
    expect(lot.totalWafers).toBe(25);
    expect(lot.branches.length).toBe(1);
    expect(lot.branches[0].branchId).toBe('main');
    expect(lot.branches[0].waferSlots.length).toBe(25);
    expect(lot.branches[0].steps.length).toBe(0);
  });

  it('records process steps with recipe params and metrology readings', () => {
    let lot = createNewLot('LOT-B101', 'DRAM-1B', 300, 25);
    lot = addStepExecution(lot, 'main', {
      stageName: 'Thermal Oxide',
      toolPath: '/tools/thermal-oxide-calculator',
      toolName: 'Oxide Furnace',
      recipeId: 'OX-DRY-1000C',
      equipmentId: 'FURN-04',
      operatorId: 'ENG-3819',
      recipeParams: { temperature: 1000, dryTime: 45 },
      metrologyResults: [
        { parameter: 'Tox', nominal: 15, measured: 15.2, usl: 16.0, lsl: 14.0, unit: 'nm' },
      ],
      disposition: 'PASS',
    });

    expect(lot.branches[0].steps.length).toBe(1);
    expect(lot.branches[0].steps[0].stepNumber).toBe(1);
    expect(lot.branches[0].steps[0].disposition).toBe('PASS');
    expect(lot.branches[0].steps[0].metrologyResults[0].measured).toBe(15.2);
  });

  it('splits lot into child branches and preserves prior step genealogy', () => {
    let lot = createNewLot('LOT-C500', 'FLASH-3D-232L', 300, 25);
    lot = addStepExecution(lot, 'main', {
      stageName: 'Pre-Clean',
      toolPath: '/tools/wet-bench-calculator',
      toolName: 'RCA Wet Bench',
      recipeId: 'RCA-STD',
      equipmentId: 'WET-02',
      operatorId: 'OP-12',
      recipeParams: { temp: 75 },
      metrologyResults: [],
      disposition: 'PASS',
    });

    // Split wafers 13-25 into Split 1 (High Power Etch)
    lot = splitLotBranch(lot, 'main', 'Split 1 - High Power', [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);

    expect(lot.branches.length).toBe(2);
    const mainBranch = lot.branches.find((b) => b.branchId === 'main')!;
    const splitBranch = lot.branches.find((b) => b.parentBranchId === 'main')!;

    expect(mainBranch.waferSlots.length).toBe(12);
    expect(splitBranch.waferSlots.length).toBe(13);
    // Split branch inherited step 1
    expect(splitBranch.steps.length).toBe(1);
    expect(splitBranch.steps[0].recipeId).toBe('RCA-STD');
  });

  it('evaluates branch metrology yield and out-of-spec counts accurately', () => {
    let lot = createNewLot('LOT-D888', 'RF-SOI-90NM', 200, 25);
    lot = addStepExecution(lot, 'main', {
      stageName: 'CMP',
      toolPath: '/tools/cmp-endpoint-calculator',
      toolName: 'CMP Polisher',
      recipeId: 'CMP-OX-PL',
      equipmentId: 'CMP-01',
      operatorId: 'TECH-7',
      recipeParams: { pressure: 3.5 },
      metrologyResults: [
        { parameter: 'Thickness-1', nominal: 100, measured: 102, usl: 105, lsl: 95, unit: 'nm' },
        { parameter: 'Thickness-2', nominal: 100, measured: 110, usl: 105, lsl: 95, unit: 'nm' }, // OOS
      ],
      disposition: 'HOLD',
    });

    const metrics = evaluateBranchMetrology(lot.branches[0]);
    expect(metrics.totalSteps).toBe(1);
    expect(metrics.totalMetrologyPoints).toBe(2);
    expect(metrics.outOfSpecCount).toBe(1);
    expect(metrics.passRate).toBe(50);
  });

  it('exports valid SEMI E90 MES JSON and CSV traveler representations', () => {
    const lot = createNewLot('LOT-E123', 'MEMS-GYRO', 150, 10);
    const json = generateGenealogyMesJson(lot);
    expect(json).toContain('SEMI-E90-LOT-GENEALOGY');
    expect(json).toContain('MEMS-GYRO');

    const csv = generateGenealogyCsv(lot);
    expect(csv).toContain('LotID,BranchName,StepNumber');
  });
});
