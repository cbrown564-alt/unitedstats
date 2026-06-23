# Review: Phase 14 Source, Not Casualty Pass 1

Date: 2026-06-23
Evaluator: Claude Opus (adversarial)
Builder handoff: `docs/process/handoffs/003-phase14-source-not-casualty.md`

Verdict: **PASS**

## Acceptance Review

| AC ID | Verdict | Output Evidence |
| --- | --- | --- |
| X1 | PASS | Determinism command runs the JSON-LD/answer/llms builders twice and `diff -ru` produces no output; generated set (`match.jsonld`, `digest.jsonld`, `cut-answer.json`, `digest-answer.json`, `llms.txt`) enumerated. Test "JSON-LD serialization is deterministic..." asserts `once === twice`. Versions are `claimVersion()` hashes (`cv1-` prefix); `startDate` is the canonical match date, not wall-clock. No timestamps in any generated claim shown. |
| X2 | PASS | `lib/machineAnswers.ts`, `lib/structuredData.ts`, `lib/llms.ts` consume `getDb()` (local SQLite), `readHistoryDigest`/`historyDigestIds` (checked-in JSON), and local constants only. No `fetch`/network call appears in any cited source. |
| X3 | PASS | `tests/phase14-machine.test.ts` added under `node:test`/`node:assert` (`import test from "node:test"`), matching existing convention; golden ID list golden-locked via `assert.deepEqual`. |
| X4 | PASS | Command log: `npm run knip` PASS; `validate` OK (6027 matches, 0 errors); `build:db` OK; `npm test` 62/62; `npm run build` compiled, 7441/7441; `check:static` OK (7 static, 5 SSG, 7439 prerendered). |
| X5 | PASS | IDs/provenance/versions route through Phase 0 helpers `matchRef`, `historyDigestRef`, `cutRef`, `answerRef`, `claimVersion`, `matchSourceProvenance`, `claimProvenance` (visible in `lib/structuredData.ts`, `lib/machineAnswers.ts`); tests assert IDs equal helper outputs. |
| X6 | PASS | Tests render pages (`renderToStaticMarkup`), parse JSON-LD, invoke route handlers, and assert concrete values: e.g. `isBasedOn` contains `{identifier:"wikipedia", about:"attendance"}` and `about:"result"`; cut provenance contains `{sourceId:"engsoccerdata", facet:"result"}`; `Cache-Control` matches `s-maxage=86400`. Content, not mere existence. |
| X7 | PASS | Handoff cites `01-app/02-guides/json-ld.md`, `.../15-route-handlers.md`, and `.../01-metadata/robots.md`. Each cited guide matches an edited surface type: JSON-LD on `app/match/[id]` and `app/history-changed/[id]`, route handlers under `app/api/v1/answers/*` and `app/llms.txt/route.ts`, and `app/robots.ts`. |
| 14.1 | PASS | `docs/STRUCTURED-DATA.md` maps surface -> schema.org type -> required fields -> provenance fields, and documents the `CreativeWork`-over-`ClaimReview` choice. `SportsEvent` is scoped to completed fixtures with `eventStatus: EventCompleted`; no semantically misleading type observed. |
| 14.2 | PASS | Test "match JSON-LD uses SportsEvent, Phase 0 IDs, and canonical match-source provenance" asserts `@type`, `identifier`/`url` from `matchRef`, and `isBasedOn` facets derived from `sourcesForMatch()` via `matchSourceProvenance()`. Digest page test asserts `@type: CreativeWork`, `identifier` from `historyDigestRef`, and a `citation` URL ending `/match/{id}`. |
| 14.3 | PASS | Test "answer IDs are unique and deterministic..." enumerates the known set, asserts `Set` size equals length, and `deepEqual`s to a fixed golden list; versions are `claimVersion()` (`cv1-`). |
| 14.4 | PASS | `app/llms.txt/route.ts` is a `force-static` route handler (build table shows `○ /llms.txt`). Test exercises `LlmsRoute`, `AnswersIndexRoute`, `CutAnswerRoute`, `HistoryAnswerRoute` (all resolve) and asserts referenced human routes (`/`, `/data`, `/history-changed/{id}`) are present in `sitemap()`. |
| 14.5 | PASS | `app/robots.ts` allows `["/", "/api/v1/"]`, disallows `["/api/search/click"]`; test `deepEqual`s the policy and asserts sitemap pathnames; llms test asserts `!text.includes("/api/search/click")`. Robots/sitemap/llms assertions do not contradict. |
| 14.6 | PASS | `/api/v1/answers/*` route handlers expose stable `answerRef` IDs, provenance, and `data`. Routes are `force-dynamic`; rationale documented in `docs/STRUCTURED-DATA.md`; immutable headers tested (`Cache-Control` matches `s-maxage=86400`, CORS `*`). |
| 14.7 | PASS (with note) | Test asserts the aggregate publisher name agrees across `apiJson` (`body.attribution.source`), the answer index (`data.source`), and `/llms.txt` text, all `=== API_ATTRIBUTION.source`. See Non-Blocking Note 1 re: JSON-LD scope. |

## Blocking Findings

None. No acceptance criterion lacks evidence at a blocking level; all CI gates pass, IDs/versions/provenance trace to Phase 0 helpers with content assertions, and the crawl-policy/source-naming surfaces are mutually consistent in tests.

## Non-Blocking Notes

- **14.7 evidence is slightly overstated.** The acceptance map claims tests assert "JSON-LD provenance, `apiJson` attribution, answer index, and `/llms.txt` source naming agree," but no test ties JSON-LD provenance to the attribution string. JSON-LD `isBasedOn` carries per-source names (`wikipedia`, `engsoccerdata`) via `matchSourceProvenance`/`claimProvenance`, while the tested three-way agreement is over the aggregate publisher name `UnitedStats, the open Manchester United match history`. These are intentionally different roles, so the criterion is substantively met, but the handoff sentence implies JSON-LD is in the equality assertion when it is not. Consider either a test relating JSON-LD source ids to `API_ATTRIBUTION.note`'s enumerated sources, or a wording fix.
- **X1 determinism is single-invocation.** Both runs execute inside one command loop (same process, locale, SQLite build). Cross-environment determinism (locale/collation, SQLite version) is assumed rather than separately evidenced. Acceptable for this AC as written; worth a fixture-pinned golden file if drift risk grows.
- **14.4 link resolution is indirect for two references.** The `/data#api` fragment and the `history-digests` llms link are not asserted to resolve directly; `/data` is covered via sitemap membership and the digest route via a separate handler test. Coverage is adequate but not exhaustive over the full `llmsLinks()` set.
- **X7 / metadata surface.** `app/history-changed/[id]/page.tsx` contains `generateMetadata` with `openGraph`/`twitter`. The handoff scopes this file to JSON-LD only (metadata appears to predate Phase 14, consistent with Phase 13). If any metadata was touched this pass, the metadata guide should be cited; as presented it reads as pre-existing and needs no additional citation.

## Loop Accounting

Pass: 1
Repair loop count: 0
Escalation required: No

## Rules Applied

- Reviewed outputs only: handoff, included source files, test assertions, command logs, build route table, and the determinism diff.
- Unevidenced acceptance criteria would fail; none did.
- Findings cite observable outputs (file paths, test assertions, command logs) and AC IDs, not builder rationale.
- No new blocking criteria introduced; the 14.7 observation is recorded as a non-blocking note rather than an added gate.
- For X7, each cited Next.js guide was matched to the corresponding edited surface type (JSON-LD, route handlers, robots).
