# Scope-creep audit & subtraction roadmap

_Dated 2026-06-28. A deliberately subtractive review: not "what can we build" but
"what shouldn't we have built, what doesn't earn its place, what drags the rest
down." Four design critics audited the app from distinct lenses (subtraction,
attention/focus, craft quality-bar, product identity). Where they converged is the
signal — most of this list was reached independently from more than one angle._

## The through-line

The scope creep is not a pile of random features. It is **identity drift**: the
product quietly shipping the exact things `PRODUCT.md` says it must never become.
The two worst offenders are also what fuels the only outside criticism that stings —
the redcafe reader who said it "felt like a prototype with dummy data." That was not
a vibe; the dummy data is literally on the site. Closing the gap between what the
product says it is and what it ships is the highest-value move available, and most of
it is deletion, not building.

The yardstick is the product's own writing: _the answer is the front door; the
fixture record is the spine; every aggregate traces back to real matches; no
betting-app energy; no brand theater; no black-box analytics._ The best surfaces
(`/questions/[slug]` + `AnswerThread`, the `/matches` filter builder, the `/cut`
chart) already hold that bar. The work below pulls the laggards up to it or removes
them.

---

## Phase 1 — cut this week (unanimous, low-risk, high identity payback)

### 1.1 Delete `/logo-lab`
All four critics flagged it; the only unanimous call. It is a publicly-routable,
**crawlable** internal brand deck (`robots.ts` disallows only one API path) built on
fabricated data: a fictional _"Brighton 0-3 United, 24 May 2026"_ over a
`redthread.example/...` URL, invented coverage numbers, and an
`<h2>Initial verdict: Threadline wins</h2>`. It is, almost literally, the "prototype
with dummy data" the forum saw. Zero inbound links → zero user cost to remove. The
brand memory already said "stop before brand theater"; this is the brand theater.
- **Verdict: CUT.** Delete `app/logo-lab/`, remove any sitemap entry.

### 1.2 OddsPredictor — cut the crystal ball, keep the calibration
A W/D/L _forecast_ crosses three written anti-references at once (betting-app
grammar; no fixture to trace to since the archive ends today; the forward-looking
question the product defines itself _against_). It is also the only real hole in the
traceability moat — its "show the matches" link points at a different match set than
the percentages are computed from.
- **Verdict: SHRINK.** Remove the forecast widget (`components/OddsPredictor.tsx`)
  from `/analytics` and `/opponent/[id]`. **Keep** `ReliabilityCurve` and the
  past-season replay — those read Elo forward _honestly_ and stay on-identity. Prune
  the now-unused forecast paths in `lib/predict.ts`.

---

## Phase 2 — sharpen the front door (focus)

### 2.1 Homepage is a wall of nine sections, not an answer-first front door
`app/page.tsx` stacks nine content blocks below a hero that itself carries three
competing doors (search box, `EntryChips`, skyline).
- **Cut first: "Featured myth"** — it reproduces in full a question the curated
  carousel _two rows above it_ just launched, violating that carousel's own "launch
  findings, don't reproduce them" rule.
- **Merge the freshness strips** — `recentHistoryDigests` renders in three places
  (homepage "What the record holds today" + "What the record just gained" + `/explore`).
  Collapse to one.
- **Demote "More ways into the record"** (`breadthWays`) — a product self-directory;
  push to footer or fold into `/explore`.
- **Fold `EntryChips` into the search empty-state** — it duplicates the search box's
  job ("start with an era, a rival, or a name").

### 2.2 `/` and `/explore` are two competing front doors
Same search box, same nine questions; the nav's _first_ item ("Discover") steers
users to the clone. Pick one home; strip `/explore` to the launchers the homepage
shouldn't carry (Compare, Cut); kill the "answering · asking · exploring" taxonomy
for plain verbs.

---

## Phase 3 — fix or shrink the laggards

- **`/compare` — FIX.** The clearest _kept_ surface below the bar: the only major
  surface still built from a raw `<form>` + native `<datalist>` while everything else
  uses the polished combobox, and it overstates traceability ("every figure links to
  its matches" — it doesn't, per-row). Bring inputs to the bar; make the copy honest.
- **`/embed/cut` — FIX or CUT.** Renders the wordmark "UnitedStats" then links "View
  on Red Thread →" in the same card — a self-contradiction on the one surface that
  lands on third-party sites. Fix the brand name, or cut the speculative embed
  channel outright (no audience yet).
- **`/collection` — SHRINK** to a pure share-target; it's an orphaned, flatter clone
  of the `/cut` headline band. Don't invest in it as a destination.
- **`/history-changed` — fold inline.** Craft is fine now, but it holds ~10 digests
  all from one recent half-season on a spine running to 1886 — the least-historical
  thing in the app. Inline "what this changed" on the match page until coverage
  broadens.
- **`/api/v1/*` + `llms.txt` — freeze.** ~14 of 18 endpoints are consumed by nobody;
  a standing public API contract for an audience that doesn't exist yet.

---

## Phase 4 — copy on a metaphor budget

The data-bound findings prose is earned and good (the fortress page cedes authority
to Opta's number). The fault is the connective chrome reaching for the same 4–5
metaphors on rotation — that repetition is what reads as templated AI:
- _"open door"_ (verbatim in three places),
- _"what the record gained / holds,"_
- _"the question a live-score app never answers."_

Keep "the red thread" as the one brand spine; retire the rest; rewrite framing
subheads as plain facts (_"Latest results and what they changed"_ beats _"What the
record just gained"_).

---

## Keep (so this isn't just a delete-fest)

`/surprise` (near-free, on-strategy, real entry points), `/search` (one shared
engine, not a parallel build), `/data` vs `/analytics` (clean division), `/transfers`
(a parallel ledger, but honestly coverage-gated — not drift), and crucially the
`/matches` power-user path — the "stoppage-time goal vs Bayern" flow the forum
praised. It is the part of the app that knows what it is. Keep discovery scaffolding
away from it.
