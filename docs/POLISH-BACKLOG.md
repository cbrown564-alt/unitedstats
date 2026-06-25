# Polish backlog

Living list of known bugs, display quirks, and polish items identified in
code review and UI sweeps (June 2026). Use this for the next polish passes;
cross-check `docs/VISUAL-AUDIT.md` for broader design/UX audit items.

**Last updated:** 2026-06-25 (G-06 atmosphere pass)

---

## Recently completed (June 2026)

These are done on `master` — listed here so we do not re-open them.

### Names and labels

- [x] Particle-aware surnames (`lib/names.ts` — `familyName()`, `initialsFor()`)
- [x] Wired into match flow, pitch, greatness map, manager charts, analytics eras
- [x] Unified career spans (`fmtYearRange()`, `playerCareerSpan()` in `lib/format.ts`)
- [x] Players search disclosure said “matches” instead of “players”

### P0 bugs

- [x] `CupLeanBar` row/header column grid mismatch
- [x] Active players showed dangling `1990–` (now `1990–present`)
- [x] Match page untimed goals used `player_name` for linked scorers inconsistently

### Media and portraits

- [x] Expanded `cache:media` run (players, managers, OG scorers)
- [x] `COALESCE(local_path, thumb_url, image_url)` for player/manager/OG queries
- [x] Assist partnership queries use the same portrait fallback
- [x] `OwnGoalProfile` portraits in repeat-scorer and event lists
- [x] Curated Commons overrides + manual portrait pipeline (`MANUAL_PORTRAIT_SOURCES`)
- [x] Denis Law hand-crop from `Manu-Finland-1965.jpg`

### Mobile legibility (first pass)

- [x] Match hero: broadcast **short** names below `lg` (no 3-letter codes)
- [x] Match list: opponent short names on mobile; competition on mobile sub-line
- [x] Players table: two-line name wrap instead of `max-w-[27vw]` truncate
- [x] Opponent index: `IndexRow` `compactName` with broadcast shorts
- [x] Record / notable / haul cards: two-line copy on mobile; opponent shorts
- [x] Cut chart label gutter widened on mobile (`w-28`)
- [x] Elo era labels hidden when band &lt; 7% of chart width

### Bugs and correctness (second pass)

- [x] Ingest surname index uses `familyNameSlug()` — `nameParts()` in `player-resolver.ts` + Tableau surname index; MUFCInfo lineups/goal-minutes inherit via resolver
- [x] Transfer portrait queries use `COALESCE(local_path, thumb_url, image_url)` (`lib/queries.ts`)
- [x] `cache:media` in `prebuild`; CI runs `cache:media` + `check:media`

### Portraits and media (second pass)

- [x] Analytics “Supply lines” shows assister/scorer portraits (`app/analytics/page.tsx`)
- [x] OG event list per-row Commons attribution when `pageUrl` exists (`OwnGoalProfile.tsx`)
- [x] Curated playing-era overrides for Keane, Schmeichel, Cantona, Bruce (`wikidata-player-media.ts`)

### Truncation and dense layouts (second pass)

- [x] Match list meta columns: flexible `minmax` grid, `competitionShortName()` with `title` tooltip
- [x] `SplitBar` / `CupLeanBar`: lower label threshold (7%/9%), scaled type, `title` tooltips in narrow segments
- [x] `GeoScatter`: basic vertical collision avoidance for top-N labels
- [x] Season competition headers: `line-clamp-2` at all breakpoints (removed `sm:truncate`)

### Copy and micro-consistency (second pass)

- [x] Unified search placeholder via `SEARCH_PLACEHOLDER` in `lib/search/examples.ts`
- [x] `ShirtBadge` quieter empty state (blank compact; `—` non-compact)
- [x] `TransferList` unknown dates use `—` instead of `"date unknown"`
- [x] Copy-refine pass landed (`app/page.tsx`, `lib/questions.ts`, `components/WhatsInteresting.tsx`, streak modules — see `docs/COPY-REFINE-LOG.md`)

### Visual audit pages (second pass)

- [x] `/analytics` odds: `SelectCombobox` opponent picker; hero forecast layout; mobile-safe calibration table
- [x] Away-days travel: map leads via `Module` `visual` slot; metric chips; `GeoScatter` legend
- [x] `/match/[id]`: facts → `StatTile`; grouped teamsheet panel; collapsible “Match details”
- [x] `/player/[id]`: collapsible chart groups (scoring shape, season contribution, spine, starts vs subs)

### Global design tokens (third pass)

- [x] G-05 trust-surface contrast — 41 `text-ink-faint` → `text-ink-dim` promotions on coverage/caveat text (match, player, seasons, QuestionModules, OwnGoalProfile, MatchList, ReliabilityCurve)
- [x] G-07 link/hover vocabulary — three tiers documented in `docs/DESIGN-REFRESH.md`; `IndexRow`, match/player pages, `EvidenceLink`, `SelectCombobox` aligned
- [x] Manager index `compactName={familyName(m.name)}` with full-name tooltip on `IndexRow`
- [x] Match page mobile tabs (Option A) — `MatchSectionTabs`: Goals · Sheet · Details · Context · Sources below `sm`; desktop narrative unchanged

### G-06 atmosphere (fourth pass)

- [x] Shared honours vocabulary — `HonoursBadge`, `HonoursChip`, `TrophyGlyphFilled` + `TROPHY_CAT_TONE` in `CampaignIcons`; compare cabinet deduped
- [x] Manager detail trophy cabinet — `ManagerHonoursPanel` on `/manager/[id]` via exported `managerTrophyHaul()`
- [x] Elo trophy markers — gold `ReferenceDot` per honour season on analytics Elo chart (`honourSeasonMarkers()`)
- [x] Season ledger era accents — `eraForFirstMatchYear()` left-border on season rows; `DecadeHonours` uses `HonoursChip`
- [x] Match hero floodlit plate — `hero-grid` + devil wash on score header

---

## Open — bugs and correctness

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| — | *(none)* | | Second pass cleared P1–P2 items |

---

## Open — display and UX polish

### Portraits and media

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P1 | ~18 players still have no Commons image | `data/canonical/player-media.json` `missing[]` | e.g. Joe Spence, Lou Macari, Gary Pallister — initials fallback; down from ~25 after legend overrides |
| P2 | Long tail (~850 players) outside media cohort | ingest selection logic | Accept initials, or expand cohorts thoughtfully |
| P2 | `check:media --strict-coverage` not yet in CI | `scripts/check-media.ts` | `check:media` runs in CI; strict coverage flag deferred until missing[] stabilises |

### Truncation and dense layouts

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| — | *(none)* | | Manager `compactName` done in third pass |

### Copy and micro-consistency

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P3 | Pre-war OG scorers show as `"Unknown"` | `components/OwnGoalProfile.tsx` | Data-correct; visually flat |

### Intentional (do not “fix” without product decision)

| Item | Notes |
|------|-------|
| Pitch surnames vs teamsheet full names | Documented in `FormationPitch.tsx` — compact pitch labels vs full names in list/bench |
| Opponent monograms not crests | `ClubBadge` by design (licensing); long-tail European names can produce weak monograms |
| Three-letter codes still exist | `lib/clubNames.ts` `code` tier — used outside match hero; not removed |

---

## Open — from `docs/VISUAL-AUDIT.md` (remaining)

| Severity | Page / area | Summary |
|----------|-------------|---------|
| Low | `/player/[id]` | “How he scored & created” / curated Tableau block lower on scroll stack |

*G-06 largely addressed in fourth pass (honours markers, era accents, match hero texture, Elo trophy dots). Optional tail: `FinishTimeline` era wash.*

---

## Suggested next passes

1. **Remaining media queue** — Curated overrides / manual crops for the 18 `missing[]` legends; run `cache:media`; enable `check:media --strict-coverage` once stable.
2. **G-06 tail** — Optional `FinishTimeline` managerial-era wash if the season ledger accents feel too quiet.
3. **G-05 tail** — Optional second pass on decorative-faint vs actionable-faint in index/table meta (low priority).

---

## How to update this doc

When closing an item:

1. Move it to **Recently completed** with a one-line note.
2. Reference the commit or PR if helpful.
3. Bump **Last updated**.

When adding an item:

- Include **priority** (P0–P3), **file path**, and **one sentence** on the user-visible symptom.
- Prefer linking to an existing audit ID (e.g. G-05) rather than duplicating long prose.
