# HOMEPAGE — the front door

The home page has one job, and it is the whole job: **fire the first-contact
spark.** This doc is the working record of what we've built toward that, why,
what's still wanted, and the open problems we need to figure out. It is a design
diary, not a spec — when decisions settle they graduate into `DESIGN.md` /
`PRODUCT.md`.

Read alongside: `CONTEXT.md` §6 (the spark is the gate), `DESIGN.md` (visual
language, copy voice), and the memory note `first-contact-spark-built`.

---

## 1. The job

From `CONTEXT.md` §6: *the front door **is** the gate.* Its entire purpose is to
make a fan feel something in the first five seconds that the live-score apps
(FotMob, SofaScore) structurally can't — the nostalgic jolt. No spark → no return
visit, no word of mouth. So the home page does **not** lead with scope, search, or
a question field (the old answer-first frame, now superseded). It leads with a
single **served match-night**: a real night, chosen *for* you, rendered to land
whether you lived it, forgot it, or never saw it (the three modes of the
nostalgist — return / rediscover / get-close-to).

**Done = depth, not reach:** the moment lands for one nostalgist, reliably. Reach
is a consequence, never the target.

---

## 2. What's built, and why

### The engine — `lib/greatNights.ts`

Picks the night and guarantees a spark on every load. Two tiers:

1. **On this day** — if the day's most significant match clears an *intrinsic-drama*
   floor (a final/semi, a half-time comeback overturned, or a stoppage-time
   winner), it leads, framed to the calendar. This is the thing FotMob can't show.
2. **A curated pool** — otherwise the lead is dealt from `CURATED_NIGHTS`, a
   hand-trimmed set of canonical nights, each with one authored "stakes" line.
   `Another night` re-rolls this pool in place (shuffle-bag, client-side).

Decisions worth remembering:

- **A rout is not an on-this-day qualifier.** A rout's spark value depends on the
  opponent (8–2 Arsenal yes, 5–0 Burton no), which can't be judged cheaply or
  honestly — so notable routs live in the *curated* pool, vouched for by hand.
- **A curated night lights up on its own anniversary** with the on-this-day pulse,
  bypassing the floor (it's hand-vouched). Checked against the pool's dates, not
  just `onThisDay`'s single pick, so the 4–3 derby leads on its day even when a
  bigger match shares the date.
- **Tone keys off `outcome`, not `result`** — Moscow 2008 (1–1, won on penalties)
  reads as a win.
- **The Busby Babes' final fortnight is excluded** (the Red Star legs, Highbury,
  the 7–2 Bolton) — a context-free serendipity spark would land wrong; the Babes
  belong in an authored frame, not the slot machine.
- **Selection is deterministic** (day-of-year), never behavioural — the static
  guardrail. Server-rendered, so the spark fires before JS; the re-roll is the only
  client layer. `tests/great-nights.test.ts` pins these promises (every curated
  night resolves; never opens on a defeat or a Munich match; deterministic).

The curated pool (~20 nights) spans 1948→2024 — European glory, finals, league
drama, and four modern nights (8–2 Arsenal, the 2009 Owen derby, 2019 at PSG,
2013 RVP/Villa). **Stakes lines are first drafts** and carry the emotional lead, so
they're worth real editorial attention. Bootstrap/re-seed with
`scripts/bootstrap-great-nights.ts`.

### The hero — `components/TonightHero.tsx`

Built to look like **nothing else on the site** (the front door can't be a panel
among panels). The current composition:

- **Not a card.** Bleeds past the content column to the page edges, flush under the
  header — a floodlit black stage, not a bordered panel. No `hero-grid`.
- **Atmosphere from light, not texture:** a floodlight bloom from above, a red wash
  by the thread, a vignette sinking the edges to black.
- **The Red Thread, made literal:** a luminous spine down the left holding the night
  at a glowing gold knot, bleeding off the top and foot.
- **A monument on the right:** currently the ghosted **year** (see §4 — this is
  where a faded image was meant to go).
- **Story-first:** a strong kicker (`1999 · A PIECE OF UNITED HISTORY`), the
  authored line as the large editorial lead, then **the match given real
  presence** — full scoreline with the score in gold, and the **goalscorers with
  their minutes** (Sheringham 90+1', Solskjær 90+3'), the line a fan recites from
  memory. The scorers were the fix for "the match feels lifeless."
- Nothing interrupts the foot of the stage: the `Another night` re-roll and the
  personal-door `EntryChips` steer were removed so the thread flows straight on
  into the foundation beat below.
- The skyline + scope + search that used to lead are now the **foundation beat**
  below it (`CONTEXT.md` §2 — why the jolt is honest, why you stay).

### The rediscovery beat — `components/RediscoveryReveal.tsx`

A *second* front-door spark, below the hero — decided **coexist, not replace**: the
hero stays the guaranteed-warm canonical first spark, and rediscovery is the
personal, era-tuned layer the hero structurally can't be. It sits between the
foundation beat and the questions. Added 2026-06-29.

It runs a **curiosity-gap reveal**:

- **The prompt withholds the result.** "Do you remember that night away at Chelsea,
  back in 2012?" — venue, opponent, year, sometimes the competition's flavour; never
  the scoreline or the win/loss. Closing that loop is the reveal's job. `promptFor`
  (in `lib/rediscovery.ts`) was rewritten to withhold; the emotional framing moved to
  a new `revealCaption` shown *after* the reveal.
- **First contact stays warm.** The ungated roll is filtered to forgotten *wins*
  (`results: ["W"]`); the raw engine skews to forgotten *defeats*, which is right for
  the era-tuned layer but wrong for a cold open.
- **"Your era" is the unlock, asked only after the first spark.** One-tap decade chips
  → a *formative window* (`fromYear`/`toYear` ≈ decade + 15y), so it leans into the
  early-years nights that have aged into the right bittersweet, not "anything since
  you started watching." One `localStorage` value (no account; read via
  `useSyncExternalStore` so SSR / first paint stay on the warm pool). Post-era the
  pool is unfiltered, so defeats are eligible.
- **The reveal opens the foundation.** Scoreline toned by result (gold for a win,
  muted red for a loss), competition · round · venue · year, the caption, then
  **"See the night →"** into the full match page — the deepening.

Server renders the warm pool + per-decade pools (the page is already
`force-dynamic`); the era swap is the only client layer. `lib/eras.ts` holds the
decade options + the serialized `RevealPick` shape, kept DB-free so the client island
doesn't pull in `better-sqlite3`.

**Deferred (next):** a copy/voice pass on the prompts and captions, and a fuller,
more involved reveal (scorers/minutes, more atmosphere) to match the hero's presence.

---

## 3. The design journey (what we tried, and why we moved on)

Kept so we don't re-walk dead ends.

1. **Card with story + goal-shape + timeline dots.** Rejected: it wore the same
   bordered/grid panel template as every other section, the goal-shape and
   1886→now axis read as "floating dots in a void," and the words just stacked. A
   hero on any other page, not a front door.
2. **Cinematic full-bleed, story-led, ghosted year.** Right direction — broke the
   card, got atmosphere from light, made the thread a real spine. But the **match
   itself felt lifeless** (a small grey scoreline caption), and a ghosted year
   alone didn't fully "leave a mark."
3. **Match brought alive + faded match-winner portrait.** Added the scoreline
   presence + goalscorers/minutes (big win) and a faded portrait of the
   match-winner. The portrait gave it a face — but exposed the **imagery problem**
   (§4): our portraits are modern (Solskjær as a *manager*, with a Molde crest), and
   a wrong-era face is worse than none. Portrait gated **off** for now
   (`USE_WINNER_PORTRAIT = false`), falling back to the ghosted year.

Current state: cinematic story-first stage, lively match block (scoreline +
scorers), ghosted-year monument, Red Thread spine. **Pinned to 1999** for review
(`PINNED_ID`); **uncommitted/temporary** until the look settles.

---

## 4. Open problems to work through

These are the real unknowns — the things to figure out next, in rough priority.

### 4a. Imagery — the central problem

A faded image (a player *of that era*, or ideally **a moment from the match**)
feels like the thing that would truly leave a mark. But:

- **What we have is wrong.** Player media is modern/Wikidata — often post-career or
  management-era, anachronistic to the night. **A wrong-era face is worse than no
  face**, so it's off.
- **What we'd want is hard.** Period-correct player photos and match-moment images
  are overwhelmingly **copyrighted** (Getty et al.); this is a free / open / honest
  project, so licensed match photography is likely off the table.

So the question is genuinely open: **how do we create iconic, period-true emotional
resonance without licensed imagery?** Candidate directions to explore (not yet
chosen):

- **Lean entirely on type + light + the thread** — no photo; make the composition
  itself the icon (where we are now, and it's not bad).
- **Data-as-image:** render the night's *own* shape beautifully — the goal minutes,
  the comeback curve, the Elo swing — as the monument instead of a face. On-brand
  (the record is the material), period-neutral, always available.
- **Era as colour/texture:** treat each night with an era-specific palette or a
  period-evocative abstract field rather than a literal image.
- **Sourced free imagery, carefully:** audit Wikimedia/PD for genuinely period-correct
  or stadium imagery per curated night — viable only for a hand-curated few, and
  only where licensing is clean.
- **Commissioned/generated line-art or silhouettes** — risky (consistency, the AI
  tell), but a possible signature if done with discipline.

Decision needed: pick a primary direction, accept "no photo" as the honest default
until/unless period-correct imagery exists per night.

### 4b. The Red Thread — do more with it

Still under-used. It's the brand, and right now it's a thin static line. Ideas to
work through (the user wants more here; treat as a finishing-touch pass):

- **Animate it** — a quiet draw-in / pulse / flow along the filament, the knot
  glowing (must respect `prefers-reduced-motion`; `DESIGN.md` cautions against
  decorative load choreography, so keep it disciplined).
- **Give it shape** — not a straight rule; a path with character, possibly
  **continuing down the page** so it literally threads from the night into "One
  thread through United's history" (the foundation beat) and beyond.
- **Make it carry meaning** — the night as a bead/knot on the line of history;
  goals or eras as points along it.

### 4c. Copy / voice

- **Stakes lines are drafts** and now lead the hero — they need an editorial pass in
  the Floodlit-Guide voice (precise, romantic only about reach, no hype lexicon).
- **Kicker** — `A piece of United history` replaced the weak `A great United night`;
  confirm it's the register we want, or find something stronger still.

### 4d. Balance & detail

- Story line vs. match block weight — is the match the main event yet, or should the
  scoreline go bigger / more central?
- Opponent naming (`FC Bayern Munich` verbatim vs. cleaning prefixes).
- Minute tick renders as `90+1 '` (mono kerning) — tighten.
- True full-viewport bleed (currently bleeds to the column edge, not the page
  gutter); mobile composition; an OG/share card for the served night.

---

## 5. Still to do (backlog)

- **Un-pin** (`PINNED_ID = null`) and commit, once the look settles.
- Resolve §4a and §4b (the two real design problems).
- Editorial pass on `CURATED_NIGHTS` stakes lines; consider reserves (7–1 Roma,
  9–0 Saints, 2023 Carabao final).
- Mobile pass; OG card; full-bleed.
- Then the rest of `CONTEXT.md`'s leverage order: the surface-by-surface pass (§3–4)
  and the `PRODUCT.md` reconcile.

---

## 6. Status & where things live

- Engine: `lib/greatNights.ts` (`PINNED_ID`, `USE_WINNER_PORTRAIT`, `CURATED_NIGHTS`).
- Hero: `components/TonightHero.tsx`.
- Page: `app/page.tsx` (hero, then the foundation beat, then questions/peaks/etc.).
- Tests: `tests/great-nights.test.ts`. Bootstrap: `scripts/bootstrap-great-nights.ts`.
- Rediscovery beat: `components/RediscoveryReveal.tsx`, `lib/eras.ts`; engine filters
  + copy in `lib/rediscovery.ts` (`results`/`fromYear`/`toYear`, `promptFor`,
  `revealCaption`). Live (2026-06-29) — see §2; copy + a fuller reveal to follow.
- **Temporary:** 1999 is pinned and the working tree is uncommitted while the hero
  is in visual iteration. The portrait path is gated off pending §4a.
