import { describe, expect, it } from 'vitest';
import {
  calculateDiameterCorrection,
  calculateFourPointProbe,
  calculateThicknessCorrection,
  dopingToResistivity,
  getSiliconMobility,
  resistivityToDoping,
} from './four-point-probe';

describe('four-point-probe', () => {
  it('calculates thin-film sheet resistance using standard 4.5324 multiplier', () => {
    // V = 10 mV, I = 1 mA => R = 10 Ω
    // Rs = 4.53236 * 10 = 45.3236 Ω/□
    const res = calculateFourPointProbe({
      voltageMv: 10,
      currentMa: 1,
      probeSpacingMm: 1.0,
      waferDiameterMm: 200,
    });
    expect(res.resistanceOhm).toBeCloseTo(10.0, 3);
    expect(res.sheetResistanceOhmSq).toBeCloseTo(45.324, 2);
    expect(res.regime).toBe('thin-film');
  });

  it('calculates bulk resistivity with wafer thickness correction', () => {
    // Wafer thickness = 500 μm = 0.5 mm, probe spacing = 1.0 mm (t/s = 0.5)
    const res = calculateFourPointProbe({
      voltageMv: 25,
      currentMa: 5,
      probeSpacingMm: 1.0,
      waferThicknessUm: 500,
      waferDiameterMm: 200,
      dopantType: 'p-type',
    });
    expect(res.resistanceOhm).toBeCloseTo(5.0, 3);
    expect(res.resistivityOhmCm).not.toBeNull();
    expect(res.resistivityOhmCm!).toBeGreaterThan(0);
    expect(res.estimatedDopingCm3).not.toBeNull();
    expect(res.estimatedDopingCm3!).toBeGreaterThan(1e14);
  });

  it('corrects for finite thickness regimes correctly', () => {
    const thin = calculateThicknessCorrection(0.1, 1.0); // t/s = 0.1
    expect(thin.regime).toBe('thin-film');
    expect(thin.factor).toBeCloseTo(1.0, 1);

    const thick = calculateThicknessCorrection(6.0, 1.0); // t/s = 6.0
    expect(thick.regime).toBe('bulk-semi-infinite');
  });

  it('calculates diameter correction factor F2', () => {
    expect(calculateDiameterCorrection(200, 1.0)).toBe(1.0);
    expect(calculateDiameterCorrection(10, 1.0)).toBeLessThan(1.0);
  });

  it('inverts Silicon resistivity to dopant density accurately', () => {
    // For p-type silicon with 1e16 cm^-3 doping
    const targetN = 1e16;
    const rho = dopingToResistivity('p-type', targetN);
    const invertedN = resistivityToDoping('p-type', rho);
    expect(invertedN).not.toBeNull();
    expect(Math.log10(invertedN!)).toBeCloseTo(Math.log10(targetN), 2);
  });
});
