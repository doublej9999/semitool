import { describe, expect, it } from 'vitest';
import { calculateWireBonding, WIRE_MATERIALS } from './wire-bonding';

describe('Wire Bonding Parasitics & Fusing Current', () => {
  it('has valid materials presets', () => {
    expect(WIRE_MATERIALS.length).toBeGreaterThanOrEqual(4);
    expect(WIRE_MATERIALS.map((m) => m.id)).toContain('gold');
    expect(WIRE_MATERIALS.map((m) => m.id)).toContain('copper');
    expect(WIRE_MATERIALS.map((m) => m.id)).toContain('aluminium');
  });

  it('calculates DC resistance and rule-of-thumb inductance for 1 mil gold wire', () => {
    // 2 mm length, 25.4 µm diameter (1 mil) gold wire
    const res = calculateWireBonding({
      materialId: 'gold',
      wireLengthMm: 2.0,
      wireDiameterUm: 25.4,
      frequencyHz: 1e9, // 1 GHz
      operatingCurrentA: 0.1,
      ambientTempC: 25,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Rule of thumb: ~1 nH per mm => ~1.5 to 2.2 nH for 2 mm
    expect(res.inductanceNh).toBeGreaterThan(1.4);
    expect(res.inductanceNh).toBeLessThan(2.3);

    // DC resistance for 2mm 1mil Au is ~0.09 - 0.11 Ω (90 - 110 mΩ)
    expect(res.dcResistanceMOhm).toBeGreaterThan(85);
    expect(res.dcResistanceMOhm).toBeLessThan(115);

    // Skin depth at 1 GHz for Gold: sqrt(2.44e-8 / (pi * 1e9 * 4pi*1e-7)) ~ 2.48 µm
    expect(res.deltaSkinUm).toBeCloseTo(2.48, 1);

    // AC resistance should be noticeably higher than DC resistance due to skin effect
    expect(res.acResistanceMOhm).toBeGreaterThan(res.dcResistanceMOhm * 2);

    // Preece fusing current for 1 mil Au wire is ~0.32 A (continuous DC limit)
    expect(res.fusingCurrentA).toBeCloseTo(0.32, 1);
  });

  it('verifies safe continuous current and warning flags', () => {
    const resSafe = calculateWireBonding({
      materialId: 'gold',
      wireLengthMm: 1.5,
      wireDiameterUm: 25.4,
      frequencyHz: 100e6,
      operatingCurrentA: 0.2, // below JEDEC limit (~0.5 A)
    });
    expect(resSafe.ok).toBe(true);
    if (!resSafe.ok) return;
    expect(resSafe.isCurrentSafe).toBe(true);
    expect(resSafe.isBelowFusing).toBe(true);

    const resOver = calculateWireBonding({
      materialId: 'gold',
      wireLengthMm: 1.5,
      wireDiameterUm: 25.4,
      frequencyHz: 100e6,
      operatingCurrentA: 1.5, // above fusing current (~1.02 A)
    });
    expect(resOver.ok).toBe(true);
    if (!resOver.ok) return;
    expect(resOver.isCurrentSafe).toBe(false);
    expect(resOver.isBelowFusing).toBe(false);
  });

  it('rejects invalid inputs', () => {
    const res = calculateWireBonding({
      materialId: 'gold',
      wireLengthMm: -1,
      wireDiameterUm: 0,
      frequencyHz: -10,
      operatingCurrentA: -5,
    });
    expect(res.ok).toBe(false);
  });
});
