/**
 * SemiTools Virtual Lot Genealogy & Multi-Step Traveler Engine
 * Models semiconductor fab lot splits, process steps, metrology tracking, and genealogy tree.
 */

export interface MetrologyDataPoint {
  parameter: string;
  nominal: number;
  measured: number;
  usl?: number;
  lsl?: number;
  unit: string;
}

export interface LotStepExecution {
  id: string;
  stepNumber: number;
  stageName: string;
  toolPath: string;
  toolName: string;
  recipeId: string;
  equipmentId: string;
  operatorId: string;
  timestamp: string;
  recipeParams: Record<string, string | number>;
  metrologyResults: MetrologyDataPoint[];
  disposition: 'PASS' | 'SCRAP' | 'REWORK' | 'HOLD';
  notes?: string;
}

export interface LotSplitBranch {
  branchId: string;
  splitName: string;
  description: string;
  waferSlots: number[]; // e.g. [1, 2, 3... 12]
  parentBranchId: string | null;
  splitAtStepNumber: number;
  steps: LotStepExecution[];
}

export interface LotGenealogy {
  lotId: string;
  devicePartNumber: string;
  waferDiameterMm: 150 | 200 | 300 | 450;
  totalWafers: number;
  carrierFoupId: string;
  createdTime: string;
  branches: LotSplitBranch[];
}

export function createNewLot(
  lotId: string,
  devicePartNumber: string,
  waferDiameterMm: 150 | 200 | 300 | 450 = 300,
  totalWafers = 25,
  carrierFoupId = 'FOUP-01'
): LotGenealogy {
  const rootSlots = Array.from({ length: totalWafers }, (_, i) => i + 1);
  return {
    lotId: lotId.trim() || `LOT-${Date.now().toString().slice(-6)}`,
    devicePartNumber: devicePartNumber.trim() || 'DEV-3NM-FINFET',
    waferDiameterMm,
    totalWafers,
    carrierFoupId,
    createdTime: new Date().toISOString(),
    branches: [
      {
        branchId: 'main',
        splitName: 'Main Line (Control)',
        description: 'Baseline primary wafer manufacturing flow',
        waferSlots: rootSlots,
        parentBranchId: null,
        splitAtStepNumber: 0,
        steps: [],
      },
    ],
  };
}

export function addStepExecution(
  lot: LotGenealogy,
  branchId: string,
  step: Omit<LotStepExecution, 'id' | 'stepNumber' | 'timestamp'>
): LotGenealogy {
  const nextBranches = lot.branches.map((b) => {
    if (b.branchId !== branchId) return b;
    const stepNumber = b.steps.length + 1;
    const newStep: LotStepExecution = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stepNumber,
      timestamp: new Date().toISOString(),
    };
    return {
      ...b,
      steps: [...b.steps, newStep],
    };
  });

  return {
    ...lot,
    branches: nextBranches,
  };
}

export function splitLotBranch(
  lot: LotGenealogy,
  sourceBranchId: string,
  newSplitName: string,
  waferSlotsToSplit: number[],
  description = ''
): LotGenealogy {
  const sourceBranch = lot.branches.find((b) => b.branchId === sourceBranchId);
  if (!sourceBranch) {
    throw new Error(`Branch ${sourceBranchId} not found in lot`);
  }

  // Validate slots belong to source branch
  const remainingSlots = sourceBranch.waferSlots.filter((slot) => !waferSlotsToSplit.includes(slot));
  if (remainingSlots.length === sourceBranch.waferSlots.length) {
    throw new Error('Selected wafer slots do not belong to source branch');
  }

  const newBranchId = `split-${Date.now().toString(36).slice(-4)}`;
  const currentStepNum = sourceBranch.steps.length;

  const updatedSourceBranch: LotSplitBranch = {
    ...sourceBranch,
    waferSlots: remainingSlots,
  };

  const newBranch: LotSplitBranch = {
    branchId: newBranchId,
    splitName: newSplitName.trim() || `Split ${lot.branches.length}`,
    description,
    waferSlots: waferSlotsToSplit,
    parentBranchId: sourceBranchId,
    splitAtStepNumber: currentStepNum,
    // Child inherits all previous step executions from parent up to the split point
    steps: [...sourceBranch.steps],
  };

  return {
    ...lot,
    branches: lot.branches.map((b) => (b.branchId === sourceBranchId ? updatedSourceBranch : b)).concat(newBranch),
  };
}

export function generateGenealogyMesJson(lot: LotGenealogy): string {
  return JSON.stringify(
    {
      mesStandard: 'SEMI-E90-LOT-GENEALOGY',
      exportTimestamp: new Date().toISOString(),
      lot,
    },
    null,
    2
  );
}

export function generateGenealogyCsv(lot: LotGenealogy): string {
  const rows: string[] = [];
  rows.push('LotID,BranchName,StepNumber,Stage,ToolName,RecipeID,EquipmentID,Disposition,Operator,Timestamp,RecipeParameters,MetrologyCount');

  lot.branches.forEach((branch) => {
    branch.steps.forEach((step) => {
      const recipeStr = Object.entries(step.recipeParams)
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
      rows.push(
        `"${lot.lotId}","${branch.splitName} (#${branch.waferSlots.join(',')})",${step.stepNumber},"${step.stageName}","${step.toolName}","${step.recipeId}","${step.equipmentId}","${step.disposition}","${step.operatorId}","${step.timestamp}","${recipeStr}",${step.metrologyResults.length}`
      );
    });
  });

  return rows.join('\n');
}

export function evaluateBranchMetrology(branch: LotSplitBranch): {
  totalSteps: number;
  totalMetrologyPoints: number;
  outOfSpecCount: number;
  passRate: number;
} {
  let totalMetrologyPoints = 0;
  let outOfSpecCount = 0;

  branch.steps.forEach((s) => {
    s.metrologyResults.forEach((m) => {
      totalMetrologyPoints++;
      if (m.usl !== undefined && m.measured > m.usl) outOfSpecCount++;
      else if (m.lsl !== undefined && m.measured < m.lsl) outOfSpecCount++;
    });
  });

  const passRate = totalMetrologyPoints === 0 ? 100 : Math.round(((totalMetrologyPoints - outOfSpecCount) / totalMetrologyPoints) * 1000) / 10;

  return {
    totalSteps: branch.steps.length,
    totalMetrologyPoints,
    outOfSpecCount,
    passRate,
  };
}
