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

- [x] Goal events (scorer, minute) — 13,992 events; the all-time scorer
      table reproduces the official club record (Rooney 253, Charlton 249,
      Law 237...). Assists where sources record them.
- [x] Full lineups — canonical schema, DB tables, validation, match-page UI,
      and deterministic source ingesters are live. Current coverage: 6,022
      matches and 72,095 United player appearances, primarily from MUFCInfo
      match pages plus Wikipedia final/Shield/Super Cup articles and
      transfermarkt-datasets. football-data.org's free tier turned out not to
      expose match detail (lineups/goals), so it remains a token-gated option
      only.
- [x] Partnership networks — canonical assist fields, aggregate queries,
      analytics UI, and player-page UI are wired. The checked-in dataset
      carries 975 match-attributed assists (2012-13–present,
      transfermarkt-datasets) that drive scorer↔assister partnerships. No open
      source records *match-level* United assists before 2012-13 (investigated
      and documented in docs/ASSISTS-PLAN.md); the Ferguson-era gap is now
      filled at season level by the curated Tableau lane (see Phase 7), so the
      combined headline assist figure spans 1987-88–present rather than being
      blank before 2012-13.
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

## Phase 7 — Ferguson-era depth and product polish ✅ (complete)

Phase 7 deepens the player record back through the Ferguson era and lifts the
interface from a competent ledger toward the floodlit match-night feel the
north star calls for, without loosening the trust contract.

- [x] Curated Tableau goals/assists lane — a hand-curated public Tableau
      workbook now supplies season-level goals, assists, and goal-type (body
      part) breakdowns for 1987-88–2014-15: 2,887 goals, 2,469 assists, and
      2,536 goal-type rows across 28 seasons. It is aggregate, not
      match-attributed, so it is surfaced as its own clearly labelled lane on
      player pages and the season table and never enters `match_events`. The
      combined assist definition (curated through 2014-15, match events after)
      is centralized in `lib/queries.ts` so every surface agrees. Documented in
      docs/TABLEAU-GOALS-ASSISTS.md and docs/ASSISTS-PLAN.md.
- [x] Player identity depth — the official club appearance/goal record
      (Wikipedia "List of Manchester United F.C. players") is reproduced in
      `player_records` and pinned by golden tests; player photos arrive via
      Wikidata (128 images with license/provenance); primary shirt numbers by
      decade come from MUFCInfo match pages (1,788 rows).
- [x] Record and competition cues — a diverging win/draw/loss bar (losses left,
      wins right of a centre fulcrum) is the default record glyph, with a
      stacked variant for labelled rows; a competition-identity colour system
      (league / cup / Europe chips and dots) makes fixture type scannable
      without leaning on colour alone.
- [x] Exploration surfaces — a persistent global header search keeps hybrid
      command search reachable on every route; the match browser was rebuilt
      with sort controls, a decade jump rail, season-grouped rows, and a
      summary band; the player profile was redesigned around progressive
      disclosure with a sortable season-by-season table; analytics is tiered
      into chapters behind a sticky question rail; and the Elo timeline is
      shaded by managerial era.
- [x] Engineering consolidation — shared formatting/query/url helpers, a single
      MUFCInfo + Tableau player-name resolver, and consolidated coverage/gaps
      SQL remove cross-surface drift; a golden-test + lint + typecheck gate
      guards the query layer that every page depends on.

Phase 7 is complete as a data and product capability: the dataset now carries a
labelled Ferguson-era goals/assists/goal-type lane alongside the
match-attributed modern record, player identity is richer (records, photos,
shirt numbers), and the interface is more atmospheric and more scannable while
keeping coverage and source notes at every interpretation point. Curated-lane
extension (more seasons, more goal-type detail) and historical match-level
enrichment continue as normal dataset work.

## Phase 8 — Consolidation and simplification ✅ (complete)

Six build-out phases added a lot of surface area fast. Before expanding the
discovery layer, take a deliberate critical pass over everything that exists and
ask, for each piece, whether it is the simplest, most elegant solution — pruning
and consolidating rather than adding. Earn the right to expand.

- [x] Inventory every surface — routes, shared components, analytics modules,
      question/trail modules, and data lanes — with each one's purpose, the data
      it shows, and where it overlaps or duplicates another surface. Captured in
      `docs/INVENTORY.md` as a durable map kept honest (resolved overlaps marked,
      remaining ones flagged).
- [x] Visual-hierarchy audit: each page should lead with one clear primary
      answer or action; demote, merge, or cut elements that compete with it.
      Recorded in `docs/VISUAL-AUDIT.md`; remaining hierarchy items (odds hero,
      travel map-first, `/data` split) carry forward there.
- [x] Data-density audit against the "adaptive medium density" principle:
      records, filters, and tables stay compact; interpretation modules, charts,
      and coverage notes get room. The clearest density failure — caveat text
      below comfortable contrast at the trust point — was fixed by raising
      `CoverageNote` from faint to dim ink with brighter labels.
- [x] Feature-creep and redundancy pass: find modules that duplicate each other
      or rarely earn their space, and consolidate or remove them. Static chart
      primitives were audited (`AreaChart` is a live no-JS fallback, `Bars` is
      used, `Sparkline` is unused and flagged for a deliberate keep/prune call).
- [x] Consistency pass: confirm shared components (competition chips, WdlBar,
      Pager, coverage notes) are used everywhere they should be, with no
      lingering one-off variants. Folded the remaining hand-rolled variants into
      shared components: `StatTile` (`/manager/[id]`, `/matches` slice),
      `PageHeader` (`/managers`), `Pager` (`/manager/[id]`), and the shared
      `.control`/`focus-ring` form vocabulary (`/analytics/odds`). The
      `/match/[id]` textual facts grid was deliberately left bespoke.
- [x] Performance and accessibility spot-check while surfaces are open: server
      component boundaries held (no new client components introduced), the
      contrast fix above addresses the main act-on-text legibility gap, and
      `next build` + golden tests + lint + typecheck pass clean.

Phase 8 is complete as a consolidation pass: the surface area is mapped in
`docs/INVENTORY.md`, the lingering one-off variants are folded into the shared
component vocabulary, the trust-surface contrast gap is closed, and the
remaining visual-hierarchy items are recorded in `docs/VISUAL-AUDIT.md` rather
than left implicit. The bigger interface bets that are genuinely *additions*
(searchable odds combobox, segmented index grouping, comparison modes) are
deferred to Phase 9 where they belong, so this phase pruned and tightened rather
than expanded.

## Phase 9 — Discovery and comparison ✅ (complete)

With the surface simplified, expand the core premise — question-led pattern
discovery — by adding the comparison and exploration tools it is currently
missing, each tied to its match evidence and coverage note.

Groundwork (done):

- [x] Unused-export guard — the drift guard deferred from Phase 8 is live.
      `knip` (`npm run knip`, wired into CI before `validate`) replaces the
      broken `import/no-unused-modules` rule and catches unused files, exports,
      types, and dependencies across `.tsx`. Baseline taken to zero: deleted the
      dead local `AreaChart` (knip showed `InspectableTimeSeriesChart` uses
      Recharts' `AreaChart`, so the "live no-JS fallback" claim was drift),
      `seasonStartYear`, and the `tmp-check.ts` scratch file; un-exported ~13
      module-internal symbols. See `docs/INVENTORY.md`.

Discovery work:

- [x] Comparison views: player vs player, era vs era, and manager vs manager on
      shared, coverage-aware metrics. `/compare` (`lib/compare.ts`) builds one
      `Comparison` shape for all three modes, rendered by `CompareTable` as a
      mirrored-bar "versus" with the leader tinted; each metric carries its own
      caveat (the assist lane, three-points-for-a-win, era handover years) and
      links back to its matches. Shaped player-vs-player search lands here.
- [x] Expand the question/trail catalogue with new myth-testing cuts beyond the
      current modules: "Are United really the comeback kings?" (recoveries from
      behind, replayed from minute-stamped goals, graded coverage) and "How long
      are United's longest runs?" (the streak board below), taking `/questions`
      to nine modules.
- [x] Streak and run detection (unbeaten runs, scoring streaks, clean-sheet
      runs) as first-class, evidence-linked modules. `lib/streaks.ts` enumerates
      the top-N consecutive-official-match runs of four kinds over one
      date-ordered sequence, each carrying the match that ended it; the
      `StreakBoard` ladders them and every run links to its `/matches` window.
- [x] A guided "build your own cut" explorer over the existing filter and
      aggregate layer. `/explore` (`lib/explore.ts`) is the aggregate companion
      to `/matches`: pick a dimension (decade, season, competition, type, venue,
      result, opponent, manager), narrow with the shared filters, and read the
      record per group — every row's link reproducing exactly the matches it
      counts.

Phase 9 is complete as a discovery *capability*: the question-led premise now has
real comparison and exploration tools. `/questions` gained comeback and
longest-run modules (nine in all) and `lib/streaks.ts` makes runs first-class and
evidence-linked — these two landed at the design bar and are keepers. `/compare`
puts two players, managers, or eras side by side on coverage-aware metrics, and
`/explore` turns the filter+aggregate layer into a group-by explorer — these two
ship the capability but **not** the design bar yet, and carry follow-up debt (see
below). New comparison metrics, question cuts, run kinds, and explorer dimensions
continue as normal product work on `lib/compare.ts`, `lib/trails.ts`,
`lib/streaks.ts`, and `lib/explore.ts`.

### Phase 9 follow-up — navigation IA and the discovery surfaces' design

Two issues surfaced once Phase 9 shipped, recorded here for a deliberate pass
before any further surface is added:

- ✅ **The primary nav has outgrown a single rail. (resolved)** The eleven-tab
      horizontal-scroll rail (with edge fades) is replaced by a flat rail of the
      five routes that earn a one-click slot — Questions, Matches, Seasons,
      Players, Managers — plus a "More" overflow menu holding the rest (Opponents,
      Analytics, Compare, Explore, Transfers, Data). `MainNav` is split into a
      `PrimaryRail` (still a fade-cued scroller, now a graceful narrow-screen
      fallback rather than the desktop default) and a `MoreMenu` disclosure that
      closes on outside-click, Escape, and route change, and shows the active
      styling when an overflow route is current. The "decide what earns a
      top-level slot before adding any new route" rule still stands for future
      surfaces.
- ✅ **Compare and Explore are half-baked and must justify their place.
      (resolved — design lift)** Both read as utilities before: `/compare` was a
      plain versus table, `/explore` a filter form over a dense table. They were
      given a dramatic, subject-grounded lift drawn from football's own artifacts:
      - **Compare → a match scoreboard + mode-specific signatures.** First pass: a
        scoreboard hero ("leads N–N" tally + verdict) over mirrored per-metric bars.
        That bar stack still read as bland (every self-normalised bar ~the same
        length), so a second pass replaced it with the one artifact that carries
        each mode's story — players → a **career-arc duel** (overlaid goal-per-season
        curves: peak, longevity, trajectory); managers → a **trophy cabinet** (the
        silverware as gold glyphs by competition + a win-rate gauge); eras → a
        **league-finish skyline** (season-by-season top-flight finishes, gold for
        titles). The verdict leads with the biggest gap as a ratio ("3.5× the
        silverware"); the shared metrics stay as a compact numeric strip beneath.
        The empty state leads with curated *great debates*; the build-your-own picker
        is demoted beneath them, the era select is grouped, and player inputs gain
        native `<datalist>` autocomplete. See `components/CompareSignatures.tsx`.
      - **Explore → a league ladder.** The page leads with the cut's headline
        finding (the standout group for the active sort), makes the dimension a
        dial of instant re-cut links (filters demoted to a refine bar), and renders
        the groups as an `ExploreBoard` ranked ladder — each row a W/D/L form bar
        with played/win-rate/GD figures, the whole row an evidence link.
      Both keep every figure linking to its matches and their coverage notes
      intact. They still sit in the "More" overflow for now; whether the lift earns
      them a higher nav slot is a future call, but they are no longer half-baked.
- ❌ **Explore removed (2026-06).** The design lift above bought `/explore` time
      but not a reason to exist. Even answer-first, it stayed a query builder you
      had to *operate* before it said anything — the only form-first surface in an
      answer-first site — and it overlapped `/questions`, which hands the same
      findings pre-baked. No obviously better variant justified keeping it, so
      `/explore`, `lib/explore.ts`, and `ExploreBoard` were deleted rather than
      redesigned a third time. Its job (twist a curated cut yourself) belongs
      downstream of `/questions`, not as a standalone destination.

## The expansion — strategic frame

Phases 1–9 built the engine: a complete, versioned, evidence-linked record with
question-led discovery, comparison, and a public API. The next arc is not more
surface — it is **reach and trust**: turning that record into answers that
travel, and a community that improves them. An independent product review
(`docs/UnitedStats_Market_and_Product_Strategy_Report.pdf`) confirmed the
diagnosis — the moat is the compound system, not the raw rows — and surfaced the
work below.

Four anchors hold the expansion together:

- **Positioning — answer-first.** The answer is the front door; exploration is
      the follow-on. This is a clarification of, not a break from, the north
      star: `/questions` is already answer-first, but the homepage and discovery
      IA are still trail-first. (`PRODUCT.md`'s exploration-first framing is
      reconciled in Phase 11.)
- **Defensibility — the compound moat.** Corpus, identity resolution,
      provenance, definitions, evidence UX, and the query layer are built and
      hard to reproduce; the two weak components are **distribution**
      (Phases 10, 13–14) and **correction** (Phase 15).
- **Growth — the answer engine's last mile.** The engine generates
      evidence-graded answers; nothing yet lets them leave the building.
      Sitemaps, canonical answer pages, share/cite, and embeds are the cheapest,
      highest-leverage work in the plan (Phase 10).
- **Source, not casualty.** A fan can ask a chatbot the same question and get a
      fluent, unverifiable answer in seconds. The structural reply already lives
      in the data model — every number links to its exact reproducible match set
      with a coverage grade. The move is to make UnitedStats the source such
      systems *cite* rather than replace (Phase 14).

**Keystone — the Cut.** The discovery layer converges on one serializable
object: a **Cut** = `{ dimension, filters, metric/lens, coverage, curated }`,
encodable to a URL. A question is a curated Cut with prose; a comparison is a Cut
with two subjects; a group is a Cut grouped by a dimension. Rendering everything
from one model is what makes *fork — change a parameter, get a new shareable
Cut* possible, and what finally gives the deleted `/explore` its proper home:
downstream of an answer, never a form-first front door. Build concrete cuts
first (Phases 10–11); extract the model only once their real shape is visible
(Phase 12) — earn the right to abstract, per Phase 8.

Cross-cutting guardrails for the whole expansion:

- **Stay static and zero-cost.** No server-side user database. Saved state is
      the URL plus `localStorage`. This deliberately rules out accounts,
      server-saved questions, and push alerts; they are not worth abandoning the
      static model for.
- **SEO discipline on forks.** Only `curated` Cuts get indexable canonical
      pages. Arbitrary user forks are `noindex` — otherwise Phase 12 spawns
      infinite thin-content pages and undoes the SEO that Phase 10 builds. The
      `curated` flag exists from the Cut model's first commit.
- **Do not dilute `/questions`.** It is the strongest surface. Carousels and
      launchers only *launch*; depth always lives in the full cut page.

## Phase 10 — Distribution foundations (make answers leave the building)

The growth engine's last mile. The corpus is addressable but invisible: detail
pages are statically generated, but there is no sitemap, no share affordance, no
card when a link is pasted, and the nine question modules are `#anchors` on one
page rather than rankable URLs.

- [ ] **Per-question canonical routes** — promote the nine `/questions` modules
      from in-page anchors to real routes (`/questions/late-goals`, …) with their
      own `generateMetadata`. The content already exists; this unlocks both SEO
      and per-question sharing in one move.
- [ ] **`app/sitemap.ts` and `app/robots.ts`** — make the full corpus (matches,
      seasons, players, managers, opponents, question cuts) crawlable as a set
      rather than only reachable by internal links.
- [ ] **Evidence-card `opengraph-image`** — an `opengraph-image.tsx` per
      answer/entity route that renders the card the report calls for: the answer
      plus the trust strip (matches · coverage grade · source). Every pasted link
      becomes an ad that carries its own provenance.
- [ ] **Share and cite** — on every answer module and detail page: copy-link,
      copy-citation (metric definition, coverage grade, retrieval date), and
      copy-image. This is the report's "creator mode" in its minimum viable form
      and the first edge of the distribution graph.
- [ ] **Guardrail** — cards and pages stay build-time or edge-rendered; no user
      database is introduced.

## Phase 11 — Answer-first front door and discovery IA ✅ (complete)

The positioning shift made concrete (report §10.3).

- [x] **Reconcile the north star** — `PRODUCT.md`'s Core Promise and Homepage Role
      now state plainly that the answer is the front door and exploration the
      follow-on, framed as a sharpening of the question-led model rather than a
      break from it, so the two documents agree.
- [x] **Rebuild `/explore`, answer-first** — the new `/explore` discovery home
      opens with the question field and a one-line trust strip, then a peek-carousel
      of the nine curated question Cuts (a launcher to the Phase 10 per-question
      pages — it does not reproduce their depth), then **Compare** (one flagship
      debate per mode, drawn from the now-shared `CURATED_DEBATES`) and **Group**
      (honest launchers into the existing aggregate surfaces: by season, opponent,
      manager, the long arc) beneath as the exploratory follow-on. The general
      group-by-anything builder stays Phase 12's Cut/fork work; this section points
      at the grouped views we already ship rather than reviving a half-baked builder.
- [x] **Answer-first homepage** — the homepage now leads (after the floodlit hero,
      which already carries the question field and skyline) with the curated-cut
      launcher carousel, demotes the demonstrated-question block to a single
      "one answer, in full" showcase, and keeps the portal-style "Routes into the
      record" grid demoted beneath a divider. All question links moved from
      in-page `#anchors` to the Phase 10 `/questions/[slug]` routes.
- [x] **Mobile and desktop** — **decision: one peek-carousel at every breakpoint,
      not a grid on desktop.** Rationale recorded here per the "decide before
      building" rule: a 3×3 grid of question cards would read as a portal and
      flatten the answer-first hierarchy, and reproducing all nine at full size
      competes with `/questions` itself (which the launcher must not do). A
      peek-carousel reads as "there's more, swipe on", keeps each card large enough
      to lead with its question, is one component with no media-query divergence,
      and is pure CSS scroll-snap (`snap-x snap-mandatory`, `scrollbar-none`) so it
      stays a server component and adds no client JS — fitting the static/zero-cost
      guardrail. A static right-edge fade plus the partial peek of the next card cue
      that the strip scrolls. Lives in `components/CuratedCarousel.tsx`, shared by
      the homepage and `/explore`.

## Phase 12 — The Cut engine and fork

The keystone generalised — the plan's largest architectural bet, deliberately
sequenced after concrete cuts exist.

- [ ] **Define the `Cut`** — a serializable
      `{ dimension, filters, metric/lens, coverage, curated }`, URL-encodable,
      with `curated` present from the first commit.
- [ ] **Render questions, compare, and group from one model** — extract the
      shared engine only once Phases 10–11 have shown its real shape across the
      nine cuts, rather than designing the abstraction up front.
- [ ] **Fork** — every cut page offers "fork this": adjust a parameter, get a new
      Cut at a new URL. The reborn explorer — twist a curated cut yourself,
      downstream of an answer.
- [ ] **Forks degrade honestly** — a forked Cut whose filters hit a coverage gap
      renders its own unsupported/partial state via the existing coverage
      grading; it never shows a clean total over a hole.
- [ ] **SEO guardrail** — only `curated` Cuts are indexable; arbitrary forks are
      `noindex`.
- [ ] **Mobile interaction model** — parameter controls as a bottom-sheet of
      dials, not inline form fields; prototype before committing.

## Phase 13 — The "history changed" engine

Report §10.5 / Gap 5 — the freshness loop, the habit loop, and the answer-first
counter to both live-score apps and generic AI, on infrastructure that already
exists.

- [ ] **Deterministic post-match digest** — after each cron update, generate
      "what this match changed in the all-time record": records entered or
      extended, streaks started or ended, rank changes, manager and opponent
      milestones, Elo movement and historical percentile, unusual scoreline or
      venue facts.
- [ ] **No new infrastructure** — a build-time generator inside the existing
      GitHub Actions pipeline.
- [ ] **Reuse the distribution surface** — each digest is a shareable card
      (Phase 10 OG/share) and a canonical page (Phase 10 routing). "What did
      tonight mean in 140 years of United?" is the question a live-score app will
      not answer and a chatbot cannot.

## Phase 14 — Source, not casualty

Turn the AI threat into a referral channel.

- [ ] **Structured data** — JSON-LD / schema.org on answer and entity pages so
      search and assistants can parse the claim and its provenance.
- [ ] **Machine-facing answers** — an `llms.txt` and a documented answer-shaped
      surface over the existing `/api/v1`, with stable citable IDs per cut and
      answer.
- [ ] **Goal** — search and LLM referrals that cite UnitedStats as the verifiable
      source rather than reproducing the number unattributed.

## Phase 15 — Correction as a product

Promotes the parked trust-and-contribution loop; report §10.7. Converts the
weakest moat component into a strength.

- [ ] **"Suggest a correction"** on matches, players, and events: affected field,
      proposed value, source, explanation, optional attachment or archive
      reference.
- [ ] **Structured output** — produce a GitHub issue or pull request, run
      canonical-JSON validation, preview the diff, and show status publicly.
- [ ] **Static-friendly** — a prefilled issue link or a single serverless
      endpoint; no standing backend. Fits the canonical-JSON-in-Git model
      exactly.
- [ ] **Effect** — a durable contribution model that does not depend on one
      maintainer, seeded as a first-class workflow rather than a footer
      invitation.

## Phase 16 — Habit and creator tail (later)

Reach and retention, once the engine and its distribution are proven.

- [ ] **On-this-day** — a lightweight daily historical module for the casual and
      nostalgic audience.
- [ ] **Saved collections** — URL-encoded, static-friendly collections of Cuts,
      without accounts.
- [ ] **Embeds** — embeddable cards and charts (iframe or image) so creators turn
      the dataset into public discovery.

## Parked pathways (open questions)

Real directions, deliberately not the immediate focus. Recorded so they are not
forgotten and can be promoted when the timing or evidence is right.

- **Historical data depth.** Backfill opposition scorers (currently ~891
      matches), extend the curated lane earlier than 1987-88, and chase
      pre-2012 match-level assists. The most "researcher-grade" play, but gated
      by open, redistributable source availability and the scraper/rate-limit
      realities already documented; advances opportunistically through curated
      PRs and new ingesters rather than on a fixed schedule.
- **Engagement and distribution.** ✅ promoted — the discovery layer is now
      strong enough to justify the audience push, so this is the spine of the
      expansion: shareable evidence cards and canonical pages (Phase 10), the
      "history changed" digest in place of a raw "on this day" (Phase 13), and
      embeds (Phase 16). Note "saved questions" is reshaped into URL-encoded
      saved collections under the static guardrail rather than server state.
- **Trust and contribution loop.** ✅ promoted to Phase 15 — correction
      templates, canonical-JSON validation, and diff previews become a
      first-class "suggest a correction" workflow rather than a `/data` footer
      invitation.
- **Polish the tricky custom graphics.** A few bespoke SVG figures don't yet
      reach the design bar and are parked for a deliberate pass. The clearest is
      the player page's goal "body map" (`components/charts/GoalBodyMap.tsx`): the
      data mapping and badge placement are right, but the hand-authored striker
      silhouette still reads as amateurish. Revisit with a professionally
      designed or properly licensed (CC0) footballer-striking vector rather than
      more hand-bezier iteration. `sharp` is available for a render-and-inspect
      loop when polishing any SVG-based view.

## Data depth ledger

The UI is honest about coverage: every aggregate that depends on events or
lineups displays the coverage window it's computed from (e.g. "goal data:
1,234 of 6,000 matches"). This is a feature, not a caveat — stretfordend
itself grew the same way, season by season.

Coverage should stay visible at interpretation points rather than becoming
constant noise. A user reading a player total, assist partnership, lineup
aggregate, goal-minute chart, or myth-testing prompt should understand the
coverage behind it before trusting the conclusion.
