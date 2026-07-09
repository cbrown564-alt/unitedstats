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

### Stations (pilot)

| # | Beat | Visual | Copy job |
|---|------|--------|----------|
| 0 | Setup | Names, No. 7, years on the club axis | Two legends, one shirt |
| 1 | Distance | `CompareCareerTimeline`-class rails | Forty years between them |
| 2 | Loop + morph | Scroll-driven SVG: loop thread → axis collapse | History rhymes |
| 3 | Door | Link to `/compare?mode=players&a=cristiano-ronaldo&b=george-best` | See the full duel |

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

---

## 8. Prototype location

- Doc: this file (`docs/JOURNEY.md`)
- Route: `/journey` (prototype, `noindex`)
- Morph stage: `components/journey/RhymeMorph.tsx`
- Data: existing `comparePlayers("cristiano-ronaldo", "george-best")` — no new
  ingest

When the pilot settles, graduate durable decisions into `DESIGN.md` / `PRODUCT.md`
and decide packaging (§3).
