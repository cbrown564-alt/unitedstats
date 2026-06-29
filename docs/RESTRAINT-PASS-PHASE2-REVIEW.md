# Phase 2 review — what shipped, what it taught, what's next

_Dated 2026-06-29. A review of the Phase 2 commits ("re-aim the front door at the
real debates") against the goals in `RESTRAINT-PASS.md`, plus the changes made in
response. Working notes for resuming tomorrow — not a permanent doc. The durable
parts (the principles) are flagged to graduate to `PRODUCT.md`._

## Verdict in one line

The re-aim was faithful to the plan and ~80% solid, but it shipped one
launch-breaking factual bug and one "right number, wrong concept" error, and the
new cards are mostly uninspired and partly duplicative — which is the thing the
restraint pass exists to fight.

## Two failure patterns (the combined feedback)

**1. Correctness, in two flavours.**

- _Broken query._ European finals were filtered with `round LIKE '%final%'`, which
  also matches the substring in "Quarter-final". United's European finals inflated
  from 10 to 65 and trophies-won from 5 to 32 — wrong on the Europe module and the
  homepage card. Mechanical fix.
- _Right number, wrong concept._ "Best seasons" ranked by points per game, so the
  1905-06 **Second Division** promotion campaign came out as United's best season
  ever — technically true, substantially wrong. A United fan knows the best season
  is the Treble. This is the deeper one: our metrics have to land on the answer a
  fan would defend, not the number the query makes easy. Same class as league
  titles (canonical **20**, not the technically-true 22 that includes two old
  Second Division titles) and player comparison (ranking Cantona over Bruce on
  goals measures the wrong thing for a defender).

**2. Faithful, but not thoughtful.** The build did what was prescribed and little
more — sometimes wrong, sometimes too literal, sometimes lazy (the finals bug came
from re-writing a predicate that already existed, correctly, in three other
files). Most cards are visually and narratively flat and don't justify their slot,
and at least one (`seasons`) duplicates another (`treble`). Faithful execution
that undermines the goal is a failure, not a completion — the plan now says so, so
implementation can push back.

## Durable principles (carried forward)

Added to `RESTRAINT-PASS.md`; the first two should move to `PRODUCT.md` when that
file self-deletes.

1. **"Best" means what a United fan means** — rank by trophies and canonical
   achievement, not by whatever number the query makes easy. Best season = the
   Treble. League titles = 20. A metric is only honest if it lands on the answer a
   fan would defend.
2. **Compare like with like, on the right axis** — defenders on clean sheets and
   goals conceded, forwards on goals and assists; steer readers toward comparable
   subjects rather than one leaderboard that always crowns the striker. (Bears on
   `/compare`, Phase 3.)
3. **Push back when the literal task undermines the goal** — an uninspired,
   duplicative, or misleading surface is a failure even if it matches the spec.
4. **Reuse before hand-rolling** — find the canonical helper first.

## Card-by-card verdict

| Card | Concept | Distinctive | Verdict |
| --- | --- | --- | --- |
| decline | ✅ the central debate | ◐ EraSkyline is a real form | Keep — strongest |
| europe | ✅ now correct | ◐ finals grid good, decade bars generic | Keep |
| treble | ✅ sacred | ✗→◐ rebuilt; still flat | Keep + elevate (in progress) |
| rivalries | ✅ named ledgers | ✗ four stacked WDL bars read like a directory | Keep, add character |
| ferguson | ◐ overlaps decline | ✗ a manager bar chart | Keep, watch overlap |
| seasons | ✗ points ≠ best; dup of treble | ✗ 130-bar density | **Cut** (done) |

Only `decline` and `europe` are both correct and reasonably distinctive. The net
move is 6 new cards → 5.

## Changes made this pass

| Commit | Change |
| --- | --- |
| `050c5b9` | **Europe finals bug fixed** — reuse `roundFilterPredicate("final")`; 5 trophies / 10 finals; regression test that re-derives the count independently. |
| `dedc0dc` | **Build principles added** to `RESTRAINT-PASS.md` (the four above). |
| `c8a3d89` | **Treble showpiece** — "Ten days in May": the three deciders in sequence with minute-stamped, named goals; the European Cup final leads with its two stoppage-time goals (90+1, 90+3) and a from-behind caption, all derived from the record. **Seasons cut** — removed from front door, headlines, explore signature, related trails; `/seasons` browsing page still carries per-season discovery; orphaned `seasonRanks` dropped. |

All green: `tsc` clean, 140 tests pass (incl. the new europe guard), `knip` clean.

## Open / next (tomorrow)

- **Treble still feels lifeless.** The structure is right (the ten-days thread,
  the stoppage-time climax) but it doesn't yet carry the weight of the season.
  Ideas to try: a stronger visual for the stoppage-time turn (the goals literally
  past the 90 line); the knockout comebacks that forged it (Juventus from 2-0
  down, the Giggs semi-final winner) as part of the story, not just the deciders;
  warmer, less templated copy. It is _the_ card to get right — the home of "best
  season".
- **Elevate the two "faithful but flat" survivors** — `rivalries` (beyond four
  WDL bars: the emotional beats — the 6-1, the 4-0s, the title-deciders) and
  `ferguson` (beyond a bar chart; and de-risk its overlap with `decline`).
- **Phase 3** — collapse the slice-sprawl, and apply principle 2 to `/compare`
  (like-for-like, role-appropriate metrics).
