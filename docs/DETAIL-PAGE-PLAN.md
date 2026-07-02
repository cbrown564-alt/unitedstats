# Detail page restraint plan

**Status:** `/player/[id]` is the reference implementation. Phases 1–4 shipped; a
follow-up refinement pass (2026-07-01/02) cut two tabs, enriched the survivors, and
relaxed the blanket “collapse all analytics” rule. Use this doc as the template for
`/opponent/[id]`, `/manager/[id]`, `/seasons/[season]`, and future entity pages.

**Context:** Detail pages accumulated every dataset lane at equal visual weight — a
classic archive failure mode. Mobile tabs (`DetailSectionTabs`) helped contain panels on
phone, but desktop stacked all tabs into one endless scroll, and most analytics
collapsibles defaulted open. See player-page review screenshots (2026-07-01) and
`docs/MOBILE.md` for shell context.

**Product stance:** Researcher-first with honest lanes — not a single Wikipedia-style
total. **Restraint through tab scoping and hierarchy, not through hiding everything
behind collapsibles.** Hero = one defensible headline; tabs = scoped evidence
workspaces; disclosure follows what orients vs what merely elaborates.

---

## Core principles (from the shipped player page)

These are the durable rules. Earlier phase specs below are historical; when they
conflict with this section, follow this section.

### 1. Hero = one defensible headline

The plate is a single composed object: identity, **one dominant figure** (goals for
players), secondary stats at lower weight, and a career arc (debut → peak → latest).
The hero answers the headline question once; everything below is evidence.

### 2. Honest lanes, not one Wikipedia total

Multiple data sources coexist but never compete at equal typographic weight:

- **Club record** in the hero (e.g. “Verified competitive record”).
- **Recorded splits** in tab headers and table semantics (empty cell = coverage gap,
  not zero).
- **Curated / hand-attributed lanes** labeled, sourced, and scoped to the tab they
  explain.

When totals differ, **label the lane before showing a second number.** Consolidate
repeated trust vocabulary into one page-level **Data coverage** collapsible
(`PlayerDataCoverage` on the player page).

### 3. Tabs = scoped workspaces, one panel everywhere

`DetailSectionTabs` shows **one active panel at all breakpoints** — no desktop
infinite scroll through every tab. Tab count follows **user questions**, not “one tab
per dataset.” Cut tabs that only duplicate the hero or exist solely for navigation
trails.

### 4. Primary evidence upfront; analytics serve the audit surface

The sortable season table (or equivalent ledger/list) is the audit surface. Around it:

- **Orientation first** — peak-season highlights, a season chart when it orients.
- **Archives expandable, not flat** — haul cards as highlight reel, then season-grouped
  accordions with the newest group open by default.
- **Analytics live inside the tab they explain** — not as equal-weight hero competitors.

Default-open vs default-closed follows **what answers faster**, not a blanket rule.

### 5. Archives must leave the building

Cutting density never means cutting reachability. Every evidence stack keeps escape
hatches: `EvidenceLink` → match browser, `ArchiveJumpRail` for long careers, season
and match deep links, share/cite and suggest correction on the plate.

### 6. Enrich what stays; delete what duplicates

Invest in surfaces that earn their slot (season table micro-bars, medal pips, decade
headers; transfer fee timeline; scoring season accordions). Remove duplicate trails —
pick one canonical surface for peak season, top opponent, club rank, etc.

### 7. Push back when the literal spec undermines the goal

Faithful execution that adds noise or duplication is still a failure (see
`docs/RESTRAINT-PASS-PHASE2-REVIEW.md`). Examples from the player refinement pass:

- Season chart **open** in Career History — it orients before the table.
- Transfers get a **dedicated tab + timeline**, not row #1 buried in overview.
- Appearances tab **removed** — starts/subs derivable from hero; lineup archive did
  not justify a tab on this page.
- Links / More tab **removed** — rank already in hero; one back link suffices.

---

## Reference implementation — `/player/[id]`

### Final tab map

| Tab id | Label | Primary job |
|--------|-------|-------------|
| `career` | **Career History** | Season trajectory — chart (when >1 season) + sortable season ledger |
| `goals` | **Goals & Assists** | Scoring evidence, curated goal-type breakdown, assist partnerships |
| `transfers` | **Transfers** | Transfer record as fee-scaled timeline |

Tabs **cut** after refinement (absorbed elsewhere or not worth a slot):

| Former tab | Disposition |
|------------|-------------|
| Appearances | Cut — starts/subs in hero plate; full lineup archive removed from player page |
| Links / More | Cut — club rank in hero; “← All players” at page foot |

### Content order (player)

**Career History:**

1. Goals and assists by season chart (**open** when `bySeason.length > 1`)
2. Season by season — coverage count, `PlayerSeasonHighlights`, `PlayerSeasonTable`

**Goals & Assists:**

1. Curated goal-type body map (`ChartPanel`, when curated data exists)
2. Assist partnerships
3. Matches where he scored — one-line context (top opponent, scoring run)
4. Haul cards (highlight reel, capped) → `PlayerScoringArchive` (season accordions,
   newest open; jump rail when career span ≥ 15 seasons)

**Transfers:**

1. `PlayerTransferRecord` — vertical fee timeline (signings left, departures right)

**Below tabs:**

- `PlayerDataCoverage` — one collapsed footnote for all lanes
- Back link to index

### Hero plate (`PlayerPlate`)

- Dominant goals figure + club rank among goalscorers
- Secondary ribbon: apps (with sub count), goals/app, multi-goal apps, assists
- Career arc with linked debut, peak season, latest match
- Footer band: one-line trust note + suggest correction; share/cite top-right

---

## Phases (historical — player page)

| Phase | Scope | Status |
|-------|--------|--------|
| **1** | Desktop tabs (`DetailSectionTabs`) | Done — global primitive |
| **2** | Number hierarchy + curated lane demotion | Done — evolved: curated inline in Goals tab, not collapsed Overview block |
| **3** | Tab restructure | Done — then refined to 3 tabs (see above) |
| **4** | Coverage note consolidation | Done — `PlayerDataCoverage` |

### Phase 1a — `DetailSectionTabs` (global)

**Problem:** Below `sm`, tabs worked; at `sm+`, every panel stacked (`hidden sm:block`),
producing a longer scroll than mobile with no section navigation.

**Shipped:**

- Tab bar at **all** breakpoints.
- Inactive panels `hidden` at every size; only the active panel visible.
- `desktopOnly` tabs: absent from tab bar, `hidden sm:block` (e.g. match lineup).

**Rollout:** Primitive change is global (player, opponent, manager, season, match).
Page-specific tab maps and disclosure defaults are per-page.

### Phase 1b — Disclosure (revised)

**Original intent:** Default-closed analytics via `<details>`.

**What shipped:** Tabs do most of the containment work. Nested `<details>` remain for:

- Long archives (`PlayerScoringArchive` season rows; only newest open)
- Page-level data coverage footnote

Default-**open** where it orients (season chart, season table, haul cards). Default-**closed**
or tab-scoped for elaboration that duplicates hero or table insights.

### Phase 4 — Coverage note consolidation

**Shipped:**

- One page-level collapsible **Data coverage** after tabs (`PlayerDataCoverage`).
- Chart-specific encoding footnotes stay inline (minute bins, stoppage time, season
  chart coverage gaps via `playerSeasonChartFootnotes`).
- Section-level `CoverageNote` inside the collapsible, not repeated on scroll.

---

## Apply to other detail pages

Decision tree per page:

1. **Hero** — identity + one headline answer + compressed trust note.
2. **Tabs** — one job each; cut tabs that duplicate hero or serve only as link dumps.
3. **Primary tab** — narrative + sortable table/list as the audit surface.
4. **Evidence tabs** — match archives with jump rails and browser links.
5. **Coverage** — one page-level collapsible when multiple lanes exist.
6. **Disclosure** — tabs first; `<details>` only where the full list is long; default-open
   when it orients.

| Page | Likely tab themes | Notes |
|------|-------------------|-------|
| `/opponent/[id]` | Fixture · Matches · … | Audit open collapsibles; align with player archive patterns |
| `/manager/[id]` | Tenure · Matches · … | Same pattern |
| `/seasons/[season]` | Campaign · Squad · … | Season ledger + tables |
| `/match/[id]` | Match · Lineup (`desktopOnly`) | Keep lineup desktop-only stack |

Do **not** assume every entity page needs Appearances, Links, or More tabs — derive
tab count from genuine user questions.

---

## Do NOT cut

These stay even when trimming density:

1. Match browser deep links — `EvidenceLink`, `ArchiveJumpRail`, season links.
2. Lane honesty — club record vs recorded vs curated; graded coverage counts.
3. Full sortable season table with empty-cell = coverage gap semantics.
4. Curated Tableau lane (labeled, linked to source) where it exists.
5. Career arc with debut / latest / peak season.
6. Scoring archive with role/goal encoding and season grouping.
7. Assist partnerships (in the tab they belong to — Goals for players).
8. Transfer record when present (dedicated tab/surface on player page).
9. Suggest correction + share/cite on the plate.
10. Club rank among recorded goalscorers (hero, not a Links tab).

---

## Target density

~30–40% reduction in **perceived** density on first load:

- One tab visible on desktop (not every section stacked).
- Hero carries the headline; tabs scope the rest.
- Primary evidence reachable without extra taps; long archives behind purposeful
  disclosure (tabs, then accordions).

**First mobile viewport (player):** compact hero → Career History tab → season chart
(if multi-season) + season table → Goals & Assists and Transfers one tap away → Data
coverage collapsed below.

---

## Implementation checklist (per page)

When applying this plan to a new detail page:

- [ ] Hero answers one headline question; competing totals are lane-labeled.
- [ ] Tabs scoped by user job; no tab exists only to duplicate hero or host link cards.
- [ ] Single active panel at all breakpoints (`DetailSectionTabs`).
- [ ] Primary audit surface (table/list) visible without extra taps in its tab.
- [ ] Disclosure: tabs first; audit `<details open>` defaults (open = orients, closed = elaborates).
- [ ] Map duplicate insights (hero vs tabs) and pick one canonical surface.
- [ ] One page-level **Data coverage** collapsible when multiple lanes exist.
- [ ] Evidence escape hatches — match browser, jump rails, deep links.
- [ ] Screenshot phone (390×844) and desktop (1280) — see `AGENTS.md`.
- [ ] Run `npm run knip` — no orphan files; scripts under `scripts/` if added.

---

## References

- `components/mobile/DetailSectionTabs.tsx` — shared tab primitive.
- `components/PlayerPlate.tsx` — player hero plate.
- `components/player/PlayerSeasonHighlights.tsx` — peak-season orientation above ledger.
- `components/player/PlayerScoringArchive.tsx` — season-grouped scoring accordions.
- `components/player/PlayerTransferRecord.tsx` — transfer fee timeline.
- `components/PlayerSeasonTable.tsx` — sortable season audit surface.
- `app/player/[id]/page.tsx` — reference detail page.
- `docs/SOURCE-AUDIT.md` — multi-lane data model (club record, match-attributed, curated).
- `docs/MOBILE.md` — shell tiers and screenshot workflow.
- `docs/RESTRAINT-PASS-PHASE2-REVIEW.md` — push back when the spec undermines the goal.
