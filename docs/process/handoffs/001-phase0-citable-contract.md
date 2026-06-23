# Handoff: Phase 0 Citable Contract Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- Added the shared citable ID, canonical URL, claim version, and provenance
  helpers in `lib/citations.ts`.
- Added Phase 0 golden tests covering required citable units, ID
  round-trips/collisions, curated and forked Cut keys, claim-version stability,
  canonical provenance dates, and no-date omission.
- Added the human-facing Phase 0 contract document and linked it from the
  process README.

Deferred:

- No app routes or user-visible pages were wired to the helpers yet. Phases
  13-16 will consume this contract.

Out of scope:

- JSON-LD, `/llms.txt`, digest generation, correction UI, on-this-day,
  collections, and embeds.

## Changed Files

| File | Purpose |
| --- | --- |
| `lib/citations.ts` | Shared Phase 0 citable-unit registry, logical IDs, stable refs, canonical claim hashing, and provenance shaping. |
| `tests/phase0-citations.test.ts` | Golden tests for Phase 0 round-trip/collision/version/provenance behavior. |
| `docs/process/PHASE0-CITABLE-CONTRACT.md` | Human-facing citable answer and provenance contract. |
| `docs/process/README.md` | Links the Phase 0 contract into the process trail. |
| `data/united.db` | Rebuilt by `npm run build`; binary build artifact was already dirty before this pass. |
| `public/dataset/manifest.json` | Re-exported by `npm run build`; `built_at` changed to `2026-06-23T20:18:14.704Z`. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| Required citable units | `tests/phase0-citations.test.ts` asserts all 11 required kinds from `ACCEPTANCE.md` 0.1 exist in `CITABLE_UNITS`. |
| Stable logical IDs | `citable IDs round-trip and do not collide across the known public set` enumerates all matches, players, managers, opponents, seasons, questions, curated Cuts, and synthetic future units. |
| Cut IDs | `Cut citable keys are stable for curated cuts and normalized forks` proves curated Cuts use slugs and forks normalize query params. |
| Claim versions | `claim versions are canonical-data hashes, not object-order hashes` proves object key order does not affect versions and fact changes do. |
| Provenance shape | `provenance includes canonical dates when present and omits wall-clock fallbacks` proves player record `statsAsOf` is included and match-source provenance omits missing dates. |
| Digest/correction policy | `docs/process/PHASE0-CITABLE-CONTRACT.md` documents recompute/stable-ID/changing-version behavior and correction request handling. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | No generated claim artifacts were introduced. `claimVersion` is deterministic over `canonicalStringify`; tests prove object-order stability and changed facts changing the version. |
| X2 | Met | `lib/citations.ts` is pure/local and performs no network calls. |
| X3 | Met | Added `tests/phase0-citations.test.ts` with golden assertions for Phase 0. |
| X4 | Met | `npm run knip`, `npm run validate`, `npm test`, `npm run build`, and `npm run check:static` all pass. `npm run build` includes `build:db` and `export:dataset`. |
| X5 | Met | Provenance uses canonical source ids/fields and canonical route evidence paths; no parallel data schema or source catalog was added. |
| X6 | Met | This handoff maps each claim to files/tests/commands. |
| X7 | Not applicable | No Next.js App Router routes, metadata, route handlers, OG image routes, or headers were edited. |
| 0.1 | Met | `CITABLE_UNITS` defines match, entity, season, question, Cut, answer, history digest, correction, on-this-day, collection, and embed units; tests assert the set. |
| 0.2 | Met | `citableId`, `matchRef`, `entityRef`, `seasonRef`, `questionRef`, `cutRef`, `answerRef`, `historyDigestRef`, `correctionRef`, `onThisDayRef`, `collectionRef`, and `embedRef` are pure functions of route params, normalized Cut params, or payload content. |
| 0.3 | Met | `claimVersion` uses canonical content hashing; tests show stable object-order behavior and changed canonical facts changing the version. |
| 0.4 | Met | `ClaimProvenance` and `claimProvenance` define source id/name/url, facet/confidence/scope, evidence path/url, canonical dates only when supplied, and notes. |
| 0.5 | Met | Tests cover round-trip/collision over the known set, curated Cuts, synthetic answer/digest/correction/on-this-day/collection/embed refs, and no-date provenance omission. |
| 0.6 | Met | `PHASE0-CITABLE-CONTRACT.md` documents digest recompute, stable logical IDs, changing claim versions, and correction request policy. |

## Commands

Native-module repair needed before DB-backed tests:

```text
$ node -v && npm -v && which node && which npm
v25.3.0
11.7.0
/opt/homebrew/bin/node
/opt/homebrew/bin/npm

$ npm rebuild better-sqlite3
rebuilt dependencies successfully
```

Focused Phase 0 test:

```text
$ npx tsx --test tests/phase0-citations.test.ts
tests 7
pass 7
fail 0
duration_ms 597.734125
```

Full test suite:

```text
$ npm test
tests 45
pass 45
fail 0
duration_ms 1553.16275
```

Static/data gates:

```text
$ npm run knip
> unitedstats@0.1.0 knip
> knip

$ npm run validate
validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings

$ npm run build:db
built /Users/cobro/code/unitedstats/data/united.db: 6027 matches (1886-10-30 → 2026-05-24), 19661 events, 6022 matches with lineups

$ npm run build
✓ Compiled successfully in 6.5s
Finished TypeScript in 5.3s ...
✓ Generating static pages using 7 workers (7437/7437) in 3.1min

$ npm run check:static
✓ static-render guard: 7 static pages, 5 SSG routes, 7435 prerendered paths.
```

## Rendered/API Evidence

Not applicable for Phase 0. No routes or UI were changed.

## Risks And Known Gaps

- `historyDigestRef` points to `/history-changed/[matchId]`, which does not
  exist yet. Phase 13 is responsible for the route/generator.
- `collectionRef`, `embedRef`, and `correctionRef` define stable future IDs
  before their user-facing surfaces exist.
- `data/united.db` and `public/dataset/manifest.json` were already dirty before
  Phase 0 work; `npm run build` refreshed them again. The manifest diff is only
  `built_at`.

## Prior Review Disposition

No prior Phase 0 implementation review.
