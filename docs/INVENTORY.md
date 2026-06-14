# Surface Inventory

Last refreshed: 2026-06-14 (Phase 8 consolidation pass)

A map of every surface the app exposes — routes, shared components, analytics
and question modules, and data lanes — with each one's purpose and where it
overlaps another surface. This is the reference the Phase 8 "inventory every
surface" item calls for; it is meant to stay an honest map, so consolidations
already applied are recorded as resolved and the remaining overlaps are flagged.

## Routes

### Index / browse
- `/` — curiosity launchpad: hybrid search, myth prompts, recent evidence,
  routes into the record. Bespoke hero (intentionally not `PageHeader`).
- `/matches` — the archive spine. Filters, quick views, decade rail, sort,
  season-grouped rows, slice summary. Uses `PageHeader` + `StatTile` + `Pager`.
- `/seasons`, `/seasons/[season]` — decade-grouped index; per-season record,
  brief, table.
- `/players`, `/player/[id]` — searchable index; profile with progressive
  disclosure and per-season splits.
- `/managers`, `/manager/[id]` — index with WdlBar rows; tenure record, splits,
  first-ten, by-competition, paged matches.
- `/opponents`, `/opponent/[id]` — searchable index; head-to-head detail.

### Interpretation
- `/questions` — six myth-testing modules with a sticky in-page rail.
- `/analytics` — tiered chapters (Trends, Goals/grounds, Records, Coverage).
- `/analytics/odds` — Elo-derived W/D/L widget + season replay + calibration.
- `/analytics/travel` — away footprint map + era travel load.
- `/data` — coverage ledger, source catalog, correction guidance, API/downloads.

### Machine-readable
- `/api/search` — hybrid entity + shaped-answer search (powers header search).
- `/api/v1/*` — read-only JSON: meta, competitions, managers, matches[/id],
  opponents, players[/id], seasons[/season].

## Shared components

| Component | Role | Used by |
| --- | --- | --- |
| `PageHeader` / `StatTile` / `TrailLink` | page identity + numeric tiles + trail cards | index pages, analytics, player/opponent/manager detail |
| `MatchList` / `MatchGroups` | canonical compact match row / season-grouped rows | every match-bearing surface |
| `WdlBar` / `WdlRecord` | diverging W/D/L record glyph | indexes, detail records, slices |
| `ResultBadge` | single-match state chip | match form trails |
| `CompetitionChip` / `CompetitionDot` | league/cup/Europe identity cue | match rows, headers, season chips |
| `CoverageNote` / `ChartPanel` | slice/coverage footer + framed chart | analytics, charts, trust points |
| `DataTable` | sortable dense table | analytics, calibration, indexes |
| `Pager` | Newer / page / Older pagination | `/matches`, `/manager/[id]` |
| `HeaderSearch` / `SearchCommand` / `MainNav` | global header search + nav | layout |
| charts: `InspectableTimeSeriesChart`, `InspectableBarChart`, `EloRatingChart` | Recharts-backed inspection layer | analytics, home, player, odds |
| charts (static): `AreaChart`, `Bars`, `Sparkline` | no-JS SVG fallbacks / migration scaffolding | `AreaChart` is the fallback inside `InspectableTimeSeriesChart`; `Bars` on player page; **`Sparkline` currently unused** (kept by design as a no-JS dense-table primitive) |

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

Resolved in this pass:
- **Stat-tile duplication.** `/manager/[id]` and the `/matches` slice summary
  hand-rolled the `StatTile` pattern; both now use the shared component.
- **Header duplication.** `/managers` hand-rolled a `PageHeader`; now shared.
- **Pagination duplication.** `/manager/[id]` hand-rolled Newer/Older paging;
  now uses `Pager` (matching `/matches`).
- **Coverage-note contrast.** `CoverageNote` body was `text-ink-faint` (below
  comfortable contrast at the trust point); raised to `text-ink-dim` with
  brighter labels.
- **Form-control drift.** `/analytics/odds` used ad-hoc select/button styling;
  now uses the shared `.control` + `focus-ring` vocabulary.

Intentionally left bespoke:
- **`/match/[id]` facts grid.** Holds textual facts (venue name, manager,
  competition), not numerics, so the mono/numeric `StatTile` would degrade it.
- **`/` and `/match/[id]` heroes.** Scoreline/launchpad heroes are deliberately
  not `PageHeader`.

Flagged, not yet done (carry into Phase 9 / parked):
- `Sparkline` is unused; keep or prune deliberately, don't let it rot.
- `/analytics/odds` opponent picker is a long native `<select>`; a searchable
  combobox (reuse the `SearchCommand` pattern) is a feature, not a consolidation.
- Segmented grouping on `/managers` and `/opponents` (by era / alphabet) is
  Phase 9 discovery work, not consolidation.
- See `docs/VISUAL-AUDIT.md` for the remaining visual-hierarchy items.
