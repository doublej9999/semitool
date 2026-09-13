import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';

// Render smoke tests for the component layer (Stoney math lives in
// src/lib/wafer-warp-stress.test.ts).
describe('WaferWarpStressCalculator', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the specification and results panels with core inputs', () => {
    render(<Calculator />);

    expect(screen.getByRole('heading', { level: 2, name: 'Wafer & Film Specifications' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Residual Stress & Wafer Distortion' })).toBeDefined();

    // Spot-check a few core numeric inputs: present and enabled.
    const inputs = [
      screen.getByLabelText(/Biaxial Modulus/),
      screen.getByLabelText(/Substrate Thickness/),
      screen.getByLabelText(/Film Thickness/),
      screen.getByLabelText(/Deposition Temp/),
    ] as HTMLInputElement[];
    for (const input of inputs) {
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('type')).toBe('number');
    }
    // The default curvature input mode is bow.
    expect(screen.getByLabelText(/Post-Deposition Bow/)).toBeDefined();
  });

  it('recomputes the Stoney stress when the post-deposition bow changes', () => {
    render(<Calculator />);

    // The hero metric value sits in the sibling of its label span:
    // "<span>Total Film Residual Stress (Stoney)</span><div>-… MPa</div>".
    const readStress = () =>
      screen.getByText('Total Film Residual Stress (Stoney)').nextElementSibling?.textContent ?? '';

    // Default post-deposition bow is -85 µm (frown) => compressive stress.
    expect(readStress()).toMatch(/^-/);
    expect(screen.getByText('COMPRESSIVE STRESS')).toBeDefined();

    // Stoney stress is proportional to curvature, so mirroring the bow flips
    // both the value's sign and the tensile/compressive badge.
    fireEvent.change(screen.getByLabelText(/Post-Deposition Bow/), { target: { value: '85' } });

    expect(readStress()).toMatch(/^\d/);
    expect(screen.queryByText('COMPRESSIVE STRESS')).toBeNull();
    expect(screen.getByText('TENSILE STRESS')).toBeDefined();
  });
});
