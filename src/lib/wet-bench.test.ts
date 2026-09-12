import { describe, expect, it } from 'vitest';
import {
  calculateBathDegradation,
  calculateRcaParticleCleanEfficiency,
  calculateSpikeDosing,
  WET_BENCH_RECIPES,
} from './wet-bench';

describe('wet-bench library', () => {
  describe('WET_BENCH_RECIPES configuration', () => {
    it('defines standard recipes including SC-1, SC-2, SPM, BOE, and dHF', () => {
      expect(WET_BENCH_RECIPES['sc-1']).toBeDefined();
      expect(WET_BENCH_RECIPES['sc-2']).toBeDefined();
      expect(WET_BENCH_RECIPES.spm).toBeDefined();
      expect(WET_BENCH_RECIPES['boe-6-1']).toBeDefined();
      expect(WET_BENCH_RECIPES['boe-10-1']).toBeDefined();
      expect(WET_BENCH_RECIPES['dhf-50-1']).toBeDefined();
      expect(WET_BENCH_RECIPES['dhf-100-1']).toBeDefined();
    });

    it('contains positive default volume and valid concentration thresholds', () => {
      for (const recipe of Object.values(WET_BENCH_RECIPES)) {
        expect(recipe.defaultBathVolumeL).toBeGreaterThan(0);
        expect(recipe.defaultCurrentConc).toBeGreaterThan(0);
        expect(recipe.defaultTargetConc).toBeGreaterThan(recipe.defaultCurrentConc);
        expect(recipe.defaultSourceConc).toBeGreaterThan(recipe.defaultTargetConc);
        expect(recipe.defaultMaxLoadingGL).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateSpikeDosing', () => {
    it('calculates spike dosing according to formula V_spike = V_bath * (C_target - C_current) / (C_source - C_target)', () => {
      // V_bath = 20 L, C_curr = 2%, C_target = 4%, C_source = 20%
      // V_spike = 20 * (4 - 2) / (20 - 4) = 40 / 16 = 2.5 L
      const spikeL = calculateSpikeDosing(20, 2, 4, 20);
      expect(spikeL).toBeCloseTo(2.5, 6);
    });

    it('returns 0 when current concentration already equals target concentration', () => {
      expect(calculateSpikeDosing(25, 5, 5, 30)).toBe(0);
    });

    it('returns 0 when bath volume is zero', () => {
      expect(calculateSpikeDosing(0, 1.5, 2.5, 29)).toBe(0);
    });

    it('calculates accurate spike dosing for SPM Piranha with 30% H2O2 source', () => {
      // Bath = 25 L, current conc = 2%, target = 5%, source = 30%
      // V_spike = 25 * (5 - 2) / (30 - 5) = 25 * 3 / 25 = 3.0 L
      const spikeL = calculateSpikeDosing(25, 2.0, 5.0, 30.0);
      expect(spikeL).toBeCloseTo(3.0, 6);
    });

    it('calculates accurate spike dosing for BOE with 49% HF source', () => {
      // Bath = 20 L, current HF = 6.0%, target HF = 6.8%, source HF = 49%
      // V_spike = 20 * (6.8 - 6.0) / (49 - 6.8) = 20 * 0.8 / 42.2 = 16 / 42.2 ≈ 0.379147 L
      const spikeL = calculateSpikeDosing(20, 6.0, 6.8, 49.0);
      expect(spikeL).toBeCloseTo(0.379147, 4);
    });

    it('throws RangeError when bath volume is negative', () => {
      expect(() => calculateSpikeDosing(-10, 2, 4, 29)).toThrow(RangeError);
    });

    it('throws RangeError when current concentration is negative', () => {
      expect(() => calculateSpikeDosing(20, -1, 4, 29)).toThrow(RangeError);
    });

    it('throws RangeError when target concentration is negative', () => {
      expect(() => calculateSpikeDosing(20, 2, -4, 29)).toThrow(RangeError);
    });

    it('throws RangeError when source concentration is zero or negative', () => {
      expect(() => calculateSpikeDosing(20, 2, 4, 0)).toThrow(RangeError);
      expect(() => calculateSpikeDosing(20, 2, 4, -10)).toThrow(RangeError);
    });

    it('throws RangeError when source concentration is less than or equal to target concentration', () => {
      expect(() => calculateSpikeDosing(20, 2, 5, 5)).toThrow(RangeError);
      expect(() => calculateSpikeDosing(20, 2, 6, 5)).toThrow(RangeError);
    });

    it('throws RangeError when current concentration exceeds target concentration', () => {
      expect(() => calculateSpikeDosing(20, 6, 5, 29)).toThrow(RangeError);
    });

    it('throws RangeError when concentrations exceed 100%', () => {
      expect(() => calculateSpikeDosing(20, 2, 5, 105)).toThrow(RangeError);
      expect(() => calculateSpikeDosing(20, 102, 105, 110)).toThrow(RangeError);
    });

    it('throws TypeError when non-finite inputs are passed', () => {
      expect(() => calculateSpikeDosing(NaN, 2, 5, 30)).toThrow(TypeError);
      expect(() => calculateSpikeDosing(20, Infinity, 5, 30)).toThrow(TypeError);
    });
  });

  describe('calculateBathDegradation', () => {
    it('returns full initial etch rate when dissolved silicon loading is zero', () => {
      const result = calculateBathDegradation({
        initialEtchRateNmMin: 85,
        dissolvedSiliconGL: 0,
        maxLoadingGL: 25,
        runHours: 10,
        bathLifeHours: 120,
        bathTempC: 22,
      });

      expect(result.currentEtchRateNmMin).toBe(85);
      expect(result.etchRateReductionPercent).toBe(0);
      expect(result.etchRateFactor).toBe(1);
    });

    it('calculates decayed etch rate using ER = ER0 * (1 - (L/Lmax)^1.5)', () => {
      // 50% loading => factor = 1 - 0.5^1.5 ≈ 1 - 0.353553 = 0.646447
      const result = calculateBathDegradation({
        initialEtchRateNmMin: 100,
        dissolvedSiliconGL: 10,
        maxLoadingGL: 20,
        runHours: 20,
        bathLifeHours: 100,
        bathTempC: 25,
      });

      const expectedFactor = 1 - Math.pow(0.5, 1.5);
      expect(result.etchRateFactor).toBeCloseTo(expectedFactor, 5);
      expect(result.currentEtchRateNmMin).toBeCloseTo(100 * expectedFactor, 4);
      expect(result.etchRateReductionPercent).toBeCloseTo((1 - expectedFactor) * 100, 4);
    });

    it('clamps etch rate to zero when dissolved loading reaches or exceeds max loading', () => {
      const resultAtLimit = calculateBathDegradation({
        initialEtchRateNmMin: 50,
        dissolvedSiliconGL: 10,
        maxLoadingGL: 10,
        runHours: 15,
        bathLifeHours: 50,
        bathTempC: 25,
      });
      expect(resultAtLimit.currentEtchRateNmMin).toBe(0);
      expect(resultAtLimit.isExpired).toBe(true);

      const resultOverLimit = calculateBathDegradation({
        initialEtchRateNmMin: 50,
        dissolvedSiliconGL: 12,
        maxLoadingGL: 10,
        runHours: 15,
        bathLifeHours: 50,
        bathTempC: 25,
      });
      expect(resultOverLimit.currentEtchRateNmMin).toBe(0);
    });

    it('calculates remaining lifetime and flags expired when run hours exceed bath life', () => {
      const active = calculateBathDegradation({
        initialEtchRateNmMin: 10,
        dissolvedSiliconGL: 1,
        maxLoadingGL: 10,
        runHours: 30,
        bathLifeHours: 50,
        bathTempC: 65,
      });
      expect(active.remainingLifeHours).toBe(20);
      expect(active.remainingLifePercent).toBe(40);
      expect(active.isExpired).toBe(false);

      const expired = calculateBathDegradation({
        initialEtchRateNmMin: 10,
        dissolvedSiliconGL: 1,
        maxLoadingGL: 10,
        runHours: 60,
        bathLifeHours: 50,
        bathTempC: 65,
      });
      expect(expired.remainingLifeHours).toBe(0);
      expect(expired.remainingLifePercent).toBe(0);
      expect(expired.isExpired).toBe(true);
      expect(expired.status).toBe('expired');
    });

    it('calculates temperature-dependent water evaporation loss rate via Antoine vapor pressure', () => {
      const roomTemp = calculateBathDegradation({
        initialEtchRateNmMin: 10,
        dissolvedSiliconGL: 1,
        maxLoadingGL: 10,
        runHours: 5,
        bathLifeHours: 48,
        bathTempC: 22,
      });

      const hotTemp = calculateBathDegradation({
        initialEtchRateNmMin: 10,
        dissolvedSiliconGL: 1,
        maxLoadingGL: 10,
        runHours: 5,
        bathLifeHours: 48,
        bathTempC: 75,
      });

      // Vapor pressure and evaporation rate must increase strictly with temperature
      expect(hotTemp.vaporPressureKPa).toBeGreaterThan(roomTemp.vaporPressureKPa);
      expect(hotTemp.waterEvaporationLossRateLPerHour).toBeGreaterThan(
        roomTemp.waterEvaporationLossRateLPerHour,
      );
      expect(roomTemp.vaporPressureKPa).toBeGreaterThan(2.0); // ~2.6 kPa at 22C
      expect(hotTemp.vaporPressureKPa).toBeGreaterThan(30.0); // ~38.6 kPa at 75C
    });

    it('throws RangeError on negative or invalid parameters', () => {
      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: -5,
          dissolvedSiliconGL: 1,
          maxLoadingGL: 10,
          runHours: 5,
          bathLifeHours: 48,
          bathTempC: 25,
        }),
      ).toThrow(RangeError);

      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: 5,
          dissolvedSiliconGL: -1,
          maxLoadingGL: 10,
          runHours: 5,
          bathLifeHours: 48,
          bathTempC: 25,
        }),
      ).toThrow(RangeError);

      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: 5,
          dissolvedSiliconGL: 1,
          maxLoadingGL: 0,
          runHours: 5,
          bathLifeHours: 48,
          bathTempC: 25,
        }),
      ).toThrow(RangeError);

      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: 5,
          dissolvedSiliconGL: 1,
          maxLoadingGL: 10,
          runHours: -5,
          bathLifeHours: 48,
          bathTempC: 25,
        }),
      ).toThrow(RangeError);

      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: 5,
          dissolvedSiliconGL: 1,
          maxLoadingGL: 10,
          runHours: 5,
          bathLifeHours: 48,
          bathTempC: 250,
        }),
      ).toThrow(RangeError);
    });

    it('throws TypeError when degradation parameters are non-finite', () => {
      expect(() =>
        calculateBathDegradation({
          initialEtchRateNmMin: NaN,
          dissolvedSiliconGL: 1,
          maxLoadingGL: 10,
          runHours: 5,
          bathLifeHours: 48,
          bathTempC: 25,
        }),
      ).toThrow(TypeError);
    });
  });

  describe('calculateRcaParticleCleanEfficiency', () => {
    it('increases particle removal efficiency monotonically with megasonic power', () => {
      const lowPower = calculateRcaParticleCleanEfficiency(65, 50, { nh4oh: 1, h2o2: 1, h2o: 5 });
      const highPower = calculateRcaParticleCleanEfficiency(65, 600, { nh4oh: 1, h2o2: 1, h2o: 5 });

      expect(highPower.prePercent).toBeGreaterThan(lowPower.prePercent);
      expect(highPower.prePercent).toBeGreaterThan(90);
    });

    it('produces lower surface roughness delta with dilute SC-1 compared to standard 1:1:5 ratio', () => {
      const dilute = calculateRcaParticleCleanEfficiency(65, 400, { nh4oh: 0.2, h2o2: 1, h2o: 5 });
      const standard = calculateRcaParticleCleanEfficiency(65, 400, { nh4oh: 1.0, h2o2: 1, h2o: 5 });

      expect(dilute.roughnessDeltaRaNm).toBeLessThan(standard.roughnessDeltaRaNm);
      expect(dilute.regime).toBe('dilute-low-damage');
      expect(standard.regime).toBe('standard-rca');
    });

    it('throws RangeError when temperature or ratio components are invalid', () => {
      expect(() =>
        calculateRcaParticleCleanEfficiency(5, 400, { nh4oh: 1, h2o2: 1, h2o: 5 }),
      ).toThrow(RangeError);

      expect(() =>
        calculateRcaParticleCleanEfficiency(120, 400, { nh4oh: 1, h2o2: 1, h2o: 5 }),
      ).toThrow(RangeError);

      expect(() =>
        calculateRcaParticleCleanEfficiency(65, -100, { nh4oh: 1, h2o2: 1, h2o: 5 }),
      ).toThrow(RangeError);

      expect(() =>
        calculateRcaParticleCleanEfficiency(65, 400, { nh4oh: 0, h2o2: 1, h2o: 5 }),
      ).toThrow(RangeError);
    });

    it('throws TypeError when parameters are NaN', () => {
      expect(() =>
        calculateRcaParticleCleanEfficiency(NaN, 400, { nh4oh: 1, h2o2: 1, h2o: 5 }),
      ).toThrow(TypeError);
    });
  });
});
