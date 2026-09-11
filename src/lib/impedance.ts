/**
 * L-network impedance matching.
 *
 * Two real resistances are matched with one series element and one shunt
 * element. Which side the shunt sits on follows from the resistance ratio:
 * the shunt always goes across the larger resistance and the series element
 * faces the smaller one. The loaded Q is fixed by that ratio, so the bandwidth
 * is a consequence of the match, not a knob.
 *
 * The element values are reactances at the design frequency, so this is a
 * narrowband match: L and C values are quoted at f0 and drift off match as the
 * frequency moves. The returned bandwidth is the Q-based estimate.
 */

export interface MatchInput {
  frequencyHz: number;
  sourceOhm: number;
  loadOhm: number;
}

export type ShuntSide = 'load' | 'source';

export interface MatchSolution {
  id: 'series-l-shunt-c' | 'series-c-shunt-l';
  label: string;
  pass: 'low' | 'high';
  shuntSide: ShuntSide;
  /** Reactance of the series element, ohms (magnitude). */
  seriesReactanceOhm: number;
  /** Reactance of the shunt element, ohms (magnitude). */
  shuntReactanceOhm: number;
  seriesInductanceH: number | null;
  seriesCapacitanceF: number | null;
  shuntInductanceH: number | null;
  shuntCapacitanceF: number | null;
}

export interface MatchResult {
  q: number;
  bandwidthHz: number;
  shuntSide: ShuntSide;
  solutions: MatchSolution[];
}

/** Reactance of an inductor at f. */
export function inductiveReactance(inductanceH: number, frequencyHz: number): number {
  return 2 * Math.PI * frequencyHz * inductanceH;
}

/** Reactance of a capacitor at f (positive magnitude). */
export function capacitiveReactance(capacitanceF: number, frequencyHz: number): number {
  return 1 / (2 * Math.PI * frequencyHz * capacitanceF);
}

export function inductanceForReactance(reactanceOhm: number, frequencyHz: number): number {
  return reactanceOhm / (2 * Math.PI * frequencyHz);
}

export function capacitanceForReactance(reactanceOhm: number, frequencyHz: number): number {
  return 1 / (2 * Math.PI * frequencyHz * reactanceOhm);
}

/**
 * Match a real source to a real load with an L network.
 *
 * Throws when a resistance is not positive, the frequency is not positive, or
 * the two resistances are equal (already matched, so no L network exists).
 */
export function matchLNetwork(input: MatchInput): MatchResult {
  const { frequencyHz, sourceOhm, loadOhm } = input;
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new Error('The design frequency must be greater than 0 Hz.');
  }
  if (!Number.isFinite(sourceOhm) || sourceOhm <= 0) {
    throw new Error('The source resistance must be greater than 0 ohm.');
  }
  if (!Number.isFinite(loadOhm) || loadOhm <= 0) {
    throw new Error('The load resistance must be greater than 0 ohm.');
  }
  if (sourceOhm === loadOhm) {
    throw new Error(
      'The source and load resistances are equal, so they are already matched and no L network exists.',
    );
  }

  const shuntSide: ShuntSide = loadOhm > sourceOhm ? 'load' : 'source';
  const higher = Math.max(sourceOhm, loadOhm);
  const lower = Math.min(sourceOhm, loadOhm);
  const q = Math.sqrt(higher / lower - 1);
  const seriesReactanceOhm = q * lower;
  const shuntReactanceOhm = higher / q;
  const bandwidthHz = frequencyHz / q;

  const omega = 2 * Math.PI * frequencyHz;
  const solutions: MatchSolution[] = [
    {
      id: 'series-l-shunt-c',
      label: 'Low-pass (series inductor, shunt capacitor)',
      pass: 'low',
      shuntSide,
      seriesReactanceOhm,
      shuntReactanceOhm,
      seriesInductanceH: seriesReactanceOhm / omega,
      seriesCapacitanceF: null,
      shuntInductanceH: null,
      shuntCapacitanceF: 1 / (omega * shuntReactanceOhm),
    },
    {
      id: 'series-c-shunt-l',
      label: 'High-pass (series capacitor, shunt inductor)',
      pass: 'high',
      shuntSide,
      seriesReactanceOhm,
      shuntReactanceOhm,
      seriesInductanceH: null,
      seriesCapacitanceF: 1 / (omega * seriesReactanceOhm),
      shuntInductanceH: shuntReactanceOhm / omega,
      shuntCapacitanceF: null,
    },
  ];

  return { q, bandwidthHz, shuntSide, solutions };
}

/**
 * Fractional bandwidth of the match, i.e. 1/Q. This is the narrowband
 * estimate implied by the loaded Q and is the honest answer for an L network;
 * a wider match needs more sections.
 */
export function fractionalBandwidth(q: number): number {
  return 1 / q;
}
