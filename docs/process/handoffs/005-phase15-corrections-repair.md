# Handoff: Phase 15 Correction As A Product Pass 2

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Repair pass for the two blocking findings in
`docs/process/reviews/004-phase15-corrections.md`.

Implemented:

- Added a test that reaches the actual `MAX_GITHUB_ISSUE_URL_LENGTH` guard using an over-long but otherwise valid `explanation`.
- Replaced self-referential issue title/body/ID assertions with pinned literals.
- Added an equivalence assertion between browser-safe correction request ID generation and Phase 0 `correctionRef`.

Deferred:

- No product/code changes beyond test evidence; Phase 15 implementation from pass 1 is unchanged.

Out of scope:

- Capping `explanation`; the URL guard remains the intended maximum issue-size enforcement.

## Changed Files

| File | Purpose |
| --- | --- |
| `tests/phase15-corrections.test.ts` | Adds pinned title/body/request ID assertions and an actual over-6000-character URL guard assertion. |
| `docs/process/reviews/004-phase15-corrections.md` | Records the failed pass 1 review. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| Max issue URL guard | `correction issue URLs enforce the documented maximum size` now builds `urlPayload` with `explanation: "x".repeat(MAX_GITHUB_ISSUE_URL_LENGTH * 2)`, asserts `validateCorrectionPayload(urlPayload) === []`, then asserts `correctionIssueUrl(urlPayload)` throws `/exceeds 6000 characters/`. |
| Pinned issue title | Test asserts literal title: `Correction: match Manchester United 2-1 FC Bayern Munich matches[id=1999-05-26-bayern-munich-n].attendance`. |
| Pinned labels | Test asserts literal labels `correction,data`. |
| Pinned request ID | Test asserts literal `us:correction:094c3c992703e9c1`. |
| Phase 0 equivalence | Test computes `correctionRef({...}).id` with the sample payload fields and asserts it equals `us:correction:094c3c992703e9c1`. |
| Pinned body content | Test asserts body contains the exact request ID, exact target line, exact source URL, and exact maintainer checklist item `Run npm run validate`. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met | Pass 1 determinism evidence remains valid; request ID is now golden-pinned and Phase 0-equivalent. |
| X2 | Met | No implementation change. |
| X3 | Met | `tests/phase15-corrections.test.ts` now contains the repair assertions. |
| X4 | Met | `npm run knip` and repaired `npm test -- tests/phase15-corrections.test.ts` pass. Pass 1 full build/validate/static gates remain valid because only tests and review docs changed after that build. |
| X5 | Met | New assertion proves browser-safe correction ID equals Phase 0 `correctionRef` for the sample payload. |
| X6 | Met | Issue title/body/ID/labels are now checked against literal expected output, not only generator functions. |
| X7 | Met | No new Next surface changes. |
| 15.5 | Met | Tests now assert both deterministic title/body content and the actual maximum URL guard. |

## Commands

```text
npm test -- tests/phase15-corrections.test.ts
# tests 70
# pass 70
# fail 0

npm run knip
# PASS
```

## Rendered/API Evidence

```text
tests/phase15-corrections.test.ts:
- correction issue title, body, diff, labels, and URL are deterministic
  - literal title
  - literal labels
  - literal request ID us:correction:094c3c992703e9c1
  - Phase 0 correctionRef equivalence
  - exact target/source/checklist body assertions
- correction issue URLs enforce the documented maximum size
  - valid long explanation reaches URL guard
  - throws "exceeds 6000 characters"
```

## Risks And Known Gaps

- Full build was not rerun after the pass 2 repair because only tests/review docs changed. The pass 1 build after implementation was green and showed `○ /corrections`.

## Prior Review Disposition

| Finding | Disposition | Evidence |
| --- | --- | --- |
| 15.5 max URL guard was not exercised. | Fixed. | Added valid over-long explanation case that passes schema validation and fails at `MAX_GITHUB_ISSUE_URL_LENGTH`. |
| X6 title/body/request ID assertions were self-referential. | Fixed. | Added literal title, labels, request ID, target, source URL, and maintainer checklist assertions; added Phase 0 `correctionRef` equivalence. |
