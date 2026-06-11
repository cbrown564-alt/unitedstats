# UnitedStats

**The exhaustive history of Manchester United** — every match, every lineup,
every goal contribution, for every competition, since 1892. A modern successor
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
| `npm run build:db` | canonical JSON → SQLite + precomputed analytics |
| `npm run validate` | integrity checks on canonical data |
| `npm run update` | fetch latest results (same code the cron runs) |
| `npm run dev` / `build` | Next.js |

## Data coverage

Result-level data is complete for the league (1892–present) and FA Cup
(1886–present); League Cup and European campaigns are being layered in, then
scorers and lineups era by era (newest first). Every page shows the coverage
window behind any aggregate it displays. Corrections welcome — the data is
plain JSON, fixable with a PR.
