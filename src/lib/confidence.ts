/**
 * Binomial confidence intervals for a yield, plus sample-size planning.
 *
 * A yield measured on `n` units of which `k` passed is a proportion k/n. The
 * point estimate alone hides how much of it is sampling noise, so this module
 * returns two intervals:
 *
 *   - Wilson score interval: closed-form, well behaved for small samples and
 *     yields near 0% or 100%, and the usual recommended default.
 *   - Clopper-Pearson interval: the "exact" interval derived from the binomial
 *     distribution. Never narrower than the true coverage and therefore
 *     conservative; computed here from the inverse regularised incomplete beta.
 *
 * Model assumption: units are independent Bernoulli trials (binomial sampling).
 * Wafer-level sampling is really without replacement, so for a sample that is a
 * large share of the lot the hypergeometric model would be slightly narrower.
 */

export interface Interval {
  low: number;
  high: number;
}

/** Confidence level choices offered by the UI, with their two-sided z values. */
export const CONFIDENCE_LEVELS: { label: string; confidence: number }[] = [
  { label: '80%', confidence: 0.8 },
  { label: '90%', confidence: 0.9 },
  { label: '95%', confidence: 0.95 },
  { label: '99%', confidence: 0.99 },
  { label: '99.9%', confidence: 0.999 },
];

/**
 * Inverse standard normal CDF (Acklam's rational approximation, |error| < 1.2e-9).
 */
export function inverseNormalCdf(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;

  if (p <= 0) return Number.NEGATIVE_INFINITY;
  if (p >= 1) return Number.POSITIVE_INFINITY;

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

/** Two-sided z for a confidence level, e.g. 0.95 -> 1.959964. */
export function zForConfidence(confidence: number): number {
  return inverseNormalCdf(1 - (1 - confidence) / 2);
}

/** Lanczos log-gamma (Numerical Recipes), valid for x > 0. */
function logGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  const tmp0 = x + 5.5;
  const tmp = tmp0 - (x + 0.5) * Math.log(tmp0);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j += 1) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Continued fraction for the incomplete beta function (Numerical Recipes). */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 300;
  const eps = 3e-16;
  const fpmin = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betaContinuedFraction(a, b, x)) / a;
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Inverse of I_x(a, b) in x, by bisection (the function is monotone in x). */
export function inverseIncompleteBeta(p: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  let mid = 0.5;
  for (let i = 0; i < 200; i += 1) {
    mid = (lo + hi) / 2;
    if (incompleteBeta(a, b, mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Wilson score interval for k successes in n trials. */
export function wilsonInterval(passes: number, total: number, confidence: number): Interval {
  const z = zForConfidence(confidence);
  const n = total;
  const phat = passes / n;
  const denom = 1 + (z * z) / n;
  const center = (phat + (z * z) / (2 * n)) / denom;
  const half = (z / denom) * Math.sqrt((phat * (1 - phat)) / n + (z * z) / (4 * n * n));
  return { low: Math.max(0, center - half), high: Math.min(1, center + half) };
}

/** Clopper-Pearson (exact) interval for k successes in n trials. */
export function clopperPearsonInterval(passes: number, total: number, confidence: number): Interval {
  const alpha = 1 - confidence;
  const n = total;
  const k = passes;
  const low = k === 0 ? 0 : inverseIncompleteBeta(alpha / 2, k, n - k + 1);
  const high = k === n ? 1 : inverseIncompleteBeta(1 - alpha / 2, k + 1, n - k);
  return { low, high };
}

/**
 * Units needed so the interval half-width is at most `halfWidth`, using the
 * normal approximation n = z^2 p (1 - p) / halfWidth^2 (rounded up).
 */
export function sampleSizeForHalfWidth(expectedYield: number, halfWidth: number, confidence: number): number {
  const z = zForConfidence(confidence);
  return Math.ceil((z * z * expectedYield * (1 - expectedYield)) / (halfWidth * halfWidth));
}

export function validateIntervalInputs(passes: number, total: number, confidence: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(total) || total < 1) errors.push('Sample size must be at least 1.');
  if (!Number.isFinite(passes) || passes < 0) errors.push('Pass count must be zero or greater.');
  else if (Number.isFinite(total) && passes > total) errors.push('Pass count cannot exceed the sample size.');
  if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) {
    errors.push('Confidence level must be between 0% and 100%.');
  }
  return errors;
}

export function validateSampleSizeInputs(expectedYield: number, halfWidth: number, confidence: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(expectedYield) || expectedYield <= 0 || expectedYield >= 1) {
    errors.push('Expected yield must be between 0% and 100%.');
  }
  if (!Number.isFinite(halfWidth) || halfWidth <= 0 || halfWidth >= 1) {
    errors.push('Target half-width must be between 0 and 100 percentage points.');
  }
  if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) {
    errors.push('Confidence level must be between 0% and 100%.');
  }
  return errors;
}
