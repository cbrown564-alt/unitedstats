# Data Model

Canonical data is JSON in `data/canonical/`; the SQLite database is compiled
from it. The model is designed so that *every* level of detail the project will
ever hold — down to per-minute goal events and full lineups — fits without
schema migrations, while still accepting matches known only at the
result level (most of 1892–1945 today).

## Canonical JSON

### `matches/<season>.json` — e.g. `matches/1998-99.json`

```jsonc
{
  "season": "1998-99",
  "matches": [
    {
      "id": "1999-05-26-bayern-munich-a",   // stable slug: date-opponent-venue
      "date": "1999-05-26",
      "competition": "champions-league",     // FK -> competitions.json
      "round": "Final",
      "opponent": "Bayern Munich",           // display name, normalized
      "venue": "N",                          // H | A | N
      "stadium": "Camp Nou",                 // optional; resolved vs stadiums.json
      "attendance": 90245,                   // optional
      "score": { "ft": [2, 1], "ht": [0, 1], "aet": false, "pens": null },
      "manager": "alex-ferguson",            // FK -> managers.json (usually derived from tenure dates)
      "events": [                            // optional, grows over time
        { "type": "goal", "player": "teddy-sheringham", "minute": 90,
          "assist": "ryan-giggs", "detail": null },
        { "type": "goal", "player": "ole-gunnar-solskjaer", "minute": 92,
          "assist": "teddy-sheringham", "detail": null }
        // types: goal | own-goal-for | own-goal-against | pen-goal |
        //        opp-goal | card-yellow | card-red | sub-on/off
      ],
      "lineup": [                            // optional, grows over time
        { "player": "peter-schmeichel", "shirt": 1, "role": "GK", "start": true },
        { "player": "teddy-sheringham", "start": false, "on": 67, "off": null }
      ],
      "sources": ["engsoccerdata", "curated"],
      "notes": null
    }
  ]
}
```

Season key convention: `"1892-93"` … `"2025-26"`. A match belongs to the season
of the campaign it was part of (a June 1999 Charity Shield style edge case goes
by competition rules, not calendar).

### Reference files

- **`competitions.json`** — id, name, type (`league|domestic-cup|league-cup|european|super-cup|other`), tier, era notes. E.g. `first-division`, `premier-league`, `fa-cup`, `league-cup`, `european-cup`, `champions-league`, `europa-league`, `cup-winners-cup`, `fifa-club-world-cup`, `charity-shield`.
- **`managers.json`** — id, name, nationality, tenures `[{from, to, note}]` (handles caretakers and second spells). Match → manager is resolved by date during DB build; explicit `manager` on a match overrides.
- **`stadiums.json`** — id, name, city, lat/lng (spatial analytics), home `[{from,to}]` ranges: North Road (1878–1893), Bank Street (1893–1910), Old Trafford (1910–), Maine Road (1941–49, wartime borrow), plus major neutral venues.
- **`players.json`** — id (kebab slug), full name, positions, nationality, birth date when known. Players referenced by events/lineups must exist here (validated).
- **`opponents.json`** — id, canonical display name, aliases (e.g. "Small Heath" → Birmingham City lineage kept distinct), country, lat/lng of home city (spatial layer).

## SQLite schema (built artifact)

```sql
competitions(id PK, name, type, tier)
stadiums(id PK, name, city, country, lat, lng)
managers(id PK, name, nationality)
manager_tenures(manager_id FK, date_from, date_to, note)
players(id PK, name, positions, nationality, born)
opponents(id PK, name, country, lat, lng)

matches(
  id PK, season, date, competition_id FK, round,
  opponent_id FK, venue,            -- 'H'|'A'|'N'
  stadium_id FK, attendance,
  gf, ga, ht_gf, ht_ga, aet, pen_gf, pen_ga,
  result,                           -- 'W'|'D'|'L' (after pens treated as D in 90/120 terms; outcome column carries tie result)
  outcome,                          -- 'W'|'D'|'L' of the contest incl. pens
  manager_id FK, notes, sources
)

match_events(match_id FK, seq, type, player_id FK, minute, assist_player_id FK, detail)
match_lineups(match_id FK, player_id FK, shirt, role, started, sub_on, sub_off)

-- precomputed analytics (rebuilt every build)
elo_history(match_id FK, date, elo_pre, elo_post, opp_elo_pre, win_prob)
player_totals(player_id FK, competition_type, apps, starts, goals, assists, first, last)
season_summaries(season, competition_id, p, w, d, l, gf, ga, position, note)
streaks(...), records(...)
```

Indexes on `matches(date)`, `matches(season)`, `matches(opponent_id)`,
`match_events(player_id)`, `match_lineups(player_id)`.

## Identity & normalization rules

- **Match id**: `YYYY-MM-DD-<opponent-slug>-<h|a|n>` — stable across sources;
  two fixtures vs the same side on one day never happened, replays are
  different dates.
- **Newton Heath era**: the club is one continuous entity; `club_name` is
  derivable from date (Newton Heath LYR 1878–1892, Newton Heath 1892–1902,
  Manchester United 1902–). Stored as a fact in `docs`, not duplicated per row.
- **Opponent lineage**: opponents are normalized to one id per club lineage
  with aliases (Woolwich Arsenal → Arsenal), preserving the historical display
  name per match via the alias table when it differs.
- **Wartime**: official competitions only by default (the two World War
  breaks); wartime regional matches can be added later under
  `competition: wartime` and are excluded from official records by query.

## Validation (runs on every build, CI-enforced)

- Every match has id/date/competition/opponent/venue/score; ids unique.
- Event minutes sane (0–125); event players exist in players.json; goals in
  events, when present and flagged complete, sum to the match score.
- Season files internally date-ordered; no duplicate ids across seasons.
- Reference integrity: competition/stadium/manager/opponent ids resolve.
