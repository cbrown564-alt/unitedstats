# Polish backlog

Living list of known bugs, display quirks, and polish items identified in
code review and UI sweeps (June 2026). Use this for the next polish passes;
cross-check `docs/VISUAL-AUDIT.md` for broader design/UX audit items.

**Last updated:** 2026-06-25

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

---

## Open — bugs and correctness

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P1 | Ingest surname index still uses last token | `scripts/player-resolver.ts` `nameParts()`, `tableau-goals-assists.ts`, `mufcinfo-lineups.ts`, `mufcinfo-goal-minutes.ts` | Display is fixed; ingest/resolution can still mis-match `de Gea` / `van der Sar` labels unless slug ends with full family name |
| P2 | Transfer portrait queries use `local_path` only | `lib/queries.ts` ~1740 | Same gap assist partnerships had before `COALESCE` |
| P2 | `cache:media` not in `prebuild` / CI | `package.json` | Fresh deploys can ship manifests without cached WebPs until ops runs `npm run cache:media` |

---

## Open — display and UX polish

### Portraits and media

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P1 | Analytics assist partnerships are text-only | `app/analytics/page.tsx` | Player page uses `AssistPartnerships` with portraits; analytics “Supply lines” does not — data now has thumbs |
| P2 | OG event list has no per-row Commons attribution | `components/OwnGoalProfile.tsx` | Hero/player pages link license when `pageUrl` exists; long OG list does not |
| P1 | ~25 players have no Commons image | `data/canonical/player-media.json` `missing[]` | e.g. Joe Spence, Stan Pearson, Gary Pallister — initials fallback |
| P1 | Post-retirement Wikidata P18 for legends | `scripts/ingest/wikidata-player-media.ts` | Extend `CURATED_COMMONS_OVERRIDES` / `MANUAL_PORTRAIT_SOURCES` (Keane, Schmeichel, Cantona, Bruce, etc.) |
| P2 | Long tail (~850 players) outside media cohort | ingest selection logic | Accept initials, or expand cohorts thoughtfully |

### Truncation and dense layouts

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P2 | Match list meta columns truncate on `sm+` | `components/MatchList.tsx` | Competition `10.5rem`, round `7rem`; mobile sub-line improved but desktop rail still clips long European names |
| P2 | `SplitBar` / `CupLeanBar` hide counts in narrow segments | `components/charts/SplitBar.tsx`, `CupLeanBar.tsx` | Labels hidden or truncated when segment &lt; ~11% width |
| P2 | `GeoScatter` label overlap | `components/GeoScatter.tsx` | Top-N labels to the right of dots; no collision avoidance |
| P2 | Season competition headers clip | `app/seasons/[season]/page.tsx` | `line-clamp-2` mobile → `sm:truncate` |
| P2 | Manager index names on very narrow screens | `app/managers/page.tsx` | Opponents pass `compactName`; managers usually short enough — revisit if needed |

### Copy and micro-consistency

| Priority | Item | Where | Notes |
|----------|------|-------|-------|
| P2 | Search placeholder tone varies | `HeaderSearch`, `CommandPalette`, `app/search/page.tsx`, `SearchCommand` | Different guidance across entry points |
| P3 | `ShirtBadge` shows `--` when number missing | `components/ShirtBadge.tsx` | Consider quieter empty state |
| P3 | `TransferList` uses `"date unknown"` | `components/TransferList.tsx` | Elsewhere site prefers `—` (`lib/format.ts`) |
| P3 | Pre-war OG scorers show as `"Unknown"` | `components/OwnGoalProfile.tsx` | Data-correct; visually flat |
| — | **Copy-refine pass in progress** | `app/page.tsx`, `lib/questions.ts`, `components/WhatsInteresting.tsx`, en-dash normalisation in streak modules | Uncommitted WIP — see `docs/COPY-REFINE-LOG.md` |

### Intentional (do not “fix” without product decision)

| Item | Notes |
|------|-------|
| Pitch surnames vs teamsheet full names | Documented in `FormationPitch.tsx` — compact pitch labels vs full names in list/bench |
| Opponent monograms not crests | `ClubBadge` by design (licensing); long-tail European names can produce weak monograms |
| Three-letter codes still exist | `lib/clubNames.ts` `code` tier — used outside match hero; not removed |

---

## Open — from `docs/VISUAL-AUDIT.md` (not yet in a polish pass)

These predate the June 2026 sweep but remain valid. See the audit for detail.

| Severity | Page / area | Summary |
|----------|-------------|---------|
| High | `/analytics/odds` | Native opponent `select`; calibration table mobile overflow; hero layout |
| Medium-high | `/analytics/travel` | Map should lead; metric chips; legend clarity |
| Medium | `/match/[id]` | Facts `dl` vs `StatTile`; teamsheet grouping; page length on mobile |
| Medium | `/player/[id]` | Long chart stack on mobile — more collapsible groups |
| Medium | Global G-05 | `text-ink-faint` on trust/coverage surfaces — contrast |
| Medium | Global G-06 | Atmosphere beyond competition colour (texture, honours markers) |
| Low-medium | Global G-07 | Hover/focus vocabulary consistency across link types |

---

## Suggested next passes

1. **Media queue** — Curated overrides + manual crops for 5–10 legends; run `cache:media`; add `check:media --strict-coverage` to CI once stable.
2. **Analytics assist UI** — Reuse `AssistPartnerships` (or thumbnails) on `/analytics` supply lines.
3. **Ingest surname alignment** — Share `familyName()` slug logic with `nameParts()` so Tableau/MUFCInfo resolution matches display.
4. **Mobile page depth** — `/player/[id]` and `/match/[id]` collapsible sections; `/analytics/odds` combobox.
5. **Copy-refine** — Land or split the uncommitted homepage/questions copy work.

---

## How to update this doc

When closing an item:

1. Move it to **Recently completed** with a one-line note.
2. Reference the commit or PR if helpful.
3. Bump **Last updated**.

When adding an item:

- Include **priority** (P0–P3), **file path**, and **one sentence** on the user-visible symptom.
- Prefer linking to an existing audit ID (e.g. G-05) rather than duplicating long prose.
