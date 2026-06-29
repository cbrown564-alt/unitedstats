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
| rivalries | ✗ no question, just a census | ✗ map argues the wrong axis; data won't carry a story | **Cut** (done) |
| ferguson | ◐ overlaps decline | ✗ a manager bar chart | Keep — will absorb `decline` |
| seasons | ✗ points ≠ best; dup of treble | ✗ 130-bar density | **Cut** (done) |

Only `europe` and the rebuilt `treble` are both correct and distinctive. The net
move is 6 new cards → 4, with `seasons` and `rivalries` cut and `decline` slated to
fold into `ferguson` next.

## Changes made this pass

| Commit | Change |
| --- | --- |
| `050c5b9` | **Europe finals bug fixed** — reuse `roundFilterPredicate("final")`; 5 trophies / 10 finals; regression test that re-derives the count independently. |
| `dedc0dc` | **Build principles added** to `RESTRAINT-PASS.md` (the four above). |
| `c8a3d89` | **Treble showpiece** — "Ten days in May": the three deciders in sequence with minute-stamped, named goals; the European Cup final leads with its two stoppage-time goals (90+1, 90+3) and a from-behind caption, all derived from the record. **Seasons cut** — removed from front door, headlines, explore signature, related trails; `/seasons` browsing page still carries per-season discovery; orphaned `seasonRanks` dropped. |
| _(this session)_ | **Treble elevated** — the card now has a hero, a moment, and a forging story. Details below. |
| _(this session)_ | **Template distilled** — the five-move playbook + restraint counterweight (above), agreed as floor + earned. |
| _(this session)_ | **Rivalries elevated, then cut.** First applied moves 1+2 (`OpponentRivalryMap` hero + crowned focal match per ledger), but a fan's-eye review found the page still answered nothing — and validating the metric showed why. **Cut** like `seasons`: removed from front door, headlines, explore signature, related trails (inbound links re-pointed); the elevation reverted. `/opponents` + per-opponent pages still carry rivalry discovery. Details below. |

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

### Rivalries: elevated, validated, cut (this session)

The most useful failure of the pass. The sequence:

1. **Applied the template (moves 1+2).** `OpponentRivalryMap` as the hero (extended
   with a `featured` prop to crest the four named rivals over the faint landscape);
   each ledger crowned its biggest win. Clean build, all checks green.
2. **A fan's-eye review rejected it.** Reusing a good visual wasn't enough: the map
   says "we've played these teams a lot and win a bit less than average" — facts,
   not a story. The page didn't say why it existed. *Right reflex (reuse), wrong
   question (census, not rivalry).* → This is **Move 0**, added to the template.
3. **Chased a real angle, then validated it.** The pitched thesis — "balance of
   power over time; United's grip loosens on all their rivals" — was checked against
   the per-decade head-to-head record *before building*. It **didn't hold**: the
   records are noisy and lagged the league decline (United kept beating Liverpool and
   Arsenal head-to-head right through the 2010s). The clean story was false.
4. **The honest story was real but too mild.** Summed across rivals, the per-decade
   net does trace the rise-and-fall (troughs in the 1920s/30s/70s relegations, a
   +28 peak in the 1990s, a first dip below zero in the 2020s) — defensible, but a
   thin reed for a whole front-door question.
5. **Cut it.** Offered the user the honest reframe or deletion; they chose deletion.
   Removed like `seasons`: out of `questions.ts`, `questionHeadlines.ts`,
   `QuestionSignature.tsx`, `QUESTION_COMPONENTS`, and `related.ts` (three inbound
   trails re-pointed so each keeps ≥2 valid links); the moves-1+2 elevation reverted
   and the `featured` extension rolled back. `/opponents` + per-opponent pages keep
   rivalry discovery. `tsc`/140 tests/`knip`/lint all clean.

The lesson is cheaper learned here than shipped: **validate the question and the
metric before you build the chart.** Polishing the wrong page just makes the wrong
page shinier.

### Consensus decisions

- **`decline` will be retired** when the Ferguson reign-length visual lands. The
  decline story is absorbed into the Ferguson card as a supporting before/after
  chart; the headline becomes Ferguson vs every other manager on the axis where
  he's incomparable (reign length). The decline page is "a bit bland" on its own;
  the Ferguson card is the stronger home for the same data.
- **Treble is the template.** The move that worked — find the bespoke shape that
  already exists, make the chart the argument, add the dramatic story the data
  already carries — is the playbook for `ferguson`. (Tried on `rivalries`; Move 0
  then cut it — the template needs a real question and a real story underneath.)
- **Agreed scope: floor + earned.** Moves 1–2 on every elevated card; moves 3–4
  only where the card has a genuine second act. Not the full treble budget each
  time — that would re-create the sprawl this pass is fighting. Did `rivalries`
  first (now cut at Move 0); `ferguson` is next.

## The Treble template, distilled — the playbook for the rest

_What actually moved the treble card from "faithful but flat" to a showpiece,
abstracted into transferable moves. This is the part to agree on before applying
it to the other cards. The five moves are in priority order; a card climbs as far
up as it earns, not all the way by default (see the restraint counterweight)._

**Move 0 — First, does the card answer a real question?** (Learned the hard way on
`rivalries`, below.) Before any of the moves, two preconditions: (a) the card poses
a question a fan actually argues, and (b) the data carries a true, defendable story
toward an answer. The template *amplifies* a story; it cannot *manufacture* one. Two
traps it surfaced: **a reused good visual can still argue the wrong axis** — the
`OpponentRivalryMap` answers "who do we play most and beat least" (a census), not
"who's our enemy and are we still beating them" (the rivalry); and **the headline
thesis must survive the numbers** — validate the metric before building, because
"United's grip loosens on all their rivals" sounded right and the per-decade record
flatly refused to show it. If Move 0 fails, the honest move is to cut, not to dress
the census up.

**Move 1 — Lead with a shape that argues.** The hero visual should encode the
answer so the eye gets it before the prose does. The treble's `ResultSpine` of all
63 matches *is* the relentlessness — wins above, losses below, trophies marked.
The rule underneath: **reach for the bespoke chart that fits the dimension, not a
generic primitive** — *and that argues the question, not an adjacent one* (Move 0).
A season wants a spine; a reign wants a time axis. `InspectableBarChart` and the
stacked `WdlBar` are the tells of a flat card.

**Move 2 — Crown one moment; don't grid equals.** The European Cup final is
elevated (gold glow, a from-behind caption) while the other two deciders support
it. Four equal-weight ledgers read like a directory; a card needs a focal point.
Pick the single match / rivalry / reign that carries the charge and give it
hierarchy.

**Move 3 — Surface the drama the data already holds.** The record carries
stoppage-time goals (90+1, 90+3), a comeback from 2-0 — a flat card buries them in
a scoreline. Show the minute-stamped, named specifics (via `MatchFlow`); *derive*
"dramatic" from the timing rather than asserting it.

**Move 4 — Add a second beat — the backstory.** "How it was forged" (the two
semi-final comebacks) gives the card a second act past the headline. The aggregate
is the claim; the specific nights are the proof you actually remember.

**Move 5 — Write like a fan, derive like an analyst.** Plain, warm captions;
factual claims grounded in the record ("first English club" — derived, not
asserted); no templated finding-voice, no overreach.

**The restraint counterweight (this is a restraint pass).** Not every card climbs
all five rungs. The treble is sacred and earns a hero + two full sections. **Moves
1–2 are the floor** — every elevated card needs the right shape and a focal point.
**Moves 3–4 are earned** — only cards with a genuine second act get the backstory
treatment. Spending the full treble budget on every card is its own kind of sprawl,
and the wrong default for this pass.

**Reuse finding that makes this cheap.** The bespoke shape `ferguson` wants
*already exists and is already wired* — to its browsing page, not the question card.
This is exactly the `ResultSpine` situation (built, tested, used on `/matches`, just
not on the treble card):

| Card | Bespoke shape | Already used on | Not yet on |
| --- | --- | --- | --- |
| ferguson | `ManagerTimeline` | `/managers` | the ferguson card |

So elevating `ferguson` is mostly wiring + curation, not new chart work — the
expensive part is choosing the right focal reign and the copy. (`rivalries` looked
like the same easy win — reuse `OpponentRivalryMap` — but failed Move 0 and was
cut; reuse is necessary, not sufficient.)

## Open / next

- **Rivalries** — ✅ **cut** (see "Rivalries: elevated, validated, cut" below). The
  moves-1+2 build was real, but the page failed Move 0 and no honest metric rescued
  it. Removed cleanly like `seasons`; the elevation reverted. Rivalry discovery
  stays on `/opponents` and the per-opponent pages.
- **Ferguson** — moves 1+4, and the next thing to build. Swap the PPG bar chart for
  a `ManagerTimeline` reign visual (every manager on a shared time axis, Ferguson's
  bar stretching across the page, PPG as tint — move 1), and absorb the decline
  before/after as the supporting second beat (move 4). Retire `/decline` from the
  front door. **Apply Move 0 first** — confirm the reign-length story survives
  before wiring the chart (it should: Ferguson's 27 years is incomparable, a fact
  the data carries cleanly — unlike the rivalry balance).
- **Europe** — lower priority. The finals grid is already a bespoke shape (move 1
  done); what's "dry" is the missing drama — the two European Cup finals' own
  stories (move 3). Revisit after ferguson.
- **Phase 3** — collapse the slice-sprawl, and apply principle 2 to `/compare`
  (like-for-like, role-appropriate metrics).
