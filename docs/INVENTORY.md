# Surface Inventory

Last refreshed: 2026-06-15 (Bold Simplification pass — ADR 0002)

A map of every surface the app exposes — routes, shared components, analytics
and question modules, and data lanes — with each one's purpose and where it
overlaps another surface. It is meant to stay an honest map, so consolidations
already applied are recorded as resolved and the remaining overlaps are flagged.

The Bold Simplification pass (ADR 0002) took routes from ~16 to 14, slimmed
`/analytics` from ~14 competing modules to a strength + trends surface, demoted
records/coverage to links, and made the match page lead with one primary answer.
The real win is the module/duplication reduction, not the route count.

## Routes

### Index / browse
- `/` — curiosity launchpad: hybrid search, myth prompts, recent evidence,
  routes into the record. Bespoke hero (intentionally not `PageHeader`).
- `/matches` — The Record (canonical home of match data). Filters, quick views,
  decade rail, sorts (recent/oldest/biggest win/**heaviest defeat**/best
  attended), season-grouped rows, slice summary. `PageHeader` + `StatTile` + `Pager`.
- `/seasons`, `/seasons/[season]` — decade-grouped index; per-season record,
  brief, table.
- `/players`, `/player/[id]` — searchable index; profile with progressive
  disclosure and per-season splits.
- `/managers`, `/manager/[id]` — index with WdlBar rows; tenure record, splits,
  first-ten, by-competition, paged matches.
- `/opponents`, `/opponent/[id]` — searchable index; head-to-head detail.
- `/match/[id]` — a match's canonical answer: scoreline + scorers open;
  Teamsheet / Context / Provenance collapsed into labelled disclosures. The
  reference Primary-Answer template the other detail pages inherit.

### Interpretation
- `/questions` — seven myth-testing modules (late goals, bogey sides, European
  weeks, manager bounce, fortress OT, cup specialists, **away days** — the
  former travel surface, folded in with the away map as evidence) + sticky rail.
- `/analytics` — the strength surface: Elo retrospective (timeline) **+
  prospective (odds widget, season replay, calibration — folded in from the
  former `/analytics/odds`)** + season trends + grounds + assist partnerships.
  Records link into `/matches` sorts; coverage links to `/data`.
- `/data` — coverage ledger, source catalog, correction guidance, API/downloads.

Removed this pass: `/analytics/odds` (folded into `/analytics`) and
`/analytics/travel` (folded into `/questions#away-days`); both old URLs now
308-redirect to their new homes (`next.config.ts`).

### Machine-readable
- `/api/search` — hybrid entity + shaped-answer search (powers header search).
- `/api/v1/*` — read-only JSON: meta, competitions, managers, matches[/id],
  opponents, players[/id], seasons[/season].

## Shared components

| Component | Role | Used by |
| --- | --- | --- |
| `PageHeader` / `StatTile` / `TrailLink` | page identity + numeric tiles + trail cards | index pages, analytics, player/opponent/manager detail |
| `MatchList` / `MatchGroups` | canonical compact match row / season-grouped rows | every match-bearing surface |
| `MatchArchive` / `ArchiveJumpRail` | volume-adaptive footer archive (full stream <150 matches, else expandable season summaries) + sticky scrollspy jump rail (season→period→decade chips) | manager/opponent detail; rail alone on player detail |
| `WdlBar` / `WdlRecord` | diverging W/D/L record glyph | indexes, detail records, slices |
| `ResultBadge` | single-match state chip | match form trails |
| `CompetitionChip` / `CompetitionDot` | league/cup/Europe identity cue | match rows, headers, season chips |
| `CoverageNote` / `ChartPanel` | slice/coverage footer + framed chart; coverage is **graded** — pass `count` and the note renders only when the facet is incomplete, silent when whole | analytics, charts, trust points |
| `DataTable` | sortable dense table | analytics, calibration, indexes |
| `Pager` | Newer / page / Older pagination | `/matches`, `/manager/[id]` |
| `HeaderSearch` / `SearchCommand` / `MainNav` | global header search + nav | layout |
| charts: `InspectableTimeSeriesChart`, `InspectableBarChart`, `EloRatingChart` | Recharts-backed inspection layer | analytics, home, player, odds |
| `components/charts.tsx` | shared chart data contracts (`ChartDatum`, `ChartBarDatum`) | the inspectable chart components |

The static SVG primitives are all gone: `Bars` and `Sparkline` were deleted in
the Bold Simplification pass, and the local `AreaChart` followed once `knip`
showed `InspectableTimeSeriesChart` imports Recharts' `AreaChart`, not the local
one — i.e. the "live no-JS fallback" claim was itself drift. `components/charts.tsx`
now only holds the shared `ChartDatum` / `ChartBarDatum` type contracts.

## Data lanes

- **Match-attributed record** — `match_events` (United scorers, opposition
  goals, assists, cards) + `lineups`. The spine; everything links back to it.
- **Curated Tableau lane** — season-level goals/assists/goal-types 1987-88–
  2014-15. Aggregate, never enters `match_events`; surfaced as its own labelled
  lane on player pages and the season table.
- **Player identity** — `player_records` (official club appearance/goal record),
  Wikidata photos, MUFCInfo shirt numbers.
- **Reference** — competitions, managers, stadiums, opponents, Elo history,
  league positions, source catalog.

The combined assist definition (curated through 2014-15, match events after) is
centralized in `lib/queries.ts` so every surface agrees — the one place this
lane overlap is reconciled.

## Overlaps and consolidations

Resolved in the Bold Simplification pass (ADR 0002):
- **Records as Second Renderings.** Biggest wins / heaviest defeats / biggest
  crowds were `MatchList`s on `/analytics` *and* sorts on `/matches`. Records now
  link into `/matches` sorts (the "heaviest defeat" sort was added so they have a
  canonical home); the analytics renderings are gone.
- **Coverage ledger duplication.** The data-depth and lineup-coverage charts
  rendered on `/analytics` *and* `/data`. `/data` is the canonical home;
  `/analytics` now links to it.
- **Win-rate-by-decade.** Cut from `/analytics` — already a View via the decade
  rail / `/matches` year filters.
- **Goal-minute distribution.** Migrated from `/analytics` into
  `/questions#late-goals`, where the late-goals argument owns it.
- **Home/away/neutral split.** Folded into `/matches` as the venue filter / quick
  views rather than a standalone analytics module.
- **Odds + travel surfaces.** `/analytics/odds` folded into `/analytics`
  (prospective half of the strength layer); `/analytics/travel` folded into
  `/questions#away-days`. Both routes deleted with 308 redirects.
- **Match page hierarchy.** `/match/[id]` now leads with scoreline + scorers and
  collapses Teamsheet / Context / Provenance into labelled disclosures.
- **Graded coverage notes.** `CoverageNote` computes its coverage line from real
  counts and self-suppresses when complete; the four complete-data "no caveat"
  notes on `/questions` were stripped.

Resolved earlier (Phase 8 consolidation pass):
- **Stat-tile duplication.** `/manager/[id]` and the `/matches` slice summary
  hand-rolled the `StatTile` pattern; both now use the shared component.
- **Header duplication.** `/managers` hand-rolled a `PageHeader`; now shared.
- **Pagination duplication.** `/manager/[id]` hand-rolled Newer/Older paging;
  now uses `Pager` (matching `/matches`).
- **Coverage-note contrast.** `CoverageNote` body was `text-ink-faint` (below
  comfortable contrast at the trust point); raised to `text-ink-dim` with
  brighter labels.
- **Form-control drift.** The odds form used ad-hoc select/button styling; now
  uses the shared `.control` + `focus-ring` vocabulary (carried into `/analytics`).

Intentionally left bespoke:
- **`/match/[id]` facts grid.** Holds textual facts (venue name, manager,
  competition), not numerics, so the mono/numeric `StatTile` would degrade it.
- **`/` and `/match/[id]` heroes.** Scoreline/launchpad heroes are deliberately
  not `PageHeader`.

Done since the simplification pass:
- **Unused-export guard.** `knip` (`npm run knip`, wired into CI ahead of
  `validate`) is the guard ADR 0002 called for. `import/no-unused-modules` was
  unusable under this flat-config + TypeScript setup (its enumerator scans only
  `.js`); `knip` understands `.tsx` and reports unused files, exports, types, and
  dependencies. Baseline taken to zero: deleted the dead local `AreaChart` and
  `seasonStartYear` + the `tmp-check.ts` scratch file; un-exported ~13 symbols
  that were only used inside their own module; registered the standalone manual
  scripts (`fix-*`, `stats-check`) as knip entries. `knip.json` holds the config.

Flagged, not yet done (carry into Phase 9 / parked):
- The odds opponent picker is a long native `<select>`; a searchable combobox
  (reuse the `SearchCommand` pattern) is a feature, not a consolidation.
- Segmented grouping on `/managers` and `/opponents` (by era / alphabet) is
  Phase 9 discovery work, not consolidation.
- See `docs/VISUAL-AUDIT.md` for the remaining visual-hierarchy items.
