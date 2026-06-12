# UnitedStats

**The exhaustive history of Manchester United** — every match, plus growing
lineup and goal-contribution depth for every competition, since 1892. A modern successor
to stretfordend.co.uk: a deep, versioned dataset, a zero-cost auto-update
pipeline, and a rich analytics UI.

## Quick start

```bash
npm install
npm run build:db   # compile data/canonical/*.json -> data/united.db
npm run dev        # http://localhost:3000
```

## The three layers

1. **Data backend** — canonical JSON in `data/canonical/` (one file per
   season + reference files), compiled to SQLite. See `docs/DATA-MODEL.md`.
2. **Update pipeline** — GitHub Actions cron pulls new results from
   openfootball, validates, rebuilds, commits; Vercel redeploys.
   No keys, no servers. See `docs/PIPELINE.md`.
3. **Web UI** — Next.js 16 App Router + Tailwind 4, server components
   querying SQLite read-only. Analytics (Elo, trends, records) are
   precomputed at build time. See `docs/ARCHITECTURE.md`.

## Scripts

| Command | Does |
|---|---|
| `npm run ingest` | one-off: rebuild canonical JSON from raw open datasets |
| `npm run ingest:wikipedia` | one-off: enrich canonical JSON from Wikipedia season articles |
| `npm run ingest:lineups` | one-off: add lineups from dedicated Wikipedia final/late-round match articles |
| `npm run build:db` | canonical JSON → SQLite + precomputed analytics |
| `npm run validate` | integrity checks on canonical data |
| `npm run update` | fetch latest results (same code the cron runs) |
| `npm run dev` / `build` | Next.js |

## Data coverage

**6,027 matches across 126 seasons (1886–present), every competition:**

| Layer | Coverage |
|---|---|
| Results | complete: League 1892–, FA Cup 1886–, League Cup 1960–, Europe 1956–, Shields 1908–, world & test matches |
| Attendance | 98% of all matches |
| Goal scorers (with minutes where recorded) | ~99% of matches United scored in — the all-time list reproduces the official club record |
| League positions | every season, computed from full-league results with era-correct rules |
| Managers | every match attributed via tenure dates, 1892– |
| Lineups | 192 full United lineups / 2,519 player appearances from structured Wikipedia match articles; schema, DB, validation, and UI live |
| Assist partnerships | canonical fields + query/UI support live; checked-in sources currently do not provide assist rows |

Every aggregate in the UI shows the coverage behind it (see the data-depth
ledger on /analytics). Corrections welcome — the data is plain JSON,
fixable with a PR.

## Sources

engsoccerdata (league + FA Cup results), openfootball (current seasons),
Wikipedia season articles (cups, Europe, attendance, scorers) and dedicated
match articles (lineups) — parsed deterministically from wikitext tables,
cached in `data/raw/wikipedia/`.
