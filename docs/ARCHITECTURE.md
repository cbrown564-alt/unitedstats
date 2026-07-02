# Architecture

**Red Thread** is the exhaustive history of Manchester United — every match since
1886, with progressively deeper lineups and goal contributions for every
competition. Repository name: **unitedstats**. A spiritual successor to
stretfordend.co.uk with a nostalgia-first web UI, a zero-cost auto-update
pipeline, and a public dataset/API.

## Goals, in priority order

1. **The deepest open record of Manchester United matches and players.** Canonical,
   versioned, queryable data: matches, lineups, goal events, managers,
   opponents, attendance, competitions, transfers.
2. **A robust, free, low-maintenance update pipeline.** New results flow in
   automatically after each game with no servers to babysit and no paid APIs.
3. **A web UI that makes history feel alive** — a served match-night spark on
   the front door, authored discovery lenses on top of the record, auditable
   entity pages, and coverage grades at every interpretation point.

## System overview

```
┌─────────────────────────  GitHub repo (single source of truth)  ─────────────────────────┐
│                                                                                          │
│  data/canonical/            pipeline/                 data/united.db        app/         │
│  ├─ matches/<season>.json   ├─ update.ts  (cron) ──►  (SQLite, built  ──►   Next.js 16   │
│  ├─ players.json            ├─ build-db.ts            from canonical        App Router   │
│  ├─ transfers.json          ├─ ingest/* (one-off      JSON at build         + Tailwind 4 │
│  ├─ player-media.json       │   historical loaders)   time, read-only       reads the DB │
│  └─ …reference files        └─ validate.ts            at runtime)           server-side  │
│                                                                                          │
│  public/dataset/  ◄── export:dataset (CSV/JSON flat files for download)                │
│  public/media/    ◄── cache:media (local WebP portraits)                                 │
└──────────────┬───────────────────────────────────────────────────────────────────────────┘
               │ GitHub Actions cron (post-match windows)
               ▼
   openfootball/england (free, maintained, no key)
   transfermarkt-datasets (modern enrichment)
   MUFCInfo / Wikipedia / Wikidata (historical depth)
   optional: football-data.org (keyed backup)
               │
               ▼
   Vercel: bundled united.db in every function + optional Blob freshness upgrade
           path revalidation (~25 paths) can skip full redeploy on data-only commits
```

### Key decisions

**The database is a build artifact; canonical data lives as JSON in git.**

- `data/canonical/matches/<season>.json` — one file per season (126 seasons),
  human-readable, diff-friendly. Every match with its events, lineup, and metadata.
- Reference files alongside seasons: `players.json`, `managers.json`,
  `transfers.json`, `player-media.json`, `player-positions.json`, and more.
- `scripts/build-db.ts` compiles canonical JSON → `data/united.db` (SQLite)
  and precomputes analytics tables (Elo, aggregates, search index). Runs in
  `prebuild`.
- The app queries SQLite read-only via `better-sqlite3`. The whole dataset is
  ~60 MB — comfortably bundled with the deployment via
  `outputFileTracingIncludes` in `next.config.ts`. No database server, no
  connection strings, no cost.

**Why SQLite-in-repo instead of Postgres?**

- The data is small, append-only (one new match every few days, ~60/season),
  and overwhelmingly read. A serverful DB adds cost and ops burden for zero
  benefit. Git gives us versioning, review, and rollback of the *data itself*.

**Runtime freshness without a full redeploy.**

- Every deploy bundles `data/united.db` as the **floor** — the site never 500s
  on a missing blob (`lib/db.ts`).
- When configured (`UNITEDSTATS_DB_BLOB_URL`), `instrumentation.ts` prewarms
  a fresh copy from Vercel Blob into `/tmp` on cold start; `resetDb()` does the
  same after ingest revalidation.
- After each data commit the pipeline can call `npm run upload:db` and
  `npm run revalidate` to refresh ~25 cached paths without rebuilding the app
  (`scripts/vercel-should-build.mjs` skips git deploys when blob revalidation
  is configured). See `docs/PIPELINE.md` and `docs/INCIDENT-2026-06-30-runtime-db.md`.

**Update pipeline = GitHub Actions, not a server.**

- A scheduled workflow runs after typical match windows, pulls the latest
  results from openfootball, appends to season JSON, validates, rebuilds the DB,
  exports flat files, optionally uploads the blob, commits, and revalidates.
- `transfermarkt-datasets` is the preferred modern enrichment source for events,
  cards, substitutions, and lineups. Historical depth comes from MUFCInfo match
  pages, Wikipedia season and match articles, and Wikidata/Commons media.

**Rendering strategy.**

- Historical data is immutable between ingests, so the default is **prerender at
  build, serve static HTML from the CDN** for entity pages and catalogue routes.
  ~7,400 paths prerender on full builds; the render-mode disposition is enforced
  by CI (`npm run check:static`).
- A handful of routes are **dynamic by design** — the homepage spark
  (`TonightHero`) must reflect the real calendar date; search and facet tools
  are query-shaped. These use `revalidate = 86400` or `force-dynamic` as
  appropriate.
- Data freshness between deploys is handled by the blob + revalidation path
  above, not by ad-hoc ISR on every page.

## Route map

### Primary pages

| Route | Role |
|---|---|
| `/` | Front door: served match-night spark + record skyline + search |
| `/explore` | Discover hub: questions, curated debates, curated cuts |
| `/matches` | Filterable full fixture record |
| `/match/[id]` | Match detail: flow, lineup, events, correction pickables |
| `/seasons`, `/seasons/[season]` | Season ledger and single-season depth |
| `/players`, `/player/[id]` | Player register and career pages |
| `/managers`, `/manager/[id]` | Manager succession and tenure pages |
| `/opponent/[id]` | Opponent fixture history (no `/opponents` index — redirects to `/search`) |
| `/analytics` | Elo timeline, reliability curve, Monte Carlo season replay |
| `/transfers` | Transfer ledger and record deals |
| `/data` | Coverage ledger, sources, gaps queue, dataset downloads |
| `/compare` | Curated debates and head-to-head comparison |
| `/cut` | Curated record cuts only (fork URLs redirect to `/explore`) |
| `/questions/[slug]` | Authored myth/answer depth pages (4 active; archived slugs noindex) |
| `/surprise` | Curated “something you didn't know” with re-roll |
| `/on-this-day`, `/on-this-day/[monthDay]` | Calendar-date match history |
| `/search` | Full-text search + entity browse |
| `/corrections` | Structured correction builder → GitHub issues |
| `/feedback` | General feedback via embedded Google Form |

### Redirects (`next.config.ts`)

- `/questions` → `/explore`
- `/questions/ferguson`, `/questions/decline` → `/questions/ferguson-era`
- `/opponents` → `/search`
- `/analytics/odds` → `/analytics`
- `/analytics/travel` → `/questions/away-days`

### Route render-mode disposition

Enforced by `scripts/check-static-render.mjs` after `npm run build`. A regression
here fails CI.

| Mode | Routes | Notes |
|---|---|---|
| **Static `○`** | `/analytics`, `/data`, `/explore`, `/managers`, `/transfers` | Prerendered at build |
| **SSG `●`** | `/match/[id]`, `/player/[id]`, `/manager/[id]`, `/opponent/[id]`, `/seasons/[season]`, `/questions/[slug]`, `/on-this-day/[monthDay]` | `generateStaticParams`; full builds prerender all ids; preview builds sample (~24 per heavy route) |
| **Dynamic `ƒ` by design** | `/` | `TonightHero` serves the real calendar date per request |
| **Dynamic + ISR** | `/matches`, `/players`, `/seasons`, `/search`, `/compare`, `/cut` | `revalidate = 86400`; URL-state tools over deploy-immutable data |
| **Dynamic `ƒ`** | `/surprise`, `/on-this-day` (index redirect) | Per-request curation / redirect |
| **API `ƒ`** | `/api/v1/*`, `/api/search`, `/api/revalidate`, `/api/health` | Read-only public API; search uses `no-store` |

Dynamic page routes and API handlers share the immutable dataset cache policy
(`public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`) except
search, which is `no-store`.

### Regression guards (CI)

- `npm run check:static` — reads `.next/prerender-manifest.json` and fails if an
  expected static/SSG route regresses to dynamic or the prerendered-path count
  collapses below 5,000 (50 on preview builds).
- `npm run check:perf` — fails on built-artifact regressions: max gzipped HTML
  180 KB, max gzipped RSC 120 KB, max gzipped JS chunk 120 KB, max `.next`
  output 2 GB. Long-tail archives switch to season-summary rows with filtered
  match-browser links once they cross the long-list threshold.
- recharts (~348 KB) is route-split and lazy-mounted (`ssr: false` wrappers with
  height-reserved skeletons) everywhere except `/analytics`, whose Elo hero chart
  is above the fold. Fonts self-host via `next/font/google`; portraits use
  `next/image` with `priority` on player-hero LCP, served from cached local WebP
  (`public/media/**`), never hotlinked Wikimedia.

## UI architecture

**Shell.** `components/SiteShell.tsx` wraps every page: desktop collapsible
sidebar (`SidebarNav` + `lib/navSections.ts`), mobile floating glass pill nav
(`components/mobile/MobileBottomNav.tsx`), command-palette search, and footer
links to corrections and feedback. View transitions are enabled via
`experimental.viewTransition` in `next.config.ts`.

**Three product layers** (see `PRODUCT.md`, `CONTEXT.md`):

1. **Spark** — emotional first contact (`TonightHero`, `/surprise`, `/on-this-day`).
2. **Deepening** — authored lenses (`/explore`, `/questions/[slug]`, `/compare`, curated `/cut`).
3. **Foundation** — the auditable record (`/matches`, entity pages, `/data`).

**Mobile.** Phone-first patterns documented in `docs/MOBILE.md`: bottom sheets,
sticky match heroes with section tabs, chapter pager on `/analytics`, match
ledger cards on list views.

## Repository layout

```
app/                    Next.js App Router pages
  page.tsx              homepage (dynamic spark)
  explore/              discover hub
  matches/              filterable archive
  match/[id]/           match detail
  seasons/              season index + [season]
  players/              player register + [id]
  managers/             manager index + [id]
  opponent/[id]/        opponent entity (no index)
  analytics/            Elo + reliability + replay
  transfers/            transfer ledger
  data/                 coverage ledger + downloads
  compare/              head-to-head lenses
  cut/                  curated cuts only
  questions/[slug]/     authored myth pages
  surprise/             curated wanderer
  on-this-day/          calendar history
  search/               full-text search
  corrections/          correction builder
  feedback/             feedback form
  api/                  health, search, revalidate, v1 REST API
components/             UI components (charts, match archive, mobile shell, …)
lib/                    db access (db.ts), queries, format, questions, cut, compare, …
data/
  canonical/            source of truth (JSON, in git)
  raw/                  downloaded open datasets (gitignored, reproducible)
  united.db             built SQLite artifact (gitignored; rebuilt in prebuild)
public/
  dataset/              exported CSV/JSON flat files (gitignored on preview builds)
  media/                cached WebP portraits (gitignored; rebuilt in prebuild)
scripts/                build-db.ts, validate.ts, ingest/*, check-*, export-*
pipeline/               update.ts — the recurring fetch-and-append job
.github/workflows/      update-results.yml (cron), ci.yml
docs/                   this folder
```

## Data sources

Current scale: **6,028 matches**, **6,022 with validated United starting XIs**,
**72,095 United appearances**, **975 match-attributed assists** (2012-13+),
**1,967 transfers**, **984 players**. See `public/dataset/manifest.json` and
`/data` for live coverage grades.

| Era / scope | Source | Coverage |
|---|---|---|
| League 1892– | engsoccerdata (jalapic) | every league result |
| FA Cup 1886–2019 | engsoccerdata facup | results, venues, attendance |
| Current + recent seasons | openfootball/england | maintained per-matchday results |
| FA Cup 2019–, League Cup, Europe | curated canonical JSON + pipeline | results & metadata |
| Scorers | Wikipedia season articles / MUFCInfo / transfermarkt | ~99% of matches United scored in |
| Lineups | MUFCInfo, Wikipedia match articles, transfermarkt-datasets | 6,022/6,028 matches with full XI |
| Assists (match-attributed) | transfermarkt-datasets | 975 events, 2012-13 onward only |
| Transfers | MUFCInfo transfer archive | 1,967 recorded transfers |
| Player media & positions | Wikidata / Wikimedia Commons | portraits + P413 positions |
| Player career totals | Wikipedia player lists | register cross-check |
| Season aggregates (Ferguson era) | Curated Tableau lane | season-level goals/assists by type — not match-attributed |
| Managers, stadiums, competitions | curated reference JSON | complete club history |

The enrichment strategy is **progressive**: the schema supports full per-match
detail from day one; sources are layered in over time without schema changes.
Provenance and honest limits: `docs/SOURCE-AUDIT.md`. Schema: `docs/DATA-MODEL.md`.

## Public API and exports

**REST API** at `/api/v1/*`:

- `GET /api/v1/meta` — build timestamp, match count, coverage summary
- `GET /api/v1/matches`, `/matches/[id]`, facet/chip-count/view helpers
- `GET /api/v1/players`, `/players/[id]`
- `GET /api/v1/seasons`, `/seasons/[season]`
- `GET /api/v1/managers`, `/opponents`, `/competitions`
- `GET /api/v1/answers`, `/answers/cuts/[slug]` — machine-readable curated answers

**Flat exports** at `/dataset/*` — CSV/JSON files rebuilt by `npm run export:dataset`
on full-profile builds. Manifest at `/dataset/manifest.json`.

**Search** at `/api/search` (typeahead) and `/search` (full results page). Click
tracking at `/api/search/click` (robots-disallowed).

## Structured data and machine answers

Launch surfaces expose structured data so crawlers and assistants can cite
without turning generated facts into unattributed snippets:

| Surface | Route | schema.org type |
|---|---|---|
| Match entity | `/match/[id]` | `SportsEvent` (only here — an actual completed fixture) |
| Curated Cut answer API | `/api/v1/answers/cuts/[slug]` | JSON answer payload |

**ID and version policy.** All public IDs come from `lib/citations.ts`
(`matchRef`, `cutRef`/`answerRef`). Machine-answer `version` values are
`claimVersion()` hashes of the stable answer payload — no wall-clock timestamps,
change only when canonical inputs or generated claim content changes.

**Crawl policy.** `/api/v1` is read-only public data, so robots allows `/api/v1/`
and the answer routes beneath it; side-effect endpoints (`/api/search/click`)
are disallowed. `/llms.txt`, `/sitemap.xml`, JSON-LD source names, and `apiJson`
attribution all share one source name: *Red Thread, the open Manchester United
match history*. Answer routes stay dynamic (handlers read SQLite on demand) and
return the shared immutable dataset cache headers via `apiJson`.

## Corrections and trust

- **`/data`** — coverage matrix, source register, gaps queue with per-row
  explanations, developer appendix with API/file references.
- **`/corrections`** — structured builder that prefills GitHub issues from
  match-page pickables or manual entry. Contract: `docs/CORRECTIONS.md`.
- **`/feedback`** — general product feedback via embedded Google Form.
- Every aggregate in the UI carries a coverage grade where interpretation
  depends on data completeness.

## Related docs

| Doc | Purpose |
|---|---|
| `docs/DATA-MODEL.md` | Schema of record |
| `docs/PIPELINE.md` | Auto-update, blob upload, revalidation |
| `docs/SOURCE-AUDIT.md` | Coverage limits and provenance |
| `docs/CORRECTIONS.md` | Public correction workflow |
| `docs/MOBILE.md` | Mobile shell patterns |
| `docs/HOMEPAGE.md` | Front-door spark design |
| `docs/PERF.md` | CI performance budgets |
| `PRODUCT.md` | Product definition |
| `README.md` | Onboarding and scripts |
