import { describe, expect, it } from 'vitest';
import { estimateDies, generateWaferMap, usableRadius, validateWaferMapInputs } from './wafer';

describe('usableRadius', () => {
  it('subtracts the edge exclusion from the wafer radius', () => {
    expect(usableRadius(300, 3)).toBe(147);
    expect(usableRadius(200, 0)).toBe(100);
  });
});

describe('estimateDies validation', () => {
  it('rejects a die that cannot fit on the wafer', () => {
    const result = estimateDies(300, 400, 10, 0.1, 3);
    expect(result.errors.length).toBeGreaterThan(0);
    expect('estimatedUsable' in result).toBe(false);
  });

  it('rejects an edge exclusion that consumes the whole wafer', () => {
    expect(estimateDies(300, 10, 10, 0.1, 150).errors.length).toBeGreaterThan(0);
  });

  it('names the die inputs in the pitch error, not the raw pitch label', () => {
    const errors = estimateDies(300, 400, 10, 0.1, 3).errors;
    expect(errors.some((error) => error.startsWith('Die width plus street width'))).toBe(true);
  });

  it('never reports more than 100% area utilisation for a valid geometry', () => {
    const result = estimateDies(300, 10, 10, 0.1, 3);
    expect(result.errors).toEqual([]);
    if ('utilization' in result) {
      expect(result.estimatedUsable).toBe(665);
      expect(result.utilization).toBeLessThan(100);
    }
  });
});

describe('validateWaferMapInputs', () => {
  it('accepts a standard 300 mm configuration', () => {
    expect(validateWaferMapInputs({ diameter: 300, edgeExclusion: 3, dieWidth: 10, dieHeight: 10, pitchX: 10.1, pitchY: 10.1 })).toEqual([]);
  });

  it('rejects a pitch wider than the usable wafer diameter', () => {
    expect(validateWaferMapInputs({ diameter: 300, edgeExclusion: 3, dieWidth: 10, dieHeight: 10, pitchX: 400, pitchY: 10.1 }).length).toBeGreaterThan(0);
  });

  it('rejects a pitch smaller than the die', () => {
    const errors = validateWaferMapInputs({ diameter: 300, edgeExclusion: 3, dieWidth: 10, dieHeight: 10, pitchX: 9, pitchY: 10.1 });
    expect(errors.some((error) => error.includes('X pitch cannot be smaller'))).toBe(true);
  });

  it('rejects non physical numbers', () => {
    expect(validateWaferMapInputs({ diameter: 0, edgeExclusion: 3, dieWidth: 10, dieHeight: 10, pitchX: 10.1, pitchY: 10.1 }).length).toBeGreaterThan(0);
    expect(validateWaferMapInputs({ diameter: 300, edgeExclusion: -1, dieWidth: 10, dieHeight: 10, pitchX: 10.1, pitchY: 10.1 }).length).toBeGreaterThan(0);
  });
});

describe('generateWaferMap guards', () => {
  it('returns no dies for an impossible geometry instead of an empty-looking map', () => {
    expect(generateWaferMap(300, 3, 400, 400, 400.1, 400.1, 0, 0)).toEqual([]);
  });

  it('places dies whose centre is inside the effective radius', () => {
    const dies = generateWaferMap(300, 3, 10, 10, 10.1, 10.1, 0, 0);
    expect(dies.length).toBe(665);
    for (const die of dies) {
      expect(Math.hypot(die.centerX, die.centerY)).toBeLessThanOrEqual(147);
    }
  });
});
