
import { describe, expect, it } from 'vitest';
import {
  OXIDE_PRESETS,
  SILICON_CONSUMED_PER_UM_OXIDE,
  thicknessAfterTime,
  timeToThickness,
  tauForInitialOxide,
} from './oxide';

const DRY = { aUm: 0.165, bUm2PerHour: 0.0117 };

describe('thicknessAfterTime', () => {
  it('grows oxide for ten hours at 1000 C in dry oxygen', () => {
    const result = thicknessAfterTime({ ...DRY, initialUm: 0, timeHours: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tauHours).toBeCloseTo(0, 12);
    expect(result.thicknessUm).toBeCloseTo(0.269361123172197, 12);
    expect(result.growthUm).toBeCloseTo(0.269361123172197, 12);
    expect(result.siliconConsumedUm).toBeCloseTo(0.12272796098986749, 12);
    expect(result.linearRateUmPerHour).toBeCloseTo(0.07090909090909091, 12);
    expect(result.crossoverUm).toBeCloseTo(0.0825, 12);
    expect(result.regime).toBe('parabolic');
  });

  it('carries an initial oxide into the Deal-Grove offset', () => {
    const result = thicknessAfterTime({ ...DRY, initialUm: 0.02, timeHours: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tauHours).toBeCloseTo(0.3162393162393163, 12);
    expect(result.thicknessUm).toBeCloseTo(0.06651761640826227, 12);
    expect(result.growthUm).toBeCloseTo(0.04651761640826227, 12);
    expect(result.regime).toBe('mixed');
  });

  it('returns the initial thickness when no time has passed', () => {
    const result = thicknessAfterTime({ ...DRY, initialUm: 0.02, timeHours: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.thicknessUm).toBeCloseTo(0.02, 12);
    expect(result.growthUm).toBeCloseTo(0, 12);
  });

  it('is faster in steam than in dry oxygen', () => {
    const dry = thicknessAfterTime({ ...DRY, initialUm: 0, timeHours: 1 });
    const wet = thicknessAfterTime({ aUm: 0.226, bUm2PerHour: 0.287, initialUm: 0, timeHours: 1 });
    expect(dry.ok && wet.ok).toBe(true);
    if (!dry.ok || !wet.ok) return;
    expect(wet.thicknessUm).toBeCloseTo(0.4345116437118027, 12);
    expect(wet.linearRateUmPerHour).toBeCloseTo(1.2699115044247786, 12);
    expect(wet.thicknessUm).toBeGreaterThan(dry.thicknessUm);
  });

  it('rejects non-positive rate constants and negative inputs', () => {
    expect(thicknessAfterTime({ ...DRY, aUm: 0, initialUm: 0, timeHours: 1 }).ok).toBe(false);
    expect(thicknessAfterTime({ ...DRY, bUm2PerHour: 0, initialUm: 0, timeHours: 1 }).ok).toBe(false);
    expect(thicknessAfterTime({ ...DRY, initialUm: -1, timeHours: 1 }).ok).toBe(false);
    expect(thicknessAfterTime({ ...DRY, initialUm: 0, timeHours: -1 }).ok).toBe(false);
  });
});

describe('timeToThickness', () => {
  it('inverts the growth curve', () => {
    const grown = thicknessAfterTime({ ...DRY, initialUm: 0, timeHours: 10 });
    expect(grown.ok).toBe(true);
    if (!grown.ok) return;
    const result = timeToThickness({ ...DRY, initialUm: 0, thicknessUm: grown.thicknessUm });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.timeHours).toBeCloseTo(10, 10);
    expect(result.regime).toBe('parabolic');
  });

  it('accounts for the starting oxide', () => {
    const result = timeToThickness({ ...DRY, initialUm: 0.02, thicknessUm: 0.1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.timeHours).toBeCloseTo((0.01 + 0.0165) / 0.0117 - 0.3162393162393163, 10);
    expect(result.growthUm).toBeCloseTo(0.08, 12);
  });

  it('rejects a target below the starting thickness', () => {
    expect(timeToThickness({ ...DRY, initialUm: 0.1, thicknessUm: 0.05 }).ok).toBe(false);
    expect(timeToThickness({ ...DRY, initialUm: 0, thicknessUm: 0 }).ok).toBe(false);
  });
});

describe('constants', () => {
  it('states the silicon consumed per micrometre of oxide', () => {
    expect(SILICON_CONSUMED_PER_UM_OXIDE).toBeCloseTo(0.4556261109418156, 12);
  });

  it('exposes the classic 1000 C presets', () => {
    expect(OXIDE_PRESETS).toHaveLength(2);
    const dry = OXIDE_PRESETS.find((preset) => preset.id === 'dry100');
    const wet = OXIDE_PRESETS.find((preset) => preset.id === 'wet100');
    expect(dry?.aUm).toBeCloseTo(0.165, 12);
    expect(dry?.bUm2PerHour).toBeCloseTo(0.0117, 12);
    expect(wet?.aUm).toBeCloseTo(0.226, 12);
    expect(wet?.bUm2PerHour).toBeCloseTo(0.287, 12);
  });

  it('computes tau consistently for the two presets', () => {
    expect(tauForInitialOxide(0.165, 0.0117, 0.02)).toBeCloseTo(0.3162393162393163, 12);
    expect(tauForInitialOxide(0.165, 0.0117, 0)).toBeCloseTo(0, 12);
  });
});
