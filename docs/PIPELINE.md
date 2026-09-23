# Update Pipeline

Goal: every new Manchester United result lands in the site automatically,
for free, with effectively zero maintenance.

## How a new match flows in

```
match ends
   │   (openfootball volunteers update results, usually within hours)
   ▼
GitHub Actions cron  (.github/workflows/enrich-results.yml)
   runs Monday 18:00 UTC; manual dispatch handles urgent corrections
   │
   ▼
pipeline/update.ts
   1. fetch openfootball raw text for the current season
      (premier league; FA Cup / League Cup / Europe files when present)
   2. parse fixtures, filter to Manchester United
   3. keep FT results; rewrite `data/canonical/upcoming.json` from unscored
      United rows (schedule overlay, overwrite-only — not the match record)
   4. diff results against data/canonical/matches/<season>.json
   5. append new matches (result-level: date, comp, opponent, venue, score)
   6. `npm run enrich -- --write --refresh --strict --latest 3` fills and checks
      recent current-season match sheets from
      Wikipedia (United scorers, attendance), Transfermarkt (XI, bench,
      shirts, cards, subs, assists, opposition scorers), and MUFCInfo
      (lineups, stadiums, assists, opposition scorers). Each source is
      best-effort. Transfermarkt's published snapshot often lags the newest
      match; MUFCInfo is the current-season fallback for XI and opposition
      goals. The positions lane downloads `data/raw/england.csv` when the
      cache is missing (`data/raw/` is gitignored).
   7. if canonical data changed: validate, rebuild database, export dataset
   8. commit the changed data and push once
   │
   ▼
Vercel rebuilds `united.db` as a build input and publishes the complete static
export. SQLite is not a production runtime dependency.
```

If nothing changed, the weekly workflow exits with no commit or deployment.
`update-results.yml` remains available by manual dispatch for an urgent result
or schedule correction between weekly releases.

## Deployment retention

The unitedstats Vercel project uses 30-day production retention and 7-day
retention for previews, cancelled builds and errored builds (saved and verified
on 2026-09-10). This replaces the inherited 365-day production and 180-day
preview settings. Vercel's protected-deployment exceptions still apply; a
retention setting is not a strict cap on retained releases.

For manual cleanup, inventory deployments, production/custom-domain aliases,
open pull requests and remaining branches first. Preserve current production,
two ready rollback releases, and the latest ready preview for each active
branch. Record the exact keep/delete list and verify the remaining deployment
IDs and production alias after deletion. Old review links and instant rollback
to deleted releases are the trade-off; source history remains in Git.

`public/video/audio` is excluded by `.vercelignore` and removed from the local
`out/` copy after each build. Preserve those film-production sources; the
homepage uses `home-thread.mp4` and `home-thread-poster.jpg`. The export budget
checks the resulting deployable `out/` tree.

## Why this is low-maintenance

- **No servers, no databases, no webhooks.** Two free, durable services
  (GitHub Actions, Vercel deploy-on-push) and one community dataset.
- **Weekly result and sheet release.** The
  contract is still the *result*; scorers and lineups are best-effort and
  may arrive later from Transfermarkt and MUFCInfo. `enrich-results.yml`
  runs those lanes every Monday at 18:00 UTC and fails the job if the
  latest matches are still incomplete, so a missing XI is visible. A human
  can still fix anything with a normal PR.
- **Validation gate.** A malformed upstream change can't corrupt the site:
  `validate.ts` must pass before the commit happens; CI runs it on every push.
- **Source failure mode.** If openfootball stops updating (it has been
  maintained for 10+ years), the workflow simply finds no new matches and
  the fix is pointing `update.ts` at another text/CSV source — a ~50-line
  parser. football-data.org remains a drop-in keyed alternative.

## Season rollover

`update.ts` derives the current season from the date (Aug–Jul). In August it
creates `matches/<new-season>.json` automatically when the first result
appears. New competitions (e.g. United back in the Champions League) require
adding one entry to the workflow's source list — flagged by the workflow
summary when an unknown competition file appears upstream.

## Manual levers (all optional)

- `npm run update` — fetch new results from openfootball.
- `npm run enrich -- --write` — current-season sheet enrichment (same as CI).
- `npm run enrich -- --report-only` — assess the latest match sheets only.
- `workflow_dispatch` — trigger Update results or Enrich match sheets from GitHub.
- Edit any season JSON by hand → CI validates → merge → deploy.
- `npm run ingest:lineups` — enrich historical knockout/final matches from
  dedicated Wikipedia match articles when expanding lineup coverage.
- `npm run ingest:football-data -- <season> [<endSeason>]` — dry-run
  football-data.org enrichment for modern match sheets. Add `-- --write` to
  persist matched goal events, assists, opposition scorers, cards, United
  starting lineups, used substitutes, benches, attendance, and source facets.
  Responses are cached in `data/raw/football-data-org/`.
- `npm run ingest:mufcinfo-lineups -- <season> [<endSeason>]` — dry-run
  MUFCInfo historical lineup enrichment. Add `-- --write` to persist matched
  United starting lineups, substituted-on players, shirt numbers, and source
  facets. Pages are cached in `data/raw/mufcinfo/matches/`.
- `npm run ingest:mufcinfo-opposition-goals -- <season> [<endSeason>]` —
  dry-run MUFCInfo opposition-scorer enrichment from the match-page
  scoreboard. Add `-- --write` to persist `opp-goal` / `own-goal-against`
  events when the opponent tally reconciles with goals against.
- Add source ids in `data/canonical/sources.json` before using them in match
  files. The build expands match source ids into result/scorer/assist/lineup/
  attendance facets for the UI.

## Secrets / configuration

| Name | Required | Purpose |
|---|---|---|
| (none) | — | core pipeline works with zero secrets |
| `FOOTBALL_DATA_TOKEN` | optional | football-data.org scorer, assist, lineup, substitution, booking, and attendance enrichment |
| `FOOTBALL_DATA_TEAM_ID` | optional | override the football-data.org Manchester United team id; defaults to `66` |

The Blob upload and on-demand revalidation scripts remain available as manual
recovery tools. They are not called by the scheduled workflow, and production
must not set `UNITEDSTATS_DB_BLOB_URL` during the current cost-assessment period.
