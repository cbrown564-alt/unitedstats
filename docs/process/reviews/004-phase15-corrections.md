# Review: Phase 15 Correction As A Product Pass 1

Date: 2026-06-23
Evaluator: Claude Opus (adversarial)
Builder handoff: docs/process/handoffs/004-phase15-corrections.md

Verdict: **FAIL**

## Acceptance Review

| AC ID | Verdict | Output Evidence |
| --- | --- | --- |
| X1 | PASS | Determinism command runs title/body/url/diff twice; `diff -ru` produced no output. `stableHash`/`canonicalStringify` are wall-clock-free; no timestamps in payloads or request IDs. |
| X2 | PASS | `lib/corrections.ts` reads only constants + `URLSearchParams`; `scripts/apply-correction-fixture.ts` reads/writes local canonical JSON; no fetch in any new generator. |
| X3 | PASS | `tests/fixtures/corrections/*.json` plus `node:test` assertions added; `fieldPatch` is pinned to a checked-in literal. Coverage quality is faulted under X6/15.5. |
| X4 | PASS | Command log shows `knip` PASS, `validate` OK (0 errors), `build:db`, `tests 70/70`, `build` ✓, `check:static` ✓. |
| X5 | PASS | Citable IDs reuse Phase 0 `matchRef`/`entityRef`; payload mirrors canonical field paths. Duplicate hash flagged non-blocking below. |
| X6 | **FAIL** | The "exact title/body content" claims rest on self-referential assertions (see Blocking 2). |
| X7 | PASS | Cited `page.md` (file conventions), `use-client.md` (directive), `linking-and-navigating.md`, matching the new route, `"use client"` builder, and `Link`/`useSearchParams` usage. |
| 15.1 | PASS | Render tests assert match `...attendance`, event `...events[N].minute`, and player `...name` prefill links with citable context. |
| 15.2 | PASS | `CorrectionPayload` carries target, fieldPath, current/proposed, pagePath, citableId, source/archive, explanation, attachmentNote, reporterContact; title/body generated. |
| 15.3 | PASS | `fieldPatch()` diff rendered in `CorrectionBuilder`; tests cover fence escaping and missing optional fields. |
| 15.4 | PASS | `apply-correction-fixture.ts` applies `sample-attendance.json` to a temp copy and `validate` passes; malformed fixture fails before `correctionIssueUrl`. |
| 15.5 | **FAIL** | The maximum-URL-size enforcement path is never exercised (see Blocking 1); title/body "content" assertions are tautological (see Blocking 2). |
| 15.6 | PASS | `CORRECTION_STATUS_URL` is a `label:correction` issue search; linked from `/data` and `/corrections`; test asserts host + label. |
| 15.7 | PASS | `docs/CORRECTIONS.md` threat model: public issues, no backend mutation, no auto canonical write, maintainer verification, PR/CI gate, contact as public text. |

## Blocking Findings

1. **(15.5) Maximum issue URL size is asserted but never enforced in any test.**
   The test `correction issue URLs enforce the documented maximum size` builds a payload with `proposedValue: "x".repeat(1001)` and asserts the throw matches `/proposedValue is too long/`. That error originates in `validateCorrectionPayload` (`proposedValue.length > 1000`) and is raised by `assertValidCorrectionPayload`, which runs before the `href.length > MAX_GITHUB_ISSUE_URL_LENGTH` guard inside `correctionIssueUrl`. The 6000-char guard is therefore never reached by any test. `validateCorrectionPayload` caps `fieldPath`, `proposedValue`, `attachmentNote`, and `reporterContact` but imposes no maximum on `explanation`, so an over-6000-char URL is reachable yet uncovered. AC 15.5 requires tests to assert maximum supported URL size; that clause is unevidenced.

2. **(X6) Issue title/body/ID "content" assertions are self-referential, and the correction request ID value is never pinned.**
   In `tests/phase15-corrections.test.ts` the title check is `assert.equal(url.searchParams.get("title"), correctionIssueTitle(samplePayload))` and the labels check is `=== CORRECTION_LABELS.join(",")`; both compare the generated URL to the same functions/constants that generated it, proving only URL round-tripping, not pinned content. The body is checked solely by partial regexes (`/Request ID: us:correction:/`, `/npm run validate/`), and the `us:correction:<hash>` request ID is asserted by prefix only. Because `lib/corrections.ts` carries its own `stableHash`/`canonicalStringify`, any change to those constants would silently alter every correction ID while all tests and the run-twice `diff -ru` still pass. The handoff claims exact title/body content and a tested request ID; X6 states that absent genuine content assertions a PASS claim is insufficient. Only `fieldPatch` carries a true checked-in golden literal.

## Non-Blocking Notes

- **Duplicate hash implementation (X5-adjacent).** `lib/corrections.ts` reimplements `stableHash`/`canonicalStringify` rather than reusing the Phase 0 citation helper. Add a single equivalence/golden assertion so the two cannot diverge untested.
- **Player citable ID form differs from match.** The test expects `cite=us%3Aentity%3Aplayer%253Aa-longton`, whereas match is `us%3Amatch%3A...`. This is inherited from Phase 0 `entityRef`, but the encoded inner separator is worth confirming as intended.
- **`explanation` is uncapped** while sibling text fields are bounded; this is the field that can push a valid payload past the 6000-char URL guard. Capping it (and testing the cap) would close Blocking 1 cleanly.
- **`setTypedValue` does not verify `currentValue`** against the canonical value before writing, so a stale `currentValue` would still apply. The maintainer-verification step is documented, so this is acceptable, but a guard would harden the fixture path.
- **Malformed-fixture coverage is thin.** Only the missing-source branch is covered by a fixture; other validation branches are untested.

## Loop Accounting

Pass: 1
Repair loop count: 0
Escalation required: No

## Rules Applied

- Reviewed outputs only: handoff, source under review, fixtures, and the test log/assertions in the packet.
- Unevidenced acceptance criteria fail.
- Findings cite observable outputs and AC IDs, not builder rationale.
- No new blocking criteria introduced.
- For X7, cited guides match edited surface types.
