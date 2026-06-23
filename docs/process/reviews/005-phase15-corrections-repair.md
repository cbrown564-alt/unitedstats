# Review: Phase 15 Correction As A Product Pass 2

Date: 2026-06-23
Evaluator: Claude Opus (adversarial)
Builder handoff: docs/process/handoffs/005-phase15-corrections-repair.md

Verdict: **PASS**

## Acceptance Review

| AC ID | Verdict | Output Evidence |
| --- | --- | --- |
| X1 | PASS | Determinism evidence from pass 1 stands; pass 2 touched only test/doc files. `correctionIssueUrl` runs twice with byte-equal result (`assert.equal(first, second)`), and the request ID is now golden-pinned to `us:correction:094c3c992703e9c1`, removing the silent-drift exposure flagged in pass 1. `stableHash`/`canonicalStringify` remain wall-clock-free. |
| X2 | PASS | No implementation change. `lib/corrections.ts` still reads only constants, `URLSearchParams`, and `new URL`; no fetch in any generator. |
| X3 | PASS | `tests/fixtures/corrections/*.json` plus `node:test` assertions; `fieldPatch` and now the issue title, labels, and request ID are pinned to checked-in literals rather than round-trips. |
| X4 | PASS (with disclosed risk) | `npm run knip` reran (PASS) and `npm test -- tests/phase15-corrections.test.ts` shows 70/70. The full build/validate/build:db/check:static gates were not rerun, but the only pass-2 diffs are `tests/phase15-corrections.test.ts` and a review doc, so the pass-1 green gates remain valid. |
| X5 | PASS | The duplicate-hash divergence risk is now closed: the test asserts the corrections.ts body request ID and the Phase 0 `correctionRef(...).id` both equal the same literal `us:correction:094c3c992703e9c1`, golden-locking the two independent implementations against each other. |
| X6 | PASS (was FAIL) | Title is pinned to a literal string, labels are pinned to literal `correction,data`, request ID is pinned to a literal and cross-checked against `correctionRef`, and body assertions check exact request ID, target line, source URL, and `Run npm run validate` checklist content. |
| X7 | PASS | No new Next.js surface changes in pass 2; pass-1 guide citations stand. |
| 15.1 | PASS | Render tests assert match `...attendance`, event `...events[N].minute`, and player `...name` prefill links with citable context. |
| 15.2 | PASS | `CorrectionPayload` carries all required fields; generated title/body covered. |
| 15.3 | PASS | `fieldPatch()` diff and fence-escaping/missing-optional coverage intact. |
| 15.4 | PASS | Sample fixture applies to temp canonical and passes `validate`; malformed fixture fails before issue generation. |
| 15.5 | PASS (was FAIL) | The max-URL guard is genuinely reached by a schema-valid payload with an over-long `explanation`; `correctionIssueUrl(urlPayload)` throws `/exceeds 6000 characters/`. Title/body content is also pinned. |
| 15.6 | PASS | `CORRECTION_STATUS_URL` is a `label:correction` issue search; test asserts host + label. |
| 15.7 | PASS | `docs/CORRECTIONS.md` threat model unchanged and intact. |

## Blocking Findings

None. Both pass-1 blockers are resolved.

1. **(15.5) Max issue URL guard — RESOLVED.** Pass 2 inflates the uncapped `explanation` field, so validation returns `[]` and execution reaches `correctionIssueUrl`'s `href.length > MAX_GITHUB_ISSUE_URL_LENGTH` check, which throws "Correction issue URL exceeds 6000 characters". The original `proposedValue` schema-cap case remains covered separately.

2. **(X6) Self-referential title/body/ID assertions — RESOLVED.** The title, labels, and request ID are pinned to literals; if `lib/corrections.ts`'s `stableHash`/`canonicalStringify` drifted, the body/request-ID assertion and the `correctionRef` equivalence assertion would fail.

## Non-Blocking Notes

- Full build/validate/check:static were not rerun in pass 2. Accepted because the repair diff is limited to tests and review docs; pass-1 full gates remain valid.
- `explanation` remains uncapped by design; the 6000-character URL guard is the maximum issue-size enforcement.
- Golden ID value `094c3c992703e9c1` is opaque; a small future comment could note it is derived from the sample fixture.
- `setTypedValue` current-value verification remains unchanged and acceptable under the documented maintainer-verification step.

## Loop Accounting

Pass: 2
Repair loop count: 1
Escalation required: No

## Rules Applied

- Reviewed outputs only: handoff, source under review, fixtures referenced by assertions, and the test/command logs in the packet.
- Unevidenced acceptance criteria fail; both prior blockers re-verified against the pass-2 test source, not builder claims.
- Findings cite observable outputs and AC IDs.
- No new blocking criteria introduced mid-loop.
- For X7, no new Next.js surface in pass 2; prior citations carry forward.
