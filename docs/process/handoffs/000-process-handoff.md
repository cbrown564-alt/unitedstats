# Handoff: Process Contract Pass 1

Date: 2026-06-23
Builder: Codex
Evaluator: Claude Opus

## Scope

Implemented:

- Created the generator/evaluator process directory for ROADMAP phases 13-16.
- Ratified cross-cutting acceptance criteria, Phase 0 prerequisite criteria,
  and phase-specific criteria for phases 13-16.
- Added append-only decisions for the major pre-build landmines.
- Added handoff and review templates.

Deferred:

- No product implementation. Phase 0 implementation starts after process review
  passes.

Out of scope:

- App, data, workflow, and test-code changes.

## Changed Files

| File | Purpose |
| --- | --- |
| `docs/process/README.md` | Loop rules, roles, and process index. |
| `docs/process/ACCEPTANCE.md` | Ratified good-enough criteria. |
| `docs/process/DECISIONS.md` | Architecture pins and escalation log. |
| `docs/process/handoffs/TEMPLATE.md` | Builder handoff format. |
| `docs/process/reviews/TEMPLATE.md` | Evaluator review format. |

## Artifacts And Evidence

| Artifact | Evidence |
| --- | --- |
| Process criteria | `docs/process/ACCEPTANCE.md` contains X1-X7, Phase 0, and phases 13-16. |
| Decisions | `docs/process/DECISIONS.md` records ID/provenance ordering, digest recompute, correction architecture, robots/API coherence, Phase 16 bounds, and provenance-date determinism. |
| Templates | Handoff and review templates include X1-X7 instrumentation. |

## Acceptance Map

| AC ID | Status | Evidence |
| --- | --- | --- |
| X1 | Met for process docs | Determinism is explicitly required in `ACCEPTANCE.md`; no generators implemented yet. |
| X2 | Met for process docs | Hermetic generation is explicitly required in `ACCEPTANCE.md`; no generators implemented yet. |
| X3 | Met for process docs | Golden corpus requirement is explicit in `ACCEPTANCE.md`; no phase golden files yet. |
| X4 | Not applicable to docs-only pass | No code paths changed. Full CI is required for phase completion, not this process gate. |
| X5 | Met for process docs | Single-schema discipline is explicit in X5, 0.4, and Phase 15 criteria. |
| X6 | Met | Templates require output evidence and unevidenced criteria fail. |
| X7 | Met for future work | X7 is required and instrumented in handoff/review templates. |

## Commands

No build/test commands were run for this docs-only process gate.

## Rendered/API Evidence

Not applicable.

## Risks And Known Gaps

- Phase implementation has not begun.
- Full CI remains required before any phase is marked complete.

