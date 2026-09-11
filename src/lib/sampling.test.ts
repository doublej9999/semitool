import { describe, expect, it } from 'vitest';
import {
  acceptProbability,
  binomialAcceptProbability,
  hypergeometricAcceptProbability,
  logChoose,
  ocCurve,
  solveZeroAcceptSample,
} from './sampling';

describe('binomial acceptance probability', () => {
  it('matches the published values for a 50 piece sample', () => {
    expect(binomialAcceptProbability(50, 1, 0.01)).toBeCloseTo(0.9105646869039689, 12);
    expect(binomialAcceptProbability(50, 1, 0.05)).toBeCloseTo(0.27943175232069517, 12);
    expect(binomialAcceptProbability(50, 1, 0.1)).toBeCloseTo(0.03378585969243189, 12);
  });

  it('accepts everything when the acceptance number covers the whole sample', () => {
    expect(binomialAcceptProbability(10, 10, 0.9)).toBeCloseTo(1, 12);
  });

  it('falls as the defect fraction rises', () => {
    const low = binomialAcceptProbability(200, 3, 0.005);
    const high = binomialAcceptProbability(200, 3, 0.05);
    expect(low).toBeGreaterThan(high);
  });

  it('rejects a defect fraction outside 0 to 1 and a fractional sample', () => {
    expect(() => binomialAcceptProbability(50, 1, 1.5)).toThrow(/between 0 and 1/);
    expect(() => binomialAcceptProbability(50.5, 1, 0.01)).toThrow(/whole number/);
  });
});

describe('hypergeometric acceptance probability', () => {
  it('accounts for the finite lot once the sample is a large fraction', () => {
    expect(hypergeometricAcceptProbability(1000, 200, 3, 20)).toBeCloseTo(0.4096828886029871, 12);
    expect(hypergeometricAcceptProbability(200, 40, 1, 10)).toBeCloseTo(0.36960571275769327, 12);
  });

  it('pulls the tail in relative to the binomial, on both sides of the mean', () => {
    // Mean defectives in the sample is 4 for both distributions. A smaller
    // spread means less mass in the tail being integrated, so the acceptance
    // probability falls below the acceptance number and rises above it.
    const belowMean = hypergeometricAcceptProbability(1000, 200, 3, 20);
    expect(belowMean).toBeLessThan(binomialAcceptProbability(200, 3, 0.02));
    const aboveMean = hypergeometricAcceptProbability(1000, 200, 6, 20);
    expect(aboveMean).toBeGreaterThan(binomialAcceptProbability(200, 6, 0.02));
    expect(belowMean).toBeCloseTo(0.4096828886029871, 12);
    expect(aboveMean).toBeCloseTo(0.9154269158811363, 10);
  });

  it('rejects a sample larger than the lot', () => {
    expect(() => hypergeometricAcceptProbability(100, 200, 3, 5)).toThrow(/larger than the lot/);
    expect(() => hypergeometricAcceptProbability(100, 10, 3, 200)).toThrow(/more defectives/);
  });
});

describe('acceptProbability', () => {
  it('switches to the hypergeometric for a large sampling fraction', () => {
    const large = acceptProbability({ lotSize: 1000, sampleSize: 200, acceptNumber: 3 }, 0.02);
    expect(large.method).toBe('hypergeometric');
    expect(large.probability).toBeCloseTo(0.4096828886029871, 12);
    expect(large.defectivesInLot).toBe(20);
    expect(large.expectedDefectives).toBeCloseTo(4, 12);

    const small = acceptProbability({ lotSize: 1000, sampleSize: 50, acceptNumber: 1 }, 0.01);
    expect(small.method).toBe('binomial');
    expect(small.probability).toBeCloseTo(0.9105646869039689, 12);
  });

  it('uses the binomial when no lot size is given', () => {
    const result = acceptProbability({ lotSize: null, sampleSize: 50, acceptNumber: 1 }, 0.01);
    expect(result.method).toBe('binomial');
    expect(result.defectivesInLot).toBeNull();
  });
});

describe('zero acceptance sample size', () => {
  it('solves for the sample that reaches the consumer risk without a lot size', () => {
    const solved = solveZeroAcceptSample({ defectFraction: 0.05, consumerRisk: 0.1 });
    expect(solved.sampleSize).toBe(45);
    expect(solved.achievedProbability).toBeCloseTo(0.09944025698709225, 12);
  });

  it('solves against a finite lot too', () => {
    const solved = solveZeroAcceptSample({
      defectFraction: 0.05,
      consumerRisk: 0.1,
      lotSize: 500,
    });
    expect(solved.sampleSize).toBeGreaterThan(40);
    expect(solved.sampleSize).toBeLessThan(46);
    expect(solved.achievedProbability).toBeLessThanOrEqual(0.1);
  });

  it('rejects impossible risks', () => {
    expect(() => solveZeroAcceptSample({ defectFraction: 1, consumerRisk: 0.1 })).toThrow(
      /less than 1/,
    );
    expect(() => solveZeroAcceptSample({ defectFraction: 0.05, consumerRisk: 0 })).toThrow(
      /greater than 0/,
    );
  });
});

describe('operating characteristic curve', () => {
  it('returns a point per fraction and decreases', () => {
    const curve = ocCurve({ lotSize: null, sampleSize: 50, acceptNumber: 1 }, [0.005, 0.01, 0.05]);
    expect(curve).toHaveLength(3);
    expect(curve[0].probability).toBeGreaterThan(curve[1].probability);
    expect(curve[1].probability).toBeGreaterThan(curve[2].probability);
    expect(curve[1].defectFraction).toBe(0.01);
  });

  it('exposes the log binomial coefficient used by both distributions', () => {
    expect(logChoose(5, 2)).toBeCloseTo(Math.log(10), 12);
    expect(logChoose(5, 6)).toBe(Number.NEGATIVE_INFINITY);
  });
});
