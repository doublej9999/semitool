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

## Next candidates

Ordered. Re-evaluate rather than execute blindly.

1. **Dark mode.** Explicitly deferred — the PRD said light-only. CSS variables are now in place, so it is mostly a token swap plus a toggle; revisit before the palette grows any further.
2. **STDF parametric correlation view.** PTR-vs-PTR scatter inside the STDF / KLARF Explorer (pick two tests, colour by bin/wafer) would turn the explorer from a statistics viewer into a real datalog debugging tool.
3. **Per-tool page-speed budget + bundle analysis in CI.** Heavy dependencies (exceljs, jspdf, katex) are code-split today; a size budget per route keeps it that way as tools multiply.
4. **PWA offline fallback page + runtime cache versioning.** `public/sw.js` precaches core assets, but there is no offline fallback for un-cached navigations and `CACHE_NAME` is bumped by hand.
5. **E2E smoke tests (Playwright).** The Alt-shortcut shell and the persisted workspace session are cross-component behaviour that unit tests cannot pin; a handful of happy-path E2E specs would.
6. **Remaining inline i18n.** `GENEALOGY_I18N` inside `VirtualGenealogyModal` should migrate into the typed tool dictionaries so `i18n.test.ts` covers it like everything else.
7. **hreflang / i18n routing decision.** Only if organic non-English traffic grows; client-side switching keeps the URL space simple today, and per-locale routes would be a large change for the sitemap and canonical strategy.
8. **XLSX / PDF export rollout.** Extend the real-file export buttons to the remaining CSV-only tools, reusing `src/lib/export.ts`.
9. **IC layout / DFM tool cluster expansion.** Grow along the V1 PRD's Wafer / Process / Electrical / Manufacturing clusters instead of ad-hoc additions.

## Conventions for contributors

- **Registry-first tool addition:** create `src/tools/<slug>/index.ts` (`defineTool`) + the route page + entries in all five `tool-dictionaries` locales — `registry.test.ts` and `i18n.test.ts` enforce this in CI.
- **Pure logic in `src/lib/`** with a twin `.test.ts` file; keep `Calculator.tsx` a thin shell around it.
- **Serialize inputs with `useUrlParamsState`** so every calculator restores and shares its state from the URL.
- **Copy results with `useCopyToClipboard`** — no bespoke clipboard code.
- **New modals build on `ModalShell`** rather than hand-rolling focus and Escape handling.
- **Category must be one of the canonical `translateCategory` strings** (the 10 groups the sidebar and this README's table use).
