import { describe, expect, it } from 'vitest';
import {
  calculateAldCycle,
  calculateCoverage,
  calculateExposure,
  calculateGpc,
  calculateThroughput,
  formatDuration,
  getAldPreset,
  ALD_PRESETS,
  LANGMUIR_TORR_SEC,
} from './ald';

describe('ALD Cycle & Precursor Exposure Physics', () => {
  describe('calculateExposure', () => {
    it('calculates exposure in Langmuirs where 1 L = 1e-6 Torr·s', () => {
      expect(LANGMUIR_TORR_SEC).toBe(1e-6);
      // 1e-6 Torr for 1 s = 1 Langmuir
      expect(calculateExposure(1e-6, 1.0)).toBeCloseTo(1.0, 5);

      // Typical ALD dose: 0.1 Torr pulse for 0.1 s = 0.01 Torr·s = 10,000 Langmuirs
      expect(calculateExposure(0.1, 0.1)).toBeCloseTo(10000, 0);

      // 0.5 Torr for 0.2 s = 100,000 Langmuirs
      expect(calculateExposure(0.5, 0.2)).toBeCloseTo(100000, 0);
    });

    it('handles zero and negative inputs gracefully', () => {
      expect(calculateExposure(0, 0.5)).toBe(0);
      expect(calculateExposure(0.1, 0)).toBe(0);
      expect(calculateExposure(-0.1, 0.5)).toBe(0);
      expect(calculateExposure(0.1, -0.5)).toBe(0);
      expect(calculateExposure(NaN, 0.1)).toBe(0);
    });
  });

  describe('calculateCoverage', () => {
    it('follows Langmuir chemisorption saturation model θ = 1 - exp(-L / L0)', () => {
      const L0 = 10000;

      // At L = 0, coverage = 0
      expect(calculateCoverage(0, L0)).toBe(0);

      // At L = L0, coverage = 1 - 1/e ≈ 0.6321
      const coverage1L0 = calculateCoverage(L0, L0);
      expect(coverage1L0).toBeCloseTo(1 - Math.exp(-1), 4);

      // At L = 2*L0, coverage = 1 - exp(-2) ≈ 0.8647
      expect(calculateCoverage(2 * L0, L0)).toBeCloseTo(1 - Math.exp(-2), 4);

      // At L = 5*L0, coverage > 99% (near full saturation)
      const coverage5L0 = calculateCoverage(5 * L0, L0);
      expect(coverage5L0).toBeGreaterThan(0.99);
      expect(coverage5L0).toBeLessThanOrEqual(1.0);
    });

    it('clamps coverage strictly between 0 and 1', () => {
      expect(calculateCoverage(-500, 10000)).toBe(0);
      expect(calculateCoverage(1e12, 10000)).toBe(1);
      expect(calculateCoverage(5000, 0)).toBe(1);
    });
  });

  describe('calculateGpc', () => {
    it('scales Growth Per Cycle with fractional surface coverage', () => {
      // Saturated GPC for Al2O3 = 1.1 Å/cycle
      const full = calculateGpc(1.1, 1.0);
      expect(full.gpcAngstrom).toBeCloseTo(1.1, 4);
      expect(full.gpcNm).toBeCloseTo(0.11, 4); // 1 Å = 0.1 nm

      // Half coverage (under-dosed pulse)
      const half = calculateGpc(1.1, 0.5);
      expect(half.gpcAngstrom).toBeCloseTo(0.55, 4);
      expect(half.gpcNm).toBeCloseTo(0.055, 4);

      // Zero coverage
      const zero = calculateGpc(1.1, 0);
      expect(zero.gpcAngstrom).toBe(0);
      expect(zero.gpcNm).toBe(0);
    });
  });

  describe('calculateThroughput & formatDuration', () => {
    it('calculates single wafer throughput (wafers/hour = 3600 / (t_total + t_overhead))', () => {
      // Deposition takes 1500 s, overhead (load/unload/pump/heat) takes 300 s -> Total 1800 s = 2 wph
      const wph = calculateThroughput(1500, 300, 1);
      expect(wph).toBeCloseTo(2.0, 3);
    });

    it('calculates batch reactor throughput', () => {
      // 25 wafers batch, 3600 s deposition, 600 s overhead = 4200 s total -> ~21.43 wph
      const wph = calculateThroughput(3600, 600, 25);
      expect(wph).toBeCloseTo((3600 * 25) / 4200, 2);
    });

    it('formats duration nicely into hours, minutes, and seconds', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3665)).toBe('1h 1m 5s');
      expect(formatDuration(7322)).toBe('2h 2m 2s');
    });
  });

  describe('ALD Presets', () => {
    it('contains all standard industrial precursor and film presets', () => {
      expect(ALD_PRESETS.length).toBeGreaterThanOrEqual(6);

      // 1. Al2O3: TMA + H2O
      const al2o3 = getAldPreset('al2o3');
      expect(al2o3).toBeDefined();
      expect(al2o3?.film).toBe('Al2O3');
      expect(al2o3?.precursorA).toContain('TMA');
      expect(al2o3?.precursorB).toContain('H2O');
      expect(al2o3?.gpcRangeAngstrom[0]).toBeGreaterThanOrEqual(1.0);
      expect(al2o3?.gpcRangeAngstrom[1]).toBeLessThanOrEqual(1.15);
      expect(al2o3?.temperatureRangeC[0]).toBe(150);
      expect(al2o3?.temperatureRangeC[1]).toBe(300);

      // 2. TiO2: TiCl4 + H2O
      const tio2 = getAldPreset('tio2');
      expect(tio2).toBeDefined();
      expect(tio2?.film).toBe('TiO2');
      expect(tio2?.typicalGpcAngstrom).toBeGreaterThanOrEqual(0.5);
      expect(tio2?.typicalGpcAngstrom).toBeLessThanOrEqual(0.6);
      expect(tio2?.temperatureRangeC[0]).toBe(150);
      expect(tio2?.temperatureRangeC[1]).toBe(350);

      // 3. HfO2: TEMAH + H2O
      const hfo2 = getAldPreset('temah');
      expect(hfo2).toBeDefined();
      expect(hfo2?.film).toBe('HfO2');
      expect(hfo2?.typicalGpcAngstrom).toBeGreaterThanOrEqual(0.9);
      expect(hfo2?.typicalGpcAngstrom).toBeLessThanOrEqual(1.0);
      expect(hfo2?.temperatureRangeC[0]).toBe(200);
      expect(hfo2?.temperatureRangeC[1]).toBe(300);

      // 4. ZnO: DEZ + H2O
      const zno = getAldPreset('zno');
      expect(zno).toBeDefined();
      expect(zno?.film).toBe('ZnO');
      expect(zno?.typicalGpcAngstrom).toBeGreaterThanOrEqual(1.5);
      expect(zno?.typicalGpcAngstrom).toBeLessThanOrEqual(1.8);
      expect(zno?.temperatureRangeC[0]).toBe(100);
      expect(zno?.temperatureRangeC[1]).toBe(200);

      // 5. ZrO2: TDMA-Zr + H2O
      const zro2 = getAldPreset('zro2');
      expect(zro2).toBeDefined();
      expect(zro2?.film).toBe('ZrO2');
      expect(zro2?.typicalGpcAngstrom).toBeGreaterThanOrEqual(0.9);
      expect(zro2?.typicalGpcAngstrom).toBeLessThanOrEqual(1.0);
      expect(zro2?.temperatureRangeC[0]).toBe(200);
      expect(zro2?.temperatureRangeC[1]).toBe(250);

      // 6. TiN: TiCl4 + NH3
      const tin = getAldPreset('tin');
      expect(tin).toBeDefined();
      expect(tin?.film).toBe('TiN');
      expect(tin?.precursorB).toContain('NH3');
      expect(tin?.typicalGpcAngstrom).toBeGreaterThanOrEqual(0.2);
      expect(tin?.typicalGpcAngstrom).toBeLessThanOrEqual(0.3);
      expect(tin?.temperatureRangeC[0]).toBe(350);
      expect(tin?.temperatureRangeC[1]).toBe(450);
    });

    it('matches presets by ID, formula, or common precursor names', () => {
      expect(getAldPreset('al2o3-tma-h2o')?.id).toBe('al2o3-tma-h2o');
      expect(getAldPreset('tma')?.id).toBe('al2o3-tma-h2o');
      expect(getAldPreset('DEZ')?.id).toBe('zno-dez-h2o');
      expect(getAldPreset('HfCl4')?.id).toBe('hfo2-hfcl4-h2o');
      expect(getAldPreset('unknown-precursor')).toBeUndefined();
    });
  });

  describe('calculateAldCycle', () => {
    it('calculates full cycle parameters for standard saturated Al2O3 deposition', () => {
      // Saturated condition: 0.1 Torr for 0.1 s gives 10,000 L exposure
      // Saturation dose L0 = 10,000 L -> coverage = 1 - 1/e ≈ 0.6321
      // Target thickness = 10 nm
      const result = calculateAldCycle({
        precursor: 'al2o3',
        pulseTime1: 0.1,
        purgeTime1: 2.0,
        pulseTime2: 0.1,
        purgeTime2: 2.0,
        pressure1Torr: 0.1,
        pressure2Torr: 0.1,
        targetThicknessNm: 10,
      });

      // Exposures in Langmuirs
      expect(result.exposure1_L).toBeCloseTo(10000, 0);
      expect(result.exposure2_L).toBeCloseTo(10000, 0);

      // Surface coverages
      expect(result.coverage1).toBeCloseTo(1 - Math.exp(-1), 4);
      expect(result.coverage2).toBeCloseTo(1 - Math.exp(-1), 4);
      expect(result.effectiveCoverage).toBeCloseTo(Math.pow(1 - Math.exp(-1), 2), 4);

      // Cycle time = 0.1 + 2.0 + 0.1 + 2.0 = 4.2 s
      expect(result.cycleTimeSec).toBeCloseTo(4.2, 2);

      // GPC scaling
      // Base GPC is 1.1 Å/cycle for Al2O3
      const expectedGpcA = 1.1 * Math.pow(1 - Math.exp(-1), 2);
      expect(result.effectiveGpcAngstrom).toBeCloseTo(expectedGpcA, 4);
      expect(result.effectiveGpcNm).toBeCloseTo(expectedGpcA * 0.1, 5);
      expect(result.effectiveGPC.angstrom).toBeCloseTo(expectedGpcA, 4);
      expect(result.effectiveGPC.nm).toBeCloseTo(expectedGpcA * 0.1, 5);

      // Required cycles to reach 10 nm
      const expectedCycles = Math.ceil(10 / (expectedGpcA * 0.1));
      expect(result.requiredCycles).toBe(expectedCycles);
      expect(result.resultingThicknessNm).toBeGreaterThanOrEqual(10.0);

      // Total deposition duration
      expect(result.totalDepositionTimeSec).toBe(expectedCycles * 4.2);
      expect(result.formattedTime).toBeTruthy();

      // Precursor consumption is positive and within sensible grams range
      expect(result.precursorConsumptionGrams).toBeGreaterThan(0);
      expect(result.precursorConsumptionDetails.precursor1Grams).toBeGreaterThan(0);
      expect(result.precursorConsumptionDetails.precursor2Grams).toBeGreaterThan(0);
    });

    it('respects specified totalCycles instead of targetThicknessNm', () => {
      const totalCycles = 250;
      const result = calculateAldCycle({
        precursor: 'tio2',
        pulseTime1: 0.2,
        purgeTime1: 3.0,
        pulseTime2: 0.1,
        purgeTime2: 3.0,
        pressure1Torr: 0.2,
        pressure2Torr: 0.2,
        totalCycles,
      });

      expect(result.requiredCycles).toBe(totalCycles);
      expect(result.resultingThicknessNm).toBeCloseTo(totalCycles * result.effectiveGpcNm, 4);
      expect(result.resultingThicknessAngstrom).toBeCloseTo(result.resultingThicknessNm * 10, 3);
      expect(result.cycleTimeSec).toBeCloseTo(6.3, 1);
    });

    it('allows custom gpcMaxAngstrom and saturation doses', () => {
      const result = calculateAldCycle({
        precursor: 'custom',
        pulseTime1: 0.5,
        purgeTime1: 1.5,
        pulseTime2: 0.5,
        purgeTime2: 1.5,
        pressure1Torr: 0.5,
        pressure2Torr: 0.5,
        saturationDose1L: 5000,
        gpcMaxAngstrom: 2.0, // custom high growth rate
        totalCycles: 50,
      });

      // Exposure: 0.5 * 0.5 / 1e-6 = 250,000 L
      // L / L0 = 250,000 / 5,000 = 50 -> near 100% saturation
      expect(result.coverage1).toBeCloseTo(1.0, 4);
      expect(result.coverage2).toBeCloseTo(1.0, 4);
      expect(result.effectiveCoverage).toBeCloseTo(1.0, 4);

      // Effective GPC should be equal to custom gpcMaxAngstrom
      expect(result.effectiveGpcAngstrom).toBeCloseTo(2.0, 3);
      expect(result.effectiveGpcNm).toBeCloseTo(0.2, 3);
      expect(result.resultingThicknessNm).toBeCloseTo(50 * 0.2, 2);
    });

    it('handles zero precursor pressure resulting in zero film growth', () => {
      const result = calculateAldCycle({
        precursor: 'al2o3',
        pulseTime1: 0,
        purgeTime1: 2,
        pulseTime2: 0.1,
        purgeTime2: 2,
        pressure1Torr: 0,
        pressure2Torr: 0.1,
        targetThicknessNm: 10,
      });

      expect(result.exposure1_L).toBe(0);
      expect(result.coverage1).toBe(0);
      expect(result.effectiveCoverage).toBe(0);
      expect(result.effectiveGpcAngstrom).toBe(0);
      expect(result.resultingThicknessNm).toBe(0);
      expect(result.requiredCycles).toBe(0);
    });

    it('calculates throughput with overhead time correctly', () => {
      const result = calculateAldCycle({
        precursor: 'tin',
        pulseTime1: 0.1,
        purgeTime1: 1.0,
        pulseTime2: 0.1,
        purgeTime2: 1.0,
        pressure1Torr: 0.1,
        pressure2Torr: 0.1,
        totalCycles: 100,
        overheadTimeSec: 600, // 10 min load/lock overhead
      });

      const depTime = 100 * 2.2; // 220 s
      expect(result.cycleTimeSec).toBeCloseTo(2.2, 2);
      expect(result.totalDepositionTimeSec).toBeCloseTo(depTime, 1);
      const expectedThroughput = 3600 / (depTime + 600);
      expect(result.throughputWph).toBeCloseTo(expectedThroughput, 3);
    });
  });
});
