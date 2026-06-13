# Tableau Goals & Assists (curated Ferguson-era source)

A hand-curated scorer/assist dataset extracted from the public Tableau workbook
[**Manchester United Games**](https://public.tableau.com/app/profile/conor.brown/viz/ManchesterUnitedGames/SeasonSummary)
(profile: conor.brown). It is the only structured **assist** data this project
holds for the Sir Alex Ferguson era — the modern `transfermarkt-datasets` lane
only reaches back to 2012-13 (see `ASSISTS-PLAN.md`).

## What it is

- **Range:** 1987-88 → 2014-15 (28 seasons).
- **Grain:** one row per goal and per assist, attributed to a player against an
  opponent in a season and competition. Aggregated on import to one row per
  `(player, attribution, kind, season, competition, opponent)` with a `count`.
- **Totals:** 2,887 goals and 2,469 assists across the covered seasons.
- **Hand-curated and not exhaustive.** Some European campaigns and individual
  matches are absent. Totals reconcile well against known career figures
  (e.g. Giggs 168 goals — matching `player-records` — and a tour-leading 310
  assists; Van Nistelrooy 150 goals; Solskjær 126), but it is not a complete
  record and is not treated as one.

## Goal types (body part)

A second export breaks goals down by the **body part / technique** used to score:
**Right Foot** (1,613), **Left Foot** (701), **Head** (518), **Knee** (16),
**Backheel** (16), **Torso** (11), **Shoulder** (2) — 2,877 goals (a subset of
the summary goal total; own goals are excluded). It normalizes to
`data/canonical/tableau-goal-types.json` at grain
`(player, goalType, season, competition, opponent)` with a count. Body-part
profiles read true to life (e.g. Giggs 126 left-foot vs 22 right-foot;
Van Persie left-dominant), a good independent quality signal.

This is body-part detail, **not** penalty/free-kick/open-play classification —
that distinction is not in the export.

## What it is not

- **Not match-attributed.** The exports carry no dates or minutes, so they can
  never be written to `match_events` / a specific match. They are season-level
  aggregate lanes, mirroring the way `player_records` coexists with the
  match-derived `player_totals`.
- **`kind=goal` counts include penalties** in the summary; the goal-type export
  classifies by body part only.

## Files

| File | Role |
|---|---|
| `data/sources/tableau/goals-assists-summary.csv` | Raw goals+assists export, committed for provenance (the host is not refetchable from CI). |
| `data/sources/tableau/goal-breakdown.csv` | Raw goal-type export. |
| `scripts/ingest/tableau-goals-assists.ts` | Deterministic normalizer for both exports (`npm run ingest:tableau-goals-assists [-- --write]`). |
| `data/canonical/tableau-goals-assists.json` | Normalized goals + assists. |
| `data/canonical/tableau-goal-types.json` | Normalized goals by body part. |
| `data/canonical/sources.json` → `tableau-goals-assists` | Source registration. |

## Normalization decisions

- **Players** resolve to canonical `players.json` ids. The export uses surnames;
  unique surnames resolve directly, and the curator pre-disambiguated most
  same-surname pairs with full names (e.g. *Gary Neville* vs *Phil Neville*,
  *Colin Gibson* vs bare *Gibson*). Remaining surname collisions were resolved by
  comparing the seasons a label appears in against career spans in
  `player-records.json`, and baked into an explicit map in the ingester. Special
  cases: *Park* (surname-first), *R. Jones* → Ritchie Jones, both *Djemba-Djemba*
  spellings → one id, the da Silva twins (*Rafael* has no "silva" token), and
  *Martin* — which merges **both** Lee Martins and so splits by season
  (1988–91 → `lee-martin`, 2005–09 → `lee-martin-2005`).
- **Attribution:** `(own goal)` → `attribution: "own-goal"`; `(someone)` / `?`
  → `attribution: "unknown"`. These keep `playerId: null` so goal counts are not
  silently dropped.
- **Opponents** resolve against `opponents.json` (+ `opponent-aliases.json`)
  where present. ~40 foreign clubs not yet in that table keep `opponentId: null`
  with the display name preserved verbatim, rather than risk-editing the
  validated opponents table.
- **Competitions** map to canonical ids (e.g. *Community Shield* and *Charity
  Shield* → `charity-shield`; *Club World Championship/Cup* → `fifa-club-world-cup`).
- **Seasons** convert `1992/93` → canonical `1992-93`.

## Wiring status

The normalized JSON is **not yet loaded by `build:db`** and is not surfaced in
the UI — `build-db.ts` and `validate.ts` read explicit filenames, so the file is
inert until deliberately wired in. Surfacing it (a `player_season_goal_assist`
table feeding player pages, clearly labelled "curated, season-level, not
match-attributed") is the natural next step.
