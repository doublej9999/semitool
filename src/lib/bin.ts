
/**
 * Wafer-sort bin rollup.
 *
 * Input is one bin per line: a label and a count, optionally followed by a
 * marker (*) on the bin that is the pass bin. Commas or whitespace separate
 * the fields, so a line copied straight out of a datalog works.
 */

export interface BinEntry {
  label: string;
  count: number;
  /** True when the line was marked as the pass bin. */
  pass: boolean;
}

export interface BinRow {
  label: string;
  count: number;
  /** Fraction of all die in this bin, 0 to 1. */
  fraction: number;
  /** Running total of the fractions down the sorted list. */
  cumulative: number;
  /** This bin expressed as defective parts per million. */
  dppm: number;
  pass: boolean;
}

export interface BinRollup {
  total: number;
  rows: BinRow[];
  /** The bin treated as the pass bin. */
  passLabel: string | null;
  passCount: number;
  passFraction: number;
  failFraction: number;
  failDppm: number;
  /** True when a pass bin was marked in the input. */
  passMarked: boolean;
}

const LINE = /^([^,;\s]+)[,;\s]*([0-9][0-9_.,]*)\s*(\*)?$/;

/** Parse `label count [*]` lines. Throws with the offending line number. */
export function parseBins(text: string): BinEntry[] {
  const entries: BinEntry[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const match = LINE.exec(line);
    if (!match) {
      throw new Error(`Line ${index + 1} is not "<bin> <count>": "${raw.trim()}".`);
    }
    const count = Number(match[2].replace(/[_,]/g, ''));
    if (!Number.isFinite(count) || count < 0) {
      throw new Error(`Line ${index + 1} has a count that is not a non-negative number.`);
    }
    const label = match[1];
    const existing = entries.find((e) => e.label === label);
    if (existing) {
      existing.count += count;
      existing.pass = existing.pass || Boolean(match[3]);
    } else {
      entries.push({ label, count, pass: Boolean(match[3]) });
    }
  });
  if (entries.length === 0) {
    throw new Error('Enter at least one bin line as "<bin> <count>".');
  }
  return entries;
}

/**
 * Roll the bins up: per-bin and cumulative yield, the pass fraction and the
 * defect rate. Rows are ordered by descending count so the pass bin and the
 * largest failure bins come first.
 *
 * When no bin is marked with a star the largest bin is assumed to be the
 * pass bin, and `passMarked` is false so the caller can say so.
 */
export function rollupBins(entries: BinEntry[]): BinRollup {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  if (total <= 0) {
    throw new Error('The total die count must be greater than 0.');
  }

  const marked = entries.filter((e) => e.pass);
  if (marked.length > 1) {
    throw new Error('Mark only one bin as the pass bin with a *.');
  }

  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const passEntry = marked[0] ?? sorted[0];

  let running = 0;
  const rows: BinRow[] = sorted.map((e) => {
    const fraction = e.count / total;
    running += fraction;
    return {
      label: e.label,
      count: e.count,
      fraction,
      cumulative: running,
      dppm: (1 - fraction) * 1e6,
      pass: e.label === passEntry.label,
    };
  });

  const passFraction = passEntry.count / total;
  return {
    total,
    rows,
    passLabel: passEntry.label,
    passCount: passEntry.count,
    passFraction,
    failFraction: 1 - passFraction,
    failDppm: (1 - passFraction) * 1e6,
    passMarked: marked.length === 1,
  };
}

export function parseAndRollup(text: string): BinRollup {
  return rollupBins(parseBins(text));
}
