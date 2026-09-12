/**
 * Code 39 (ISO/IEC 16388 / ANSI/AIM BC1-1995) barcode encoder. Zero dependencies.
 *
 * Encoding model
 * --------------
 * - Every character is 9 elements: 5 bars and 4 spaces, alternating and starting
 *   with a bar. Exactly 3 of the 9 elements are wide, the rest are narrow.
 * - Characters are separated by a single narrow inter-character space.
 * - Every symbol is wrapped in `*` start/stop guard characters.
 * - The 43-character data set is: 0-9 A-Z space - . $ / + % (plus the `*` guard).
 *
 * Widths are expressed in narrow-width units: narrow = 1, wide = 2 (the minimum
 * ratio allowed by the spec). Renderers may rescale to any ratio >= 2.
 *
 * Invalid characters: `encodeCode39` throws a descriptive `Error` listing every
 * offending character (deterministic - characters are never silently skipped).
 * Call `sanitizeCode39` first to strip characters outside the Code 39 set.
 */

/** The standard 43-character Code 39 table plus the `*` start/stop guard.
 * Each pattern lists the 9 elements (bar, space, bar, ..., bar) as
 * `n` (narrow) or `w` (wide), starting with a bar. */
const CODE39_PATTERNS: Readonly<Record<string, string>> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
};

/** Width, in narrow units, of a narrow element. */
export const CODE39_NARROW = 1;
/** Width, in narrow units, of a wide element (minimum spec-compliant ratio). */
export const CODE39_WIDE = 2;

const START_STOP = '*';
const INTERCHARACTER_GAP = CODE39_NARROW;

export interface Code39Encoding {
  /** Alternating bar/space element widths in narrow units, starting with a
   * bar. Includes the `*` start/stop guards and the narrow inter-character
   * gaps (odd indices are always spaces). */
  bars: number[];
  /** The text actually encoded (uppercased input). */
  text: string;
}

/** Returns true when `char` is a single character from the Code 39 set. */
export function isCode39Char(char: string): boolean {
  return char.length === 1 && Object.prototype.hasOwnProperty.call(CODE39_PATTERNS, char);
}

/** Uppercases the value and drops every character outside the Code 39 set. */
export function sanitizeCode39(value: string): string {
  return Array.from(value.toUpperCase())
    .filter(isCode39Char)
    .join('');
}

/** Encodes `value` (uppercased) into a Code 39 element width sequence.
 * Throws an `Error` listing any character outside the Code 39 set. */
export function encodeCode39(value: string): Code39Encoding {
  const text = value.toUpperCase();
  const invalid = Array.from(new Set(Array.from(text).filter((char) => !isCode39Char(char))));
  if (invalid.length > 0) {
    const noun = invalid.length === 1 ? 'character' : 'characters';
    throw new Error(
      `Code 39 cannot encode ${noun}: ${invalid.map((char) => `"${char}"`).join(', ')}`,
    );
  }

  const chars = [START_STOP, ...Array.from(text), START_STOP];
  const bars: number[] = [];
  chars.forEach((char, index) => {
    if (index > 0) {
      bars.push(INTERCHARACTER_GAP);
    }
    for (const element of CODE39_PATTERNS[char]) {
      bars.push(element === 'w' ? CODE39_WIDE : CODE39_NARROW);
    }
  });
  return { bars, text };
}

export interface Code39SvgOptions {
  /** Bar height in user units (px). Default 40. */
  height?: number;
  /** Width of a narrow element in user units (px). Default 2. */
  narrowWidth?: number;
  /** Wide-to-narrow element ratio (spec minimum 2). Default 2.5. */
  wideRatio?: number;
  /** Quiet zone width in narrow units on each side. Default 10. */
  quietZone?: number;
}

/** Renders `value` as a standalone Code 39 SVG string (one `<rect>` per bar).
 * The output carries its own xmlns so it can be saved or embedded directly.
 * All Code 39 characters are XML-attribute-safe, so the label needs no escaping. */
export function code39Svg(value: string, options: Code39SvgOptions = {}): string {
  const height = options.height ?? 40;
  const narrowWidth = options.narrowWidth ?? 2;
  const wideRatio = options.wideRatio ?? 2.5;
  const quietZone = (options.quietZone ?? 10) * narrowWidth;

  const { bars, text } = encodeCode39(value);
  const round = (n: number) => Math.round(n * 100) / 100;

  let currentX = quietZone;
  const rects: string[] = [];
  bars.forEach((units, index) => {
    const width = units === CODE39_WIDE ? narrowWidth * wideRatio : narrowWidth;
    if (index % 2 === 0) {
      rects.push(
        `<rect x="${round(currentX)}" y="0" width="${round(width)}" height="${round(height)}" fill="#0f172a"/>`,
      );
    }
    currentX += width;
  });
  const totalWidth = round(currentX + quietZone);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${round(height)}" width="${totalWidth}" height="${round(height)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Code 39 barcode for ${text}" shape-rendering="crispEdges">`,
    ...rects,
    '</svg>',
  ].join('');
}
