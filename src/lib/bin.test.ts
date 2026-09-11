
import { describe, expect, it } from 'vitest';
import { parseAndRollup, parseBins, rollupBins } from './bin';

describe('bin rollup', () => {
  it('parses comma and space separated lines', () => {
    const entries = parseBins('1, 9000\n2 800\n# a comment\n\n3\t200');
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ label: '1', count: 9000, pass: false });
    expect(entries[2].count).toBe(200);
  });

  it('merges repeated bins and honours the pass marker', () => {
    const entries = parseBins('PASS 900\nPASS 100 *\nFAIL 250');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ label: 'PASS', count: 1000, pass: true });
  });

  it('rolls up fractions, cumulative values and DPPM', () => {
    const roll = parseAndRollup('1 9000\n2 800\n3 200');
    expect(roll.total).toBe(10000);
    expect(roll.rows.map((r) => r.label)).toEqual(['1', '2', '3']);
    expect(roll.rows[0].fraction).toBeCloseTo(0.9, 12);
    expect(roll.rows[0].dppm).toBeCloseTo(100000, 6);
    expect(roll.rows[1].cumulative).toBeCloseTo(0.98, 12);
    expect(roll.rows[2].cumulative).toBeCloseTo(1, 12);
  });

  it('assumes the largest bin is the pass bin when none is marked', () => {
    const roll = parseAndRollup('A 400\nB 600');
    expect(roll.passLabel).toBe('B');
    expect(roll.passMarked).toBe(false);
    expect(roll.passFraction).toBeCloseTo(0.6, 12);
    expect(roll.failDppm).toBeCloseTo(400000, 6);
    expect(roll.rows[0].label).toBe('B');
    expect(roll.rows[0].pass).toBe(true);
  });

  it('uses the marked pass bin even when it is not the largest', () => {
    const roll = rollupBins(parseBins('1 300 *\n2 700'));
    expect(roll.passLabel).toBe('1');
    expect(roll.passMarked).toBe(true);
    expect(roll.passFraction).toBeCloseTo(0.3, 12);
    expect(roll.failFraction).toBeCloseTo(0.7, 12);
  });

  it('rejects malformed input', () => {
    expect(() => parseBins('1 900\nnonsense')).toThrow(/Line 2/);
    expect(() => parseBins('1 abc')).toThrow(/Line 1/);
    expect(() => parseBins('')).toThrow(/at least one/);
    expect(() => parseAndRollup('a 0\nb 0')).toThrow(/greater than 0/);
    expect(() => parseAndRollup('1 5 *\n2 5 *')).toThrow(/only one/);
  });
});
