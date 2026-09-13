import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E smoke suite.
 *
 * The suite drives the real Next dev server (`npm run dev`) so specs exercise
 * the same code path developers see: dev-mode compile times are slower than a
 * production build, hence the generous navigation/expect timeouts. Specs are
 * deterministic smoke tests: no retries, no parallel workers, every test
 * starts from a clean browser context (fresh localStorage / IndexedDB).
 */
export default defineConfig({
  testDir: './e2e',
  // Deterministic smoke: run files and tests strictly in order, no retries.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 90_000,
  expect: {
    // Dev-server first-compile + lazy chunk loads can be slow; keep assertions
    // patient without adding fixed sleeps in the specs.
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    // First visit to a route in dev mode triggers on-demand compilation.
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
