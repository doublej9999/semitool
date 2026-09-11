
import { describe, expect, it } from 'vitest';
import {
  POWER_LABELS,
  POWER_UNITS,
  belowZeroPower,
  convertPower,
  isLogarithmicPowerUnit,
  voltsRmsFromWatts,
  vrmsToVpp,
  vrmsToVpeak,
  wattsFrom,
  wattsFromVoltsRms,
  wattsToDbm,
  wattsToDbw,
} from './power';

describe('power units', () => {
  it('labels every unit', () => {
    expect(POWER_UNITS).toHaveLength(10);
    for (const unit of POWER_UNITS) expect(POWER_LABELS[unit]).toBeTruthy();
  });

  it('converts linearly between the mechanical and electrical units', () => {
    const oneHp = convertPower(1, 'hp');
    expect(oneHp.W).toBeCloseTo(745.6998715822702, 9);
    expect(convertPower(1, 'kW').W).toBeCloseTo(1000, 9);
    expect(convertPower(1, 'mW').mW).toBeCloseTo(1, 12);
    expect(convertPower(1, 'W').btu_h).toBeCloseTo(3.412141633127942, 9);
    expect(convertPower(1, 'W').cal_s).toBeCloseTo(0.2390057361376673, 9);
    expect(convertPower(1, 'W').ftlb_s).toBeCloseTo(0.7375621492772654, 9);
  });

  it('pins the decibel references', () => {
    expect(wattsFrom(0, 'dBm')).toBeCloseTo(1e-3, 12);
    expect(wattsFrom(30, 'dBm')).toBeCloseTo(1, 12);
    expect(wattsFrom(0, 'dBW')).toBeCloseTo(1, 12);
    expect(wattsToDbm(1)).toBeCloseTo(30, 9);
    expect(wattsToDbw(1)).toBeCloseTo(0, 9);
    expect(convertPower(1, 'W').dBm).toBeCloseTo(30, 9);
    expect(convertPower(1, 'W').dBW).toBeCloseTo(0, 9);
    expect(convertPower(0, 'dBm').W).toBeCloseTo(1e-3, 12);
  });

  it('has no finite decibel value at zero or negative power', () => {
    expect(Number.isFinite(wattsToDbm(0))).toBe(false);
    expect(Number.isFinite(wattsToDbw(0))).toBe(false);
    expect(Number.isFinite(convertPower(0, 'W').dBm)).toBe(false);
    // A negative linear reading is not physical; decibel readings may be negative.
    expect(belowZeroPower(-1, 'W')).toBe(true);
    expect(belowZeroPower(-1, 'dBm')).toBe(false);
    expect(isLogarithmicPowerUnit('dBm')).toBe(true);
    expect(isLogarithmicPowerUnit('mW')).toBe(false);
  });

  it('relates power, RMS voltage and impedance', () => {
    // 0 dBm into 50 ohm is 0.2236 V RMS and 0.6325 V peak to peak.
    const volts = voltsRmsFromWatts(1e-3, 50);
    expect(volts).toBeCloseTo(0.22360679774997896, 12);
    expect(vrmsToVpp(volts)).toBeCloseTo(0.6324555320336759, 12);
    expect(vrmsToVpeak(volts)).toBeCloseTo(0.31622776601683794, 12);
    // 1 W into 50 ohm is 7.071 V RMS, and it round trips.
    expect(voltsRmsFromWatts(1, 50)).toBeCloseTo(7.0710678118654755, 12);
    expect(wattsFromVoltsRms(7.0710678118654755, 50)).toBeCloseTo(1, 12);
  });
});
