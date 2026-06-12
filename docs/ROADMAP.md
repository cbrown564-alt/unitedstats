# Roadmap

## Product north star

UnitedStats is a pattern-discovery product for stats-heavy Manchester United
fans with researcher-grade trust expectations. The fixture record is the spine;
question-led analysis is the discovery layer; people are the emotional entry
points.

The design target is a floodlit match-night ledger: dark, precise,
atmospheric, and built for exploration. The UI should be United-coded, not
United-branded. It should avoid becoming a dry database table site, while
keeping data readability and source confidence ahead of decoration.

Product principles:

- **Start exploration immediately.** The homepage should become a curiosity
      launchpad with myth-testing prompts, hybrid search, recently changed
      evidence, and clear routes into matches, seasons, players, managers,
      opponents, and analytics.
- **Guide, don't pundit.** The app should suggest interesting cuts
      ("late goals by era", "bogey sides away", "European weeks") and expose
      the match trail rather than making unsupported editorial claims.
- **Trust at decision points.** Coverage, source, and scope notes appear where
      they change interpretation: rankings, charts, player totals, lineup
      analysis, assist networks, and myth-testing modules.
- **Every aggregate needs an evidence path.** Major stats should let users
      reach the underlying matches, seasons, people, or opponents that produced
      them.
- **Adaptive medium density.** Keep records, filters, and tables compact;
      give myth-testing modules, charts, and coverage notes enough room to be
      understood.

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
- [ ] Add richer source/provenance records so partial scorer, assist, lineup,
      and attendance coverage can be explained at the exact point of use
- [ ] Build correction-friendly data pages that explain canonical JSON,
      source lineage, coverage gaps, and how to contribute fixes

## Phase 4 — Guided exploration

- [ ] Rework the homepage from status dashboard to curiosity launchpad:
      hybrid search, myth-testing prompts, latest/recently enriched evidence,
      and routes into the canonical record
- [ ] Build a guided "Questions" or "Trails" surface for myth-testing modules:
      late goals by era, bogey sides, European-week effects, manager bounce,
      fortress Old Trafford, cup specialists
- [ ] Add pattern-trail modules to detail pages:
      match → Elo movement / similar matches / late goals that season;
      player → scoring runs / goal timing / competition splits;
      manager → first 10 matches / home-away-cup bends;
      opponent → away record / cup meetings / longest runs
- [ ] Add "show the matches behind this" evidence links to major analytics,
      records, rankings, and chart modules
- [ ] Upgrade analytics copy from chart labels to exploratory framing:
      concise interpretation, slice definition, coverage note, and evidence
      trail
- [ ] Develop hybrid command search: normal lookup for players/opponents/
      seasons/managers/matches plus shaped templates such as "record away at
      Arsenal" and "late goals under Ferguson"

## Phase 5 — Advanced analytics and distribution

- [ ] Predictive: Elo-driven season simulation, "what are the odds" widget,
      with careful scope language and evidence links
- [ ] Spatial: shot maps where event data exists; travel-distance era maps
- [ ] Narrative auto-summaries of seasons/eras from the data, written as
      exploratory signals rather than verdict-heavy punditry
- [ ] Public read-only API + downloadable dataset releases
- [ ] Reusable chart/table components with consistent coverage notes, focus
      states, numeric alignment, and color-safe win/draw/loss encoding

## Data depth ledger

The UI is honest about coverage: every aggregate that depends on events or
lineups displays the coverage window it's computed from (e.g. "goal data:
1,234 of 6,000 matches"). This is a feature, not a caveat — stretfordend
itself grew the same way, season by season.

Coverage should stay visible at interpretation points rather than becoming
constant noise. A user reading a player total, assist partnership, lineup
aggregate, goal-minute chart, or myth-testing prompt should understand the
coverage behind it before trusting the conclusion.
