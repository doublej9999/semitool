
import { describe, expect, it } from 'vitest';
import { parseSeries, summariseSeries } from './series';

describe('parseSeries', () => {
  it('accepts commas, spaces, semicolons and newlines', () => {
    const parsed = parseSeries('10.2, 10.4\n10.1;10.3 10.5');
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.values).toEqual([10.2, 10.4, 10.1, 10.3, 10.5]);
  });

  it('names entries that are not numbers instead of skipping them', () => {
    const parsed = parseSeries('10, 11, 12nm, 13');
    expect(parsed.values).toEqual([10, 11, 13]);
    expect(parsed.errors.join(' ')).toContain('12nm');
  });

  it('reports an empty input', () => {
    const parsed = parseSeries('   ');
    expect(parsed.values).toHaveLength(0);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });
});

describe('summariseSeries', () => {
  it('summarises a small set', () => {
    const summary = summariseSeries([10, 12, 11, 13]);
    expect(summary.n).toBe(4);
    expect(summary.mean).toBeCloseTo(11.5, 10);
    expect(summary.min).toBe(10);
    expect(summary.max).toBe(13);
    expect(summary.range).toBe(3);
    expect(summary.halfRange).toBeCloseTo(1.5, 10);
    expect(summary.sigma).toBeCloseTo(1.2909944487358056, 10);
    expect(summary.threeSigma).toBeCloseTo(3.872983346207417, 10);
    expect(summary.rangePercent).toBeCloseTo(26.08695652173913, 10);
    expect(summary.halfRangePercent).toBeCloseTo(13.043478260869565, 10);
    expect(summary.cvPercent).toBeCloseTo(11.226038684659178, 10);
  });

  it('uses the sample standard deviation, so one value has no spread', () => {
    const summary = summariseSeries([42]);
    expect(summary.n).toBe(1);
    expect(summary.sigma).toBeNull();
    expect(summary.threeSigma).toBeNull();
    expect(summary.cvPercent).toBeNull();
    expect(summary.range).toBe(0);
  });

  it('returns null percentages instead of dividing by zero', () => {
    const summary = summariseSeries([0, 0]);
    expect(summary.mean).toBe(0);
    expect(summary.rangePercent).toBeNull();
    expect(summary.halfRangePercent).toBeNull();
    expect(summary.cvPercent).toBeNull();
  });
});
