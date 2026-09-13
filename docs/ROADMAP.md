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

**Shipped 2026-09 (round 3)**

- 63rd tool: IC Layout Parasitics Estimator — interconnect resistance, plate / fringe capacitance, IR drop and RC delay from drawn geometry (first of the IC layout / DFM cluster)
- Local natural-language tool finder on the home page ("Describe your task"): registry scoring plus a hand-built synonym/intent map, no API calls
- Glossary sprint 2: fab-term glossary grown to 129 terms, and a second localization sweep moved ~44 more calculator labels onto `useGlossary()`
- Deterministic synthetic demos: the STDF / KLARF generators use a seeded PRNG and a fixed epoch, so demo loads are byte-identical (demo yield exactly 90.0%)
- Explorer route slimming: correlation panel lazy-split, bringing the STDF / KLARF Explorer route to ~675 kB First Load JS
- CI gates: bundle budget check (`npm run check:budget`, 700 kB per-route First Load JS) in the verify job, plus a separate Playwright E2E job with artifact upload on failure
- GeoIP removal: the first-visit ipapi.co lookup is gone; locale detection is browser-language-only
- XLSX / PDF export rollout finished across the remaining CSV-only tools
- Lint zero: the remaining 21 warnings cleared (0 errors, 0 warnings)

## Next candidates

Ordered. Re-evaluate rather than execute blindly.

1. **Bundle budget tightening.** A flat 700 kB per-route gate now runs in CI (`npm run check:budget`), but the gate is uniform, not per-tool; tighten per-route budgets and keep trimming the heaviest routes (the explorer sits at ~675 kB, close to the gate) as tools multiply.
2. **hreflang / i18n routing decision.** Only if organic non-English traffic grows. Full locale routing is a standalone architectural project — client-side switching keeps the URL space simple today but limits SEO to English metadata for now.
3. **IC layout / DFM tool cluster expansion.** First tool shipped (IC Layout Parasitics Estimator); DRC checker and ESD estimator are the natural next steps. Grow along the V1 PRD's Wafer / Process / Electrical / Manufacturing clusters instead of ad-hoc additions.
4. **AI tool finder enhancements.** Grow the synonym/intent map (135 intent phrases today) and its CJK coverage; surface the finder inside the command palette so it is reachable beyond the home page.
5. **URL-state coverage for the unit converters.** 60 of 63 calculators serialize inputs to the URL; the three pure converters (thickness, pressure, power) go through the shared `UnitConverter`, which does not use `useUrlParamsState` yet.

## Conventions for contributors

- **Registry-first tool addition:** create `src/tools/<slug>/index.ts` (`defineTool`) + the route page + entries in all five `tool-dictionaries` locales — `registry.test.ts` and `i18n.test.ts` enforce this in CI.
- **Pure logic in `src/lib/`** with a twin `.test.ts` file; keep `Calculator.tsx` a thin shell around it.
- **Serialize inputs with `useUrlParamsState`** so every calculator restores and shares its state from the URL.
- **Copy results with `useCopyToClipboard`** — no bespoke clipboard code.
- **New modals build on `ModalShell`** rather than hand-rolling focus and Escape handling.
- **Category must be one of the canonical `translateCategory` strings** (the 10 groups the sidebar and this README's table use).
