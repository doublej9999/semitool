# Changelog

All notable changes to SemiTools are documented here.

## [1.3.0] - 2026-09-13

First tagged release: 65 tools across 10 categories, five-locale UI, dark mode,
PWA with offline fallback, STDF/KLARF import with worker parsing, XLSX/PDF/SVG
export, error boundaries and security headers. See the grouped notes below —
everything under this heading ships in 1.3.0.

## [Unreleased]

### 2026-09 (round 5)

**Accessibility**

- Reduced-motion support: a global `prefers-reduced-motion: reduce` block collapses transitions and animations app-wide, overriding even inline styles, and neutralizes the entrance keyframes
- Chart color tokens: ten `--chart-*` tokens with light, dark and print palettes, adopted across the SPC, wafer-map, curve-fitting, dopant-diffusion, CVD-kinetics and thermal-oxide charts plus the explorer sparklines/scatter — charts follow dark mode instead of painting white boxes (distinct semantic palettes kept: KLARF cluster colors, wafer-map Skip gray, dopant/CVD alpha washes)

**Performance**

- KLARF parsing moved into the STDF / KLARF Explorer's Web Worker (same inline-fallback ladder), the demo generator lazy-loaded and the parser libraries dynamic at the fallback call sites
- Explorer route slimmed 697.6 → 685.4 kB First Load JS — no longer the heaviest (SPC is now, at 690.0 kB)
- Bundle budget gate retuned 700 → 710 kB (2.9% headroom over the new heaviest route)

**Features**

- 65th tool: ESD Protection Estimator (Metrology & Layout) — on-chip ESD robustness (HBM, MM, CDM) estimated from protection-device sizing (diode perimeter, GGNMOS or supply-clamp width), checked against JEDEC class targets with inverse sizing suggestions

**Research**

- React Compiler evaluated and rejected: runtime-correct (876 tests + 10 E2E green) but +10-35 kB First Load JS per route (6 routes broke the 710 kB gate) and 4x slower builds (2.4s → 9.6s), with hand-written `useMemo` already covering the expensive paths; verdict and re-evaluation criteria recorded in `next.config.ts`

### 2026-09 (round 4)

**Robustness & Security**

- Error boundaries at three levels — root `app/error.tsx`, a `/tools` segment boundary and a window-level `global-error.tsx` — so a crashing calculator shows a recovery screen instead of a white page
- Security headers on every route (`next.config.ts`): Content-Security-Policy (`default-src 'self'`, `'unsafe-eval'` only outside production), X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin and a locked-down Permissions-Policy
- Dependabot: weekly npm and github-actions updates (one grouped minor/patch PR for npm; next/react majors ignored deliberately)

**Features**

- 64th tool: DRC Rule-of-Thumb Checker (Metrology & Layout) — drawn width, spacing, pitch and contact/via enclosure checked against literature-typical rules for 180 nm to 7 nm FinFET process families
- Privacy-page data control: one-click JSON export of all stored user data (localStorage plus the STDF/KLARF Explorer's IndexedDB cache) and a two-step "clear browsing data" that keeps UI preferences by default
- Tool finder intent map grown to 232 phrases (from 135), with a coverage-gate test that fails when any registered tool is not reachable as a top-3 result for at least one phrase
- URL-state sync completed: all 64 tools restore and share state from the URL — the three `UnitConverter`-based converters (thickness, pressure, power) now serialize via a `urlKeyPrefix`

**Quality**

- Component smoke tests for the five most complex calculators (film color, wafer map, wafer warp/stress, wet bench, STDF/KLARF explorer)
- Tests for the new robustness surface: error boundaries (`app/error.test.tsx`), the user-data export/clear (`user-data.test.tsx`) and the DRC rule catalog (`drc-rules.test.ts`); the suite now stands at 95 test files / 850+ tests

**Docs**

- Icon payload investigation closed: the ~164 kB icon-chunk premise was wrong — the real payload is 73.7 kB across 2 shared chunks, tree-shaking verified working, zero unused icons (verdict recorded in the roadmap)

### 2026-09 (round 3)

**Performance**

- Explorer correlation panel lazy-split, slimming the STDF / KLARF Explorer route to ~675 kB First Load JS

**Features**

- 63rd tool: IC Layout Parasitics Estimator — interconnect resistance, plate and fringe capacitance, IR drop and RC delay from drawn layout geometry (Metrology & Layout)
- Local natural-language tool finder on the home page ("Describe your task"): scores the registry against localized names, descriptions and keywords plus a hand-built synonym/intent map; everything runs in the browser, no API calls
- Deterministic synthetic demos: the STDF / KLARF generators use a seeded PRNG and a fixed epoch, so demo loads are byte-identical and the demo yield is exactly 90.0%

**Localization**

- Fab-term glossary grown to 129 terms; a second localization sweep moved ~44 more calculator labels onto `useGlossary()`

**Tooling**

- CI bundle budget gate: `npm run check:budget` fails when a gated route (`/`, `/tools`, `/tools/*`) exceeds 700 kB First Load JS; a separate Playwright E2E job uploads its report and artifacts on failure
- GeoIP removed: the first-visit ipapi.co lookup is gone and locale detection is browser-language-only
- Lint warnings cleared to zero (previously 21 warnings, 0 errors)

### 2026-09 (round 2)

**Performance**

- STDF parsing moved into a background Web Worker, with the last parsed file cached in IndexedDB so the STDF / KLARF Explorer reopens with the previous load
- Command palette and the fab modals (handbook, scratchpad, workspace, genealogy) lazy-load via `dynamic()` instead of shipping in the initial bundle

**Features**

- PTR-vs-PTR correlation view in the STDF / KLARF Explorer: two tests aligned by part, Pearson r, strongest pairs ranked
- Workspace Process Flows view: custom-flow manager plus fab-session document export / import
- Shared fab-term glossary (~110 terms) powering the first wave of localized calculator labels via `useGlossary()`
- PWA offline fallback page for navigations the service-worker cache misses

**Accessibility & UI**

- Dark mode: light / dark / system setting with a no-flash inline bootstrap that paints `<html data-theme>` before first render, persisted and synced across tabs

**Tooling**

- Playwright E2E smoke suite (`npm run e2e` / `npm run e2e:ui`): 10 specs across 5 files covering shell shortcuts, calculator round-trips, the explorer, dark mode and the workspace session
- Bundle analysis via `npm run analyze` (@next/bundle-analyzer)
- Service-worker `CACHE_NAME` versioned automatically at build time (`scripts/sw-version.mjs`) instead of a hand-bumped constant
- `GENEALOGY_I18N` migrated into the typed dictionaries, bringing the genealogy modal under `i18n.test.ts` coverage

### Performance

- Split i18n dictionaries per locale with lazy loading (shell + per-tool dictionaries), so a visitor downloads only their language
- Batch URL-state synchronisation into a single `replaceState` and code-split heavy calculators
- Dynamic Open Graph image generation via the `/api/og` route

### Features

- 62nd tool: STDF / KLARF Explorer — in-browser STDF V4 / KLARF 1.x parsing with per-test Cpk, bin distribution, yield and defect clusters
- Unified Fab Workspace session: film stack project, genealogy lot, metrology summary, workflow progress and custom flows persisted as one localStorage document
- Alt-based global shortcuts (handbook, traveler, scratchpad, genealogy, workspace, `?` guide) replacing browser-reserved Ctrl combinations
- Real Code-39 barcode, PDF and XLSX file exports next to the existing CSV / SVG downloads
- Metrology CSV import with limit auto-detection and Tukey / 3-sigma outlier screening, bridged into the SPC and process-capability tools
- Five-language localization completed across modals, the workflow bar and the shell (en, zh-CN, zh-TW, ko, ja)
- Advanced fab engineering modules and test suites: spatial yield signatures, process pipelines, 1D TCAD solver, 2.5D/3D packaging multiphysics, WECO/Nelson SPC engine

### Accessibility

- ModalShell: shared modal primitive with focus management, Escape / backdrop close and body scroll lock, adopted by the workspace modals

### Tooling

- Component test infrastructure: jsdom + Testing Library alongside the Vitest unit suite (82 test files, 690+ tests)
