# Roadmap

## Phase 1 — Foundation (this build)

- [x] Repo, docs, architecture
- [ ] Schema + ETL: every league match 1892–present (engsoccerdata), FA Cup
      1886–2019, reference data (managers, stadiums, competitions, opponents)
- [ ] Gap fill: 2025-26 season (openfootball), FA Cup 2019–25, League Cup
      finals/history, European campaign matches (curated)
- [ ] Auto-update pipeline (GitHub Actions + openfootball parser)
- [ ] Core UI: home, seasons, season detail, match list, match deep-dive,
      players, managers, opponents/head-to-head
- [ ] Analytics v1: all-time records, Elo timeline 1892–present with
      win-probability model, season trends, attendance history, manager
      comparison, spatial map of opponents/venues

## Phase 2 — Player-level depth

- [ ] Goal events (scorer, minute, assist) — start with curated landmark
      matches + modern seasons via football-data.org enrichment
- [ ] Full lineups for the modern era (1992–) and progressively backward
- [ ] Player pages with per-season splits, goal timelines, partnership
      networks (who assists whom)
- [ ] Appearance/goal record tables that update live as data deepens
      (the UI already renders whatever depth exists per match)

## Phase 3 — Exhaustive history

- [ ] Backfill scorers for all post-war matches (RSSSF, books, curated PRs)
- [ ] Pre-war lineups and scorers where records exist
- [ ] Wartime and abandoned matches as annotated non-official records
- [ ] Friendlies and tours (separate competition type, off by default)

## Phase 4 — Advanced analytics

- [ ] Predictive: Elo-driven season simulation, "what are the odds" widget
- [ ] Spatial: shot maps where event data exists; travel-distance era maps
- [ ] Narrative auto-summaries of seasons/eras from the data
- [ ] Public read-only API + downloadable dataset releases

## Data depth ledger

The UI is honest about coverage: every aggregate that depends on events or
lineups displays the coverage window it's computed from (e.g. "goal data:
1,234 of 6,000 matches"). This is a feature, not a caveat — stretfordend
itself grew the same way, season by season.
