
import { describe, expect, it } from 'vitest';
import {
  SECONDS_PER_UNIT,
  TIME_LABELS,
  TIME_UNITS,
  convertTime,
  cornerFrequencyHz,
  frequencyHzFromPeriod,
  riseTime10to90Seconds,
  settleToPointOnePercentSeconds,
  settleToOnePercentSeconds,
  timeConstantSeconds,
} from './time';

describe('time units and the time constant', () => {
  it('labels every unit and uses exact factors', () => {
    expect(TIME_UNITS).toHaveLength(8);
    for (const unit of TIME_UNITS) expect(TIME_LABELS[unit]).toBeTruthy();
    expect(SECONDS_PER_UNIT.min).toBe(60);
    expect(SECONDS_PER_UNIT.h).toBe(3600);
    expect(SECONDS_PER_UNIT.day).toBe(86400);
  });

  it('converts a microsecond everywhere', () => {
    const converted = convertTime(1, 'us');
    expect(converted.s).toBeCloseTo(1e-6, 15);
    expect(converted.ns).toBeCloseTo(1000, 9);
    expect(converted.ms).toBeCloseTo(1e-3, 12);
    expect(converted.ps).toBeCloseTo(1e6, 3);
  });

  it('multiplies R and C into tau', () => {
    expect(timeConstantSeconds(1e3, 1e-9)).toBeCloseTo(1e-6, 15);
    expect(timeConstantSeconds(50, 1e-12)).toBeCloseTo(5e-11, 18);
  });

  it('uses the exact ln factors for rise and settling', () => {
    const tau = 1e-6;
    expect(riseTime10to90Seconds(tau)).toBeCloseTo(2.1972245773362196e-6, 18);
    expect(settleToOnePercentSeconds(tau)).toBeCloseTo(4.605170185988092e-6, 18);
    expect(settleToPointOnePercentSeconds(tau)).toBeCloseTo(6.907755278982136e-6, 18);
  });

  it('puts the corner frequency at one over two pi tau', () => {
    expect(cornerFrequencyHz(1e-6)).toBeCloseTo(159154.94309189534, 6);
    expect(cornerFrequencyHz(5e-11)).toBeCloseTo(3183098861.8379064, 0);
    expect(frequencyHzFromPeriod(1e-6)).toBeCloseTo(1e6, 3);
  });
});
