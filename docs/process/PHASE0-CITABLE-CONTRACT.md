# Phase 0 Citable Answer And Provenance Contract

This is the shared citable-answer and provenance contract for the generated,
machine-facing surfaces (history digests, answer APIs, structured data). The executable helpers
live in `lib/citations.ts`; tests in `tests/phase0-citations.test.ts` lock the
round-trip, collision, version, and provenance behavior.

Some Phase 0 golden assertions intentionally read canonical data, such as the
Wayne Rooney player-record `statsAsOf` date and a match source facet. A real
canonical-source refresh should update those expected values deliberately rather
than loosening the provenance contract.

## Citable Units

| Unit | Logical ID key | Canonical path |
| --- | --- | --- |
| Match | `match id` | `/match/[id]` |
| Entity page | `kind:id` for `player`, `manager`, or `opponent` | `/player/[id]`, `/manager/[id]`, `/opponent/[id]` |
| Season | `season id` | `/seasons/[season]` |
| Curated question | `question slug` | `/questions/[slug]` |
| Cut | curated slug, otherwise normalized `/cut?...` URL | `/cut?...` |
| Answer | `surface:key` | answer-shaped API and JSON-LD surfaces |
| Correction request | stable target hash or GitHub issue id | correction builder / GitHub issue |
| On-this-day entry | `MM-DD` | `/on-this-day/[monthDay]` |
| Saved collection | encoded collection payload | `/collection?...` |
| Embed | `surface:key` | `/embed/...` or stable image URL |

All logical IDs use the `us:<kind>:<encoded-key>` form. The key is a pure
function of canonical inputs, route params, normalized Cut params, or the
correction/collection payload. No ID may depend on autoincrement values, random
values, the current date, or build time.

## Claim Versions

Generated claims keep a stable logical ID and canonical URL. Their `claimVersion`
is a deterministic content hash over a canonical JSON representation of the
claim payload. Object key order does not affect the version. Changing the
canonical facts that feed a claim changes the version.

Build metadata is outside the claim artifact and does not contribute to the
claim version.

## Provenance Shape

Every generated claim should use this shape when it cites data:

```ts
{
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  facet?: string;
  confidence?: string;
  scope?: string;
  evidencePath: string;
  evidenceUrl: string;
  retrievedAt?: string;
  statsAsOf?: string;
  note?: string;
}
```

Rules:

- `sourceId` comes from the canonical source catalog or a canonical row that
  already references that catalog.
- `evidencePath` is the relative UnitedStats page/API route where a reader can
  inspect the underlying fact.
- `retrievedAt` and `statsAsOf` appear only when they already exist in canonical
  data, such as player record snapshots or media rows.
- If no canonical date exists, omit the field. Never substitute the current
  wall-clock date.
- Match-source provenance uses source facets such as `result`, `attendance`,
  `united-scorers`, or `starting-lineup` and points to the match page.

## Correction Policy

Corrections are suggestions until reviewed. Phase 15 will generate stable
correction request IDs from the target payload, preview field-level JSON
changes, and open structured GitHub issues; canonical data changes still land
through reviewed PRs and CI validation.
