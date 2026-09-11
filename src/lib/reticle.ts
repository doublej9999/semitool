
import { type LengthUnit, toMm } from './units';

export { LENGTH_UNITS, type LengthUnit } from './units';

export interface ReticleInput {
  fieldWidth: number;
  fieldHeight: number;
  fieldUnit: LengthUnit;
  dieWidth: number;
  dieHeight: number;
  dieUnit: LengthUnit;
  /** Scribe lane (kerf) between neighbouring dice, added to the die pitch. */
  scribe: number;
  scribeUnit: LengthUnit;
  /** Optional wafer context. Supply both to get the shot count. */
  waferDiameter?: number | null;
  waferUnit?: LengthUnit;
  edgeExclusion?: number | null;
  edgeExclusionUnit?: LengthUnit;
}

export interface ReticleSuccess {
  ok: true;
  fieldAreaMm2: number;
  dieAreaMm2: number;
  pitchXMm: number;
  pitchYMm: number;
  diesPerFieldX: number;
  diesPerFieldY: number;
  diesPerField: number;
  /** Die area inside one field as a share of the field area. */
  fieldUtilizationPercent: number;
  /** Fields whose centre lands inside the usable circle. Null without a wafer diameter. */
  shotsPerWafer: number | null;
  /** Shots x dice per field: an upper bound that ignores partial fields at the rim. */
  diesPerWaferUpperBound: number | null;
  usableRadiusMm: number | null;
}

export interface ReticleFailure {
  ok: false;
  errors: string[];
}

export type ReticleResult = ReticleSuccess | ReticleFailure;

/**
 * Number of grid points that fall inside a circle of the given radius, with the
 * origin at the wafer centre. A point counts when the *centre* of the cell is
 * inside, which is the convention used by the wafer map generator and the wafer
 * die calculator, so the numbers can be compared with each other.
 */
export function countCentresInCircle(radius: number, pitchX: number, pitchY: number): number {
  const maxI = Math.ceil(radius / pitchX);
  const maxJ = Math.ceil(radius / pitchY);
  let count = 0;

  for (let i = -maxI; i <= maxI; i += 1) {
    for (let j = -maxJ; j <= maxJ; j += 1) {
      if ((i * pitchX) ** 2 + (j * pitchY) ** 2 <= radius ** 2) count += 1;
    }
  }

  return count;
}

export function calculateReticleField(input: ReticleInput): ReticleResult {
  const errors: string[] = [];

  const positive: Array<[string, number]> = [
    ['Field width', input.fieldWidth],
    ['Field height', input.fieldHeight],
    ['Die width', input.dieWidth],
    ['Die height', input.dieHeight],
  ];
  for (const [label, value] of positive) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${label} must be greater than 0.`);
  }
  if (!Number.isFinite(input.scribe) || input.scribe < 0) errors.push('Scribe lane cannot be negative.');
  if (errors.length > 0) return { ok: false, errors };

  const fieldWidthMm = toMm(input.fieldWidth, input.fieldUnit);
  const fieldHeightMm = toMm(input.fieldHeight, input.fieldUnit);
  const dieWidthMm = toMm(input.dieWidth, input.dieUnit);
  const dieHeightMm = toMm(input.dieHeight, input.dieUnit);
  const scribeMm = toMm(input.scribe, input.scribeUnit);

  const pitchXMm = dieWidthMm + scribeMm;
  const pitchYMm = dieHeightMm + scribeMm;
  const diesPerFieldX = Math.floor(fieldWidthMm / pitchXMm);
  const diesPerFieldY = Math.floor(fieldHeightMm / pitchYMm);

  if (diesPerFieldX < 1 || diesPerFieldY < 1) {
    return {
      ok: false,
      errors: [
        'One die plus its scribe lane does not fit in the field on both axes. Shrink the die, the scribe lane or the field.',
      ],
    };
  }

  const diesPerField = diesPerFieldX * diesPerFieldY;
  const fieldAreaMm2 = fieldWidthMm * fieldHeightMm;
  const dieAreaMm2 = dieWidthMm * dieHeightMm;
  const fieldUtilizationPercent = ((diesPerField * dieAreaMm2) / fieldAreaMm2) * 100;

  let shotsPerWafer: number | null = null;
  let diesPerWaferUpperBound: number | null = null;
  let usableRadiusMm: number | null = null;

  const hasWafer = typeof input.waferDiameter === 'number' && Number.isFinite(input.waferDiameter);
  if (hasWafer) {
    const diameter = input.waferDiameter as number;
    const exclusion = input.edgeExclusion;
    const exclusionUnit = input.edgeExclusionUnit ?? input.waferUnit ?? 'mm';
    const waferUnit = input.waferUnit ?? 'mm';

    if (diameter <= 0) return { ok: false, errors: ['Wafer diameter must be greater than 0.'] };
    if (typeof exclusion !== 'number' || !Number.isFinite(exclusion) || exclusion < 0) {
      return { ok: false, errors: ['Edge exclusion cannot be negative.'] };
    }

    const diameterMm = toMm(diameter, waferUnit);
    const exclusionMm = toMm(exclusion, exclusionUnit);
    const radius = diameterMm / 2 - exclusionMm;

    if (radius <= 0) return { ok: false, errors: ['Edge exclusion must be smaller than the wafer radius.'] };

    usableRadiusMm = radius;
    // Fields are stepped by their own size, so the field size is the grid pitch.
    shotsPerWafer = countCentresInCircle(radius, fieldWidthMm, fieldHeightMm);
    diesPerWaferUpperBound = shotsPerWafer * diesPerField;
  }

  return {
    ok: true,
    fieldAreaMm2,
    dieAreaMm2,
    pitchXMm,
    pitchYMm,
    diesPerFieldX,
    diesPerFieldY,
    diesPerField,
    fieldUtilizationPercent,
    shotsPerWafer,
    diesPerWaferUpperBound,
    usableRadiusMm,
  };
}
