/**
 * Shunt stub matching of a complex load.
 *
 * A single shunt stub matches any load at one frequency: the stub is placed a
 * distance d from the load so that the line presents a purely real admittance,
 * and the stub then cancels the remaining susceptance. Two distances satisfy
 * that, and this module returns both, each with the short-circuited and the
 * open-circuited stub length.
 *
 * The numbers follow from the lossless transmission-line equations, and
 * `stubVerification` re-derives the input admittance from the reported
 * distances so a caller can confirm the match instead of trusting the algebra.
 */

import { wavelengthM } from './tline';

export interface StubInput {
  z0Ohm: number;
  loadR: number;
  loadX: number;
  frequencyHz: number;
  er: number;
}

export interface StubSolution {
  /** Distance from the load to the stub plane, m. */
  distanceM: number;
  /** Normalised susceptance the stub has to cancel. */
  normalizedSusceptance: number;
  shortStubLengthM: number;
  openStubLengthM: number;
}

export interface StubResult {
  lambdaM: number;
  normalizedLoadR: number;
  normalizedLoadX: number;
  solutions: StubSolution[];
}

export interface StubVerificationInput extends StubInput {
  distanceM: number;
  stubLengthM: number;
  stubKind: 'short' | 'open';
}

/**
 * Match a series R + jX load with a single shunt stub.
 *
 * Throws when Z0, the frequency, er or the load resistance is not positive.
 */
export function stubMatch(input: StubInput): StubResult {
  const { z0Ohm, loadR, loadX, frequencyHz, er } = input;
  if (!Number.isFinite(z0Ohm) || z0Ohm <= 0) {
    throw new Error('The line impedance must be greater than 0 ohm.');
  }
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new Error('The frequency must be greater than 0 Hz.');
  }
  if (!Number.isFinite(er) || er < 1) {
    throw new Error('The relative permittivity must be at least 1.');
  }
  if (!Number.isFinite(loadR) || loadR <= 0) {
    throw new Error('The load resistance must be greater than 0 ohm.');
  }
  if (!Number.isFinite(loadX)) {
    throw new Error('The load reactance must be a number.');
  }

  const r = loadR / z0Ohm;
  const x = loadX / z0Ohm;
  const lambda = wavelengthM(frequencyHz, er);

  const tangents: number[] = [];
  if (Math.abs(r - 1) < 1e-12) {
    // The load conductance already equals Y0, so only x = 0 is matched as is.
    if (Math.abs(x) > 1e-12) tangents.push(-x / 2);
  } else {
    const discriminant = x * x + (1 - r) * (r - r * r - x * x);
    if (discriminant < -1e-12) {
      throw new Error('This load has no single-stub solution at this impedance level.');
    }
    const root = Math.sqrt(Math.max(discriminant, 0));
    tangents.push((-x + root) / (1 - r), (-x - root) / (1 - r));
  }

  const solutions: StubSolution[] = [];
  for (const tangent of tangents) {
    if (!Number.isFinite(tangent)) continue;
    let betaD = Math.atan(tangent);
    if (betaD < 0) betaD += Math.PI;
    const distanceM = (betaD / (2 * Math.PI)) * lambda;

    // Normalised admittance presented by the line at the stub plane.
    const numerator = { re: 1 - tangent * x, im: tangent * r };
    const denominator = { re: r, im: x + tangent };
    const denominatorSquared = denominator.re * denominator.re + denominator.im * denominator.im;
    const susceptance =
      (numerator.im * denominator.re - numerator.re * denominator.im) / denominatorSquared;

    // Short stub: y = -j cot(beta l) cancels b, so cot(beta l) = b.
    // Open stub: y = j tan(beta l) cancels b, so tan(beta l) = -b.
    let betaShort: number;
    if (Math.abs(susceptance) < 1e-15) {
      betaShort = Math.PI / 2;
    } else {
      betaShort = Math.atan(1 / susceptance);
      if (betaShort < 0) betaShort += Math.PI;
    }
    let betaOpen = Math.atan(-susceptance);
    if (betaOpen < 0) betaOpen += Math.PI;

    solutions.push({
      distanceM,
      normalizedSusceptance: susceptance,
      shortStubLengthM: (betaShort / (2 * Math.PI)) * lambda,
      openStubLengthM: (betaOpen / (2 * Math.PI)) * lambda,
    });
  }

  if (solutions.length === 0) {
    throw new Error('This load is already matched, so it needs no stub.');
  }

  return { lambdaM: lambda, normalizedLoadR: r, normalizedLoadX: x, solutions };
}

/**
 * Re-derive the normalised input admittance from a solution, as an independent
 * check on the closed-form answers: it rebuilds the line admittance from the
 * distance and the stub admittance from the stub length, then adds them.
 */
export function stubVerification(input: StubVerificationInput): {
  normalizedConductance: number;
  normalizedSusceptance: number;
  deviation: number;
} {
  const { z0Ohm, loadR, loadX, frequencyHz, er, distanceM, stubLengthM, stubKind } = input;
  const lambda = wavelengthM(frequencyHz, er);
  const beta = (2 * Math.PI) / lambda;
  const r = loadR / z0Ohm;
  const x = loadX / z0Ohm;

  const t = Math.tan(beta * distanceM);
  const numerator = { re: 1 - t * x, im: t * r };
  const denominator = { re: r, im: x + t };
  const denominatorSquared = denominator.re * denominator.re + denominator.im * denominator.im;
  const lineConductance =
    (numerator.re * denominator.re + numerator.im * denominator.im) / denominatorSquared;
  const lineSusceptance =
    (numerator.im * denominator.re - numerator.re * denominator.im) / denominatorSquared;

  const stubSusceptance =
    stubKind === 'short'
      ? -1 / Math.tan(beta * stubLengthM)
      : Math.tan(beta * stubLengthM);

  const totalConductance = lineConductance;
  const totalSusceptance = lineSusceptance + stubSusceptance;
  const deviation = Math.hypot(totalConductance - 1, totalSusceptance);

  return {
    normalizedConductance: totalConductance,
    normalizedSusceptance: totalSusceptance,
    deviation,
  };
}
