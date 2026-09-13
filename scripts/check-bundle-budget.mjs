#!/usr/bin/env node
/**
 * Bundle budget gate for Next.js route bundles.
 *
 * Reads the route-bundle stats emitted by `next build` (Turbopack) at
 * `.next/diagnostics/route-bundle-stats.json` — an array of
 * `{ route, firstLoadUncompressedJsBytes, firstLoadChunkPaths }` — and
 * enforces a First Load JS byte budget on the home route and every tools
 * route (`/`, `/tools`, `/tools/*`).
 *
 * Exit codes:
 *   0  all gated routes within budget, OR the stats file is missing /
 *      unreadable / has an unrecognized schema (warn only, so the gate is
 *      not brittle against unrelated build-output changes).
 *   1  at least one gated route exceeds the budget.
 *
 * Environment overrides:
 *   BUDGET_BYTES       per-route budget in bytes (positive integer,
 *                      default 700000)
 *   BUDGET_STATS_FILE  path to an alternative route-bundle-stats.json
 *
 * Usage: node scripts/check-bundle-budget.mjs  (or `npm run check:budget`)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BUDGET_BYTES = 700_000;
const TOP_N = 5;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statsFile = process.env.BUDGET_STATS_FILE
  ? path.resolve(process.env.BUDGET_STATS_FILE)
  : path.join(repoRoot, '.next', 'diagnostics', 'route-bundle-stats.json');

/** Routes covered by the budget: '/' plus the whole tools section. */
function isGatedRoute(route) {
  return route === '/' || route === '/tools' || route.startsWith('/tools/');
}

function parseBudget(raw) {
  if (raw == null || raw.trim() === '') return DEFAULT_BUDGET_BYTES;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function fmt(n) {
  return `${n.toLocaleString('en-US')} B`;
}

function printTable(out, rows, budget) {
  const routeWidth = Math.max(
    'Route'.length,
    ...rows.map((r) => r.route.length),
  );
  const bytesWidth = Math.max('First Load JS'.length, ...rows.map((r) => fmt(r.bytes).length));
  const budgetWidth = Math.max('Budget'.length, fmt(budget).length);

  out(
    `${'Route'.padEnd(routeWidth)}  ${'First Load JS'.padStart(bytesWidth)}  ${'Budget'.padStart(budgetWidth)}  Status`,
  );
  out(
    `${'-'.repeat(routeWidth)}  ${'-'.repeat(bytesWidth)}  ${'-'.repeat(budgetWidth)}  ------`,
  );
  for (const row of rows) {
    const over = row.bytes - budget;
    const status = over > 0 ? `OVER by ${fmt(over)}` : 'ok';
    out(
      `${row.route.padEnd(routeWidth)}  ${fmt(row.bytes).padStart(bytesWidth)}  ${fmt(budget).padStart(budgetWidth)}  ${status}`,
    );
  }
}

function failNonBlocking(messages) {
  for (const message of messages) console.warn(`[check:budget] WARN: ${message}`);
  console.warn('[check:budget] Skipping bundle budget gate (exit 0).');
  process.exit(0);
}

const parsedBudget = parseBudget(process.env.BUDGET_BYTES);
if (parsedBudget === null) {
  console.warn(
    `[check:budget] WARN: invalid BUDGET_BYTES "${process.env.BUDGET_BYTES}" (expected a positive integer); using default ${fmt(DEFAULT_BUDGET_BYTES)}.`,
  );
}
const budget = parsedBudget ?? DEFAULT_BUDGET_BYTES;

let raw;
try {
  raw = readFileSync(statsFile, 'utf8');
} catch (error) {
  failNonBlocking([
    `route-bundle stats not readable at ${statsFile} (${error.code ?? error.message}).`,
    'Run `npm run build` first so Next.js emits .next/diagnostics/route-bundle-stats.json.',
  ]);
}

let entries;
try {
  entries = JSON.parse(raw);
} catch (error) {
  failNonBlocking([`could not parse ${statsFile}: ${error.message}.`]);
}

if (!Array.isArray(entries)) {
  failNonBlocking([`unrecognized schema in ${statsFile} (expected a JSON array of route entries).`]);
}

const routes = [];
for (const entry of entries) {
  if (
    entry &&
    typeof entry.route === 'string' &&
    Number.isFinite(entry.firstLoadUncompressedJsBytes)
  ) {
    routes.push({ route: entry.route, bytes: entry.firstLoadUncompressedJsBytes });
  }
}

const gated = routes.filter((r) => isGatedRoute(r.route));
if (gated.length === 0) {
  failNonBlocking([
    `no gated routes ('/' or '/tools' + '/tools/*') found among the ${routes.length} route(s) in ${statsFile}.`,
  ]);
}

const offenders = gated
  .filter((r) => r.bytes > budget)
  .sort((a, b) => b.bytes - a.bytes);
const top = [...routes].sort((a, b) => b.bytes - a.bytes).slice(0, TOP_N);

console.log('Bundle budget check');
console.log(`  stats file : ${statsFile}`);
console.log(
  `  budget     : ${fmt(budget)} per gated route ('/' and '/tools' + '/tools/*')`,
);
console.log(`  gated      : ${gated.length} of ${routes.length} routes`);
console.log('');
console.log(`Top ${Math.min(TOP_N, routes.length)} heaviest routes`);
printTable(console.log, top, budget);
console.log('');

if (offenders.length > 0) {
  console.error(
    `[check:budget] FAIL: ${offenders.length} of ${gated.length} gated route(s) exceed the First Load JS budget of ${fmt(budget)}:`,
  );
  console.error('');
  printTable(console.error, offenders, budget);
  console.error('');
  console.error(
    'Fix: slim the offending routes (code-split, lazy-load heavy deps), or raise the budget via BUDGET_BYTES=<bytes>.',
  );
  process.exit(1);
}

console.log(
  `[check:budget] PASS: all ${gated.length} gated routes are within ${fmt(budget)} (heaviest ${fmt(top[0].bytes)}).`,
);
