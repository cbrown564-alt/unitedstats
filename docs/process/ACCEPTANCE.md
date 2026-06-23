# Acceptance Criteria For ROADMAP Phases 13-16

This file defines "good enough" before implementation starts. A phase or
subphase passes only when its criteria are evidenced in a handoff and accepted
by evaluator review.

## Cross-Cutting Criteria

These apply to every phase and every pass.

| ID | Criterion |
| --- | --- |
| X1 | Determinism: generated claim artifacts are byte-identical when run twice on identical inputs. The handoff must include the command and diff result. Dates use UTC; numbers and dates use pinned formats; no wall-clock timestamps appear in generated claims. Build metadata may appear only outside the claim artifact and must not affect claim versions, golden outputs, or digest content. |
| X2 | Hermetic generation: new generators do not perform network calls. Existing fetch/enrichment steps may keep their current behavior, but phase generators consume local canonical JSON, SQLite, or checked-in fixtures only. |
| X3 | Golden corpus: each phase adds fixture inputs and checked-in golden outputs or golden assertions under `tests/`, following the existing `node:test` convention. Golden changes must be deliberate and reviewable. |
| X4 | CI clean: `npm run knip`, `npm run validate`, `npm run build:db`, `npm test`, `npm run build`, and `npm run check:static` must pass before phase completion. Operational scripts live under `scripts/`. |
| X5 | Single-schema discipline: IDs, provenance, correction payloads, and generated artifacts reuse or extend the canonical data contract validated by `npm run validate`; no parallel schema may drift untested. |
| X6 | Output evidence: every PASS claim cites a visible artifact, file, test assertion, command log, screenshot, or API response. "Exists", "renders", or "valid" is necessary but never sufficient without content assertions. |
| X7 | Next.js doc compliance: before editing App Router routes, metadata, route handlers, OG image routes, or headers, Codex reads the relevant guide in `node_modules/next/dist/docs/` and cites the file in the handoff. |

## Phase 0 - Citable Answers And Provenance Contract

Phase 0 is a prerequisite pulled forward from Phase 14 so Phase 13 does not
invent throwaway IDs or provenance.

| ID | Criterion |
| --- | --- |
| 0.1 | Define every citable unit: match, entity page, season, curated question, Cut, answer, history-changed digest, correction request, on-this-day entry, saved collection, and embed. |
| 0.2 | Define a stable logical ID scheme. IDs are pure functions of canonical inputs, route params, or normalized Cut params; no autoincrement, random value, or timestamp. |
| 0.3 | Define a version field for generated claims. The canonical URL/logical ID stays stable, while a content hash or canonical-data revision changes when corrected canonical data changes the claim. |
| 0.4 | Define one provenance shape reused by digests, JSON-LD, answer APIs, correction previews, and embeds: source id/name, source URL when available, facet/scope, canonical evidence path, and source `retrieved_at`/`stats_as_of` only when that value already exists in canonical data. If no canonical date exists, omit it; never substitute the current wall-clock date. |
| 0.5 | Add round-trip and collision tests over the known ID set, including curated Cuts, at least one synthetic answer/digest fixture, and one provenance fixture where no canonical as-of date exists so omission is golden-locked. |
| 0.6 | Document the correction/digest policy: history-changed digest pages recompute from current canonical data; their logical IDs remain stable and their claim version changes when the underlying canonical facts change. |

## Phase 13 - The History Changed Engine

| ID | Criterion |
| --- | --- |
| 13.1 | Digest unit is pinned: exactly one digest per official match. A run with N new matches emits N digests in match-date/order-stable sequence. Fixtures cover 0, 1, and 3 new matches. |
| 13.2 | The generator is build-time, local-only, under `scripts/`, and hooks into `.github/workflows/update-results.yml` only after `npm run validate` and `npm run build:db` have succeeded. |
| 13.3 | Digest artifacts use Phase 0 IDs/provenance and include claim version, match id, canonical URL, evidence links, and a compact claim list. |
| 13.4 | Each detector has a trigger spec plus at least one positive and one negative golden assertion: record entered/extended, streak started/ended, rank change, manager milestone, opponent milestone, unusual scoreline, venue fact, Elo movement, and historical percentile. |
| 13.5 | Elo movement and percentile use the existing Elo data/query layer. If existing coverage proves insufficient, Elo work is split into a documented subphase before release. |
| 13.6 | No-change runs exit successfully and write no spurious digest. The handoff includes an empty-run log. |
| 13.7 | Digest page and OG card render using the existing distribution style. Tests or static checks assert specific claim text and at least one working provenance/evidence link. |
| 13.8 | Recomputing after a canonical correction keeps the digest logical ID stable and changes the claim version when the digest content changes. |
| 13.9 | Public docs explain what a digest is, what it is not, and why corrected historical data can update claim versions. |

## Phase 14 - Source, Not Casualty

| ID | Criterion |
| --- | --- |
| 14.1 | Add a type-mapping doc: page/surface type to schema.org type(s), required fields, and provenance fields. The mapping must avoid semantically misleading types. |
| 14.2 | Entity pages and answer pages selected for Phase 14 emit JSON-LD that passes structural tests and content tests proving provenance fields come from canonical data or Phase 0 provenance helpers. |
| 14.3 | Stable IDs and claim versions come from Phase 0 helpers; tests enumerate the known set for uniqueness and deterministic output. |
| 14.4 | Add `/llms.txt` using the documented Next.js routing approach. Link-check tests verify referenced routes and docs resolve. |
| 14.5 | Resolve crawl-policy coherence: read-only `/api/v1` and answer-shaped machine surfaces are allowed or clearly documented, while side-effect endpoints such as click logging remain disallowed. Robots, sitemap, and llms tests must agree. |
| 14.6 | Add an answer-shaped surface over the existing `/api/v1` data model with stable answer IDs, provenance, and explicit cache policy. If dynamic route handlers remain, the cache rationale and headers are documented and tested. |
| 14.7 | JSON-LD provenance, `apiJson` attribution, and `/llms.txt` source naming agree in tests. |

## Phase 15 - Correction As A Product

Architecture pin: Phase 15 uses a static prefilled GitHub issue workflow with a
client-side correction builder. The builder pre-identifies the canonical field
path and current value, validates the correction payload shape, previews a
field-level JSON patch/diff, and opens a structured GitHub issue. Public status
is the filtered GitHub issue list unless a later decision promotes a first-party
status page. Maintainer-reviewed PRs remain the path that applies changes and
runs `npm run validate`.

| ID | Criterion |
| --- | --- |
| 15.1 | Match, player, and event correction entry points prefill the affected canonical field path, current value, page URL, and citable ID. |
| 15.2 | Correction payload schema includes affected field, current value, proposed value, source URL or archive reference, explanation, optional attachment/archive note, reporter contact optionality, and generated issue title/body. |
| 15.3 | The client-side preview shows a before/after field-level JSON patch or unified diff. Tests cover escaping, long values, and missing optional fields. |
| 15.4 | A sample correction applied by the documented maintainer workflow passes `npm run validate`; malformed correction fixtures fail schema validation before issue generation. |
| 15.5 | GitHub issue URLs are deterministic for the same payload except for URL encoding; tests assert title/body content and maximum supported URL size. |
| 15.6 | Public status is linked as a filtered GitHub issue search for correction labels/status. If this changes, `DECISIONS.md` must record the new architecture before implementation. |
| 15.7 | Docs include a short threat model: public, backendless suggestions; no automatic canonical write; maintainers review PRs; CI validation gates data changes. |

## Phase 16 - Habit And Creator Tail

Architecture pins:

- On-this-day is a pure function of month/day in UTC.
- On-this-day detail pages are static for all 366 possible month/day keys.
- Saved collections are URL-encoded, accountless, and capped at 12 Cuts or 1800
  characters, whichever limit is reached first.
- Embeds use dedicated `/embed` routes or image URLs with explicit framing/cache
  headers; non-curated saved collections and embeds are `noindex`.

| ID | Criterion |
| --- | --- |
| 16.1 | On-this-day fixtures pin several dates, including February 29, to deterministic historical facts and evidence links. |
| 16.2 | All 366 on-this-day routes build/render without crashing; empty days use a deterministic fallback. |
| 16.3 | Saved collection encoding round-trips at 1 Cut, typical multi-Cut, and max-size cases. Over-cap inputs are rejected gracefully with no truncated state. |
| 16.4 | Saved collections preserve Cut coverage/evidence links and inherit the existing noindex policy for non-curated forks. |
| 16.5 | Embed routes or image URLs render representative cards/charts from stable params and include explicit cache/framing behavior. Tests assert headers and at least one rendered content string or image route response. |
| 16.6 | Embeds do not expose mutation endpoints, secrets, or unbounded query surfaces; docs state supported params and limits. |
