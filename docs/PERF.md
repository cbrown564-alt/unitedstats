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

## Route disposition

- **Static (no request input):** `/`, `/managers`, `/transfers`, `/questions`, `/data`
- **SSG via `generateStaticParams` + `dynamicParams=false`:** `/match/[id]`,
  `/manager/[id]`, `/opponent/[id]`
- **Static shell + client-side filtering** (read `searchParams` today):
  `/analytics`, `/matches`, `/players`, `/opponents`, `/search`, `/seasons`,
  `/player/[id]`, `/seasons/[season]`
- **Remains dynamic (genuine request input), HTTP-cached:** `/api/v1/matches`,
  `/api/v1/players`, `/api/search` and other searchParams API routes; `[id]` API
  routes become SSG.
