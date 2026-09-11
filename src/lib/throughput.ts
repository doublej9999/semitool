/**
 * Throughput and OEE for a single process step.
 *
 * The user supplies the ideal process time for one wafer in one chamber, the
 * number of parallel chambers, and three availability/performance/quality
 * factors (each as a percentage of the ideal). Everything else is derived:
 *
 *   theoretical WPH = 60 / processTime(min) x chambers
 *   effective WPH   = theoretical x A x P           (wafers that leave the step)
 *   good WPH        = effective x Q                 (wafers that also pass quality)
 *   OEE             = A x P x Q
 *
 * Scope note: this models ONE step in isolation. A real flow is limited by its
 * bottleneck step and by queue time between steps, so do not read these numbers
 * as line-level output.
 */

export interface ThroughputInput {
  /** Ideal (no-wait) process time for one wafer in one chamber, in minutes. */
  processTimeMin: number;
  /** Number of identical parallel chambers. */
  chambers: number;
  availabilityPercent: number;
  performancePercent: number;
  qualityPercent: number;
}

export interface ThroughputSuccess {
  ok: true;
  theoreticalWph: number;
  effectiveWph: number;
  goodWph: number;
  /** Fraction, not a percentage: A x P x Q. */
  oee: number;
  /** Equivalent full-rate hours of good output per day (good WPH x 24). */
  goodWafersPerDay: number;
}

export type ThroughputResult = { ok: false; errors: string[] } | ThroughputSuccess;

export function calculateThroughput(input: ThroughputInput): ThroughputResult {
  const errors: string[] = [];
  const { processTimeMin, chambers, availabilityPercent, performancePercent, qualityPercent } = input;

  if (!Number.isFinite(processTimeMin) || processTimeMin <= 0) {
    errors.push('Process time per wafer must be greater than 0.');
  }
  if (!Number.isFinite(chambers) || chambers < 1) {
    errors.push('Number of parallel chambers must be at least 1.');
  } else if (!Number.isInteger(chambers)) {
    errors.push('Number of parallel chambers must be a whole number.');
  }
  const factors: [string, number][] = [
    ['Availability', availabilityPercent],
    ['Performance', performancePercent],
    ['Quality', qualityPercent],
  ];
  for (const [name, value] of factors) {
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      errors.push(`${name} must be greater than 0% and at most 100%.`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const a = availabilityPercent / 100;
  const p = performancePercent / 100;
  const q = qualityPercent / 100;
  const theoreticalWph = (60 / processTimeMin) * chambers;
  const effectiveWph = theoreticalWph * a * p;
  const goodWph = effectiveWph * q;

  return {
    ok: true,
    theoreticalWph,
    effectiveWph,
    goodWph,
    oee: a * p * q,
    goodWafersPerDay: goodWph * 24,
  };
}
