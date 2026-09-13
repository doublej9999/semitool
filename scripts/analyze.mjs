// Bundle analysis wrapper (wired as `npm run analyze`).
//
// Sets ANALYZE=true (which enables @next/bundle-analyzer in next.config.ts)
// and spawns the `next build` CLI with stdio inherited. Setting the env var in
// the script — instead of `ANALYZE=true npm run build` — keeps this portable
// across Git Bash, cmd and PowerShell.
//
// The build runs with `--webpack` on purpose: Next.js 16 defaults to Turbopack,
// and @next/bundle-analyzer hooks into the webpack pipeline, so a default
// Turbopack build would skip the reports entirely.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

process.env.ANALYZE = 'true';

const nextBin = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`[analyze] Failed to spawn next build: ${result.error.message}`);
}

process.exit(result.status ?? 1);
