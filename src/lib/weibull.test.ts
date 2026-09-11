import { describe, expect, it } from 'vitest';
import {
  fitWeibull,
  logGamma,
  weibullBLife,
  weibullReliability,
  weibullUnreliability,
} from './weibull';

describe('logGamma', () => {
  it('matches the known values of the log gamma function', () => {
    expect(logGamma(1)).toBeCloseTo(0, 12);
    expect(logGamma(2)).toBeCloseTo(0, 12);
    expect(logGamma(0.5)).toBeCloseTo(0.5723649429247004, 12);
    expect(logGamma(2.5)).toBeCloseTo(0.2846828704729196, 12);
    expect(logGamma(5.5)).toBeCloseTo(3.9578139676187165, 12);
    expect(logGamma(12.3)).toBeCloseTo(18.238983407092245, 11);
  });

  it('uses the reflection formula below one half', () => {
    // Gamma(0.25) = 3.6256..., so logGamma(0.25) = 1.28802...
    expect(logGamma(0.25)).toBeCloseTo(1.2880225246980774, 10);
    expect(logGamma(1.5)).toBeCloseTo(Math.log(0.886226925452758), 12);
  });
});

describe('Weibull fit', () => {
  const times = [50, 100, 150, 200, 250, 300];

  it('fits shape, scale and life points by median rank', () => {
    const fit = fitWeibull(times);
    expect(fit.count).toBe(6);
    expect(fit.beta).toBeCloseTo(1.5899607820568074, 10);
    expect(fit.etaHours).toBeCloseTo(205.0801711592186, 8);
    expect(fit.rSquared).toBeCloseTo(0.9878349430593678, 10);
    expect(fit.b1Hours).toBeCloseTo(11.360631529932956, 8);
    expect(fit.b10Hours).toBeCloseTo(49.80128107183111, 8);
    expect(fit.b50Hours).toBeCloseTo(162.85887445899598, 8);
    expect(fit.mtbfHours).toBeCloseTo(183.97771770935157, 8);
  });

  it('is order independent', () => {
    const shuffled = [...times].reverse();
    expect(fitWeibull(shuffled).beta).toBeCloseTo(fitWeibull(times).beta, 12);
  });

  it('converts between reliability, unreliability and B life', () => {
    const fit = fitWeibull(times);
    expect(weibullReliability(200, fit.beta, fit.etaHours)).toBeCloseTo(0.3825473457929366, 10);
    expect(weibullUnreliability(200, fit.beta, fit.etaHours)).toBeCloseTo(
      1 - 0.3825473457929366,
      10,
    );
    expect(weibullBLife(0.1, fit.beta, fit.etaHours)).toBeCloseTo(fit.b10Hours, 10);
    expect(weibullReliability(fit.b50Hours, fit.beta, fit.etaHours)).toBeCloseTo(0.5, 10);
  });

  it('rejects too few, repeated or non-positive times', () => {
    expect(() => fitWeibull([10, 20])).toThrow(/at least 3 distinct/);
    expect(() => fitWeibull([10, 10, 10])).toThrow(/at least 3 distinct/);
    expect(() => fitWeibull([0, 10, 20, 30])).toThrow(/greater than 0/);
    expect(() => fitWeibull([])).toThrow(/at least three/);
  });

  it('rejects an impossible B life fraction', () => {
    expect(() => weibullBLife(0, 2, 100)).toThrow(/greater than 0/);
    expect(() => weibullBLife(1, 2, 100)).toThrow(/less than 1/);
  });
});
