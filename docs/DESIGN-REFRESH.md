# Page-by-page design refresh

> **These are initial ideas, not a spec.** The plan below is a starting map drawn
> from the match-detail and questions refreshes. It will be wrong in places. As we
> open each surface, our taste and priorities should sharpen against the *real*
> data and layout in front of us — expect per-surface ideas here to be replaced,
> not just ticked off. Treat the principles section as the durable part and the
> per-surface section as a sketch to react against.

Last updated: 2026-06-18.

## What the last refresh actually did

Two surfaces were taken from "competent ledger" to "floodlit match-night ledger",
plus a supporting media layer.

**1. Match detail (`/match/[id]`).** Consolidated a stack of labelled panels into a
few dense, self-explanatory objects: a single `MatchFlow` lead bar (timeline +
score ribbon merged, coloured by who's ahead), a banded teamsheet pitch with goals/
assists/cards rendered *onto* the shirts, a pre-match Elo expectancy bar, and
responsive team-name tiers (full → broadcast short → 3-letter code). Two whole
components and a "late goals that season" section were deleted. This produced the
Composition Principles now in `DESIGN.md`.

**2. Questions (`/questions`).** A story-driven rebuild where each module gets a
*bespoke* visual matched to its claim rather than a generic bar chart:

- **Late goals** — a `MinuteRidge` across the 90 (closing window shaded red) +
  decade `InspectableBarChart` against an even-spread baseline + an iconic-winners
  match list.
- **Bogey sides** — a win-rate ladder with the genuine bogey teams flagged by a
  red left border, each row carrying a `ClubBadge` and `WdlBar`.
- **Manager bounce** — `SlopeCompare` lines (hollow = prev 10, solid = first 10),
  sorted by swing, with manager portraits.
- **Fortress OT** — the "lead at half-time and you don't lose" rule, stated as a
  big `0`-defeats stat hero, then a dense column-major `LeadHeldDotplot` dot wall,
  closest-call cards, and a decade win-rate bar.
- **Cup specialists** — `CupLeanBar`: every player on a shared 0→100% cup-share
  axis with one continuous club-rate line laid over the whole stack; the gold that
  spills past the line is the story.
- **Own goals** — "Own Goal" framed as a top-N scorer via a stat hero linking to
  `/player/own-goal`, plus repeat-benefactor rows.
- **Away days** — folded in from the former `/analytics/travel`: two `GeoScatter`
  maps (domestic / European) + a per-season travel time series.

**3. Media + identity layer.** New `PlayerPortrait`, `ClubBadge`, and `clubColors`
infrastructure (Wikidata player/manager/OG-scorer images, club badges), threaded
across questions, `/managers`, `/opponents`, and `/player/[id]`. Plus the data
backfill underneath it (MUFCInfo goal minutes + own-goal scorers) that makes the
half-time and minute cuts possible.

## What this pass did — `/player/[id]`

The player detail page, surface #1 in the plan below. Taken from "header + tile
grid + chart stack" to a composed career object with a small set of bespoke,
coverage-aware modules.

- **`PlayerPlate` hero.** Header, stat tiles, and the two endpoint cards collapse
  into a single floodlit plate: portrait with the kit number patched onto its
  corner, one dominant `goals` figure beside a hairline ribbon of supporting
  readouts, and a `CareerArc` track where the recorded span reads as *position* —
  first match left, latest right, peak season marked in gold. Kit history folds
  into the footer band next to the trust caveat.
- **"The shape of his scoring."** Reuses `MinuteRidge` (from the questions late-goals
  module) for goal-minute distribution with the closing 15 shaded, then a row of
  `SplitBar` / stat facets — league-vs-cup, favourite victim, best scoring run.
- **`SeasonContributionChart`** — stacked goals+assists per season, gold for assists
  to match the chart-wide assist colour, feeding the sortable season `DataTable`
  below it.
- **`GoalBodyMap`** — a custom striker pictogram for curated goal-types (header,
  left/right foot, etc.); parked once as too-clever, then redrawn clean. Sits in
  the clearly-bordered curated-Tableau lane.
- **`AssistPartnerships`** — a two-sided supply map: goals he *set up* (gold) on one
  side, goals he *scored from* a team-mate (red) on the other, bars scaled to the
  strongest pairing across both sides. Direction lives in the layout, not in an
  "A assisted B" sentence list.
- **Reading-load discipline.** For prolific scorers the flat match list is huge, so
  the page leads with the hauls (braces + hat-tricks) and tucks the complete
  season-grouped record behind a disclosure. Same move on lineup appearances.

These four player components stayed **bespoke** (each carries one player-specific
fact cleanly); `MinuteRidge` was the genuinely reused object, pulled in from the
questions work. Nothing was promoted to `DESIGN.md` this pass.

### Principle this pass sharpened

**Let coverage shape the layout — render only the facets the data can fill.** The
plate's secondary readouts, the scoring-profile facet columns, and the assist
lanes all appear *only* when their number means something (`facetCount`,
direction-split lanes, no "—" filler tiles). An honest page about partial data
should grow and shrink with the evidence, not present a fixed grid of mostly-empty
cells. This is the slice/coverage contract expressed in the layout itself, and it
pairs with the existing "subtract a module if it doesn't earn its place" rule —
here applied per-facet, not just per-module.

## Principles distilled from the refresh

These extend the Composition Principles in `DESIGN.md` — read both together. The
ones below are the patterns that recurred specifically across the *questions* work.

1. **Match the visual to the claim, not the data type.** A myth gets the chart
   that makes *its* point fall out: a ridge for "when do goals land", a shared-axis
   ladder for "who beats a baseline", a dot wall for "this many, zero defeats", a
   slope for "before vs after". Resist defaulting every module to a bar chart.

2. **Lead with the answer as an object, support with a sentence.** The strongest
   modules open with a single large stat hero (`0` defeats, `19%` of goals in cups)
   paired with one plain-language sentence, *then* the evidence. The headline is a
   thing you can see before you read.

3. **Encode the baseline into the geometry.** When the finding is "X beats the
   normal rate", draw the normal rate as a line through the visual (club cup-rate
   line, even-spread dashed line) so "clearing it" is literally visible rather than
   asserted in prose.

4. **Position and density carry meaning before legends do.** Column-major dot
   walls, ladders ranked by the metric, left-border flags on the genuine outliers —
   the layout itself sorts and groups. Legends stay tiny and confirmatory.

5. **People and clubs are emotional anchors — use portraits and badges.** Threading
   `PlayerPortrait` / `ClubBadge` into rows turns an abstract table into faces and
   crests, which is on-thesis ("people are the emotional entry points") without
   costing scan speed.

6. **Subtract a whole module if it doesn't earn its place.** The Europe module was
   cut outright rather than weakened; travel was folded in from a thinning
   analytics page. Fewer, denser, better.

7. **Keep the trust contract literally at the foot of every object.** Each module
   still states `Slice:` and (graded) `Coverage:` — the refresh made things prettier
   *without* loosening the slice/coverage discipline. This is non-negotiable on
   every surface we touch.

8. **Bespoke is allowed when it's the simplest honest object.** The match facts
   grid and these per-question visuals are deliberately one-off. Shared components
   are the default (`DESIGN.md` Implementation Alignment), but a custom object that
   carries one fact cleanly beats forcing a generic component to almost-fit.

## Surfaces: done, partial, remaining

| Surface | State |
| --- | --- |
| `/match/[id]` | ✅ refreshed (composition principles came from here) |
| `/questions` | ✅ refreshed (story-driven, per-question visuals) |
| `/player/[id]` | ✅ refreshed (`PlayerPlate` + scoring shape + two-sided assist map; matches section reworked — `HaulCards` + `ContributionSpine` + full grouped appearances archive) |
| `/managers`, `/opponents` | 🟡 media layer only (portraits/badges); structure not yet reworked |
| `/` (home) | ⬜ |
| `/matches` | ⬜ |
| `/seasons`, `/seasons/[season]` | ⬜ |
| `/players` | ⬜ |
| `/manager/[id]`, `/opponent/[id]` (detail) | ✅ `IdentityPlate` + `RunCallouts` + composed Matches section (`NotableMatches` cards → `ResultSpine` → full season-grouped `MatchGroups` archive with `ArchiveJumpRail` + match-browser link); splits stay plain diverging `WdlBar`s (deviation framing tried and rejected) |
| `/managers`, `/opponents` (index structure) | ⬜ |
| `/analytics` | ⬜ |
| `/data` | ⬜ |

## Rough per-surface plan (initial ideas — expect these to change)

Suggested sequence is roughly highest-leverage first. Each entry is a *hypothesis*
to test when we open the surface, not a commitment.

### 1. `/player/[id]` — detail ✅ done
Shipped — see "What this pass did" above. The hero became `PlayerPlate` (portrait +
dominant goals figure + `CareerArc` span), the goal-minute histogram reused
`MinuteRidge`, league/cup landed as a `SplitBar` facet rather than a shared-axis
lean (the favourite-victim and best-run facets earned the row instead), and the
curated-Tableau lane stayed clearly bordered. The durable lesson carried forward:
*render only the facets the data can fill* — applied next to the head-to-head pages.

**Matches-section rework (later pass, after the head-to-head vocabulary matured).** The
detail-page-list thinking flowed *back* to the player page, but the club objects don't
transfer literally — a player's matches carry *United's* W/D/L, not his, so neither the
`ResultSpine` skyline nor margin-based `NotableMatches` apply. Three player-flavoured moves
instead: (a) the bespoke "hauls" list became **`HaulCards`** — `NotableMatches` chrome, but
*his goals* are the hero (a hat-trick, a brace) with the scoreline in support; shown as a
capped highlight reel (top 6), not the whole multi-goal list. (b) **`ContributionSpine`** — a
*one-sided* cousin of `ResultSpine`: every scoring match a bar, height the goals that game,
gold caps + pips on the hat-tricks; it never diverges because a player has no "down", and it
draws scoring games only (blanks/droughts aren't evidenced, so they aren't drawn). (c) the
appearances list — **silently capped at 30 most-recent, a real coverage bug** — became the
full season-grouped record (apps/started per season, not W-D-L) with an `ArchiveJumpRail`
(`idPrefix` distinguishes the `scored-` and `apps-` season anchors that would otherwise
collide). Lesson: *generalise the pattern, not the component — the same intent (answer →
shape → evidence) wants a different object when the subject's unit of meaning changes.*

### 2. `/manager/[id]` and `/opponent/[id]` — tenure / head-to-head detail ✅ done
Structurally a twin pair: an identity header + a record + splits + a fixture trail.
Now sharper, given the player pass:

- ✅ **Reuse the plate pattern, don't rebuild it.** Shipped as a shared `IdentityPlate`
  — portrait (manager) or `ClubBadge` (opponent), the win-rate % as the dominant
  figure, a hairline goals-for/against ribbon, the `WdlColumns`+`WdlBar` beneath, and
  a `SpanTrack` where tenure spells render as discrete bands and a fixture history fills
  the whole rail. It *did* generalise: `PlayerPlate` stays bespoke (kit number, goals-led),
  `IdentityPlate` is the shared answer-object plate. The "does this generalise" deliverable
  came out yes.
- ✅ **Record as the answer-object.** The plate leads with win-rate writ large + the
  W-D-L columns over a diverging `WdlBar`, one sentence ("from N matches"), then evidence.
- ✅ **Streak / run callouts.** Now a shared `RunCallouts` object: opponent gets longest
  unbeaten / winless in the fixture (down a column); manager gets longest winning /
  unbeaten run under the tenure (a band under the plate). Each card appears only when the
  run is real, and the manager's unbeaten card drops when it would just restate the
  winning one.
- ✅ **Standout matches — `NotableMatches` (shared, promoted).** The diagnosis that closed the
  match-list question: the reverse-chron paginated list answers "all matches, newest first" — a
  question nobody asks. Readers arrive with four intents (verify the record, see the *notable* ones,
  *locate* a remembered match, feel the *shape* over time); flat pagination serves only a sliver of
  the first and third. So the section now **leads with a curated answer-object and keeps the archive
  as the auditable appendix**. `NotableMatches` is a row of cards whose *eyebrow carries the why*
  — `Biggest win`, `Heaviest defeat`, `Ended a 33-match unbeaten run` — with the scoreline writ
  large and a result-coloured edge. Crucially **notability is computed only from signals the page
  already owns**: margin extremes (one pass over the date-ordered sequence) and the *ender* of each
  run `RunCallouts` already draws (the row after the run's last date — an ongoing run has no ender,
  so the card drops). The sequence helpers were enriched once to carry match identity so both the
  streaks and the cards read off the same array; no new round-trips. Per-card coverage gating
  throughout (no win → no biggest-win card) plus a volume gate (<15 matches → the whole object
  suppresses, since extremes off a handful of games are noise). This is the generalisation of the
  player page's "hauls" move — the player surface is the goals-flavoured instance of the same idea,
  left bespoke. *Filters were explicitly rejected as the answer: they make the reader discover what's
  notable; the page already knows.* Lesson for the principles: **a detail-page list should resolve
  into the reader's intent, leading with a computed answer, not present a raw ledger ordered by recency.**
- ✅ **The shape — `ResultSpine` (shared, promoted).** Between the cards and the archive sits the whole
  record as one diverging skyline: every match a bar in date order, wins spiking up / losses down, bar
  height the goal margin, draws a neutral tick on the line. Streaks read as ridges of colour and slumps
  as red valleys — the *shape* intent (#4) that no list can serve. The `NotableMatches` are flagged as
  gold pips, so the header cards and the spine are visibly the same matches. The x-axis is non-uniformly
  scaled (sub-pixel bars on a 1,497-match tenure blend into bands), so the pips ride an HTML overlay to
  stay circular; gated at ≥20 matches. Answer → shape → evidence, top to bottom, is the composed
  Matches-section pattern now shared across both detail pages.
- ✅ **The archive — volume-adaptive `MatchArchive` + sticky `ArchiveJumpRail`.** The raw
  paginated `MatchList` (50/page) became the *complete* record grouped by season — which fixes a real
  honesty bug: a season split across pages can't tally its own W-D-L, but a whole-season group can.
  But the complete record is a wall for the giants (Busby 1,141, Ferguson ~1,500, the oldest rivalries):
  `MatchArchive` keeps the full `MatchGroups` stream below ~150 matches and **collapses to one expandable
  season-summary row each** (native `<details>`, zero JS) above it — same `season-…` anchors either way,
  so the rail works identically. Navigation is the `ArchiveJumpRail`, now a base component: grain steps
  only as coarse as it must to stay under ~14 chips (season → five-year period → decade), killing the old
  cliff where a 16–25-season span dropped to 2–4 useless decade chips; and it pins under the header while
  the archive scrolls, with an `IntersectionObserver` scrollspy lighting the season you're reading. Plus a
  "filter these in the match browser →" link (needed a small `manager` filter on `MatchFilter`; opponent
  already worked). The spine gives the overview, so the archive is free to be long — it's the last section
  and buries nothing.
- ✅ **Splits stay plain `WdlBar`s — both fancier framings tried and rejected.** Two dead ends,
  worth recording so we don't re-walk them:
  1. The plan's *two-sided* (`AssistPartnerships`) layout encodes *direction* (set-up vs
     scored-from); home / away / league / cup are *categorical partitions*, not opposites, so
     left/right would assert a contrast that isn't there.
  2. A *baseline-deviation dumbbell* (built as `SplitBends`, then removed) drew the manager's
     overall win rate as a line and hung each split off it. It looked sharp but was **dishonest**:
     home > away and league ≈ overall are league-wide physics true of *every* manager, so
     deviation-from-his-own-average can only ever draw the same shape — it dresses a structural
     constant as a per-manager finding.

  The real insight: the only baseline that *means* anything for a split is **break-even (50%):
  does he win more than he loses in this split?** — and the diverging `WdlBar` already draws
  exactly that as its centre fulcrum (some managers have a winning home but a losing away record).
  So no invented baseline; the splits are an honest **reference breakdown** ("Split five ways",
  grouped into a venue pair — Home / Away — and a competition trio — League / Domestic cup /
  European cup — since those are two different cuts of the same matches), win-rate + `WdlColumns`
  + a diverging bar,
  the centre fulcrum carrying the one true baseline. The bar is a `ProportionalWdlBar`: its
  *length* tracks games played (one pixels-per-game scale shared across the five rows), so League
  reads as the long bar and the cups as short ones rather than every record drawing a constant
  50%-width — sample size becomes visible without a second chart. The cup buckets split the
  'super-cup' edge by id (UEFA Super Cup → European; shields → domestic); friendlies and the
  intercontinental finals ('world') sit outside all buckets. Same plain treatment on the
  opponent's "Home and away". *Lesson for the
  principles: a visual that can only ever draw the same shape regardless of the subject is
  decoration, not analysis — kill it even when it's pretty.*
- ✅ **Coverage footer per module.** The split / run / cup modules' ad-hoc one-line
  footnotes were promoted to real `CoverageNote`s — a bold `Slice:` line matching the match
  list, with the reading-how-to prose (bar pivots on its centre, a gap breaks the run) kept
  as the note's `children` and the per-module nav links (`Away meetings only →`, `Show the
  cup ties →`) folded into its evidence slot. Principle 7's trust contract now reads
  identically at the foot of every object on both pages, not just the archive.

Both pages live on one branch (they share queries and the plate decision). The pass is
complete — every item above shipped, and four objects were promoted to **shared**:
`IdentityPlate`, `RunCallouts`, `NotableMatches`, and `ResultSpine`. No bespoke splits
object survived (see above), and the coverage footers now match the archive's full
`CoverageNote`. Nothing reached `DESIGN.md` this pass — the promotions are shared
components, not new composition principles.

**Follow-up: the archive at scale (`MatchArchive`).** A later pass returned to the one part
that still buried the page — the archive for the giants (Busby's 1,141 matches, Ferguson's
~1,500). The full season-grouped stream is honest but unreadable at that length, and the
`ArchiveJumpRail` was patching a *content* problem with *navigation*: in decade mode it gave
four chips over a 1,141-row wall. Two moves. (a) **`MatchArchive`** makes the section
volume-adaptive — the full `MatchGroups` stream below ~150 matches, and above it one
expandable season-summary row each (native `<details>`, zero JS) so a 1,141-match tenure
reads as ~25 scannable rows that open on demand; the complete match-by-match data stays one
click away in the match browser. (b) **`ArchiveJumpRail` became a base component** — its grain
now steps only as coarse as it must to stay under ~14 chips (season → five-year period →
decade), killing the cliff where a 16–25-season span collapsed to 2–4 useless decade chips,
and it pins under the header with an `IntersectionObserver` scrollspy. Both anchor the same
`season-…` ids, so the rail works identically over the stream or the summaries. *Lesson for
the principles: when a list grows past readable, reach for the content decision (what does
this page render?) before the navigation patch (how do you jump around the wall?) — and let
the base component scale its own grain to the data rather than cliff-edging between two modes.*

### 3. `/matches` — the record's spine (next up)
Mostly already systematized (filter grid, decade rail, summary band). Refresh is
lighter: make the summary band a proper stat-hero answer to the *current filter*
("this slice: 412 games, 58% won"), and make sure `CompetitionDot`/`WdlBar` rhythm
reads as scannable as the questions ladders. Resist turning a dense list into cards.

Sharpened by the h2h pass: this is the one surface where **filters *are* the answer**,
the exact opposite of the detail-page diagnosis. The manager/opponent archives now
*delegate* here — every "filter these in the match browser →" link lands on `/matches`
carrying a filter (the `manager` filter was added for exactly this) — so the refresh must
keep `/matches` the canonical, auditable filter target, not pull a curated answer-object
over it. The detail pages own "what's notable / what's the shape"; `/matches` owns "show
me precisely this slice". The stat-hero summary band is the right move *because* it
answers the filter the reader already chose, rather than choosing one for them. Consider
borrowing `ResultSpine` only if it can read the active slice honestly at any length.

### 4. `/seasons/[season]` and `/seasons`
Per-season: lead with the season's shape (final position, W-D-L, the season brief)
as one object, competition runs as positioned lanes, and the match list below.
Index: the decade grouping is fine; consider a compact per-season WdlBar sparkline
so the index itself shows the shape of each year.

### 5. `/analytics`
Already tiered into chapters with the question rail. The refresh question is whether
each chapter chart now feels generic next to the questions page — likely candidates
to give bespoke treatment are the Elo timeline (already era-shaded) and the records
chapter. Risk: this page is large; subtract before adding.

### 6. `/` (home)
The launchpad. Per `DESIGN.md`, lead with a trail not a hero-metric. Candidate:
pull one live question module (or a teaser of one) above the fold so the homepage
demonstrates the questions surface rather than just linking to it; keep search and
recent-evidence prominent. Probably do this *last*, once the per-question visual
vocabulary is settled, so the homepage can quote the best of it.

### 7. Index pages `/players`, `/managers`, `/opponents`
Lower priority — these are scan-and-drill surfaces and should stay compact. Refresh
is mostly: portraits/badges already added, so tighten row rhythm, confirm `WdlBar`
consistency, and consider the deferred segmented grouping (by era / alphabet) noted
in `INVENTORY.md`.

### 8. `/data`
The trust surface. Refresh is about legibility of the coverage ledger, not
atmosphere. Carry forward the remaining faint-text spots flagged in
`VISUAL-AUDIT.md`. Lowest visual priority, but don't skip the contrast items.

## Working method

- One surface at a time, on its own branch; `next build` + golden tests + lint +
  typecheck + `knip` stay green before moving on.
- When a surface produces a genuinely reusable object (as `MatchFlow` and
  `CupLeanBar` did), promote it and update `DESIGN.md`. When it stays bespoke, say
  so explicitly (like the match facts grid).
- After each surface, revisit this doc: mark what shipped, and rewrite the *next*
  surface's idea with sharper taste. The plan is meant to degrade gracefully into
  reality.
