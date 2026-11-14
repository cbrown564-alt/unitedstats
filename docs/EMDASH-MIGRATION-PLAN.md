# Astro + EmDash migration plan

Status: **Phases 0–2 done** (2026-11-13; findings and the Phase 1 approach in
[ADR 0006](adr/0006-move-to-astro-for-emdash.md)). The EmDash Worker runs on
`unitedstats-migration-preview`, with admin set up and the seed loaded. Publishes snapshot
to git only once the publish workflow is on `master` (Phase 3). Phase 3 branch prep is
done; the cutover needs the maintainer.
Supersedes the *conclusion* of
[ADR 0005](adr/0005-stay-on-next-after-astro-seasons-spike.md), not its measurements.

## Why now, when ADR 0005 said stay

ADR 0005 judged Astro on performance alone. On that measure it won on bytes but not by
enough to justify the port. The driver is now different. We want **EmDash** as the
editorial CMS, and EmDash is an Astro integration, so it does not run on Next. The perf
gains (about half the HTML, 43% less script, about 150 ms mobile LCP on `/seasons`) are a
side benefit, not the case for the move. The port costs ADR 0005 listed are all still real
and are budgeted below.

Record the new decision as ADR 0006 before Phase 1 starts.

## What EmDash is (verified 2026-11-13)

- npm `emdash@1.5.0`, stable since 1.0 (Sept 2026), semver on core. Peer deps:
  `astro >=6`, `react >=18`, `@astrojs/react >=5`. That is compatible with the spike's
  Astro 7.4 and React 19. Node `>=22.16`.
- It runs inside our own Astro deployment, not as a separate service. On Cloudflare it uses:
  - Workers (`output: "server"`, `@astrojs/cloudflare`)
  - **D1** (`DB`) for content, users and settings
  - **R2** (`MEDIA`) for uploads
  - KV (`SESSION`), added by the adapter
  - an optional `LOADER` for sandboxed plugins, which needs **Workers Paid**
  - a required `scheduled` handler for cron jobs: scheduled publish and backups.
- Content model:
  - Schema lives in the database and is edited in the admin at `/_emdash/admin`.
  - Each collection is its own SQL table with typed fields, plus reference fields and
    taxonomies.
  - Rich text is Portable Text, with custom block types.
  - Drafts, revisions, scheduled publishing and `_preview` token previews are built in.
- Querying:
  - `getEmDashCollection()` and `getEmDashEntry()` run **at request time** through Astro
    Live Collections and return a `cacheHint`.
  - When `Astro.cache` is on, publishing invalidates the tagged pages.
  - A prerendered route sees build-time content only and changes after the next build.
- Auth: passkeys first (bound to the hostname), with OAuth and magic-link fallbacks. Roles
  are Admin, Editor, Author and Contributor. **The first visitor to the setup wizard
  becomes admin.**
- Hooks:
  - `content:beforeSave` can reject a save (`ContentSaveRejectedError`, or
    `SAVE_REJECTED` when sandboxed).
  - `content:beforePublish` can block a publish.
  - `content:afterPublish` can make outbound fetches.
- Files: `emdash export-seed --with-content` writes schema and content as JSON.
  `emdash seed --validate` checks a seed in CI. `emdash types` generates TS types and
  `.emdash/schema.json`. The docs suggest committing both.

## The core tension, and the rule that resolves it

Red Thread is "git is the single source of truth, the live site is a static export, no
runtime database". EmDash is a runtime database with an admin UI. Both can hold if the
boundary is drawn hard:

1. **EmDash owns editorial content only.** That means prose, curation picks, labels and
   page copy. It never owns facts. Fixtures, lineups, events, players, transfers and
   media provenance stay in `data/canonical/` → SQLite at build. A CMS entry may
   *reference* a record by ID, but it never restates a score, date or count. Computed
   copy (`lib/narrative.ts`, question findings, compare hooks) stays in code because it
   is generated from the record.
2. **Git still holds a reviewable copy of everything published.** On every publish, an
   `afterPublish` hook fires a GitHub `repository_dispatch`. A workflow then runs
   `export-seed --with-content` into `content/emdash/seed.json`, validates it, commits
   it, and deploys. D1 is the editing store; the committed seed is the record, the
   input to prerendered pages and tests, and the disaster-recovery path.
3. **Nothing reaches the site without passing the record's checks.** A native
   `beforeSave` plugin rejects:
   - unknown match, player or manager IDs, checked against a build-exported ID index
     in R2 or a static asset
   - copy that trips `lib/copySmells.ts`.

   The publish workflow re-runs the full tests on the snapshot, so a bad entry blocks
   the deploy even if it got past the hook.

## What moves into EmDash

The content inventory found that nearly all authored copy is TS literals. There is no
MDX. `content/copy-catalog.json` is an extracted index, and the dev-only Copy Studio
(`app/dev/copy`, `copy-queue.json`, `persist-copy-queue.ts`) is a homegrown mini-CMS,
which is the clearest evidence for the need.

| Tier | Content | Today | EmDash collection | Notes |
|---|---|---|---|---|
| 1 | Page copy (eyebrow / title / dek / meta) | ~252 strings across `app/*/page.tsx` and lib registries | `page_copy` (key, route, kind, text, tier) | Replaces Copy Studio and the copy queue; the catalog's `id` becomes the key |
| 1 | Curated nights | `lib/curatedNights.ts`, 21 `{id, stakes}` | `nights` (matchId, stakes) | Feeds homepage spark, rediscovery, on-this-day, match context |
| 1 | Stories shelf | `lib/journey.ts` `JOURNEY_CHAPTERS` + `app/stories/page.tsx` `STORY_DETAILS`, 5 | `stories` (slug, number, title, description, kicker, prompt) | Registry only; bodies stay in code (Tier 3) |
| 1 | Question metadata + related trails | `lib/questions.ts`, `lib/related.ts` | `questions` (slug, label, question, summary, status, related[]) | The answer modules stay in code |
| 1 | Curated debates | `lib/curatedDebates.ts`, 12 | `debates` (kind, a, b, label, hook) | IDs validated |
| 1 | Curated cuts | `lib/cut.ts`, 3 | `cuts` | `dimension` and `metric` stay an enum of what the code implements |
| 1 | Transfer one-liners | `lib/transferEditorial.ts`, 2 + template | `transfer_notes` (transferId, line) | The template fallback stays in code |
| 2 | Search examples, data-gap and source labels, tagline, manager-era labels | small maps in `lib/` | `site_strings` or extend `page_copy` | Low value; move only when touched |
| 3 | Story bodies | 5 bespoke React pages (~1,550 lines) with data-driven client visuals | Portable Text + custom blocks (`match-knot`, `stat-callout`, `figure`) | **Gated**, see Phase 4 |
| — | Fixture data, media provenance, rediscovery exclusion sets | `data/canonical/`, `lib/` | **never** | Facts and safety rules stay in git |

Tier 1 is about 50 records plus the 252 copy strings: small, mostly flat, and easy to
seed from the existing TS by script.

## Target architecture

```
Astro 7 on one Cloudflare Worker (utdred.com), output: "server"
├─ Record routes: prerender = true + getStaticPaths, read SQLite at build (unchanged data path)
│   /match /player /opponent /manager /seasons /on-this-day /questions /stories /cut, API JSON, OG
│   Editorial snippets on these pages (e.g. a night's "stakes") come from the committed seed
├─ Editorial routes: server-rendered from D1 via getEmDashEntry/Collection, Astro.cache + cacheHint
│   /  /explore  /stories (shelf)  /compare  (instant publish, preview links)
├─ /_emdash/admin  (passkeys; disallowed in robots; setup run on preview first)
├─ Static assets (Workers Assets): HTML, client catalogs, /dataset, /media, video
└─ scheduled(): EmDash cron + publish snapshot dispatch
```

The existing `deploy/cloudflare-worker.ts` redirects unprerendered
`/match|player|opponent|seasons` IDs to `/record` and `/matches`. That logic becomes Astro
middleware or a custom worker entry that wraps the adapter's handler. Static assets stay
asset-first, so the bulk of traffic never invokes the Worker.

**Recommended default:** server-render only the four editorial routes above. Everything
else keeps today's static behaviour and updates on deploy. This leaves the measured perf
corpus intact, keeps Worker requests few at current traffic (~280 visitors in 6
weeks), and gives live publish where an editor would notice it.

## Phases and exit gates

### Phase 0: verify the unknowns (a few days, in the spike worktree)

Prove each of these on `spike/astro-seasons` with EmDash added, or change the plan:

1. **Hybrid build at scale.** `output: "server"` with ~10.5k prerendered paths plus SSR
   routes builds on the Cloudflare adapter. Record build time and file count against the
   Workers Assets file limit for our plan. Without RSC payloads the file count should fall.
2. **Snapshot against remote D1.** `export-seed --with-content` can read the *remote* D1
   from CI (or via `site export` or the REST API). The docs examples target a local DB.
3. **Native plugin on the free plan.** A native (non-sandboxed) `beforeSave` plugin
   rejects a bad match ID on the free plan, and `afterPublish` can call the GitHub API.
4. **Portable Text custom blocks.** These render through our React components (only
   needed for Phase 4).
5. **Cache invalidation.** An `Astro.cache` purge on publish works on our Worker, and
   preview tokens work with caching on.
6. **Passkeys.** They work on `utdred.com` with `EMDASH_SITE_URL` set, and the preview
   Worker gets its own admin.

Gate: all six pass, or the plan is amended. Then write ADR 0006.

### Phase 1: framework port, no CMS (the long pole, ~2–4 weeks of product freeze)

Port Next 16 → Astro 7 with parity as the only goal. Start from the spike's shims
(`next/link`, `next/navigation`, `next/dynamic`) and replace them with direct code by the
end of the phase.

- **Shell first.** `SiteShell`, sidebar, command palette, bottom nav and analytics are
  islands. Fonts move from `next/font` to self-hosted `@font-face`. View transitions use
  Astro `<ClientRouter />`, which replaces Next client navigation and the cross-fade.
- **Page families, in order:** static leaf pages → SSG families → `/matches` and
  `/record` (URL-state clients built on `useSearchParams`) → journey and story pages.
- **Island splits.** The real cost, per ADR 0005: Astro hydrates only islands placed in
  `.astro` files, so any React server tree that nests a client component must be split
  around it. There are 87 `use client` files to audit. Async server components become
  `.astro` frontmatter that passes props.
- **Route handlers.** The 21 `route.ts` files (API v1, `llms.txt`, `sitemap`, `robots`,
  dataset) become prerendered endpoints. OG images move from `next/og` to Satori at
  build time.
- **Guards re-homed.**
  - `check:static` and `check:perf` read Astro's `dist/` instead of
    `.next/prerender-manifest.json`.
  - `build-site.mjs` and the profile handling are rewritten.
  - The `knip` config is updated.
  - `vercel.json` redirects move to Astro or worker redirects. Vercel is gone;
    `ARCHITECTURE.md` still describes it.
- **Tests.** Anything importing `next/*` or reading `.next` is updated.

Gate:
- Every path in today's `out/` exists in `dist/`, with equivalent visible text (scripted
  path and text diff).
- `npm test`, `lint`, `knip`, `validate` and the perf budgets pass.
- Screenshot parity holds at mobile and desktop for the home, `/matches`, a match, a
  player, `/seasons` and a story.
- Deploys to `unitedstats-migration-preview`.

### Phase 2: EmDash in, Tier 1 content (~1 week)

1. Add `emdash` with the D1, R2 and KV bindings. Run admin setup on the preview hostname
   immediately, so no stranger claims admin.
2. Define the Tier 1 collections. Write `scripts/emdash/seed-from-registries.ts` to
   generate `content/emdash/seed.json` from the current TS registries and the copy
   catalog, then `emdash seed` it.
3. Replace each registry with a typed reader:
   - SSR routes use `getEmDash*`.
   - Prerendered routes and tests read the committed seed.
   - Generated `.emdash/types.ts` is committed.
4. Build the record-guard plugin (`beforeSave`: ID index plus copy smells) and the
   publish workflow (`afterPublish` → dispatch → export seed → `seed --validate` → tests
   → commit → deploy).
5. Retire `app/dev/copy`, `CopyStudio`, `api/dev/copy-queue`, `copy-queue.json`,
   `persist-copy-queue.ts`, and the TS registries they replace. Keep `copy:lint` running
   against the seed in CI; today it is not in CI.

Gate, on preview:
- Editing a night's stakes shows on `/` at once, and a snapshot commit lands with a diff.
- An entry with a bad match ID is rejected in the admin.
- Restoring D1 from the committed seed reproduces the site.

#### Phase 2 as built (2026-11-13)

How the live routes work. The Worker has no SQLite, so it cannot run the record queries
behind `/`, `/explore`, `/stories` and `/compare`. Instead:

- Each live route has a prerendered twin (`src/pages/live-snapshot/<name>.astro`).
  Rendering the twin records every query it makes (`recordQueries` in `lib/db.ts`).
  The build merges them into `out/live-snapshot/record.json`: about 1,160 queries,
  about 7 MB.
- On the Worker, `lib/db.ts` resolves to `lib/dbReplay.ts`, which answers from that
  record. `src/middleware.ts` renders with the request's EmDash content
  (`src/rt/editorial-scope.ts`).
- If the render needs a query the deploy never recorded (`record-miss`), the
  middleware serves the twin. It does the same if EmDash cannot be read
  (`unavailable`), holds no entries (`unseeded`), or the render throws (`error`).
  For example, a night added in the admin points at a match the deploy has not
  recorded. The twin never guesses at the record.
- The response header `x-redthread-live` says `live` or `snapshot; <reason>`.
- `cachedQuery` (`lib/queryCache.ts`) skips its cache while recording, so a cache hit
  cannot hide a query from the record.

Verified locally: the built Worker under `wrangler dev`, with local D1 seeded from
`content/emdash/seed.json`.
- All four routes render live, byte-identical to their twins.
- A stakes edit in D1 shows on `/` on the next request.
- A night pointing at an unrecorded match serves the twin (`record-miss`).
- An empty D1 serves the twins (`unseeded`).
- Seed → D1 → `emdash export-seed` → `scripts/emdash/snapshot-seed.mts` reproduces the
  seed byte for byte.

Verified on the preview (2026-11-13):
- Setup loaded the seed: 54 entries. All four routes render live, byte-identical to
  their twins.
- A stakes edit published in the admin showed on `/` on the next request.
- The admin refused a night with an unknown match ID.

Preview resources: D1 `redthread-editorial-preview`, R2 `redthread-media-preview` and KV
`redthread-session-preview`. Their IDs are in `wrangler.jsonc`. A passkey is bound to
its hostname, so production gets its own D1, seeded from git at cutover.
`EMDASH_ENCRYPTION_KEY` has a local backup in the gitignored `.env.emdash-preview`. Plugin
secrets cannot be decrypted without it.

EmDash's setup wizard makes its first visitor the admin. While the `SETUP_TOKEN` secret
is set, `src/worker.ts` returns 404 for the wizard unless the browser first opened it
with that token. Run production setup the same way.

Still open, for Phase 3:
- A snapshot commit landing from a real publish. GitHub runs `repository_dispatch`
  workflows only from the default branch.
- The publish workflow needs the `CLOUDFLARE_D1_EXPORT_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` secrets, and the production D1 name.
- The plugin's `githubRepo` and `githubToken` settings, entered in the admin.

Deviations from the steps above:
- **Copy smells are not save-blocking.** `lib/copySmells.ts` flags copy for human
  review rather than rejecting it. `copy:lint` now runs in CI and in the publish
  workflow instead. The guard blocks only references the record does not hold.
- **Copy Studio stays.** It also covers page copy outside the six Tier 1
  collections. Retire it when a `page_copy` collection exists.
- **No generated `.emdash/types.ts`.** `lib/editorial.ts` types the six collections by
  hand, and `tests/editorial.test.ts` checks them against the seed. `.astro/` and
  `.emdash/` are build output and are gitignored.
- **No deploy step in the publish workflow.** `.github/workflows/publish-editorial.yml`
  pushes the seed. The push triggers the Cloudflare Git build, as the results
  workflows do. It needs the `CLOUDFLARE_D1_EXPORT_TOKEN` (D1 Edit) and
  `CLOUDFLARE_ACCOUNT_ID` secrets, plus the D1 `database_id` in `wrangler.jsonc`.
- **The seed's committed shape is owned by two scripts.**
  `scripts/emdash/seed-from-registries.ts` owns the schema. `snapshot-seed.mts` turns
  each export back into that shape: committed entry order, EmDash's
  `collection:slug` IDs, and EmDash's default taxonomies dropped. A publish therefore
  diffs only what changed. The script fails loudly if the editor used something the
  site does not read (a menu, a block type, a new collection).

**Workers Paid.** The EmDash Worker uploads 5.5 MB gzipped. The Workers Free limit is
3 MB; Paid ($5/mo) allows 10 MB. The account accepted the upload, so no plan change was
needed. EmDash itself is
nearly all of it: the Phase 0 spike measured the same 5.6 MB with no Red Thread code.
The largest pieces are its MCP server, its admin i18n catalogs and its middleware.
Trimming would mean patching EmDash.

### Phase 3: production cutover (planned 2026-11-13)

Production today: `unitedstats` serves the static Next export on `utdred.com` and
`www.utdred.com`. It is packaged by `scripts/build-cloudflare.mjs` and deployed with
`cf deploy`. The last two deploys (2026-11-11) were manual uploads, and master has
commits since then that are not live. Pushes to master do not deploy, so the weekly
data release only reaches the site when someone deploys by hand. `master` has not moved
since `emdash-migration` branched.

#### Decisions (maintainer)

1. **How production deploys.** Recommended: a GitHub Actions `deploy` workflow. It runs
   on push to master, by hand, and as the last job of the data and publish workflows.
   The build needs `data/united.db` and the media reconcile, which already run in
   Actions.
   - The alternatives are Workers Builds (its own build image and time limits) or
     staying manual. Manual means a publish never reaches the prerendered pages.
   - A push made with `GITHUB_TOKEN` starts no other workflow. So the data and publish
     workflows call `deploy` as a reusable workflow; they do not rely on their push
     triggering it.
2. **Keep the preview as staging.** Recommended: yes. It has its own D1 and admin, and
   it is where EmDash upgrades get tried first.
3. **When Next goes.** Recommended: Phase 3b, after a clean week. Rollback is a Worker
   version, not a rebuild, so keeping Next in the tree buys nothing. Removing it only
   adds risk to cutover day.

#### Before cutover, on the branch (no maintainer needed, ~1–2 days)

1. **Packaging parity.** The hybrid build skips `build-cloudflare.mjs` packaging, so the
   EmDash preview currently lacks:
   - its noindex header;
   - the 12 permanent redirects from `vercel.json`;
   - the `/api/*` CORS headers and the `/data/*` cache headers.

   Move that packaging into a shared step the hybrid build runs per mode. Add a check
   that every legacy redirect answers 308, then redeploy the preview.
2. **One Wrangler config, two environments.** Production at the top level: `unitedstats`,
   custom domains `utdred.com` and `www.utdred.com`, production D1/R2/KV, trace
   sampling 0.01 as today. The preview goes under `env.preview`. Check that
   `@astrojs/cloudflare` builds the right environment from `CLOUDFLARE_ENV`; if it
   cannot, use two config files.
3. **Full-profile hybrid build.** Every route so far was proven on the preview profile.
   Measure the full profile:
   - build time, memory, asset count and the size of the record replay;
   - `check:static` and `check:perf`.

   Gate: it builds in CI within the runner's limits.
4. **CI on the Astro build.** `ci.yml` still runs the Next packaging
   (`build:cloudflare`, `check:cloudflare`). Swap in the hybrid build and
   `wrangler deploy --dry-run` for both environments.
5. **The deploy workflow (decision 1).**
   - Triggers: `push` to master, `workflow_dispatch`, `workflow_call`.
   - Steps: build the data, build the site, run the guards, then
     `wrangler deploy --env ''`.
   - Secrets: `CLOUDFLARE_API_TOKEN` (Workers deploy, D1 read for the publish
     snapshot) and `CLOUDFLARE_ACCOUNT_ID`.
   - `update-results.yml`, `enrich-results.yml` and `publish-editorial.yml` call it
     after their push.
6. **The publish workflow, for production.**
   - Target `redthread-editorial`.
   - Add a nightly schedule. It commits any drift between D1 and the seed, so a missed
     dispatch heals itself. This closes the drift risk listed under Risks.
7. **Scripts and owner docs.**
   - Scripts: `dev` becomes `astro dev`, and `start` serves the built Worker.
   - Docs: `ARCHITECTURE.md`, `PIPELINE.md`, `PERF.md`, `README.md`,
     `docs/README.md` and `AGENTS.md`. `AGENTS.md` still tells agents to read the
     Next docs.
   - The main checkout has an unresolved merge conflict in `docs/ARCHITECTURE.md`.
     The maintainer resolves it before the docs change lands.
8. **Open the PR** from `emdash-migration` with CI green.

#### Prep as built (2026-11-13)

- **Packaging.** `scripts/package-assets.mjs` runs at the end of every build. It
  writes `out/_redirects` from `vercel.json` and merges the API, data and noindex rules
  into the adapter's `out/_headers`. `_headers` covers only static files, so the
  Worker sends noindex itself unless `SITE_INDEXABLE` is `"true"`. On the preview:
  noindex is on every response, all 12 legacy redirects answer 308, and the `/api/*`
  CORS headers are back.
- **Config.** The plan had production at the top level; it went the other way. The
  preview is the default and production is `env.production`, so a build without
  `CLOUDFLARE_ENV` can never ship to utdred.com. Production sets
  `workers_dev: false`, so there is no indexable workers.dev copy.
  `@astrojs/cloudflare` flattens the chosen environment into
  `dist/server/wrangler.json`, which was verified for both targets.
- **Full build.** 5 min 52 s, 2.5 GB peak memory, 11,271 files, 498 MB (`PERF.md`).
  `check:static` now requires each live route to have its twin and no prerendered file
  shadowing it. `check:perf` budgets only the chunks a page can load, because the
  admin's bundles exceed the visitor budget.
- **Checks.** `scripts/check-worker-config.mjs` checks a build against its target.
  `--deployable` also requires the D1 and KV IDs: without them, Wrangler would create
  new, empty resources. `--smoke <origin>` checks a deployed site: live render,
  indexing and the redirects. `wrangler deploy --dry-run` passes for production
  without the IDs, so CI runs it before the resources exist.
- **Workflows.**
  - `deploy.yml` runs on a push to master, by hand, and through `workflow_call`.
  - `update-results`, `enrich-results` and `publish-editorial` call it with their
    pushed commit, even when a later step fails.
  - The Cloudflare token lives in a GitHub environment, `production`, so nothing
    deploys until that environment exists.
  - `publish-editorial` reads production D1 (`--env production`) and runs nightly at
    03:30 UTC.
- **Scripts.**
  - `dev` runs `astro dev`; `dev:next` keeps Next.
  - `start` serves the built Worker.
  - `deploy:preview` checks, then deploys a default build.
  - `deploy:cloudflare-preview` and `check:cloudflare` are gone: the first would now
    overwrite the EmDash preview with the Next build.
- **Docs.** `PIPELINE.md` (Deploy), `README.md`, `docs/README.md`, `AGENTS.md` and
  `PERF.md` are updated. `ARCHITECTURE.md` carries a banner only. The full rewrite
  waits for the maintainer's merge conflict in the main checkout.

#### Cutover (maintainer present, ~1 hour)

1. **Note the current production version** (`wrangler deployments list --name
   unitedstats`) as the rollback target. Tag `master` as `pre-astro-cutover`.
2. **Create the production resources and secrets.**
   - Resources: `redthread-editorial`, `redthread-media`, `redthread-session`. Put
     the D1 `database_id` and the KV `id` into `env.production` in `wrangler.jsonc`
     and commit them to the branch. `check-worker-config.mjs --deployable` refuses
     a deploy without them.
   - Worker secrets: a new `EMDASH_ENCRYPTION_KEY`, backed up locally the same way as
     the preview's, and a new `SETUP_TOKEN`
     (`wrangler secret put … --env production`).
   - GitHub:
     - a `production` environment holding `CLOUDFLARE_API_TOKEN` (Workers scripts,
       routes and custom domains on utdred.com, plus D1, R2 and KV);
     - repository secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_D1_EXPORT_TOKEN`
       (D1 Edit, for the publish snapshot; exports require a database lock).

     These must exist before the merge, because the merge deploys.
   Provisioned on 2026-11-14 for PR #79: D1 `redthread-editorial`
   (`fb1c72c0-e380-4d58-9b17-41ff1702a8b9`), R2 `redthread-media`, and KV
   `redthread-session` (`75ef7b607fa64bf288396a4fd8bf9fa1`). Both Worker secrets
   are installed on `unitedstats`; their backup is the gitignored
   `.env.emdash-production` in the migration worktree (mode 0600). Preserve this
   file before retiring that worktree. `CLOUDFLARE_ACCOUNT_ID` is set in GitHub;
   the existing `Production` environment is used for the deploy token.
   Both API tokens were created through Safari and stored in their GitHub secrets on 2026-11-14.

   Rollback target recorded before changing secrets:
   `63d96e54-3a78-4b34-aec9-a8ab76b95c3b` (static Next Worker).
   Remote tag `pre-astro-cutover` points to master
   `572a368e3976a8302ff7e32991861b1c209331df`.

   The export token needs **D1 Edit**, despite the earlier read-only wording:
   [Cloudflare requires Write for export because it locks the database](https://developers.cloudflare.com/d1/observability/debug-d1/#error-10000-and-token-permissions).
   The deploy smoke check permits `snapshot; unseeded` only while the status API
   reports pending setup with seed content and the wizard returns 404 without its
   token. After setup, the same check requires live rendering.

3. **Merge the PR.** The push runs `deploy.yml`: build, config check, deploy, smoke
   test. Until setup runs, the live routes serve their deploy-time twins (`unseeded`),
   so visitors see no change.
4. **Admin setup on `https://utdred.com/_emdash/admin/setup`**, through the token
   gate. Include the content. The passkey is for `utdred.com`.
5. **Smoke test.**
   - The four live routes answer `live`, byte-identical to their twins.
   - Entity pages, the record-reader redirects and the 404 page.
   - The legacy redirects and the www → apex 308.
   - `robots.txt` (indexable; `/_emdash/` disallowed), `sitemap.xml`, the `/api`
     headers and OG images.
   - An Umami pageview. The Google verification TXT record is untouched.
6. **Wire publishing.**
   - In the admin, the record-guard plugin's `githubRepo` and a fine-grained
     `githubToken`: this repository only, Contents read and write. The maintainer
     enters it.
7. **Prove the loop.** Edit a night and publish. Expect:
   - the dispatch runs;
   - the seed commit lands;
   - the deploy runs;
   - the twin and record replay include the change.

**Rollback:** `wrangler rollback <noted version>` restores the static Next Worker at once,
with its assets; D1 is untouched. Revert the merge on master if the cause is in code.

#### First cutover attempt (2026-11-14)

PR #79 merged as `f83cb836bd33e6a575ccd4f401c19f06d59549a5` after both
CI runs passed. The Worker upload succeeded, but live checks found two problems:
public fallbacks inherited `noindex` from `/live-snapshot/*`, and concurrent
cold requests failed while the fresh D1 database was migrating. The Worker logs
reported the migration lock held since `2026-11-14T08:19:40.475Z`.

Production was restored to static Worker version
`2e9482b0-4d07-4b5c-b12b-8900de3c6210`, which preserves the new Worker secrets.
The deployment workflow was cancelled after rollback. The homepage, stories,
compare and health endpoint then returned 200 without `noindex`.

All 96 EmDash migrations are now applied in production D1, with no pending or
unknown migrations and no held lock. Recovery changes remove the private asset's
indexing header from public fallbacks and move schema checks before code upload.
Runtime requests check migrations rather than running them. Admin passkey setup
and the publish loop remain pending.

#### Production admin and deployment ownership (2026-11-14)

The verified CMS release `848ed3aa-43e2-40cc-b236-a8bad2b4e172` was
subsequently overwritten by Cloudflare Workers Builds. The old `Deploy production`
trigger still watched `master`, ran `npm run build:cloudflare -- production`, and
uploaded a static-only Worker with `npx cf deploy --prebuilt --mode production`.
Its builds for PRs #79 and #80 finished after the GitHub deployment. The earlier
statement that pushes did not deploy was incorrect.

On 2026-11-14, **Disable builds** was saved in the production Worker's Cloudflare
Builds settings. The repository connection and old configuration were preserved;
GitHub Actions now owns production deployments. The CMS version above was restored.
Do not re-enable the legacy build while the hybrid Worker is in use.

The maintainer completed the production passkey setup and imported all 54 entries.
The CMS site URL is `https://utdred.com`, timezone is `Europe/London`, and site
visibility is Live. The strict four-route live check and public-site smoke check
passed after setup. The encrypted record-guard plugin setting points to
`cbrown564-alt/unitedstats`. Its fine-grained token,
`redthread-production-editorial`, has Contents read/write on this repository only
and expires on **14 November 2027**. Renew it in the plugin settings before expiry.
The punctuation-only test publish completed the full loop: live D1 content,
repository dispatch, checked seed commit
`5fa82d7917c7e3b2007e255594388dd6be08a45a`, and production deployment with
passing smoke checks ([run 43582224401](https://github.com/cbrown564-alt/unitedstats/actions/runs/43582224401)).
The deployed fallback snapshot contained the test edit too. The original sentence
was restored in the admin and committed as
`fbb77afaf019ab86667af0701552b6807513c366`; its
[snapshot and production deployment](https://github.com/cbrown564-alt/unitedstats/actions/runs/43583137315)
also passed. Direct requests confirmed the exact original text in both the live
homepage and the deployed fallback snapshot. The only lasting seed change from
setup is the `Europe/London` timezone. Verification evidence is retained under
`output/cutover-2026-11-14/` in the migration worktree.

After that first successful publish deployment, the one-time `SETUP_TOKEN` was
deleted from the Worker and the local mode-600 secret backup. Only
`EMDASH_ENCRYPTION_KEY` remains in the Worker secret list. The strict live check
passed again after removal. No Cloudflare Workers Build started for the snapshot
commit.

#### The watch week

- Each day: Cloudflare observability (errors, CPU time) and the `x-redthread-live`
  snapshot rate in the logs.
- The weekly data release must deploy by itself.
- Compare Search Console with the November baseline.
- Re-run the Lighthouse corpus on a quiet machine and record it in `PERF.md`.

#### Phase 3b: remove Next (after a clean week, ~1 day)

- **Types:**
  - Point TypeScript at the shims for `next/*` (tsconfig `paths`).
  - Replace the `Metadata` and `MetadataRoute` type imports (34 files) with local
    types.
- **Lint:** replace `eslint-config-next` with typescript-eslint, react-hooks and
  jsx-a11y.
- **Files:**
  - Delete `next.config.ts`, `next-env.d.ts`, `cloudflare.config.ts`,
    `wrangler.config.ts` and `deploy/cloudflare-worker.ts`.
  - Remove the `cf` package.
  - Move the `vercel.json` redirects into the packaging step's own file.
- **Dependencies:** remove `next` and `eslint-config-next`.

### Phase 4: story bodies in Portable Text (gated, optional)

Do this only if editing story prose in the admin is actually wanted (see "Validate before
building"). The bodies interleave prose with data-driven client visuals (`TrebleSpinoff`,
`FortressSpinoff`, `ThreadOfNights`…). Each visual would become a custom block that
references record IDs and renders the existing component. The facts asserted in
`tests/journey.test.ts` must keep passing against the snapshot. Start with one story
(Forgotten Night) and stop if the block set grows past a handful.

## Risks

- **Port cost and freeze.** Phase 1 is most of the work and delivers nothing visible.
  It competes with the Reddit launch work. Sequence it deliberately.
- **Content provenance drift.** If the publish snapshot ever fails silently, git and D1
  diverge. The publish workflow fails loudly, and its nightly run (Phase 3) commits any
  drift it finds.
- **The easy content is small; the rich content is hard.** Tier 1 moves cleanly, but the
  stories carry most of the prose and are the hardest part to move (Phase 4).
- **Runtime surface.** The site gains a login endpoint, a database and cron. That means
  admin hardening, robots exclusion, D1 Time Travel or backups, and secrets
  (`EMDASH_ENCRYPTION_KEY`).
- **Cost.** The EmDash Worker is 5.5 MB gzipped, over the Workers Free 3 MB limit, so
  it needs Workers Paid ($5/mo), whatever the traffic. Sandboxed (third-party)
  plugins would need it too; our own plugin is native.

## Decisions (2026-11-13)

1. **Editors: the maintainer only.** One Administrator account; no Editor or Contributor
   workflow, no pre-publish review queue. The record-guard plugin and the publish
   workflow are the review.
2. **Publish model: the recommended hybrid.** Live SSR on `/`, `/explore`, `/stories`
   and `/compare`; everything else prerendered; every publish snapshots to git and
   deploys.
3. **Story bodies are in scope.** Phase 4 runs.
4. **Timing: first priority.** The migration goes ahead of the pre-Reddit launch fixes.
