
/**
 * Number formatting shared by the calculator result panels.
 *
 * Fixed point while a number stays readable, exponential beyond that, so very
 * small and very large process numbers both remain legible. The em dash marks a
 * value that is not defined, which keeps undefined metrics out of the copy
 * output instead of printing NaN.
 */
export function formatNumber(value: number, significant = 4): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(3);
  return Number(value.toPrecision(significant + 2)).toString();
}
