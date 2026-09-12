import { describe, expect, it } from 'vitest';
import {
  calculateCmpEndpoint,
  calculateOpticalOscillationPeriod,
  calculateOpticalEndpoint,
  calculatePadLife,
} from './cmp-endpoint';

describe('CMP Motor Current Endpoint Detection', () => {
  it('calculates interface time, overpolish duration, and total cycle time', () => {
    // filmThickness = 600 nm, removalRate = 300 nm/min
    // timeToInterface = (600 / 300) * 60 = 120 s (2.0 min)
    // underlayerDelaySec = 5 s
    // detectedEndpointTime = 120 + 5 = 125 s
    // overpolishPercent = 10% => overpolishDuration = 120 * 0.1 = 12 s
    // totalTime = 120 + 5 + 12 = 137 s (2.2833 min)
    const result = calculateCmpEndpoint({
      filmThickness: 600,
      removalRate: 300,
      underlayerDelaySec: 5,
      overpolishPercent: 10,
    });

    expect(result.timeToInterfaceSec).toBe(120);
    expect(result.timeToInterfaceMin).toBe(2);
    expect(result.underlayerDelaySec).toBe(5);
    expect(result.detectedEndpointTimeSec).toBe(125);
    expect(result.overpolishDurationSec).toBe(12);
    expect(result.totalTimeSec).toBe(137);
    expect(result.totalTimeMin).toBeCloseTo(137 / 60, 4);
    expect(result.filmThicknessNm).toBe(600);
    expect(result.overpolishThicknessRemovedNm).toBeCloseTo((300 / 60) * 12, 4); // 60 nm
    expect(result.totalThicknessRemovedNm).toBeCloseTo(600 + (300 / 60) * 17, 4); // 685 nm
  });

  it('handles zero underlayer delay and zero overpolish', () => {
    const result = calculateCmpEndpoint({
      filmThickness: 450,
      removalRate: 150,
      underlayerDelaySec: 0,
      overpolishPercent: 0,
    });

    expect(result.timeToInterfaceSec).toBe(180);
    expect(result.timeToInterfaceMin).toBe(3);
    expect(result.detectedEndpointTimeSec).toBe(180);
    expect(result.overpolishDurationSec).toBe(0);
    expect(result.totalTimeSec).toBe(180);
    expect(result.overpolishThicknessRemovedNm).toBe(0);
    expect(result.totalThicknessRemovedNm).toBe(450);
  });

  describe('motor current endpoint validations', () => {
    it('throws RangeError for non-positive filmThickness', () => {
      expect(() =>
        calculateCmpEndpoint({
          filmThickness: 0,
          removalRate: 300,
          underlayerDelaySec: 5,
          overpolishPercent: 10,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateCmpEndpoint({
          filmThickness: -500,
          removalRate: 300,
          underlayerDelaySec: 5,
          overpolishPercent: 10,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for non-positive removalRate', () => {
      expect(() =>
        calculateCmpEndpoint({
          filmThickness: 500,
          removalRate: 0,
          underlayerDelaySec: 5,
          overpolishPercent: 10,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateCmpEndpoint({
          filmThickness: 500,
          removalRate: -250,
          underlayerDelaySec: 5,
          overpolishPercent: 10,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative underlayerDelaySec', () => {
      expect(() =>
        calculateCmpEndpoint({
          filmThickness: 500,
          removalRate: 250,
          underlayerDelaySec: -2,
          overpolishPercent: 10,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative overpolishPercent', () => {
      expect(() =>
        calculateCmpEndpoint({
          filmThickness: 500,
          removalRate: 250,
          underlayerDelaySec: 5,
          overpolishPercent: -10,
        })
      ).toThrow(RangeError);
    });
  });
});

describe('Optical Reflection Interference Oscillation Period', () => {
  it('calculates oscillation period T = lambda / (2 * n * RR)', () => {
    // lambda = 632.8 nm (He-Ne laser)
    // n = 1.46 (SiO2)
    // RR = 300 nm/min
    // delta_d = 632.8 / (2 * 1.46) = 216.7123 nm
    // periodMin = 216.7123 / 300 = 0.722374 min
    // periodSec = 0.722374 * 60 = 43.34247 s
    // frequency = 1 / 43.34247 = 0.02307 Hz
    const result = calculateOpticalOscillationPeriod({
      wavelengthNm: 632.8,
      refractiveIndex: 1.46,
      removalRateNmPerMin: 300,
    });

    expect(result.wavelengthNm).toBe(632.8);
    expect(result.refractiveIndex).toBe(1.46);
    expect(result.removalRateNmPerMin).toBe(300);
    expect(result.thicknessPerCycleNm).toBeCloseTo(632.8 / (2 * 1.46), 4);
    expect(result.oscillationPeriodMin).toBeCloseTo((632.8 / (2 * 1.46)) / 300, 5);
    expect(result.oscillationPeriodSec).toBeCloseTo(((632.8 / (2 * 1.46)) / 300) * 60, 4);
    expect(result.oscillationFrequencyHz).toBeCloseTo(1 / result.oscillationPeriodSec, 5);
  });

  it('supports alternative option aliases (lambda, n, removalRate) and calculateOpticalEndpoint alias', () => {
    const result = calculateOpticalEndpoint({
      lambda: 670,
      n: 2.0,
      removalRate: 200,
    });

    // delta_d = 670 / (2 * 2.0) = 167.5 nm
    // periodSec = (167.5 / 200) * 60 = 50.25 s
    expect(result.thicknessPerCycleNm).toBe(167.5);
    expect(result.oscillationPeriodSec).toBe(50.25);
    expect(result.oscillationPeriodMin).toBeCloseTo(167.5 / 200, 4);
  });

  it('calculates expected fringe count when filmThickness is provided', () => {
    // lambda = 600 nm, n = 1.5 => delta_d = 600 / 3 = 200 nm
    // thickness = 1000 nm => fringes = 1000 / 200 = 5 fringes
    const result = calculateOpticalOscillationPeriod({
      wavelengthNm: 600,
      refractiveIndex: 1.5,
      removalRateNmPerMin: 400,
      filmThickness: 1000,
    });

    expect(result.thicknessPerCycleNm).toBe(200);
    expect(result.expectedFringes).toBe(5);
  });

  describe('optical reflection endpoint validations', () => {
    it('throws RangeError for missing or invalid wavelength', () => {
      expect(() =>
        calculateOpticalOscillationPeriod({
          wavelengthNm: 0,
          refractiveIndex: 1.46,
          removalRateNmPerMin: 300,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateOpticalOscillationPeriod({
          wavelengthNm: -632.8,
          refractiveIndex: 1.46,
          removalRateNmPerMin: 300,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for refractive index < 1', () => {
      expect(() =>
        calculateOpticalOscillationPeriod({
          wavelengthNm: 632.8,
          refractiveIndex: 0.9,
          removalRateNmPerMin: 300,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for non-positive removalRate', () => {
      expect(() =>
        calculateOpticalOscillationPeriod({
          wavelengthNm: 632.8,
          refractiveIndex: 1.46,
          removalRateNmPerMin: 0,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for non-positive filmThickness', () => {
      expect(() =>
        calculateOpticalOscillationPeriod({
          wavelengthNm: 632.8,
          refractiveIndex: 1.46,
          removalRateNmPerMin: 300,
          filmThickness: -50,
        })
      ).toThrow(RangeError);
    });
  });
});

describe('CMP Pad Life and Diamond Conditioning Model', () => {
  it('calculates pad wear rate, remaining groove depth, and remaining wafers', () => {
    // conditioningCutRate = 15 um/hr
    // default 60 sec/wafer => 60/3600 = 1/60 hr/wafer
    // padWearRate = 15 / 60 = 0.25 um/wafer
    // initial groove = 1.2 mm (1200 um), min allowed = 0.3 mm (300 um)
    // usable groove = 0.9 mm (900 um)
    // maxWafersByGroove = 900 / 0.25 = 3600 wafers
    // maxPadLifeWafers = 1000 wafers
    // currentWafers = 400 wafers
    // totalWear = 400 * 0.25 = 100 um = 0.1 mm
    // currentGrooveDepthMm = 1.2 - 0.1 = 1.1 mm
    // grooveDepthRemainingMm = 1.1 - 0.3 = 0.8 mm
    // remainingWafersByGroove = (0.8 * 1000) / 0.25 = 3200 wafers
    // remainingWafersByCount = 1000 - 400 = 600 wafers
    // effective remainingWafers = 600
    // limitingFactor = 'wafer_count'
    const result = calculatePadLife({
      currentWafers: 400,
      maxPadLifeWafers: 1000,
      conditioningCutRateUmPerHour: 15,
      initialPadGrooveDepthMm: 1.2,
      minAllowedGrooveDepthMm: 0.3,
    });

    expect(result.currentWafers).toBe(400);
    expect(result.padWearRateUmPerWafer).toBe(0.25);
    expect(result.padWearRateMmPer1000Wafers).toBe(0.25);
    expect(result.totalPadWearUm).toBe(100);
    expect(result.totalPadWearMm).toBe(0.1);
    expect(result.currentGrooveDepthMm).toBeCloseTo(1.1, 4);
    expect(result.grooveDepthRemainingMm).toBeCloseTo(0.8, 4);
    expect(result.maxWafersByGroove).toBe(3600);
    expect(result.remainingWafersByGroove).toBe(3200);
    expect(result.remainingWafersByCount).toBe(600);
    expect(result.remainingWafers).toBe(600);
    expect(result.limitingFactor).toBe('wafer_count');
    expect(result.percentLifeUsed).toBe(40);
    expect(result.percentLifeRemaining).toBe(60);
    expect(result.isExpired).toBe(false);
  });

  it('identifies groove wear as limiting factor when cut rate is aggressive', () => {
    // conditioningCutRate = 60 um/hr => 1 um/wafer
    // usable groove = 1.0 mm - 0.4 mm = 0.6 mm (600 um)
    // maxWafersByGroove = 600 wafers
    // maxPadLifeWafers = 1200 wafers
    // limitingFactor should be 'groove_wear'
    const result = calculatePadLife({
      currentWafers: 100,
      maxPadLifeWafers: 1200,
      conditioningCutRateUmPerHour: 60,
      initialPadGrooveDepthMm: 1.0,
      minAllowedGrooveDepthMm: 0.4,
    });

    expect(result.padWearRateUmPerWafer).toBe(1.0);
    expect(result.maxWafersByGroove).toBe(600);
    expect(result.limitingFactor).toBe('groove_wear');
    expect(result.remainingWafersByGroove).toBe(500);
    expect(result.remainingWafers).toBe(500);
    expect(result.percentLifeUsed).toBeCloseTo((100 / 600) * 100, 2);
  });

  it('marks pad as expired when current wafers reach or exceed limit', () => {
    const result = calculatePadLife({
      currentWafers: 1200,
      maxPadLifeWafers: 1200,
      conditioningCutRateUmPerHour: 15,
      initialPadGrooveDepthMm: 1.2,
      minAllowedGrooveDepthMm: 0.3,
    });

    expect(result.isExpired).toBe(true);
    expect(result.remainingWafers).toBe(0);
    expect(result.percentLifeUsed).toBe(100);
    expect(result.percentLifeRemaining).toBe(0);
  });

  it('marks pad as expired when groove depth reaches minimum allowed', () => {
    // initial = 0.5, min = 0.3, usable = 0.2 mm = 200 um
    // cutRate = 60 um/hr = 1 um/wafer
    // at 200 wafers, wear is 200 um => groove depth = 0.3 mm = min
    const result = calculatePadLife({
      currentWafers: 200,
      maxPadLifeWafers: 2000,
      conditioningCutRateUmPerHour: 60,
      initialPadGrooveDepthMm: 0.5,
      minAllowedGrooveDepthMm: 0.3,
    });

    expect(result.currentGrooveDepthMm).toBe(0.3);
    expect(result.grooveDepthRemainingMm).toBe(0);
    expect(result.remainingWafersByGroove).toBe(0);
    expect(result.remainingWafers).toBe(0);
    expect(result.isExpired).toBe(true);
  });

  it('respects custom conditioningSecPerWafer', () => {
    // conditioningSecPerWafer = 90 s = 1.5 min = 1/40 hr
    // cutRate = 20 um/hr => 20 * (90/3600) = 0.5 um/wafer
    const result = calculatePadLife({
      currentWafers: 100,
      maxPadLifeWafers: 800,
      conditioningCutRateUmPerHour: 20,
      initialPadGrooveDepthMm: 1.5,
      minAllowedGrooveDepthMm: 0.5,
      conditioningSecPerWafer: 90,
    });

    expect(result.padWearRateUmPerWafer).toBe(0.5);
    expect(result.totalPadWearUm).toBe(50);
  });

  describe('pad life boundary & input validations', () => {
    it('throws RangeError for negative currentWafers', () => {
      expect(() =>
        calculatePadLife({
          currentWafers: -1,
          maxPadLifeWafers: 1000,
          conditioningCutRateUmPerHour: 15,
          initialPadGrooveDepthMm: 1.2,
          minAllowedGrooveDepthMm: 0.3,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for non-positive maxPadLifeWafers', () => {
      expect(() =>
        calculatePadLife({
          currentWafers: 0,
          maxPadLifeWafers: 0,
          conditioningCutRateUmPerHour: 15,
          initialPadGrooveDepthMm: 1.2,
          minAllowedGrooveDepthMm: 0.3,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative conditioningCutRateUmPerHour', () => {
      expect(() =>
        calculatePadLife({
          currentWafers: 0,
          maxPadLifeWafers: 1000,
          conditioningCutRateUmPerHour: -5,
          initialPadGrooveDepthMm: 1.2,
          minAllowedGrooveDepthMm: 0.3,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError when initialPadGrooveDepthMm <= minAllowedGrooveDepthMm', () => {
      expect(() =>
        calculatePadLife({
          currentWafers: 0,
          maxPadLifeWafers: 1000,
          conditioningCutRateUmPerHour: 15,
          initialPadGrooveDepthMm: 0.3,
          minAllowedGrooveDepthMm: 0.3,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculatePadLife({
          currentWafers: 0,
          maxPadLifeWafers: 1000,
          conditioningCutRateUmPerHour: 15,
          initialPadGrooveDepthMm: 0.2,
          minAllowedGrooveDepthMm: 0.5,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for non-positive conditioningSecPerWafer', () => {
      expect(() =>
        calculatePadLife({
          currentWafers: 0,
          maxPadLifeWafers: 1000,
          conditioningCutRateUmPerHour: 15,
          initialPadGrooveDepthMm: 1.2,
          minAllowedGrooveDepthMm: 0.3,
          conditioningSecPerWafer: 0,
        })
      ).toThrow(RangeError);
    });
  });
});
