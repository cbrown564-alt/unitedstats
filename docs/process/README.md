# Phase 13-16 Generator/Evaluator Process

This directory is the durable control surface for completing ROADMAP phases
13-16 with a generator/evaluator loop.

Roles:

- Codex is the builder/generator. It implements scoped work and writes a
  handoff from visible outputs only.
- Claude Opus is the adversarial evaluator. It reviews diffs, generated
  artifacts, test logs, rendered evidence, and API examples against
  [ACCEPTANCE.md](ACCEPTANCE.md).

Loop:

1. Codex selects one phase or subphase, implements it, and writes a handoff in
   `docs/process/handoffs/`.
2. Claude reviews only the handoff artifacts and produced outputs, then writes a
   PASS/FAIL review in `docs/process/reviews/`.
3. Codex fixes blocking findings and logs disposition in the next handoff.
4. After two repair loops on the same subphase, Codex stops and records an
   escalation in [DECISIONS.md](DECISIONS.md) for user arbitration.
5. The evaluator may not add new blocking criteria mid-loop unless
   [DECISIONS.md](DECISIONS.md) records the exception or escalation first.

Required files:

- [ACCEPTANCE.md](ACCEPTANCE.md) is the ratified good-enough contract.
- [PHASE0-CITABLE-CONTRACT.md](PHASE0-CITABLE-CONTRACT.md) defines stable IDs,
  claim versions, and provenance.
- [DECISIONS.md](DECISIONS.md) is append-only and records architecture pins,
  exceptions, and escalations.
- [handoffs/TEMPLATE.md](handoffs/TEMPLATE.md) is the builder handoff format.
- [reviews/TEMPLATE.md](reviews/TEMPLATE.md) is the evaluator review format.
- Reviewers must verify that any X7 Next.js documentation citation matches the
  kind of surface changed; a route-handler citation does not cover metadata,
  headers, or OG image work by implication.

Process sources checked before ratification:

- OpenAI evaluations guidance: evals define task criteria, run on test inputs,
  and drive iteration.
- AWS evaluator reflect-refine guidance: generator output is evaluated, then
  corrected until it reaches a quality threshold.
- Anthropic Claude Code Review docs: review findings should be concrete,
  severity-ranked, tied to code behavior, and acted on by fixing outputs.
