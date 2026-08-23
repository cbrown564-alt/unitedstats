# Performance

The site serves data that is **immutable between ingests** (`data/united.db` is a
pure build artifact of `data/canonical/*.json`, rebuilt in `prebuild`). The
performance strategy follows from that: prerender everything at build, touch
SQLite only at build, ship static HTML from the CDN.

## Update strategy (decided)

Post-launch the dataset grows by **one match at a time**, a few times a week.

**Decision, revised 2026-08-22: static export, ordinary deploys after data
ingests.** The live site is `output: "export"`. There are no Functions, ISR, or
runtime SQLite. Predictable transfer matters more than the roughly 15-minute
full-build latency.

| Phase | What runs | Build time |
| --- | --- | --- |
| Code deploy (PR / UI) | Preview build profile — sample SSG | ~2 min |
| Code deploy (production merge) | Full build — all SSG | ~15 min |
| Data ingest (2–3×/week) | Full production build and deploy | ~15 min |

### How a data ingest works

```
GitHub Actions (update-results.yml)
  1. append new match to data/canonical/
  2. npm run validate && npm run build:db && npm run export:dataset
  3. git commit + push
  4. Vercel runs a full production static export and deploys `out/`
```

### Runtime database

`prebuild` compiles `data/united.db` from canonical JSON. `next build` reads it
once and writes HTML, RSC, and JSON into `out/`. The live site never opens
SQLite. Do not reintroduce `UNITEDSTATS_DB_BLOB_URL`.

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
| Page render mode | `○` static or `●` SSG (params); no request-time Functions |
| TTFB (pages) | CDN-static (no per-request DB) |
| LCP | < 2.0s |
| INP | < 200ms |
| CLS | < 0.05 |
| First Load JS (per route) | < 150 KB; chart-heavy routes < 200 KB |
| Runtime DB access | none from page routes (build-time only) |
| Aggregate `.next` output | ≤ 2,000 MB preview; ≤ 3,250 MB full |

## Route disposition (achieved)

`next build` with `output: "export"` prerenders the archive as static files:

- **Static `○`:** `/`, `/managers`, `/transfers`, `/explore`, `/data`,
  `/analytics`, `/matches`, `/players`, `/seasons`, `/search`, `/compare`,
  `/cut`, `/surprise`. URL state is applied in the browser over exported JSON.
- **SSG `●` (`generateStaticParams` + `dynamicParams=false`):** `/match/[id]`,
  `/player/[id]`, `/seasons/[season]`, `/opponent/[id]`, `/manager/[id]`,
  `/questions/[slug]`, `/on-this-day/[monthDay]`, `/cut/[slug]`,
  `/stories/[slug]`. Full builds prerender every id; preview builds sample
  heavy routes and 404 the rest.
- **API:** `/api/v1/*` and `/api/health` are build-generated JSON. Query-shaped
  match and search APIs were replaced by `/data/matches-catalog.json` and
  `/data/search-index.json`. The unfiltered `/matches` spine is omitted from
  the static HTML and rebuilt from the catalog in the browser.

## M3 — SQLite out of the request path

Every exported route touches SQLite **only at build**. The live site never
opens the database. Client search and match filters read the two JSON dumps
written by `scripts/export-client-data.ts`.

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
- **Transformations:** fixed-size player and manager portraits are already
  compact, locally cached WebPs. `PlayerPortrait` serves them unoptimized to
  avoid paid width/format variants. Large editorial images ship at authoring size.

## M6 — regression guard

`scripts/check-static-render.mjs` (run as `npm run check:static`, wired into CI
after `npm run build`) reads `.next/prerender-manifest.json` and fails if any
expected static page or SSG route has regressed to dynamic, or if the
prerendered-path count collapses. A stray `searchParams`/`cookies()` read or a
dropped `generateStaticParams` will fail the build instead of silently shipping.

## Post-launch product-pass measurement — 2026-07-14

Both measurements started from a removed `.next` directory and used the preview
profile, so they describe current output rather than a stale development tree.

| Measurement | Before Phases 1–8 | After Phases 1–8 | Budget |
| --- | ---: | ---: | ---: |
| `.next` output | 166.1 MB | 166.3 MB | 2,000 MB |
| Largest gzipped HTML | 113.5 KB on Explore | 147.1 KB on Alex Ferguson | 180 KB |
| Rooney HTML | 94.8 KB | 95.2 KB | 180 KB |
| Largest gzipped RSC | not separately recorded | 88.4 KB | 120 KB |
| Largest gzipped JS chunk | 101.7 KB | 101.7 KB | 120 KB |

The clean preview recheck generated 204 static pages. The static-render guard
reported five static pages, five SSG route families, and 189 prerendered paths.

The 2026-07-25 Vercel usage review overturned the earlier dense-link prefetch
assumption: 1.2M Edge Requests and 4.1M ISR read units were disproportionate to
recorded browser traffic. Repeated archive and search-result links now set
`prefetch={false}`; primary navigation and authored editorial doors retain
Next.js prefetching.

The clean full-profile build generated 7,829 static pages and 7,814 manifest
paths. Its `.next` tree is 3,026.0 MB. Investigation found 2.3 GB under the match
route family: 944 MB of HTML, 431 MB of full RSC, and about 860 MB of Next 16
segment-prefetch RSC across 6,028 receipts. This is aggregate corpus output, not
a large-page regression: the same build stays below the 180/120/120 KB
HTML/RSC/JS route limits. The full-profile aggregate budget is therefore 3,250
MB, while preview remains capped at 2,000 MB; one shared 3.25 GB limit would
hide preview amplification.

The Vercel CLI source manifest is a separate concern from `.next` output.
Without `.vercelignore`, local raw ingest data, rendered films, screenshots, and
working audio made the upload manifest 1.75 GB and included a local `.env`.
The deployment ignore list keeps canonical build inputs and the 493 KB homepage
clip while excluding those working trees. The verified production manifest is
1,028 files / 67.4 MB; both preview and full builds recreate `data/united.db`
from canonical JSON in Vercel.

## Build profiles

Production deploys and CI use a **full** build profile: `prebuild` rebuilds the
DB, verifies media, exports the downloadable dataset, and prerenders all ~7,400
entity pages for CDN-fast UX.

**Preview** deploys (Vercel `VERCEL_ENV=preview`, i.e. PR branches) default to
a faster profile: `generateStaticParams` samples ~24 evenly spaced ids per heavy
route (other valid ids 404 — `dynamicParams = false`), and `export:dataset` is
skipped. Override either way with `UNITEDSTATS_BUILD_PROFILE=full|preview`.
Local fast iteration:

```bash
UNITEDSTATS_BUILD_PROFILE=preview npm run build
```
