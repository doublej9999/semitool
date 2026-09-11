
import { describe, expect, it } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('keeps ordinary values in fixed point', () => {
    expect(formatNumber(72.6344086)).toBe('72.6344');
    expect(formatNumber(0.8649)).toBe('0.8649');
    expect(formatNumber(1234.5678)).toBe('1234.57');
  });

  it('switches to exponential notation for extreme magnitudes', () => {
    expect(formatNumber(1.234e-5)).toBe('1.234e-5');
    expect(formatNumber(-5.5e-7)).toBe('-5.500e-7');
    expect(formatNumber(1234567890)).toBe('1.235e+9');
  });

  it('marks values that are not finite', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('keeps zero as zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
