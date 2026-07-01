# Feedback triage — 2026-07-01

Inventory of every annotated screenshot in `docs/feedback/`. Updated at end of
session 1 implementation.

Legend: **Shipped** (prior restraint pass) · **Done** (this session) ·
**Steer** (needs product call — next session)

---

## Copy principles (locked)

Agreed steer for all subtitle / `PageHeader` / `CoverageNote` work:

| Rule | Detail |
| --- | --- |
| Subtitle length | Max two short sentences |
| `PageHeader` | Every top-level page; detail/entity pages use `IdentityPlate`, not `PageHeader` |
| `CoverageNote` | **Slice** = what is counted; **Coverage** = gaps only when incomplete; no UI instructions |
| Audience | Fan-first — no internal jargon ("canonical record", "archive spine", "strength layer") |
| Eyebrows | Editorial ("People · the succession", "The long arc") |
| Entity pages | Footnotes included in sweep; no `PageHeader` on detail routes |

---

## Done this session

### Sub-agent batches (A–D)

| Batch | Items | Outcome |
| --- | --- | --- |
| A | A1–A5 | `140 years`; "two dynasties"; data + footer audience copy |
| B | B1–B9 | Players register polish; home 3 question cards + shorter W/D/L; managers timeline labels + stats spacing; season table toggle size |
| C | C1–C2 | Explore tested-myths carousel removed; grid-only layout |
| D | D1–D2 | Analytics "Where next" cut; assist caveat above Supply Lines title |

### Follow-up fixes (same session)

| Surface | Item |
| --- | --- |
| managers | `IndexRow` regression: `CareerSpanBar` vanished then rendered too narrow — fixed (`w-full`, no `max-w` / `ml-auto`) |
| players | Tighter centred `#` and shirt columns; "Debut" sort; legend removed |
| seasons | Default sort **newest first** |
| myths | Launch set: **Ferguson, Treble, Europe, Fergie time, Manager bounce** — routes for archived myths kept as easter eggs in `lib/questions.ts` |
| cleanup | Deleted orphaned `components/explore/QuestionSignature.tsx` (knip) |

### Site-wide copy sweep

Applied the locked principles above across top-level pages and trimmed entity
`CoverageNote`s. Highlights:

| Page | Eyebrow | Subtitle (current) |
| --- | --- | --- |
| Home (foundation) | From Newton Heath to today | `{n} matches across {years} years…` |
| Discover | Questions · comparisons · cuts | Myths tested against the full record. Compare careers, slice the archive, or search. |
| Matches | Fixture record | Every official match since 1886. Filter by era, competition, opponent, or result. |
| Seasons | Campaign ledger | League and cup campaigns from 1892. Timeline above, full ledger below. |
| Analytics | The long arc | How strong United were, era by era. The records that football left behind. |
| Compare | Side by side | Two players, managers, or eras on the same measures. Gaps shown where the record is thin. |
| Players | People · the frontier | Most barely feature. A few defined the club for decades. |
| Managers | People · the succession | Busby and Ferguson span ~44% of matches. Everyone else fills the years between and after. |
| Opponents | Head to head · the landscape | Every club since 1886 — how often, and how United fared. |
| Transfers | People · the ledger | Known fees since 1883. Many early deals were never disclosed. |
| Data | The canonical record | Every result since 1886. Richer detail fills in over time — gaps shown honestly. |
| Search / Surprise / Corrections / Cut | (per page) | Trimmed to ≤2 sentences each |

Hero cards on players, managers, opponents, transfers now hold **stats + viz only**;
`PageHeader` carries eyebrow, title, and subtitle above the card.

**Not done** (explicitly deferred): data-page section redesigns, season nav strip,
analytics chart cuts/redesigns — see **Steer** below.

### Launch myths (`QUESTIONS` front door)

| Kept | Archived (easter eggs, still at `/questions/[slug]`) |
| --- | --- |
| ferguson, treble, europe, late-goals, manager-bounce | decline, comebacks, runs, fortress, cup-specialists, own-goals, away-days |

Homepage carousel shows first **3** of the launch set.

---

## Already shipped (prior restraint pass)

| Surface | Item | Ref |
| --- | --- | --- |
| home | All-time peaks cut | `RESTRAINT-PASS-PHASE2-REVIEW` |
| home | EntryChips / era pills removed | `795cc63` |
| home | "Today in the Record" removed | `795cc63` |
| home | Latest-results opponent truncation | `795cc63` |
| players | Career sparkline → `CareerSpanBar` | shipped |
| players | Shirt badge colour blended (`plain`) | shipped |
| players | Assists `0` → `–` when uncovered | shipped |
| managers | Per-row mini-bars → `CareerSpanBar` | shipped |
| managers | Timeline labels truncate within segment | shipped |
| matches | "Europa League" at `xl` | shipped |
| matches | Share/Cite/Save → single Share | Session 4 |

---

## Feedback items — status by screenshot

### Done (mapped to batches / sweep)

| Ref | Item |
| --- | --- |
| `explore/…05.17.38` | `140years`; decline hero removed; myths curated to 5 |
| `homepage/…05.17.08` | W/D/L prose shortened |
| `homepage/…05.17.23` | Max 3 question cards |
| `homepage/…05.17.19`, `05.20.55` | EntryChips + Today in Record — prior pass |
| `players/…05.26.03` | Debut sort, legend, `#`/shirt/search polish |
| `players/…06.48.02` | Sparkline → span bar, shirt blend, assists `–` — prior pass |
| `managers/…05.31.11` | Dynasties wording; punctuation; label sizes; stats spacing |
| `managers/…07.12.33` | Per-row span bars — prior pass; IndexRow width fixed this session |
| `analytics/…05.50.23` | Where next cut; assist caveat promoted |
| `…05.56.08`, footer | Internal JSON language removed |
| `season/…16.51.54` | Show full table button smaller |
| `seasons/…06.39.27` | Europa at xl — prior pass; newest-first default this session |

### Steer — next session

| Surface | Item | Why parked |
| --- | --- | --- |
| home | Top goalscorers — cut or make visually impressive? | **Locked (A):** cut section |
| home | Question cards — "what can we do with the red thread?" | **Locked (C+B):** one myth, day-rotated independent of TonightHero |
| data | Dual lane (Acts I–II fans, III+ builders) | **Locked (C)** — per-lane fixes below |
| data | Competition coverage — table vs second heatmap? | **Locked (B):** slim table — matches, scorers, starting XI only |
| data | Source lineage cards oppressive; correction contract layout | **Locked (A+B):** compact source rows, stacked; slim correction callout |
| data | High-value gaps — why missing, how to help? | **Locked (C):** computed why per gap type + contribute link per row |
| data | API / downloads should feel distinct from site | **Locked (A):** in-page developer register — inset, mono, distinct bg |
| players | Hero scatter — depth on re-read | **Locked (B):** era tint + hover card + click-through; intro stays |
| players | LEADERS block — bar chart? fewer numbers? | **Locked (C+):** apps + goals board with total/per-game toggle; cut assists board |
| players | Assists column optional / hidden by default? | **Locked (A):** hidden by default, column toggle |
| managers | Hero timeline "blocky/clunky — what else?" | **Locked (A):** polish in place — edges, labels, portraits on wide segments |
| managers | Empty space in list rows — supporting act? | **Locked (B):** accept layout; no filler fact |
| matches | Search/filter feels like barrier | **Locked (A):** collapsed by default; Refine expands deck |
| matches | "10 of N matches" season header | **Locked (A):** n of N when slice < season total |
| season | Season nav strip — nicer treatment | **Locked (A):** inline breadcrumb with prev/next |
| matches | Season transition / summary bar spacing | Small polish |
| matches | Lineup pitch spacing + empty space | Match detail layout |
| matches | Full-bleed hero on huge screens | Responsive design |
| season | Season nav strip — nicer treatment | Component redesign |
| season | "Season in brief" less robotic | Template / copy |
| season | Season in brief horizontal fill | Layout |
| season | Match-by-match chart clickable | Interaction + routing |
| season | Competition initials badges "tacky" | Badge redesign |
| season | Era-specific league table footnote | Partial: war-years note shortened on `/seasons`; per-era on detail page still open |
| analytics | Monte Carlo needs more explaining | **Locked (A):** keep chart; add plain-language dek + explainer |
| analytics | Page rethink — Acts I–II + supply lines only | **Locked (B):** cut peaks, win/goals/attendance charts |
| analytics | "What it produced" section — cut? | **Yes** — Act III header reframed for supply lines only |
| analytics | Peaks grid — cut (big X) | **Cut** (locked B) |
| analytics | Win rate / goals charts — cut (big X) | **Cut** (locked B) |
| analytics | Attendance chart "too boring" | **Cut** (locked B) |
| analytics | Supply lines → barbell / connected scatter | **Locked (A):** barbell rows, assister ↔ scorer |
| opponents | Entire page rethink from ground up | **Done (locked A):** cut `/opponents` index + nav; flat breadcrumb on entity pages |
| transfers | Manager images + sparkle | **Done (locked):** foundation + split spark + featured #1 (hybrid copy). Ship: tide hero, deal cards, `SpendBars` avatars |

---

## Screenshot index

| Folder | Files | Dates |
| --- | --- | --- |
| `/` (data) | 5 screenshots | 2026-07-01 |
| `analytics/` | 3 | 2026-07-01 |
| `data/` | (empty — data shots at root) | — |
| `explore/` | 1 | 2026-07-01 |
| `homepage/` | 4 (2 Jun 29, 2 Jul 1) | mixed |
| `managers/` | 2 | mixed |
| `matches/` | 2 | 2026-06-29 |
| `opponents/` | 1 | 2026-07-01 |
| `players/` | 4 | mixed |
| `season/` | 2 | 2026-06-29 |
| `seasons/` | 2 (matches list UI) | 2026-06-29 |
| `transfers/` | 1 | 2026-07-01 |

---

## Session handoff

**Verified:** 138 tests green; knip clean.

**Session 2 grill (2026-07-01):** Product decisions locked for transfers, data,
opponents (cut index), analytics cuts, home, players, managers, matches, season
nav. See **Steer** table for status; remaining rows are polish-pass (no product
fork). `CONTEXT.md` §4 updated.

**Uncommitted** at session end — review diff before commit.

**Suggested implementation order:**

1. **Cuts** — `/opponents` index, home goalscorers, analytics Act III charts,
   home 3-card → 1 myth
2. **Data page** — dual-lane layout (slim table, source rows, gaps queue, dev appendix)
3. **Transfers + players + analytics supply lines** — visual investments locked
4. **Polish pass** — season in brief, match detail layout, badges, spacing (no new
   product calls)
