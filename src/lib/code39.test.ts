import { describe, it, expect } from 'vitest';
import {
  CODE39_NARROW,
  CODE39_WIDE,
  code39Svg,
  encodeCode39,
  isCode39Char,
  sanitizeCode39,
} from './code39';

/** '*' start/stop pattern per ISO/IEC 16388: n w n n w n w n n. */
const STOP_PATTERN = [1, 2, 1, 1, 2, 1, 2, 1, 1];

describe('encodeCode39', () => {
  it('encodes "A" per the ISO/IEC 16388 pattern table (wide bar first, then narrow bars)', () => {
    // '*' guard, narrow gap, 'A' = w n n n n w n n w, narrow gap, '*' guard.
    expect(encodeCode39('A').bars).toEqual([
      ...STOP_PATTERN,
      CODE39_NARROW,
      2, 1, 1, 1, 1, 2, 1, 1, 2,
      CODE39_NARROW,
      ...STOP_PATTERN,
    ]);
  });

  it('encodes "B" with the narrow-wide-narrow-narrow-wide bar sequence', () => {
    // 'B' = n n w n n w n n w -> its five bars are narrow, wide, narrow, narrow, wide.
    const { bars } = encodeCode39('B');
    const bSegment = bars.slice(STOP_PATTERN.length + 1, STOP_PATTERN.length + 1 + 9);
    expect(bSegment.filter((_, index) => index % 2 === 0)).toEqual([1, 2, 1, 1, 2]);
  });

  it('encodes "0" per the reference pattern', () => {
    expect(encodeCode39('0').bars).toEqual([
      ...STOP_PATTERN,
      CODE39_NARROW,
      1, 1, 1, 2, 2, 1, 2, 1, 1, // '0' = nnnwwnwnn
      CODE39_NARROW,
      ...STOP_PATTERN,
    ]);
  });

  it('wraps every symbol in * start/stop guards', () => {
    const { bars } = encodeCode39('123');
    expect(bars.slice(0, 9)).toEqual(STOP_PATTERN);
    expect(bars.slice(-9)).toEqual(STOP_PATTERN);
  });

  it('separates characters with a single narrow inter-character gap', () => {
    const { bars } = encodeCode39('AA');
    // The two 'A' segments each end and begin with a wide bar (2), so the gap
    // shows up as 2,1,2 in the joined width sequence.
    expect(bars.join(',')).toContain('2,1,2');
  });

  it('produces the documented element count (9 per char + 1 gap between chars)', () => {
    const { bars } = encodeCode39('LOT-42');
    const charCount = 6 + 2; // data characters + two guards
    expect(bars).toHaveLength(charCount * 9 + (charCount - 1));
  });

  it('uppercases input before encoding', () => {
    expect(encodeCode39('ab1').text).toBe('AB1');
  });

  it('encodes the empty string as bare start/stop guards', () => {
    expect(encodeCode39('').bars).toEqual([...STOP_PATTERN, CODE39_NARROW, ...STOP_PATTERN]);
  });

  it('throws deterministically on characters outside the Code 39 set', () => {
    expect(() => encodeCode39('LOT_01')).toThrowError('Code 39 cannot encode character: "_"');
    expect(() => encodeCode39('a#b')).toThrowError(/"#"/);
  });

  it('supports exactly the 43 data characters plus the * guard, each with 3 wide elements', () => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
    for (const char of charset) {
      expect(isCode39Char(char)).toBe(true);
      const { bars } = encodeCode39(char);
      // guards (2 x 9) + character (9) + 2 inter-character gaps
      expect(bars).toHaveLength(3 * 9 + 2);
      // 3 wide elements per data character + 3 per guard
      expect(bars.filter((width) => width === CODE39_WIDE)).toHaveLength(9);
    }
    expect(isCode39Char('*')).toBe(true);
    expect(isCode39Char('_')).toBe(false);
  });
});

describe('sanitizeCode39', () => {
  it('uppercases and strips characters outside the Code 39 set', () => {
    expect(sanitizeCode39('lot-2026.09#01')).toBe('LOT-2026.0901');
    expect(sanitizeCode39('a$b/c+% d')).toBe('A$B/C+% D');
  });
});

describe('code39Svg', () => {
  it('produces a standalone SVG with a valid viewBox and one rect per bar', () => {
    const svg = code39Svg('AB1');
    const { bars } = encodeCode39('AB1');
    const barCount = bars.filter((_, index) => index % 2 === 0).length;

    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);

    const narrowCount = bars.filter((w) => w === CODE39_NARROW).length;
    const wideCount = bars.filter((w) => w === CODE39_WIDE).length;
    // quiet zone (10 narrow units per side = 2 x 20px) + element widths at 2.5 ratio
    const expectedWidth = 40 + narrowCount * 2 + wideCount * 5;
    expect(svg).toContain(`viewBox="0 0 ${expectedWidth} 40"`);
    expect((svg.match(/<rect\b/g) ?? []).length).toBe(barCount);
  });

  it('honors custom height, narrowWidth and wideRatio options', () => {
    const svg = code39Svg('A', { height: 60, narrowWidth: 3, wideRatio: 3 });
    expect(svg).toContain('viewBox="0 0 201 60"'); // 2*30 quiet + 20*3 narrow + 9*9 wide
    const widths = Array.from(svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)"/g)).map(
      (match) => match[1],
    );
    expect(widths[0]).toBe('3'); // leading narrow bar of the start guard
    expect(widths).toContain('9'); // wide bars at ratio 3
  });
});
