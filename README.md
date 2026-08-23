# Red Thread

**Every Manchester United match since 1886** — results, lineups, goal events,
managers, opponents, and growing depth across every competition. A modern successor
to stretfordend.co.uk: a deep, versioned dataset, a zero-cost auto-update
pipeline, and a nostalgia-first web UI.

Repository and package name: **unitedstats**. See `docs/BRANDING.md` for the
Red Thread name and voice.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run dev` runs `build:db` automatically if `data/united.db` is missing.
For a production-parity build: `npm run build:db && npm run cache:media && npm run export:dataset`.

## What ships

| Surface | Route | Role |
|---|---|---|
| Front door | `/` | Served match-night spark + record skyline + search |
| Discover | `/explore` | Authored questions, debates, and record cuts |
| Match archive | `/matches` | Filterable full fixture record |
| Entity pages | `/match`, `/player`, `/manager`, `/opponent`, `/seasons` | Auditable depth on every fixture and career |
| Analytics | `/analytics` | Elo timeline, reliability curve, season replay |
| Transfers | `/transfers` | Season-by-season transfer ledger |
| Data & trust | `/data` | Coverage ledger, sources, gaps queue, downloads |
| Compare | `/compare` | Curated debates and head-to-head lenses |
| Wander | `/surprise`, `/on-this-day` | Curated rediscovery and calendar history |
| Corrections | `/corrections` | Structured correction builder → GitHub issues |
| Feedback | `/feedback` | General feedback form |
| Public API | `/api/v1/*` | Machine-readable matches, players, seasons, meta |
| Dataset exports | `/dataset/*` | CSV/JSON flat files (see `public/dataset/manifest.json`) |

## The three layers

1. **Data backend** — canonical JSON in `data/canonical/` (126 season files plus
   reference files for players, transfers, media, positions, and more), compiled
   to SQLite. See `docs/DATA-MODEL.md`.
2. **Update pipeline** — GitHub Actions cron pulls new results from openfootball,
   validates, rebuilds, exports, and triggers a normal Vercel deployment
   containing the refreshed database — no paid APIs, no servers. See
   `docs/PIPELINE.md`.
3. **Web UI** — Next.js 16 App Router + Tailwind 4, server components querying
   SQLite read-only. Elo and aggregates are precomputed at build time; discovery
   surfaces (questions, compare, cuts) sit on top of the same record. See
   `docs/ARCHITECTURE.md`.

## Scripts

### Development

| Command | Does |
|---|---|
| `npm run dev` | Next dev server (`predev` builds DB if missing) |
| `npm run build` | Production build (`prebuild`: DB + tracked-media reconciliation + dataset export) |
| `npm run start` | Serve production build |
| `npm test` | Unit tests (`tests/*.test.ts`) |
| `npm run lint` | ESLint |
| `npm run knip` | Unused files/exports check (CI) |

### Build & export

| Command | Does |
|---|---|
| `npm run build:db` | Canonical JSON → `data/united.db` + precomputed analytics |
| `npm run export:dataset` | SQLite → flat CSV/JSON in `public/dataset/` |
| `npm run cache:media` | Cache Wikidata/Commons images to `public/media/` (explicit network refresh) |
| `npm run validate` | Integrity checks on canonical data (CI gate) |

### Pipeline

| Command | Does |
|---|---|
| `npm run update` | Fetch latest results (same entry point as cron) |
| `npm run enrich` | Fill current-season scorers, lineups, cards, and assists |
| `npm run upload:db` | Manual Blob recovery only — not part of the live export |
| `npm run revalidate` | Dormant; the static export has no ISR cache to bust |

### Historical ingest (one-off)

| Command | Does |
|---|---|
| `npm run ingest` | Rebuild canonical JSON from engsoccerdata |
| `npm run ingest:wikipedia` | Enrich from Wikipedia season articles |
| `npm run ingest:lineups` | Lineups from Wikipedia final/late-round match articles |
| `npm run ingest:football-data` | football-data.org enrichment; `-- --write` to persist |
| `npm run ingest:mufcinfo-lineups` | MUFCInfo lineup enrichment; `-- --write` to persist |
| `npm run ingest:mufcinfo-assists` | MUFCInfo goal-minute backfill; `-- --inspect YYYY-MM-DD`, `-- --write` |
| `npm run ingest:transfermarkt` | transfermarkt-datasets modern match sheets |
| `npm run ingest:transfers` | MUFCInfo transfer archive |
| `npm run ingest:player-records` | Wikipedia player-list career totals |
| `npm run ingest:player-media` | Wikidata/Commons portraits for the curated appearance cohorts |
| `npm run ingest:player-media:all` | Exhaustive Wikimedia-first pass for every verified United player record |
| `npm run ingest:manager-media` | Manager portraits |
| `npm run ingest:ogscorer-media` | Own-goal scorer media |
| `npm run ingest:player-shirts` | Shirt-number decade summaries |
| `npm run ingest:positions` | Recompute league positions |
| `npm run ingest:player-positions` | Wikidata playing positions |
| `npm run ingest:tableau-goals-assists` | Curated Tableau season goals/assists/types; `-- --write` |

### CI checks

| Command | Does |
|---|---|
| `npm run check:static` | Enforce static/SSG route disposition |
| `npm run check:media` | Verify cached media files |
| `npm run check:player-media-roster` | Assert every verified United player is represented in the media ledger |
| `npm run check:player-media-research` | Validate disjoint research batches before media-manifest merge |
| `npm run check:perf` | Performance budget checks |

## Data coverage

**6,028 matches across 126 seasons (1886–present), every competition:**

| Layer | Coverage |
|---|---|
| Results | complete: League 1892–, FA Cup 1886–, League Cup 1960–, Europe 1956–, Shields 1908–, world & test matches |
| Attendance | 98% of all matches |
| Goal scorers (with minutes where recorded) | ~99% of matches United scored in — the all-time list reproduces the official club record |
| League positions | every season, computed from full-league results with era-correct rules |
| Managers | every match attributed via tenure dates, 1892– |
| Lineups | 6,022 matches with full United starting lineups / 72,095 recorded United appearances, primarily from MUFCInfo match pages, structured Wikipedia match articles, and CC0 transfermarkt-datasets; six matches remain without a validated XI |
| Match-attributed assists | 975 recorded assists (2012-13–present, transfermarkt-datasets, CC0). No open, redistributable source records United assists before 2012-13 (assists were not systematically tracked anywhere until the Opta era, and the pre-2012 holders — Opta, Transfermarkt.com, FBref/StatsBomb — are licence-restricted), so earlier seasons are blank by source limitation, not omission. See `docs/SOURCE-AUDIT.md`. |
| Transfers | 1,967 recorded transfers (MUFCInfo archive) |
| Players | 984 in the register export |

Every aggregate in the UI shows the coverage behind it (see the coverage ledger
on `/data`). Corrections welcome — edit the plain JSON in `data/canonical/` and
open a PR, or use the structured builder at `/corrections`. See
`docs/CORRECTIONS.md`.

## Sources

engsoccerdata (league + FA Cup results), openfootball (current seasons),
Wikipedia season articles and player lists (cups, Europe, attendance, scorers,
career totals), dedicated match articles (lineups), MUFCInfo match pages
(historical United lineups, shirt numbers, transfers), transfermarkt-datasets
(modern match sheets), Wikidata/Wikimedia Commons (player and manager media,
playing positions), and curated Tableau season aggregates (Ferguson-era goals and
assists by type — season-level, not match-attributed). Parsed deterministically
and cached under `data/raw/`. Full provenance: `data/canonical/sources.json`,
`docs/SOURCE-AUDIT.md`.

## License

Code is MIT (see `LICENSE`). The dataset — canonical JSON, the compiled
SQLite database, and the CSV/JSON exports — is CC BY-SA 4.0 with per-source
attribution (see `data/LICENSE.md`).

## Open data

Red Thread ships a versioned open dataset and read-only API on every deploy.
The coverage ledger on `/data` is the human-facing entry point; machine
readers can start from `/llms.txt`.

### Downloads

Flat CSV exports live under `/dataset/`. Start with
[`/dataset/manifest.json`](https://unitedstats.vercel.app/dataset/manifest.json)
for row counts, build metadata, license, and citation fields.

| File | Contents |
|---|---|
| `matches.csv` | Fixture spine — results, venues, managers, facet flags |
| `events.csv` | Goals, assists, cards |
| `lineups.csv` | Starting XIs, benches, substitutions |
| `elo_history.csv` | Pre/post-match Elo and expectancies |
| `season_summaries.csv` | Competition season summaries |
| `players.csv` | All-time player totals |
| `transfers.csv` | Transfer ledger |
| `league_standings.csv` | League table rows by season |

Regenerate locally: `npm run build:db && npm run export:dataset`.

### API

Read-only JSON at `/api/v1/*` with permissive CORS. Index:
[`/api/v1`](https://unitedstats.vercel.app/api/v1). Key endpoints:

- `/api/v1/meta` — coverage counts and date range
- `/api/v1/matches` — paginated, filterable match list
- `/api/v1/matches/{id}` — one match with events, lineups, sources
- `/api/v1/seasons`, `/api/v1/players`, `/api/v1/opponents`

Full catalog and facet guidance: `/data#api`.

### Citation

Licensed **CC BY-SA 4.0**. When reusing the dataset, credit **Red Thread**
with a link to the site and preserve per-source attribution in reused rows.
Stable record IDs use the `us:` scheme (e.g.
`us:match:1999-05-26-bayern-munich-n`). Plain-text and BibTeX templates are
on `/data#citation`.

### Registries

If you maintain a football data registry or research index, listing Red
Thread with manifest URL `/dataset/manifest.json` and docs at `/data` helps
others discover the record. Corrections welcome via `/corrections` or PR.

## Related docs

| Doc | Purpose |
|---|---|
| `STATUS.md` | Current project status and next workstreams |
| `PRODUCT.md` | Product definition and direction |
| `CONTEXT.md` | Shared product vocabulary (nostalgist, lens-not-loom) |
| `docs/DATA-MODEL.md` | Schema of record |
| `docs/PIPELINE.md` | Auto-update and deployment |
| `docs/ARCHITECTURE.md` | How the app is built |
| `docs/SOURCE-AUDIT.md` | Coverage limits and provenance |
| `docs/CORRECTIONS.md` | Public correction workflow |
| `docs/BRANDING.md` | Red Thread name, voice, and mark |
