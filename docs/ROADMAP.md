# Roadmap

## Phase 1 — Foundation ✅ (complete)

- [x] Repo, docs, architecture
- [x] Schema + ETL: every league match 1892–present (engsoccerdata), FA Cup
      1886–present, reference data (managers, stadiums, competitions, opponents)
- [x] Gap fill via the Wikipedia wikitext ingester: all European matches
      (1956–), all League Cup (1960–), Shields/Super Cups (1908–),
      Intercontinental/Club World Cup, 1890s Test Matches; 2022-23 and
      2025-26 from openfootball
- [x] Auto-update pipeline (GitHub Actions + openfootball parser +
      Wikipedia enrichment + league-position recompute)
- [x] Core UI: home, seasons, season detail, match browser, match deep-dive,
      players, managers, opponents/head-to-head
- [x] Analytics v1: all-time records, Elo timeline 1886–present with
      win-expectancy on every match page, season trends, attendance history,
      goal-minute patterns, grounds, data-depth ledger

## Phase 2 — Player-level depth ✅ (complete)

- [x] Goal events (scorer, minute) — 10,000+ events; the all-time scorer
      table reproduces the official club record (Rooney 254, Charlton 249,
      Law 236...). Assists where sources record them.
- [x] Full lineups — canonical schema, DB tables, validation, match-page UI,
      and a Wikipedia final/late-round article ingester are live. Current
      coverage: 192 matches, 2,519 player appearances, 1,027 player identities.
      Next enrichment source for breadth: football-data.org (free key) for
      2020s league lineups.
- [x] Partnership networks — canonical assist fields, aggregate queries,
      analytics UI, and player-page UI are wired. The checked-in dataset has
      no assist-bearing source rows yet, so the network panel stays honest
      until those events are added.
- [x] Player pages with per-season goal/app splits, lineup appearances, and
      goal-minute histograms.

## Phase 3 — Exhaustive history

- [ ] Backfill scorers for all post-war matches (RSSSF, books, curated PRs)
- [ ] Expand lineups beyond the 192 structured Wikipedia matches: modern
      league coverage via football-data.org, then pre-war lineups and scorers
      where records exist
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
