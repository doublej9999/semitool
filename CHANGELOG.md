# Changelog

All notable changes to SemiTools are documented here. The project has no versioned releases yet; everything lands under Unreleased until one is cut.

## [Unreleased]

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
