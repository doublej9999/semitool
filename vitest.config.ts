import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Mirror the tsconfig `@/*` -> `src/*` path alias so tests import modules the
  // same way the application does.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Node is the default: the pure-logic unit tests are cheaper without a DOM.
    environment: 'node',
    // Component and hook tests need a DOM: run .tsx test files (and explicitly
    // listed DOM-dependent suites) in jsdom, everything else in node.
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/*.test.ts', 'node'],
    ],
    // Playwright owns the e2e/ directory; vitest's default glob would try to
    // run those specs with the wrong test runner.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
