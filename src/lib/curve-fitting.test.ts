import { describe, expect, it } from 'vitest';
import {
  fitArrhenius,
  fitDealGrove,
  linearRegression,
  parseTwoColumnData,
} from './curve-fitting';

describe('curve-fitting', () => {
  it('performs accurate linear regression', () => {
    // y = 2x + 1
    const points = [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 9 },
    ];
    const res = linearRegression(points);
    expect(res).not.toBeNull();
    expect(res!.slope).toBeCloseTo(2.0, 5);
    expect(res!.intercept).toBeCloseTo(1.0, 5);
    expect(res!.rSquared).toBeCloseTo(1.0, 5);
  });

  it('handles noisy linear data with valid R²', () => {
    const points = [
      { x: 1, y: 2.1 },
      { x: 2, y: 3.9 },
      { x: 3, y: 6.2 },
      { x: 4, y: 7.8 },
    ];
    const res = linearRegression(points);
    expect(res).not.toBeNull();
    expect(res!.slope).toBeCloseTo(1.93, 1);
    expect(res!.rSquared).toBeGreaterThan(0.98);
  });

  it('extracts activation energy Ea from Arrhenius data', () => {
    // True Ea = 0.5 eV, A = 1e7
    const Ea_true = 0.5;
    const A_true = 1e7;
    const k_B = 8.617333262e-5;

    const testTempsC = [150, 175, 200, 225, 250];
    const testPoints = testTempsC.map((tempC) => {
      const tempK = tempC + 273.15;
      const rate = A_true * Math.exp(-Ea_true / (k_B * tempK));
      return { temperatureCelsius: tempC, rate };
    });

    const res = fitArrhenius(testPoints);
    expect(res).not.toBeNull();
    expect(res!.activationEnergyEv).toBeCloseTo(Ea_true, 3);
    expect(res!.rSquared).toBeGreaterThan(0.999);
    expect(res!.points.length).toBe(5);
  });

  it('parses two-column CSV and tab-delimited text', () => {
    const raw = `
      # Comment line
      150, 1.25e-3
      200 4.82e-3
      250\t1.50e-2
    `;
    const parsed = parseTwoColumnData(raw);
    expect(parsed.length).toBe(3);
    expect(parsed[0]).toEqual({ x: 150, y: 0.00125 });
    expect(parsed[1]).toEqual({ x: 200, y: 0.00482 });
    expect(parsed[2]).toEqual({ x: 250, y: 0.015 });
  });

  it('extracts Deal-Grove linear and parabolic rate constants correctly', () => {
    const points = [
      { thicknessUm: 0.05, timeHours: (0.05 ** 2 + 0.1 * 0.05) / 0.05 },
      { thicknessUm: 0.10, timeHours: (0.10 ** 2 + 0.1 * 0.10) / 0.05 },
      { thicknessUm: 0.20, timeHours: (0.20 ** 2 + 0.1 * 0.20) / 0.05 },
      { thicknessUm: 0.30, timeHours: (0.30 ** 2 + 0.1 * 0.30) / 0.05 },
    ];
    const fit = fitDealGrove(points);
    expect(fit).not.toBeNull();
    if (fit) {
      expect(fit.parabolicRateConstantB).toBeCloseTo(0.05, 3);
      expect(fit.linearRateConstantBoverA).toBeCloseTo(0.5, 3);
      expect(fit.parameterA).toBeCloseTo(0.1, 3);
      expect(fit.rSquared).toBeGreaterThan(0.999);
    }
  });
});
