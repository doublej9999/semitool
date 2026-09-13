import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';

// Render smoke tests for the component layer (dosing / degradation math lives
// in src/lib/wet-bench.test.ts). Note: this tool has no native <select>; the
// chemical bath "selector" is a row of recipe toggle buttons.
describe('WetBenchCalculator', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the setup and metrics panels with core inputs', () => {
    render(<Calculator />);

    expect(screen.getByRole('heading', { level: 2, name: 'Wet Bench Chemical Setup' })).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Process Status & Replenishment Metrics' }),
    ).toBeDefined();

    // Core inputs are present and enabled. (Labels carry a trailing unit
    // span, e.g. "Bath Volume (L)", so match by prefix.)
    for (const label of [/^Bath Volume/, /^Bath Operating Temp/, /^Current Conc/, /^Run Time/]) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('type')).toBe('number');
    }

    // Default recipe is SC-1; its mixing ratio and SC-1-only megasonics show.
    expect(screen.getByText('1 part NH₄OH (29%) : 1 part H₂O₂ (30%) : 5 parts DI H₂O')).toBeDefined();
    expect(screen.getByLabelText(/Megasonic Power/)).toBeDefined();
    // The four primary metric cards render with the recipe defaults.
    expect(screen.getByText('Required Spike Volume')).toBeDefined();
    expect(screen.getByText('Current Etch Rate')).toBeDefined();
    expect(screen.getByText('Remaining Bath Life')).toBeDefined();
    expect(screen.getByText('Loading Saturation')).toBeDefined();
  });

  it('switching the recipe button updates the formula and adds the SPM hazard alert', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    // SC-1 defaults are physically sane: no physics warnings up front.
    expect(screen.queryByRole('alert')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'SPM Piranha (H₂SO₄:H₂O₂)' }));

    // The mixing formula swaps to the piranha ratio...
    expect(screen.getByText('4 parts H₂SO₄ (96%) : 1 part H₂O₂ (30%)')).toBeDefined();
    // ...the 125 °C SPM default trips the exotherm danger banner...
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('SPM Chemical Exotherm Hazard (> 120°C)')).toBeDefined();
    // ...and the SC-1-only megasonic control is replaced by a chemistry readout.
    expect(screen.queryByLabelText(/Megasonic Power/)).toBeNull();
  });
});
