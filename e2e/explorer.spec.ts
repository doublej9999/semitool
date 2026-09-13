import { test, expect } from './helpers';

/**
 * STDF/KLARF Explorer smoke: the synthetic demo must produce the yield
 * headline, per-test Cpk cards and a working PTR correlation view.
 */

test.describe('STDF / KLARF explorer', () => {
  test('synthetic demo shows yield headline, Cpk cards and PTR correlation stats', async ({ page }) => {
    await page.goto('/tools/stdf-klarf-explorer');

    await page.getByRole('button', { name: 'Load synthetic demo (STDF)' }).click();

    // Yield headline: the demo generator is fully deterministic — per-part
    // pass/fail comes from a seeded PRNG (`createRng` in stdf-parser.ts,
    // default seed 20260913), so the exact part counts are stable constants
    // for the demo options (dieCount: 120, yieldPercent: 92, see
    // stdf-klarf-explorer/demo.ts buildDemoStdf).
    const totalTested = page.locator('.metric', { hasText: 'Total tested' }).locator('strong');
    await expect(totalTested).toHaveText('120');
    const goodParts = page.locator('.metric', { hasText: 'Good parts' }).locator('strong');
    const failedParts = page.locator('.metric', { hasText: 'Failed parts' }).locator('strong');
    const yieldMetric = page.locator('.metric', { hasText: 'Yield' }).locator('strong');
    await expect(goodParts).toHaveText('108');
    await expect(failedParts).toHaveText('12');
    // UI renders stdf.yieldPercent.toFixed(1): 108/120 = exactly 90.0%.
    await expect(yieldMetric).toHaveText('90.0%');

    // Per-test cards: the demo carries four parametric tests, all with limits,
    // so at least one numeric Cpk badge must render.
    await expect(page.getByText(/^Cpk \d/).first()).toBeVisible();

    // Correlation section: two test selects side by side.
    const correlationHeading = page.getByRole('heading', { name: 'PTR correlation' });
    await expect(correlationHeading).toBeVisible();
    const selectA = page.locator('#corr-test-a');
    const selectB = page.locator('#corr-test-b');
    await expect(selectA).toBeVisible();
    await expect(selectB).toBeVisible();

    // Pick two different tests; the r=/ρ=/n= stats line must appear.
    await selectA.selectOption({ index: 1 });
    await selectB.selectOption({ index: 2 });
    await expect(page.getByText(/r = -?\d+\.\d{2} · ρ = -?\d+\.\d{2} · n = \d+/)).toBeVisible();
  });
});
