import { tool as acceptanceSamplingCalculator } from './acceptance-sampling-calculator';
import { tool as arrheniusCalculator } from './arrhenius-calculator';
import { tool as binYieldCalculator } from './bin-yield-calculator';
import { tool as carrierMobilityCalculator } from './carrier-mobility-calculator';
import { tool as cdUniformityCalculator } from './cd-uniformity-calculator';
import { tool as cmpPrestonCalculator } from './cmp-preston-calculator';
import { tool as defectDensityCalculator } from './defect-density-calculator';
import { tool as dieCostCalculator } from './die-cost-calculator';
import { tool as diffusionLengthCalculator } from './diffusion-length-calculator';
import { tool as etchRateCalculator } from './etch-rate-calculator';
import { tool as filmStressCalculator } from './film-stress-calculator';
import { tool as filmUniformityCalculator } from './film-uniformity-calculator';
import { tool as filmColorCalculator } from './film-color-calculator';
import { tool as fitMtbfCalculator } from './fit-mtbf-calculator';
import { tool as gasFlowConverter } from './gas-flow-converter';
import { tool as cleanroomCalculator } from './cleanroom-converter';
import { tool as impedanceMatchingCalculator } from './impedance-matching-calculator';
import { tool as ionImplantationCalculator } from './ion-implantation-calculator';
import { tool as lithographyResolutionCalculator } from './lithography-resolution-calculator';
import { tool as microstripCalculator } from './microstrip-calculator';
import { tool as mosfetThresholdCalculator } from './mosfet-threshold-calculator';
import { tool as powerConverter } from './power-converter';
import { tool as pressureConverter } from './pressure-converter';
import { tool as processCapabilityCalculator } from './process-capability-calculator';
import { tool as reticleFieldCalculator } from './reticle-field-calculator';
import { tool as returnLossCalculator } from './return-loss-calculator';
import { tool as rfPowerCalculator } from './rf-power-calculator';
import { tool as semiconductorDepletionCalculator } from './semiconductor-depletion-calculator';
import { tool as sheetResistanceCalculator } from './sheet-resistance-calculator';
import { tool as spcControlChartCalculator } from './spc-control-chart-calculator';
import { tool as stubMatchingCalculator } from './stub-matching-calculator';
import { tool as temperatureConverter } from './temperature-converter';
import { tool as thermalFatigueCalculator } from './thermal-fatigue-calculator';
import { tool as thermalOxideCalculator } from './thermal-oxide-calculator';
import { tool as thermalResistanceCalculator } from './thermal-resistance-calculator';
import { tool as thicknessConverter } from './thickness-converter';
import { tool as throughputCalculator } from './throughput-calculator';
import { tool as timeConstantCalculator } from './time-constant-calculator';
import { tool as waferAreaCalculator } from './wafer-area-calculator';
import { tool as waferDieCalculator } from './wafer-die-calculator';
import { tool as weibullLifeCalculator } from './weibull-life-calculator';
import { tool as waferMapGenerator } from './wafer-map-generator';
import { tool as waferMarkCalculator } from './wafer-mark-calculator';
import { tool as yieldCalculator } from './yield-calculator';
import { tool as yieldConfidenceCalculator } from './yield-confidence-calculator';
import { tool as yieldDppmCalculator } from './yield-dppm-calculator';
import { tool as yieldModelCalculator } from './yield-model-calculator';
import { tool as wireBondingCalculator } from './wire-bonding-calculator';
import { tool as chemicalDilutionCalculator } from './chemical-dilution-calculator';
import { tool as plasmaSheathCalculator } from './plasma-sheath-calculator';
import { tool as aldCycleCalculator } from './ald-cycle-calculator';
import { tool as dopantDiffusionCalculator } from './dopant-diffusion-calculator';
import type { Tool, ToolCategory } from './tools.types';

/**
 * Central tool registry — the single source of truth for navigation.
 *
 * Order in this array drives the sidebar, the home grid and the related-tool
 * lists. Only light navigation metadata lives here: it is imported by the
 * client sidebar and the command palette, so long page copy (FAQ answers,
 * formula text, notes) stays in the route files.
 */
export const tools: Tool[] = [
  waferDieCalculator,
  waferMapGenerator,
  waferMarkCalculator,
  yieldCalculator,
  yieldModelCalculator,
  defectDensityCalculator,
  dieCostCalculator,
  processCapabilityCalculator,
  yieldConfidenceCalculator,
  throughputCalculator,
  sheetResistanceCalculator,
  waferAreaCalculator,
  reticleFieldCalculator,
  thicknessConverter,
  pressureConverter,
  gasFlowConverter,
  temperatureConverter,
  lithographyResolutionCalculator,
  etchRateCalculator,
  cdUniformityCalculator,
  filmStressCalculator,
  filmUniformityCalculator,
  diffusionLengthCalculator,
  arrheniusCalculator,
  thermalOxideCalculator,
  powerConverter,
  timeConstantCalculator,
  rfPowerCalculator,
  returnLossCalculator,
  impedanceMatchingCalculator,
  microstripCalculator,
  stubMatchingCalculator,
  binYieldCalculator,
  fitMtbfCalculator,
  yieldDppmCalculator,
  weibullLifeCalculator,
  spcControlChartCalculator,
  acceptanceSamplingCalculator,
  ionImplantationCalculator,
  semiconductorDepletionCalculator,
  cleanroomCalculator,
  mosfetThresholdCalculator,
  carrierMobilityCalculator,
  filmColorCalculator,
  thermalResistanceCalculator,
  wireBondingCalculator,
  cmpPrestonCalculator,
  thermalFatigueCalculator,
  chemicalDilutionCalculator,
  plasmaSheathCalculator,
  aldCycleCalculator,
  dopantDiffusionCalculator,
];

export const categories: string[] = [...new Set(tools.map((tool) => tool.category))];

export const toolsByCategory: ToolCategory[] = categories.map((name) => ({
  name,
  components: tools.filter((tool) => tool.category === name),
}));

export function getTool(path: string): Tool | undefined {
  return tools.find((tool) => tool.path === path);
}

/**
 * Related tools for a tool page: same category first, then the rest of the
 * registry, so a small registry still fills the list.
 */
export function getRelatedTools(path: string, limit = 3): Tool[] {
  const current = getTool(path);
  const pool = tools.filter((tool) => tool.path !== path);

  const sameCategory = pool.filter((tool) => tool.category === current?.category);
  const others = pool.filter((tool) => tool.category !== current?.category);

  return [...sameCategory, ...others].slice(0, limit);
}
