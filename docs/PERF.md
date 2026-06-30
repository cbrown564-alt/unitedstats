# Performance

The site serves data that is **immutable between ingests** (`data/united.db` is a
pure build artifact of `data/canonical/*.json`, rebuilt in `prebuild`). The
performance strategy follows from that: prerender everything at build, touch
SQLite only at build, ship static HTML from the CDN.

Re-ingest is **Option B**: a scheduled GitHub Action runs `pipeline/update.ts`,
commits updated canonical JSON, and the push triggers a Vercel git deploy that
rebuilds the DB. Every deploy is therefore a clean cache — no runtime cache
invalidation (`revalidateTag`) is required.

## Baseline (2026-06-21, before the static-rendering campaign)

`next build` (Next 16.2.9, Turbopack), all 28 routes:

- **Render mode:** every route `ƒ (Dynamic)` — server-rendered per request —
  except `/_not-found`. Only 5 pages prerendered.
- DB: 6,027 matches (1886 → 2026), 984 players, 398 season-summary rows.
- Each request opens `united.db` via `better-sqlite3` and runs queries, despite
  the data being identical until the next deploy.

## Budgets (targets for the campaign)

| Metric | Target |
| --- | --- |
| Page render mode | `○` static or `●` SSG (params); only `/api/v1/*` searchParams endpoints may stay `ƒ` |
| TTFB (pages) | CDN-static (no per-request DB) |
| LCP | < 2.0s |
| INP | < 200ms |
| CLS | < 0.05 |
| First Load JS (per route) | < 150 KB; chart-heavy routes < 200 KB |
| Runtime DB access | none from page routes (build-time only) |

## Route disposition (achieved)

`next build` after M2/M3 — **7,416 pages prerender** (was: 5):

- **Static `○`:** `/`, `/managers`, `/transfers`, `/questions`, `/data`,
  `/opponents`, `/analytics`
  - `/opponents` filters client-side (`FilterableList`); `/analytics` runs its
    forecast client-side (`OddsPredictor`) over build-precomputed odds.
- **SSG `●` (`generateStaticParams` + `dynamicParams=false`):** `/match/[id]`
  (6,027), `/player/[id]` (985), `/seasons/[season]` (~128), `/opponent/[id]`
  (237), `/manager/[id]` (29). Sort/expand interactions are client islands
  (`PlayerSeasonTable`, `LeagueTable`).
- **Dynamic `ƒ` by design:** `/matches` and `/players` (filter/sort over large
  datasets with per-row visuals — too heavy to ship to the client), `/seasons`
  index (a cosmetic order flip over a richly-spaced ledger), `/search` (genuine
  search; the instant header/⌘K search is already client-side). These read the
  DB at runtime but are not SEO/Web-Vitals-critical landing pages.

## M3 — SQLite out of the request path

All 7,416 prerendered routes touch SQLite **only at build**. The four dynamic
page routes above plus the `/api/v1/*` and `/api/search` handlers are the only
runtime DB consumers.

The public API stays dynamic rather than statically generating ~7k `[id]`
endpoints (which would roughly double build output for a secondary feature).
Instead it leans on the CDN: because the dataset is immutable between deploys
and every deploy is a fresh cache key, `lib/api.ts` sets
`Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`,
so edge hits serve cached JSON and runtime DB queries are rare. Same runtime
profile as SSG, without the build cost.

## M4 — bundle

recharts (~348 KB) was already route-split (the home page never loads it). Its
three charts now load behind `ssr: false` wrappers (`components/charts/lazy.tsx`)
with height-reserved skeletons, so the 985 `/player/[id]` pages and `/questions`
defer it past hydration with no layout shift. `/analytics` keeps it eager — its
Elo hero chart is above the fold.

## M5 — images and fonts

- **Fonts** are already optimal: `next/font/google` (Archivo + IBM Plex Mono)
  self-hosts the files, subsets to latin, and applies `font-display: swap` — no
  external font request, no FOIT.
- **CLS:** portraits render through `next/image` with explicit width/height in a
  fixed-size container, and club crests are pure CSS — no layout shift.
- **LCP:** the hero portrait on `/player/[id]` now sets `priority` (+ `sizes`),
  so the page's largest image isn't lazy-loaded.
- **Wikimedia 429s:** portraits are immutable, so the optimizer holds each
  variant for a year (`images.minimumCacheTTL`). Wikimedia is hit at most once
  per image rather than on every cache expiry. (A build-time download into
  `public/` would remove the runtime dependency entirely — noted as optional
  further hardening; not needed for the perf budget.)

## M6 — regression guard

`scripts/check-static-render.mjs` (run as `npm run check:static`, wired into CI
after `npm run build`) reads `.next/prerender-manifest.json` and fails if any
expected static page or SSG route has regressed to dynamic, or if the
prerendered-path count collapses. A stray `searchParams`/`cookies()` read or a
dropped `generateStaticParams` will fail the build instead of silently shipping.

## Build profiles

Production deploys and CI use a **full** build profile: `prebuild` rebuilds the
DB, verifies media, exports the downloadable dataset, and prerenders all ~7,400
entity pages for CDN-fast UX.

**Preview** deploys (Vercel `VERCEL_ENV=preview`, i.e. PR branches) default to
a faster profile: `generateStaticParams` samples ~24 evenly spaced ids per heavy
route (other valid ids still SSR on demand via the default `dynamicParams`),
and `export:dataset` is skipped. Override either way with
`UNITEDSTATS_BUILD_PROFILE=full|preview`. Local fast iteration:

```bash
UNITEDSTATS_BUILD_PROFILE=preview npm run build
```
