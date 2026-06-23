# Review: Phase 0 Citable Contract Pass 1

Date: 2026-06-23
Evaluator: Claude Opus
Builder handoff: `docs/process/handoffs/001-phase0-citable-contract.md`

Verdict: PASS

## Acceptance Review

| AC ID | Verdict | Output Evidence |
| --- | --- | --- |
| X1 | PASS | No generated claim artifacts exist in Phase 0. `claimVersion` is deterministic over canonical content; tests prove object-order stability and changed facts changing the version. |
| X2 | PASS | `lib/citations.ts` is pure/local and performs no network calls. |
| X3 | PASS | `tests/phase0-citations.test.ts` uses `node:test` and golden content assertions. |
| X4 | PASS | Handoff logs show `knip`, `validate`, `build:db`, `test`, `build`, and `check:static` passing. |
| X5 | PASS | Provenance consumes canonical source ids/fields and adds no parallel source catalog. |
| X6 | PASS | Handoff evidence maps claims to tests, docs, and command logs. |
| X7 | N/A | No Next.js App Router routes, metadata, route handlers, OG image routes, or headers were edited. |
| 0.1 | PASS | `CITABLE_UNITS` enumerates all required citable kinds and tests assert the set. |
| 0.2 | PASS | IDs are pure route-param, normalized Cut-param, or payload-content functions; round-trip/collision test covers the known public set. |
| 0.3 | PASS | `claimVersion` separates logical IDs from content versions and changes when canonical facts change. |
| 0.4 | PASS | `ClaimProvenance` shape includes canonical source/evidence fields and omits missing date fields; tests lock both date-present and no-date cases. |
| 0.5 | PASS | Tests cover known-set round trips, curated Cuts, synthetic future units, and no-date omission. |
| 0.6 | PASS | `PHASE0-CITABLE-CONTRACT.md` documents digest recompute, stable logical IDs, changing claim versions, and correction policy. |

## Blocking Findings

None.

## Non-Blocking Notes

- Phase 13 must supply the X1 run-twice byte-diff evidence once digest artifacts
  exist.
- `stableHash` is a non-cryptographic 64-bit hash; widen or add adversarial
  collision coverage if correction/citable spaces grow materially.
- Phase 0 golden assertions intentionally read canonical data; a canonical
  source refresh should update those values deliberately.
- Reuse of provenance across digests, JSON-LD, answer APIs, correction previews,
  and embeds is correctly deferred to phases 13-16.

## Loop Accounting

Pass: 1
Repair loop count: 0
Escalation required: no

## Rules Applied

- Reviewed outputs only: handoff, process acceptance criteria, contract doc,
  helper code, and tests pasted into the evaluator prompt.
- Unevidenced acceptance criteria fail.
- Findings cite observable outputs and acceptance criteria, not private
  rationale.
- No new blocking criteria added mid-loop without a `DECISIONS.md` entry.
- X7 was treated as not applicable because no Next.js surface was edited.

