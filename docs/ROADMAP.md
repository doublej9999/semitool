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

**Shipped 2026-09 (round 4)**

- 64th tool: DRC Rule-of-Thumb Checker — drawn width, spacing, pitch and contact/via enclosure checked against literature-typical rules for 180 nm to 7 nm FinFET process families (second of the IC layout / DFM cluster)
- Error boundaries: root `app/error.tsx`, a `/tools` segment boundary and a window-level `global-error.tsx`, so a crashing calculator shows a recovery screen instead of a white page
- Security headers on every route via `next.config.ts`: CSP (`default-src 'self'`, `'unsafe-eval'` only outside production), X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin and a locked-down Permissions-Policy
- Dependabot: weekly npm and github-actions updates (one grouped minor/patch PR for npm; next/react majors deliberately ignored)
- Privacy-page data control: one-click JSON export of everything the app stores (localStorage plus the STDF/KLARF Explorer's IndexedDB cache) and a two-step clear that keeps UI preferences by default (`src/lib/user-data.ts`)
- URL-state sync completed: all 64 tools restore state from the URL — 61 calculators via `useUrlParamsState` directly, the thickness / pressure / power converters via the shared `UnitConverter` with a `urlKeyPrefix`
- Tool finder intent map grown to 232 phrases (from 135), with a coverage-gate test that fails when any registered tool is not reachable as a top-3 result for at least one phrase
- Component smoke tests for the five most complex calculators (film color, wafer map, wafer warp/stress, wet bench, STDF/KLARF explorer)
- Icon payload investigation closed: the ~164 kB icon-chunk premise was wrong — the real icon payload is 73.7 kB across 2 shared chunks, tree-shaking verified working, zero unused icons. Recorded here so nobody re-investigates.

## Next candidates

Ordered. Re-evaluate rather than execute blindly.

1. **Bundle budget tightening.** A flat 700 kB per-route gate now runs in CI (`npm run check:budget`), but the gate is uniform, not per-tool; tighten per-route budgets and keep trimming the heaviest routes (the explorer sits at ~675 kB, close to the gate) as tools multiply.
2. **Third DFM tool (ESD estimator), then beyond.** The parasitics estimator and the DRC rule-of-thumb checker are shipped; an ESD estimator is the natural third. Grow along the V1 PRD's Wafer / Process / Electrical / Manufacturing clusters instead of ad-hoc additions.
3. **Tool finder in the command palette.** The synonym/intent map itself is no longer a backlog item (232 phrases, coverage-gated); what remains is surfacing the finder inside the command palette so it is reachable beyond the home page.
4. **Reduced-motion support.** Nothing in `src/` references `prefers-reduced-motion`; the theme-switch transitions (body / panel / info-card) and any animated panels should collapse under the media query.
5. **Chart color tokens for dark mode.** Charts still hardcode hex: the SPC control chart paints its plot background `#ffffff` (a white box in dark mode) and the STDF / KLARF Explorer's sparklines, defect-class colors and spec-limit lines use fixed hex values instead of theme tokens.
6. **hreflang / i18n routing — decision recorded, traffic-gated.** Full locale routing means 5 × 64 prerendered pages, and hreflang alternates are only honest once the per-tool FAQ and notes copy is translated too — thousands of strings, not just shell UI. Trigger: sustained non-English organic traffic. Until then the app keeps client-side locale switching and English-only metadata.

## Conventions for contributors

- **Registry-first tool addition:** create `src/tools/<slug>/index.ts` (`defineTool`) + the route page + entries in all five `tool-dictionaries` locales — `registry.test.ts` and `i18n.test.ts` enforce this in CI.
- **Pure logic in `src/lib/`** with a twin `.test.ts` file; keep `Calculator.tsx` a thin shell around it.
- **Serialize inputs with `useUrlParamsState`** so every calculator restores and shares its state from the URL.
- **Copy results with `useCopyToClipboard`** — no bespoke clipboard code.
- **New modals build on `ModalShell`** rather than hand-rolling focus and Escape handling.
- **Category must be one of the canonical `translateCategory` strings** (the 10 groups the sidebar and this README's table use).
