# Contributing to SemiTools

Thanks for considering a contribution. This document is the short version; the
long-form engineering conventions live in [docs/ROADMAP.md](docs/ROADMAP.md)
("Conventions for contributors") and the accuracy expectations in
[README.md](README.md) ("Accuracy policy").

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest unit/component suite
npm run e2e        # Playwright smoke suite (starts its own dev server)
npm run lint       # must report 0 problems
npm run build      # also stamps the service-worker cache version
npm run check:budget   # First Load JS budget gate
```

Every PR must keep all of these green — CI runs lint, tests, build, the bundle
budget check and the E2E suite.

## Adding a tool (registry-first)

1. Create `src/tools/<slug>/index.ts` (metadata via `defineTool`) and
   `src/tools/<slug>/Calculator.tsx` (`'use client'`), plus the route page at
   `src/app/tools/<slug>/page.tsx` (metadata via `buildToolMetadata`).
2. Add a pure-logic module in `src/lib/` with a twin test file — calculators
   stay thin; the math lives in `src/lib`.
3. Add the tool's `name`/`description`/`keywords` to **all five** locales in
   `src/lib/i18n/tool-dictionaries/` (`en`, `zh-CN`, `zh-TW`, `ko`, `ja`).
   `i18n.test.ts` fails without it.
4. `category` must be one of the canonical strings handled by
   `translateCategory` (see `src/lib/i18n/translations.ts`).
5. Sync user inputs with `useUrlParamsState`, copy buttons with
   `useCopyToClipboard`; new modals must use `ModalShell`.

## Accuracy policy

Every calculator ships with formula, notes and assumptions sections. New tools
must state their model boundaries honestly (rule-of-thumb vs foundry data,
±% accuracy) — see the accuracy policy section in the README and the
disclaimer conventions in `src/lib/drc-rules.ts` / `src/lib/esd-estimator.ts`.

## Reporting bugs

Use the bug issue template and include: tool name, inputs **with units**,
expected result, actual result, and how you arrived at the expected value
(literature reference or controlled file). Process data never leaves your
browser — never paste confidential wafer data; synthetic examples are enough.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
