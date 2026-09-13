import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';

// Render smoke tests for the component layer (the pure optics logic is
// covered by src/lib/film-color.test.ts and optical-tmm.test.ts).
describe('FilmColorCalculator', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the single-layer mode with inputs and a computed color result', () => {
    render(<Calculator />);

    // Panel headings (wired through the section aria-labelledby attributes).
    expect(screen.getByRole('heading', { level: 2, name: 'Film and Substrate' })).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Simulated Color & Interference Spectrum' }),
    ).toBeDefined();

    // Core inputs: the material select and the thickness input are enabled.
    const material = screen.getByLabelText('Film material') as HTMLSelectElement;
    expect(material.tagName).toBe('SELECT');
    expect(material.disabled).toBe(false);
    expect(material.value).toBe('sio2');

    const thickness = screen.getByLabelText(/Film Physical Thickness/) as HTMLInputElement;
    expect(thickness.disabled).toBe(false);
    expect(thickness.value).toBe('100');

    // Single-layer mode renders a result immediately: a hex color chip plus
    // the Pliskin classification block.
    expect(screen.getByText('Pliskin / Wafer Interference Classification')).toBeDefined();
    expect(screen.getByText(/^#[0-9A-Fa-f]{6}$/)).toBeDefined();
  });

  it('switches to the lazily loaded multilayer TMM solver panel', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Multilayer Optical Solver (Abelès TMM)' }));

    // The single-layer panels unmount when the tab toggles...
    expect(screen.queryByRole('heading', { name: 'Film and Substrate' })).toBeNull();

    // ...and the code-split TMM chunk (next/dynamic) resolves to the full
    // solver panel. A "Loading multilayer optical solver…" fallback may flash
    // first; findBy waits past it for the real panel heading.
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Multilayer Optical Stack Configuration' },
        { timeout: 5000 },
      ),
    ).toBeDefined();
    expect(
      await screen.findByRole(
        'heading',
        { name: 'TMM Optical Response & Colorimetry' },
        { timeout: 5000 },
      ),
    ).toBeDefined();
  });
});
