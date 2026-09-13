import { test, expect } from '@playwright/test';
import { readLocalStorage, waitForAppHydration } from './helpers';

/**
 * Fab session persistence smoke: a film layer added in the workspace dialog
 * must survive a full page reload (localStorage-backed session document,
 * FabWorkspacePanel -> saveActiveWorkspaceProject -> semitools_fab_session_v1).
 */

const WORKSPACE_DIALOG = 'Wafer Film Stack & Fab Project Workspace';
const FAB_SESSION_KEY = 'semitools_fab_session_v1';

test.describe('workspace session persistence', () => {
  test('an added film layer persists across a page reload', async ({ page }) => {
    await page.goto('/tools/wafer-die-calculator');
    await waitForAppHydration(page);

    // Open the Film Stack workspace via the global shortcut.
    await page.keyboard.press('Alt+w');
    const dialog = page.getByRole('dialog', { name: WORKSPACE_DIALOG });
    await expect(dialog).toBeVisible();

    // Default stack is empty; add one layer.
    await dialog.getByRole('button', { name: 'Add Layer' }).click();
    const layerCard = dialog.getByText('1. Layer 1');
    await expect(layerCard).toBeVisible();

    // The add is written through to the session document in localStorage.
    await expect
      .poll(() =>
        readLocalStorage(page, FAB_SESSION_KEY).then((raw) => {
          if (!raw) return false;
          try {
            const session = JSON.parse(raw) as { activeProject?: { layers?: Array<{ name?: string }> } };
            return Boolean(session.activeProject?.layers?.some((layer) => layer.name === 'Layer 1'));
          } catch {
            return false;
          }
        }),
      )
      .toBe(true);

    // Close the dialog and reload — the round trip through storage is the point.
    await dialog.getByRole('button', { name: 'Done & Close' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await waitForAppHydration(page);

    await page.keyboard.press('Alt+w');
    const reopenedDialog = page.getByRole('dialog', { name: WORKSPACE_DIALOG });
    await expect(reopenedDialog).toBeVisible();
    await expect(reopenedDialog.getByText('1. Layer 1')).toBeVisible();
  });
});
