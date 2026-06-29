# Restraint pass — findings & implementation plan

> **This document is transient.** It supersedes `SCOPE-AUDIT.md`. When the
> implementation plan below is executed, this file is deleted along with the
> documentation it prescribes cutting (Phase 1). It exists to drive one pass,
> not to be maintained.

_Dated 2026-06-28. A second, deeper critique after the first audit was judged
"a decent first pass that didn't go far enough." Calibrated with the author's
feedback: two of the original five exhibits were rejected and are recorded here
as **non-goals** so they aren't re-litigated._

_Reconciled 2026-06-29 against `docs/audience-evidence-base.md`. The evidence
**validates the restraint thesis** in a real user's words (a sampled reviewer:
the site "feels a bit too colorful and busy… I find it more enjoyable when
there's just enough information") and adjusts two things: (1) the
nostalgia/rediscovery surfaces are pulled **out** of the cull — they serve the
audience's emotional core and the orphaned-incumbent opening; (2) the on-site
**copy rewrite** is added as this pass's headline launch fix, since it is the
same AI voice as the docs. Changes are marked inline._

## The one finding

The first audit trimmed leaves — the orphaned, zero-traffic surfaces (`/logo-lab`,
the odds forecast, the speculative embed). Real, but safe. The deeper pattern is
in the trunk:

> **At nearly every fork, the build chose what was clever to make over what the
> user came to get.**

Invisible in any single place — each piece is well-crafted and defensible in
isolation, which is exactly why a surface-by-surface audit can't catch it. Only
visible in aggregate. Three live findings below; two rejected.

---

## Live findings

### A. The answer-first front door answers the wrong questions

The whole product repositioned around *"the answer is the front door."* The front
door is nine curated questions (`lib/questions.ts`). Two are novelty gags — "Is
'Own Goal' a top scorer?", "How far do away days take United?" — on the door
because they're charming, not because anyone asks them. The real failure is the
absence: **none of the questions a United fan actually argues about exist.**

Missing, in rough order of how much a fan wants them and how well the data
supports them:

- **The post-Ferguson decline** — the defining United conversation of the last
  decade. Richly supported by the record. Absent.
- **The rivalry ledgers** — Liverpool, City, Leeds, Arsenal *as named
  confrontations*, front and centre. Currently demoted to a generic "bogey sides,
  met 20+ times" cut. A fan wants "the Liverpool ledger," not "sides we beat least
  often."
- **The Treble (1998-99)** — anatomy of the season.
- **Ferguson vs the field** — was he really that far ahead? (the manager-comparison
  engine exists; it's aimed at "new-manager bounce" instead.)
- **Best & worst seasons, ranked.** **United in Europe across the eras.**
- **The greatest XI / greatest player** — editorial, but answerable from the
  record without punditry. The "no hot takes" stance is currently an excuse to
  answer the easy, cute questions instead of the central ones.

This is the highest-leverage move in the plan and the least destructive: the
question *format* (finding · slice · coverage · matches-behind · `AnswerThread`
spine) is excellent and stays. Only the *selection* is wrong.

### B. Too many ways to slice a thin core

The record can be sliced via `/questions`, `/compare`, `/cut` (+ a generic fork
engine), `/explore`, `/collection`, `/embed`, `/surprise`, `/on-this-day`,
`/history-changed`. An entire group-by-anything Cut engine — "the plan's largest
architectural bet" — and `/explore` was built, deleted, and rebuilt three times.

All of it sits on a payload of **nine questions, two of them gags.** The machinery
dwarfs the thing it's slicing. You do not need a fork engine, a collections
format, and an embed channel to present a catalogue of nine. Build the questions
that matter (Finding A) and most of this apparatus has nothing left to justify it.

**Protected:** `/explore` **v3 stays** — it has real design taste and is the right
single jumping-off point. `/matches` (the filter builder) and the entity pages
are untouchable. The cull targets the *redundant* slice-surfaces, not the strong
ones.

### C. The documentation is the root cause — and Phase 1

~30 docs, **6,209 lines.** `ROADMAP.md` alone is 1,183 lines; `DESIGN-REFRESH.md`
1,144. Every deletion gets a three-paragraph eulogy; every phase "is complete as
a capability"; the prose runs on a fixed liturgy (*the spine, the front door, the
red thread, earn the right to abstract*).

This is the engine of the restraint problem, not a symptom of it. A product that
needs 6,200 lines to explain its discipline has substituted *narrating* taste for
*exercising* it — and a roadmap that lovingly documents every feature it adds is a
machine for adding features. The first audit failed to go far enough precisely
because it was written from inside this voice. **Cutting the docs first is what
makes the rest of the pass honest.**

**And the same voice is on the site itself — this is the launch fix.** The
audience's single most-repeated criticism of Red Thread is that its
AI-generated copy *"makes it feel like I'm browsing a prototype"* (RedCafe);
the analytics subs are harsher (*"AI slop"*) — `audience-evidence-base.md`
§6/§8.1, which ranks rewriting it in a human voice as the **#1 pre-launch fix.**
The 6,200 lines of liturgy and the templated connective copy on the page are
the same disease. So this pass has a front-end half: cutting the docs is the
warm-up, **rewriting the on-site copy in a plain human voice is the headline
credibility move.** (Search hardening — accents/nicknames, the "Forlán"
trust-break, §8.2 — is the other top launch fix, but it is a quality track
parallel to this pass, noted here so it isn't lost.)

---

## Non-goals (rejected on review — do not touch)

- **The chart vocabulary is a feature, not bloat.** The distinctive forms
  (`LeadHeldDotplot`, `GoalBodyMap`, `OpponentRivalryMap`, `PlayerGreatnessMap`,
  `SpendTide` …) are memorable, are aimed at exactly the stats-obsessed fan this
  product serves, and in the body map's case encode hand-captured information that
  exists nowhere else. Uniqueness is the point. The *only* permitted move is
  light: where two charts are near-duplicate variants, let them share a canonical
  base — but keep the bespoke ones bespoke. This is a low-priority cleanup, not a
  cull.
- **The brand stays, and earns more.** Red Thread is a good name for a Reddit
  launch, the mark is good, and the thread motif should be used *more*, not less —
  it does real wayfinding and comprehension work. The only brand cut is dead
  theater already flagged (`/logo-lab`). Brand is an investment target, not a
  restraint target.

---

## Principles for the build (added 2026-06-29, after reviewing Phase 2's output)

Phase 2 shipped the prescribed questions but exposed how a faithful-but-thoughtless
build still misses. Four rules govern the rest of the pass. The first two are
durable and should graduate to `PRODUCT.md` when this file self-deletes.

1. **"Best" means what a United fan means.** Rank by trophies and canonical
   achievement, not by whatever number the query makes easy. United's best season
   is the Treble, not the 1905-06 promotion campaign with the highest points per
   game. United have won **20** league titles — the number every fan knows — not
   the 22 the data technically holds (the two Second Division titles are a
   discoverable side-fact, never a headline). A metric is only honest if it lands
   on the answer a fan would defend.

2. **Compare like with like, on the right axis.** A comparison that ranks Cantona
   above Bruce on goals has measured the wrong thing. Defenders earn their place on
   clean sheets and goals conceded; forwards on goals and assists. Steer readers
   toward comparable subjects (two defenders, two forwards) and show each on the
   metric that fits its role — not one leaderboard that always crowns the striker.

3. **Push back when the literal task undermines the goal.** This pass exists to cut
   sprawl and dignify the record. If executing a step faithfully produces an
   uninspired, duplicative, or misleading surface, stop and say so — a card that
   merely "does what was prescribed" but reads as filler is a failure, not a
   completion. Two cards for one answer (a "best seasons" ranking beside a Treble
   card) is exactly the sprawl this pass removes.

4. **Reuse before hand-rolling.** The finals bug came from re-writing a predicate
   that already existed, correctly, in three other files. Find the canonical helper
   first.

---

## Implementation plan

Ordered. Phase 1 first, because it changes how the next two get done.

### Phase 1 — Documentation cull (do this first)

> **Status — documentation cull executed (2026-06-29).** `docs/` is now the
> keep-list (20 → 11 `.md` files; ~2,750 lines cut). **Cut outright** (pure
> narration of finished work): `DESIGN-REFRESH.md`, `SIMPLIFICATION.md`,
> `ROADMAP.md` (its "what exists / what's next" already lives in `PRODUCT.md`),
> `VISUAL-AUDIT.md`, `INVENTORY.md`, `SEARCH-PLAN.md`. The three **fold-then-delete**
> docs were deleted too — their durable substance had *already been folded* into
> the keep-docs in earlier sessions: `COPY-VOICE.md`'s register map + universal
> rules live in `DESIGN.md` (Copy Voice; the open em-dash question is resolved
> there); `ASSISTS-PLAN.md` and `TABLEAU-GOALS-ASSISTS.md`'s "why coverage is shaped
> this way" reasoning lives in `SOURCE-AUDIT.md` (Assists / Tableau) and
> `DATA-MODEL.md`. Three CI workflow comments were repointed off the deleted
> `ASSISTS-PLAN.md` to `SOURCE-AUDIT.md`; no other reference dangles.
> **Divergences from the lists below, all kept and justified:** `PERF.md` (live CI
> static-render regression-guard contract), `HOMEPAGE.md` (active design diary with
> open imagery/Red-Thread problems), `docs/feedback/*` (research). **Kept as live
> scaffolding** for the still-open pass: this file and `RESTRAINT-PASS-PHASE2-REVIEW.md`
> — per the Definition of Done they self-delete as the pass's *final act*, not now.
> Many originally-listed cut targets were already gone (`DISCOVERY.md`,
> `SCOPE-AUDIT.md`, `HISTORY-DIGESTS.md`, `STRUCTURED-DATA.md`, `COMPARE-PLAN.md`,
> `HABIT-CREATOR.md`, `COPY-REFINE-LOG.md`, `PHASE13-16-FOLLOWUP.md`,
> `POLISH-BACKLOG.md`, the `process/{reviews,handoffs,…}` tree).

**Target: ~30 docs / 6,209 lines → ~12 docs / ~1,800 lines.** Keep only what a new
contributor needs to avoid breaking things, plus the product definition. Cut
everything that narrates work already done.

**Keep (durable reference / system of record):**

| Doc | Why |
| --- | --- |
| `PRODUCT.md` | the yardstick; trim lightly |
| `docs/audience-evidence-base.md` | living launch research; evidence (quotes/sources), not diary; drives Phase 2 |
| `README.md`, `AGENTS.md` | onboarding / agent rules |
| `docs/ARCHITECTURE.md` | how it's built |
| `docs/DATA-MODEL.md` | the schema of record |
| `docs/PIPELINE.md` | how data updates |
| `docs/SOURCE-AUDIT.md` | provenance of record |
| `docs/CORRECTIONS.md` | the live correction workflow |
| `docs/BRANDING.md` | brand stays (per non-goal) |
| `docs/DESIGN.md` | the design + voice system of record |
| `docs/adr/*` | decision records are durable by design |
| `docs/mockups/*` | assets |
| `docs/process/PHASE0-CITABLE-CONTRACT.md` | a live technical contract |

**Fold, then delete the standalone:**

- `COPY-VOICE.md` → fold the voice **rules** into `DESIGN.md` and preserve them — they now feed the §8.1 on-site copy rewrite. Cut only the per-surface log bloat, not the substance.
- `ASSISTS-PLAN.md`, `TABLEAU-GOALS-ASSISTS.md` → fold the durable "why coverage is shaped this way" reasoning into `DATA-MODEL.md` / `SOURCE-AUDIT.md`.
- `HISTORY-DIGESTS.md`, `STRUCTURED-DATA.md` → fold the live-system notes into `PIPELINE.md` / `ARCHITECTURE.md`.
- Any still-live bug in `POLISH-BACKLOG.md` → a single short `BACKLOG.md`; delete the rest.

**Cut outright (narration of finished work):**

`ROADMAP.md` (replace with a ≤1-page "what exists / what's next" in `PRODUCT.md`),
`DESIGN-REFRESH.md`, `DISCOVERY.md`, `SIMPLIFICATION.md`, `COPY-REFINE-LOG.md`,
`SEARCH-PLAN.md`, `INVENTORY.md`, `VISUAL-AUDIT.md`, `PHASE13-16-FOLLOWUP.md`,
`COMPARE-PLAN.md`, `HABIT-CREATOR.md`, `PERF.md` (keep only if it holds a live
gotcha), `docs/process/reviews/*`, `docs/process/handoffs/*`,
`docs/process/{README,ACCEPTANCE,DECISIONS}.md` (fold any real decision into an
ADR), `SCOPE-AUDIT.md`, and finally this file.

**Done when:** the `docs/` tree is the keep-list above, nothing references a
deleted doc, and the surviving docs read as reference, not diary.

### Phase 2 — Re-aim the questions (highest leverage)

Rebuild the front-door catalogue around what a fan actually argues about. Keep the
strong existing modules (late goals, comebacks, runs, fortress, manager bounce,
cup specialists). Reframe `bogey-sides` into named **rivalry ledgers**. Demote the
gags (`own-goals`, `away-days`) out of the front door — keep as deep easter eggs
or cut. Add, in priority order, the questions the data can carry honestly:

1. **The decline** — "How bad has it really been since Ferguson?"
2. **Rivalries** — Liverpool / City / Leeds / Arsenal ledgers.
3. **The Treble** — anatomy of 1998-99.
4. **Ferguson vs the field** — was he that far ahead?
5. **Best & worst seasons, ranked.**
6. **United in Europe** — the continental record by era.

Each ships in the existing format (finding · slice · coverage · matches-behind ·
thread spine). Same container, real contents.

Two constraints from the audience evidence (`audience-evidence-base.md`
§5.7–5.8): lean each question on the **result-level record we hold completely**
(results, scorers, lineups, Elo) rather than advanced metrics the open data
can't support pre-2012 — and be loud about that boundary; and **contextualize by
era** — fans will challenge a denominator that compares across incomparable
periods (*"comparing the data to their peers at the time is much more relevant"*).
The proposed questions (decline, rivalries, Treble, Ferguson, best/worst seasons,
Europe) are mostly result-level, so they grade `complete` honestly — which is
the point.

### Phase 3 — Collapse the slice-sprawl

> **Status — slice-collapse executed (2026-06-29, commit `e0e0b13`).** The
> *analytical* slicing machinery is gone: `/collection` and `/embed` deleted; the
> group-by-anything **fork builder** retired from `/cut` (controls, removable
> slice chips, re-cut bar, save/embed) so `/cut` now renders only curated cuts and
> hand-built fork URLs `redirect("/explore")`; the "build your own / fork" copy
> trimmed from `/explore`. Reference cleanup: the citable `collection`/`embed`
> kinds and the now-unused `SUBJECTS`/`dimensionsFor`/`metricsFor` cut exports
> removed; the habit-creator test gutted to its still-living on-this-day cases
> (renamed). **Kept:** `/matches`, `/questions`, `/explore`, entity pages,
> `/surprise`, `/on-this-day`, `/history-changed`, `/compare`. tsc + knip clean,
> 135 tests pass, build green. **Still open:** Phase 3a (the rediscovery engine
> that *earns* the kept nostalgia surfaces — not yet built); `/compare` "bring it
> to the bar"; and the fresh restraint read of the browse / catalogue / match pages.

Decide which redundant slice-surfaces die. Recommended triage (confirm before
deleting):

- **Keep:** `/matches`, `/questions`, `/explore` (v3), entity pages, `/surprise`
  (near-free, on-strategy).
- **Keep — but conditional on the rediscovery mechanic (Phase 3a).** The
  nostalgist is *"the emotional core"* (§4.2), the orphaned stretfordend.co.uk
  audience is *"the single biggest opening"* (§2), and §8.4 says make rediscovery
  a **front-door feature** — so these surfaces stay, reversing the earlier
  fold-away instinct. But they only *earn* the keep if they actually deliver
  rediscovery, which neither does today. Spec is Phase 3a; without it they are
  calendar/recency lotteries and the keep doesn't hold.
- **Cut or demote hard — the *analytical* slicing machinery only:** `/collection`,
  `/embed` (no audience), and the generic `/cut` **fork** UI. Keep curated cuts as
  *content* surfaced through `/explore` and the questions; retire the
  group-by-anything builder that no one operates.
- **Decide:** `/compare` — high-intent and has surfaced real findings; keep, but
  bring it to the bar and stop it being a parallel slice-everything destination.

### Phase 3a — The rediscovery mechanic (what "elevate" means)

The strongest organic reaction Red Thread ever got — a fan rediscovering the 2015
Europa League exit — was **serendipitous exploration of a forgotten, emotionally
charged match.** It was neither on-this-day (a ~1/365 calendar coincidence) nor
history-changed. The two kept surfaces are doing **two different jobs**, and only
one is nostalgia:

- **`/history-changed` = the freshness loop.** "What did last night mean in 140
  years?" — for the fan returning *after a match*. Real job; keep it; stop asking
  it to carry nostalgia.
- **`/on-this-day` = a daily-return habit**, charge-ranked (below) so it leads
  with the night worth remembering — not the rediscovery engine itself.

Rediscovery needs its **own engine**, and forgotten-but-charged matches are a
**computable class, not random.** Score every match by:

- **Charge** (from data we already hold): knockout exits (esp. European, esp.
  upsets), derby/rivalry results, extreme scorelines, comebacks & collapses
  (led-and-lost / behind-and-won — the comebacks module already replays these from
  minute-stamped goals), giant-killings, streak-enders (streaks engine), late
  drama (late-goal detection), big-crowd nights (attendance).
- **× Fadedness**: an age band (~5–30 years, the living-memory zone — not last
  season, not pre-1960) and a small canonical-fame exclusion (the treble final
  isn't "forgotten").
- **× Your era** *(the unlock)*: one optional, guardrail-safe input — *"Following
  United since ___?"* (a single URL/`localStorage` value; no account, no
  tracking) — biases the roll into the reader's own living memory. This is what
  turns a calendar coincidence into *"that* night," because 2015 only lands for
  someone who was watching in 2015.

Frame the output as a **recognition prompt** ("Do you remember…?"), not a fixture
row.

**Seed it where the magic happened — and add no new routes** (restraint-consistent:
this makes kept surfaces earn their place, it doesn't add surface):

- A **"you might have forgotten…"** rail on entity pages (season / opponent /
  player), surfacing the highest-charge faded night from that entity's history —
  threading rediscovery into the browsing it actually came from.
- A **"Do you remember…?"** roll in the homepage's existing "Today in the record"
  strip, replacing the generic rotating-cut slot.
- A **nostalgia mode** for `/surprise` (which already rolls curated pages).

**Honest limit:** the exact 2015 jolt can't be guaranteed — it's personal and part
luck. The win is that the engine *only ever* rolls forgotten + charged + in-your-era
matches, raising the hit-rate from ~0 (calendar) to high. That is the justification
for keeping the surfaces. Coverage caveat: charge factors needing event data
(comebacks, late drama) are modern-era-strong — which is also the nostalgia zone,
so the engine leans where the data is richest and grades honestly where it isn't.

### Phase 4 — Chart variant consolidation (light, low priority)

Only where two charts are near-duplicate variants, give them a shared canonical
base. Keep every distinctive form. Not a cull. Do last, or never.

**Surveyed and parked (2026-06-29).** All 27 chart components reviewed: no dead
code (every chart has live imports); the five bespoke forms stay bespoke. Four
near-duplicate candidates found, none worth doing now — consolidation is invisible
to users and the survey found no actual defect. **Revisit only if we make broader
changes to charts**, at which point the only residue worth doing is: (1) fold
`SeasonContributionChart` into `InspectableBarChart`'s already-existing `stack`
prop (it already draws the same value-base + cap), and (2) extract one shared
6-anchor year-axis leaf used by both Spines + both Sparklines. The
`ResultSpine`/`ContributionSpine` "merge" is a wrong-abstraction trap — their
differences (diverging vs one-sided, sqrt vs linear scale, fill semantics) are the
substance; share the chrome leaves, never merge the charts. `HistorySkyline` +
`ManagerTimeline` (~15 shared lines) is below the payoff threshold. Full rationale
in memory: `phase4-chart-consolidation-parked`.

### Course correction — defer the opinionated discovery layer to the end (2026-06-29, session 2)

Phase 2 **over-indexed on building new question cards rather than exercising
restraint** — the opposite of this pass's purpose. Stepping back on the `ferguson`
card exposed an unresolved prior question: _what is the `/questions` surface for,
and what bar must a question clear to exist at all?_ A working answer took shape
(the surface-grid "empty cell"; the debate-floor vs revelation-ceiling bar; a
per-question audit that flags `ferguson` and `europe` as not earning their slot) —
but it is **not yet clear enough to act on**, and it is the most opinionated part
of the product. The full synthesis is in `RESTRAINT-PASS-PHASE2-REVIEW.md`
("Session 2"); the `ferguson` build is parked in `git stash`.

So **the questions-surface rethink — and `/explore`, the other opinionated
discovery surface — are deferred to the end of this pass.** They need the frame
stretched further, not another card built on an unsettled definition.

**Pivot now to the other surfaces and perspectives** and do the actual restraint
work there (Phase 3 slice-collapse, plus a fresh restraint read of the
browse / catalogue / match pages). Return to the questions + discovery layer last,
once the rest is tightened and the definition has had room to breathe.

### Course correction — rebuild clarity before more cuts (2026-06-29, session 3) ← NEXT TASK

**This supersedes "pivot now to the other surfaces" above.** The
browse / catalogue / match read got started and immediately exposed the real
problem: we don't share a picture of what we're doing. The read produced
defensible findings and a disagreement about them that neither side could settle
one-shot — that stalemate is the tell. We're executing a pass whose *purpose* has
gone fuzzy. "I feel like we don't know what we're doing at this point."

So the next task is **not another cut**. It is a **clarity session**: work through
the complicated, ambiguous, often-unspoken questions until there is a shared sense
of what this is *for* and what "good" looks like — enough to restore focus and
momentum. Run it as **`/grill-with-docs`** (now installed in `~/.claude/skills/`,
with its `grilling` + `domain-modeling` dependencies): one question at a time, each
with a recommended answer, code explored rather than guessed, and any term or
decision that crystallises written down (a `CONTEXT.md` glossary entry / a short
ADR) so it stops being unspoken.

**Start it fresh — a new conversation, not this thread.**

Candidate threads to open (not a fixed agenda; the grilling surfaces them in
dependency order, and the first real question is *which* of these is the crux):

- **Who is this actually for, and what do they _do_ here?** The evidence points to
  the nostalgist / casual fan; the build keeps serving the stats-obsessed maker.
- **What is Red Thread _for_, in one sentence** — archive, debate-settler,
  nostalgia machine, launchable artefact? The pass keeps oscillating between these.
- **What bar must a page / surface / component clear to exist at all?** The
  `/questions` rethink already hit this wall and parked it as unsettled.
- **Is "restraint" the real goal, or a proxy** for lost conviction about what the
  thing is? If the latter, cutting won't fix it.
- **What does "done / good enough to launch" mean, and to whom?**

**In flight:** one uncommitted change from the read — `components/MatchList.tsx`
(opponent name given a min-width floor so the right-hand meta rail can no longer
starve it to "Bright…"). Keep-or-revert is itself a question for the session; it is
left in the working tree, not committed.

### Clarity session — ran, and produced a shared picture (2026-06-29, session 4)

The grill happened. It resolved the crux threads and wrote the result to a new
durable doc, **`CONTEXT.md`** (root, beside `PRODUCT.md`) — read that, not this
section, for the substance. In one breath:

- **Who it's for:** the **nostalgist — as a mindset, not a demographic** (anyone
  can be invited into it; even a young fan, toward Best / Munich / the Treble).
  Creators and the xG/spider-diagram maker are out; historians served incidentally.
- **What it's for:** **soul + foundation.** Soul = the *spark* (trigger the
  feeling) then the *deepening* (a new authored lens that brings you closer —
  Best & Ronaldo both peaking in season five on one normalized scale). Foundation
  = the complete, trustworthy record, which is *load-bearing for the soul*, not
  plumbing. The freshness loop is **out** (→ `/history-changed` cut/demote).
- **The bar:** **lens, not loom.** The frame must *guarantee meaning whatever the
  user points it at*; build-anything machinery abdicates authorship and dies.
  This **promotes Principle 2** to the design principle of the deepening layer.
  Whole thing reads as **respect for the user**: reliable data (no garden path) +
  raw material to explore (no box).

This **reframes the pass on truer ground:** restraint survived the stress-test, but
the reason for the cuts is now "self-serve slicing isn't authorship," not "less is
more." The provisional surface verdicts (which live, reshape, die) are in
`CONTEXT.md` §4 — they now have a yardstick behind them.

**Still open:** the last thread — *what "done / good enough to launch" means* — and
the `MatchList.tsx` keep-or-revert. `PRODUCT.md` now conflicts with `CONTEXT.md` in
three places (`CONTEXT.md` §5) and needs reconciling.

### Non-goal reminder — brand

No brand subtraction beyond `/logo-lab`. If anything, extend the thread motif
where it aids wayfinding. Tracked here only so it isn't mistaken for in-scope.

---

## Definition of done

The pass is complete when: the docs are the keep-list (Phase 1); the front door
answers the questions fans actually ask (Phase 2); there is one obvious way to
slice, not nine (Phase 3); and the kept nostalgia surfaces deliver rediscovery via
the Phase 3a engine rather than a calendar lottery. At that point this document and the docs it marked for
cutting are deleted in the same commit — the pass's final act is to remove its own
scaffolding.

---

## Logged for later — mobile-first design pass (noted 2026-06-29)

Reviewing the match page on a phone (against FotMob) surfaced a cluster of design
ideas that **outlive this restraint pass**. Capture, don't build — out of scope now.
When this file self-deletes, these move to a real backlog (or `PRODUCT.md`), not the bin.

- **Match header: edge-to-edge, not a card.** The hero sits in a bordered, rounded
  card today. It would feel more immersive as a full-bleed band where the result's
  colour-coding does the encapsulation on its own — subtle, no hard container. Most
  appropriate on mobile, but probably better on desktop too.
- **Player shirts need polish.** The teamsheet shirts lack crispness and depth —
  they read flat. Wants more refined rendering (shading, edge, weight).
- **Lineup headers are redundant to the point of obstructive.** The "Lineup" section
  heading, the "Starting XI" subheading, and the "Starting XI · N subs · …" summary
  line stack up saying the same thing. Collapse to one.
- **Mobile nav: floating translucent pill, swipe to switch.** Replace the top navbar
  on mobile with a translucent floating pill menu, with swipe gestures to move between
  match sections/tabs. Desktop keeps its own nav — but some of this aesthetic
  (immersion, translucency, less chrome) likely spills onto the desktop look too.

Meta-note: the narrow screen **focuses the eye** — reviewing on mobile caught
redundancy and flatness the roomier desktop layout hid. Worth running future design
reviews phone-first.
