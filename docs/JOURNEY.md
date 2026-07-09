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

### The fact (verified in the record)

| | George Best | Cristiano Ronaldo |
|--|-------------|-------------------|
| Peak United season (goals) | **5th** — 1967–68 (32 in 53) | **5th** — 2007–08 (42 in 49) |
| Calendar peak year | **1968** | **2008** |
| Gap | **40 years** | |

Both No. 7s. Same career-season index. Generations apart. This is the product's
canonical deepening example (`CONTEXT.md` §2; `PRODUCT.md` core promise).

### Why the wow needs the morph

A static dual chart already exists on `/compare`. The journey's job is to *make
the rhyme felt* — as a **floodlit stage**, not a chart panel:

1. **Distance** — two ghosted years (1968 / 2008) on opposite wings; names as
   presence; the gap is atmospheric.
2. **Loop** — a luminous red filament draws from Best's knot and *touches*
   Ronaldo's: history looping back.
3. **Collapse** — the years drift inward; the shared “fifth” becomes the centre.
4. **Land** — goal monuments (32 / 42), one authored line, door to full compare.

**Anti-pattern:** axes, tick marks, progress %, bordered cards, bar charts on
the stage. Those belong on `/compare`. The journey borrows TonightHero's
register (light, type, thread) — if it reads as a dashboard, it failed.

Without the morph, this is "another compare page." With it, the metaphor *is*
the insight.

### Stations (shipped — 2026-07-09)

Scroll drives one sticky stage (`RhymeMorph`); progress `0→1` over a `360vh`
runway. Phase windows overlap so beats cross-fade rather than cut.

| # | Progress | Line / sub | Visual |
|---|----------|------------|--------|
| 0 | 0–0.22 | "Same shirt. Same number." / "Two No. 7s, forty years apart at opposite ends of United's story." | Crisp floodlit peak years (1968 / 2008) on opposite wings; ghosted No. 7 monument; thread dormant |
| 1 | 0.12–0.52 | "Two peaks. One shape." / "The years don't match — but something does." | Luminous filament draws a **full loop through the No. 7**, a tail dropping to each era's knot |
| 2 | 0.44–0.74 | "Counted from his debut, each man's fifth year was his best." / "A career step, not a calendar year…" | Loop tightens toward the monument; years fade out *before* the knots converge |
| 3 | 0.70–0.92 | "Both peaked in season five." / "32 in 53 games. 42 in 49. Different eras, same step." | Rhyme knot pulses gold; 32 / 42; floodlit "Open the full duel" + "what else rhymes?" teaser |

The remaining `0.92→1` runway holds the landed state so the door can be read.

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

**Status (2026-07-09):** shipped on `/journey`. 2–5 hold in build review
(screenshots in `output/screenshots/journey-*`); (1) — the jolt — still needs a
real nostalgist, not self-review. That's the next validation, before chapter 2.

---

## 8. Prototype location

- Doc: this file (`docs/JOURNEY.md`)
- Route: `/journey` (prototype, `noindex`) — `app/journey/page.tsx` also emits the
  pre-paint `data-chrome="off"` script and passes `peakGames`
- Morph stage: `components/journey/RhymeMorph.tsx`
- Chrome-off rules: `html[data-chrome="off"]` block in `app/globals.css`
- Data: existing `comparePlayers("cristiano-ronaldo", "george-best")` — no new
  ingest (peak season, goals, and `apps` all already in `CareerSeason`)

**Shipped 2026-07-09** (commits `272234e` → `09b3716` → `dc8e17c` → `d715ac4`):
chrome-free stage, real loop through the No. 7, crisp floodlit years, refined
equal-tone names, honest 32/42, rhyme-knot pulse, reduced-motion still, floodlit
duel door + chapter-2 teaser, no-flash chrome.

When the pilot settles, graduate durable decisions into `DESIGN.md` / `PRODUCT.md`
and decide packaging (§3).
