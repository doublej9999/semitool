// Rewrites the service-worker cache-name constant in public/sw.js so each
// build gets its own cache version (old caches are purged by the SW activate
// handler). Wired into the `build` script before `next build`.
//
// - Version source: current git short hash; falls back to a timestamp when
//   git is unavailable (e.g. tarball installs or shallow CI checkouts).
// - Idempotent: re-running with the same version leaves the file untouched.
// - Never fails the build: if the constant can't be found it warns and exits 0.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const swPath = path.join(root, 'public', 'sw.js');
const CACHE_NAME_RE = /const CACHE_NAME\s*=\s*'semitools-cache-[^']*';/;

function resolveCacheVersion() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

let source;
try {
  source = readFileSync(swPath, 'utf8');
} catch (error) {
  console.warn(
    `[sw-version] Could not read public/sw.js, skipping cache-name update: ${error?.message ?? error}`
  );
  process.exit(0);
}

if (!CACHE_NAME_RE.test(source)) {
  console.warn(
    '[sw-version] CACHE_NAME constant not found in public/sw.js, skipping cache-name update.'
  );
  process.exit(0);
}

const version = resolveCacheVersion() ?? new Date().toISOString().replace(/\D/g, '');
const cacheName = `semitools-cache-${version}`;
const updated = source.replace(CACHE_NAME_RE, `const CACHE_NAME = '${cacheName}';`);

if (updated !== source) {
  writeFileSync(swPath, updated);
  console.log(`[sw-version] Service worker cache name set to "${cacheName}".`);
} else {
  console.log(`[sw-version] Service worker cache name already "${cacheName}".`);
}
