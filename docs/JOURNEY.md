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

## 3. Packaging

### Now — standalone stories

Build and prove **one story at a time** as a self-contained arc. Each story has
its own chrome-off, `noindex` route under **`/stories/[slug]`**, with the
`/stories` shelf as the product entry point. The shelf sits above Explore in the
primary navigation. The former `/journey*` lab paths permanently redirect to
their matching story. Cross-links between stories stay light; do not wait on a
master timeline to ship the next chapter.

These stories are **building blocks with a secondary purpose**: each proves a
metaphor verb (loop, spin-off, …) and a product lens, and each is worth reading
alone. The full Red Thread journey is downstream of a shelf of finished blocks.

### Later — stitch through time (do not build yet)

Eventually stitch the blocks into one continuous journey. Likely form: **short
snapshots of each story's highlights**, told at a greater pace than the
standalone chapters — not a full replay of every beat.

**What ties them together is time.** The red thread is the building block for
that: Ronaldo ↔ Best forty years apart (the loop), the frantic eleven days in
May and the supersub latency (the spin-off pocket), Fergie time, fortress
seasons, forgotten nights. Representing that journey through time will need a
**richer animation** than the per-chapter sticky morphs — one continuous
filament that can follow, loop, and spin off across eras. That motion system is
out of scope until several standalone stories are proven.

| Horizon | Role |
|---------|------|
| **`/stories/[slug]`** | Standalone story home (current work) |
| **Stitched journey** | Snapshot reel / richer time animation across stories |
| **Homepage / sizzle** | Compressions of proven beats — after the shelf exists |

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

| Beat | Graphic (surface showcased) | Headline | Sub / evidence | Source pointer |
|------|------------------------------|----------|----------------|----------------|
| **0. The opening** | `RhymeMorph` stage — ghosted years on the wings, portrait monuments flanking the No. 7, thread dormant *(the thread metaphor)* | "1968. 2008." → "Two No. 7s." → "The same red seven." | Names + forty-year gap; then peak years at land | — |
| **1. The peak** | `CareerDuelChart` — both career arcs, **season 5 emphasised** *(showcases `/compare`)* | "Each man's best season was **his fifth.**" | "Best, 32 in 53. Ronaldo, 42 in 49." | Player comparison → `/compare` |
| **2. The turn** | `EuropeFinalsTimeline` — premier-trophy spine, **'68 and '08 featured** *(showcases `/questions/europe`)* | "And both lifted the **European Cup** that year." | "Best's Benfica, 4–1. Ronaldo's Chelsea, on penalties." | European finals → `/questions/europe` |
| **3. The climax** | `MatchFlow` + `FormationPitch` — scorer focused in flow and XI *(showcases `/match/[id]`)* | "And each one **scored in the final.**" | "Best, 92 minutes. Ronaldo, 25." | 1968 final / 2008 final → `/match/[id]` |
| **4. The door** | Quiet exit *(into the living product)* | "One thread, forty years." | Recap + hand-off | "Open the full duel →" (`/compare`); receipt links repeat |

**Why this isn't flat:** Beat 1 establishes the peak (fact 1). Beat 2 turns —
*that's also the cup* (fact 2, new). Beat 3 lands the climax neither previous
beat telegraphed — *they each scored in it* (fact 3, newest, the real jolt).
Information accumulates, so the copy never has to manufacture suspense.

**As built (deltas from the sketch above):**

- Beat 0 no longer reveals the fifth-season stat (that's beat 1's job). The morph
  carries only the *first* rhyme — one shirt, forty years — in three copy phases
  ("1968. 2008." → "Two No. 7s." → "The same red seven.") with a quiet
  *follow the thread ↓* hand-off. Runway trimmed 300→210vh; the 32/42 foot panel
  and the compare door were removed (the door is beat 4). Licensed portrait
  monuments (`public/media/journey/*.webp`, built by `scripts/cache-journey-portraits.ts`)
  flank the No. 7 at half-viewport scale — heavily treated atmosphere, not match
  photography. The loop neck is centred on the No. 7 (any horizontal offset read as
  a near-miss); a short initial filament (32% drawn) makes the loop legible before
  scroll.
- Beat 3's two finals **stack vertically**, each at the flow's real `/match`
  width. Side-by-side halved the width and smeared 1968's three late goals
  (Best 92′, Kidd 93′, Charlton 99′) into one label; stacked, each `MatchFlow`
  reads at match-page parity. `focusPlayerIds` on `MatchFlow` and `FormationPitch`
  brings the named scorer forward (gold label + knot in the flow; scaled shirt with
  gold glow on the XI, rest at 35% opacity) rather than greying the whole teamsheet.
  Each receipt card names the No. 7, minute, and year watermark (68 / 08).
- `CareerDuelChart` keeps its `/compare` red/blue identity; `emphasisSeason={5}`
  adds a gold `ReferenceArea` band, enlarged peak dots, and a "Shared peak · season 5"
  label. `showTooltip={false}` on the journey beat reserves hover for direct
  season navigation (points still open their season on click).
- `EuropeFinalsTimeline` takes `featuredIds` — the rhyme finals ('68, '08) get
  large gold year callouts and full opacity; the rest (including '99 between them)
  stay honest context at reduced opacity. `shortCompetition` no longer strips
  "European" from "European Cup" (only the UEFA prefix on Champions League).
- Each beat below the morph is a `JourneyBeat` (`components/journey/JourneyBeat.tsx`):
  ghosted step numeral, large headline with one `JourneyThreadAnchor` phrase
  underlined in devil-bright (native `text-decoration`, not a separate filament),
  alternating `align` (left / right / center), and an optional `JourneySourceLink`
  provenance pointer (filament knot + uppercase label + arrow) into the living
  product surface the beat reuses. No scroll-reveal animation or connective thread
  knots between beats — content is present from first paint; the morph owns motion.
- The route background is `.journey-floodlit` (`globals.css`): layered red wash and
  warm floodlight gradients, not flat `bg-pitch` panels — the deepest pitch tone
  stays inside reused charts where contrast needs it.
- The European spine is the *premier* trophy only (European Cup + Champions
  League): '68/'99/'08 wins to the right, '09/'11 losses to the left. `europeanFinals()`
  filtered by competition name; the '99 win sits between the rhymes as intended.
- `familyName()` (`lib/names.ts`) centralises compact surname labels (particles,
  suffixes, honorifics) — used on the journey route and deduplicated from
  `QuestionModules`, `LateGoalScatter`, etc.

**Graphic reuse (all exist, all route-agnostic — data props only):**

- `RhymeMorph` — the bespoke stage; beat 0 and the continuous thread metaphor.
  Chrome-free, `prefers-reduced-motion`-aware, portrait monuments optional via
  `imageSrc` on each side. See build notes.
- `CareerDuelChart` (`components/charts/CareerDuelChart.tsx`) — peak season dot
  plus optional `emphasisSeason` / `emphasisLabel` / `showTooltip` for story
  surfaces. Use the `*Lazy` barrel to keep it off the critical path.
- `EuropeFinalsTimeline` (`components/charts/EuropeFinalsTimeline.tsx`) —
  server-rendered; takes `EuropeFinal[]` and optional `featuredIds`. The '99 win
  sitting between the two rhymes is a free foreshadow of chapter 2 (Treble).
- `MatchFlow` + `FormationPitch` (`components/MatchFlow.tsx`,
  `components/FormationPitch.tsx`) — both server-rendered. Optional
  `focusPlayerIds` dims the XI around a named scorer and gold-highlights their
  goal in the flow. Lineup data for both finals is complete (11 starters each).

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

- **Chrome-free without FOUC.** Story chapters hide the app shell via
  `html[data-chrome="off"]` rules (`globals.css`). Setting that in a
  post-hydration effect flashed the sidebar on load — fixed by a path-gated
  `beforeInteractive` script in `app/layout.tsx` (runs before first paint on
  hard loads of `/stories/[slug]`). `useJourneyStage` keeps it in
  sync for client-side nav and clears it on exit. Do not put a raw `<script>`
  in page components — React 19 warns that those never execute on the client.
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
- **Floodlit field, not dashboard panels.** `.journey-floodlit` wraps the route
  below the morph: warm red gradients and corner washes so the thread never
  travels through empty black. Individual beats add local pitch panels + ghost
  numerals (5, 68, 08) inside the chart frames only.
- **One underline per headline.** `JourneyThreadAnchor` marks the single phrase
  each graphic proves (`his fifth.`, `European Cup`, `scored in the final.`) with
  native `text-decoration` — attached across line breaks, no second filament
  system below the morph.
- **Provenance without breaking register.** `JourneySourceLink` on beats 1–3:
  tiny devil-bright knot, uppercase tracked label, quiet arrow — links into
  `/compare`, `/questions/europe`, and the two `/match` receipts. Beat 4 keeps
  the primary door CTA; source pointers are editorial, not chrome.
- **Alternating editorial weight.** Beats alternate `align` left / right / center
  so the chapter doesn't repeat one centred stack. Ghost step numerals (01–04)
  sit behind the headline block.
- **Motion budget.** Scroll animation is owned entirely by beat 0 (`RhymeMorph`).
  Beats 1–4 are static from first paint — fast scroll, print, and deep links
  never show empty stations. Removed the earlier IntersectionObserver fade-in
  and inter-beat thread knots (they competed with the morph and felt dashboard-y).
- **Portrait monuments.** Journey-specific 1024px WebP derivatives
  (`scripts/cache-journey-portraits.ts` → `public/media/journey/`) from the same
  Wikimedia lineage as player cards. Heavily masked/blurred in the morph — faces
  as atmosphere, not hero photography.

### Out of scope for the pilot

- Full multi-chapter journey, treble spin-off, rediscovery nights, homepage
  integration, 3D/WebGL, sizzle export, new data pipelines.
- Replacing or redesigning `/compare` itself (the journey *leads into* it).

---

## 4b. Chapter 2 — the Treble (the spin-off)

The second metaphor verb. Where the pilot proved the **loop** (history rhyming
across forty years), this chapter proves the **spin-off**: a singular campaign
that leaves the main axis into its own pocket, then returns. It is published at
`/stories/eleven-days-in-may` (`noindex`) with light chapter cross-links. The
pilot's arc stays untouched.

### The facts (verified in the record, 2026-07-09)

| Fact | Value | Source |
|------|-------|--------|
| Three trophies in eleven days | 16 May (PL, Spurs 2–1) · 22 May (FA Cup, Newcastle 2–0) · 26 May (CL, Bayern 2–1) | `matches`, season `1998-99` |
| Season shape | 63 official games, 36W 22D 5L, 128 GF | `matches` (no unofficial games that season) |
| No defeat after 19 December | 33 games unbeaten to the end — 23W 10D (last loss: Middlesbrough h, 2–3) | `matches` |
| The title, from behind | Ferdinand 26′ → Beckham 43′, **Cole 48′ — on at half-time (46′)** | `match_events` + `match_lineups.sub_on` |
| The Cup, from the bench | **Sheringham on 9′, scored 11′**; Scholes 52′ | `match_events` + `sub_on` |
| The climax | Basler 6′; trailing at 90 — **Sheringham 90+1′ (on 67′), Solskjær 90+3′ (on 81′)**. Neither started | `match_events`, `match_lineups` (`started=0`) |
| The through-line (bench) | **In all three deciders, a substitute scored** — Cole and Sheringham each two minutes after coming on | derived from the above |
| The stack (manner) | Three must-wins in eleven days; **two won from behind** (Spurs, Bayern); **all three decided by a substitute**; first English Treble | receipts + known myth |

The bench through-line was meant to be the chapter's rising fact — the discovery
even a fan who knows the Treble hasn't seen stated. It plays the role "each
scored in the final" played in the pilot. But the *full* astonishment is a
**stack of impossibilities**, not a single rhyme — and the discovery rebuild
still under-tells that stack (see "Why the astonishment still doesn't land"
below).

### Why the shipped sheet fell short (2026-07-09)

The first build proved the spin-off morph and pinned every number to the record,
but the chapter still read as a chrome-off trailer for `/questions/treble`:

- **Repeated lens** — beats 2–4 were the same `DeciderCard` / `MatchFlow` three
  times. Chapter 1 never repeats a graphic; each beat opens a different surface.
- **Question overlap** — beat 1 led with the full-season `ResultSpine`, the same
  chart that opens the treble question's visual station.
- **Calendar, not discovery** — day one → day seven → day eleven is the question
  page's evidence order. Rising *labels*, not rising *information*.
- **Door into another narrative** — primary CTA was `/questions/treble`. Chapter 1
  exits into `/compare` (a living tool). The journey should open the product, not
  preface another authored page.
- **Stage without monument** — type + thread only. Correct to refuse a Best /
  Ronaldo portrait duel, but the landed stage still needs visual weight so it
  doesn't lose the side-by-side with `/stories/two-no-7s`.

North star: **Two No. 7s** = history rhymes across forty years, three product
lenses. **Treble** = a singular eleven-day pocket where **three must-wins were
decided by the bench — two of them from behind** — and the trophies are what
followed. One morph, one unique through-line viz, one unforgettable teamsheet —
then out into the season. (Manner first; haul as consequence — see astonishment
diagnosis below.)

### Beat sheet (revised — discovery arc)

Order of *revelation*, not calendar. Five beats (0–4), matching the pilot's
count. Each beat below the morph uses a **different** graphic shape.

| Beat | Graphic (surface showcased) | Headline | Sub / evidence | Source pointer |
|------|------------------------------|----------|----------------|----------------|
| **0. The spin-off** | `TrebleSpinoff` — axis, pocket, three gold knots; stage monument | "1998–99." → **"Three must-wins."** → **"All three, from the bench."** | "Sixty-three games." → **"Final day. Cup final. European final."** → dates as knots land. Foot fact after land: **"Three trophies."** (haul as quiet consequence — manner owns the land) | — |
| **1. The rhyme** | **Bench latency** — one compact on→score clock across all three nights *(the chapter's unique viz; questions/treble never foregrounds this)* | "In every decider, **a substitute scored.**" | "Cole, on 46′, scored 48′. Sheringham, on 9′, scored 11′. Then Barcelona — both from the bench." | Season `1998–99` (context) or quiet; receipts wait for beats 2–3 |
| **2. One night** | `MatchFlow` + trailing board + Cole-focused receipt *(showcases `/match`; only full single-night receipt before the climax)* | "Day one: the title, **won from behind.**" | Trailing board **"0–1 after 26′"** above the flow; then Ferdinand → Beckham → Cole. | 16 May receipt |
| **3. The jolt** | Trailing board + `MatchFlow` + `FormationPitch` + `Bench` — **"0–1 at 90′"**; XI carries **no goal marks**; both ⚽ sit on the bench rows | "Day eleven: **both goals came off the bench.**" | "Basler on 6. Ninety minutes gone — Sheringham 90+1 (on 67′), Solskjær 90+3 (on 81′)." | 26 May receipt |
| **4. The door** | Quiet exit | **"Three must-wins. Two from behind. All three from the bench."** | "Eleven days. Three trophies. Now run the season back." | **Primary:** `Season 1998–99 →` (`/seasons/1998-99`); three receipts. **Secondary:** the full answer (`/questions/treble`). Chapter cross-links. |

**What was cut from the shipped sheet**

| Cut | Why |
|-----|-----|
| Full-season `ResultSpine` as its own beat | Same lead chart as `/questions/treble`. Unbeaten run becomes a morph foot-fact + door into `/seasons`. |
| Day-seven `MatchFlow` (Newcastle) as a full beat | Third identical lens. The Cup final still appears in beat 1's latency clock (Sheringham 9′→11′); the receipt stays on the door. |
| Primary CTA → `/questions/treble` | Replica signal. Season page is the living surface; the question is optional depth. |

**Rising information (must hold) — manner-first after lever A:**

1. Pocket names the season, then **three must-wins** (stakes), then lands on
   **all three from the bench** (manner). Haul is a foot-fact, not the land.
2. Beat 1 deepens the bench rhyme — on→score latency across all three nights;
   Barcelona detail still withheld for the teamsheet.
3. Beat 2 shows one night in full — the title from behind — so `/match` earns its
   place before the climax.
4. Beat 3 is a **new shape**: teamsheet proof. Empty starter marks + bench ⚽.
   Trailing board **"0–1 at 90′"** sits above the flow (lever C).
5. Door recaps the **stack** (must-wins · from behind · bench), then opens the
   season (and quietly the question).

Copy discipline unchanged: no manufactured mystery, every line a fact/date/measure,
`tests/journey.test.ts` still golden-pins the numbers. Day-seven Newcastle copy
moves into the latency beat and the door receipts — it is not deleted from the
record, only from the beat count.

### Stage monument — **trophy perspectives** (trial 2026-07-10)

Locked earlier as place (grounds). Trial now: three licensed trophy stills as
different perspectives on the same haul — celebration → lift → parade.

| Knot | Label | File | Why |
|------|-------|------|-----|
| 16 May | Premier League | Seán Murray PL title celebration, cropped (CC BY-SA 2.0) | Squad + Premier League trophy at OT |
| 22 May | FA Cup | Michael Cairns FA Cup presentation (CC BY 2.0), Keane-podium crop | Captain lifts the Cup |
| after | Champions League | Seán Murray open-top bus (CC BY-SA 2.0) | All three trophies — no Commons Camp Nou European Cup lift exists; parade stands in for the haul |

Stadium exteriors and the single Camp Nou climax still remain in
`data/canonical/journey-place-media.json` / `public/media/journey/` as
alternatives (`atmosphere="places"` vs `"climax"`). Flip the record set to
restore grounds.

### Stage sketch (beat 0 — unchanged geometry)

```
1886 ──────────────────────────●──── now
                              ╱ ╲
                          return  depart (May '99)
                            ╲      ╱
                             pocket        ghost "99" + monument (A/B/C)
                          ●    ●    ●
                        16 May 22 May 26 May   ← gold knots land in sequence
                         foot: 33 without defeat
```

- Same skeleton as `RhymeMorph`: sticky stage ~210vh, one SVG, scroll-owned
  progress, `prefers-reduced-motion` lands the finished pocket. Kicker
  "Red Thread / 02".
- Axis, pocket, three date knots — as built. Monument is additive atmosphere
  behind / beside the ghost "99", not a second motion system.
- Morph still owns all motion; beats below stay static (no scroll-reveal).

### Bench latency viz (beat 1 — new, journey-local)

The chapter's equivalent of `emphasisSeason` / `featuredIds`: a story prop the
question page does not lead with.

```
  Cole        on 46′ ────────● scored 48′     (2′)
  Sheringham  on  9′ ────────● scored 11′     (2′)
  Barcelona   on 67′ / 81′ ──●──● 90+1 / 90+3  (both from the bench)
```

- Prefer a small SVG / composition in `components/journey/` over a dashboard
  chart. Reuse gold knots + devil-bright thread language from the stage.
- Data from existing `subGoals()` — no new ingest.
- Do **not** invent a general-purpose chart type for the whole app in this pass
  (out of scope still holds); a journey-local composition is fine.

### Out of scope

Homepage/packaging beyond door cross-links; general-purpose new chart types for
`/questions` or `/seasons`; touching the pilot's beats; treble player pages;
sizzle; pasting Cole / Sheringham / Solskjær as a portrait duel; stuffing
semi-finals + competition WDL into the journey (that is the question's job).

### Status

**2026-07-09 — first build** shipped to the calendar beat sheet (spine + three
`DeciderCard`s + door into the question). Morph, shared skeleton
(`useJourneyStage`, `stageMath`), golden tests, and `JourneyChapterNav` remain
good.

**2026-07-09 — beat sheet revised** to the discovery arc; **stage monument
locked to A (place)**.

**2026-07-09 — discovery rebuild shipped** to this sheet:

1. Stage place monuments (Commons stills + place labels on knots) + unbeaten
   foot-fact on morph land.
2. Beat 1 `BenchLatency` (`components/journey/BenchLatency.tsx`) from `subGoals` ×3.
3. Beats collapsed: no full `ResultSpine`; no Newcastle `MatchFlow`; Spurs is the
   single pre-climax receipt; Barcelona teamsheet remains the jolt.
4. Door primary → `/seasons/1998-99`; question secondary ("The full answer →").
5. Fact pins in `tests/journey.test.ts` unchanged (still cover all three nights).

**2026-07-10 — trophy-perspective stage trial** (atmosphere stills flipped from
grounds to celebration → lift → parade). Structure unchanged.

**2026-07-10 — manner-first pass shipped (levers A + C + D):**

1. Morph inverted: season → **three must-wins** → **all three from the bench**;
   haul is a quiet foot-fact (`3 trophies.`). Unbeaten tail leaves the morph.
2. Door recaps the stack: "Three must-wins. Two from behind. All three from the
   bench."
3. `trailingBoard()` above Spurs/Bayern `MatchFlow` — `0–1 after 26′` /
   `0–1 at 90′`; Newcastle null. Final score demoted from gold in the card header.
4. Packaging stance locked in §3: standalone `/stories/[slug]`, with `/stories`
   as its primary shelf and permanent redirects from `/journey*`; stitched
   time-journey later. Lever **E** was resolved below.

### Why the astonishment was missing — and what A/C/D changed (2026-07-10)

The discovery rebuild fixed *structure* (one lens per beat, unique viz, season
door). It did not fix *register*: the chapter opened on the haul ("Three
trophies") and left must-win / from-behind unstaged, so the known myth
overshadowed the manner.

**The wound (held):** three must-wins back to back, two from behind, all three
decided by substitutes — memorable details easily forgotten because the
achievement itself overshadows them. Copy discipline forbids intensifiers;
astonishment has to come from which facts get staged, in which order.

**What shipped against it:**

| Layer | Before | After (A/C/D) |
|-------|--------|----------------|
| Beat 0 land | "Three trophies." | **"All three, from the bench."** (stakes mid-phase: "Three must-wins.") |
| Beat 0 foot | 33 without defeat | **3 trophies** (haul as quiet consequence) |
| Beat 2 | "won from behind" in copy only | Trailing board **"0–1 after 26′"** above the flow |
| Beat 3 | Trailing-at-90 in sub-copy only | Trailing board **"0–1 at 90′"** above the flow |
| Beat 4 | "Eleven days. Three trophies." | **"Three must-wins. Two from behind. All three from the bench."** |

**The stack** (each row DB-derivable or pinned):

1. **Three must-wins in eleven days** — final day / Cup final / European final.
2. **Two of them won from behind** — Spurs after 26′; Bayern at 90′. Newcastle was not.
3. **All three decided by a substitute** — Cole / Sheringham / Sheringham + Solskjær.
4. **The latency** — Cole and Sheringham within two minutes (`BenchLatency`).
5. **The English first** — frame only; do not lead with it (same overshadow risk).

**Lever E — resolved not to claim.** Establishing that this manner is unique
across English football would need a cross-club, cross-competition source and a
definition of "must-win" outside Red Thread's data contract. That would weaken
the chapter's evidence discipline. The story keeps the specific, fully
derivable stack and makes no uniqueness claim. Reader response is now ordinary
post-release product feedback, not a gate for publishing the finished chapter.

### Decision log (2026-07-10) — levers A + C + D

| # | Lever | Status |
|---|-------|--------|
| **A. Invert the morph** | **Shipped** — `TrebleSpinoff` copy phases |
| **B. Stage the stack under the myth** | Declined (A chosen) |
| **C. Scoreline-before-winner** | **Shipped** — `trailingBoard()` |
| **D. Door as stack** | **Shipped** with A |
| **E. Uniqueness of manner** | **Declined** — no claim without an evidence-complete cross-club comparison |

Morph copy phases:

```
1998–99.                    →  Three must-wins.              →  All three, from the bench.
Sixty-three games.          →  Final day. Cup final.           →  (dates on knots)
                               European final.
foot after land: Three trophies.
```

Trailing boards:

```
Spurs   0–1 after 26′     (first deficit; leveled before HT)
Bayern  0–1 at 90′        (still behind at the regulation whistle)
```

**North star, locked:** Treble = a singular eleven-day pocket where **three
must-wins were decided by the bench — two of them from behind** — and the
trophies are what followed. The haul is the consequence; the manner is the
story.

---

## 4c. Chapter 3 — Fortress OT (the spin-off, place)

The third chapter. Same metaphor verb as the Treble (spin-off), different
shape: not an eleven-day campaign pocket, but a **place pocket** — Old Trafford
as the ground where one rule has held for four decades. It is published at
`/stories/fortress-ot` (`noindex`) with light chapter cross-links. Chapters 1–2
stay untouched.

### The facts (verified in the record, 2026-07-10)

Slice: Old Trafford home *league* games United led at half-time, half-time
reconstructed from minute-stamped events (`leadHeldAtHome()`). Coverage is the
verifiable sample (every goal has a minute; reconstructed FT matches the row) —
not Opta's complete half-time ledger. Opta cites **400** unbeaten back to
August 1984 (W365 D35); our sample's post-Ipswich tail is **395** (W360 D35).

| Fact | Value | Source |
|------|-------|--------|
| Last lead lost at HT | **7 May 1984** — Ipswich Town **1–2** (HT 1–0). Hughes 25′; d'Avray 47′; Sunderland 86′ | `leadHeldAtHome` + `match_events` |
| Unbeaten since (sample) | **395** home league games led at the break — **360W 35D 0L** | `leadHeldAtHome` (games after Ipswich → present) |
| Lead surrendered (draws) | **35** draws in the run — the gold hollow dots | `result === "D"` |
| Fell *behind* after leading | **Only 3** in the whole run — all rescued to draws | `worst < 0` |
| The three cracks | Spurs **3–3** (7 Dec 1986, HT 2–0) · Wednesday **2–2** (9 Dec 1995, HT 1–0) · Bournemouth **4–4** (15 Dec 2025, HT 2–1) | receipts |
| Held clean | **330 / 395** never even went level after the break | `riskMinute == null` |
| All-time sample | 833 led-at-HT games, 1910–2026: 723W 92D **18L** (last L = Ipswich) | `leadHeldAtHome` |

The three-cracks count is the chapter's rising fact — the discovery even a fan
who knows "fortress OT" hasn't seen stated. It plays the role "all three from
the bench" played in the Treble and "each scored in the final" played in the
pilot. The **395 / never lost** is the haul; the manner is **fallen behind only
three times, and the point held**.

### Why not ship the question page as a journey

`/questions/fortress` already leads with the unbeaten-run hero + full
`LeadHeldDotplot` + top-5 close-call `MatchFlow`s + decade win-rate bars. A
journey that opens on the wall and walks the same close calls is a chrome-off
trailer (the wound §4b named). Rules carried forward:

- **One lens per beat** — do not repeat `MatchFlow` three times as the arc.
- **Unique through-line viz** — the three cracks, not the full wall as beat 1
  (the wall is the question's lead chart; journey borrows it later or at the door).
- **Rising information** — hinge → rule → cracks, or rule → cracks → hinge;
  not "here's a big number, then five similar nights."
- **Door into the living product** — primary `/matches?venue=H` (or a home
  filter that keeps the fortress slice honest); `/questions/fortress` secondary.
- **Place, not portrait duel** — Old Trafford is the monument; no player faces.

### Beat sheet (proposed — manner-first, three cracks)

Order of *revelation*. Five beats (0–4). Each beat below the morph uses a
**different** graphic shape.

| Beat | Graphic (surface showcased) | Headline | Sub / evidence | Source pointer |
|------|------------------------------|----------|----------------|----------------|
| **0. The spin-off** | `FortressSpinoff` — axis, OT place pocket, three gold crack-knots land late | "Old Trafford." → **"Led at half-time."** → **"Fallen behind only three times."** | "Home. League." → **"Since May 1984."** → crack dates as knots land. Foot after land: **"Never lost."** (haul as quiet consequence — manner owns the land) | — |
| **1. The rhyme** | **Three cracks** — one compact composition: the only nights the lead went negative *(chapter-unique; question page never isolates this trio)* | "In four decades, **fallen behind only three times.**" | "Spurs 3–3. Wednesday 2–2. Bournemouth 4–4. All drew." | Quiet; receipts wait for beats 2–3 |
| **2. One night** | `MatchFlow` + trailing board when behind *(showcases `/match`; only full single-night receipt before the hinge)* | "December 2025: **led at the break, fell behind, drew 4–4.**" | Board for the moment United went behind; then the rescue. | Bournemouth receipt |
| **3. The hinge** | `MatchFlow` — Ipswich 1984, the last defeat *(new shape vs beat 2: the night the rule broke, not a crack that held)* | "May 1984: the last time the lead was **actually lost.**" | "Hughes 25. d'Avray 47. Sunderland 86. 1–2." | Ipswich receipt |
| **4. The door** | Quiet exit + `LeadHeldDotplot` as the living wall *(honest reuse at the hand-off, not as the opening lens)* | **"Three cracks. Zero defeats."** | "395 games led at half-time since Ipswich. Now walk every home night." | **Primary:** `Every home match →` (`/matches?venue=H`); three crack receipts + Ipswich. **Secondary:** the full answer (`/questions/fortress`). Chapter cross-links. |

**Rising information (must hold):**

1. Pocket names the place, then the rule (led at HT), then lands on **fallen
   behind only three times** (manner). "Never lost" / 395 is a foot-fact.
2. Beat 1 deepens the three cracks as one rhyme — scores only; flow withheld.
3. Beat 2 shows one crack in full — the most recent — so `/match` earns its place.
4. Beat 3 is a **new shape**: the hinge defeat that started the run. Not another
   surrendered draw.
5. Door recaps the stack (three cracks · zero defeats), shows the wall, opens
   home matches (question optional).

**Coverage honesty (copy must carry):** the sample is minute-complete games, not
Opta's 400. Prefer "in every verifiable home league game led at the break" / "in
our record since Ipswich" over a naked "400". Foot-fact can nod at Opta's figure
once if needed; do not lead with it.

### Stage sketch (beat 0)

```
1886 ──────────────────────────●──── now
                              ╱ ╲
                          return  depart (OT / led at HT)
                            ╲      ╱
                             pocket        ghost "OT" + place monument
                          ●    ●    ●
                       Dec '86  Dec '95  Dec '25   ← three crack knots
                         foot: Never lost. (395)
```

- Same skeleton as `TrebleSpinoff` / `RhymeMorph`: sticky ~210vh, one SVG,
  scroll-owned progress, `prefers-reduced-motion` lands the finished pocket.
  Kicker "Red Thread / 03".
- Morph owns all motion; beats below stay static.
- Monument: Old Trafford exterior / floodlit bowl (place), not a player duel.
  Reuse journey place-media pipeline if a still exists; otherwise type + thread
  until a licensed still is cached.

### Three-cracks viz (beat 1 — journey-local)

```
  Spurs        0′ ──●──●── HT ──●──●──●╲●── FT     (every goal; crack at 73′)
  Wednesday    0′ ──●────── HT ──●──●╲●──── FT
  Bournemouth  0′ ──●──●──● HT ──●╲●──●──●── FT
```

- SVG filament per night: full-match **margin thread** (step path). Gold knots =
  United goals; pale = opponent; devil-bright flare = first negative margin.
  Shared clock (0→90) and margin scales so the three nights rhyme. HT/FT marks.
- Data from `matchReceipt` goals × `fortressRun()` cracks — no new ingest.
- Do **not** invent a general-purpose chart type for the whole app in this pass.

### Out of scope

Homepage/packaging beyond door cross-links; decade win-rate bars (question's
job); general-purpose new chart types; touching chapters 1–2; opening on the
full `LeadHeldDotplot` as beat 1; Opta-complete half-time backfill; player
portrait duel.

### Status

**2026-07-10 — beat sheet locked; first build shipped** to `/stories/fortress-ot`:

1. `FortressSpinoff` — place pocket, OT monument, three crack knots; manner-first
   copy (place → led at HT → fallen behind only three times); foot "Never lost."
2. Beat 1 `ThreeCracks` — HT → fell behind → drew across Spurs / Wednesday /
   Bournemouth.
3. Beat 2 Bournemouth `MatchFlow` + trailing board `2–3 after 52′`.
4. Beat 3 Ipswich hinge — the last lead lost.
5. Door: `LeadHeldDotplot` (cracks haloed) + primary `/matches?venue=H`; question
   secondary. Chapter nav includes 03.

**Alternative held (not recommended):** hinge-first — morph lands on Ipswich
1984, then the wall, then close calls. Stronger narrative open, weaker discovery
(the myth already knows "since the mid-80s"; it does not know "behind only
three times").

### North star, locked

Fortress = a place pocket at Old Trafford where **led at half-time has meant
unbeaten for four decades — and in that run United have fallen behind only
three times, each rescued to a draw.** The 395 / never-lost is the consequence;
the three cracks are the story.

---

## 5. Later chapters (sketch only — do not build yet)

Ordered by how cleanly they reuse existing surfaces:

| Chapter | Metaphor verb | Reuse |
|---------|---------------|--------|
| ~~Treble 1998–99~~ | Spin-off | **Manner-first pass live (A/C/D) — see §4b** |
| ~~Fortress OT~~ | Spin-off (place) | **Manner-first first build — see §4c** |
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

**Status (2026-07-10):** the **multi-beat arc is built and polished** at
`/stories/two-no-7s`.
The flat single-fact version is gone: the morph carries the shirt rhyme (beat 0),
then three stations each reuse a different app surface carrying a *new* rhyming
fact — the peak (`CareerDuelChart`, season 5 emphasised), the cup
(`EuropeFinalsTimeline`, '68/'08 featured), the goal (`MatchFlow` +
`FormationPitch` with scorer focus) — each with a quiet source pointer into the
living product, before the door into `/compare` and the two receipts (beat 4).
Information rises, so the copy states facts instead of manufacturing suspense.

- (2) thread metaphor reads in one pass — the loop through the No. 7, portrait
  monuments, then underline anchors on each headline phrase. ✓
- (3) exits into `/compare` (+ 1968/2008 receipts) without feeling unfinished;
  beats 1–3 also link to their source surfaces en route. ✓
- (4) reduced motion lands the morph state; beats 1–4 are always visible. ✓
- (5) one visual language — reused charts bring their own axes (honest showcase),
  floodlit dressing stays around them; source links use the same knot register. ✓
- (1) — the season-5 jolt — is shown (emphasis band + aligned peak dots) and
  re-staked on the trophy/goal climax. It is ready for normal reader feedback;
  it is no longer a packaging gate.

---

## 8. Implementation location

- Doc: this file (`docs/JOURNEY.md`)
- Shelf: `/stories` — the primary-navigation entry point above Explore.
- Routes: `/stories/two-no-7s` (chapter 1, the loop),
  `/stories/eleven-days-in-may` (chapter 2, the spin-off campaign), and
  `/stories/fortress-ot` (chapter 3, the place spin-off) — all `noindex` and
  chrome-off via the root-layout pre-paint script. `/journey`,
  `/journey/treble`, and `/journey/fortress` permanently redirect to their
  corresponding canonical story. The stitched time-journey remains later.
- Chapter 1 beat 0 (opening morph): `components/journey/RhymeMorph.tsx`
- Chapter 2 beat 0 (spin-off pocket): `components/journey/TrebleSpinoff.tsx`
  — discovery arc (place monuments → bench latency → Spurs → Barcelona teamsheet
  → season door); place stills from `data/canonical/journey-place-media.json`
  via `scripts/cache-journey-places.ts`
- Chapter 2 beat 1 (bench latency): `components/journey/BenchLatency.tsx`
- Chapter 3 beat 0 (place pocket): `components/journey/FortressSpinoff.tsx`
  — OT monument (`public/media/journey/old-trafford.webp`) → three cracks →
  Bournemouth night → Ipswich hinge → wall + home-matches door
- Chapter 3 beat 1 (three cracks): `components/journey/ThreeCracks.tsx`
- Shared stage skeleton: `components/journey/useJourneyStage.ts` (chrome-off +
  reduced-motion + scroll progress), `components/journey/stageMath.ts`
- Station beats (headline frame + source pointers): `components/journey/JourneyBeat.tsx`
  — exports `JourneyThreadAnchor`, `JourneySourceLink`
- Chapter cross-links: `components/journey/JourneyChapterNav.tsx` over
  `JOURNEY_CHAPTERS` (`lib/journey.ts`)
- Receipt data (`MatchFlow` + `FormationPitch`/`Bench` props for any match):
  `lib/journey.ts` (`matchReceipt`, `subGoals`, `unbeatenTail`, `trailingBoard`,
  `fortressRun`), mirroring `app/match/[id]/page.tsx`; chapter facts golden-pinned
  in `tests/journey.test.ts`
- Journey portraits: `scripts/cache-journey-portraits.ts` → `public/media/journey/`
  (chapter 1 only; chapter 2 refuses a portrait duel)
- Reused surfaces (extended, not forked): `CareerDuelChartLazy`
  (`emphasisSeason`, `showTooltip`), `EuropeFinalsTimeline` (`featuredIds`),
  `MatchFlow` + `FormationPitch` (`focusPlayerIds`); chapter 2 adds journey-local
  `BenchLatency` + `trailingBoard` (not general-purpose charts)
- Styles: `html[data-chrome="off"]`, `.journey-floodlit`, `.journey-thread-anchor`
  in `app/globals.css`
- Data: `comparePlayers("cristiano-ronaldo", "george-best")` + `europeanFinals()`
  (filtered to the premier trophy) + `finalReceipt` over `1968-05-29-benfica-n`
  and `2008-05-21-chelsea-n` (`match_events`, `match_lineups`) — no new ingest.

**Shipped 2026-07-09** — branch `cursor/journey-ronaldo-best-morph`:

| Phase | What landed |
|-------|-------------|
| Prototype | Scroll morph, chrome-free stage, looping filament (`272234e` → `dc8e17c`) |
| Multi-beat arc | Beats 1–4 with reused surfaces, `finalReceipt`, noindex route (`09b3716` → `87a2314`) |
| Polish | Floodlit field, portrait monuments, thread anchors, alternating beats, chart emphasis/focus props, source pointers, `familyName()` (`d715ac4` onward + final commit) |

Once the arc clears criterion (1) with a real nostalgist, graduate durable
decisions into `DESIGN.md` / `PRODUCT.md` and decide packaging (§3).
