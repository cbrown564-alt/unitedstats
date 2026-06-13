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

## What it is not

- **Not match-attributed.** The export carries no dates or minutes, so it can
  never be written to `match_events` / a specific match. It is a season-level
  aggregate lane, mirroring the way `player_records` coexists with the
  match-derived `player_totals`.
- **No goal-type detail.** `kind=goal` counts include penalties; this particular
  export does not break goals down by type (header, penalty, etc.).

## Files

| File | Role |
|---|---|
| `data/sources/tableau/goals-assists-summary.csv` | Raw export, committed for provenance (the host is not refetchable from CI). |
| `scripts/ingest/tableau-goals-assists.ts` | Deterministic normalizer (`npm run ingest:tableau-goals-assists [-- --write]`). |
| `data/canonical/tableau-goals-assists.json` | Normalized output. |
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
