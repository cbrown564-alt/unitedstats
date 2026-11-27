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
│  data/canonical/            pipeline/ + scripts/      data/united.db        app/ + src/  │
│  ├─ matches/<season>.json   ├─ update.ts  (cron) ──►  (SQLite, built  ──►   Astro 7      │
│  ├─ players.json            ├─ build-db.ts            from canonical        + React 19   │
│  ├─ transfers.json          ├─ ingest/* (one-off      JSON at build         + Tailwind 4 │
│  ├─ player-media.json       │   historical loaders)   time, read only       + EmDash 1.5 │
│  └─ …reference files        └─ validate.ts            during prerender)                  │
│                                                                                          │
│  content/emdash/seed.json ◄── publish-editorial (snapshot of the CMS's D1 content)       │
│  public/dataset/  ◄── export:dataset (CSV/JSON flat files for download)                  │
│  public/media/    ◄── cache:media (explicit refresh; builds reconcile tracked WebPs)     │
└──────────────┬───────────────────────────────────────────────────────────────────────────┘
               │ GitHub Actions: weekly results, Monday sheet check, editorial publish
               ▼
   openfootball/england (free, maintained, no key)
   transfermarkt-datasets (modern enrichment)
   MUFCInfo / Wikipedia / Wikidata (historical depth)
               │
               ▼
   Cloudflare: one Worker (`unitedstats`) on utdred.com
     static assets  out/          every prerendered page, JSON export and image
     Worker         dist/server   EmDash admin, the four live routes, redirects
     bindings       D1 (DB)       CMS content, users and settings
                    R2 (MEDIA)    CMS uploads
                    KV (SESSION)  admin sessions
```

The move from a Next static export on Vercel to this Worker is recorded in
[ADR 0006](adr/0006-move-to-astro-for-emdash.md) and
`docs/EMDASH-MIGRATION-PLAN.md`. EmDash is the editorial CMS, and it runs only
inside Astro.

### Key decisions

**The database is a build artifact. The record is prerendered.**

- `data/canonical/matches/<season>.json`: one file per season (126 seasons),
  human-readable and diff-friendly. Every match with its events, lineup and metadata.
- Reference files alongside seasons: `players.json`, `managers.json`,
  `transfers.json`, `player-media.json`, `player-positions.json`, and more.
- `scripts/build-db.ts` compiles canonical JSON into `data/united.db` (SQLite)
  and precomputes analytics tables (Elo, aggregates, search index). It runs in
  `prebuild`.
- `astro build` queries SQLite read-only through `better-sqlite3` while it
  prerenders, and writes HTML, JSON and media into `out/`. The Worker has no
  SQLite and no hosted database.

**Why SQLite-in-repo instead of Postgres?**

- The data is small, append-only (one new match every few days, ~60/season),
  and overwhelmingly read. A serverful DB adds cost and ops burden for zero
  benefit. Git gives us versioning, review, and rollback of the *data itself*.

**Record freshness follows deployments.**

- A data commit on `master` runs `.github/workflows/deploy.yml`, which rebuilds
  the database, the prerendered pages and the Worker, then deploys. Do not
  reintroduce `UNITEDSTATS_DB_BLOB_URL` or a hosted SQL database. See
  `docs/PIPELINE.md`.

**Update pipeline = GitHub Actions, not a server.**

- A weekly Monday workflow pulls the latest results from openfootball, appends
  to season JSON, validates, rebuilds the DB, exports flat files, commits, and
  calls Deploy.
- `transfermarkt-datasets` is the preferred modern enrichment source for events,
  cards, substitutions, and lineups. Historical depth comes from MUFCInfo match
  pages, Wikipedia season and match articles, and Wikidata/Commons media.

**Editorial content lives in EmDash and is snapshotted to git.**

- Great nights, stories, questions, debates, cuts and transfer notes are edited
  in the EmDash admin (`/_emdash/admin`) and stored in D1. `lib/editorial.ts`
  reads them.
- A publish dispatches `.github/workflows/publish-editorial.yml` through the
  `record-guard` plugin (`plugins/record-guard`). The workflow snapshots
  production D1 into `content/emdash/seed.json`, checks it, commits, and calls
  Deploy, so prerendered pages and the record replay catch up. A nightly run
  catches a lost event.
- Prerendering, tests and the browser read the committed seed, never D1.
- Story bodies stay in code except *A thread of nights*. Its ten stations are
  `night` blocks in its `stories` entry (`lib/threadOfNights.ts`). A block names
  its match by ID, and its copy reads facts through tokens such as
  `{goal:Turnbull}`. A token the record can't answer fails the render and the
  publish workflow's `npm test`. The record guard checks token forms and match
  IDs on save. `tests/journey.test.ts` pins the ten match IDs in order, so
  swapping a night needs that test changed too; editing copy doesn't.

**Schema changes.** `scripts/emdash/seed-from-registries.ts` owns the schema,
meaning collections, fields and block types. Production D1 got it once, from
the setup wizard, and nothing in CI applies a later change. After merging a
schema change, and before anyone publishes:

1. In the admin, create an API token with `schema:read`, `schema:write`,
   `content:read` and `content:write`.
2. Do a dry run: `EMDASH_TOKEN=… npx tsx scripts/emdash/apply-schema.mts https://utdred.com`.
3. Run it again with `--apply`. It adds missing block types and fields,
   updates collection labels and descriptions that differ, writes any story
   body that D1 lacks, and publishes it. The publish dispatch then checks the
   D1 export against the seed.
4. Revoke the token.

Run it from a checkout of current master, since it reads that seed. D1 appends
a new field after the existing ones, so add new fields last in the generator,
or the next snapshot reorders them.

Until then `snapshot-seed.mts` refuses the export: D1 lacks what the seed
declares. So a publish fails loudly rather than overwriting the seed with less.

**Rendering strategy.**

- Page code lives in `app/` as React server and client components.
  `scripts/astro/generate-routes.mjs` writes one Astro wrapper per page into
  `src/pages/` (committed, so knip sees them as entries), and `src/rt/` renders
  each page: `render.tsx` resolves the tree, `flight.ts` embeds a hydration
  payload, and `client.tsx` hydrates only the client components on the page.
- The page code's `next/*` imports (`next/link`, `next/navigation`,
  `next/image`, `next/og`, …) resolve to small shims in
  `src/shims/`, through Vite aliases in `astro.config.mjs` and `paths` in
  `tsconfig.json`. Next itself is not installed.
- **Prerendered:** every page except the live four. Full builds prerender every
  player, opponent, season and manager, plus selected matches and the API
  exports. Entity URLs outside the build's scope (preview builds, unselected
  matches) redirect to the browser-backed record reader at `/record` or
  `/matches?season=…` (`src/worker.ts`). Publication scope is owned by
  `docs/INDEXABLE-RECORDS-SCOPE.md`.
- **Live:** `/`, `/explore`, `/stories` and `/compare`
  (`src/rt/live-routes.json`) render on the Worker for each request, with that
  request's EmDash content, so a publish shows at once. They read the record by
  replaying the queries the build recorded (`lib/dbReplay.ts`,
  `out/live-snapshot/record.json`). Each has a prerendered twin at
  `/live-snapshot/<name>`. If a live render needs record data the deploy lacks
  or EmDash cannot be read, `src/middleware.ts` serves the twin instead, so a
  live page never shows a guessed record. Responses carry
  `x-redthread-live: live` or `snapshot`.
- Date-based homepage spark selection and Surprise re-rolls run in the browser
  over build-generated catalogs. Search, match filters, and curated compares
  read exported JSON (`public/data/search-index.json`,
  `public/data/matches-catalog.v2.json`) instead of request-shaped APIs. The
  match transport stores correlated metadata in shared columns, player IDs
  by reference, goal events in columns, and dates as day differences. The browser
  restores the complete existing catalog before filtering; no fixture or field
  is omitted. `lib/matches/catalogWire.ts` owns decoding, and the build-only
  encoder lives in `lib/matches/encodeCatalog.ts`. The readable
  `matches-catalog.json` endpoint remains available for existing consumers. The
  unfiltered `/matches` result spine is rebuilt from that catalog after
  hydration so the static HTML stays inside the gzip budget.
- The archive reads URL state behind a small, empty Suspense fallback so its
  server-rendered list stays in place during hydration. Pagination, sort links,
  and facet controls update browser history over the local catalog; they do not
  request another page payload. Catalog decoding yields between batches, and
  shared number formatting reuses an `Intl.NumberFormat` instance for long chart
  and ledger labels.
- `UNITEDSTATS_BUILD_PROFILE=preview` samples the heavy route families
  (`lib/build-profile.ts`) for fast preview deploys. Anything else is a full build.

## Route map

### Primary pages

| Route | Role |
|---|---|
| `/` | Front door (live): 20-second opening thread → served match-night → record skyline + search |
| `/explore` | Discover hub (live): authored questions and curated debates |
| `/stories`, `/stories/[slug]` | Authored stories (Two No. 7s, Treble, Fortress, Fergie Time, …) |
| `/matches` | Filterable full fixture record |
| `/match/[id]` | Match detail: flow, lineup, events, correction pickables |
| `/seasons`, `/seasons/[season]` | Season ledger and single-season depth |
| `/players`, `/player/[id]` | Player register and career pages |
| `/managers`, `/manager/[id]` | Manager succession and tenure pages |
| `/opponent/[id]` | Opponent fixture history (no `/opponents` index — redirects to `/search`) |
| `/analytics` | Elo timeline, reliability curve, Monte Carlo season replay |
| `/transfers` | Transfer ledger and record deals |
| `/data` | Coverage ledger, sources, gaps queue, dataset downloads |
| `/compare` | Curated debates, live (query-string pairs resolve from build-time payloads) |
| `/cut`, `/cut/[slug]` | `noindex` saved/API receipts for registered cuts |
| `/questions/[slug]` | Authored myth/answer depth pages (4 active; archived slugs noindex) |
| `/surprise` | Reviewed match-night rediscovery with re-roll |
| `/on-this-day`, `/on-this-day/[monthDay]` | Exact match/transfer calendar moments with an explicitly nearby reviewed fallback |
| `/search` | Full-text search + entity browse |
| `/record` | Browser-backed reader for match, player and opponent records outside the build's scope |
| `/corrections` | Structured correction builder → GitHub issues |
| `/feedback` | General feedback via embedded Google Form |

### Redirects (`scripts/legacy-redirects.json`)

Legacy paths answer a permanent 308. `scripts/package-assets.mjs` writes them
into `out/_redirects`, and `tests/legacy-redirects.test.ts` pins them:

- `/questions/ferguson`, `/questions/decline` → `/questions/ferguson-era`
- `/opponents` → `/search`
- `/analytics/odds` → `/analytics`
- `/analytics/travel` → `/questions/away-days`
- `/journey` and `/journey/*` → the published `/stories/*` homes
- `/api/v1` → `/api/v1.json`

The record-reader redirects for entity pages outside the build (307) are in
`src/worker.ts`. A zone rule sends www.utdred.com to the apex.

### Route render-mode disposition

`scripts/check-static-render.mjs` (`npm run check:static`) enforces this after
`npm run build`.

| Mode | Routes | Notes |
|---|---|---|
| **Live** | `/`, `/explore`, `/stories`, `/compare` | Rendered on the Worker per request; prerendered twin at `/live-snapshot/<name>` |
| **Static** | `/analytics`, `/data`, `/managers`, `/transfers`, `/matches`, `/players`, `/seasons`, `/search`, `/cut`, `/surprise`, … | Prerendered HTML; URL state is applied on the client |
| **Prerendered families** | `/match/[id]`, `/player/[id]`, `/manager/[id]`, `/opponent/[id]`, `/seasons/[season]`, `/questions/[slug]`, `/stories/[slug]`, `/on-this-day/[monthDay]`, `/cut/[slug]` | `generateStaticParams`; preview builds sample heavy routes |
| **API** | `/api/v1/*`, `/api/health` | Build-generated JSON files; query-shaped match/search APIs were replaced by client catalogs |
| **Worker only** | `/_emdash/*` | EmDash admin and its API |

### Regression guards (CI)

- `npm run check:static` fails if an expected page is missing from `out/`, a
  prerendered family collapses, or the prerendered-path count drops below 5,000
  (50 on preview builds).
- `npm run check:perf` (also run in `postbuild`) fails on built-artifact
  regressions: max gzipped HTML 180 KB, max gzipped JS chunk 120 KB, and an
  output ceiling (1,200 MB full, 500 MB preview). Selected match, player,
  opponent, and season pages hold down the aggregate output; the complete
  records remain in build-generated JSON, the match browser, and downloadable
  files. `package-assets.mjs` also fails on any asset over Cloudflare's 25 MiB limit.
- `scripts/check-worker-config.mjs` checks a build against its target (Worker
  name, domains, indexing, bindings, redirects) and, with `--smoke`, a deployed
  site. CI runs it with `wrangler deploy --dry-run`.
- Charts are hand-drawn and server-rendered (`components/charts/PlotShell.tsx`,
  `plot.ts`); only `ChartInspector` hydrates, for hover, keyboard and tap-to-pin
  inspection (ADR 0004). Fonts self-host through Astro's font config
  (`astro.config.mjs`) and load in `src/rt/Document.astro`.
  Fixed-size portraits are served directly from cached local WebP files
  (`public/media/**`), with no image transformation.
- Only production sets `SITE_INDEXABLE`. Every other Worker sends noindex.

## UI architecture

**Shell.** `components/SiteShell.tsx` wraps every page: desktop collapsible
sidebar (`SidebarNav` + `lib/navSections.ts`), mobile floating glass pill nav
(`components/mobile/MobileBottomNav.tsx`), command-palette search, and footer
utilities. Stories, Discover, Matches, Seasons, and Players are primary;
Managers, Analytics, Transfers, and Data live under one More disclosure.
Data/downloads, API, corrections, and feedback remain in the footer. Page
navigations use cross-document view transitions, set up in `src/rt/Document.astro`.

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
app/                    page code (React server + client components)
  page.tsx              homepage (live; client re-picks today's night)
  explore/              discover hub (live)
  stories/              authored stories (index live)
  matches/              filterable archive
  match/[id]/           match detail
  seasons/              season index + [season]
  players/              player register + [id]
  managers/             manager index + [id]
  opponent/[id]/        opponent entity (no index)
  record/               browser-backed record reader
  analytics/            Elo + reliability + replay
  transfers/            transfer ledger
  data/                 coverage ledger + downloads
  compare/              head-to-head lenses (live)
  cut/                  curated cuts only
  questions/[slug]/     authored myth pages
  surprise/             curated wanderer
  on-this-day/          calendar history
  search/               full-text search
  corrections/          correction builder
  feedback/             feedback form
  api/                  static GET dumps (health, v1 REST); no search/revalidate
src/
  pages/                generated Astro wrappers, one per app/ page (committed)
  rt/                   render, hydration, live-route snapshot and editorial scope
  shims/                next/* stand-ins the page code imports
  middleware.ts         live routes: render with EmDash content, or serve the twin
  worker.ts             Worker entry: setup gate, record-reader redirects, EmDash
components/             UI components (charts, match archive, mobile shell, …)
lib/                    db access (db.ts at build time, dbReplay.ts on the Worker), queries, format, …
content/emdash/         seed.json: the git snapshot of the CMS content
plugins/record-guard/   EmDash plugin: publish dispatch and record checks
data/
  canonical/            source of truth (JSON, in git)
  raw/                  downloaded open datasets (gitignored, reproducible)
  united.db             built SQLite artifact (gitignored; rebuilt in prebuild)
public/
  dataset/              exported CSV/JSON flat files (gitignored on preview builds)
  media/                cached WebP portraits (gitignored; rebuilt in prebuild)
scripts/                build-site.mjs, build-db.ts, validate.ts, ingest/*, check-*, export-*, emdash/*
pipeline/               update.ts, the recurring fetch-and-append job
wrangler.jsonc          Worker config: preview by default, `env.production` for utdred.com
.github/workflows/      ci.yml, deploy.yml, update-results.yml, enrich-results.yml, publish-editorial.yml
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
  prefill from match pickables is not available on prerendered pages.
  Contract: `docs/CORRECTIONS.md`.
- **`/feedback`** — general product feedback via embedded Google Form.
- Every aggregate in the UI carries a coverage grade where interpretation
  depends on data completeness.

## Related docs

| Doc | Purpose |
|---|---|
| `docs/DATA-MODEL.md` | Schema of record |
| `docs/PIPELINE.md` | Auto-update, validation, build, and deployment |
| `docs/EMDASH-MIGRATION-PLAN.md` | The Astro + EmDash move and the CMS setup |
| `docs/SOURCE-AUDIT.md` | Coverage limits and provenance |
| `docs/CORRECTIONS.md` | Public correction workflow |
| `docs/MOBILE.md` | Mobile shell patterns |
| `docs/HOMEPAGE.md` | Front-door spark design |
| `docs/PERF.md` | CI performance budgets |
| `PRODUCT.md` | Product definition |
| `README.md` | Onboarding and scripts |

### Shared record UX (September 2026)

`RecordClient` observes query changes with `useSearchParams` (the `next/navigation` shim) beneath Suspense. The existing per-record JSON exports supply its data, so enriched identity, context, sources, portraits and related links do not require new server functions or one HTML document per entity. Page titles update after the record loads. Query-based shared pages retain generic crawler/social metadata; the prerendered featured legacy routes remain the richer share-preview entry points.
