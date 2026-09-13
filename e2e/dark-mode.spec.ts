import { test, expect } from './helpers';
import { readLocalStorage, waitForAppHydration } from './helpers';

/**
 * Theme smoke: the toolbar toggle cycles light -> dark -> system, mirrors the
 * resolved theme onto <html data-theme>, persists the setting under
 * 'semitools:theme' and restores it after a reload (no-flash bootstrap).
 */

const THEME_KEY = 'semitools:theme';

async function paintedTheme(page: import('@playwright/test').Page): Promise<string | undefined> {
  return page.evaluate(() => document.documentElement.dataset.theme);
}

test.describe('theme toggle', () => {
  test('cycles light/dark/system, paints data-theme and persists across reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    // Fresh context: default setting is light.
    const toggle = page.getByRole('button', { name: 'Light theme' });
    await expect(toggle).toBeVisible();

    // light -> dark: <html data-theme> flips and the choice is persisted.
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Dark theme' })).toBeVisible();
    await expect.poll(paintedTheme.bind(null, page)).toBe('dark');
    expect(await readLocalStorage(page, THEME_KEY)).toBe('dark');

    // dark -> system: resolves through prefers-color-scheme (Chromium here
    // emulates 'light', the Playwright default).
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.getByRole('button', { name: 'Follow system' })).toBeVisible();
    await expect.poll(paintedTheme.bind(null, page)).toBe('light');
    expect(await readLocalStorage(page, THEME_KEY)).toBe('system');

    // system -> light -> dark again, so the reload check runs on dark.
    await page.getByRole('button', { name: 'Follow system' }).click();
    await expect(page.getByRole('button', { name: 'Light theme' })).toBeVisible();
    await page.getByRole('button', { name: 'Light theme' }).click();
    await expect(page.getByRole('button', { name: 'Dark theme' })).toBeVisible();
    await expect.poll(paintedTheme.bind(null, page)).toBe('dark');

    // Reload: the persisted setting is applied by the pre-hydration bootstrap.
    await page.reload();
    await expect.poll(paintedTheme.bind(null, page)).toBe('dark');
    await expect(page.getByRole('button', { name: 'Dark theme' })).toBeVisible();
  });
});
