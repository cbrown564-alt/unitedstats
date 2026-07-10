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
that leaves the main axis into its own pocket, then returns. Packaging per the
user's call: **sibling route** (`/journey/treble`, `noindex`) + a light chapter
cross-link on both doors; the pilot's arc is signed off and stays untouched.

### The facts (verified in the record, 2026-07-09)

| Fact | Value | Source |
|------|-------|--------|
| Three trophies in eleven days | 16 May (PL, Spurs 2–1) · 22 May (FA Cup, Newcastle 2–0) · 26 May (CL, Bayern 2–1) | `matches`, season `1998-99` |
| Season shape | 63 official games, 36W 22D 5L, 128 GF | `matches` (no unofficial games that season) |
| No defeat after 19 December | 33 games unbeaten to the end — 23W 10D (last loss: Middlesbrough h, 2–3) | `matches` |
| The title, from behind | Ferdinand 26′ → Beckham 43′, **Cole 48′ — on at half-time (46′)** | `match_events` + `match_lineups.sub_on` |
| The Cup, from the bench | **Sheringham on 9′, scored 11′**; Scholes 52′ | `match_events` + `sub_on` |
| The climax | Basler 6′; trailing at 90 — **Sheringham 90+1′ (on 67′), Solskjær 90+3′ (on 81′)**. Neither started | `match_events`, `match_lineups` (`started=0`) |
| The through-line | **In all three deciders, a substitute scored** — Cole and Sheringham each two minutes after coming on | derived from the above |

The bench through-line is the chapter's rising fact — the discovery even a fan
who knows the Treble hasn't seen stated: not just three trophies, but a
substitute on the scoresheet in every decider, twice within two minutes of
coming on. It plays the role "each scored in the final" played in the pilot.

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
  doesn't lose the side-by-side with `/journey`.

North star: **Two No. 7s** = history rhymes across forty years, three product
lenses. **Treble** = a singular eleven-day pocket where **the bench wrote the
ending** — one morph, one unique through-line viz, one unforgettable teamsheet —
then out into the season.

### Beat sheet (revised — discovery arc)

Order of *revelation*, not calendar. Five beats (0–4), matching the pilot's
count. Each beat below the morph uses a **different** graphic shape.

| Beat | Graphic (surface showcased) | Headline | Sub / evidence | Source pointer |
|------|------------------------------|----------|----------------|----------------|
| **0. The spin-off** | `TrebleSpinoff` — axis, pocket, three gold knots; **plus a stage monument** (open — see below) | "1998–99." → "The last eleven days." → "Three trophies." | "Sixty-three games." → "The 16th. The 22nd. The 26th." → "Premier League. FA Cup. Champions League." Foot fact after land: **"33 without defeat"** (unbeaten tail absorbed here — no dedicated spine beat) | — |
| **1. The rhyme** | **Bench latency** — one compact on→score clock across all three nights *(the chapter's unique viz; questions/treble never foregrounds this)* | "In every decider, **a substitute scored.**" | "Cole, on 46′, scored 48′. Sheringham, on 9′, scored 11′. Then Barcelona — both from the bench." | Season `1998–99` (context) or quiet; receipts wait for beats 2–3 |
| **2. One night** | `MatchFlow` + Cole-focused `FormationPitch` — the title from behind *(showcases `/match`; only full single-night receipt before the climax)* | "Day one: the title, **won from behind.**" | "Ferdinand 26′. Beckham 43′. Cole — on at half-time — 48′." | 16 May receipt |
| **3. The jolt** | `MatchFlow` + `FormationPitch` + `Bench` — XI carries **no goal marks**; both ⚽ sit on the bench rows *(proof, not assertion)* | "Day eleven: **both goals came off the bench.**" | "Basler on 6. Ninety minutes gone — Sheringham 90+1 (on 67′), Solskjær 90+3 (on 81′)." | 26 May receipt |
| **4. The door** | Quiet exit | "Eleven days. Three trophies." | "In all three, a substitute scored." | **Primary:** `Season 1998–99 →` (`/seasons/1998-99`); three receipts. **Secondary:** the full answer (`/questions/treble`). Chapter cross-links. |

**What was cut from the shipped sheet**

| Cut | Why |
|-----|-----|
| Full-season `ResultSpine` as its own beat | Same lead chart as `/questions/treble`. Unbeaten run becomes a morph foot-fact + door into `/seasons`. |
| Day-seven `MatchFlow` (Newcastle) as a full beat | Third identical lens. The Cup final still appears in beat 1's latency clock (Sheringham 9′→11′); the receipt stays on the door. |
| Primary CTA → `/questions/treble` | Replica signal. Season page is the living surface; the question is optional depth. |

**Rising information (must hold):**

1. Pocket names the eleven days and three trophies (known myth).
2. Beat 1 states the *hidden* rhyme — sub on the scoresheet in every decider, with
   the two-minute latency visible for Cole and Sheringham; Barcelona withheld as
   detail (names only, or "both from the bench").
3. Beat 2 shows one night in full — the title from behind — so `/match` earns its
   place before the climax.
4. Beat 3 is a **new shape**: teamsheet proof. Empty starter marks + bench ⚽.
   This is the jolt neither previous beat telegraphed visually.
5. Door opens the season (and quietly the question).

Copy discipline unchanged: no manufactured mystery, every line a fact/date/measure,
`tests/journey.test.ts` still golden-pins the numbers. Day-seven Newcastle copy
moves into the latency beat and the door receipts — it is not deleted from the
record, only from the beat count.

### Stage monument — **A. Place** (locked 2026-07-09)

No Best/Ronaldo-style portrait duel. The spin-off needs *weight*, not a second
loop. **Chosen: place** — Old Trafford · Wembley · Camp Nou land with the three
gold knots (time + place per §2).

Treatment: licensed Commons stills, heavily treated (grayscale + red wash +
edge masks) — the same monument register as chapter 1's portraits, not match
photography and not a badge strip. Manifest:
`data/canonical/journey-place-media.json`; cache via
`scripts/cache-journey-places.ts` → `public/media/journey/{old-trafford,wembley,camp-nou}.webp`.

| Ground | File | Why this one |
|--------|------|--------------|
| Old Trafford | Arne Müseler aerial (CC BY-SA 3.0 de) | Clear bowl identity at monument scale |
| Wembley | Twin Towers, **5 June 1999** (public domain) | The ground that hosted the Cup final — not the post-2007 arch |
| Camp Nou | Kieran Lynam, 2008 (CC BY 2.0) | Pre-rebuild bowl; avoids modern Qatar branding |

Each place name fades in with its knot; at land the stills sit as quiet
atmosphere behind the pocket. Quiet Commons attribution lives in the manifest
(same pattern as player-media). Do not ship three named player portraits.

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

---

## 5. Later chapters (sketch only — do not build yet)

Ordered by how cleanly they reuse existing surfaces:

| Chapter | Metaphor verb | Reuse |
|---------|---------------|--------|
| ~~Treble 1998–99~~ | Spin-off | **Discovery rebuild live — see §4b** |
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

**Status (2026-07-09):** the **multi-beat arc is built and polished** on `/journey`.
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
- (1) — the season-5 jolt — is now *shown* (emphasis band + aligned peak dots)
  and re-staked on the trophy/goal climax; still **awaits a real nostalgist**.

---

## 8. Prototype location

- Doc: this file (`docs/JOURNEY.md`)
- Routes: `/journey` (chapter 1, the loop) and `/journey/treble` (chapter 2, the
  spin-off) — both prototype, `noindex`, chrome-off via the pre-paint script
- Chapter 1 beat 0 (opening morph): `components/journey/RhymeMorph.tsx`
- Chapter 2 beat 0 (spin-off pocket): `components/journey/TrebleSpinoff.tsx`
  — discovery arc (place monuments → bench latency → Spurs → Barcelona teamsheet
  → season door); place stills from `data/canonical/journey-place-media.json`
  via `scripts/cache-journey-places.ts`
- Chapter 2 beat 1 (bench latency): `components/journey/BenchLatency.tsx`
- Shared stage skeleton: `components/journey/useJourneyStage.ts` (chrome-off +
  reduced-motion + scroll progress), `components/journey/stageMath.ts`
- Station beats (headline frame + source pointers): `components/journey/JourneyBeat.tsx`
  — exports `JourneyThreadAnchor`, `JourneySourceLink`
- Chapter cross-links: `components/journey/JourneyChapterNav.tsx` over
  `JOURNEY_CHAPTERS` (`lib/journey.ts`)
- Receipt data (`MatchFlow` + `FormationPitch`/`Bench` props for any match):
  `lib/journey.ts` (`matchReceipt`, `subGoals`, `unbeatenTail`), mirroring
  `app/match/[id]/page.tsx`; chapter facts golden-pinned in `tests/journey.test.ts`
- Journey portraits: `scripts/cache-journey-portraits.ts` → `public/media/journey/`
  (chapter 1 only; chapter 2 refuses a portrait duel)
- Reused surfaces (extended, not forked): `CareerDuelChartLazy`
  (`emphasisSeason`, `showTooltip`), `EuropeFinalsTimeline` (`featuredIds`),
  `MatchFlow` + `FormationPitch` (`focusPlayerIds`); chapter 2 rebuild adds a
  journey-local bench-latency composition (not a general-purpose chart)
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
