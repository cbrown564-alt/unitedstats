# Journey — the looping thread

Working design diary for a major soul surface: a **journey through United's
history** that also **showcases what Red Thread can do** — unexpected results,
rich illustrations, cross-era comparisons fans rarely see. Not a replacement for
the homepage spark (`docs/HOMEPAGE.md`); a second beat that proves deepening.

Read alongside: `CONTEXT.md` §2 (spark → deepening → foundation), `PRODUCT.md`
(lens not loom), `DESIGN.md` (floodlit ledger, motion restraint).

---

## 1. The job

Make a United fan feel: *I never knew that — or I knew it, but I never saw it
that way.* Then leave a door into the living product (compare, questions, seasons,
match receipts).

Two intertwined promises:

| Promise | What it means |
|--------|----------------|
| **(a) Journey** | A path through United history, following the red thread |
| **(b) Capability** | A high-level illustration of Red Thread's unique lenses — rediscovery nights, myth questions (fortress, late goals, treble), seasons hero, cross-era compare |

Done = one nostalgist finishes a chapter and wants another. Reach and sizzle video
are downstream compressions of a working arc — not the starting brief.

---

## 2. The visual metaphor — timeline + looping thread

**Constant anchor:** the club timeline (1886 → now). The journey is always *on*
history's line, never a free-floating slideshow.

**The thread does three things:**

1. **Follows time** — the default: beads along the axis (nights, seasons, eras).
2. **Loops back** — when history *rhymes*: two moments generations apart that
   share a shape. The filament curves into a loop and *touches* an earlier era.
   The Ronaldo ↔ Best fifth-season peak is the flagship of this mode.
3. **Spins off** — when a moment is singular (the Treble campaign, a fortress
   season, Fergie time). The thread leaves the main axis into its own pocket —
   a short authored branch — then returns.

Threads connect **time**, **people**, and **place** (Old Trafford, Wembley,
Camp Nou) — not only chronology.

```
  1886 ────────●────────●════════●────────●────────●──── now
               │        ╲      ╱ loop                  │
               │         ╲____╱  (rhyme)               │
               │                                       │
               └──── spin-off pocket (treble) ─────────┘
```

**Complexity guardrail.** The metaphor is powerful and easy to overbuild. Rules:

- One metaphor, few verbs (follow / loop / spin-off). No parallel visual systems.
- Prototype **one** verb to completion before inventing the next.
- Prefer reusing existing lenses (`CareerDuelChart`, `ResultSpine`, `MatchFlow`,
  rediscovery) over inventing new chart types inside the journey.
- Motion serves the insight; if the insight lands without the flourish, cut the
  flourish. Always honour `prefers-reduced-motion` (final state + copy, no morph).

---

## 3. Packaging (open — decide after the pilot lands)

| Option | Role | Risk |
|--------|------|------|
| **Dedicated `/journey`** (or `/story`) | Lab and eventual home for the full arc | Needs discovery from home/explore |
| **Homepage continuation** | Thread continues past spark into foundation + chapters | Competes with spark's five-second job |
| **Sizzle / hero reel** | Compressed cut of the same beats for first contact | Premature until beats are proven |

**Working stance:** build and prove on a throwaway `/journey` route (`noindex`).
Homepage and sizzle are packaging decisions *after* the morph lands.

---

## 4. Pilot chapter — Ronaldo vs Best (the loop)

### The rhyme (verified in the record)

| | George Best | Cristiano Ronaldo |
|--|-------------|-------------------|
| Peak United season (goals) | **5th** — 1967–68 (32 in 53) | **5th** — 2007–08 (42 in 49) |
| Calendar peak year | **1968** | **2008** |
| Gap | **40 years** | |
| European Cup that year | **won** — Benfica, 4–1 aet (Wembley) | **won** — Chelsea, 1–1, pens 6–5 (Moscow) |
| Scored in the final | **Best, 92′** | **Ronaldo, 25′** |
| Shirt in the final | **No. 7** | **No. 7** |

Both No. 7s, same career-season peak, and the European Cup landed at that exact
peak — each man scoring in the final. This is the product's canonical
deepening example (`CONTEXT.md` §2; `PRODUCT.md` core promise). Every row is
DB-derived — `peakSeason`, `CUP_WON_PREDICATE`, `match_events`, `match_lineups`
— none of it hand-asserted.

### Why the wow needs the morph (and more than one fact)

The first pilot shipped one verified fact — the fifth-season peak — across four
stations. With only one fact to carry, the copy had to *manufacture* suspense to
fill the gap (“*the years don't match — but something does*”), and that
manufacturing is the AI cadence the rubric names. The flatness and the slop were
the same wound: a narrator inventing a mystery the visual hadn't earned.

The fix is a **real arc with rising information, each beat evidenced by a
different app surface** — so the journey is both a story *and* a showcase of the
dataset's breadth. The morph's loop is no longer decorative; it's reaching
toward the trophy. Stations are anchored to facts, not to narrated teasing.

**Anti-pattern:** axes, tick marks, progress %, bordered cards, bar charts on
the stage. Those belong on `/compare`. The journey borrows TonightHero's
register (light, type, thread) — if it reads as a dashboard, it failed. Where a
beat reuses a real chart, it reuses the chart honestly; the atmospheric dressing
sits around it, not on top of it.

**Copy discipline (what the pilot got wrong, and what to hold to):**

- No smell-list intensifiers — “Journey”, “legacy”, “iconic”, “carried”.
- No narrated mystery (“something does”, “one shape”) when a fact will do the
  work — see `docs/COPY-RUBRIC.md` §Cadence.
- State the forty-year gap once at the open; let the evidence carry it after.
- Every line carries a concrete fact, date, or measure — not a feeling.

### Beat sheet (shipped — the trophy-rhyme arc)

The chapter becomes a **guided tour through the app's own vocabulary**: each
beat a different existing graphic, each carrying one rhyming fact. The arc now
has real rising information and a climax, instead of one fact told four ways.
Throughline: *two No. 7s, forty years apart — same shirt, same career peak, and
both scored in the European Cup final that crowned it.*

| Beat | Graphic (surface showcased) | Headline | Sub / evidence |
|------|------------------------------|----------|----------------|
| **0. The opening** | `RhymeMorph` stage — two ghosted years on the wings, the No. 7 monument, thread dormant *(the thread metaphor)* | "1968. 2008." | "George Best. Cristiano Ronaldo. Forty years apart." |
| **1. The peak** | `CareerDuelChart` — both career arcs on the shared season axis, **season 5 highlighted** on both *(showcases `/compare`)* | "Each man's best season was his fifth." | "32 in 53. 42 in 49." |
| **2. The turn** | `EuropeFinalsTimeline` — the European-finals spine, '68 and '08 gold and called out *(showcases the European thread; '99 sits between them — the bridge to chapter 2)* | "And both lifted the European Cup that year." | "Best's Benfica, 4–1. Ronaldo's Chelsea, on penalties." |
| **3. The climax** | `MatchFlow` (Best 92′, Ronaldo 25′) over ghosted `FormationPitch` lineups of each final *(showcases `/match/[id]`)* | "Both scored in the final." | "Best, 92 minutes. Ronaldo, 25." |
| **4. The door** | Thread lands, quiet *(exit into the living product)* | — | "Open the full duel →" (`/compare`); "1968 final →" / "2008 final →" (the receipts) |

**Why this isn't flat:** Beat 1 establishes the peak (fact 1). Beat 2 turns —
*that's also the cup* (fact 2, new). Beat 3 lands the climax neither previous
beat telegraphed — *they each scored in it* (fact 3, newest, the real jolt).
Information accumulates, so the copy never has to manufacture suspense.

**As built (deltas from the sketch above):**

- Beat 0 no longer reveals the fifth-season stat (that's beat 1's job now). The
  morph carries only the *first* rhyme — one shirt, forty years — landing on
  "The same red seven." / "Best, 1968. Ronaldo, 2008." with a quiet
  *follow the thread ↓* hand-off. Runway trimmed 360→300vh; the 32/42 foot panel
  and the compare door were removed (the door is beat 4).
- Beat 3's two finals **stack vertically**, each at the flow's real `/match`
  width. Side-by-side halved the width and smeared 1968's three late goals
  (Best 92′, Kidd 93′, Charlton 99′) into one label; stacked, each `MatchFlow`
  reads at match-page parity. The `FormationPitch` is ghosted with
  opacity + a bottom mask (not the `muted` shirt mode — that greys the red XI,
  which is the point); the scorer's shirt carries its goal mark, so the No. 7
  reads without extra chrome.
- `CareerDuelChart` keeps its `/compare` red/blue identity (it *is* the compare
  surface being showcased); both peak dots land on season 5, so the chart's own
  markers are the "same fifth season" highlight — no bespoke annotation added.
- Each beat below the morph is a `JourneyBeat` (`components/journey/JourneyBeat.tsx`):
  an IntersectionObserver reveal wrapper that frames the reused graphic with the
  floodlit eyebrow/headline/sub and a thread-knot node, so the continuous thread
  ties station to station. Reduced motion → everything lands immediately.
- The European spine is the *premier* trophy only (European Cup + Champions
  League): '68/'99/'08 wins to the right, '09/'11 losses to the left. `europeanFinals()`
  filtered by competition name; the '99 win sits between the rhymes as intended.
  Minor honest quirk: `shortCompetition` renders "European Cup" as "Cup".

**Graphic reuse (all exist, all route-agnostic — data props only):**

- `RhymeMorph` — the bespoke stage already shipped; serves beat 0 and the
  continuous thread metaphor. To stay honest it must remain chrome-free and
  `prefers-reduced-motion`-aware (see build notes).
- `CareerDuelChart` (`components/charts/CareerDuelChart.tsx`) — already marks the
  peak season dot; `isAnimationActive` is false, so a scroll-reveal wrapper
  drives season-5 emphasis from progress. Use the `*Lazy` barrel to keep it off
  the critical path.
- `EuropeFinalsTimeline` (`components/charts/EuropeFinalsTimeline.tsx`) —
  server-rendered, zero client JS; takes `EuropeFinal[]`. The '99 win sitting
  between the two rhymes is a free foreshadow of chapter 2 (Treble).
- `MatchFlow` + `FormationPitch` (`components/MatchFlow.tsx`,
  `components/FormationPitch.tsx`) — both server-rendered. `FormationPitch`
  already has a `muted`/grayscale shirt mode (`ShirtBadge`); a ghost variant is
  trivial since shirt colours are hardcoded SVG literals. Lineup data for both
  finals is complete (11 starters each; '68 from classic 1–11 shirt placement,
  '08 from recorded roles).

**Data every beat is anchored to (all DB-derived, none asserted):**

| Fact | Source |
|------|--------|
| No. 7 / forty-year gap | `players.primary_shirt`, career years |
| 5th-season peak (32/53, 42/49) | `peakSeason` over `CareerSeason` |
| European Cup both years | `CUP_WON_PREDICATE` (`lib/queries.ts`) |
| Scored in the final | `match_events` (Best 92′, Ronaldo 25′) |
| Shirt 7 in the final | `match_lineups` |

**Venue caveat:** `stadium_id` is NULL on neutral-final rows (repo-wide, not
'68-specific), so "Wembley"/"Moscow" aren't on the match row — copy uses
opponent + score, which are.

**Fact correction surfaced by this work (fixed):** `lib/curatedNights.ts:11`
called the 2008 win "*a second European Cup*" — it was the **third** ('68, '99,
'08). Corrected to "a third" in `curatedNights.ts` and the parallel line in
`components/QuestionModules.tsx:1066`.

### Build notes (durable decisions & gotchas)

- **Chrome-free without FOUC.** `/journey` hides the app shell via
  `html[data-chrome="off"]` rules (`globals.css`). Setting that in a
  post-hydration effect flashed the sidebar on load — fixed by emitting the
  attribute from a synchronous inline `<script>` in `page.tsx` (present in the
  SSR HTML, runs before first paint). The effect only keeps it in sync for
  client-side nav and clears it on exit.
- **One coordinate system.** Thread, ghost years, and names all live in a single
  SVG `viewBox="0 0 1000 700"` (`preserveAspectRatio="xMidYMid meet"`). The first
  cut had the thread in SVG and the years in HTML `justify-between` — they
  desynced and clipped the right wing.
- **A full circle needs two arcs.** One elliptical-arc command whose start point
  equals its end point is dropped by the SVG spec, so the "loop" first shipped as
  a tent. Draw it as two semicircle arcs (neck → opposite → neck).
- **Ghost years: never blur the numerals.** Blurring the year text itself reads as
  a defocus bug. Keep crisp `.stat-num` numerals over a *separate* blurred halo
  copy. Names use the sans face at a refined weight — **not** `.display`, which
  forces `text-transform: uppercase` (turned "Best" into "BEST").
- **Equal players, one accent.** Both No. 7s render in warm off-white; gold is
  reserved for the shared rhyme knot. (Red Best / blue Ronaldo made Best dissolve
  into the red field while Ronaldo popped — an unintended bias.)
- **Honest numbers.** 32-in-53 vs 42-in-49, data-driven from `peakGames` (season
  `apps`), so the gap reads as era/fixtures — not "Ronaldo just scored more."

### Out of scope for the pilot

- Full multi-chapter journey, treble spin-off, rediscovery nights, homepage
  integration, 3D/WebGL, sizzle export, new data pipelines.
- Replacing or redesigning `/compare` itself (the journey *leads into* it).

---

## 5. Later chapters (sketch only — do not build yet)

Ordered by how cleanly they reuse existing surfaces:

| Chapter | Metaphor verb | Reuse |
|---------|---------------|--------|
| Treble 1998–99 | Spin-off | `ResultSpine`, three `MatchFlow` deciders, season 1998–99 |
| Fortress | Spin-off | `LeadHeldDotplot`, surrendered-lead flows |
| Fergie time | Spin-off / loop across managers | `LateGoalScatter`, manager-era bars |
| Forgotten night | Bead on the axis | Rediscovery / `/surprise` |
| Skyline breath | Follow | `HistorySkyline` / seasons `FinishTimeline` |

Each chapter should be authorable as a short beat sheet before any motion work.

---

## 6. Motion & tech stance

- **No new animation library** for the pilot — CSS + SVG + scroll-linked progress
  (same family as `TonightHero` / `AnswerThread`). Revisit only if the morph
  cannot be honest without it.
- **Scroll owns time** — sticky stage, tall scroll runway, progress 0→1 drives
  path and layout. Click-to-play is a fallback, not the primary.
- **Reduced motion** — skip to the landed rhyme state; keep the copy and the
  compare door.
- **Mobile** — same morph, tighter stage; if the loop path muddies at 390px,
  simplify the path rather than drop the insight.

---

## 7. Success criteria for the pilot

Falsifiable:

1. A viewer who knows both players still gets a jolt at the season-5 alignment
   (the morph is doing work a static chart doesn't).
2. The looping-thread metaphor reads in one pass without a legend.
3. The chapter exits into `/compare` without feeling unfinished.
4. `prefers-reduced-motion` still communicates the rhyme.
5. We have not invented a second visual language beside the red thread.

If (1) fails, the morph is wrong or the copy is — fix before adding chapters.

**Status (2026-07-09):** the **multi-beat arc is now built** on `/journey` and
cleared build review on 2–5 (screenshots in `output/screenshots/journey-v2-*`).
The flat single-fact version is gone: the morph carries the shirt rhyme (beat 0),
then three stations each reuse a different app surface carrying a *new* rhyming
fact — the peak (`CareerDuelChart`, both peaks on season 5), the cup
(`EuropeFinalsTimeline`), the goal (`MatchFlow` over a ghosted `FormationPitch`) —
before the door into `/compare` and the two receipts (beat 4). Information rises,
so the copy states facts instead of manufacturing suspense.

- (2) thread metaphor reads in one pass — the loop through the No. 7, then the
  knot-node spine tying each station down the field. ✓
- (3) exits into `/compare` (+ 1968/2008 receipts) without feeling unfinished. ✓
- (4) reduced motion lands the morph state and reveals every beat immediately. ✓
- (5) one visual language — the reused charts bring their own axes (honest
  showcase), the atmospheric dressing stays around them, not on them. ✓
- (1) — the season-5 jolt — is now *shown* (the two peak dots align on season 5)
  and re-staked on the trophy/goal climax; still **awaits a real nostalgist**.

---

## 8. Prototype location

- Doc: this file (`docs/JOURNEY.md`)
- Route: `/journey` (prototype, `noindex`) — `app/journey/page.tsx` assembles the
  arc (compare + European Cup finals + both final receipts) and emits the
  pre-paint `data-chrome="off"` script
- Beat 0 (opening morph): `components/journey/RhymeMorph.tsx`
- Beats 1–4 (reveal wrapper + thread spine): `components/journey/JourneyBeat.tsx`
- Finals-receipt data (`MatchFlow` + `FormationPitch` props for both finals):
  `lib/journey.ts` (`finalReceipt`), mirroring `app/match/[id]/page.tsx`
- Reused surfaces: `CareerDuelChartLazy`, `EuropeFinalsTimeline`, `MatchFlow`,
  `FormationPitch` — all data-props-only, none forked
- Chrome-off rules: `html[data-chrome="off"]` block in `app/globals.css`
- Data: `comparePlayers("cristiano-ronaldo", "george-best")` + `europeanFinals()`
  (filtered to the premier trophy) + `finalReceipt` over `1968-05-29-benfica-n`
  and `2008-05-21-chelsea-n` (`match_events`, `match_lineups`) — no new ingest.

**Shipped 2026-07-09** — multi-beat arc: beat 0 morph retuned to the shirt rhyme
(narrated-suspense copy + 32/42 foot panel removed); beats 1–3 each showcase a
different existing graphic carrying a new rhyming fact; beat 4 the door into
`/compare` + both receipts. Earlier single-morph pilot: commits `272234e` →
`09b3716` → `dc8e17c` → `d715ac4`.

Once the arc clears criterion (1) with a real nostalgist, graduate durable
decisions into `DESIGN.md` / `PRODUCT.md` and decide packaging (§3).
