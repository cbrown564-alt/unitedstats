# Page-by-page design refresh

> **These are initial ideas, not a spec.** The plan below is a starting map drawn
> from the match-detail and questions refreshes. It will be wrong in places. As we
> open each surface, our taste and priorities should sharpen against the *real*
> data and layout in front of us — expect per-surface ideas here to be replaced,
> not just ticked off. Treat the principles section as the durable part and the
> per-surface section as a sketch to react against.

Last updated: 2026-06-19.

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
| `/managers`, `/opponents` | ✅ index structure reworked (see below) |
| `/` (home) | ✅ refreshed — **bespoke `HistorySkyline` hero**: a floodlit plate where the headline and search sit over every season since 1886-87 drawn as one breathing wall (bar height = matches played, stacked W/D/L, the honest 20 top-flight titles gold-capped). Below it the body is paced into three movements (start a trail → the living record → explore) with the redundant Elo chart and "fullest match sheets" grid cut. First pass (records teaser + live `MinuteRidge` + dropped 4-tile metric block) was the foundation; the hero + restructure is what made it land |
| `/matches` | ✅ refreshed (filter-answering stat-hero band + slice-wide `ResultSpine`; new shared `GoalDiff` + `ResultSpine` record header threaded back through the detail/season headers; archive spine kept as the canonical, auditable filter target) |
| `/seasons`, `/seasons/[season]` | ✅ detail leads with the league finish as an `IdentityPlate` (generalised with a `headline` override) → season brief → `ResultSpine` → competition lanes carrying each campaign's outcome; **index rebuilt around a bespoke `FinishTimeline` hero** (135 years of finishing position as one two-tier rise-and-fall), honest title count (20, not 22), and a per-decade **fixed-lane scoreboard** — the league finish drawn as the table itself (`FinishLadder`), fixed cup lanes sharing a promoted `CampaignVerdict` |
| `/players` | ✅ left as-is — already refreshed (sortable `DataTable` + portraits + search + trust block); a player has no W/D/L, so the shared row didn't apply and re-skinning a working tool would be motion without value |
| `/manager/[id]`, `/opponent/[id]` (detail) | ✅ `IdentityPlate` + `RunCallouts` + composed Matches section (`NotableMatches` cards → `ResultSpine` → full season-grouped `MatchGroups` archive with `ArchiveJumpRail` + match-browser link); splits stay plain diverging `WdlBar`s (deviation framing tried and rejected) |
| `/managers`, `/opponents` (index structure) | ✅ shared `IndexRow` rhythm across both; managers grouped into bespoke **era bands** (data-anchored on the two 1,000-match tenures), opponents stay ranked-by-meetings with an explicit rank index; `CoverageNote` footer on both |
| `/analytics` | ✅ restructured from a flat ~10-section stack into **three acts + a trails appendix** (signal → projection → production): a floodlit `EloHero`, a bespoke `ReliabilityCurve` replacing the calibration table, six all-time-peak `RecordCards`, an upgraded assist ladder; grounds grid cut (and its query), coverage links merged |
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

### 3. `/matches` — the record's spine ✅ done
Lighter than the detail passes, exactly as planned — the page was already systematized
(quick views, filter grid, decade rail, sort, list, pager), and all of that stayed. The
refresh spent its boldness in one place, the summary band, and borrowed one shared object.

- ✅ **Summary band → filter-answering stat-hero, echoing the detail-page plate.** The flat
  five-`StatTile` grid (where win rate was buried as one of five equal cells) became the
  `IdentityPlate` hero treatment: the win rate writ large in devil-bright with `from N
  matches` beneath, and a `GoalDiff` readout beside it (see below). The
  figure **adapts to the slice** — win-rate % when the result is open, but the **count**
  ("1,628 defeats", result-coloured) when the reader has *pinned* a result, because then
  win-rate would only ever read 100%/0% (the subline drops then, since the count *is* the
  match total). This is the doc's thesis made literal: the hero answers the filter the
  reader already chose. The prose breakdown sentence and the avg-home-crowd stat were both
  cut — once the `WdlColumns` + `WdlBar` carry the W-D-L (see below), "Won 2,981, drawn
  1,418…" only restated them. The bar/columns header drops entirely when a result is pinned
  (a single-colour bar carries no information).
- ✅ **Borrowed `ResultSpine`, reading the *whole* slice.** The shared spine now sits between
  the band and the list, drawing the entire filtered set (never the 50-row page) in date
  order — the *shape over time* intent that no paginated list can serve, now available for
  any slice the reader builds. Always chronological regardless of the list's sort (it's a
  different view, labelled "Result by match over time"); gated at ≥24 matches; **no
  notable-pips** — on `/matches` the spine is pure shape, never a curated answer-object, which
  keeps the page the auditable filter target the h2h archives delegate to. Needed one
  lightweight `matchesSequence(f)` query (shared `matchWhere`, so the list, summary, and spine
  read the same slice) and exporting `matchWhere`.
- ✅ **`ResultSpine` grew an embedded record header (`showRecord`).** The W-D-L the skyline
  already plots is now summarised above it as a `WdlColumns` caption over a diverging
  `WdlBar` — totals and proportion, then their timing, as one object. `/matches` turns it on
  (the spine *is* the band's record now; below the ≥24 gate a non-pinned slice falls back to
  the same columns+bar header on its own). Off by default, so the detail pages — which lead
  with the record in their `IdentityPlate` — stay unchanged. The same `WdlColumns`-over-bar
  header also replaced the inline `WdlRecord` in every `MatchGroups` season subheader (a new
  `compact` `WdlColumns` variant), so the record reads identically at the top of the slice
  and at the top of each season below.
- ✅ **`GoalDiff` — goals as their actual meaning, shared across the headers.** The aggregate
  `1,234–987` read like a scoreline and forced the reader to subtract. A new shared `GoalDiff`
  leads with the signed, colour-coded goal difference (`+3,130` green ahead, `−34` red behind)
  with `X scored · Y conceded` named in support — the verdict is preattentive (sign + colour),
  the exact margin is the number itself. A subtle `per game / total` toggle switches the whole
  readout's unit and **defaults to per-game** (it compares honestly across a 40-game season and
  a 1,141-game tenure); the block variant is a client leaf for that state. It replaced the for/against readout in the match band,
  the `IdentityPlate` ribbon (manager + opponent), and the season grid (an `inline` variant —
  just the tinted figure — since that fixed tile supplies its own label). Picked over a
  diverging "goals bar" (which would have put a second red/green diverging bar next to the
  W-D-L one); per-game averages weren't a rival framing but came back *inside* this one as the
  toggle's default unit. *Lesson: when a two-number readout isn't scanning, the fix is usually
  to compute the relationship the reader was deriving by hand and show **that** as the object.*
- ✅ **Subtracted the redundant header aside.** The old `StatTile` total + page-size tiles in
  the `PageHeader` were dropped — the band now owns the count (one element per fact).

Nothing reached `DESIGN.md`, but the pass touched the shared layer more than "lighter"
implied: `ResultSpine` was reused (its third surface) *and* grew an optional record header;
`WdlColumns` gained a `compact` variant; and **one new shared component, `GoalDiff`, was
created** and threaded back through the detail and season headers. The work spilled outward
because the goals readout and the W-D-L header live on every record surface, so fixing them
once — as shared objects — was cleaner than patching the band alone. *Lessons carried forward:
(1) the same shared shape-object reads honestly on a filter-driven surface as long as it stays
decoration-free — no curated markers — so it describes the slice rather than editorialising it;
(2) the adaptive headline (answer-the-filter, don't choose one for the reader) is the reusable
idea, even though it stayed inline; (3) when a header readout that appears on several surfaces
isn't scanning, fix it once as a shared object and let the improvement propagate.*

### 4. `/seasons/[season]` and `/seasons` ✅ done
Shipped close to the hypothesis, with the headline sharpened on the way in.

- ✅ **Detail leads with the *finish*, not the win rate — via a generalised `IdentityPlate`.**
  The flat five-`StatTile` grid (Played / W–D–L / Goal diff / Win rate / Avg home crowd), the
  prose breakdown sentence, and the standalone `WdlColumns`+`WdlBar` collapsed into the shared
  plate. The key decision: a season's *verdict* is **where it finished**, so the plate's dominant
  figure is the league position (`1st` gold for champions, `7th` ink otherwise) with the
  competition + "of N" as its sub-line, win rate demoted to a secondary readout beside the
  built-in `GoalDiff` ribbon. This is the player-page lesson again — *generalise the pattern, not
  the component* — but here it generalised *into* `IdentityPlate` rather than away from it: the
  plate grew an optional `headline` override (default stays win-rate "won", so manager/opponent are
  byte-identical) and an optional `leading` (a season has no portrait, so it renders single-column).
  `PlayerPlate` still stays bespoke; `IdentityPlate` is now the shared answer-object plate for
  *three* record surfaces (manager, opponent, season). Avg-home-crowd was cut exactly as on
  `/matches` — it never earned a top-line cell.
- ✅ **Season brief as the supporting sentence.** Kept as a distinct prose block immediately under
  the plate (principle 2: answer-object first, sentence second), with its "written by the data"
  caveat intact. Not folded *into* the plate — the brief wants a readable measure, and the plate's
  ribbon was already dense.
- ✅ **`ResultSpine` for the season's shape.** The shared spine (its fourth surface) drawing the
  whole season in date order, gated ≥24 matches, `matchesSequence({ season })` reusing the
  `/matches` query path verbatim. Pure shape — no record header (the plate leads with it) and no
  notable-pips (a season's standouts live in the competition lanes below, not as curated cards).
- ✅ **Competition runs as outcome-carrying lanes.** Each competition section's header now states
  the *campaign* outcome — `Champions` / `7th of 20` for the league, `Winners` / `Runners-up` /
  furthest round for cups (gold for silverware) — beside that competition's W–D–L, turning each
  flat `MatchList` into a season-within-the-season. Outcome is computed from signals the page owns
  (the league summary's position; a won/lost final detected in the comp's own matches; else the
  summary's furthest round). `CoverageNote` at the foot.
- ✅ **Index flags the peaks.** Light touch as planned: title-winning seasons get a gold left
  border and a gold `Champions` verdict (the rest read `Nth of N`), so the decade scroll itself
  shows where the silverware landed — the left-border-flag idiom from the bogey-sides ladder. The
  per-season league `WdlBar` already carried the "shape of each year" the sketch wanted, so no
  sparkline was added.

*Lesson for the principles: the "answer-object plate" is now clearly a **family** — the dominant
figure is whatever the subject's unit of meaning is (win rate for a relationship, goals for a
player, league finish for a season). Generalising via an optional headline override kept one shared
component instead of a third bespoke plate, the opposite call from the player page and the right one
because everything **below** the headline (GoalDiff ribbon, W–D–L bar) was already identical.*

**Follow-up: cup lanes resolve into a bracket (`CupRun`).** The competition lanes opened to a flat
chronological `MatchList` — fine for the league grind, but a cup is a *run*, and the list buried the
round-by-round story (which legs, what aggregate, how far) under date order. The expanded lane for a
knockout competition now renders **`CupRun`** instead: a vertical "road to the final" ladder where a
green winning-spine climbs through each rung — a tie (one match, a two-legged aggregate, or a replay)
or the group stage — and terminates in the verdict node: a gold trophy for a win, a silver medal for
runners-up, a red stop where the run was knocked out. *Position down the ladder is round depth; the
spine colour and the terminal node are the result* — neither needs a legend (principle 4). It replaces
the `MatchList` only once there are ≥2 stages to ladder; leagues and one-off ties keep the flat list.

Three decisions worth recording:
1. **It's a *path*, not a two-sided bracket — because that's all the data honestly supports.** We hold
   only United's side of every tie, so a real bracket tree would be mostly empty opponent slots. The
   single-spine "run" is the honest object (the same instinct as "render only the facets the data can
   fill"): a memorable bracket-flavoured image that asserts nothing we don't have.
2. **Advancement is read from *depth*, not the leg scores.** A two-legged tie levelled on aggregate
   (won on away goals or penalties) can't be settled from the displayed score — 1968-69 vs Anderlecht
   reads `agg 4-3` only because they lost the second leg 1-3, yet they went through. So `CupRun` derives
   "advanced" from *a deeper stage existing*, and reserves a real outcome only for the deepest stage
   (Final → won/lost; else knocked out). The scores are shown; the progression is computed from the
   shape of the run, which is the one signal that's always right. *Lesson: when a per-row result can't
   be trusted from the row's own number, read it from the structure the rows sit in.*
3. **Round canonicalisation is mirrored from the data build, not re-invented.** `lib/cupRun.ts`'s
   `roundRank` is a verbatim copy of `scripts/build-db.ts`'s, so the deepest rung drawn here agrees
   with the stored `furthest_round` and the lane's `CampaignVerdict` — the sources spell a round a dozen
   ways and both places must canonicalise identically or the bracket and the header would disagree. The
   trophy/medal glyphs were extracted to a shared `CampaignIcons` so the lane verdict and the bracket's
   final node show the *same* trophy for the same season.

`CupRun` stays **bespoke** (a one-off object carrying the cup-run fact cleanly — the `MatchList`/`ResultSpine`
vocabulary doesn't transfer, since a run is round-structured, not date-ordered or diverging). Nothing reached
`DESIGN.md`; the extraction was a shared icon set, not a new composition principle.

**Follow-up: the index gets its own bold object (`FinishTimeline`).** The detail page was the elevated
one; the *index* was still a decade-grouped table that didn't earn its place next to it. The fix is a hero
that does what no alphabetised list can — show the **shape of the eras**: every league season since United
joined the Football League (1892) plotted as a finishing position, champions hard against the top, the
relegation zone sinking toward a divider, and the **two exiles to the Second Division dropping into a lower
band** so they read as the literal valleys they were. Built on the `ResultSpine` hybrid (a stretch-to-fit
SVG carries the connecting line; round dots and crisp labels ride a percentage-positioned HTML overlay), and
every point links to its season. Three things worth recording:

1. **A continuous "pyramid depth" axis is the honest way to mix divisions.** Plotting raw `position` would
   put a 2nd-Division 1st level with a top-flight 1st — a lie. So the second tier opens *below* the foot of
   the top flight (depth `SECOND_TOP + within`), making promotion a climb and relegation a fall. Winning the
   Second Division is a **hollow gold ring**, never the solid gold of a league title — the encoding states
   the rank difference colour carries, not prose. *Same instinct as `CupRun`: when rows live in a structure
   (here, a division ladder), read meaning from the structure, not the bare number.*
2. **The honesty fix the table was hiding: 20 league titles, not 22.** The old header counted every
   `position === 1` as a "league title", silently promoting the 1935-36 and 1974-75 *Second Division* titles
   to championships. The ribbon now reckons the 20 top-flight titles and lets the timeline mark the two
   second-tier wins apart. A data-honesty bug surfaced by drawing the data honestly — the recurring pattern.
3. **Relegation is read from the sequence, not guessed from a per-row threshold.** The dot turns red only
   when a top-flight season is *followed* by a second-tier one (a real relegation), so the marker never
   over-claims; the row pills use a softer "bottom of the table" ratio for in-list grading, which asserts
   nothing about going down. The breaks in the line are the war years (no league ran), shaded and labelled
   WWI / WWII rather than left as ambiguous missing data.

`FinishTimeline` stays **bespoke** — it's position-over-seasons across two divisions, not the diverging
date-ordered skyline `ResultSpine` draws, so the object doesn't transfer even though the *render technique*
(stretch SVG + HTML overlay) was reused. The decade ledger below kept its compact list rhythm (it's the
auditable evidence) but now echoes the hero: graded `FinishPill` verdicts and gold/red left borders so the
peaks and troughs scan straight down the scroll. Nothing reached `DESIGN.md`.

**Follow-up: the rows become a fixed-lane scoreboard.** The decade list still read as a list; the rows
deserved the same lift as the hero. Two moves. (a) **Fixed competition lanes** — each decade is a table with
`FA Cup · League Cup · Europe · Other` columns (a competition's `type`, collapsed), present only once that
competition existed, so a column scans straight down ("how far in Europe each year?"). Cup verdicts reuse a
**promoted, shared `CampaignVerdict`** (extracted from the detail page so the same season shows the same
gold/silver in both places), fed by a new `seasonCupLastResults` query that reads each campaign's
deciding-match outcome without loading every match. (b) The league finish is drawn as **the league table
itself** (`FinishLadder`): a per-row track from 1st (left) to last (right), gold top edge, red relegation
zone, a marker pinned at the finish, the placing split into the position (left) and "N teams" (right). The
row resolves into four aligned columns — Season · Finish (the ladder) · Record (`WdlColumns` over the bar) ·
the cup lanes — with a one-time `1st ▸ last` axis legend in the header so the ladder is taught once.

The instructive part was a **dead end**: first attempt drew the league as a *connected path* — a thread
joining each season's finish node down a left rail, the per-row SVG segments meeting at shared midpoints into
one continuous line. It was rejected twice: it read as "a line floating in space with little context"
(the horizontal position encoded finish but nothing showed the axis), and it leaned on fragile cross-row
geometry (full-height absolute overlays, z-layering, neighbour-connectivity math). The ladder is the
opposite instinct and the right one: **make each row carry its own axis** — the track's ends *are* 1st and
last — so the finish reads as a position with built-in context and zero cross-row scaffolding. *Lesson: when
a "shape over time" visual needs an axis the layout can't supply, give each unit its own self-contained scale
rather than threading meaning across units.* `FinishLadder` stays bespoke; the shared promotion was
`CampaignVerdict`. Nothing reached `DESIGN.md`.

### 5. `/analytics` — done
Shipped narrowly, exactly as "subtract before adding" demanded — the Elo hero, the odds
widget, the calibration table, and the trend charts were left alone (they already earn
their place), and the boldness was spent in the one chapter the seasons pass had flagged.

- ✅ **Records chapter → answer-objects (`RecordCards`).** The three `TrailLink`s that only
  re-sorted the match browser (`?sort=margin/defeat/attendance`) became a grid of six real
  records, each leading with the record *figure* and routing to its proof: **biggest win**
  (10–0 v Anderlecht, the scoreline is the record), **heaviest defeat** (0–7 at Blackburn),
  **record crowd** (135,000 at the Bernabéu — gold figure, the attendance *is* the record),
  **most goals in a season** (143 in 1956-57 → the season), and the **longest unbeaten /
  winning runs** (33 and 14 → the run's slice of the browser). This is the seasons-pass
  instruction made literal: a detail/records list should *lead with the computed answer*, not
  link to a sort the reader has to perform. Backed by one new query, `clubRecords()`, which
  computes every peak over **official matches only** (friendlies and wartime excluded, so a
  friendly rout or a wartime goal-glut can't pose as a record) and reuses `longestStreak` for
  the runs. A `CoverageNote` keeps the full rankings one click away, so the `/matches`
  delegation (the auditable ledger) survives — the cards are the answer, the browser the appendix.
- ✅ **`RecordCards` stayed bespoke — the hero figure isn't always a scoreline.** The obvious
  reuse was `NotableMatches`, but it assumes scoreline-as-hero and a match-only link; the crowd
  record's figure is an *attendance*, the season's is a *goal tally*, the runs' is a *count* with
  a season/slice link. Forcing all six through `NotableMatches` would misrepresent four of them, so
  this is the answer-object *family* rendered as a card grid (each card's figure is its record's own
  unit, coloured by meaning — result tones for scorelines, gold for the crowd, red for goals), not a
  promotion. Same call the player page made for `HaulCards`: *generalise the intent (answer → figure →
  evidence), not the component, when the subject's unit of meaning changes.*
- ✅ **Subtracted the duplicated Elo tiles (one element per fact).** The header aside repeated
  Current Elo + Peak Elo, which the Elo section's own current/peak/low strip restates immediately
  below; both tiles dropped, leaving Matches + Scorer-rows as the scope aside. The same move
  `/matches` made on its header — the object that owns the fact keeps it.

The Elo timeline, odds widget, and trend charts were deliberately *not* touched: they're the genuine
charts that earn their bespoke treatment, and the page is large enough that re-skinning a working
chart would be motion without value. Nothing reached `DESIGN.md`; the one new object (`RecordCards`)
is bespoke and the subtraction was an existing principle applied, not a new one. *Lesson carried
forward: a "records" surface is answer-object territory, not chart territory — the record is a figure
with a fixture behind it, so it wants the `IdentityPlate`/`NotableMatches` vocabulary, and when the
figure's unit varies across records, a bespoke card that lets each show its true unit beats a shared
card that flattens them all to a scoreline.*

**Follow-up: the records pass didn't go far enough — the whole page got restructured.** The records
chapter was a local upgrade inside a page that was still the "competent ledger" the refresh exists to
kill: a flat `space-y-12` stack of ~10 equal-weight sections under thin `<Band>` labels, no hero, no
spine, a junk-drawer bottom third (grounds → records → coverage → assists). A full critique against
visual quality / pacing / simplicity / novelty drove a restructure into **three acts plus a trails
appendix**, the page's real narrative made explicit:

- ✅ **Act I — the signal: a floodlit `EloHero`.** The Elo chart led flat, in the same thin panel as
  everything else. It now opens as a plate sharing the `IdentityPlate` atmosphere (the `hero-grid`
  pitch-line texture, a single red floodlight wash, the deep shadow), with the current rating promoted
  to a `text-5xl/6xl` headline and peak/low as a hairline ribbon beside it, over a full-width,
  taller (300px) era-shaded timeline. This is the analytics answer to the seasons `FinishTimeline`
  opening — the strength signal as the thing you see before you read. The plate *atmosphere* is now a
  reusable motif (third surface after the manager/opponent/season plates), even though `EloHero` itself
  stays bespoke.
- ✅ **Act II — projection: `ReliabilityCurve` replaces the calibration table.** The driest object on
  the page (a 6-row W/D/L-by-expectancy `DataTable`) became a bespoke calibration plot: each expectancy
  decile a point at (expected, observed) against a dashed **perfect-forecast diagonal**, the red
  points-share dots hugging the line (the ratings land where they aim — the data tracks y=x almost
  exactly), the green win-rate dots bowing below, and the tinted band between them *is* the draws,
  fattest in the evenly-matched middle. This is principle 3 ("encode the baseline into the geometry")
  made literal, and it does what the table couldn't: makes "the ratings are calibrated" *visible*, which
  earns the odds widget's trust. The proof (curve) and the application (odds widget) now sit side by
  side as one movement; the sim is the third beat. Static SVG, no inspection layer — the diagonal and
  the bow carry the reading.
- ✅ **Subtracted hard.** The grounds grid (encyclopedic stadium list, the flattest object on the page)
  was cut outright along with its `stadiumsWithRecords` query; the two near-identical `/data` `TrailLink`s
  merged into one; the calibration table deleted. The marooned assist list was *resolved by upgrade*,
  not cut (it's the canonical home of the global supply-duo cut, which lives nowhere else): a ranked
  ladder with bars scaled to the top pairing, moved under Act III as "Supply lines". The limp "want a
  specific cut?" closing line became a real "Where next" trio of trails (data / browser / questions).
- ✅ **Pacing via acts, not bands.** A new `Act` header (a ghosted devil numeral + kicker + title + a
  one-line dek) replaces the thin `<Band>` rule for the three movements; within an act the modules sit
  tight (`space-y-6/8`), between acts they breathe (`space-y-14`), and the appendix closes under a quiet
  divider. The eye now registers importance changes the uniform metronome hid.

Two new components (`EloHero`, `ReliabilityCurve`), both **bespoke**; nothing reached `DESIGN.md`
(the curve is a fresh *instance* of an existing principle, and the act structure is a pacing device,
not a composition rule). *Lesson for the working method: an "upgrade one chapter" pass can leave the
page's real problem — no spine, flat pacing — untouched. When a surface reads as a flat equal-weight
stack, the fix is structural (find the narrative, give it acts, subtract the tangents) before it is
per-module; a hero, a novel proof-object, and aggressive subtraction did more for the page than six
good cards did.*

### 6. `/` (home) — done
Shipped exactly as the sharpened brief demanded: the homepage *quotes* the now-settled
answer-object vocabulary rather than re-skinning, and the boldness went into the lead and the
subtraction, not a new object. Nothing new was built and nothing reached `DESIGN.md` — every
component here (`RecordCards`, `MinuteRidge`, `SectionHead`, `MatchList`, `WdlBar`,
`EloRatingChart`) already existed; the pass was composition only, which is what a launchpad that
"quotes the best of it" should be.

- ✅ **Killed the hero-metric block — the doc's one hard rule for this surface.** The hero's
  4-tile grid (Matches / Wins / Goals / Win rate) was the generic metric block `DESIGN.md`'s
  Homepage Direction explicitly forbids ("the first interaction should be a trail"). It's gone; the
  hero is now a clean *invitation* — identity headline, one scope sentence, and the `SearchCommand`
  as the first interaction, on the floodlit `hero-grid` plate.
- ✅ **Led with a records trail above the fold.** The first thing under search is a `SectionHead`
  + three `RecordCards` (biggest win `10–0`, record crowd `135,000` gold, longest unbeaten run) —
  clickable figure-with-a-fixture answer-objects, three distinct units so the teaser shows the
  family's range, each routing straight to its match or slice. "All records →" links to the
  analytics Act III they're quoted from. This is the doc's literal instruction made real: a trail,
  not a metric grid, as the first payoff.
- ✅ **"Test a myth" now *demonstrates* the questions surface.** The five text-only prompt cards
  became a featured late-goals panel that leads with the one finding number (`9.0%` after the 85th)
  and renders the actual `MinuteRidge` from `/questions#late-goals`, with the other four myths as
  compact prompts beside it. The homepage now *shows* a question visual instead of only linking to
  one — the "pull one live question module above the fold" candidate, picked because late goals is
  the signature myth and the ridge is the most legible quote.
- ✅ **Kept recent-evidence + scope, subtracted the tangent.** Latest results, the all-time record
  by competition, the Elo arc, and the scorers/routes grids stayed (the doc wants recent evidence
  and scope prominent). The "Fullest match sheets" grid was **cut** — a third card-grid of match
  links between records (peaks) and latest (recency) was repetition, not a distinct intent — and its
  homepage-only `fullestMatchSheets` query deleted with it so `knip` stays green. `/data` moved into
  the routes grid so the coverage trail survives. Same "subtract a whole module" move the analytics
  pass made on the grounds grid.

*Lesson for the working method: a launchpad's refresh is mostly a **casting** problem, not a
building one — once the per-surface answer-objects exist, the homepage's job is to pick the two or
three that best advertise the archive (a punchy record, a live question visual) and lead with them,
deleting whatever metric block or redundant grid was holding the slot. The boldness is in what you
put first and what you cut, not in a new component.*

**Follow-up: that wasn't far enough — the homepage needed its own bespoke hero after all.** The
"casting only" pass left the page a flat equal-weight stack with the *least* atmospheric lead on the
site: the front door — the one surface that most wants an unforgettable object — was leading with a
search box where seasons leads with `FinishTimeline` and analytics with `EloHero`. A critique against
visual quality / pacing / simplicity / novelty drove a second pass:

- ✅ **`HistorySkyline` — the signature hero the page was missing.** A new bespoke object: every
  season since 1886-87 as one bar, height = matches played, stacked won (green foundation) → drawn →
  lost (red roofline), the wall *breathing* from short Victorian seasons to the modern European-night
  swell. Its total inked area is, literally, every match United have played — the headline's promise
  made visible. The honest 20 top-flight titles are gold-capped (new `championSeasons()` query
  excludes the two Second Division titles, the same call `FinishTimeline` made), and every bar links
  to its season. It wraps in the `IdentityPlate`/`EloHero` floodlit plate (its fourth surface) with
  the headline and search sitting *over* it, so the front door finally carries the atmosphere the
  rest of the site has. Pure CSS/flex — distinct from `FinishTimeline` (finish position) and
  `EloHero` (rating line); this is the one object that shows the *whole record at once*.
- ✅ **Paced into three movements, not a flat metronome.** Start a trail (records + the live
  question, clustered tight) → the living record (latest + all-time record, coverage one click away)
  → explore (scorers + routes, under a quiet divider). Bigger gaps between movements, tighter within.
- ✅ **Cut the redundant Elo chart.** With the skyline as the homepage's historical signature, the
  full-width "Strength over N years" Elo timeline was a *second* big history chart competing for the
  same role — the junk-drawer the analytics pass diagnosed. Subtracted (it lives as the `EloHero` on
  analytics); strength-curiosity routes there via "All records →" and the restored Analytics route.

`HistorySkyline` stays **bespoke**; nothing reached `DESIGN.md` (the plate atmosphere was already a
noted motif, and the movement pacing is the analytics device reapplied, not a new rule). *Lesson,
corrected: the "casting not building" instinct was wrong for the **home page specifically** — the
launchpad is the one surface where the bold bespoke object is non-negotiable, because it's the first
thing anyone sees and it has to do what no quoted component can: depict the whole archive at once.
Quote the answer-objects in the body, yes, but author the hero.* Tooling note: Playwright +
`scripts/shot.mjs` were added this pass — the skyline's flex/sub-pixel bugs built and typechecked
clean and were only visible in a screenshot.

**Follow-up: a polish pass on the body objects (record bars, scorers, the late-goals ridge).** Three
fixes after living with the page, each a small but instructive lesson:

- ✅ **All-time record → weighted bars, not proportional-length.** The first attempt reused the
  manager-page `ProportionalWdlBar` (bar *length* = games played). It failed: competition volumes span
  two orders of magnitude here (League ~4,900 vs the cups in the hundreds), so League pinned the scale
  and flattened every other row to a sliver. The fix puts volume on a *different channel* — each row is
  now a full-proportion diverging `WdlBar` (so the win/draw/loss shape stays readable and comparable)
  whose **thickness** encodes matches played on a sqrt scale (`max(6, round(28·√(p/pMax)))`): League is a
  chunky slab, the cups thin ribbons, with `WdlColumns` carrying the exact figures above. The shields,
  super cups, world finals and old test matches were dropped — only the four major competitions earn a
  homepage slot. `WdlBar` gained an optional `heightPx` so its diverging render (fulcrum + reveal) could
  be reused at a continuous data-driven thickness instead of the four fixed size buckets — the only
  shared-layer change. *Lesson for the principles: when a second variable spans orders of magnitude,
  encode it as thickness/weight, not length; reserve proportional length for variables of comparable
  scale (which is exactly why it works for the manager splits and not here).*
- ✅ **"Top goalscorers" (renamed from "Most goals") with portraits.** Each card now leads with the
  player's `PlayerPortrait` thumbnail beside the goals figure — the people-are-anchors principle (#5),
  the same `player_thumb_url ?? player_image_url` source the `/players` index uses, initials fallback for
  the imageless (e.g. "OG" for Own Goal).
- ✅ **`MinuteRidge` migrated to the hybrid render — its fourth surface.** The late-goals ridge looked
  rough at the homepage's narrow width because it drew *everything*, text included, inside an SVG whose
  `viewBox` width (1000) scaled down to a ~560px container — so every `fontSize="9/10"` label rendered at
  ~5px ("barely visible") and the right-anchored FERGIE TIME / count / even-spread cluster collided in
  the thin closing strip. Rebuilt on the `HistorySkyline`/`FinishTimeline` pattern: the SVG draws *shape
  only* (ridge, wash, dividers, hover targets), stretching to fill a fixed-height box
  (`preserveAspectRatio="none"` + `vectorEffect="non-scaling-stroke"` so the outline stays a crisp 1.5px
  at any width), while **every label is real HTML positioned by percentage** — legible at true rem sizes
  whatever the container. The collisions resolved in the process: FERGIE TIME + count stack cleanly
  top-right, "even spread" moved to the left edge away from the busy late zone, the minute axis became
  its own HTML row, and the faint `ink-faint` text went to `ink-dim`. Same API; verified across all three
  call sites (homepage, `/questions`, `/player/[id]`). *Lesson, now a clear rule: an SVG chart with a
  wide `viewBox` shrinks its own text into illegibility at narrow widths — draw the shape in SVG and the
  labels in HTML. This is the fourth chart to land on the pattern, so it's the default for any labelled
  chart now, not a per-surface trick.*

Nothing reached `DESIGN.md` (the `heightPx` prop and the hybrid render are extensions of existing
shared components/patterns, not new composition rules).

### 7. Index pages `/players`, `/managers`, `/opponents` ✅ done
Shipped exactly on the "stay compact" brief, with the boldness spent in one place — the
segmentation that's *true to each subject*, rather than forcing all three into one mould.

- ✅ **One shared row, two surfaces — `IndexRow`.** The three pages carried three different
  row markups; managers and opponents are structurally identical (leading identity → name +
  quiet sub-line → diverging `WdlBar` → played/win-rate readout), so they now share one row.
  This *is* the "tighten row rhythm / confirm `WdlBar` consistency" deliverable, delivered by
  construction rather than by re-checking two hand-written lists. An optional `rank` reinforces
  a ranked list and is omitted by a chronological one.
- ✅ **Managers → bespoke era bands (the bold move).** A manager list is a *succession*, so the
  flat chronological `<ul>` (no search, no aside, no footer — the least-developed of the three)
  became era-grouped: **The secretary-managers → The Busby era → Between Busby and Ferguson →
  The Ferguson era → After Ferguson**. The honesty hinge: the eras are **data-anchored, not
  editorial** — bounded by the only two tenures past a thousand matches (Busby 1,141, Ferguson
  1,497), with each man placed by the year of his first match (`lib/managerEras.ts`). Each band
  header carries the era's span, manager count, and **aggregate** `WdlColumns`+bar, so the
  Busby/Ferguson eras read green and the wilderness between them reads red — *density carrying
  the finding* (the eras' relative success) without a word of prose. A `CoverageNote` states how
  the eras are drawn. Search was **deliberately not added** to managers (28 rows don't need it —
  an honest "subtract") even though the other two have it; consistency is the *row*, not the chrome.
- ✅ **Opponents → stay ranked, made explicit.** Ranked-by-meetings already floats the great
  rivalries to the top (the answer-object), so grouping would have buried it. Instead the ranking
  was made *legible*: an explicit rank index (1 = Arsenal, 2 = Liverpool …, dropped when a search
  filters the list), the shared row, and a `CoverageNote` footer. Position-as-category (#4) stated
  in the layout.
- ✅ **Players → left alone, on purpose.** Already the most-refreshed of the three (sortable
  `DataTable` + portraits + search + trust block). A player has no personal W/D/L, so the shared
  `IndexRow`/`WdlBar` rhythm doesn't apply, and the table is a genuine *tool* that earns its place
  on a scan-and-drill surface. Re-skinning it would be motion without value — the working method's
  own warning. The cluster touching players least is the honest outcome, not an omission.

Two shared objects, one bespoke model, nothing promoted to `DESIGN.md`: `IndexRow` is a shared row
(consistency plumbing, not a composition rule) and the era bands are a bespoke reading-aid. *Lesson
for the principles, reinforcing the seasons/player passes: "make the three consistent" does **not**
mean "make the three the same" — the durable consistency is the shared **row**, while the **grouping**
is whatever the subject's structure honestly is (a succession for managers, a ranking for opponents,
a sortable tool for players). And era labels can stay honest if their **boundaries** are data-derived
(the two 1,000-match tenures) even when the names read as history.*

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
