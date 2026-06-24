# Discovery — personas, cold-start flows, and the flow decision

Phase 18.1 deliverable (the exploration). Created 2026-06-24.

Phase 18 is the first of the experience arc: turning the discovery *capability*
(search, questions, compare, the Cut, recently-changed, on-this-day) into an
experience a stranger can enter fast and a regular keeps stumbling into. The
engine can answer almost anything; the gap is that you still largely have to
*know to look*. This document does the exploration the roadmap calls for before
any build: it names who we serve, maps how each of them actually fares from a
cold start against the surfaces that exist **today**, and proposes three
candidate discovery flows with a recommended decision for 18.2–18.4.

It does not build anything. 18.2 (search), 18.3 (serendipity), and 18.4
(orientation) are the build sub-phases; this is the map that sequences them.

Guardrails carry forward unchanged: static and zero-cost (URL + `localStorage`,
no user database, no behavioural personalisation), answer first, evidence trail
intact, United-coded not United-branded, the Red Thread motif only where it
works.

---

## 1. The personas

Five personas, each with entry context (channel · intent · device) and the one
**first delightful moment** the flow must land. They are not equal in size:
the settler and wanderer are the casual majority Phase 18 is really for; the
researcher is already served and must only be protected.

### The settler — "I'm mid-argument and need to win it"

- **Channel** — a shared link dropped into a group chat, or a Google search for
  a specific claim ("united record at anfield"). Often arrives mid-conversation.
- **Intent** — a sharp, specific question; wants the verdict **and** the
  coverage grade in one screen, now, ideally copyable back into the chat.
- **Device** — phone, in a chat app's in-app browser.
- **First delightful moment** — the verdict on screen with its grade inside ~5
  seconds, and a receipt they can paste back to end the argument.

### The wanderer — "show me something I didn't know"

- **Channel** — a bored scroll, a bookmark, a social link with no specific
  follow-through. No query in mind.
- **Intent** — serendipity that still feels curated, not random noise; one good
  thing, then another.
- **Device** — phone, low patience, thumb-scrolling.
- **First delightful moment** — stumbling into one genuinely surprising,
  curated-quality fact within a tap or two, then being pulled to a second.

### The nostalgic — "I half-remember a match / a player / that season"

- **Channel** — an anniversary, an "on this day" post, a memory triggered by a
  result; sometimes a name they can spell, often only a description.
- **Intent** — relive a specific thing; needs a memory-jog (an era, an opponent,
  a date) more than a search box.
- **Device** — phone or desktop, unhurried.
- **First delightful moment** — recognising the half-remembered match/player/era
  from a jog and dropping straight into it.

### The researcher — "give me the complete record of X"

- **Channel** — direct, bookmarks, a Google hit on a specific record.
- **Intent** — the complete, coverage-graded record of a known subject, with the
  evidence path; values provenance and completeness.
- **Device** — desktop, willing to read dense information.
- **First delightful moment** — reaching the full record with its coverage grade
  and match trail, fast, with **no newcomer scaffolding in the way**.

### The newcomer — "what can I even ask here?"

- **Channel** — a social share, word of mouth, idle curiosity.
- **Intent** — orientation to the range without the site collapsing into a
  portal/directory.
- **Device** — phone.
- **First delightful moment** — realising "I can ask almost anything about United
  and get a real answer with receipts" — an orientation moment that never reads
  like a manual.

---

## 2. Cold-start flows today, and where they stall

Mapped against the real surfaces: the homepage (`app/page.tsx`), `/explore`
("Discover"), the global `SearchCommand` / `HeaderSearch`, the shaped-answer
parser (`lib/search/intent.ts`), `/search`, `/on-this-day`, and the entity
detail pages with their pattern trails.

Legend: ✅ works · ⚠️ stalls / demands prior knowledge · ⛔ dead-ends.

### Settler

1. Arrives. Best case: a shared deep link (`/questions/[slug]`,
   `/history-changed/[id]`) lands them on the answer itself — ✅ this path is
   served well by Phase 10/17.
2. Cold search case: types into the hero/header field. If the phrasing matches a
   template ("record away at Liverpool", "biggest win in the 90s"), the dropdown
   previews the computed verdict (`ShapedAnswer.summary`, e.g. `P… W… · 73.7%
   won`) — ✅ the verdict-in-the-dropdown already exists for the grammar.
3. ⚠️ But the settler types how people argue: "have united ever beaten
   barcelona", "are united better than city away". These don't hit a trigger
   word (`record|results|vs|against…`) or a venue, so `headToHead` never fires;
   the query falls through to **entity rows**. The verdict is then one hop away
   on the opponent/compare page, not in the dropdown.
4. ⚠️ The coverage grade the settler wants beside the verdict is on the
   destination page, not in the typeahead preview.

> **Settler verdict:** the answer engine is there and the dropdown *can* preview
> it, but the grammar is narrow and brittle to natural phrasing, so the hardest,
> most valuable persona frequently drops to entity-lookup and loses the
> one-screen verdict. **→ 18.2.**

### Wanderer

1. Lands on the homepage. Sees the hero, then "Start with a question" (the
   9-card curated carousel) — ✅ real curated serendipity is present.
2. ⚠️ But it asks the wanderer to *read nine cards and choose*. There is no
   single "surprise me" affordance — no one-tap path to one good thing.
3. ⚠️ The homepage's serendipity is **deterministic and static**: "Records that
   pull you in" is always the same three (biggest win, record crowd, longest
   unbeaten). A wanderer who returns sees an identical page; nothing rotates
   except after-match digests.
4. ⛔ After reading one question answer, there is no "if this interested you…"
   rail and no trail to the next answer (18.3 not built). The wanderer reads one
   thing and bounces; a single question never becomes a session.

> **Wanderer verdict:** curated quality exists, but there is no serendipity
> *primitive* (no randomiser, no rotation, no answer-to-answer trail), so the
> no-query majority gets one good thing at most and no second pull. **→ 18.3.**

### Nostalgic

1. Has a name they can spell → search resolves it (typo-tolerant) → ✅ entity
   page.
2. ⚠️ Has only a description ("that comeback from 3-0, mid-2000s, away
   somewhere"). Search is name/season/operator-based; there is no
   describe-the-match memory route. They are stuck unless they recall a name.
3. ⚠️ The two genuine memory-jogs are under-surfaced. `on-this-day` is a route
   tile at the **very bottom** of the homepage (below the divider) and a nav-less
   `/on-this-day` redirect; nothing on a cold homepage says "here's United on
   this date." The `HistorySkyline` bars *do* link to seasons (a quiet
   era-navigation device), but it reads as a chart first and a control second,
   and demands you know the year.

> **Nostalgic verdict:** well served *if* they hold a name; poorly served when
> they hold a memory. The personal/temporal entry points exist but are buried or
> disguised. **→ 18.4 (with on-this-day surfacing usable in 18.3's feed).**

### Researcher

1. Header search → operator (`player:rooney`) or name → ✅ entity → full record,
   coverage grade, pattern trails, evidence links. The whole moat is here and it
   works.
2. ✅ Newcomer scaffolding is currently *minimal*, so they are not slowed. The
   header search bypasses the homepage carousels entirely.

> **Researcher verdict:** served. The Phase 18 job for this persona is a
> **guardrail, not a feature** — every newcomer affordance added below must stay
> skippable and must not push depth down the page.

### Newcomer

1. Lands on homepage. Headline "Follow the thread…", a search field whose
   placeholder teaches by example ("record away at Arsenal"), and the curated
   carousel — ✅ a decent first impression that is answer-first, not a brochure.
2. ⚠️ The *grammar* (operators, shaped questions) only reveals itself if they
   focus the empty field and read the dropdown's "Try a question" / "Operators"
   block. Many will type one thing, get entity rows, and never learn the box can
   compute.
3. ⚠️ The product's **range** (compare, the Cut, analytics, transfers,
   on-this-day) is legible only from the "Routes into the record" grid at the
   page foot — exactly the portal/directory enumeration Phase 11 deliberately
   refused. So breadth is either hidden or shown in the one form the design
   rejects.

> **Newcomer verdict:** the first screen is good; the unresolved tension is
> *teaching breadth and grammar without a manual or a directory*. **→ 18.4
> (orientation) + 18.2 (the field teaching itself).**

### The systemic gaps (what the map adds up to)

1. **The front door is brittle.** The shaped-answer grammar is powerful but
   undiscoverable and fragile to natural phrasing; it previews a verdict only
   when a template matches. Blocks settler + newcomer. → **18.2**
2. **No serendipity primitive.** No "surprise me", no rotation, no
   answer-to-answer trail. Blocks wanderer; weakens returning-visitor habit.
   → **18.3**
3. **Memory-jog / personal entry is thin and buried.** on-this-day demoted, the
   skyline disguised, no describe-it route, no "enter through a player/rivalry/
   era". Blocks nostalgic. → **18.4**
4. **Breadth vs portal tension is unresolved.** Range is hidden or shown as a
   directory. Blocks newcomer. → **18.4**
5. **The researcher is the guardrail.** Don't regress; keep scaffolding
   skippable.

The search field is the one element every persona touches (hero, `/explore`,
header). It is both the most-used surface and the one with the highest-leverage
unfixed gap. Hold that thought for the decision.

---

## 3. Three candidate discovery flows

Three coherent bets on Phase 18's *organising idea* — not a feature list. Each
leads with a different sub-phase and pulls the others behind it. Sketches are
flow-level, not builds.

### Candidate A — "The answer box" (search-led, leads with 18.2)

**Bet:** the front door is the field every persona already uses; make it answer
the way people actually type, and never return a blank.

```
┌──────────────────────────────────────────────┐
│  did united ever beat barcelona            ⌕  │
├──────────────────────────────────────────────┤
│  ANSWER                                        │
│  Record vs Barcelona                           │
│  P9 W3 D3 L3 · 33% won · coverage: complete   │  ← verdict + grade,
│                          Show the 9 matches →  │    previewed live
│  ───────────────────────────────────────────  │
│  Barcelona — opponent                          │
│  1984 European Cup Winners' Cup …              │
└──────────────────────────────────────────────┘
```

- Loosen the parser so an opponent/intent detectable in natural phrasing yields
  a best-guess shaped answer (not only template-trigger hits); preview the
  verdict **and its coverage grade** in the dropdown.
- Zero-result / low-confidence recovery: never blank — offer the nearest shaped
  cut or a reshape ("no exact match; try *late goals under Ferguson*").
- The field teaches itself: rotating example prompts in the placeholder/empty
  state so the grammar is learned without a manual.
- **Serves:** settler (directly), newcomer (the box teaches), researcher
  (unchanged, faster fuzzy recovery). Wanderer/nostalgic: untouched.
- **Cost/risk:** medium. Mostly `lib/search/intent.ts` parser breadth + dropdown
  preview; zero new homepage surface, so no portal/brochure regression risk. The
  parser must stay honest — a loosened best-guess must still derive its grade,
  never imply an answer it can't ground.

### Candidate B — "The living entry" (serendipity-led, leads with 18.3)

**Bet:** most arrivals have no query; lead with one rotating "right now" object
and make every answer pull to a next one.

```
HERO
┌──────────────────────────────────────────────┐
│  RIGHT NOW                          ↻ another  │
│  On this day, 1999: United 2–0 … the Treble   │
│  run's …                         Open the day →│
└──────────────────────────────────────────────┘
   (rotates: on-this-day · latest digest · a random curated cut)

…and at the foot of every answer page:
┌──────────────────────────────────────────────┐
│  IF THIS INTERESTED YOU                        │
│  → Bogey sides, once venue is fixed            │
│  → United's longest unbeaten run               │
└──────────────────────────────────────────────┘   (deterministic, curated)
```

- A single "what's interesting right now" card weaving recently-changed +
  on-this-day + a rotating curated cut; a "surprise me" that only ever lands on
  a real curated-quality cut; a deterministic related-answers rail on every
  answer.
- **Serves:** wanderer (directly), nostalgic (on-this-day surfaced), returning
  visitors (rotation = a reason to come back). Settler/newcomer: indirect.
- **Cost/risk:** medium–high. Adds a homepage object *above* the front door — the
  exact place Phase 11 fought to keep answer-first; risk of re-introducing a
  brochure feel. "Rotating" must stay static-guardrail-safe (date-seeded or
  client-`localStorage`, never server/behavioural).

### Candidate C — "Enter through what you love" (subject-led, leads with 18.4)

**Bet:** people think in players, rivals, and eras, not queries; offer identity
entry points that branch into the record, and tease range without a directory.

```
HERO (beneath the search field)
┌──────────────────────────────────────────────┐
│  Or start from someone you remember            │
│  [ Rooney ] [ Cantona ] [ Liverpool ] [ City ]│
│  [ The Treble ] [ The 90s ] [ surprise ]       │
└──────────────────────────────────────────────┘
   → lands on that entity, already oriented, trails open
```

- A small, rotating set of person/rivalry/era chips that branch into the record;
  a breadth tease that shows the *range* without enumerating routes (the Phase 11
  peek-carousel lesson); a dismissable first-visit orientation that never blocks
  a returning user.
- **Serves:** newcomer + nostalgic (directly). Settler/wanderer: indirect.
- **Cost/risk:** medium. Risk of the chip strip reading as *yet another* portal
  row if it enumerates rather than teases; depends on entity pages already
  leading into trails (they do).

---

## 4. The decision

**Lead with Candidate A (the answer box, = 18.2) as the spine of Phase 18, then
sequence 18.3 and 18.4 behind it — the roadmap's existing order is correct and is
hereby confirmed, not reshuffled.**

Reasoning:

- **Fix the universal surface first.** The search field is the one component
  every persona touches and the one with the highest-leverage unfixed gap. Both
  other candidates *route through or sit beside* it — B's "surprise me" and C's
  chips are search-adjacent entry points that are weaker if the field they live
  next to still drops natural-language questions to entity rows. Fixing the front
  door de-risks the other two flows rather than competing with them.
- **It de-risks the two hardest cold-starts** (settler, newcomer) and *cannot*
  regress the researcher or re-introduce a portal, because it adds intelligence
  to an existing field instead of new homepage real estate.
- **Lowest regression surface.** A leads with parser/dropdown work; B and C both
  add objects to the answer-first hero, which is precisely the hierarchy Phase 11
  and the Homepage Role contract protect. Touch that hero *after* the front door
  earns it, not before.

Then, in order:

- **18.3 (serendipity)** takes the best of Candidate B — but as a *demoted*
  living strip and an answer-foot related-rail, **not** a hero object above the
  search. The "surprise me" and the rotating "what's interesting right now" feed
  ship here; on-this-day finally gets surfaced through that feed rather than from
  the page foot.
- **18.4 (orientation)** takes Candidate C — subject entry chips and a
  breadth tease — built on the entity trails that already exist, with the
  first-visit orientation kept dismissable so the researcher is never slowed.

**Explicitly rejected / deferred:**

- **B-first (feed-led).** Rejected as the *lead* because it puts a new object
  above the front door before that door works, risking the brochure/portal
  regression Phase 11 closed. Its content is not rejected — it returns, demoted,
  in 18.3.
- **A personalised or behavioural feed.** Out of bounds by guardrail. Any
  rotation is date-seeded or `localStorage`, never server-side or behavioural.
- **A describe-the-match fuzzy memory search** (for the nostalgic's "that
  comeback from 3-0"). Tempting but expensive and easy to do badly; parked. 18.4
  serves the nostalgic through *jogs* (era, opponent, on-this-day), which are
  cheap and honest, rather than trying to parse a fuzzy recollection.

**What this does not change:** the answer-first hierarchy, the evidence trail,
the static/zero-cost model, and the researcher's unscaffolded fast path. Every
18.2–18.4 affordance must keep depth one click away (never reproduce it on
`/explore` or the homepage) and must stay skippable for the user who arrived
knowing exactly what they wanted.

---

## 5. Carry-forward checklist for the build sub-phases

- **18.2** — parser breadth so natural phrasings shape an answer; verdict **and
  coverage grade** in the typeahead preview; never-blank zero-result recovery;
  self-teaching rotating prompts in the field.
- **18.3** — a static "surprise me" that only lands on curated-quality cuts; a
  demoted living "right now" strip (recently-changed + on-this-day + rotating
  cut); a deterministic related-answers rail at the foot of every answer; the
  answer-to-answer trail that turns one question into a session.
- **18.4** — person/rivalry/era entry chips branching into existing trails; a
  breadth tease that teaches range without a directory grid; a dismissable
  first-visit orientation that never slows a returning or expert user.
- **Throughout** — protect the researcher (skippable scaffolding, depth never
  demoted); protect the answer-first hero (no new objects above the front door
  until 18.2 lands); hold the static guardrail on every rotation.
