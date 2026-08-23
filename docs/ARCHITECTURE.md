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
3. **A web UI that makes history feel alive** — a silent 20-second cross-era
   opening followed by a served match-night, authored discovery lenses on top
   of the record, auditable entity pages, and coverage grades at every
   interpretation point.

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
│  public/media/    ◄── cache:media (explicit refresh; builds reconcile tracked WebPs)      │
└──────────────┬───────────────────────────────────────────────────────────────────────────┘
               │ GitHub Actions cron (post-match windows)
               ▼
   openfootball/england (free, maintained, no key)
   transfermarkt-datasets (modern enrichment)
   MUFCInfo / Wikipedia / Wikidata (historical depth)
   Transfermarkt + MUFCInfo (free match-sheet enrichment)
               │
               ▼
   Vercel: static export (`out/`); every data commit produces a complete
           production build and deployment
```

### Key decisions

**The database is a build artifact; the live site is a static export.**

- `data/canonical/matches/<season>.json` — one file per season (126 seasons),
  human-readable, diff-friendly. Every match with its events, lineup, and metadata.
- Reference files alongside seasons: `players.json`, `managers.json`,
  `transfers.json`, `player-media.json`, `player-positions.json`, and more.
- `scripts/build-db.ts` compiles canonical JSON → `data/united.db` (SQLite)
  and precomputes analytics tables (Elo, aggregates, search index). Runs in
  `prebuild`.
- `next build` with `output: "export"` queries SQLite read-only via
  `better-sqlite3` and writes HTML, RSC, JSON, and media into `out/`. There is
  no runtime database, no Vercel Functions, and no ISR. No connection strings,
  no cost.

**Why SQLite-in-repo instead of Postgres?**

- The data is small, append-only (one new match every few days, ~60/season),
  and overwhelmingly read. A serverful DB adds cost and ops burden for zero
  benefit. Git gives us versioning, review, and rollback of the *data itself*.

**Deploy-time database freshness.**

- `prebuild` compiles `data/united.db` from canonical JSON; `next build`
  reads that file once and writes the static export. The live site never
  opens SQLite.
- Data commits trigger ordinary production deployments. The previous Blob
  freshness path is gone: do not reintroduce `UNITEDSTATS_DB_BLOB_URL`. See
  `docs/PIPELINE.md` and `docs/VERCEL-HOBBY-ASSESSMENT.md`.

**Update pipeline = GitHub Actions, not a server.**

- A scheduled workflow runs after typical match windows, pulls the latest
  results from openfootball, appends to season JSON, validates, rebuilds the DB,
  exports flat files, and commits. Vercel deploys that commit normally.
- `transfermarkt-datasets` is the preferred modern enrichment source for events,
  cards, substitutions, and lineups. Historical depth comes from MUFCInfo match
  pages, Wikipedia season and match articles, and Wikidata/Commons media.

**Rendering strategy.**

- Historical data is immutable between ingests, so the site is a real
  `output: "export"` build: HTML, RSC, JavaScript, JSON, and pre-sized media
  with no Vercel Functions, ISR, or runtime SQLite. ~7,400 entity paths
  prerender on full builds; CI enforces that with `npm run check:static`.
- Date-based homepage spark selection and Surprise re-rolls run in the browser
  over build-generated catalogs. Search, match filters, and curated compares
  read exported JSON (`public/data/search-index.json`,
  `public/data/matches-catalog.json`) instead of request-shaped APIs. The
  unfiltered `/matches` result spine is rebuilt from that catalog after
  hydration so the static HTML stays inside the gzip budget.
- Data freshness follows deployments. Do not reintroduce
  `UNITEDSTATS_DB_BLOB_URL` or a hosted SQL database.

## Route map

### Primary pages

| Route | Role |
|---|---|
| `/` | Front door: 20-second opening thread → served match-night → record skyline + search |
| `/explore` | Discover hub: authored questions and curated debates |
| `/matches` | Filterable full fixture record |
| `/match/[id]` | Match detail: flow, lineup, events, correction pickables |
| `/seasons`, `/seasons/[season]` | Season ledger and single-season depth |
| `/players`, `/player/[id]` | Player register and career pages |
| `/managers`, `/manager/[id]` | Manager succession and tenure pages |
| `/opponent/[id]` | Opponent fixture history (no `/opponents` index — redirects to `/search`) |
| `/analytics` | Elo timeline, reliability curve, Monte Carlo season replay |
| `/transfers` | Transfer ledger and record deals |
| `/data` | Coverage ledger, sources, gaps queue, dataset downloads |
| `/compare` | Curated debates (query-string pairs resolve from build-time payloads) |
| `/cut`, `/cut/[slug]` | `noindex` saved/API receipts for registered cuts |
| `/questions/[slug]` | Authored myth/answer depth pages (4 active; archived slugs noindex) |
| `/surprise` | Reviewed match-night rediscovery with re-roll |
| `/on-this-day`, `/on-this-day/[monthDay]` | Exact match/transfer calendar moments with an explicitly nearby reviewed fallback |
| `/search` | Full-text search + entity browse |
| `/corrections` | Structured correction builder → GitHub issues |
| `/feedback` | General feedback via embedded Google Form |

### Redirects (`vercel.json`)

Static export cannot use `next.config` redirects. Legacy paths are host
redirects:

- `/questions/ferguson`, `/questions/decline` → `/questions/ferguson-era`
- `/opponents` → `/search`
- `/analytics/odds` → `/analytics`
- `/analytics/travel` → `/questions/away-days`
- `/journey` and `/journey/*` → the published `/stories/*` homes

### Route render-mode disposition

Every App Router page is statically generated. Enforced by
`scripts/check-static-render.mjs` after `npm run build`.

| Mode | Routes | Notes |
|---|---|---|
| **Static** | `/`, `/analytics`, `/data`, `/explore`, `/managers`, `/transfers`, `/matches`, `/players`, `/seasons`, `/search`, `/compare`, `/cut`, `/surprise` | Prerendered HTML; URL state is applied on the client |
| **SSG `●`** | `/match/[id]`, `/player/[id]`, `/manager/[id]`, `/opponent/[id]`, `/seasons/[season]`, `/questions/[slug]`, `/on-this-day/[monthDay]`, `/cut/[slug]` | `generateStaticParams` + `dynamicParams = false`; preview builds sample heavy routes |
| **API** | `/api/v1/*`, `/api/health` | Build-generated JSON files; query-shaped match/search APIs were replaced by client catalogs |

### Regression guards (CI)

- `npm run check:static` — reads `.next/prerender-manifest.json` and fails if an
  expected static/SSG route regresses to dynamic or the prerendered-path count
  collapses below 5,000 (50 on preview builds).
- `npm run check:perf` — fails on built-artifact regressions: max gzipped HTML
  180 KB, max gzipped RSC 120 KB, max gzipped JS chunk 120 KB, and aggregate
  `.next` output of 2,000 MB for preview or 3,250 MB for full builds. Next 16
  writes HTML, full RSC, and segment-prefetch RSC for each of the 6,028 match
  paths; the profile-specific aggregate limit prevents that expected corpus
  cost from weakening the per-route budgets. Long-tail archives switch to
  season-summary rows with filtered match-browser links once they cross the
  long-list threshold.
- recharts (~348 KB) is route-split and lazy-mounted (`ssr: false` wrappers with
  height-reserved skeletons) everywhere except `/analytics`, whose Elo hero chart
  is above the fold. Fonts self-host via `next/font/google`; fixed-size portraits
  are served directly from cached local WebP files (`public/media/**`) with
  `next/image` transformation disabled, avoiding paid variants.
- `.vercelignore` owns CLI deployment inputs. It excludes local credentials,
  raw ingest downloads, renders, audio bake-offs, screenshots, tests, and review
  artifacts while preserving canonical data, build scripts, web assets, and the
  small `video/` source tree required by TypeScript. Remote prebuild recreates
  the bundled SQLite floor.

## UI architecture

**Shell.** `components/SiteShell.tsx` wraps every page: desktop collapsible
sidebar (`SidebarNav` + `lib/navSections.ts`), mobile floating glass pill nav
(`components/mobile/MobileBottomNav.tsx`), command-palette search, and footer
utilities. Stories, Discover, Matches, Seasons, and Players are primary;
Managers, Analytics, Transfers, and Data live under one More disclosure.
Data/downloads, API, corrections, and feedback remain in the footer. View transitions are enabled via
`experimental.viewTransition` in `next.config.ts`.

**Three product layers** (see `PRODUCT.md`, `CONTEXT.md`):

1. **Spark** — emotional first contact (`HomeThreadFilm` → `TonightHero`,
   `/surprise`, `/on-this-day`).
2. **Deepening** — authored lenses (`/explore`, `/questions/[slug]`, and curated `/compare` debates).
3. **Foundation** — the auditable record (`/matches`, entity pages, `/data`).

Registered cuts remain foundation capability for API/machine answers and saved
receipts. They do not appear in Discover, related suggestions, Surprise, or the
sitemap.

**Mobile.** Phone-first patterns documented in `docs/MOBILE.md`: bottom sheets,
sticky match heroes with section tabs, chapter pager on `/analytics`, match
ledger cards on list views.

## Repository layout

```
app/                    Next.js App Router pages
  page.tsx              homepage (static spark; client re-picks today's night)
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
  api/                  static GET dumps (health, v1 REST); no search/revalidate
components/             UI components (charts, match archive, mobile shell, …)
lib/                    db access (db.ts, build-time only), queries, format, questions, cut, compare, …
data/
  canonical/            source of truth (JSON, in git)
  raw/                  downloaded open datasets (gitignored, reproducible)
  united.db             built SQLite artifact (gitignored; rebuilt in prebuild)
public/
  dataset/              exported CSV/JSON flat files (gitignored on preview builds)
  media/                cached WebP portraits (gitignored; rebuilt in prebuild)
scripts/                build-db.ts, validate.ts, ingest/*, check-*, export-*
pipeline/               update.ts — the recurring fetch-and-append job
.github/workflows/      update-results.yml (cron), enrich-results.yml (Monday sheet check), ci.yml
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

**REST API** at `/api/v1/*` (build-generated JSON; query filters are not applied):

- `GET /api/v1/meta` — build timestamp, match count, coverage summary
- `GET /api/v1.json` — endpoint index (list dumps use a `.json` suffix so they
  do not collide with nested entity files on a static host)
- `GET /api/v1/matches.json` — first page of the archive; `/matches/[id]` for entities
- `GET /api/v1/players.json`, `/players/[id]`
- `GET /api/v1/seasons.json`, `/seasons/[season]`
- `GET /api/v1/managers`, `/opponents`, `/competitions`
- `GET /api/v1/answers.json`, `/answers/cuts/[slug]` — machine-readable curated answers
- Facet/chip-count/view helpers return the unfiltered default snapshot

**Flat exports** at `/dataset/*` — CSV/JSON files rebuilt by `npm run export:dataset`
on full-profile builds. Manifest at `/dataset/manifest.json`.

**Search** is client-side over `/data/search-index.json`. There is no `/api/search`
or click-tracking endpoint.

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

**Crawl policy.** `robots.txt` disallows `/api/`, `/dataset/`, `/search`,
`/matches`, `/surprise`, `/compare`, `/cut`, `/on-this-day`, and `/dev/`.
The sitemap is a curated discovery set (`lib/discovery.ts`): authored pages,
all seasons and managers, major players, and selected match nights — not the
full 6,028-match dump. `/llms.txt`, `/sitemap.xml`, JSON-LD source names, and
`apiJson` attribution all share one source name: *Red Thread, the open
Manchester United match history*.

## Corrections and trust

- **`/data`** — coverage matrix, source register, gaps queue with per-row
  explanations, developer appendix with API/file references.
- **`/corrections`** — structured builder that opens a GitHub issue. Deep-link
  prefill from match pickables is not available on the static export.
  Contract: `docs/CORRECTIONS.md`.
- **`/feedback`** — general product feedback via embedded Google Form.
- Every aggregate in the UI carries a coverage grade where interpretation
  depends on data completeness.

## Related docs

| Doc | Purpose |
|---|---|
| `docs/DATA-MODEL.md` | Schema of record |
| `docs/PIPELINE.md` | Auto-update, validation, build, and deployment |
| `docs/SOURCE-AUDIT.md` | Coverage limits and provenance |
| `docs/CORRECTIONS.md` | Public correction workflow |
| `docs/MOBILE.md` | Mobile shell patterns |
| `docs/HOMEPAGE.md` | Front-door spark design |
| `docs/PERF.md` | CI performance budgets |
| `PRODUCT.md` | Product definition |
| `README.md` | Onboarding and scripts |
