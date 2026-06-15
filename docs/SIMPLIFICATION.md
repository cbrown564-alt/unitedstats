# Bold Simplification — Working Document

Status: **resolved 2026-06-15.** Written 2026-06-14 to raise the thorny
questions; the grilling session on 2026-06-15 decided them. The thorny-question
analysis below is preserved as the reasoning record — the decisions and the
execution checklist are in **"Decisions (resolved 2026-06-15)"** at the foot of
this doc, and the architectural core is in `docs/adr/0002-bold-simplification-
spine-question-front-door.md`. The canonical language is in `CONTEXT.md`.

## Why this exists

Phase 8 shipped a *consistency* pass: hand-rolled variants folded into shared
components, one contrast fix. Useful, but it was tightening, not simplifying. It
did not remove a single surface, collapse a single page, or kill a single
module. We mapped the breadth (`docs/INVENTORY.md`) and then left the breadth
intact.

The roadmap's own words for this phase were "prune and consolidate rather than
add" and "earn the right to expand." We have not yet earned it. Six build-out
phases accreted surface area fast, and the honest read is that the product now
has more *places* than it has *ideas*. The north star is one idea —
**question-led pattern discovery over a trustworthy fixture spine** — and that
idea is currently spread thin across 16 routes, many of which restate each
other.

This document is the brief for doing the real thing.

## The core tension

Every hard question below is a local instance of one global tension:

> **Breadth of record vs. clarity of product.**

UnitedStats wants to be exhaustive (every match, every facet, every source) *and*
focused (start a question, follow a trail). Exhaustiveness pushes toward more
surfaces, more modules, more coverage notes, more lanes. Focus pushes toward
fewer, louder, better-sequenced moments. We have been resolving this tension in
favour of breadth by default, surface by surface, without ever deciding it.

The follow-up session should decide it on purpose. The rest of this doc is
ammunition.

## Thorny question 1 — Do we need 16 routes?

Current top-level surfaces: `/`, `/matches`, `/seasons`, `/players`,
`/managers`, `/opponents`, `/questions`, `/analytics`, `/analytics/odds`,
`/analytics/travel`, `/data`, plus six detail templates and the API.

Candidate consolidations, each with a real cost:

- **`/analytics/odds` and `/analytics/travel` as standalone routes.** Both are
  single-idea pages. Do they earn a URL each, or are they two modules that
  belong *inside* `/analytics` (or `/questions`)? Cost of merging: deep links
  and the "predictive layer" framing get weaker; a long analytics page gets
  longer. Cost of keeping: two more places to maintain, navigate, and explain.
- **`/analytics` vs `/questions`.** Both are "interpretation" surfaces. Analytics
  is chart-led and exhaustive; questions is myth-led and curated. Is that two
  products or one? A bold move: fold all of analytics into the question frame —
  every chart becomes the evidence for a stated question — and delete the
  distinction. Thorny because analytics-as-reference (just show me the Elo
  chart) is a legitimate, different job from analytics-as-argument.
- **`/managers` and `/opponents` as flat indexes.** These are thin list pages.
  Could they be views of the match browser (`/matches` grouped by manager /
  opponent) rather than separate routes? Cost: detail pages still need a home,
  and people expect a "managers" page to exist.

The forcing question: **if we could only keep eight routes, which eight?**

## Thorny question 2 — The analytics mega-scroll

`/analytics` is one page with ~14 stacked modules: Elo timeline, win rate by
season, average attendance, goals per season, win rate by decade, goal minutes,
home/away/neutral, grounds, biggest wins, heaviest defeats, biggest crowds,
coverage ledger, lineup coverage, assist partnerships — plus three trail cards
at the top. DESIGN.md explicitly warns against "overloaded dashboards where
every chart competes equally," and this is one.

Thorny questions:

- Which of these 14 is anyone actually here for? If the honest answer is "Elo,
  records, and coverage," the other eleven are scenery.
- Is "win rate by season," "win rate by decade," and "goals per season" three
  charts or one chart with a granularity toggle?
- Records (biggest wins / heaviest defeats / biggest crowds) are `MatchList`s
  ranked differently. Are they analytics at all, or are they *sorts of the match
  browser* that we have copied onto a second page? (`/matches` already sorts by
  "Biggest win" and "Best attended.")

A bold version of `/analytics`: one hero (Elo), one records strip that links
into match-browser sorts instead of restating them, one coverage module, done.
Everything else becomes a question or a match-browser view.

## Thorny question 3 — The duplication map

Things that exist in more than one place, and the question each raises:

- **Elo timeline** — on `/` *and* `/analytics`. Which is the canonical home?
  Should the homepage tease it and analytics own it, or vice versa?
- **Coverage / data-depth ledger** — on `/analytics` *and* `/data`. Two
  renderings of the same coverage truth. One should be the source; the other a
  link.
- **Records** — all-time record on `/`, by-competition on `/`, biggest/heaviest
  on `/analytics`, and again as sorts on `/matches`. How many times does the
  reader need to be shown the record before it is just noise?
- **Search** — `SearchCommand` on the homepage hero, `HeaderSearch` in the
  global header, `/api/search` underneath. The header search makes the homepage
  search arguably redundant. Does the hero still need its own input?
- **Scorers / top players** — teaser on `/`, full on `/players`, partnerships on
  `/analytics`, splits on `/player/[id]`. Probably fine, but worth confirming
  the homepage teaser earns its space against the myth prompts.

None of these are bugs. Each was a reasonable local decision. The question is
whether, taken together, they make the product feel like it is repeating itself.

## Thorny question 4 — The match detail page

`/match/[id]` stacks up to nine sections: United goals, opposition goals, cards,
starting XI, used subs, bench, source trail, "going into the match" (Elo + H2H),
form before, and two trail modules. The visual audit already flagged grouping
these. The bold question is not "should we add tabs" but:

- What is the **one** thing a reader wants from a match page? The scoreline and
  who scored. Everything else is depth-on-demand.
- Should teamsheet (XI / subs / bench), provenance (sources), and context
  (Elo / H2H / form / trails) each collapse to a single disclosure by default,
  so the page opens as scoreline + goals and expands only when asked?

This is the cleanest single page to demonstrate "primary answer first, depth
underneath" — a template the whole product could inherit.

## Thorny question 5 — Coverage notes: signal becoming noise

Trust-at-decision-points is a core principle, and it is genuinely well executed.
But coverage notes now appear under nearly every module on every page. The risk
DESIGN.md itself names: "Coverage should stay visible at interpretation points
rather than becoming constant noise."

Thorny question: have we crossed from *trust signal* into *boilerplate*? When
every chart has a slice line and a coverage line and an evidence link, the
reader stops reading them — which defeats the purpose at the few points where
coverage genuinely changes interpretation (partial scorer data, pre-2012
assists, sparse early attendance). Should coverage be **graded** — loud where
data is partial, silent where it is complete — instead of uniformly present?

## Thorny question 6 — Index pages as flat walls

`/managers`, `/opponents`, `/players` are long flat lists. The visual audit
suggests segmented grouping (era, alphabet, country, bogey-side). But "add
grouping" is an *addition*. The simplification framing is sharper: a flat list
with search may be the right minimum, and grouping is Phase 9 discovery work —
so the bold call here might be to **leave them deliberately minimal** and resist
the urge to decorate them, rather than to build segmentation now.

## Thorny question 7 — Dead and barely-earning code

- `Sparkline` is unused. Keep-as-no-JS-primitive is a real argument, but an
  unused export that "might be useful" is exactly the clutter this phase is
  meant to question. Decide: use it somewhere concrete, or delete it.
- The static `AreaChart` / `Bars` primitives survive as fallbacks/scaffolding.
  Now that the inspectable layer is broad, is the static layer still pulling its
  weight, or is it a second chart system we maintain in parallel?

## Three possible shapes (a forcing function)

To make the tradeoffs concrete, here are three deliberately different end-states.
We do not have to pick one wholesale, but reacting to them will surface our real
preferences.

1. **The Question Engine.** Everything is a question. The homepage is search +
   prompts. `/analytics` dissolves into `/questions`; charts only exist as the
   evidence for a stated question. Records and the match browser remain as the
   evidence layer. Fewest top-level ideas; biggest rewrite; risks losing the
   "just show me the reference chart" use.

2. **The Ledger.** Lean into exhaustiveness but sequence it ruthlessly. Keep the
   surfaces, but each page leads with one primary answer and pushes everything
   else into disclosure. Smallest conceptual change; relies entirely on
   hierarchy discipline; risk is that nothing actually gets removed and we are
   back here in three phases.

3. **The Spine.** The match browser *is* the product. Seasons, managers,
   opponents, records, and most of analytics become saved views / sorts of one
   filterable record. `/questions` is the curated front door into it. Radical
   consolidation of routes; risk is that genuinely different jobs (a player
   profile, an Elo timeline) get forced into a fixture-list frame that does not
   fit them.

## What we have to decide before we cut

Cutting without these is just churn:

- **The one-sentence job of each surface**, and a willingness to delete any
  surface that cannot state one that no other surface already states.
- **A kill criterion.** E.g. "a module stays only if it is the canonical home of
  its data and at least one trail links into it." Anything that is a second
  rendering of data owned elsewhere becomes a link.
- **A coverage-note policy** — graded, not uniform.
- **A primary-answer rule per page template** that we will actually enforce.

## Proposed method for the follow-up session

1. Write the one-sentence job for all 16 routes. Mark every duplication against
   the map in question 3. (~30 min, decides most of the cuts by itself.)
2. Pick a shape (or an explicit hybrid) from the three above so the cuts pull in
   one direction.
3. Make the boldest *reversible* cut first — collapsing `/match/[id]` into
   primary-answer + disclosure is the highest-signal, lowest-risk demonstration.
4. Then the irreversible-feeling ones: merge `/analytics/odds` and
   `/analytics/travel` into their parent, dissolve duplicated records/coverage,
   delete dead code.
5. Re-run the inventory and check that the route count, module count, and
   per-page primary-answer clarity all went *down and up* respectively.

The test of success is not "it looks tidier." It is: **could a new reader say
what UnitedStats is for after ten seconds on any page?** Right now, on
`/analytics`, the answer is "lots of charts." That is the thing to fix.

## Decisions (resolved 2026-06-15)

### The shape

**Spine + Question front door.** `/matches` is The Record (canonical home of
match data); `/questions` is the curated Front Door for interpretation;
`/analytics` slims to the Elo/strength + trends surface; genuinely distinct jobs
(player/season/match detail, the entity rosters) stay as Surfaces. Not the
Ledger (it removes nothing), not the pure Question Engine (it loses the
reference-chart job), not the pure Spine (it forces profiles into a fixture
frame). Full rationale + rejected alternatives in ADR 0002.

### The two rules that do the cutting

- **Kill criterion (two tests).** (1) A *Second Rendering* of data owned
  elsewhere always becomes a link. (2) A standalone route is justified only by a
  distinct one-sentence job *and* a real navigation target.
- **Primary-Answer rule.** Each page leads with one Primary Answer, open;
  everything else collapses into a small fixed set of *labelled* disclosures.
  `/match/[id]` is the reference template (scoreline + scorers open; Teamsheet,
  Context, Provenance collapsed — labels must advertise their contents).
- **Coverage-note policy — graded.** A coverage line renders only where its
  facet is less than complete for the range shown, with real counts; silent
  where complete. Computed from coverage, not authored per module, so absence
  reliably means "whole data." A terse Slice line stays only where the cut is
  non-obvious.

### One-sentence job per surviving surface

| Surface | Job |
| --- | --- |
| `/` | Start a question — search + myth-prompt *teasers* + recent evidence; routes into The Record, owns nothing. |
| `/matches` | The Record — every match, filterable and sortable; the home all aggregates link back to. |
| `/seasons` (+`/[season]`) | A season's canonical record — minimal roster → per-season record, brief, table. |
| `/players` (+`/[id]`) | A player's canonical record — minimal roster → profile, Primary Answer + disclosed splits. |
| `/managers` (+`/[id]`) | A manager's canonical tenure record — minimal roster → tenure splits. |
| `/opponents` (+`/[id]`) | An opponent's canonical head-to-head — minimal roster → H2H detail. |
| `/questions` | The Front Door — curated myth-tests (incl. away-days/travel), each with finding, slice, coverage, evidence. |
| `/analytics` | The strength surface — Elo retrospective (timeline) + prospective (odds) + trends; records & coverage are links out. |
| `/match/[id]` | A match's canonical answer — scoreline + scorers open; Teamsheet / Context / Provenance disclosed. |
| `/data` | The coverage & correction canonical home — how complete the record is, and how to fix it. |
| `/api/v1/*` | Machine-readable Record. |

Routes go from ~16 to ~14 (odds + travel removed). The `DESIGN.md` nav law
stays, so route count floors there; the real win is module/duplication
reduction, which is the success metric — not route count.

### Module dispositions

- **`/analytics`** (14 modules → ~5): Elo timeline (stays, Canonical Home) ·
  win-rate-by-season / attendance / goals-per-season (stay, trends band) ·
  win-rate-by-decade (cut — already a View via the decade rail) · goal-minutes
  (migrate into `/questions#late-goals`) · home/away/neutral (fold into the
  browser as a venue View) · grounds (stays, minor) · biggest wins / heaviest
  defeats / biggest crowds (links into `/matches` sorts) · data-depth ledger +
  lineup coverage (links to `/data`) · assist partnerships (stays, Canonical
  Home) · the three trail cards (cut).
- **`/analytics/odds`** → folds into `/analytics` as Elo's prospective half;
  route deleted.
- **`/analytics/travel`** → folds into `/questions` as an away-days question
  with the map as evidence; route deleted.
- **`/managers`, `/opponents`** → kept as minimal Surfaces; segmentation
  *deliberately declined* (Phase 9 discovery, an addition).
- **Homepage hero search** → kept (the homepage's Primary Answer); already
  shares `SearchCommand` with the header, so no component duplication exists.
  Homepage myth prompts must *link* to `/questions`, not restate it.
- **Dead code** → delete `Sparkline` and `Bars` (no callers); keep `AreaChart`
  (live no-JS fallback).

### Execution checklist (boldest reversible first)

1. Collapse `/match/[id]` to the Primary-Answer template (2 open, 3
   disclosures). Establishes the template the other detail pages inherit.
2. Add the `/matches` "heaviest defeat" sort.
3. Slim `/analytics` per the dispositions above.
4. Fold travel into `/questions`; delete `/analytics/odds` + `/analytics/travel`
   routes; add redirects from the old URLs.
5. Make `CoverageNote` computed + graded; strip complete-data notes.
6. Delete `Sparkline` + `Bars`; reword the player-page note that names "Bars";
   add a lint rule failing on unused exports so the inventory cannot drift again.
7. Re-run the inventory; confirm module count and per-page Ten-Second clarity
   improved (route count, module count down; primary-answer clarity up).
