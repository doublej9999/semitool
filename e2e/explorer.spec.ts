import { test, expect } from '@playwright/test';

/**
 * STDF/KLARF Explorer smoke: the synthetic demo must produce the yield
 * headline, per-test Cpk cards and a working PTR correlation view.
 */

test.describe('STDF / KLARF explorer', () => {
  test('synthetic demo shows yield headline, Cpk cards and PTR correlation stats', async ({ page }) => {
    await page.goto('/tools/stdf-klarf-explorer');

    await page.getByRole('button', { name: 'Load synthetic demo (STDF)' }).click();

    // Yield headline: 120 parts tested. The demo generator targets ~92% yield
    // but draws per-part pass/fail with Math.random() (stdf-parser.ts), so the
    // exact percentage varies per load (e.g. 89.2%, 91.7%) — assert the
    // rendered value is a plausible draw from that Bernoulli sample, and that
    // good + failed parts reconcile to the total.
    const totalTested = page.locator('.metric', { hasText: 'Total tested' }).locator('strong');
    await expect(totalTested).toHaveText('120');
    const goodParts = page.locator('.metric', { hasText: 'Good parts' }).locator('strong');
    const failedParts = page.locator('.metric', { hasText: 'Failed parts' }).locator('strong');
    const yieldMetric = page.locator('.metric', { hasText: 'Yield' }).locator('strong');
    await expect(yieldMetric).toHaveText(/^\d{2}\.\d%$/);
    const good = Number(await goodParts.innerText());
    const failed = Number(await failedParts.innerText());
    const yieldPercent = Number((await yieldMetric.innerText()).replace('%', ''));
    expect(good + failed).toBe(120);
    // 3-sigma lower bound of a 120-part Bernoulli sample at p=0.92.
    expect(yieldPercent).toBeGreaterThanOrEqual(84);
    expect(yieldPercent).toBeLessThan(100);

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
