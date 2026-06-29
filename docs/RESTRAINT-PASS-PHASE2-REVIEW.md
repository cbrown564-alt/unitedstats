# Phase 2 review — what shipped, what it taught, what's next

_Started 2026-06-29. A review of the Phase 2 commits ("re-aim the front door at
the real debates") against the goals in `RESTRAINT-PASS.md`, plus the changes
made in response. Working notes for resuming — not a permanent doc. The durable
parts (the principles) are flagged to graduate to `PRODUCT.md`._

## Verdict in one line

The re-aim was faithful to the plan and ~80% solid, but shipped one
launch-breaking factual bug and one "right number, wrong concept" error, and the
new cards were mostly uninspired and partly duplicative. The treble card has
since been elevated to the template; `rivalries`, `ferguson`, and `europe`
follow the same playbook.

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
| treble | ✅ sacred | ✗→◐→✅ spine hero + semis | **Elevated** — template for the rest |
| rivalries | ✅ named ledgers | ✗ four stacked WDL bars read like a directory | Keep, add character |
| ferguson | ◐ overlaps decline | ✗ a manager bar chart | Keep — will absorb `decline` |
| seasons | ✗ points ≠ best; dup of treble | ✗ 130-bar density | **Cut** (done) |

Only `europe` and the rebuilt `treble` are both correct and distinctive. The net
move is 6 new cards → 5, with `decline` slated to fold into `ferguson` next.

## Changes made this pass

| Commit | Change |
| --- | --- |
| `050c5b9` | **Europe finals bug fixed** — reuse `roundFilterPredicate("final")`; 5 trophies / 10 finals; regression test that re-derives the count independently. |
| `dedc0dc` | **Build principles added** to `RESTRAINT-PASS.md` (the four above). |
| `c8a3d89` | **Treble showpiece** — "Ten days in May": the three deciders in sequence with minute-stamped, named goals; the European Cup final leads with its two stoppage-time goals (90+1, 90+3) and a from-behind caption, all derived from the record. **Seasons cut** — removed from front door, headlines, explore signature, related trails; `/seasons` browsing page still carries per-season discovery; orphaned `seasonRanks` dropped. |
| _(this session)_ | **Treble elevated** — the card now has a hero, a moment, and a forging story. Details below. |

### Treble elevation (this session)

The card went from "faithful but flat" to the template the other elevations
should follow. The diagnosis: existing strong cards (late-goals, comebacks,
fortress) each have a **bespoke visual that encodes the argument** — the new
cards defaulted to generic primitives (`InspectableBarChart`, `WdlBar`) when
bespoke chart components were already in the codebase, unused. Three moves:

1. **Season spine hero.** All 63 matches of 1998-99 as a `ResultSpine` — a
   diverging skyline of wins above / losses below, bar height tracking goal
   margin. The three trophy-deciding nights carry competition-toned trophy
   glyphs (gold league, silver FA Cup, europe-blue CL) above their bars; the
   x-axis reads `Aug '98 … May '99`. The shape *is* the argument: you see the
   relentlessness before reading a word. `ResultSpine` was already built, already
   tested, already used on `/matches` — it just wasn't wired to this card
   (principle 4). Extended with `markerGlyph`, per-marker `tone`, and `xLabel`
   props, all backward-compatible.

2. **How it was forged — two semi-final nights.** New `trebleSemis()` helper in
   `trails.ts` surfaces the Juventus CL semi 2nd leg (2-0 down after 11 minutes,
   won 3-2 — Keane, Yorke, Cole) and the Arsenal FA Cup semi replay (won 2-1
   AET, Giggs). Each card replays the goals minute-by-minute for *both* sides, so
   the comeback reads in the coloured dots: red-red early, green-green-green
   late. This is the same minute-stamped event data the comebacks module uses;
   it was absent from the treble card entirely.

3. **Copy tightened** — less templated finding, warmer decider captions, factual
   framing of the "first English side" claim without overreach.

All green: `tsc` clean, 140 tests pass, `knip` clean, lint clean on touched files.

### Consensus decisions

- **`decline` will be retired** when the Ferguson reign-length visual lands. The
  decline story is absorbed into the Ferguson card as a supporting before/after
  chart; the headline becomes Ferguson vs every other manager on the axis where
  he's incomparable (reign length). The decline page is "a bit bland" on its own;
  the Ferguson card is the stronger home for the same data.
- **Treble is the template.** The move that worked — find the bespoke shape that
  already exists, make the chart the argument, add the dramatic story the data
  already carries — is the playbook for `rivalries` and `ferguson`.

## Open / next

- **Rivalries** — swap the WDL bar grid for `OpponentRivalryMap`; promote one
  charged match per ledger (the 6-1, the 4-0s, the title-deciders) to a hero
  slot; give each rivalry its emotional beat, not just its aggregate W-D-L.
- **Ferguson** — swap the PPG bar chart for a `ManagerTimeline`-style reign
  visual (every manager on a shared time axis, Ferguson's bar stretching across
  the page, PPG as tint). Absorb the decline before/after as a supporting chart.
  Retire `/decline` from the front door.
- **Europe** — still "a bit dry"; the finals grid is good, the decade bars are
  generic. Revisit after rivalries and ferguson.
- **Phase 3** — collapse the slice-sprawl, and apply principle 2 to `/compare`
  (like-for-like, role-appropriate metrics).
