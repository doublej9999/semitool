import { expect, type Page } from '@playwright/test';

/**
 * Waits until the app shell is hydrated.
 *
 * The shell attaches its global keyboard shortcuts inside a mount effect, so
 * keyboard-driven tests must not press keys before hydration finished. There
 * is no explicit "hydrated" marker in the DOM, but the shell's locale
 * hydration effect is the first observable post-hydration signal: it resolves
 * the locale (GeoIP lookup with a ~2s abort timeout, falling back to
 * navigator.languages) and persists it to localStorage on first visit.
 */
export async function waitForAppHydration(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('semitools:locale')), {
      timeout: 15_000,
      message: 'App shell did not finish hydrating (locale preference never persisted)',
    })
    .not.toBeNull();
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
