# Handoff: Phase 13 History-Changed Engine Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- Added a deterministic history-changed digest engine in `lib/historyDigests.ts`.
- Added a build-time/local generator script under `scripts/generate-history-digests.ts`.
- Generated three current digest artifacts under `data/history-digests/`.
- Added the canonical `/history-changed/[id]` page, generated metadata, OG image route, and sitemap entries.
- Hooked the generator into `.github/workflows/update-results.yml` after `validate` and `build:db`.
- Added detector/generator/page tests and public documentation.

Deferred:

- Phase 14 machine-facing answer APIs and JSON-LD.
- Phase 15 correction UI.
- Phase 16 on-this-day, collections, and embeds.

Out of scope:

- Network enrichment or source scraping. The digest generator is local-only.

## Changed Files

| File | Purpose |
| --- | --- |
| `lib/historyDigests.ts` | Digest schema, detector engine, artifact read/write helpers, latest-match selector, title/summary helpers. |
| `scripts/generate-history-digests.ts` | Build-time local generator supporting `--latest`, `--match`, `--all`, and `--out`. |
| `data/history-digests/*.json` | Three generated digest artifacts for the latest three official matches. |
| `app/history-changed/[id]/page.tsx` | Canonical digest page using generated artifacts. |
| `app/history-changed/[id]/opengraph-image.tsx` | Shareable OG image route using the existing `entityCard` surface. |
| `app/sitemap.ts` | Adds generated digest pages to the sitemap. |
| `.github/workflows/update-results.yml` | Runs generator after `validate`/`build:db`; commits `data/history-digests`. |
| `package.json` | Adds `npm run generate:history-digests`. |
| `tests/history-digests.test.ts` | Generator and detector golden tests. |
| `tests/history-digest-page.test.ts` | Rendered page/metadata/OG response tests. |
| `docs/HISTORY-DIGESTS.md` | Public digest contract, generator, detector spec, correction/version policy. |
| `data/united.db` | Rebuilt by verification commands. |
| `public/dataset/manifest.json` | Re-exported by `npm run build`; `built_at` changed to `2026-06-23T20:34:41.428Z`. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| Latest digest artifacts | `data/history-digests/2026-05-09-sunderland-a.json`, `2026-05-17-nottingham-forest-h.json`, `2026-05-24-brighton-and-hove-albion-a.json`. |
| One digest per requested match | `history digest writer emits exactly one artifact for one requested match` asserts N=1; `history digest writer emits exactly one deterministic artifact per requested match` asserts N=3. |
| Order-stable sequence | `history digest ordering is byte-stable for same-date ties` asserts date then bytewise id ordering; latest-three selector asserts chronological output. |
| No-change run | `history digest latest selector is date-ordered and supports a no-change run` plus command evidence below show `--latest 0` writes zero files. |
| Detector coverage | `history digest detectors have positive and negative golden cases` asserts positive and negative fixtures for record, streak start/end, rank change, manager milestone, opponent milestone, unusual scoreline, venue fact, Elo movement, and historical percentile. |
| Claim version correction policy | `history digest claim versions stay stable for the same facts and change when content changes`. |
| Page/share surface | `history-changed page renders digest claims and evidence links`; `history-changed OG image route returns a PNG response`; `next build` lists three `/history-changed/[id]` SSG pages. |
| Workflow hook | `.github/workflows/update-results.yml` runs `npm run generate:history-digests -- --latest ${{ steps.fetch.outputs.new }}` after `validate` and `build:db`. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | Generator run twice into separate temp dirs for the same match and `diff -ru` produced no output; generated JSON has no wall-clock timestamp. |
| X2 | Met | `lib/historyDigests.ts` and `scripts/generate-history-digests.ts` read local SQLite/artifacts only; no network calls. |
| X3 | Met | Added `tests/history-digests.test.ts` and `tests/history-digest-page.test.ts`. |
| X4 | Met | `npm run knip`, `npm run validate`, `npm run build:db`, `npm test`, `npm run build`, and `npm run check:static` all pass. |
| X5 | Met | Artifacts use Phase 0 `historyDigestRef`, `claimVersion`, `matchSourceProvenance`, canonical match ids, and match source facets. |
| X6 | Met | This handoff maps each claim to tests, files, generated artifacts, and command logs. |
| X7 | Met | Before App Router/metadata/OG edits, Codex read local Next docs: `01-app/01-getting-started/03-layouts-and-pages.md`, `01-app/01-getting-started/14-metadata-and-og-images.md`, `01-app/03-api-reference/04-functions/generate-static-params.md`, and `01-app/03-api-reference/04-functions/image-response.md`. |
| 13.1 | Met | Latest selector returns date-ordered ids; writer emits exactly one artifact per requested official match; tests cover 0, 1, and 3 match runs plus byte-stable same-date tie ordering. |
| 13.2 | Met | Generator lives under `scripts/`; workflow runs it after `validate` and `build:db`; `git add` includes `data/history-digests`. |
| 13.3 | Met | Digest JSON includes `ref`, `claimVersion`, `matchId`, `canonicalUrl`, `evidenceLinks`, `provenance`, and compact `claims`. |
| 13.4 | Met | Detector spec is in `docs/HISTORY-DIGESTS.md`; positive and negative golden assertions cover each required detector. |
| 13.5 | Met | Elo movement, rank, and percentile use the existing `elo_history` table via the local DB. |
| 13.6 | Met | `--latest 0` exits successfully, logs `wrote 0`, and writes no files. |
| 13.7 | Met | Canonical page and OG image route reuse existing `PageHeader`, `ShareCite`, `CoverageNote`, and `entityCard`; tests assert claim text, match/API links, metadata, and PNG OG response. |
| 13.8 | Met | Digest ids/URLs are stable by match id; test mutates content and proves `claimVersion` changes while `ref.id` stays stable. |
| 13.9 | Met | `docs/HISTORY-DIGESTS.md` explains digest purpose, scope, detector triggers, source policy, and correction/version behavior. |

## Commands

Focused Phase 13 tests:

```text
$ npx tsx --test tests/history-digests.test.ts tests/history-digest-page.test.ts
tests 9
pass 9
fail 0
```

Determinism and no-change evidence:

```text
$ tmp=$(mktemp -d); npm run generate:history-digests -- --match 2026-05-24-brighton-and-hove-albion-a --out "$tmp/a" >/tmp/history-digest-a.log; npm run generate:history-digests -- --match 2026-05-24-brighton-and-hove-albion-a --out "$tmp/b" >/tmp/history-digest-b.log; diff -ru "$tmp/a" "$tmp/b"; npm run generate:history-digests -- --latest 0 --out "$tmp/empty"; find "$tmp/empty" -type f 2>/dev/null | wc -l; rm -rf "$tmp"

history-digests: no match ids requested; wrote 0
       0
```

Full gates:

```text
$ npm run knip
> unitedstats@0.1.0 knip
> knip

$ npm run validate
validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings

$ npm run build:db
built /Users/cobro/code/unitedstats/data/united.db: 6027 matches (1886-10-30 → 2026-05-24), 19661 events, 6022 matches with lineups

$ npm test
tests 54
pass 54
fail 0

$ npm run build
✓ Compiled successfully in 4.1s
Finished TypeScript in 5.3s ...
✓ Generating static pages using 7 workers (7440/7440) in 3.0min
● /history-changed/[id]
  ├ /history-changed/2026-05-09-sunderland-a
  ├ /history-changed/2026-05-17-nottingham-forest-h
  └ /history-changed/2026-05-24-brighton-and-hove-albion-a

$ npm run check:static
✓ static-render guard: 7 static pages, 5 SSG routes, 7438 prerendered paths.
```

## Rendered/API Evidence

Rendered page assertions:

```text
history-changed page renders digest claims and evidence links:
- includes "History changed"
- includes "United gained 16.1 Elo points"
- includes href="/match/2026-05-24-brighton-and-hove-albion-a"
- includes href="/api/v1/matches/2026-05-24-brighton-and-hove-albion-a"
- includes "claim version cv1-"
```

Generated artifact sample:

```text
data/history-digests/2026-05-24-brighton-and-hove-albion-a.json
claimVersion: cv1-0b20b98d225c1d5b
claims:
- rank-change: United's Elo rose from historical rank 2601 to 2266 after this match.
- elo-movement: United gained 16.1 Elo points, from 1655 to 1671.
claim evidencePath: /match/2026-05-24-brighton-and-hove-albion-a
```

## Risks And Known Gaps

- Only the latest three existing matches have checked-in digest artifacts. The
  generator supports `--all`, `--match`, and `--latest`; the cron hook creates
  new artifacts as future matches land.
- The Elo/rank detectors are intentionally tied to the existing
  closed-universe `elo_history` model. If that model changes, golden values
  should change deliberately.
- Static generation now includes three additional digest pages.
- `data/united.db` and `public/dataset/manifest.json` are rebuilt artifacts;
  the manifest diff is only `built_at`.

## Prior Review Disposition

| Finding | Disposition | Evidence |
| --- | --- | --- |
| Claude review failed 13.1 because N=1 emission was not evidenced. | Fixed. | Added `history digest writer emits exactly one artifact for one requested match`; focused test run now reports 9 pass. |
| Claude review failed 13.1 order-stability because same-date tie ordering was not evidenced and writer used `localeCompare`. | Fixed. | `orderHistoryDigestMatchIds` now uses bytewise date/id ordering; added `history digest ordering is byte-stable for same-date ties`. |
