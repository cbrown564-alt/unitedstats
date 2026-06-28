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
   6. npm run validate  &&  npm run build:db
   7. commit "data: results through <date>" and push
   │
   ▼
Vercel auto-deploys the push → site updated
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
| `FOOTBALL_DATA_TOKEN` | optional | football-data.org scorer, assist, lineup, substitution, booking, and attendance enrichment |
| `FOOTBALL_DATA_TEAM_ID` | optional | override the football-data.org Manchester United team id; defaults to `66` |

## History-changed digests

After `validate` and `build:db`, a deterministic generator produces
history-changed digests — one question: *what did this match change in 140 years
of United?* They are build-time artifacts derived from the local SQLite DB, fetch
no network data, and each claim links back to the match/API evidence.

- **Artifact:** `data/history-digests/<match-id>.json`, served at
  `/history-changed/<match-id>`. Logical id `us:history-digest:<match-id>`;
  `claimVersion` is a deterministic hash of the content (URL/id stable, version
  changes when corrected canonical data changes).
- **Generator:** `npm run generate:history-digests -- --latest N` (the update
  workflow passes `--latest $NEW_MATCHES`), `--match <id>`, or `--all`. A
  no-change run writes nothing.
- **Scope:** official matches only; friendlies and wartime excluded. Provenance
  derived from `match_sources` + the canonical source catalog. Elo
  movement/percentile use the existing `elo_history` table. No wall-clock
  timestamps in the artifacts.

**Detector spec** (claims ranked by editorial weight for display — all-time
records/runs lead; the plain result is the floor that leads only when nothing
bigger fired; Elo movement sits last under "Also shifted"):

| Detector | Trigger |
| --- | --- |
| Result | Always fires. Plain outcome in era-correct club name/venue/opponent + running same-comp win count when United won. |
| Record entered/extended | Sets/joins a single-match United goals high, or extends the biggest winning margin. |
| Streak started | First match of a run of ≥3 unbeaten/winning/scoring/clean-sheet. |
| Streak ended | Breaks a run of ≥3 unbeaten/winning/scoring/clean-sheet. |
| Rank change | Post-match Elo enters or climbs within United's hundred best-ever to date, or sets a new all-time peak. |
| Manager milestone | 1, 10, 25, 50, 100, 250, 500, 1000, or 1500 matches in charge. |
| Opponent milestone | Head-to-head reaches 1, 10, 25, 50, 100, 250, 500, 1000, or 1500. |
| Unusual scoreline | Margin ≥5, ≥7 total goals, or a new scoreline with ≥5 total goals. |
| Venue fact | Home/away/neutral count hits a milestone, or a known stadium enters the record first. |
| Elo movement | Moves United's Elo by ≥5 points. |
| Historical percentile | Post-match Elo in top/bottom 5% of United's history to that date. |
