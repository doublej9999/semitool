import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';

// Render smoke tests for the component layer (map generation logic lives in
// src/lib/wafer.test.ts / wafer-map-g85.test.ts).
describe('WaferMapGenerator', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the geometry controls and generates a die map', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    expect(screen.getByRole('heading', { level: 2, name: 'Wafer geometry' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Wafer map' })).toBeDefined();

    // Core geometry inputs are present, enabled and numeric. (Labels carry a
    // trailing unit span, so match by prefix.)
    const diameter = screen.getByLabelText(/Wafer diameter/) as HTMLInputElement;
    const edgeExclusion = screen.getByLabelText(/Edge exclusion/) as HTMLInputElement;
    const dieWidth = screen.getByLabelText(/Die width/) as HTMLInputElement;
    const pitchX = screen.getByLabelText(/Pitch X/) as HTMLInputElement;
    for (const input of [diameter, edgeExclusion, dieWidth, pitchX]) {
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('type')).toBe('number');
    }
    expect(diameter.value).toBe('300');

    // Empty state before generation.
    expect(screen.getByText(/Click a die on the map or type its number above/)).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Generate Wafer Map' }));

    // The preview swaps its empty note for the map and die-count metrics.
    expect(screen.getByRole('img', { name: 'Interactive wafer die map' })).toBeDefined();
    const totalText = screen.getByText('Total dies').nextElementSibling?.textContent ?? '0';
    expect(Number(totalText)).toBeGreaterThan(0);
  });

  it('opens the lazily loaded native fab import drawer and toggles it closed', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Native Fab Import' }));

    // The import panel is code-split via next/dynamic ("Loading import panel…"
    // fallback); findBy waits past the fallback for the real panel heading.
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Fab Metrology & Test Format Importer' },
        { timeout: 5000 },
      ),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'STDF V4' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'KLARF 1.2' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'SEMI G85' })).toBeDefined();

    // The same button toggles the drawer closed again.
    await user.click(screen.getByRole('button', { name: 'Native Fab Import' }));
    expect(
      screen.queryByRole('heading', { name: 'Fab Metrology & Test Format Importer' }),
    ).toBeNull();
  });
});
