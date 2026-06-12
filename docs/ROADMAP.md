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
      table reproduces the official club record (Rooney 253, Charlton 249,
      Law 237...). Assists where sources record them.
- [x] Full lineups — canonical schema, DB tables, validation, match-page UI,
      and a Wikipedia final/late-round article ingester are live. Current
      coverage: 868 matches and 12,147 United player appearances, from
      Wikipedia final/Shield/Super Cup articles plus transfermarkt-datasets
      (2013–present). football-data.org's free tier turned out not to expose
      match detail (lineups/goals), so it remains a token-gated option only.
- [x] Partnership networks — canonical assist fields, aggregate queries,
      analytics UI, and player-page UI are wired. The checked-in dataset now
      carries 975 recorded assists (2012–present, transfermarkt-datasets);
      earlier eras stay pending until a source records them.
- [x] Player pages with per-season goal/app splits, lineup appearances, and
      goal-minute histograms.

## Phase 3 — Exhaustive history ✅ (complete)

- [x] Backfill scorers for all post-war matches (RSSSF, books, curated PRs)
- [x] Expand lineups beyond the 192 structured Wikipedia matches: modern
      league coverage via football-data.org, then pre-war lineups and scorers
      where records exist
- [x] Wartime and abandoned matches as annotated non-official records
- [x] Friendlies and tours (separate competition type, off by default)
- [x] Add richer source/provenance records so partial scorer, assist, lineup,
      and attendance coverage can be explained at the exact point of use
- [x] Build correction-friendly data pages that explain canonical JSON,
      source lineage, coverage gaps, and how to contribute fixes

Phase 3 is complete as a product and data-model capability: the app now has
source facets, validated source catalog entries, non-official competition
types for wartime/friendly records, match-level source trails, and a
correction-friendly `/data` surface. Historical scorer and lineup enrichment
continues as normal dataset work through curated PRs and future ingesters.

## Phase 4 — Event and lineup breadth ✅ (complete)

Phase 4 widens the match record before the product becomes more guided. The
goal is to move from a mostly United-scorer dataset toward fuller match sheets:
assists where sources record them, opposition goal scorers and minutes, more
lineups, and clearer event/source coverage.

- [x] Audit enrichment sources and coverage contracts:
      football-data.org, official competition sites, FBref/Stathead-style
      sources where licensing permits, Wikipedia dedicated match articles,
      RSSSF, club yearbooks, programmes, newspaper archives, and curated PRs
- [x] Build a football-data.org ingester behind `FOOTBALL_DATA_TOKEN`:
      match lookup by date/opponent, import goal events for both teams,
      assists, lineups, substitutes, bookings where available, and source
      facets; keep it idempotent and dry-run friendly
- [x] Extend canonical event modeling for non-United players:
      opposition goal scorer display names, team side, own goals against,
      assist display names, provider ids, and source confidence without
      polluting the United player identity table
- [x] Backfill modern opposition goals and assists from football-data.org
      where the API exposes historical match detail
- [x] Expand modern lineups from football-data.org, including substitutions
      and bench data where present; keep appearance totals limited to players
      who entered the match
- [x] Investigate and prototype additional source-specific importers for
      older opposition scorers, assists, and lineups; prefer sources with
      stable URLs, citation detail, and reusable parsing paths
- [x] Upgrade match pages and the data ledger to distinguish United scorers,
      opposition goals, assists, starting lineups, used substitutes, benches,
      cards, and attendance as separate coverage facets
- [x] Add source-audit docs that record what each candidate source can provide,
      licensing/access caveats, historical range, failure modes, and import
      priority

Phase 4 is complete as a data-model and product capability: the canonical
event model now supports opposition/source-only participants, provider ids,
assist display names, team side, and source confidence; the database derives
separate facets for United scorers, opposition goals, assists, starting lineups,
used substitutes, benches, cards, attendance, and notes; match pages and `/data`
surface those distinctions; and `npm run ingest:football-data` provides a
token-gated, cached, dry-run-first path for modern match-sheet enrichment.
Historical backfill continues as normal dataset work through football-data.org
runs, source-specific prototypes, and curated PRs.

## Phase 5 — Guided exploration ✅ (complete)

- [x] Rework the homepage from status dashboard to curiosity launchpad:
      hybrid search, myth-testing prompts, latest/recently enriched evidence,
      and routes into the canonical record
- [x] Build a guided "Questions" or "Trails" surface for myth-testing modules:
      late goals by era, bogey sides, European-week effects, manager bounce,
      fortress Old Trafford, cup specialists
- [x] Add pattern-trail modules to detail pages:
      match → Elo movement / similar matches / late goals that season;
      player → scoring runs / goal timing / competition splits;
      manager → first 10 matches / home-away-cup bends;
      opponent → away record / cup meetings / longest runs
- [x] Add "show the matches behind this" evidence links to major analytics,
      records, rankings, and chart modules
- [x] Upgrade analytics copy from chart labels to exploratory framing:
      concise interpretation, slice definition, coverage note, and evidence
      trail
- [x] Develop hybrid command search: normal lookup for players/opponents/
      seasons/managers/matches plus shaped templates such as "record away at
      Arsenal" and "late goals under Ferguson"

Phase 5 is complete as a product capability: `/questions` hosts six
myth-testing modules, each with a stated finding, slice definition, coverage
note, and evidence route; the homepage opens with hybrid command search
(entity lookup plus shaped answers such as "record away at Arsenal", served
by `/api/search`), myth prompts, and routes into the record; match, player,
manager, and opponent pages carry pattern-trail modules; the match browser
gained competition-type and year-range filters so era and decade aggregates
can link to their matches; and analytics modules carry exploratory copy with
slice/coverage notes and evidence links. New question modules and shaped
search templates continue as normal product work on `lib/trails.ts` and
`lib/search.ts`.

## Phase 6 — Advanced analytics and distribution ✅ (complete)

- [x] Predictive: Elo-driven season simulation, "what are the odds" widget,
      with careful scope language and evidence links
- [x] Spatial: shot maps where event data exists; travel-distance era maps
- [x] Narrative auto-summaries of seasons/eras from the data, written as
      exploratory signals rather than verdict-heavy punditry
- [x] Public read-only API + downloadable dataset releases
- [x] Reusable chart/table components with consistent coverage notes, focus
      states, numeric alignment, and color-safe win/draw/loss encoding

Phase 6 is complete as a product and distribution capability: `/analytics/odds`
turns the closed-universe Elo model into scoped W/D/L probabilities and a
deterministic 10,000-run league-season replay; `/analytics/travel` maps the
away footprint and era travel load while explicitly explaining that no current
source records shot coordinates; seasons now carry deterministic
data-derived briefs; `/api/v1` exposes read-only JSON endpoints with CORS and
coverage attribution; `npm run export:dataset` writes downloadable CSV/JSON
releases into `public/dataset`; and shared chart/table/coverage components
standardize focus states, numeric alignment, and win/draw/loss colors.

## Data depth ledger

The UI is honest about coverage: every aggregate that depends on events or
lineups displays the coverage window it's computed from (e.g. "goal data:
1,234 of 6,000 matches"). This is a feature, not a caveat — stretfordend
itself grew the same way, season by season.

Coverage should stay visible at interpretation points rather than becoming
constant noise. A user reading a player total, assist partnership, lineup
aggregate, goal-minute chart, or myth-testing prompt should understand the
coverage behind it before trusting the conclusion.
