import { test, expect } from './helpers';

/**
 * URL-state smoke for a calculator: inputs debounce-sync into the query
 * string (200ms, use-url-state.ts) and hydrate back from it on reload.
 */

test.describe('wafer die calculator URL state', () => {
  test('changing the wafer diameter syncs the query string and the result, and survives a reload', async ({ page }) => {
    await page.goto('/tools/wafer-die-calculator');

    const diameter = page.getByLabel('Wafer diameter');
    const result = page.locator('.result-value');
    await expect(diameter).toBeVisible();
    await expect(result).toBeVisible();

    const resultBefore = (await result.innerText()).trim();

    // Change the diameter; the tool debounces 200ms before history.replaceState.
    await diameter.fill('200');

    // URL-state sync: the full serialized state lands in the query string.
    await expect(page).toHaveURL(/\?diameter=200&width=10&height=10&street=0\.1&edge=3$/);

    // Result output reacts immediately (not debounced).
    await expect(result).not.toHaveText(resultBefore);

    // URL hydration: reloading with the query string restores the input value.
    await page.reload();
    await expect(page.getByLabel('Wafer diameter')).toBeVisible();
    await expect(page.getByLabel('Wafer diameter')).toHaveValue('200');
  });
});
