# Page-by-page design refresh

> **These are initial ideas, not a spec.** The plan below is a starting map drawn
> from the match-detail and questions refreshes. It will be wrong in places. As we
> open each surface, our taste and priorities should sharpen against the *real*
> data and layout in front of us — expect per-surface ideas here to be replaced,
> not just ticked off. Treat the principles section as the durable part and the
> per-surface section as a sketch to react against.

Last updated: 2026-06-17.

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
| `/managers`, `/opponents`, `/player/[id]` | 🟡 media layer only (portraits/badges); structure not yet reworked |
| `/` (home) | ⬜ |
| `/matches` | ⬜ |
| `/seasons`, `/seasons/[season]` | ⬜ |
| `/players` | ⬜ |
| `/player/[id]` (structure) | ⬜ |
| `/manager/[id]`, `/managers` (structure) | ⬜ |
| `/opponent/[id]`, `/opponents` (structure) | ⬜ |
| `/analytics` | ⬜ |
| `/data` | ⬜ |

## Rough per-surface plan (initial ideas — expect these to change)

Suggested sequence is roughly highest-leverage first. Each entry is a *hypothesis*
to test when we open the surface, not a commitment.

### 1. `/player/[id]` — detail (do early; highest emotional payoff)
The page where portraits already landed. Candidate moves: a hero that leads with
the player as an object (portrait + career W-D-L + the headline goal/app numbers),
the goal-minute histogram reusing `MinuteRidge`, competition splits as a
shared-axis lean rather than a table, and the curated-Tableau lane clearly bordered
as its own thing. Carry the slice/coverage footer per module.

### 2. `/opponent/[id]` and `/manager/[id]` — head-to-head / tenure detail
These are structurally similar (a record + splits + a fixture trail). Candidate:
a stat-hero record (`WdlBar` writ large, or the diverging fulcrum bar), home/away/
cup as positioned splits, longest-run / streak callouts, and badge/portrait
identity in the header. Good place to prototype streak detection (Phase 9 overlap).

### 3. `/matches` — the record's spine
Mostly already systematized (filter grid, decade rail, summary band). Refresh is
lighter: make the summary band a proper stat-hero answer to the *current filter*
("this slice: 412 games, 58% won"), and make sure `CompetitionDot`/`WdlBar` rhythm
reads as scannable as the questions ladders. Resist turning a dense list into cards.

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
