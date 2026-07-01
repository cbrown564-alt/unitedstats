# Detail page restraint plan

**Status:** Phase 1 in progress on `/player/[id]`. Use this doc as the template for
`/opponent/[id]`, `/manager/[id]`, `/seasons/[season]`, and future entity pages.

**Context:** Detail pages accumulated every dataset lane at equal visual weight — a
classic archive failure mode. Mobile tabs (`DetailSectionTabs`) helped contain panels on
phone, but desktop stacked all tabs into one endless scroll, and most analytics
collapsibles defaulted open. See player-page review screenshots (2026-07-01) and
`docs/MOBILE.md` for shell context.

**Product stance:** Researcher-first with honest lanes — not a single Wikipedia-style
total. Hero = one defensible headline; tabs = scoped evidence workspaces; collapsibles =
closed for analytics, open for primary evidence (tables, archives, match lists).

---

## Phases

| Phase | Scope | Surfaces | Status |
|-------|--------|----------|--------|
| **1** | Desktop tabs + default-closed analytics | `DetailSectionTabs`, `/player/[id]` | In progress |
| **2** | Number hierarchy + curated lane demotion | `PlayerPlate`, player Overview tab | Planned |
| **3** | Tab restructure (rename, reorder, dedupe) | Player tabs; then opponent/manager/season | Planned |
| **4** | Coverage note consolidation | Shared `CoverageNote` usage | Planned |

---

## Phase 1 — Desktop tabs + default-closed analytics

### 1a. `DetailSectionTabs` — one panel at all breakpoints

**Problem:** Below `sm`, tabs worked; at `sm+`, every panel stacked (`hidden sm:block`),
producing a longer scroll than mobile with no section navigation.

**Change:**

- Show the tab bar at **all** breakpoints (remove `sm:hidden` from tablist).
- Inactive tab panels stay `hidden` at every size; only the active panel renders.
- Preserve `desktopOnly` tabs: still absent from the tab bar, still `hidden sm:block`
  (desktop-only stack for match-detail lineup, etc.).

**Rollout:** Changing the primitive affects every consumer — player, opponent, manager,
season, and match (via `MatchSectionTabs`). Phase 1 ships the primitive change globally;
page-specific disclosure defaults are player-only until later phases.

### 1b. Player page — default-closed analytics

**Problem:** Five `<details open>` blocks expanded every chart on first load, defeating
progressive disclosure.

**Change — remove `open` from:**

| Section | Tab | Rationale |
|---------|-----|-----------|
| Scoring profile (minute chart, comp split, top opponent, scoring run) | Overview (`career`) | Analyst overlay |
| Goals and assists by season (chart) | Overview | Table is primary evidence |
| Contribution spine | Goals | Haul cards answer faster |
| Starts vs subs split bar | Apps | Derivable from hero starts/subs |

**Keep `open` on:**

| Section | Tab | Rationale |
|---------|-----|-----------|
| The full table (`PlayerSeasonTable`) | Overview | Sortable audit surface |

---

## Phase 2 — Number hierarchy + curated lane demotion

**Problem:** Hero shows club-record goals (`p.goals`); curated Tableau lane shows
different totals (e.g. 253 vs 229) at equal typographic weight — reads as a bug.

**Changes:**

- Hero: label dominant figure **Club record**; lane chips on ambiguous stats (`record` /
  `recorded` / `curated`).
- Collapse `PlayerPlate` footer caveat into **About these numbers ▸** (one line default).
- Curated block: collapsed `<details>` summary, not competing StatTile hero numbers.
- When `curatedTotals.goals !== p.goals`, one-line reconciler in summary text.
- Assists: hero detail → **Combined (curated + match events)**; remove vague
  `incl. curated` without explanation.

**Do not delete lanes** — label and hierarchy, not data removal.

---

## Phase 3 — Tab restructure (player first, then others)

### Proposed tab map (player)

| Current id | Proposed label | Primary job |
|------------|----------------|-------------|
| `career` | **Overview** | Transfers, season table, curated lane |
| `goals` | **Goals** | Hauls + scoring archive |
| `apps` | **Appearances** | Lineup archive |
| `more` | **Links** / **More** | Navigation trails only |

### Reorder / relocate

**Overview:**

1. Transfer record (if any)
2. Season by season — **table first**, chart second (closed)
3. Curated lane (collapsed)
4. Scoring profile (collapsed)
5. Assist partnerships — move **out of More** (collapsed, summary line)

**Goals tab:**

1. Intro + haul cards (**open**)
2. Contribution spine (**closed**)
3. Season archive rows (unchanged)

**More tab:**

- Drop duplicate peak-season / top-opponent trails (already in scoring profile).
- Keep rank + navigation cards only.

### Apply to other detail pages

Use the same decision tree per page:

1. **Hero** — identity + one headline answer + compressed trust note.
2. **Overview tab** — narrative + primary table; analytics collapsed.
3. **Evidence tabs** — match archives with jump rails and browser links.
4. **More / Links** — navigation only, no duplicated analytics.

| Page | Likely tab themes | Notes |
|------|-------------------|-------|
| `/opponent/[id]` | Fixture · Matches · More | Already tabbed; audit open collapsibles |
| `/manager/[id]` | Tenure · Matches · More | Same pattern |
| `/seasons/[season]` | Campaign · Squad · More | Season ledger + tables |
| `/match/[id]` | Match · Lineup (`desktopOnly`) | Keep lineup desktop-only stack |

---

## Phase 4 — Coverage note consolidation

**Problem:** `CoverageNote`, hero caveat, and inline chart footnotes repeat
“not a career total” / slice vocabulary on every scroll.

**Changes:**

- One page-level collapsible **Data coverage** after tabs where multiple notes today.
- Keep chart-specific encoding footnotes (minute bins, stoppage time).
- Use `CoverageNote collapsible` on mobile for remaining section notes.

---

## Do NOT cut

These stay even when trimming density:

1. Match browser deep links — `EvidenceLink`, `ArchiveJumpRail`, season **Open** buttons.
2. Lane honesty — curated vs recorded vs club record; graded coverage counts.
3. Full sortable season table with empty-cell = coverage gap semantics.
4. Curated Tableau lane (labeled, linked to source).
5. Career arc with debut / latest / peak season.
6. Scoring and lineup archives with role encoding.
7. Assist partnerships (relocate, don’t delete).
8. Transfer record when present.
9. Suggest correction + share/cite on the plate.
10. Club rank among recorded goalscorers.

---

## Target density (player)

~30–40% reduction in **perceived** density on first load:

- One tab visible on desktop (not four stacked sections).
- Analytics collapsed until the user expands them.
- Primary evidence (season table, haul cards, archives) remains reachable without extra taps.

**First mobile viewport after all phases:** compact hero → Overview tab → transfers +
season table (open) → collapsed curated / scoring / partnerships below the fold.

---

## Implementation checklist (per page)

When applying this plan to a new detail page:

- [ ] Audit `<details open>` — default open only for primary evidence tables/lists.
- [ ] Confirm tabs work on desktop (single active panel).
- [ ] Map duplicate insights (hero vs tabs vs More) and pick one canonical surface.
- [ ] Label competing totals with lane names before showing second numbers.
- [ ] Screenshot phone (390×844) and desktop (1280) — see `AGENTS.md`.
- [ ] Run `npm run knip` — no orphan files; scripts under `scripts/` if added.

---

## References

- `components/mobile/DetailSectionTabs.tsx` — shared tab primitive.
- `components/PlayerPlate.tsx` — player hero plate.
- `app/player/[id]/page.tsx` — first page refactored.
- `docs/SOURCE-AUDIT.md` — multi-lane data model (club record, match-attributed, curated).
- `docs/MOBILE.md` — shell tiers and screenshot workflow.
