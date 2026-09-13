import { describe, expect, it } from 'vitest';
import {
  ACCURACY_NOTES,
  DEVICE_RULES,
  ESD_DISCLAIMER,
  ESD_MODELS,
  estimateEsd,
  getDevice,
  getModel,
  listDevices,
  listModels,
  suggestSizing,
} from './esd-estimator';

const ALL_MODEL_IDS = ['hbm', 'mm', 'cdm'];
const ALL_DEVICE_TYPES = ['diode', 'ggnmos', 'supply-clamp'];

describe('ESD model catalog', () => {
  it('covers the three classic models with their circuit anchors', () => {
    expect(ESD_MODELS.map((model) => model.id)).toEqual(ALL_MODEL_IDS);
    expect(getModel('hbm')?.capacitancePf).toBe(100);
    expect(getModel('hbm')?.resistanceOhm).toBe(1500);
    expect(getModel('mm')?.capacitancePf).toBe(200);
    expect(getModel('mm')?.resistanceOhm).toBe(0);
    expect(getModel('cdm')?.riseNote).toMatch(/400 ps|ns/);
    expect(getModel('hbm')?.riseNote).toMatch(/ns/);
  });

  it('carries the JEDEC-style class targets', () => {
    expect(getModel('hbm')?.classLimits.map((level) => level.limitV)).toEqual([250, 500, 1000, 2000]);
    expect(getModel('hbm')?.classLimits.map((level) => level.label)).toEqual([
      'Class 1A',
      'Class 1B',
      'Class 1C',
      'Class 2',
    ]);
    expect(getModel('mm')?.classLimits.map((level) => level.limitV)).toEqual([200]);
    expect(getModel('cdm')?.classLimits.map((level) => level.limitV)).toEqual([250, 500]);
  });

  it('has in-range severity factors and documented conversions', () => {
    for (const model of ESD_MODELS) {
      expect(model.severityFactor, `${model.id} severity`).toBeGreaterThan(0);
      expect(model.severityFactor, `${model.id} severity`).toBeLessThanOrEqual(1);
      expect(model.classLimits.length, `${model.id} limits`).toBeGreaterThan(0);
      for (const level of model.classLimits) {
        expect(level.limitV).toBeGreaterThan(0);
        expect(Number.isFinite(level.limitV)).toBe(true);
        expect(level.label.length).toBeGreaterThan(0);
      }
      const limits = model.classLimits.map((level) => level.limitV);
      expect([...limits].sort((a, b) => a - b)).toEqual(limits);
    }
    // Documented severity anchors: MM ≈ 1/10, CDM ≈ 1/8 of the HBM level.
    expect(getModel('mm')?.severityFactor).toBeCloseTo(0.1, 9);
    expect(getModel('cdm')?.severityFactor).toBeCloseTo(0.125, 9);
  });

  it('documents its own honesty: rule-of-thumb, not silicon-validated sign-off', () => {
    expect(ESD_DISCLAIMER).toMatch(/not silicon-validated/i);
    expect(ESD_DISCLAIMER).toMatch(/TLP/i);
    expect(ESD_DISCLAIMER).toMatch(/foundry esd library/i);
    expect(ACCURACY_NOTES.length).toBeGreaterThanOrEqual(4);
    expect(ACCURACY_NOTES.join(' ')).toMatch(/±30%\+/);
    expect(ACCURACY_NOTES.join(' ')).toMatch(/JS-001|JS-002/);
  });
});

describe('device rule catalog', () => {
  it('covers the three device families with hand-checked constants', () => {
    expect(DEVICE_RULES.map((device) => device.type)).toEqual(ALL_DEVICE_TYPES);
    // Diode: 0.012 kV/µm → 100 µm ≈ 1.2 kV, inside the 1–2 kV per 100 µm band.
    expect(getDevice('diode')?.constantKvPerUm).toBeCloseTo(0.012, 9);
    // GGNMOS snapback: 0.008 kV/µm gate width.
    expect(getDevice('ggnmos')?.constantKvPerUm).toBeCloseTo(0.008, 9);
    // Chip-level clamp: 0.003 kV/µm → 1 mm ≈ 3 kV.
    expect(getDevice('supply-clamp')?.constantKvPerUm).toBeCloseTo(0.003, 9);
  });

  it('documents every constant with a ±30%+ caveat and a literature range', () => {
    for (const device of DEVICE_RULES) {
      expect(device.constantKvPerUm, `${device.type} constant`).toBeGreaterThan(0);
      expect(Number.isFinite(device.constantKvPerUm)).toBe(true);
      expect(device.caveat, `${device.type} caveat`).toMatch(/±30%\+/);
      expect(device.rangeNote.length).toBeGreaterThan(0);
      expect(device.sizeLabel.length).toBeGreaterThan(0);
      expect(device.typicalSizeUm[0]).toBeGreaterThan(0);
      expect(device.typicalSizeUm[1]).toBeGreaterThan(device.typicalSizeUm[0]);
    }
  });

  it('lists models and devices null-safely', () => {
    expect(listModels().length).toBe(3);
    expect(listDevices().length).toBe(3);
    expect(getModel('jesd')).toBeUndefined();
    expect(getModel('')).toBeUndefined();
    expect(getModel(undefined)).toBeUndefined();
    expect(getDevice('scr')).toBeUndefined();
    expect(getDevice(null)).toBeUndefined();
  });
});

describe('estimateEsd', () => {
  it('computes hand-verified HBM scaling for all three devices', () => {
    // Diode: 100 µm perimeter × 0.012 kV/µm = 1.2 kV HBM.
    const diode = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 100 }, pinType: 'input' });
    expect(diode.status).toBe('ok');
    expect(diode.hbmEquivalentKv).toBeCloseTo(1.2, 9);
    expect(diode.estimatedKv).toBeCloseTo(1.2, 9);
    expect(diode.estimatedV).toBeCloseTo(1200, 9);

    // GGNMOS: 250 µm gate width × 0.008 kV/µm = 2.0 kV HBM.
    const ggnmos = estimateEsd({ model: 'hbm', device: { type: 'ggnmos', sizeUm: 250 }, pinType: 'input' });
    expect(ggnmos.estimatedKv).toBeCloseTo(2.0, 9);

    // Supply clamp: 1000 µm total width × 0.003 kV/µm = 3.0 kV HBM chip-level.
    const clamp = estimateEsd({ model: 'hbm', device: { type: 'supply-clamp', sizeUm: 1000 }, pinType: 'power' });
    expect(clamp.estimatedKv).toBeCloseTo(3.0, 9);
  });

  it('scores the HBM class table pass/fail with boundary = pass', () => {
    // 1.2 kV HBM: passes 250/500/1000, fails 2000.
    const diode = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 100 }, pinType: 'input' });
    expect(diode.classPass.map((row) => row.pass)).toEqual([true, true, true, false]);
    expect(diode.classPass.map((row) => row.limitV)).toEqual([250, 500, 1000, 2000]);

    // Exactly at the 1 kV limit passes (estimated ≥ limit): 125 µm × 8 V/µm = 1000 V.
    const boundary = estimateEsd({ model: 'hbm', device: { type: 'ggnmos', sizeUm: 125 }, pinType: 'input' });
    expect(boundary.estimatedV).toBeCloseTo(1000, 9);
    expect(boundary.classPass[2]).toMatchObject({ limitV: 1000, pass: true });

    // Just below fails: 124.9 µm × 8 V/µm = 999.2 V.
    const below = estimateEsd({ model: 'hbm', device: { type: 'ggnmos', sizeUm: 124.9 }, pinType: 'input' });
    expect(below.estimatedV).toBeCloseTo(999.2, 9);
    expect(below.classPass[2].pass).toBe(false);

    // Tiny diode fails every HBM class: 20 µm × 12 V/µm = 240 V.
    const tiny = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 20 }, pinType: 'input' });
    expect(tiny.classPass.every((row) => !row.pass)).toBe(true);
  });

  it('applies the documented MM and CDM severity conversions', () => {
    // MM: 1.2 kV HBM-equivalent × 0.1 = 120 V → fails the 200 V target.
    const mm = estimateEsd({ model: 'mm', device: { type: 'diode', sizeUm: 100 }, pinType: 'input' });
    expect(mm.hbmEquivalentKv).toBeCloseTo(1.2, 9);
    expect(mm.estimatedKv).toBeCloseTo(0.12, 9);
    expect(mm.estimatedV).toBeCloseTo(120, 9);
    expect(mm.classPass).toEqual([{ limitV: 200, label: '200 V target', pass: false }]);
    expect(mm.warnings.join(' ')).toMatch(/1\/10/);

    // CDM: 200 µm → 2.4 kV HBM-equivalent × 0.125 = 300 V → passes 250, fails 500.
    const cdm = estimateEsd({ model: 'cdm', device: { type: 'diode', sizeUm: 200 }, pinType: 'input' });
    expect(cdm.estimatedV).toBeCloseTo(300, 9);
    expect(cdm.classPass.map((row) => row.pass)).toEqual([true, false]);
    expect(cdm.warnings.join(' ')).toMatch(/CDM/i);
  });

  it('adds pin-type warnings for output and power pins without changing the math', () => {
    const input = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 100 }, pinType: 'input' });
    const output = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 100 }, pinType: 'output' });
    const power = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm: 100 }, pinType: 'power' });
    const clampOnPower = estimateEsd({
      model: 'hbm',
      device: { type: 'supply-clamp', sizeUm: 1000 },
      pinType: 'power',
    });

    // The scaling itself is pin-independent; only the warnings differ.
    expect(output.estimatedKv).toBeCloseTo(input.estimatedKv ?? Number.NaN, 9);
    expect(power.estimatedKv).toBeCloseTo(input.estimatedKv ?? Number.NaN, 9);

    expect(output.warnings.join(' ')).toMatch(/driver|self-protection/i);
    expect(power.warnings.join(' ')).toMatch(/supply clamp/i);
    // The correct pairing (clamp on a power pin) raises no pin warning.
    expect(clampOnPower.warnings.join(' ')).not.toMatch(/supply clamp network, not/);
    // Every estimate always carries its ±30%+ device caveat first.
    for (const result of [input, output, power, clampOnPower]) {
      expect(result.warnings[0]).toMatch(/±30%\+/);
    }
  });

  it('refuses unknown models and devices instead of guessing', () => {
    const noModel = estimateEsd({ model: 'jesd', device: { type: 'diode', sizeUm: 100 }, pinType: 'input' });
    expect(noModel.status).toBe('no-model');
    expect(noModel.estimatedKv).toBeNull();
    expect(noModel.classPass).toEqual([]);
    expect(noModel.warnings.join(' ')).toMatch(/Unknown ESD model/);

    const noDevice = estimateEsd({ model: 'hbm', device: { type: 'scr', sizeUm: 100 }, pinType: 'input' });
    expect(noDevice.status).toBe('no-device');
    expect(noDevice.estimatedKv).toBeNull();
    expect(noDevice.classPass).toEqual([]);
    expect(noDevice.warnings.join(' ')).toMatch(/Unknown protection device/);
  });

  it('flags zero, negative and non-finite sizes as invalid, never computing garbage', () => {
    for (const sizeUm of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = estimateEsd({ model: 'hbm', device: { type: 'diode', sizeUm }, pinType: 'input' });
      expect(result.status).toBe('invalid');
      expect(result.estimatedKv).toBeNull();
      expect(result.estimatedV).toBeNull();
      expect(result.hbmEquivalentKv).toBeNull();
      expect(result.classPass).toEqual([]);
      expect(result.warnings.join(' ')).toMatch(/greater than 0/);
    }
  });

  it('is deterministic and null-safe for missing input', () => {
    const input = { model: 'cdm', device: { type: 'ggnmos', sizeUm: 300 }, pinType: 'output' } as const;
    expect(estimateEsd(input)).toEqual(estimateEsd(input));

    for (const broken of [null, undefined, {}]) {
      const result = estimateEsd(broken as never);
      expect(result.estimatedKv).toBeNull();
      expect(result.classPass).toEqual([]);
      expect(result.status === 'no-model' || result.status === 'no-device').toBe(true);
    }
  });
});

describe('suggestSizing', () => {
  it('inverts the scaling rules with hand-verified values', () => {
    // HBM diode: 1.2 kV / 0.012 kV/µm = 100 µm (rounded up to 0.1 µm).
    expect(suggestSizing({ model: 'hbm', targetKv: 1.2, deviceType: 'diode' })?.requiredSizeUm).toBeCloseTo(100, 1);
    // HBM GGNMOS: 2 kV / 0.008 = 250 µm.
    expect(suggestSizing({ model: 'hbm', targetKv: 2, deviceType: 'ggnmos' })?.requiredSizeUm).toBeCloseTo(250, 1);
    // HBM clamp: 8 kV / 0.003 ≈ 2666.7 µm.
    expect(suggestSizing({ model: 'hbm', targetKv: 8, deviceType: 'supply-clamp' })?.requiredSizeUm).toBeCloseTo(
      2666.7,
      1,
    );
    // MM through the 1/10 severity: 0.2 kV / 0.0012 ≈ 166.7 µm.
    expect(suggestSizing({ model: 'mm', targetKv: 0.2, deviceType: 'diode' })?.requiredSizeUm).toBeCloseTo(166.7, 1);
    // CDM through the 1/8 severity: 0.25 kV / 0.0015 ≈ 166.7 µm.
    expect(suggestSizing({ model: 'cdm', targetKv: 0.25, deviceType: 'diode' })?.requiredSizeUm).toBeCloseTo(166.7, 1);
  });

  it('rounds the suggestion UP so it never undersizes the target', () => {
    const suggestion = suggestSizing({ model: 'mm', targetKv: 0.2, deviceType: 'diode' });
    expect(suggestion).not.toBeNull();
    const estimate = estimateEsd({
      model: suggestion!.modelId,
      device: { type: suggestion!.deviceType, sizeUm: suggestion!.requiredSizeUm },
      pinType: 'input',
    });
    expect(estimate.estimatedV).toBeGreaterThanOrEqual(200);
  });

  it('round-trips estimate(suggest(target)) ≈ target for every model × device pair', () => {
    const targets = { hbm: 2, mm: 0.2, cdm: 0.5 } as const;
    for (const model of ALL_MODEL_IDS) {
      for (const deviceType of ALL_DEVICE_TYPES) {
        const targetKv = targets[model as keyof typeof targets];
        const suggestion = suggestSizing({ model, targetKv, deviceType });
        expect(suggestion, `${model}/${deviceType}`).not.toBeNull();

        const estimate = estimateEsd({
          model,
          device: { type: deviceType, sizeUm: suggestion!.requiredSizeUm },
          pinType: 'input',
        });
        expect(estimate.status).toBe('ok');
        // Ceil-to-0.1 µm guarantees the estimate never falls below the target…
        expect(estimate.estimatedKv, `${model}/${deviceType} ≥ target`).toBeGreaterThanOrEqual(targetKv);
        // …and stays within 0.5 % of it.
        expect(estimate.estimatedKv, `${model}/${deviceType} ≈ target`).toBeCloseTo(targetKv, 2);
      }
    }
  });

  it('returns null for unknown models/devices and invalid targets', () => {
    expect(suggestSizing({ model: 'jesd', targetKv: 2, deviceType: 'diode' })).toBeNull();
    expect(suggestSizing({ model: 'hbm', targetKv: 2, deviceType: 'scr' })).toBeNull();
    expect(suggestSizing({ model: 'hbm', targetKv: 0, deviceType: 'diode' })).toBeNull();
    expect(suggestSizing({ model: 'hbm', targetKv: -2, deviceType: 'diode' })).toBeNull();
    expect(suggestSizing({ model: 'hbm', targetKv: Number.NaN, deviceType: 'diode' })).toBeNull();
    expect(suggestSizing({ model: 'hbm', targetKv: undefined, deviceType: 'diode' })).toBeNull();
    expect(suggestSizing(null as never)).toBeNull();
  });

  it('warns when the target looks like volts entered instead of kV', () => {
    const absurd = suggestSizing({ model: 'hbm', targetKv: 2000, deviceType: 'diode' });
    expect(absurd).not.toBeNull();
    expect(absurd!.notes.join(' ')).toMatch(/volts entered instead of kV/);

    const sane = suggestSizing({ model: 'hbm', targetKv: 2, deviceType: 'diode' });
    expect(sane!.notes.join(' ')).not.toMatch(/volts entered instead of kV/);
  });
});
