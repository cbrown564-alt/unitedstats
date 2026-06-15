# Bold Simplification — Spine + Question front door

Status: accepted

## Context

Six build-out phases left UnitedStats with ~16 routes that restate each other —
"more places than ideas." Phase 8 tightened consistency (shared components, one
contrast fix) but removed no surface, page, or module. The governing tension is
**breadth of record vs. clarity of product**, and it had been resolved in favour
of breadth by default, surface by surface, without ever being decided.

## Decision

Adopt the **Spine + Question front door** shape:

- **`/matches` is The Record** — the single canonical, filterable home of
  match-level data. Records (biggest wins, heaviest defeats, biggest crowds),
  venue/decade cuts, and the analytics "records" and "coverage" tiers become
  **Views of** or **links into** The Record, never second renderings.
- **`/questions` is the Front Door** — the curated, question-led home for
  interpretation. Argument charts live here as a question's evidence.
- **`/analytics` slims** from ~14 competing modules to the Elo/strength + trends
  surface, absorbing the odds tool as Elo's prospective half. Records and
  coverage modules become links; the goal-minute chart migrates into the
  late-goals question.
- **`/analytics/odds` and `/analytics/travel` are removed** — odds folds into
  `/analytics`, travel folds into `/questions` as an "away days" question.
- **Genuinely distinct jobs stay as Surfaces**: player/season/match detail, the
  Elo timeline, and the entity rosters (`/players`, `/managers`, `/opponents`,
  `/seasons`). They are not forced into a fixture-list frame.

Enforced by two rules:

1. **Kill criterion (two tests).** (a) A *second rendering* of data owned
   elsewhere always becomes a link. (b) A standalone route is justified only by a
   distinct one-sentence job *and* a real navigation target.
2. **Primary-Answer rule per template.** Each page leads with one Primary Answer,
   open; everything else collapses into a small fixed set of labelled disclosures.
   `/match/[id]` is the reference implementation (scoreline + goals open;
   Teamsheet, Context, Provenance collapsed).

## Considered options

- **The Question Engine** (everything dissolves into questions) — rejected: it
  discards the legitimate "just show me the reference chart" job.
- **The Ledger** (keep all surfaces, only resequence) — rejected: it can be
  "completed" while removing nothing, which is precisely the Phase 8 failure mode.
- **Pure Spine** (the match browser swallows everything) — rejected: it forces
  player profiles and the Elo timeline into a fixture-list frame that does not fit.

## Consequences

- The `DESIGN.md` nav law (Matches, Seasons, Players, Managers, Opponents,
  Analytics stay predictable) is kept, so route count floors at ~14 (down from
  ~16). The real reduction this phase is in **modules and duplication**, not
  routes — that, not route count, is the success metric.
- Deep links to `/analytics/odds` and `/analytics/travel` break and should
  redirect to their new homes.
- Adds one `/matches` sort ("heaviest defeat") so the records have a canonical
  home before they are demoted to links.
