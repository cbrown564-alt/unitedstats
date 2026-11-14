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
Cloudflare production builds rebuild `united.db` as a build input and publish the complete static export. SQLite is not a production runtime dependency. The production domains are attached to Cloudflare; the old Vercel project is retained temporarily for rollback.
```

If nothing changed, the weekly workflow exits with no commit or deployment.
League results come from openfootball. If a scheduled league fixture is past
its date and openfootball has not supplied a result, the Wikipedia lane fills
that fixture (and only that fixture) and is recorded as its source. The final
workflow step, `npm run check:overdue`, fails the run when any fixture is more
than two days past with no result from either source.

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

`public/video/audio` is removed from `out/` after each build, so it never
reaches the Cloudflare deployment. Preserve those film-production sources; the
homepage uses `home-thread.mp4` and `home-thread-poster.jpg`. The export budget
checks the resulting deployable `out/` tree.

## Why this is low-maintenance

- **No servers, no databases, no webhooks.** Two free, durable services
  (GitHub Actions, Cloudflare deploy-on-push) and one community dataset.
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

The runtime Blob database path and its upload script were removed on
2026-11-10; the static export has no runtime database to refresh. Do not
reintroduce `UNITEDSTATS_DB_BLOB_URL`. After a deploy, `node
scripts/smoke-check.mjs` checks the health snapshot, core pages, and the
Worker's record redirect on `https://utdred.com` (pass `--site` for a preview).

## Deploy (Cloudflare Workers)

The site is one Worker: Astro's hybrid build with EmDash (docs/EMDASH-MIGRATION-PLAN.md). `wrangler.jsonc` holds both targets, and `CLOUDFLARE_ENV` at build time picks one. `astro build` writes the chosen environment, flattened, to `dist/server/wrangler.json`, and that file is what gets deployed. Static files go to `out/`, and the Worker serves everything else.

- Unset: the preview, `unitedstats-migration-preview` on workers.dev, with its own D1, R2 and KV. Noindex on every response. `npm run build`, then `npm run deploy:preview`.
- `CLOUDFLARE_ENV=production`: `unitedstats` on utdred.com and www.utdred.com. Only `.github/workflows/deploy.yml` deploys it. That workflow runs on a push to master and by hand, and the data and publish workflows call it after their own push (a push made with `GITHUB_TOKEN` starts no other workflow). Its token lives in the `production` GitHub environment.
- `npm start` serves the built Worker locally, with D1 state under `.wrangler/local-d1`.

The legacy Cloudflare Workers Builds connection is retained with **Disable builds**
on. It previously watched `master` and deployed the old static packaging after
GitHub's hybrid deployment, removing the CMS routes. Keep that build disabled;
GitHub Actions is the production deployment owner.

`scripts/package-assets.mjs` runs at the end of the build. It writes `out/_redirects` from the permanent redirects in `vercel.json`, merges API CORS, data caching and noindex into the adapter's `out/_headers`, and fails on any asset over 25 MiB. `_headers` covers only static files, so the Worker sends noindex itself unless `SITE_INDEXABLE` is `"true"`, which only production sets. Unprerendered match/player/opponent/season URLs redirect to the browser-backed record reader (`src/worker.ts`).

`scripts/check-worker-config.mjs <preview|production>` checks a build against its target: Worker name, domains, indexing, bindings and redirects. `--deployable` also requires the D1 and KV IDs, because without them Wrangler would create new, empty resources. With `--smoke <origin>` it checks a deployed site instead: the home page renders live, indexing is right, and every legacy redirect answers 308. CI runs the production build, the config check and `wrangler deploy --dry-run`.

EmDash uses `migrations.runtime: "check"` in deployed Workers (`dev` remains
`auto`). The deployment checks `.emdash/migrations.json` against production D1
before uploading code. Apply pending migrations explicitly with `emdash migrate`
and its expected target fingerprint before retrying a deploy. Do not initialize
a new production database through visitor traffic: concurrent cold requests can
contend on the migration lock and return 503. Private snapshot assets keep
`noindex`; their public fallback responses remove that asset header and use the
Worker environment's indexing policy instead.

The Next build (`npm run build:cloudflare -- production`, `npm run deploy:cloudflare`) remains only as a fallback until Phase 3b; to roll back, use `wrangler rollback` first.

Umami pageviews and bounded product events remain. Vercel Web Analytics and Speed Insights scripts are removed because their endpoints depend on the old host. Their historical measurements remain evidence; no field-performance improvement is claimed. Blob upload/revalidation scripts remain dormant manual recovery tools and are not required by the build or weekly update workflow.

The production configuration attaches `utdred.com` and `www.utdred.com`. A zone Single Redirect rule preserves the existing 308 from www to the apex, including path and query. The separate Google verification TXT record must be preserved. The Monday 18:00 UTC data workflow calls the Deploy workflow after it pushes.

Preview testing reproduced an existing record-navigation defect on Vercel: selecting another record after client navigation could retain the previous result. `RecordClient` now reads pathname/query from Next.js route hooks instead of listening only to browser `popstate`; the existing loading, abort, failure/retry and record-data behavior remain.

Returning from the archive also exposed Next 16.2.9 reusing a previous query URL from its static route cache. Match, player and opponent record links use native anchors so each selected record gets an exact document URL, including after legacy redirects or a return from another page. Search results and search controls also use document navigation for record destinations. Other site links keep their existing client navigation.
