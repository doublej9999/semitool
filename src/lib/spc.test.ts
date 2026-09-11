import { describe, expect, it } from 'vitest';
import { parseSubgroups, violatesRunRule, xbarRChart } from './spc';

const SUBGROUPS = [
  [10.1, 10.3, 9.9, 10.1],
  [10.2, 10.4, 10.0, 10.2],
  [9.8, 10.0, 9.6, 9.8],
  [10.3, 10.5, 10.1, 10.3],
  [10.0, 10.2, 9.8, 10.0],
];

describe('X-bar and R chart', () => {
  it('computes the limits from the mean range', () => {
    const chart = xbarRChart(SUBGROUPS);
    expect(chart.subgroupSize).toBe(4);
    expect(chart.subgroupCount).toBe(5);
    expect(chart.means[0]).toBeCloseTo(10.1, 12);
    chart.ranges.forEach((range) => expect(range).toBeCloseTo(0.4, 12));
    expect(chart.grandMean).toBeCloseTo(10.08, 12);
    expect(chart.meanRange).toBeCloseTo(0.4, 12);
    expect(chart.xbarUcl).toBeCloseTo(10.3716, 12);
    expect(chart.xbarLcl).toBeCloseTo(9.7884, 12);
    expect(chart.rangeUcl).toBeCloseTo(0.9128000000000001, 12);
    expect(chart.rangeLcl).toBe(0);
    expect(chart.sigmaHat).toBeCloseTo(0.1942690626517727, 12);
    expect(chart.meansOutOfControl).toEqual([]);
    expect(chart.rangesOutOfControl).toEqual([]);
    expect(chart.runs).toEqual([]);
  });

  it('flags means outside the limits on both sides', () => {
    const chart = xbarRChart([...SUBGROUPS.slice(0, 4), [10.5, 10.7, 10.5, 10.7]]);
    // The high subgroup pulls the centre line up, which also puts subgroup 3 low.
    expect(chart.grandMean).toBeCloseTo(10.2, 12);
    expect(chart.xbarUcl).toBeCloseTo(10.46244, 10);
    expect(chart.xbarLcl).toBeCloseTo(9.93756, 10);
    expect(chart.meansOutOfControl).toEqual([2, 4]);
    expect(chart.ranges[4]).toBeCloseTo(0.2, 12);
  });

  it('flags a range outside the limits', () => {
    const chart = xbarRChart([...SUBGROUPS.slice(0, 4), [9.0, 10.5, 9.2, 10.4]]);
    expect(chart.rangesOutOfControl).toEqual([4]);
  });

  it('flags a run of seven on one side even when nothing is out of limits', () => {
    const stable = Array.from({ length: 7 }, () => [4.5, 5.5]);
    const chart = xbarRChart([...stable, [2.5, 3.5]]);
    expect(chart.grandMean).toBeCloseTo(4.75, 12);
    expect(chart.meansOutOfControl).toEqual([]);
    expect(chart.runs).toHaveLength(1);
    expect(chart.runs[0]).toEqual({ startIndex: 0, endIndex: 6, side: 'above' });
    expect(violatesRunRule(chart.means, chart.grandMean)).toBe(true);
  });

  it('does not flag a run shorter than seven', () => {
    const chart = xbarRChart([[3, 5], [3.5, 5.5], [7, 9], [3, 5]]);
    expect(chart.runs).toEqual([]);
  });

  it('parses subgroups from text and rejects malformed input', () => {
    expect(parseSubgroups('1,2 3\n# note\n4 5 6\n')).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(() => parseSubgroups('1 2 3\n4 x 6')).toThrow(/Line 2/);
    expect(() => parseSubgroups('\n')).toThrow(/at least two subgroups/);
  });

  it('rejects unequal subgroups and sizes outside the table', () => {
    expect(() => xbarRChart([[1, 2], [1, 2, 3]])).toThrow(/must be the same size/);
    expect(() => xbarRChart([[1], [2]])).toThrow(/subgroup sizes 2 to 10/);
    expect(() =>
      xbarRChart([
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      ]),
    ).toThrow(/subgroup sizes 2 to 10/);
    expect(() => xbarRChart([[1, 2]])).toThrow(/at least two subgroups/);
  });
});
