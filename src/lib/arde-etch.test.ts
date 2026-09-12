import { describe, expect, it } from 'vitest';
import {
  calculateArdeEtchRate,
  calculateMicroloading,
  calculateEtchSelectivity,
} from './arde-etch';

describe('ARDE / RIE Lag Rate Calculation', () => {
  describe('zero aspect ratio condition', () => {
    it('returns nominal rate and lag ratio = 1 when depth is 0 (Coburn-Winter)', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 600,
        depth: 0,
        cd: 100,
        model: 'coburn-winter',
      });
      expect(result.aspectRatio).toBe(0);
      expect(result.etchRate).toBe(600);
      expect(result.lagRatio).toBe(1);
      expect(result.percentageReduction).toBe(0);
      expect(result.model).toBe('coburn-winter');
    });

    it('returns nominal rate and lag ratio = 1 when depth is 0 (Exponential)', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 500,
        depth: 0,
        cd: 50,
        model: 'exponential',
        alpha: 0.15,
      });
      expect(result.aspectRatio).toBe(0);
      expect(result.etchRate).toBe(500);
      expect(result.lagRatio).toBe(1);
      expect(result.percentageReduction).toBe(0);
    });
  });

  describe('Coburn-Winter model calculation', () => {
    it('accurately predicts etch rate using R(AR) = R_0 / (1 + k * AR)', () => {
      // depth = 1000 nm, cd = 100 nm => AR = 10
      // k = 0.1 => 1 + k * AR = 1 + 1 = 2
      // R_0 = 500 nm/min => R(AR) = 250 nm/min, lagRatio = 0.5
      const result = calculateArdeEtchRate({
        nominalRate: 500,
        depth: 1000,
        cd: 100,
        model: 'coburn-winter',
        k: 0.1,
      });
      expect(result.aspectRatio).toBe(10);
      expect(result.etchRate).toBeCloseTo(250, 4);
      expect(result.lagRatio).toBeCloseTo(0.5, 4);
      expect(result.percentageReduction).toBeCloseTo(50, 4);
      expect(result.coefficient).toBe(0.1);
    });

    it('defaults model to coburn-winter and coefficient to 0.1 when omitted', () => {
      // depth = 400, cd = 200 => AR = 2
      // 1 + 0.1 * 2 = 1.2
      // 600 / 1.2 = 500
      const result = calculateArdeEtchRate({
        nominalRate: 600,
        depth: 400,
        cd: 200,
      });
      expect(result.model).toBe('coburn-winter');
      expect(result.coefficient).toBe(0.1);
      expect(result.aspectRatio).toBe(2);
      expect(result.etchRate).toBeCloseTo(500, 4);
      expect(result.lagRatio).toBeCloseTo(500 / 600, 4);
    });
  });

  describe('Exponential model calculation', () => {
    it('accurately predicts etch rate using R(AR) = R_0 * exp(-alpha * AR)', () => {
      // depth = 500, cd = 100 => AR = 5
      // alpha = 0.1 => exp(-0.5) = 0.60653066
      // R_0 = 1000 => R(AR) = 606.53066
      const result = calculateArdeEtchRate({
        nominalRate: 1000,
        depth: 500,
        cd: 100,
        model: 'exponential',
        alpha: 0.1,
      });
      expect(result.aspectRatio).toBe(5);
      const expectedRatio = Math.exp(-0.5);
      expect(result.lagRatio).toBeCloseTo(expectedRatio, 5);
      expect(result.etchRate).toBeCloseTo(1000 * expectedRatio, 4);
      expect(result.percentageReduction).toBeCloseTo((1 - expectedRatio) * 100, 4);
    });
  });

  describe('high aspect ratio behavior', () => {
    it('approaches zero monotonically for deep, narrow structures (AR = 100)', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 800,
        depth: 5000,
        cd: 50, // AR = 100
        model: 'coburn-winter',
        k: 0.15,
      });
      expect(result.aspectRatio).toBe(100);
      // 1 + 0.15 * 100 = 16
      // 800 / 16 = 50 nm/min
      expect(result.etchRate).toBeCloseTo(50, 4);
      expect(result.lagRatio).toBeCloseTo(1 / 16, 5);
      expect(result.percentageReduction).toBeCloseTo((15 / 16) * 100, 4);
    });

    it('remains strictly positive and finite for extreme aspect ratios (AR = 500)', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 1000,
        depth: 50000,
        cd: 100, // AR = 500
        model: 'exponential',
        modelCoefficient: 0.02,
      });
      expect(result.aspectRatio).toBe(500);
      expect(result.etchRate).toBeGreaterThan(0);
      expect(Number.isFinite(result.etchRate)).toBe(true);
      expect(result.etchRate).toBeCloseTo(1000 * Math.exp(-10), 4);
    });
  });

  describe('edge conditions', () => {
    it('returns zero etch rate when nominal rate is 0', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 0,
        depth: 200,
        cd: 50,
      });
      expect(result.etchRate).toBe(0);
      expect(result.lagRatio).toBeCloseTo(1 / (1 + 0.1 * 4), 4);
    });

    it('returns nominal rate when attenuation coefficient is 0', () => {
      const result = calculateArdeEtchRate({
        nominalRate: 450,
        depth: 2000,
        cd: 100,
        modelCoefficient: 0,
      });
      expect(result.etchRate).toBe(450);
      expect(result.lagRatio).toBe(1);
    });
  });

  describe('input guards and validations', () => {
    it('throws RangeError when nominalRate is negative', () => {
      expect(() =>
        calculateArdeEtchRate({
          nominalRate: -10,
          depth: 100,
          cd: 50,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError when depth is negative', () => {
      expect(() =>
        calculateArdeEtchRate({
          nominalRate: 500,
          depth: -5,
          cd: 50,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError when cd is zero or negative', () => {
      expect(() =>
        calculateArdeEtchRate({
          nominalRate: 500,
          depth: 100,
          cd: 0,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateArdeEtchRate({
          nominalRate: 500,
          depth: 100,
          cd: -20,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError when coefficient is negative', () => {
      expect(() =>
        calculateArdeEtchRate({
          nominalRate: 500,
          depth: 100,
          cd: 50,
          modelCoefficient: -0.1,
        })
      ).toThrow(RangeError);
    });

    it('throws TypeError when model name is invalid', () => {
      expect(() =>
        calculateArdeEtchRate({
          nominalRate: 500,
          depth: 100,
          cd: 50,
          model: 'polynomial' as unknown as 'exponential',
        })
      ).toThrow(TypeError);
    });
  });
});

describe('Microloading Ratio Calculation', () => {
  it('predicts correct microloading ratio for intermediate pattern density', () => {
    // rho = 0.5, eta = 0.4 => 1 / (1 + 0.4 * 0.5) = 1 / 1.2 = 0.83333
    const result = calculateMicroloading({
      patternDensity: 0.5,
      neutralDepletionCoeff: 0.4,
    });
    expect(result.patternDensity).toBe(0.5);
    expect(result.neutralDepletionCoeff).toBe(0.4);
    expect(result.microloadingRatio).toBeCloseTo(1 / 1.2, 5);
    expect(result.loadingDepletionPercent).toBeCloseTo((1 - 1 / 1.2) * 100, 4);
    expect(result.denseEtchRate).toBeUndefined();
  });

  it('calculates dense pattern etch rate when isolatedEtchRate is provided', () => {
    // R_iso = 600 nm/min, rho = 0.25, eta = 1.0 => ratio = 1 / (1 + 0.25) = 0.8
    // R_dense = 600 * 0.8 = 480 nm/min
    const result = calculateMicroloading({
      patternDensity: 0.25,
      neutralDepletionCoeff: 1.0,
      isolatedEtchRate: 600,
    });
    expect(result.microloadingRatio).toBeCloseTo(0.8, 5);
    expect(result.denseEtchRate).toBeCloseTo(480, 4);
    expect(result.loadingDepletionPercent).toBeCloseTo(20, 4);
  });

  it('returns ratio = 1 for isolated limit (patternDensity = 0)', () => {
    const result = calculateMicroloading({
      patternDensity: 0,
      neutralDepletionCoeff: 2.5,
      isolatedEtchRate: 400,
    });
    expect(result.microloadingRatio).toBe(1);
    expect(result.denseEtchRate).toBe(400);
    expect(result.loadingDepletionPercent).toBe(0);
  });

  it('returns maximum depletion for fully dense pattern (patternDensity = 1)', () => {
    const result = calculateMicroloading({
      patternDensity: 1.0,
      neutralDepletionCoeff: 1.5,
    });
    expect(result.microloadingRatio).toBeCloseTo(1 / 2.5, 5);
    expect(result.loadingDepletionPercent).toBeCloseTo(60, 4);
  });

  it('returns ratio = 1 when neutral depletion coefficient is 0 (unlimited reactant supply)', () => {
    const result = calculateMicroloading({
      patternDensity: 0.8,
      neutralDepletionCoeff: 0,
      isolatedEtchRate: 350,
    });
    expect(result.microloadingRatio).toBe(1);
    expect(result.denseEtchRate).toBe(350);
  });

  describe('microloading validations', () => {
    it('throws RangeError for invalid pattern densities outside [0, 1]', () => {
      expect(() =>
        calculateMicroloading({
          patternDensity: -0.1,
          neutralDepletionCoeff: 0.5,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateMicroloading({
          patternDensity: 1.05,
          neutralDepletionCoeff: 0.5,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative neutral depletion coefficient', () => {
      expect(() =>
        calculateMicroloading({
          patternDensity: 0.3,
          neutralDepletionCoeff: -0.2,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative isolated etch rate', () => {
      expect(() =>
        calculateMicroloading({
          patternDensity: 0.3,
          neutralDepletionCoeff: 0.2,
          isolatedEtchRate: -100,
        })
      ).toThrow(RangeError);
    });
  });
});

describe('Etch Selectivity and Profile Taper Angle', () => {
  it('calculates selectivity and resulting taper angle for high selectivity process', () => {
    // targetRate = 600 nm/min, maskRate = 30 nm/min => S = 20
    // tan(profile) = 20 => profile = atan(20) * 180 / pi = 87.1376 deg
    // taper angle = 90 - 87.1376 = 2.8624 deg
    const result = calculateEtchSelectivity({
      targetEtchRate: 600,
      maskEtchRate: 30,
      overetchPercent: 15,
    });
    expect(result.selectivity).toBeCloseTo(20, 4);
    const expectedProfile = (Math.atan(20) * 180) / Math.PI;
    expect(result.profileAngleDeg).toBeCloseTo(expectedProfile, 3);
    expect(result.taperAngleDeg).toBeCloseTo(90 - expectedProfile, 3);
    expect(result.overetchFactor).toBeCloseTo(1.15, 4);
    expect(result.requiredMaskRatio).toBeCloseTo(1.15 / 20, 5);
  });

  it('handles 1:1 selectivity yielding 45 degree taper angle', () => {
    const result = calculateEtchSelectivity({
      targetEtchRate: 300,
      maskEtchRate: 300,
      overetchPercent: 0,
    });
    expect(result.selectivity).toBe(1);
    expect(result.profileAngleDeg).toBeCloseTo(45, 4);
    expect(result.taperAngleDeg).toBeCloseTo(45, 4);
    expect(result.requiredMaskRatio).toBe(1);
  });

  it('handles infinite selectivity when mask etch rate is 0', () => {
    const result = calculateEtchSelectivity({
      targetEtchRate: 500,
      maskEtchRate: 0,
      overetchPercent: 20,
    });
    expect(result.selectivity).toBe(Infinity);
    expect(result.profileAngleDeg).toBe(90);
    expect(result.taperAngleDeg).toBe(0);
    expect(result.requiredMaskRatio).toBe(0);
  });

  it('evaluates mask consumption, nominal etch time, and mask sufficiency', () => {
    // targetRate = 400 nm/min, maskRate = 40 nm/min => S = 10
    // overetch = 20% => overetchFactor = 1.2
    // targetThickness = 800 nm
    // nominalTimeSec = (800 / 400) * 60 = 120 s
    // totalTimeSec = 120 * 1.2 = 144 s
    // maskLoss = 800 * (1.2 / 10) = 96 nm
    const sufficient = calculateEtchSelectivity({
      targetEtchRate: 400,
      maskEtchRate: 40,
      overetchPercent: 20,
      targetThickness: 800,
      maskThickness: 150,
    });
    expect(sufficient.nominalTimeSec).toBe(120);
    expect(sufficient.totalTimeSec).toBe(144);
    expect(sufficient.maskLoss).toBeCloseTo(96, 4);
    expect(sufficient.remainingMaskThickness).toBeCloseTo(54, 4);
    expect(sufficient.isMaskSufficient).toBe(true);

    const insufficient = calculateEtchSelectivity({
      targetEtchRate: 400,
      maskEtchRate: 40,
      overetchPercent: 20,
      targetThickness: 800,
      maskThickness: 80,
    });
    expect(insufficient.remainingMaskThickness).toBeCloseTo(-16, 4);
    expect(insufficient.isMaskSufficient).toBe(false);
  });

  it('transfers initial sloped mask profile angle into substrate', () => {
    // initial mask angle = 80 deg
    // S = 10 => tan(theta) = 10 * tan(80 deg) = 10 * 5.67128 = 56.7128
    // profile angle = atan(56.7128) = 88.99 deg
    const result = calculateEtchSelectivity({
      targetEtchRate: 500,
      maskEtchRate: 50,
      overetchPercent: 10,
      initialMaskAngleDeg: 80,
    });
    const expectedProfile =
      (Math.atan(10 * Math.tan((80 * Math.PI) / 180)) * 180) / Math.PI;
    expect(result.profileAngleDeg).toBeCloseTo(expectedProfile, 3);
    expect(result.taperAngleDeg).toBeCloseTo(90 - expectedProfile, 3);
  });

  describe('selectivity validations', () => {
    it('throws RangeError for invalid targetEtchRate (<= 0)', () => {
      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: 0,
          maskEtchRate: 50,
          overetchPercent: 10,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: -100,
          maskEtchRate: 50,
          overetchPercent: 10,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative maskEtchRate', () => {
      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: 500,
          maskEtchRate: -10,
          overetchPercent: 10,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for negative overetchPercent', () => {
      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: 500,
          maskEtchRate: 50,
          overetchPercent: -5,
        })
      ).toThrow(RangeError);
    });

    it('throws RangeError for invalid initial mask angle', () => {
      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: 500,
          maskEtchRate: 50,
          overetchPercent: 10,
          initialMaskAngleDeg: 0,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateEtchSelectivity({
          targetEtchRate: 500,
          maskEtchRate: 50,
          overetchPercent: 10,
          initialMaskAngleDeg: 95,
        })
      ).toThrow(RangeError);
    });
  });
});
