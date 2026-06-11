# Architecture

UnitedStats is the exhaustive history of Manchester United — every match, every
lineup, every goal contribution, for every competition since Newton Heath's
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
   football-data.org   (optional richer source, free key)
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
- `FOOTBALL_DATA_TOKEN` (free tier of football-data.org) can be added as a
  repo secret to enrich the same matches with scorers and lineups; the
  pipeline works without it.

**Rendering strategy.**
- Almost everything is static: matches from 1892 don't change. Pages are
  server components reading SQLite at request/build time; the heavy analytics
  aggregates are precomputed into the DB so pages stay simple SELECTs.
- A new deploy (triggered by the data commit) refreshes everything. No ISR
  invalidation logic to maintain.

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
| Scorers / lineups (modern era) | football-data.org (optional key) / curated | per-event detail |
| Managers, stadiums, competitions | curated reference JSON | complete club history |

The enrichment strategy is **progressive**: the schema supports full per-match
detail (lineups, events with player + minute + type) from day one; sources are
layered in over time without schema changes. See PIPELINE.md and ROADMAP.md.
