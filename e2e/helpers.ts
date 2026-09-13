import { expect, test as base, type Page } from '@playwright/test';

/**
 * Deterministic-locale test entry point. Every spec must import { test, expect }
 * from this module instead of '@playwright/test': the app resolves the locale
 * via GeoIP on first visit (a CN IP switches the whole UI to Chinese), which
 * would make English accessible-name locators flake mid-assertion. Pinning the
 * stored locale (and theme) before any page script runs keeps labels English
 * and skips the GeoIP round-trip entirely.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        // Seed only the FIRST visit: overwriting on every reload would clobber
        // the app's own persistence mid-test (e.g. the dark-mode round-trip).
        if (!window.localStorage.getItem('semitools:locale')) {
          window.localStorage.setItem('semitools:locale', 'en');
        }
        if (!window.localStorage.getItem('semitools:theme')) {
          window.localStorage.setItem('semitools:theme', 'light');
        }
      } catch {
        // Storage unavailable: fall back to the app's own detection.
      }
    });
    await use(context);
  },
});

export { expect };

/**
 * Waits until the app shell is hydrated.
 *
 * The shell attaches its global keyboard shortcuts inside a mount effect, so
 * keyboard-driven tests must not press keys before hydration finished. The
 * shell paints an explicit `data-app-hydrated="true"` marker on <html> in a
 * mount effect — deterministic, independent of locale/theme resolution.
 */
export async function waitForAppHydration(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.appHydrated === 'true'), {
      timeout: 15_000,
      message: 'App shell did not finish hydrating (data-app-hydrated marker never set)',
    })
    .toBe(true);
}

/** Reads a raw localStorage value inside the page. */
export function readLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((storageKey) => window.localStorage.getItem(storageKey), key);
}

/** Expects a role=dialog with the given accessible name to disappear, tolerating close animations. */
export async function expectDialogClosed(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name });
  await expect.poll(() => dialog.count().then((count) => count === 0 || !dialog.first().isVisible()), {
    timeout: 10_000,
    message: `Dialog "${name}" did not close`,
  }).toBe(true);
}
