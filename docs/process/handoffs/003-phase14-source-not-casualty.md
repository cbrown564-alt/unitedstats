# Handoff: Phase 14 Source, Not Casualty Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- JSON-LD for selected entity pages: `/match/[id]` emits a `SportsEvent`.
- JSON-LD for selected answer pages: `/history-changed/[id]` emits a `CreativeWork`.
- Type mapping and crawl/source policy docs in `docs/STRUCTURED-DATA.md`.
- `/llms.txt` as a static App Router route handler.
- Answer-shaped `/api/v1` surfaces for curated Cuts and history-changed digests.
- Robots policy coherence: read-only `/api/v1/` allowed; click logging remains disallowed.
- Golden assertions for IDs, versions, source naming, cache headers, JSON-LD structure, robots, llms links, and deterministic output.

Deferred:

- JSON-LD for player, manager, opponent, and season pages. The Phase 14 selected entity launch surface is match pages; other entity classes can be mapped later.
- Static prerendering of answer API routes. They remain dynamic, matching the existing `/api/v1` SQLite-backed route-handler pattern, with explicit immutable cache headers.

Out of scope:

- New source ingestion or enrichment.
- Schema.org `ClaimReview`; UnitedStats is publishing its own generated claim surfaces rather than reviewing third-party claims.

## Changed Files

| File | Purpose |
| --- | --- |
| `docs/STRUCTURED-DATA.md` | Type mapping, provenance fields, ID/version policy, crawl policy, cache rationale. |
| `lib/structuredData.ts` | Deterministic JSON-LD builders and safe script serialization. |
| `app/match/[id]/page.tsx` | Adds `SportsEvent` JSON-LD for match entity pages. |
| `app/history-changed/[id]/page.tsx` | Adds `CreativeWork` JSON-LD for history-changed answer pages. |
| `lib/machineAnswers.ts` | Shared answer payload builders for curated Cuts and history digests. |
| `app/api/v1/answers/route.ts` | Machine-answer API index. |
| `app/api/v1/answers/cuts/[slug]/route.ts` | Curated Cut answer surface. |
| `app/api/v1/answers/history-digests/[id]/route.ts` | History-digest answer surface. |
| `lib/llms.ts` | Deterministic `/llms.txt` content and link list. |
| `app/llms.txt/route.ts` | Static route handler for `/llms.txt`. |
| `app/api/v1/route.ts` | Adds answer endpoints to public API index. |
| `app/robots.ts` | Allows `/api/v1/`; disallows `/api/search/click`. |
| `lib/api.ts` | Exports the shared public API attribution object for consistency tests. |
| `tests/phase14-machine.test.ts` | Golden assertions for Phase 14 machine-readable surfaces. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| Match JSON-LD | `tests/phase14-machine.test.ts` asserts `SportsEvent`, `matchRef()`, canonical URL, match date, and `sourcesForMatch()` provenance facets for `1999-05-26-bayern-munich-n`. |
| History-digest JSON-LD | `tests/phase14-machine.test.ts` renders `/history-changed/2026-05-24-brighton-and-hove-albion-a`, parses JSON-LD, and asserts `CreativeWork`, `historyDigestRef()`, `cv1-` version, and match citation URL. |
| Cut machine answer | `tests/phase14-machine.test.ts` asserts `answerRef("cut-headline", ...)`, `cutRef()`, `cv1-` version, result-source provenance, evidence links, CORS, and cache headers. |
| History-digest machine answer | `tests/phase14-machine.test.ts` asserts `answerRef("history-digest", ...)`, digest provenance, route response content, and digest version reuse. |
| `/llms.txt` | `tests/phase14-machine.test.ts` asserts text content, source naming, route headers, route links, and absence of click logging. Build route table shows `○ /llms.txt`. |
| Crawl policy | `tests/phase14-machine.test.ts` asserts robots allows `["/", "/api/v1/"]` and disallows `["/api/search/click"]`. |
| API attribution agreement | `tests/phase14-machine.test.ts` asserts `/llms.txt`, answer index, and `apiJson` share `UnitedStats, the open Manchester United match history`. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | Determinism command generated match JSON-LD, digest JSON-LD, Cut answer, digest answer, and llms text twice; `diff -ru` produced no output. `jsonLdHtml()` also has a deterministic serialization test. |
| X2 | Met | New builders read local SQLite, checked-in digest JSON, and local constants only. No new network calls. |
| X3 | Met | `tests/phase14-machine.test.ts` adds golden assertions under the existing `node:test` suite. |
| X4 | Met | `npm run knip`, `npm run validate`, `npm run build:db`, `npm test`, `npm run build`, and `npm run check:static` pass. |
| X5 | Met | IDs/provenance/versions use Phase 0 helpers: `matchRef`, `historyDigestRef`, `cutRef`, `answerRef`, `claimVersion`, `matchSourceProvenance`, `claimProvenance`. |
| X6 | Met | Tests render pages, parse JSON-LD, call route handlers, inspect headers/body fields, and assert concrete source/provenance values. |
| X7 | Met | Read local Next docs before edits: `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`. |
| 14.1 | Met | `docs/STRUCTURED-DATA.md` maps route/surface to type, fields, and provenance; it documents why `CreativeWork` is used instead of `ClaimReview`. |
| 14.2 | Met | Tests assert selected match entity pages and history-changed answer pages emit JSON-LD sourced from canonical data/Phase 0 provenance helpers. |
| 14.3 | Met | Tests enumerate selected answer IDs and assert uniqueness/determinism. Versions come from `claimVersion()`. |
| 14.4 | Met | `/llms.txt` route uses documented route-handler approach; tests assert referenced public routes/docs resolve through route handlers or sitemap. |
| 14.5 | Met | `app/robots.ts` allows `/api/v1/`, disallows `/api/search/click`; tests assert robots, sitemap, and llms coherence. |
| 14.6 | Met | Added answer-shaped `/api/v1/answers/*` surfaces with stable IDs, provenance, versions, route responses, and tested immutable cache headers. Dynamic route-handler rationale is documented. |
| 14.7 | Met | Tests assert JSON-LD provenance, `apiJson` attribution, answer index, and `/llms.txt` source naming agree. |

## Commands

```text
npm run knip
# PASS

npm run validate && npm run build:db
# validate: OK — 6027 matches across 126 seasons, 0 errors, 39 warnings
# built /Users/cobro/code/unitedstats/data/united.db: 6027 matches (1886-10-30 → 2026-05-24), 19661 events, 6022 matches with lineups

npm test
# tests 62
# pass 62
# fail 0

npm run build
# ✓ Compiled successfully
# Finished TypeScript
# ✓ Generating static pages using 7 workers (7441/7441)
# Route table includes:
# ○ /llms.txt
# ƒ /api/v1/answers
# ƒ /api/v1/answers/cuts/[slug]
# ƒ /api/v1/answers/history-digests/[id]

npm run check:static
# ✓ static-render guard: 7 static pages, 5 SSG routes, 7439 prerendered paths.

tmp=$(mktemp -d); for run in a b; do out="$tmp/$run"; mkdir -p "$out"; npx tsx -e 'import fs from "node:fs"; import { cutAnswer, historyDigestAnswer } from "./lib/machineAnswers"; import { llmsTxt } from "./lib/llms"; import { matchById, sourcesForMatch } from "./lib/queries"; import { matchJsonLd, historyDigestJsonLd, jsonLdHtml } from "./lib/structuredData"; import { readHistoryDigest } from "./lib/historyDigests"; const out=process.argv[1]; const match=matchById("1999-05-26-bayern-munich-n")!; const digest=readHistoryDigest("2026-05-24-brighton-and-hove-albion-a")!; fs.writeFileSync(`${out}/match.jsonld`, `${jsonLdHtml(matchJsonLd(match, sourcesForMatch(match.id)))}\n`); fs.writeFileSync(`${out}/digest.jsonld`, `${jsonLdHtml(historyDigestJsonLd(digest))}\n`); fs.writeFileSync(`${out}/cut-answer.json`, `${JSON.stringify(cutAnswer("opponents-by-win-rate"))}\n`); fs.writeFileSync(`${out}/digest-answer.json`, `${JSON.stringify(historyDigestAnswer(digest.matchId))}\n`); fs.writeFileSync(`${out}/llms.txt`, llmsTxt());' "$out"; done; diff -ru "$tmp/a" "$tmp/b"; find "$tmp/a" -type f -maxdepth 1 -print | sort; rm -rf "$tmp"
# diff -ru produced no output.
# Generated files:
# cut-answer.json
# digest-answer.json
# digest.jsonld
# llms.txt
# match.jsonld
```

## Rendered/API Evidence

```text
tests/phase14-machine.test.ts:
- selected entity and answer pages render parseable JSON-LD with citable IDs
- curated Cut machine answer has stable cut and answer IDs, provenance, and cache headers
- history-digest machine answer reuses digest provenance and exposes stable answer IDs
- llms.txt links resolve to known routes and use the same source name as apiJson
- robots allows read-only API routes while disallowing side-effect click logging
```

## Risks And Known Gaps

- Answer API routes are dynamic because the existing public API route layer reads SQLite on demand. This is documented and covered by immutable cache header assertions.
- `/llms.txt` is static and references one latest checked-in digest example; the link set changes only when checked-in history digest artifacts change.
- Phase 14 intentionally launches JSON-LD on match entity pages and history-changed answer pages only. Other entity types remain future work.

## Prior Review Disposition

No prior Phase 14 review.
