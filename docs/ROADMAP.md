# SemiTools Roadmap

A living document so direction is not re-derived every session. Last updated: 2026-09.

## Shipped recently (2026-09)

- i18n dictionary split per locale with lazy loading (shell dictionaries + per-tool dictionaries)
- 62nd tool: STDF / KLARF Explorer — in-browser ATE datalog parsing (STDF V4, KLARF 1.x)
- ModalShell accessibility primitive (focus management, Escape / backdrop close, body scroll lock)
- Real file exports: Code-39 barcode, PDF (jsPDF) and XLSX (ExcelJS) alongside the existing CSV / SVG
- Dynamic Open Graph images via `/api/og`
- Unified fab session (film stack, genealogy lot, metrology summary, workflow progress, custom flows) plus user-defined custom flows
- URL-state sync across ~59 of the calculators via `useUrlParamsState` (batched `replaceState`)
- Component test infrastructure: jsdom + Testing Library next to the existing Vitest unit suite

**Shipped 2026-09 (round 2)**

- Shell lazy-loading: the command palette and the fab modals (handbook, scratchpad, workspace, genealogy) load via `dynamic()` instead of sitting in the initial bundle
- STDF parsing moved into a background Web Worker, with the last parsed file cached in IndexedDB
- PTR-vs-PTR correlation view in the STDF / KLARF Explorer (two tests aligned by part, Pearson r, strongest pairs ranked)
- Dark mode: light / dark / system with a no-flash bootstrap painting `<html data-theme>` before first render
- PWA offline fallback page, and the service-worker `CACHE_NAME` is now versioned automatically at build time
- E2E smoke suite: Playwright, 10 specs across 5 files (`npm run e2e`)
- `GENEALOGY_I18N` migrated out of `VirtualGenealogyModal` into the typed dictionaries, under `i18n.test.ts` coverage
- Workspace Process Flows view: custom-flow manager and fab-session document export / import
- Fab-term glossary (~110 terms) plus the first wave of calculator label localization via `useGlossary()`

## Next candidates

Ordered. Re-evaluate rather than execute blindly.

1. **Per-tool performance budget in CI.** `npm run analyze` gives a local bundle report now, but CI still runs only lint / test / build; a size budget per route keeps the heavy dependencies (exceljs, jspdf, katex) code-split as tools multiply.
2. **Calculator label localization coverage push.** The fab-term glossary holds ~110 terms and covers the first wave of `useGlossary()` labels; extend it to tool-specific labels (per-tool keys or glossary growth) so the calculators localize as thoroughly as the shell.
3. **Dev-only `data-theme` hydration warning.** The inline theme bootstrap in `src/app/layout.tsx` sets `document.documentElement.dataset.theme` before hydration while the server HTML has no attribute, so dev builds log a mismatch on `<html>`; either suppress it deliberately or move the bootstrap to a Next-sanctioned pattern.
4. **Demo yield determinism.** The STDF synthetic generator (`src/lib/stdf-parser.ts`) flips pass/fail with `Math.random()`, so demo loads are never reproducible between runs; wire it to a seedable PRNG (`createRng` already exists in `src/lib/monte-carlo.ts`, and the KLARF sample generator in `src/lib/klarf-parser.ts` shares the issue).
5. **E2E in CI.** The Playwright smoke suite runs locally via `npm run e2e`, but `.github/workflows/ci.yml` still runs only lint / test / build; one workflow step would pin the shell shortcuts and workspace session on every push.
6. **hreflang / i18n routing decision.** Only if organic non-English traffic grows; client-side switching keeps the URL space simple today, and per-locale routes would be a large change for the sitemap and canonical strategy.
7. **XLSX / PDF export rollout.** Extend the real-file export buttons to the remaining CSV-only tools, reusing `src/lib/export.ts`.
8. **IC layout / DFM tool cluster expansion.** Grow along the V1 PRD's Wafer / Process / Electrical / Manufacturing clusters instead of ad-hoc additions.
9. **Lint warning cleanup.** 21 warnings remain (0 errors), mostly `no-unused-vars` in tests and tools plus one `react-hooks/exhaustive-deps`; getting to zero keeps real signal visible.

## Conventions for contributors

- **Registry-first tool addition:** create `src/tools/<slug>/index.ts` (`defineTool`) + the route page + entries in all five `tool-dictionaries` locales — `registry.test.ts` and `i18n.test.ts` enforce this in CI.
- **Pure logic in `src/lib/`** with a twin `.test.ts` file; keep `Calculator.tsx` a thin shell around it.
- **Serialize inputs with `useUrlParamsState`** so every calculator restores and shares its state from the URL.
- **Copy results with `useCopyToClipboard`** — no bespoke clipboard code.
- **New modals build on `ModalShell`** rather than hand-rolling focus and Escape handling.
- **Category must be one of the canonical `translateCategory` strings** (the 10 groups the sidebar and this README's table use).
