# Questions catalogue — working record

A design diary for the curated **front door** (`/explore`, homepage launch
rotation, `/questions/[slug]`). Read alongside `docs/adr/0002-bold-simplification-spine-question-front-door.md`
and `lib/questions.ts` (the registry).

**Status:** in progress — four questions promoted; one built-out question demoted
after review; several easter eggs linkable but not catalogue-facing.

---

## 1. The job

Each front-door question is a **canonical answer page**: one headline, one visual
station above the prose (`AnswerThread` spine), evidence charts, definition /
coverage, and a link into The Record (`/matches`). The explore grid leads with a
headline figure (`lib/questionHeadlines.ts`) so the card answers before you click.

Treble is the **quality bar** — visual payoff, tight finding, inspectable evidence,
honest slice/coverage. Other pages were brought up to that pattern; not all made
the cut to stay on the front door.

---

## 2. Front door today (promoted)

These four appear in `QUESTIONS`, the explore catalogue, the homepage launch
rotation (`featuredLaunchQuestion`), and surprise facts where applicable.

| Slug | Label | One-line job |
|------|-------|----------------|
| `ferguson-era` | Ferguson era | Ferguson vs every other manager, then the post-Ferguson years on the same scale |
| `treble` | The Treble | Anatomy of 1998–99 — three competitions, decisive nights |
| `fortress` | Fortress OT | How rarely United lose a home league lead held at half-time |
| `late-goals` | Fergie time | Whether the late-goal edge is real (mostly 86–90, not stoppage time) |

**Redirects:** `/questions/ferguson` and `/questions/decline` → `/questions/ferguson-era` (`next.config.ts`).

**Explore home:** `/questions` redirects to `/explore` (canonical catalogue).

---

## 3. Merged and restructured

### Ferguson + decline → `ferguson-era`

Two separate modules (`ferguson`, `decline`) were combined into one answer:

- **Visual:** `EraSkylineChart` — league finishes, Ferguson panel vs since-Ferguson panel ("The arc")
- **Evidence:** Ferguson PPG / trophy chart, since-Ferguson comparison cards
- **Finding:** Single narrative across rise and fall (PPG, titles, trophies, average finish)

Old slugs redirect; modules removed from `QuestionModules.tsx`.

### Shared page shape (all canonical modules)

- `Module` with optional `visual` + `visualLabel` (eyebrow on the thread)
- `AnswerThread` stations: visual → answer → evidence → definition → coverage → matches arrival
- Stable `${slug}-*` ids for deep links / citations
- `ShareCite` on catalogue (`variant="index"`) and canonical pages

---

## 4. Built per question (what we actually shipped)

### Treble (benchmark — pre-existing, lightly touched)

- Season `ResultSpine` with trophy markers on deciders
- Three competition runs, semi comeback cards, decider match flows
- Already matched the thread + evidence pattern

### Fortress

- **Visual:** hero unbeaten-since stat + `LeadHeldDotplot` ("The record")
- Hero copy uses dynamic year from data
- **Evidence:** decade `InspectableBarChart` (gold, 2000s highlight)
- **Close calls:** compact `MatchFlow` cards (date left, opponent right)

### Late goals

- **Visual:** 86–90 share hero + `MinuteColumns` ("Across the 90")
- Finding rewritten around last-five-minutes vs stoppage time
- Decade ridge chart + iconic late winners list

### Ferguson era

- **Visual:** `EraSkylineChart` (The arc)
- Combined rise/fall finding; manager comparison evidence
- **Still needs:** polish pass (called out in review — prose density, evidence pacing)

### United in Europe (built, then demoted — see §5)

Substantial work, kept as a linkable page:

- **Visual:** 5-trophy hero + full-season `ResultSpine` with finals as trophy markers ("European nights")
- Visual vs answer copy split (visual = how to read the spine; answer = era narrative)
- **Evidence:**
  - Win rate by **season** — `InspectableBarChart` with gap years (no bar = no European football), season labels (`68–69`), full opacity, slanted x-axis
  - `europeWinRateTimeline()` in `lib/trails.ts` — every club season from first to last European match, `rate: null` for gaps or &lt;2 matches
  - `EuropeFinalsTimeline` — vertical timeline, wins right / losses left, text-only callouts (no cards)
- **Data / chart infra:** `ChartBarDatum.gap`, `InspectableBarChart` `yDomain`, `slantXLabels`; finals round filter guarded in tests (quarter-finals must not leak)

---

## 5. Cut from the front door

### `europe` — demoted to easter egg (July 2026)

After several chart iterations (decade bars → win-% line → flatline zero years →
season bar chart with gaps), the page never reached a single clear visual story
comparable to Treble or Fortress. **Route and module remain** (`/questions/europe`,
OG card, related trails); it no longer appears in `QUESTIONS`, explore, or the
launch rotation.

**Why it struggled:** European record is inherently sparse (wilderness decades,
thin seasons) — line charts lied across gaps; even the bar chart needs careful
reading. The spine visual is strong but the evidence section fought the answer
rather than supporting one sharp claim.

### Never on the front door (easter eggs from the start)

Registered in `EASTER_EGGS` — linkable, not in explore catalogue:

| Slug | Notes |
|------|--------|
| `manager-bounce` | Slope comparison table |
| `comebacks` | Minute-replay summary |
| `runs` | `StreakBoard` |
| `cup-specialists` | `CupLeanBar` |
| `own-goals` | Portrait + tallies |
| `away-days` | `GeoScatter` Britain + Europe |
| `europe` | See above — moved here after build-out |

### Removed / superseded slugs

| Slug | Fate |
|------|------|
| `ferguson` | Redirect → `ferguson-era` |
| `decline` | Redirect → `ferguson-era` |

### Stale surface (not deleted yet)

- `app/questions/page.tsx` — old inline catalogue duplicate; unreachable while
  `/questions` → `/explore`. **Delete** when convenient.

### Never implemented as a question slug

- **Bogey sides / rivalry ledgers** — still only referenced in stale `app/questions/page.tsx` nav (`bogey-sides`). Candidate for a future slug or cut surface.

---

## 6. Infrastructure touched

| Area | Change |
|------|--------|
| `lib/questions.ts` | Front door vs `EASTER_EGGS`; launch rotation slugs |
| `lib/trails.ts` | `europeMatchSequence`, `europeanFinals`, `europeWinRateTimeline`, `FINAL_PREDICATE` fix |
| `lib/related.ts` | Trails for `ferguson-era`; manager page links to `ferguson-era` |
| `lib/questionHeadlines.ts` | Headlines for front-door + easter egg cards |
| `components/QuestionModules.tsx` | All modules; `Module` `visualLabel` |
| `components/charts/EuropeFinalsTimeline.tsx` | New |
| `components/charts/InspectableBarChart.tsx` | `gap`, `yDomain`, `slantXLabels` |
| `components/charts.tsx` | `ChartBarDatum.gap` |
| `components/explore/QuestionSignature.tsx` | Signature visuals per slug |
| `next.config.ts` | Ferguson/decline redirects, `/questions` → `/explore` |
| `tests/question-cards.test.ts` | European finals must not include quarter-finals |

---

## 7. Still to do

**Catalogue / hygiene**

- [ ] Delete `app/questions/page.tsx` (stale duplicate)
- [ ] Decide fate of `europe` easter egg: leave as deep link, or strip module to a thin stub
- [ ] `own-goals` headline exists in `questionHeadlines` but slug is easter egg only — confirm explore doesn't expect it on front door

**Quality passes**

- [ ] **Ferguson era** — polish pass (visual station + evidence pacing to Treble standard)
- [ ] **Fortress / late-goals** — optional screenshot regression on mobile after any copy tweaks
- [ ] **QuestionSignature** — several slugs still defer to text cards (`tests/question-cards.test.ts` `DEFERRED_SLUGS`); bring signatures up for front-door four

**New questions / surfaces**

- [ ] **Bogey sides** — proper slug + module, or drop from nav entirely
- [ ] **Rivalry ledgers** — mentioned in planning; not started
- [ ] Consider a fifth front-door slot only when a question has a story as tight as Treble (not "more Europe")

**Europe module (if revived later)**

- One primary chart claim (spine *or* season win rate *or* finals timeline — not three competing stories)
- Possibly fold continental summary into Treble / Ferguson trails instead of a standalone page

---

## 8. How to add or move a question

1. Add metadata to `QUESTIONS` or `EASTER_EGGS` in `lib/questions.ts`
2. Implement `*Module` in `components/QuestionModules.tsx` and register in `MODULES`
3. Add `questionHeadlines()` entry and `QuestionSignature` case if explore should show a figure
4. Register `RELATED[slug]` in `lib/related.ts` (tests require 2–3 links for every `questionSlugs()` entry with a trail)
5. Run `npm test` — `phase18-discovery.test.ts` and `question-cards.test.ts`
6. Screenshot verify: `node scripts/shot.mjs http://localhost:3000/questions/<slug> …`

Promote to front door: move from `EASTER_EGGS` to `QUESTIONS`, add to `LAUNCH_QUESTION_SLUGS` if it should rotate on the homepage.

Demote: reverse — keep in `EASTER_EGGS`, remove from `LAUNCH_QUESTION_SLUGS`.
