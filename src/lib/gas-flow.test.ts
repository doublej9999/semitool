
import { describe, expect, it } from 'vitest';
import {
  GAS_FLOW_LABELS,
  GAS_FLOW_UNITS,
  GASES,
  convertGasFlow,
  gasFlowToSccm,
  molarVolumeCm3,
} from './gas-flow';

const nitrogen = GASES.find((gas) => gas.id === 'n2')!;

describe('gas flow units', () => {
  it('labels every unit and offers the process gases', () => {
    expect(GAS_FLOW_UNITS).toHaveLength(7);
    for (const unit of GAS_FLOW_UNITS) {
      expect(GAS_FLOW_LABELS[unit]).toBeTruthy();
    }
    expect(nitrogen.molarMass).toBeCloseTo(28.0134, 4);
    expect(GASES.find((gas) => gas.id === 'sf6')!.molarMass).toBeCloseTo(146.0504, 4);
  });

  it('reproduces the textbook molar volume at each reference temperature', () => {
    expect(molarVolumeCm3(0)).toBeCloseTo(22413.969545014, 6);
    expect(molarVolumeCm3(25)).toBeCloseTo(24465.403697038, 6);
  });

  it('puts one sccm at 44.615 µmol/min at 0 °C', () => {
    const converted = convertGasFlow(1, 'sccm', { temperatureC: 0, molarMass: nitrogen.molarMass });
    expect(converted.mol_per_min).toBeCloseTo(4.461503340547032e-5, 15);
    expect(converted.mol_per_min * 1e6).toBeCloseTo(44.615033405470314, 9);
    expect(converted.mol_per_h).toBeCloseTo(2.6769020043282192e-3, 15);
  });

  it('turns flow into mass for the gas that is actually flowing', () => {
    const converted = convertGasFlow(1, 'sccm', { temperatureC: 0, molarMass: nitrogen.molarMass });
    expect(converted.g_per_min).toBeCloseTo(1.2498187768008023e-3, 15);
    // Hydrogen is 14x lighter than nitrogen, so the same sccm carries less mass.
    const hydrogen = GASES.find((gas) => gas.id === 'h2')!;
    const hydrogenFlow = convertGasFlow(1, 'sccm', { temperatureC: 0, molarMass: hydrogen.molarMass });
    expect(hydrogenFlow.g_per_min).toBeCloseTo(1.2498187768008023e-3 * (2.016 / 28.0134), 15);
  });

  it('keeps 1 slm equal to 1000 sccm and 1 m³/h equal to 16666.7 sccm', () => {
    const factors = gasFlowToSccm({ temperatureC: 25, molarMass: nitrogen.molarMass });
    expect(factors.slm).toBe(1000);
    expect(factors.m3_per_h).toBeCloseTo(16666.666666666668, 9);
    expect(factors.cfm).toBeCloseTo(28316.846592, 9);
    expect(convertGasFlow(1000, 'sccm', { temperatureC: 25, molarMass: nitrogen.molarMass }).slm).toBeCloseTo(1, 12);
  });

  it('moves the molar flow when the reference temperature changes', () => {
    const atZero = convertGasFlow(1, 'slm', { temperatureC: 0, molarMass: nitrogen.molarMass });
    const atTwentyFive = convertGasFlow(1, 'slm', { temperatureC: 25, molarMass: nitrogen.molarMass });
    expect(atZero.mol_per_min).toBeCloseTo(0.04461503340547032, 12);
    expect(atTwentyFive.mol_per_min).toBeCloseTo(0.04087404452357612, 12);
    // Same sccm reading, fewer moles at the warmer standard.
    expect(atTwentyFive.mol_per_min).toBeLessThan(atZero.mol_per_min);
  });

  it('round-trips through sccm', () => {
    const options = { temperatureC: 0 as const, molarMass: nitrogen.molarMass };
    const there = convertGasFlow(250, 'slm', options);
    const back = convertGasFlow(there.sccm, 'sccm', options);
    expect(back.slm).toBeCloseTo(250, 9);
    expect(there.sccm).toBeCloseTo(250000, 6);
  });
});
