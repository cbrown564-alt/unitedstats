# Astro + EmDash migration plan

Status: **Phase 0 and Phase 1 done; Phase 2 built and verified locally** (2026-11-13;
findings and the Phase 1 approach in [ADR 0006](adr/0006-move-to-astro-for-emdash.md)).
The static Astro build is live on `unitedstats-migration-preview`. The EmDash Worker is
not deployed anywhere yet: that needs the maintainer present (D1/R2 creation, the
encryption key, passkey setup) and a decision on Workers Paid (see "Phase 2 as built").
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

Not yet verified (each needs the deployed preview):
- Rejection inside the admin UI. The guard itself is unit-tested in
  `tests/editorial.test.ts`.
- A snapshot commit landing from a real publish.

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
  workflows do. It needs the `CLOUDFLARE_D1_EXPORT_TOKEN` (D1 read) and
  `CLOUDFLARE_ACCOUNT_ID` secrets, plus the D1 `database_id` in `wrangler.jsonc`.
- **The seed's committed shape is owned by two scripts.**
  `scripts/emdash/seed-from-registries.ts` owns the schema. `snapshot-seed.mts` turns
  each export back into that shape: committed entry order, EmDash's
  `collection:slug` IDs, and EmDash's default taxonomies dropped. A publish therefore
  diffs only what changed. The script fails loudly if the editor used something the
  site does not read (a menu, a block type, a new collection).

**Open decision: Workers Paid.** The EmDash Worker uploads 5.5 MB gzipped (Wrangler dry
run). The Workers Free limit is 3 MB; Paid ($5/mo) allows 10 MB. EmDash itself is
nearly all of it: the Phase 0 spike measured the same 5.6 MB with no Red Thread code.
The largest pieces are its MCP server, its admin i18n catalogs and its middleware.
Trimming would mean patching EmDash, so the realistic path is Workers Paid.

### Phase 3: production cutover (~2 days)

1. Back up and freeze.
2. Deploy the Astro Worker to `unitedstats` and `utdred.com`, then run admin setup on
   the prod hostname.
3. Watch Cloudflare observability and Umami for a week. Re-run the Lighthouse corpus on a
   quiet machine and record it in `PERF.md`.
4. Update the owner docs: `ARCHITECTURE.md`, `PIPELINE.md`, `PERF.md`, `README.md`,
   `docs/README.md` and `AGENTS.md` (which tells agents to read the Next docs).
5. Remove the `next` and `@next/*` dependencies.

Rollback: the previous static `out/` stays deployable as a Worker version until the week
is clean.

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
  diverge. The publish workflow must fail loudly. Add a nightly diff check: live
  export vs committed seed.
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
