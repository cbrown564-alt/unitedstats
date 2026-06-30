# Incident — production outage from the runtime-DB-via-Vercel-Blob scheme (2026-06-30)

**Status:** resolved. Production was instant-rolled-back to the last good deploy
(#27 `50158a6`); the fix in this report makes the runtime DB path fail-safe and
adds validation so it can't silently regress.

**One-line cause:** every dynamic page read the SQLite DB from
`/tmp/unitedstats-united.db`, a file that an `instrumentation.ts` cold-start hook
was supposed to download from Vercel Blob. In production `/tmp` was empty, so
`getDb()` hard-threw and the **entire site 500'd** — including the homepage.

---

## What you need to know first (TL;DR for future sessions)

- The DB-from-Blob/`/tmp` scheme was introduced in **PR #26** ("Option 2:
  on-demand revalidation") and made buildable in **PR #29**. Both were reverted;
  `master` was reset to #26 and then fixed forward by this change.
- The failing code path **only runs in production** — it is gated on
  `UNITEDSTATS_DB_BLOB_URL`, which previews/CI/local **do not set**. They read the
  bundled `data/united.db`. So previews were always green and the prod path had
  **never** worked. Do not trust a green preview as evidence the prod DB path works.
- Last known-good production before the scheme = **#27 `50158a6`**, which predates
  it entirely.
- The fix: **bundled `data/united.db` is the source of truth**; the blob is a
  best-effort freshness upgrade with a hard fallback. A missing/corrupt blob now
  degrades to "data as of the last deploy", never a 500.

## Symptom & evidence

- Linked broken deploy: #29 `b2324275` (`dpl_CqtRJkrDA7FAQe4trRNz4hKWxUr2`),
  built **READY** → so this was a **runtime** failure, not a build failure.
- Runtime logs: **8× HTTP 500, 2× 200**; every 500 identical (`digest 2807384777`)
  on `GET /`:
  ```
  Error: Runtime database missing at /tmp/unitedstats-united.db.
  Ensure instrumentation ran or call resetDb() after upload.
  ```
- That message is the blob branch of `lib/db.ts` — it only fires when
  `usesRuntimeDbBlob()` is true, i.e. `UNITEDSTATS_DB_BLOB_URL` **was** set at
  runtime, so the code looked in `/tmp` and the file wasn't there.
- No `download`/`blob`/`instrumentation` log line existed for the deploy → the
  cold-start download neither succeeded nor logged its throw in the request stream.

## Root cause — two layers

**Layer 1 — build (the #26 problem, addressed by #29).**
`lib/db.ts` probed the DB with `fs.existsSync(path.join(process.cwd(), …))`.
`@vercel/nft` (Next's file tracer) treats an unresolvable `process.cwd()` `fs`
read as a dynamic dependency and pulls a broad slice of the repo (incl.
`data/canonical` ~40MB and `@vercel/blob`'s tree) into **every** serverless
function, crossing Vercel's **250MB** limit → production deploys ERRORed at the
output stage (`6092bee`, `a3eb7a6`, #28 `b9327ce`).

**Layer 2 — runtime (the #29 problem, fixed here).**
With the build fixed, #29 deployed READY but every dynamic route 500'd because
`/tmp/unitedstats-united.db` was absent. The homepage is `force-dynamic`
(TonightHero → `greatNights()` → `getDb()`), so even the front door read the DB
on every request and failed. `/tmp` was never reliably populated: instrumentation
is a best-effort cold-start side effect, the blob is uploaded only by the
scheduled `update-results.yml` job (decoupled from deploys, so the object may not
exist at deploy time), and any failure was fatal because `getDb()` threw.

## Why it escaped every check

The blob/`/tmp`/instrumentation path is gated on `UNITEDSTATS_DB_BLOB_URL`, which
previews, CI, and local **never set** — they read `data/united.db` built from
canonical JSON (prebuild / `npm run build:db`), not the blob path.
So every PR preview exercised a *different* code path than production, all checks
were green, and the prod-only path shipped having never run successfully.

## The fix (this change)

1. **Bundled DB is the runtime floor.** `data/united.db` (built at deploy from
   canonical JSON, gitignored) is bundled into every function via
   `outputFileTracingIncludes: { "/*": ["data/united.db"] }`.
   `getDb()` reads the `/tmp` blob copy *only when it exists* and otherwise falls
   back to the bundled copy; if the `/tmp` copy is unreadable it catches and falls
   back too. It only throws if the bundled copy is genuinely missing.
2. **Blob is a best-effort upgrade.** `instrumentation.ts` wraps the cold-start
   download in try/catch (non-fatal). `resetDb()` returns whether the refresh
   landed and never throws on a failed download. `/api/revalidate` reports the
   real `dbRefreshed` outcome.
3. **No more whole-repo tracing.** The only `fs` probe is `fs.existsSync` against
   `RUNTIME_DB_PATH` under `os.tmpdir()` (not a project path), so nft no longer
   over-traces. `outputFileTracingExcludes` for build-only trees stays as
   belt-and-suspenders.
4. **Observability + validation** (so it can't silently rot):
   - `GET /api/health` → `{ ok, source: "blob"|"bundled", blobConfigured, matches }`.
   - `scripts/check-blob.mjs` — verifies `UNITEDSTATS_DB_BLOB_URL` is a reachable
     SQLite file (wired into `update-results.yml` after `upload:db`, fatal).
   - `scripts/smoke-check.mjs` — GETs `/api/health`, `/`, `/matches` on a live URL.
   - `tests/db-fallback.test.ts` — locks in the fallback decision.

## Runbook

**Deploy / promote production safely**
1. Push to `master` → Vercel full build (~15 min). A code change must full-build;
   data-only commits skip the build (`scripts/vercel-should-build.mjs`).
2. After it's READY, smoke it: `node scripts/smoke-check.mjs --site https://unitedstats.vercel.app`.
   Expect `source=blob` (if blob configured) or `bundled`, and all GETs 200.
3. If `/api/health` is `ok:false` or pages 500 → **instant-rollback in the Vercel
   dashboard** to the last good deploy, then investigate. Rolling back the alias
   is independent of git.

**Data ingest (no rebuild)** — `update-results.yml` on new matches: `upload:db`
→ `check-blob` → `revalidate` (`resetDb()` pulls the fresh blob into `/tmp`) →
`smoke-check`. If the blob is bad, prod keeps serving the bundled (deploy-time)
data rather than going down.

**Env matrix**

| Env | `UNITEDSTATS_DB_BLOB_URL` | DB source |
| --- | --- | --- |
| Local / CI | unset | bundled `data/united.db` |
| Preview | unset by default (recommend setting it to exercise the path) | bundled, or blob-with-fallback if set |
| Production | set | blob `/tmp` copy, falling back to bundled |

Secrets: `BLOB_READ_WRITE_TOKEN` (upload), `UNITEDSTATS_DB_BLOB_URL` (runtime),
`REVALIDATE_SECRET` (`POST /api/revalidate`), `UNITEDSTATS_SITE_URL` (scripts).

## Follow-ups (not done here)

- Consider setting `UNITEDSTATS_DB_BLOB_URL` on **Preview** so PR deploys actually
  run the download path before promotion.
- The homepage being `force-dynamic` is what turned a data-staleness issue into a
  full outage. Revisit whether `/` (and other DB-heavy routes) can be ISR/SSG with
  on-demand revalidation, shrinking the runtime blast radius.
