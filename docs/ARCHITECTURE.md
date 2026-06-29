# Architecture

UnitedStats is the exhaustive history of Manchester United — every match, with
progressively deeper lineups and goal contributions for every competition since Newton Heath's
first league season in 1892. A spiritual successor to stretfordend.co.uk with a
modern UI, a zero-cost auto-update pipeline, and a deep analytics layer.

## Goals, in priority order

1. **The deepest backend of Manchester United matches and players.** Canonical,
   versioned, queryable data: matches, lineups, goal events, managers,
   stadiums, attendance, competitions.
2. **A robust, free, low-maintenance update pipeline.** New results flow in
   automatically after each game with no servers to babysit and no paid APIs.
3. **A beautiful web UI** that brings the data to life: match deep dives,
   player analysis, seasonal trends, predictive and spatial analytics.

## System overview

```
┌─────────────────────────  GitHub repo (single source of truth)  ─────────────────────────┐
│                                                                                          │
│  data/canonical/            pipeline/                 data/united.db        app/         │
│  ├─ matches/<season>.json   ├─ update.ts  (cron) ──►  (SQLite, built  ──►   Next.js 16   │
│  ├─ players.json            ├─ build-db.ts            from canonical        App Router   │
│  ├─ managers.json           ├─ ingest/* (one-off      JSON at build         + Tailwind 4 │
│  ├─ stadiums.json           │   historical loaders)   time, read-only       reads the DB │
│  └─ competitions.json       └─ validate.ts            at runtime)           server-side  │
│                                                                                          │
└──────────────┬───────────────────────────────────────────────────────────────────────────┘
               │ GitHub Actions cron (post-match windows)            Vercel deploy on push
               ▼
   openfootball/england (free, maintained, no key)
   transfermarkt-datasets (modern enrichment)
   API-Football / football-data.org (optional keyed backups)
```

### Key decisions

**The database is a build artifact; canonical data lives as JSON in git.**
- `data/canonical/matches/<season>.json` — one file per season, human-readable,
  diff-friendly. Every match with its events, lineup, and metadata.
- `scripts/build-db.ts` compiles canonical JSON → `data/united.db` (SQLite)
  and precomputes analytics tables (Elo, aggregates). Runs in `prebuild`.
- The app queries SQLite read-only via `better-sqlite3`. The whole dataset is
  ~20–40 MB — comfortably bundled with the deployment. No database server,
  no connection strings, no cost, nothing to maintain.

**Why SQLite-in-repo instead of Postgres?**
- The data is small, append-only (one new match every few days, ~60/season),
  and overwhelmingly read. A serverful DB adds cost and ops burden for zero
  benefit. Git gives us versioning, review, and rollback of the *data itself*.

**Update pipeline = GitHub Actions, not a server.**
- A scheduled workflow runs after typical match windows, pulls the latest
  results from openfootball (plain-text fixtures, community-maintained,
  no API key), extracts new United matches, appends them to the season JSON,
  validates, rebuilds the DB, and commits. The push triggers a Vercel deploy.
- `transfermarkt-datasets` is the preferred modern enrichment source for
  events, cards, substitutions, and lineups. Keyed APIs such as API-Football
  or football-data.org can be added as backups; the result pipeline works
  without them.

**Rendering strategy.**
- Almost everything is static: matches from 1892 don't change. Pages are
  server components reading SQLite at request/build time; the heavy analytics
  aggregates are precomputed into the DB so pages stay simple SELECTs.
- A new deploy (triggered by the data commit) refreshes everything. No ISR
  invalidation logic to maintain.
- The dataset is immutable between ingests, so the goal is **prerender at build,
  touch SQLite only at build, serve static HTML from the CDN.** ~7,400 pages
  prerender; the render-mode disposition is enforced by CI (see below).

**Route render-mode disposition** (a regression here fails the build):

- **Static `○`:** `/`, `/managers`, `/transfers`, `/explore`, `/data`,
  `/opponents`, `/analytics` (`/opponents` filters client-side; `/analytics` runs
  its forecast client-side over build-precomputed odds).
- **SSG `●`** (`generateStaticParams` + `dynamicParams=false`): `/match/[id]`,
  `/player/[id]`, `/seasons/[season]`, `/opponent/[id]`, `/manager/[id]`.
  Sort/expand interactions are client islands.
- **Dynamic `ƒ` by design:** `/matches`, `/players`, `/seasons` index, `/search`,
  `/compare` — URL-state tools over deploy-immutable data, too heavy or
  query-shaped to prerender. They share the read-only API cache policy
  (`public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`).
- Only the dynamic page routes above plus `/api/v1/*` and `/api/search` handlers
  touch SQLite at runtime. The public API stays dynamic (static-generating ~7k
  `[id]` endpoints would double build output for a secondary feature) and leans
  on the same CDN cache headers.

**Regression guards (CI):**

- `npm run check:static` (`scripts/check-static-render.mjs`, after `npm run
  build`) reads `.next/prerender-manifest.json` and fails if an expected
  static/SSG route regresses to dynamic or the prerendered-path count collapses —
  so a stray `searchParams`/`cookies()` read or a dropped
  `generateStaticParams` fails the build instead of silently shipping.
- `npm run check:perf` (`scripts/check-perf-budgets.mjs`, after `npm run build`)
  fails on built-artifact regressions: max gzipped HTML 180 KB, max gzipped RSC
  120 KB, max gzipped JS chunk 120 KB, max `.next` output 2 GB. Long-tail
  archives (manager/opponent/player) switch to season-summary rows with filtered
  match-browser links once they cross the long-list threshold, keeping pages
  within budget.
- recharts (~348 KB) is route-split and lazy-mounted (`ssr: false` wrappers with
  height-reserved skeletons) everywhere except `/analytics`, whose Elo hero chart
  is above the fold. Fonts self-host via `next/font/google`; portraits use
  `next/image` with `priority` on player-hero LCP, served from cached local WebP
  (`public/media/**`), never hotlinked Wikimedia.

## Repository layout

```
app/                    Next.js App Router pages + components
  (site)/               main UI routes: /, /matches, /match/[id], /seasons,
                        /seasons/[season], /players, /player/[id],
                        /managers, /manager/[id], /opponents/[id], /analytics
lib/                    db access (db.ts), query helpers, formatting
data/
  canonical/            source of truth (JSON, in git)
  raw/                  downloaded open datasets (gitignored, reproducible)
  united.db             built SQLite artifact (in git so deploys are hermetic)
scripts/                build-db.ts, validate.ts, ingest/* loaders
pipeline/               update.ts — the recurring fetch-and-append job
.github/workflows/      update-results.yml (cron), ci.yml
docs/                   this folder
```

## Data sources

| Era / scope | Source | Coverage |
|---|---|---|
| League 1892–2025 | engsoccerdata (jalapic) | every league result, 4,784 matches |
| FA Cup 1886–2019 | engsoccerdata facup | results, venues, attendance |
| Current + recent seasons | openfootball/england | maintained per-matchday results |
| FA Cup 2019–, League Cup, Europe | curated canonical JSON + pipeline | results & metadata |
| Scorers | Wikipedia season articles / curated | 10,000+ goal events |
| Lineups | transfermarkt-datasets / Wikipedia final and late-round match articles | 836 matches live; modern coverage from 2013 onward |
| Managers, stadiums, competitions | curated reference JSON | complete club history |

The enrichment strategy is **progressive**: the schema supports full per-match
detail (lineups, events with player + minute + type) from day one; sources are
layered in over time without schema changes. See PIPELINE.md.

## Structured data and machine answers

The launch surfaces expose structured data so crawlers and assistants can cite
without turning generated facts into unattributed snippets:

| Surface | Route | schema.org type |
|---|---|---|
| Match entity | `/match/[id]` | `SportsEvent` (only here — an actual completed fixture) |
| Curated Cut answer API | `/api/v1/answers/cuts/[slug]` | JSON answer payload (the public contract is the `/api/v1` model, not a page) |

**ID and version policy.** All public IDs come from `lib/citations.ts`
(`matchRef`, `cutRef`/`answerRef`). Machine-answer `version` values are
`claimVersion()` hashes of the stable answer payload — no wall-clock timestamps,
change only when canonical inputs or generated claim content changes.

**Crawl policy.** `/api/v1` is read-only public data, so robots allows `/api/v1/`
and the answer routes beneath it; side-effect endpoints (`/api/search/click`)
are disallowed. `/llms.txt`, `/sitemap.xml`, JSON-LD source names, and `apiJson`
attribution all share one source name: *UnitedStats, the open Manchester United
match history*. The answer routes currently stay dynamic (handlers read SQLite on
demand) and return the shared immutable dataset cache headers via `apiJson`:
browser `max-age=300`, edge `s-maxage=86400`, `stale-while-revalidate=604800`.
