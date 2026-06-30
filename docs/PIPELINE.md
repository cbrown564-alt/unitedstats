# Update Pipeline

Goal: every new Manchester United result lands in the site automatically,
for free, with effectively zero maintenance.

## How a new match flows in

```
match ends
   │   (openfootball volunteers update results, usually within hours)
   ▼
GitHub Actions cron  (.github/workflows/update-results.yml)
   runs Mon+Thu+Sun 06:00 UTC — covers weekend + midweek match windows
   │
   ▼
pipeline/update.ts
   1. fetch openfootball raw text for the current season
      (premier league; FA Cup / League Cup / Europe files when present)
   2. parse fixtures, filter to Manchester United, keep only FT results
   3. diff against data/canonical/matches/<season>.json
   4. append new matches (result-level: date, comp, opponent, venue, score)
   5. enrich the current season from its Wikipedia article (scorers,
      attendance, cup rounds) and recompute the league position
   6. npm run validate  &&  npm run build:db  &&  npm run export:dataset
   7. npm run upload:db  (when BLOB_READ_WRITE_TOKEN is set)
   8. commit "data: results through <date>" and push
   9. npm run revalidate  (when REVALIDATE_SECRET + UNITEDSTATS_SITE_URL are set)
   │
   ▼
Production picks up the new blob + refreshes only the blast radius (~25 paths).
Vercel skips the git deploy when the commit is data-only and blob revalidation
is configured (`scripts/vercel-should-build.mjs`).
```

If nothing new: the workflow exits cleanly with no commit (idempotent — the
diff in step 3 makes reruns harmless).

## Why this is low-maintenance

- **No servers, no databases, no webhooks.** Two free, durable services
  (GitHub Actions, Vercel deploy-on-push) and one community dataset.
- **Result-level first.** The pipeline's contract is the *result*; richer
  detail (scorers, lineups) is best-effort enrichment that can also be added
  later by hand or by re-running enrichment, because canonical data is JSON
  in git — a human can always fix anything with a normal PR.
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

- `npm run update` — run the same pipeline locally.
- `workflow_dispatch` — trigger the Action from the GitHub UI.
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
- Add source ids in `data/canonical/sources.json` before using them in match
  files. The build expands match source ids into result/scorer/assist/lineup/
  attendance facets for the UI.

## Secrets / configuration

| Name | Required | Purpose |
|---|---|---|
| (none) | — | core pipeline works with zero secrets |
| `BLOB_READ_WRITE_TOKEN` | optional | upload `united.db` to Vercel Blob after each ingest |
| `UNITEDSTATS_DB_BLOB_URL` | optional | public blob URL set on the Vercel project (see `npm run upload:db`) |
| `REVALIDATE_SECRET` | optional | bearer token for `POST /api/revalidate` |
| `UNITEDSTATS_SITE_URL` | optional | production origin used by `npm run revalidate` in CI |
| `FOOTBALL_DATA_TOKEN` | optional | football-data.org scorer, assist, lineup, substitution, booking, and attendance enrichment |
| `FOOTBALL_DATA_TEAM_ID` | optional | override the football-data.org Manchester United team id; defaults to `66` |
