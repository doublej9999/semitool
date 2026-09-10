# SemiTools

Semiconductor engineering calculators that run entirely in the browser. Every tool states its units, shows the formula it uses, and refuses to pretend a generic estimate is a fab-specific number.

**Live:** https://semitool.vercel.app

## Tools

| Tool | Route | What it does |
| --- | --- | --- |
| Wafer Die Calculator | `/tools/wafer-die-calculator` | Estimated usable die per wafer from wafer diameter, die size, street width and edge exclusion (die-centre-in-circle rule) |
| Wafer Map Generator | `/tools/wafer-map-generator` | SVG wafer map with die coordinates, row/column, Good / Defect / Skip / Edge status, CSV and JSON export |
| Wafer Mark Calculator | `/tools/wafer-mark-calculator` | Builds and validates wafer mark codes from lot, wafer number, product, layer and date |
| Yield Calculator | `/tools/yield-calculator` | Yield and reject rate from gross, good and defect die counts |

## Stack

Next.js (App Router) · TypeScript · React 19 · Tailwind CSS v4 · lucide-react · Fuse.js · Vitest

All calculations are client-side. There is no account, database, payment or server-side compute.

## Architecture

```
src/
  app/                      routes, metadata, sitemap, robots, 404
    tools/<slug>/page.tsx   server component: per-tool metadata + SEO content, renders the calculator
  components/
    shell/                  AppShell, ToolSidebar, CommandPalette (layout around every page)
    tools/                  ToolCard, FavoriteButton, ToolPageShell, ToolExplorer, FavoritesSection
  lib/                      pure calculation + platform logic (no React)
    wafer.ts                die estimation, wafer map generation, geometry validation
    marking.ts              wafer mark formatting
    yield.ts                yield / reject rate
    search.ts               Fuse.js wrapper used by the palette and the toolbox page
    favorites.ts            favourite tools store (localStorage, useSyncExternalStore)
    preferences.ts          persisted UI preferences (collapsed categories / rail)
    site.ts                 canonical URL, site name, repository URL
  tools/                    tool registry, mirroring the it-tools structure
    <slug>/index.ts         tool metadata (name, path, description, keywords, category, icon)
    <slug>/Calculator.tsx   the tool UI ('use client')
    index.ts                registry: tools, toolsByCategory, getTool, getRelatedTools
```

The layout follows [it-tools](https://github.com/corentinth/it-tools): a persistent left sidebar with collapsible categories, a command palette (Ctrl/Cmd + K) with fuzzy search, favourite tools pinned to the top, and one uniform tool page layout (title, description, tool, formula, notes, FAQ, related tools).

### Adding a tool

1. Create `src/tools/<slug>/index.ts` with `defineTool({...})` and `src/tools/<slug>/Calculator.tsx` with the UI.
2. Add the tool to `src/tools/index.ts`.
3. Create `src/app/tools/<slug>/page.tsx` that exports `metadata` and renders `<ToolPageShell tool={tool} faq={[...]}>`.
4. Put every calculation in `src/lib/` and unit-test it; keep the component a thin shell.

`src/lib/registry.test.ts` fails if a registered tool has no matching route, a duplicate path, or no keywords, and `getRelatedTools` is covered as well.

## Accuracy policy

- Units are always visible in the UI (`nm`, `µm`, `mm`, `inch`); a bare number is never shown.
- Wafer die counts are labelled *Estimated usable die* and are **not** a fab cutting result.
- Generic geometry is labelled as generic: results may not match a specific fab, customer, equipment or MES specification.
- Invalid input produces a specific message (`Wafer diameter must be greater than 0.`), never a generic "Invalid input".
- Yield is `Good die / Gross die × 100%`, reject rate is `Defect die / Gross die × 100%`; good + defect die are allowed to be less than gross.

## Scripts

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run test    # Vitest (unit tests for lib + registry)
```

CI (`.github/workflows/ci.yml`) runs lint, test and build on every push and pull request.

## SEO

Per-tool metadata (title, description, keywords, canonical, Open Graph), one H1 per page, FAQ blocks emitted as `FAQPage` JSON-LD alongside `SoftwareApplication`, `sitemap.xml`, `robots.txt` and a 404 page. The canonical host comes from `NEXT_PUBLIC_SITE_URL` (default `https://semitool.vercel.app`).

## Privacy

No analytics, no cookies, no server-side storage of inputs. Favourites and sidebar preferences stay in `localStorage`.
