
import { type LengthUnit, LENGTH_TO_MM, toMm } from './units';

export type DiameterUnit = 'mm' | 'cm' | 'inch';
export const DIAMETER_UNITS: DiameterUnit[] = ['mm', 'cm', 'inch'];

export { LENGTH_UNITS, type LengthUnit } from './units';

const DIAMETER_TO_MM: Record<DiameterUnit, number> = { mm: 1, cm: 10, inch: 25.4 };

export interface WaferAreaInput {
  diameter: number;
  diameterUnit: DiameterUnit;
  edgeExclusion: number;
  edgeExclusionUnit: LengthUnit;
  dieWidth: number;
  dieHeight: number;
  dieUnit: LengthUnit;
  /** Optional measured gross die count. Enables the utilisation figures. */
  dieCount?: number | null;
}

export interface WaferAreaSuccess {
  ok: true;
  waferAreaMm2: number;
  waferAreaCm2: number;
  /** Diameter left after removing the edge exclusion ring from both sides. */
  usableDiameterMm: number;
  usableAreaMm2: number;
  usableAreaCm2: number;
  /** Share of the full wafer area lost to the edge exclusion ring. */
  edgeLossPercent: number;
  dieAreaMm2: number;
  dieAreaCm2: number;
  /** Floor(usable area / die area): an upper bound that ignores the round boundary. */
  areaOnlyDieCount: number;
  /** Die area as a share of the usable area, using the measured die count. */
  utilizationPercent: number | null;
  /** Measured die count as a share of the area-only bound. */
  packingEfficiencyPercent: number | null;
}

export interface WaferAreaFailure {
  ok: false;
  errors: string[];
}

export type WaferAreaResult = WaferAreaSuccess | WaferAreaFailure;

export const DIAMETER_TO_MM_MAP = DIAMETER_TO_MM;
export const LENGTH_TO_MM_MAP = LENGTH_TO_MM;

export function calculateWaferArea(input: WaferAreaInput): WaferAreaResult {
  const errors: string[] = [];

  if (!Number.isFinite(input.diameter) || input.diameter <= 0) errors.push('Wafer diameter must be greater than 0.');
  if (!Number.isFinite(input.edgeExclusion) || input.edgeExclusion < 0) errors.push('Edge exclusion cannot be negative.');
  if (!Number.isFinite(input.dieWidth) || input.dieWidth <= 0) errors.push('Die width must be greater than 0.');
  if (!Number.isFinite(input.dieHeight) || input.dieHeight <= 0) errors.push('Die height must be greater than 0.');

  const measuredCount = input.dieCount;
  if (measuredCount !== undefined && measuredCount !== null && (!Number.isFinite(measuredCount) || measuredCount < 0)) {
    errors.push('Measured die count must be zero or greater.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const diameterMm = input.diameter * DIAMETER_TO_MM[input.diameterUnit];
  const edgeExclusionMm = toMm(input.edgeExclusion, input.edgeExclusionUnit);
  const usableRadiusMm = diameterMm / 2 - edgeExclusionMm;

  if (usableRadiusMm <= 0) {
    return { ok: false, errors: ['Edge exclusion must be smaller than the wafer radius.'] };
  }

  const dieWidthMm = toMm(input.dieWidth, input.dieUnit);
  const dieHeightMm = toMm(input.dieHeight, input.dieUnit);

  const waferAreaMm2 = Math.PI * (diameterMm / 2) ** 2;
  const usableAreaMm2 = Math.PI * usableRadiusMm ** 2;
  const dieAreaMm2 = dieWidthMm * dieHeightMm;
  const areaOnlyDieCount = Math.floor(usableAreaMm2 / dieAreaMm2);

  let utilizationPercent: number | null = null;
  let packingEfficiencyPercent: number | null = null;
  if (typeof measuredCount === 'number') {
    utilizationPercent = ((measuredCount * dieAreaMm2) / usableAreaMm2) * 100;
    packingEfficiencyPercent = areaOnlyDieCount > 0 ? (measuredCount / areaOnlyDieCount) * 100 : null;
  }

  return {
    ok: true,
    waferAreaMm2,
    waferAreaCm2: waferAreaMm2 / 100,
    usableDiameterMm: usableRadiusMm * 2,
    usableAreaMm2,
    usableAreaCm2: usableAreaMm2 / 100,
    edgeLossPercent: ((waferAreaMm2 - usableAreaMm2) / waferAreaMm2) * 100,
    dieAreaMm2,
    dieAreaCm2: dieAreaMm2 / 100,
    areaOnlyDieCount,
    utilizationPercent,
    packingEfficiencyPercent,
  };
}
