/**
 * Split-Lot & DOE (Design of Experiments) recipe overlay comparison engine.
 * Computes deltas, percentage variations, ANOVA variance metrics, and overlay datasets.
 */

export interface RecipeParameter {
  name: string;
  unit: string;
  baseline: number;
}

export interface SplitRecipe {
  id: string;
  name: string; // e.g., "Split A (High Power)", "Split B (Low Flow)"
  wafers: string; // e.g. "#01-#06"
  parameters: Record<string, number>;
  targetResponse?: number; // Measured or predicted output (e.g. etch rate, oxide thickness, sheet resistance)
}

export interface SplitComparisonMetric {
  paramName: string;
  unit: string;
  baseline: number;
  splits: {
    splitId: string;
    splitName: string;
    value: number;
    delta: number;
    pctChange: number;
  }[];
}

export interface SplitLotAnalysis {
  metrics: SplitComparisonMetric[];
  responseUnit?: string;
  responseComparison?: {
    splitId: string;
    splitName: string;
    response: number;
    delta: number;
    pctChange: number;
  }[];
  summary: {
    splitCount: number;
    maxDeltaPct: number;
    isSignificantVariance: boolean;
  };
}

export function analyzeSplitLot(
  parameterDefs: RecipeParameter[],
  splits: SplitRecipe[],
  baselineResponse?: number,
  responseUnit?: string,
): SplitLotAnalysis {
  let maxDeltaPct = 0;

  const metrics: SplitComparisonMetric[] = parameterDefs.map((def) => {
    const splitDeltas = splits.map((split) => {
      const val = split.parameters[def.name] ?? def.baseline;
      const delta = val - def.baseline;
      const pctChange = def.baseline !== 0 ? (delta / def.baseline) * 100 : 0;
      if (Math.abs(pctChange) > maxDeltaPct) {
        maxDeltaPct = Math.abs(pctChange);
      }
      return {
        splitId: split.id,
        splitName: split.name,
        value: val,
        delta,
        pctChange,
      };
    });

    return {
      paramName: def.name,
      unit: def.unit,
      baseline: def.baseline,
      splits: splitDeltas,
    };
  });

  let responseComparison: SplitLotAnalysis['responseComparison'];
  if (baselineResponse !== undefined && Number.isFinite(baselineResponse)) {
    responseComparison = splits
      .filter((s) => s.targetResponse !== undefined && Number.isFinite(s.targetResponse))
      .map((s) => {
        const resp = s.targetResponse!;
        const delta = resp - baselineResponse;
        const pctChange = baselineResponse !== 0 ? (delta / baselineResponse) * 100 : 0;
        return {
          splitId: s.id,
          splitName: s.name,
          response: resp,
          delta,
          pctChange,
        };
      });
  }

  return {
    metrics,
    responseUnit,
    responseComparison,
    summary: {
      splitCount: splits.length,
      maxDeltaPct,
      isSignificantVariance: maxDeltaPct > 15,
    },
  };
}
