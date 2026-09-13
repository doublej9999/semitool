import { test, expect } from './helpers';
import { waitForAppHydration } from './helpers';

/**
 * App shell smoke: sidebar categories, command palette and the global
 * Alt-based cleanroom shortcuts (see AppShell.tsx handleKeyDown).
 */

const PALETTE_SHORTCUT = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
const WORKSPACE_DIALOG = 'Wafer Film Stack & Fab Project Workspace';
const GENEALOGY_DIALOG = 'Virtual Lot Genealogy & Multi-Step Traveler';
const SHORTCUTS_DIALOG = 'Cleanroom Keyboard Shortcuts';

test.describe('app shell', () => {
  test('home page shows the sidebar tool categories', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.getByRole('navigation', { name: 'Tools' });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Yield & Quality' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Wet Process & Clean' })).toBeVisible();
  });

  test('command palette opens on Ctrl/Cmd+K, searches and Enter navigates to a tool', async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    await page.keyboard.press(PALETTE_SHORTCUT);
    const dialog = page.getByRole('dialog', { name: 'Tools' });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('combobox');
    await input.fill('wafer');

    const results = dialog.getByRole('listbox', { name: 'Search results' });
    await expect(results.getByRole('option').first()).toBeVisible();

    // Enter runs the highlighted entry: the palette closes and the router
    // navigates to that tool's page.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tools\/[^/]+/);
    await expect(dialog).toBeHidden();
  });

  test('command palette closes on Escape', async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    await page.keyboard.press(PALETTE_SHORTCUT);
    const dialog = page.getByRole('dialog', { name: 'Tools' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Alt+W opens the Film Stack workspace dialog and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    await page.keyboard.press('Alt+w');
    const dialog = page.getByRole('dialog', { name: WORKSPACE_DIALOG });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Alt+G opens the Lot Genealogy dialog and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    await page.keyboard.press('Alt+g');
    const dialog = page.getByRole('dialog', { name: GENEALOGY_DIALOG });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test("the '?' key opens the keyboard shortcuts guide", async ({ page }) => {
    await page.goto('/');
    await waitForAppHydration(page);

    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: SHORTCUTS_DIALOG });
    await expect(dialog).toBeVisible();
    // The guide lists the shortcuts themselves.
    await expect(dialog.getByText('Alt + W')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
