import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';

// Render smoke tests for the component layer (STDF/KLARF parsing lives in
// src/lib/stdf-parser.test.ts / klarf-parser.test.ts). In jsdom there is no
// Worker and no IndexedDB; the component degrades by design — STDF parsing
// falls back to the synchronous inline parser and the IDB cache helper
// resolves null/false on failure.
describe('StdfKlarfExplorer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the empty state with the demo entry points', () => {
    render(<Calculator />);

    expect(screen.getByRole('heading', { level: 2, name: 'Load test data' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Results' })).toBeDefined();
    expect(screen.getByText(/Nothing loaded yet/)).toBeDefined();
    expect(
      screen.getByText(/Load an STDF or KLARF file \(or the synthetic demo\)/),
    ).toBeDefined();

    const demoStdf = screen.getByRole('button', { name: 'Load synthetic demo (STDF)' }) as HTMLButtonElement;
    expect(demoStdf.disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Load demo KLARF' })).toBeDefined();
  });

  it('loads the deterministic synthetic STDF demo (120 parts, 4 tests)', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Load synthetic demo (STDF)' }));

    // Deterministic headline metrics: 120 parts, 120 * 4 = 480 PTR records
    // across 4 parametric tests.
    const totalTested = await screen.findByText('Total tested');
    expect(totalTested.nextElementSibling?.textContent).toBe('120');
    expect(screen.getByText('synthetic-demo.std')).toBeDefined();
    expect(screen.getByText(/480 PTR records across 4 tests/)).toBeDefined();

    // The per-test cards and the filter input render for the loaded file.
    expect(screen.getByLabelText(/Filter tests/)).toBeDefined();
    expect(screen.getByText('VDD_CORE')).toBeDefined();
    expect(screen.getByText('FREQ_MAX')).toBeDefined();

    // The lazily mounted correlation panel (its "PTR correlation" fallback
    // and loaded panel share the same heading) appears for >= 2 tests.
    expect(
      await screen.findByRole('heading', { name: 'PTR correlation' }, { timeout: 5000 }),
    ).toBeDefined();
  });
});
