# Roadmap

## Product north star

Red Thread (the public brand; UnitedStats is now the repository-era name — see
Phase 17 and `docs/BRANDING.md`) is a pattern-discovery product for stats-heavy
Manchester United fans with researcher-grade trust expectations. The fixture
record is the spine; question-led analysis is the discovery layer; people are the
emotional entry points.

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

## Phase 10 — Distribution foundations (make answers leave the building) ✅ (complete)

The growth engine's last mile. The corpus is addressable but invisible: detail
pages are statically generated, but there is no sitemap, no share affordance, no
card when a link is pasted, and the nine question modules are `#anchors` on one
page rather than rankable URLs.

- [x] **Per-question canonical routes** — promote the nine `/questions` modules
      from in-page anchors to real routes (`/questions/late-goals`, …) with their
      own `generateMetadata`. The content already exists; this unlocks both SEO
      and per-question sharing in one move.
- [x] **`app/sitemap.ts` and `app/robots.ts`** — make the full corpus (matches,
      seasons, players, managers, opponents, question cuts) crawlable as a set
      rather than only reachable by internal links.
- [x] **Evidence-card `opengraph-image`** — an `opengraph-image.tsx` per
      answer/entity route that renders the card the report calls for: the answer
      plus the trust strip (matches · coverage grade · source). Every pasted link
      becomes an ad that carries its own provenance.
- [x] **Share and cite** — on every answer module and detail page: copy-link,
      copy-citation (metric definition, coverage grade, retrieval date), and
      copy-image. This is the report's "creator mode" in its minimum viable form
      and the first edge of the distribution graph.
- [x] **Guardrail** — cards and pages stay build-time or edge-rendered; no user
      database is introduced.

Phase 10 is complete as a distribution capability, delivered incrementally
across the phases that depend on it: `app/sitemap.ts` lists the whole ~13k-URL
corpus (matches, seasons, players, managers, opponents, curated cuts, question
slugs, history digests, on-this-day keys) and `app/robots.ts` points crawlers at
it while disallowing only the click-tracking endpoint; the nine `/questions`
modules are real `/questions/[slug]` routes with their own metadata (the
standalone index 308-redirects into `/explore`, per Phase 11.5); eight routes
carry an `opengraph-image.tsx` evidence card (home, match, season, player,
manager, opponent, question, history-changed); and `components/ShareCite.tsx`
provides copy-link / copy-citation / copy-image on match, history-changed,
player, identity, and question surfaces. Everything stays build-time or
edge-rendered with no user database. (The checkboxes lagged the code — the
deliverables shipped through Phases 11–16; this paragraph reconciles the record.)

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
- [ ] **Superseded by Phase 11.5.** This decision turned on "the launcher must
      not compete with `/questions`." Once `/questions`' index is subsumed into
      `/explore` (Phase 11.5), that constraint inverts: the Answering strip *should*
      carry rich, near-full-view previews. The peek-carousel and `CuratedCarousel`
      stay on the homepage as a count-free tease; `/explore` moves to the
      full-bleed-feature + summary-rail pattern below. The interim answer grid on
      `/explore` (commit superseding Phase 11) is the summary rail without its
      carousel — a stepping stone, not the target.

## Phase 11.5 — Explore as the discovery surface (three-strip framework) ✅ (complete)

The reframe that reorganizes Phases 10–12 into one surface (PRODUCT.md →
"Discovery Surface"). `/explore` becomes the single jumping-off point: three
strips built from one framework — **exploring · asking · answering questions** —
ordered along a curation gradient, most curated (most visually sophisticated) at
the top to least curated (plainest) at the bottom. Each strip is the same shape:
a full-bleed feature view moved across horizontally, a summary-card rail beneath
so the set is skimmable without swiping, and from either a jump to the canonical
full page. `/explore` previews and routes; depth lives one click away.

- [x] **Strip 1 — Answering (Questions).** Built on the Phase 10
      `/questions/[slug]` depth pages. The standalone `/questions` index is subsumed
      (308-redirect; the `[slug]` routes stay the jump target). Each full-view slide
      is a purpose-built "answer hero" — a big finding, one signature visual
      (`components/explore/QuestionSignature.tsx`), and a jump link — *not* the full
      `QuestionModule` reproduced. A summary rail of all nine sits beneath; desktop
      gets translucent edge arrows.
- [x] **Strip 2 — Asking (Comparisons).** The compare surface reframed as the
      extensible *who was better than who at X?* — every `CURATED_DEBATES` entry as a
      feature slide (verdict + the mode's signature, via
      `components/explore/ComparisonHero.tsx`), built through the same engine
      `/compare` uses, jumping to the full scoreboard. Lighter than `/compare` by
      design (the curation gradient): verdict and signature only, no measures table.
- [x] **Shared strip framework extracted (after two strips existed, per the
      discipline below).** `FeatureCarousel` (the client scroll/arrows shell) and
      `FeatureSlide` (the article + text-link + signature shell) in
      `components/explore/`, now shared by Answering and Asking. The visual sits
      outside the slide's link so a signature's own links never nest anchors.
- [x] **Strip 3 — Exploring (the Cut).** The blank canvas — Phase 12 below. The
      least-curated strip; plainest by design (a grid of curated-cut launchers, no
      carousel — the curation gradient runs plainer as the freedom rises). The "Group
      the record" stand-in is replaced by real launchers into the `/cut` engine.

## Phase 12 — The Cut engine and fork ✅ (complete)

The keystone generalised, and **Strip 3 (Exploring) of the Phase 11.5
framework** — the blank-canvas end of the curation gradient. The plan's largest
architectural bet, deliberately sequenced after concrete cuts exist.

- [x] **Define the `Cut`** — `lib/cut.ts` defines a serializable
      `{ dimension, filters, metric/lens, coverage, curated }`, encoded to and from
      the `/cut` query string (`cutFromParams`/`cutHref`). `curated` is present from
      the first commit and is *derived*, not trusted from the URL: a cut is curated
      only when its `{ dimension, metric, filters }` matches a registered
      `CURATED_CUTS` entry. `coverage` is likewise derived by `runCut` from the
      filters and metric, so a forked link can never lie about its own completeness.
- [x] **Render questions, compare, and group from one model** — the *group* cut is
      the one that needs a generic renderer (a fork produces an arbitrary group), so
      `runCut` + `/cut` render it from the model; questions stay curated Cuts with
      prose and comparisons stay Cuts with two subjects (their bespoke renderers
      unchanged, per "earn the right to abstract"). The model is the shared spine:
      `/compare` now forks era and manager comparisons straight into `/cut` ("a
      comparison is a Cut"), and the curated registry replaces the old "Group the
      record" stand-in.
- [x] **Fork** — the `/cut` page leads with the standout-group answer, then offers
      the fork as two dials (group-by dimension, rank-by metric/lens) plus a demoted
      refine form. Changing any parameter is a new shareable Cut at a new URL — the
      reborn explorer, reached downstream of a curated-cut answer or a comparison.
- [x] **Forks degrade honestly** — a Cut whose filters intersect to nothing renders
      its own empty state (no headline, an `empty` coverage grade) rather than a
      clean total over a hole; rate metrics over small groups are flagged as thin
      samples instead of presented as solid. Pinned by a golden test.
- [x] **SEO guardrail** — only `curated` Cuts get an indexable canonical page and a
      sitemap entry; every forked parameter combination is `noindex, follow` (set in
      `/cut`'s `generateMetadata`), so forking is unbounded without spawning
      thin-content pages.
- [x] **Mobile interaction model** — **decision: dials, not a JS bottom-sheet
      modal.** The primary controls (dimension, metric) are big tappable chip-links —
      "dials a reader picks, not boxes they fill" — visible at every breakpoint, and a
      sticky mobile "Re-cut" bar anchors to them so they are one tap away deep in a
      long ladder (the proven `/matches` sticky-filter pattern). The narrower slice
      filters stay a demoted GET form. This keeps the surface a zero-JS server
      component, fitting the static/zero-cost guardrail, rather than introducing a
      client modal; recorded here per "prototype/decide before committing".

Phase 12 is complete as the discovery layer's keystone: `lib/cut.ts` is the one
serializable, URL-encodable Cut model, `runCut` the engine that aggregates the
record by any dimension and ranks it by any lens with derived coverage grading,
and `/cut` the generic, forkable renderer — the reborn explorer, now downstream of
an answer rather than a form-first front door. Six curated cuts are the indexable,
sitemap-listed set (the Exploring strip on `/explore`); every other fork is a real
shareable but `noindex` URL. `/compare` forks era and manager comparisons into the
same engine. Golden tests pin serialization round-trip, the curated/fork (SEO)
boundary, the aggregation against the canonical record, and honest empty-slice
degradation. New dimensions, metrics, and curated cuts continue as normal product
work on `lib/cut.ts`.

## Phase 13 — The "history changed" engine

Report §10.5 / Gap 5 — the freshness loop, the habit loop, and the answer-first
counter to both live-score apps and generic AI, on infrastructure that already
exists.

- [x] **Deterministic post-match digest** — after each cron update, generate
      "what this match changed in the all-time record": records entered or
      extended, streaks started or ended, rank changes, manager and opponent
      milestones, Elo movement and historical percentile, unusual scoreline or
      venue facts.
- [x] **No new infrastructure** — a build-time generator inside the existing
      GitHub Actions pipeline.
- [x] **Reuse the distribution surface** — each digest is a shareable card
      (Phase 10 OG/share) and a canonical page (Phase 10 routing). "What did
      tonight mean in 140 years of United?" is the question a live-score app will
      not answer and a chatbot cannot.

Phase 13 is complete as a freshness-loop capability: `npm run
generate:history-digests` creates deterministic, Phase-0-citable digest
artifacts from the local SQLite record; the update workflow runs it after
validation and DB rebuild for each batch of new matches; `/history-changed/[id]`
renders canonical digest pages with OG cards and sitemap entries; and the
detector suite covers records, streaks, rank changes, manager/opponent
milestones, scoreline/venue facts, Elo movement, and historical percentiles with
positive and negative golden cases. Reviewed under
`docs/process/reviews/002-phase13-history-digests.md`.

> **Follow-up note (2026-06-24): the taste pass landed in two rounds.** Round one
> (commit `f44e62a`) ranked claims by editorial weight, grouped the rest under
> "Also shifted", humanised the labels, and added a match-page door — better, but
> the digests stayed thin/Elo-heavy for ordinary recent matches, leading a 3-2 win
> with "Elo rose from historical rank 2728 to 2601". Round two (this pass) fixed
> the substance: an always-on **result** claim makes every digest lead with what
> actually happened on the pitch; **rank-change** now fires only inside United's
> hundred best-ever ratings (or a new peak), so the meaningless absolute rank is
> gone from ordinary matches; the detector copy was sharpened and made era-correct
> (Newton Heath pre-1902); editorial weight was reordered so scoreline/streaks lead
> and Elo movement sinks; the latest ten matches were regenerated; and a
> **Recently changed** strip now leads `/explore` and the homepage's living-record
> movement, so the surface is discovered rather than orphaned. Detector copy still
> lives in the JSON artifacts, so future wording changes need a regeneration pass —
> but the surface now reads like UnitedStats, not a proof object.

## Phase 14 — Source, not casualty

Turn the AI threat into a referral channel.

- [x] **Structured data** — JSON-LD / schema.org on answer and entity pages so
      search and assistants can parse the claim and its provenance.
- [x] **Machine-facing answers** — an `llms.txt` and a documented answer-shaped
      surface over the existing `/api/v1`, with stable citable IDs per cut and
      answer.
- [x] **Goal** — search and LLM referrals that cite UnitedStats as the verifiable
      source rather than reproducing the number unattributed.

Phase 14 is complete as a machine-readable distribution capability: selected
match entity pages now emit `SportsEvent` JSON-LD, history-changed answer pages
emit `CreativeWork` JSON-LD, `/llms.txt` exposes the source/citation contract,
and `/api/v1/answers/*` provides stable answer-shaped payloads for curated Cuts
and history digests. The robots policy now allows read-only `/api/v1/` while
keeping click logging disallowed, and the implementation was reviewed under
`docs/process/reviews/003-phase14-source-not-casualty.md`.

## Phase 15 — Correction as a product

Promotes the parked trust-and-contribution loop; report §10.7. Converts the
weakest moat component into a strength.

- [x] **"Suggest a correction"** on matches, players, and events: affected field,
      proposed value, source, explanation, optional attachment or archive
      reference.
- [x] **Structured output** — produce a GitHub issue or pull request, run
      canonical-JSON validation, preview the diff, and show status publicly.
- [x] **Static-friendly** — a prefilled issue link or a single serverless
      endpoint; no standing backend. Fits the canonical-JSON-in-Git model
      exactly.
- [x] **Effect** — a durable contribution model that does not depend on one
      maintainer, seeded as a first-class workflow rather than a footer
      invitation.

Phase 15 is complete as a backendless correction workflow: match, player, and
event surfaces prefill a static `/corrections` builder; the client previews a
field-level diff and opens a deterministic GitHub issue; public status is the
filtered correction issue queue; and maintainer workflow docs keep canonical
changes behind source verification, PR review, and `npm run validate`. The
repair loop passed under
`docs/process/reviews/005-phase15-corrections-repair.md`.

## Phase 16 — Habit and creator tail (later)

Reach and retention, once the engine and its distribution are proven.

- [x] **On-this-day** — a lightweight daily historical module for the casual and
      nostalgic audience.
- [x] **Saved collections** — URL-encoded, static-friendly collections of Cuts,
      without accounts.
- [x] **Embeds** — embeddable cards and charts (iframe or image) so creators turn
      the dataset into public discovery.

Phase 16 is complete as a static-friendly habit and creator layer:
`/on-this-day/[monthDay]` builds all 366 UTC month/day pages, `/collection?c=...`
round-trips capped accountless Cut collections with coverage/evidence links,
and `/embed/cut/[slug]` serves noindex curated Cut embeds with explicit
cache/framing headers. Reviewed under
`docs/process/reviews/006-phase16-habit-creator.md`.

## Phase 17 — Red Thread: the brand and the answer as a thread

The product takes a public identity — **Red Thread** — and makes the brand's
central metaphor real in the interface: the evidence trail from a question to the
matches behind it becomes the literal structure of an answer page, not chrome
beside it. The identity system is documented in `docs/BRANDING.md`; the working
name UnitedStats is now the repository-era/internal name, preserved only where a
stable technical contract requires it.

Brand identity:

- [x] **Public rename to Red Thread** across every user-facing and
      public-attribution surface — header/footer, page metadata, OG cards, share
      citations, `/api/v1` and `llms.txt` attribution, and the downloadable dataset
      manifest — while the repository name, deployed domain, `localStorage` keys,
      env vars, ingest user-agents, and the `us:` citable-ID prefix are
      deliberately left unchanged as technical contracts.
- [x] **Threadline mark and app icons** — the `components/Brand.tsx` wordmark and
      compact mark, plus `app/icon.svg`, `app/favicon.ico`, and `app/apple-icon.png`
      generated from the mark by `scripts/gen-icons.mjs` (re-runnable if the mark
      changes).

The answer as a thread:

- [x] **The canonical answer page rebuilt as a thread spine** — `/questions/[slug]`
      now runs the argument down a continuous red `AnswerThread` spine through five
      stations: answer · evidence · the matches behind it · definition · coverage.
      Each station gets real vertical room so the scroll genuinely travels the
      stages, and the spine fills red to the station nearest the top — making
      "follow the red thread to every match behind the answer" the page's actual
      structure rather than chrome. The first attempt (a sticky sidebar rail over
      the existing dense panel) proved the lesson that the rail only works once the
      *page* flows: definition and coverage were promoted from sub-12px footnotes to
      readable sections (where the trust lives) and the matches link from a footnote
      to a destination CTA. Each station keeps a stable `${slug}-*` id so an
      answer's stages stay deep-linkable and citable; the catalogue (`variant=
      "index"`) keeps its compact panel.
- [x] **The thread as a system, continued** — the motif now carries into
      wayfinding and the mobile answer page, with a deliberate stop short of
      decoration. The selected nav tab is marked by a red thread *underline*
      rather than a filled chip (`components/MainNav.tsx`): the desktop rail and
      the mobile quick-tabs fade a `devil-bright` underline in under the active
      label, and the vertical mobile menu sheet uses the established inset-left
      red spine edge (the `inset … devil-bright` motif already in
      `globals.css`), so the thread arrives at the current section in the form
      that suits each layout. The answer spine (`components/AnswerThread.tsx`) is
      no longer a desktop rail that merely survives on phones: the connector now
      runs unbroken from each dot on mobile (the desktop keeps its beaded
      `sm:my-1.5` gaps) and the inter-station runs tighten (`pb-8 sm:pb-12`), so
      the answer reads as one continuous thread on a narrow screen with the
      content at near-full width rather than as a linear stack. **Deliberately
      not done — parked as decoration, not capability:** thread connectors on
      timeline annotations and on every source/provenance note. Threading those
      surfaces would be brand theater (the principle this phase closes on); they
      stay the clear, plain-typography notes they already are, and the motif is
      reserved for the two places it does real wayfinding/comprehension work.

Open brand follow-ups, decided 2026-06-24 after a deliberate walk-through rather
than folded into the visual rename:

- **Homepage headline → answer-first.** "Every match Manchester United ever
      played" (a corpus boast) becomes **"Follow the thread through Manchester
      United's history"** — an invitation that activates the Red Thread metaphor
      and leads with discovery rather than scale. "Ask United's history" was
      rejected: "Ask" overpromises natural-language Q&A the search does not do.
      The corpus proof (match count, year span) stays in the subhead as the
      credential, and the subhead keeps its honest "a question, a name, or a
      season" entry-mode hedge.
- **Top-level "Explore" → "Discover".** Renamed at the **label** level only
      (nav, page title/`<h1>`, breadcrumbs, and links that point *at* the
      surface); the `/explore` **route** is kept as a technical contract, the
      same public-name-vs-repo-name split this phase used for the rename itself.
      This also de-collides the surface name from its own "Exploring" strip and
      sorts the vocabulary: *Discover* is the answer-first surface; *explore*
      stays the verb for the freeform act (the Cut strip, the skyline). The
      surface eyebrow moves from "Discovery" (now redundant with the title) to
      "Answering · asking · exploring", naming the three strips.

Any domain migration is still planned separately.

Phase 17 is complete. It ships Red Thread as the public identity, lands its first
structural expression — the answer page rebuilt as the evidence trail it describes
rather than a dense panel with the trust buried in footnotes — and carries the
motif into the system where it does real work: the selected-nav underline and a
true mobile treatment for the answer spine. Per the discipline that runs through
this plan, the brand is invested where the motif aids comprehension and
wayfinding and stopped short of theater: thread connectors on timeline
annotations and source/provenance notes were considered and deliberately not
built, since they would decorate rather than clarify.

## The experience arc — strategic frame

Phases 1–17 built the engine and its distribution: a complete, evidence-linked
record; answer-first discovery, comparison, and the Cut; a freshness loop;
machine-readable provenance; a correction workflow; and a public brand. The
capability is there. What remains is **craft** — turning that capability into an
experience that anyone can enter and that rewards the people who stay. This arc
adds little new surface; it makes the surface we already have *land*. Three
moments structure it, in the order a user lives them:

- **Discovery** — getting from a cold start to the thing you wanted, whether you
      arrived with a precise question or only a vague itch.
- **Sharing** — getting the answer you found out into the argument you're having,
      as a near-frictionless habit.
- **Mobile** — making all of it delightful on the device most casual fans will
      actually use, which means deciding what to trim and what to transform,
      not just shrinking the desktop.

These are not green fields — Phase 5/9/11 worked discovery, Phase 10/16 built the
sharing infrastructure, Phase 11/16/17 began the mobile rework. The arc is a
*deliberate, deepened pass* on each: the plumbing exists, so the work is taste,
flow, and friction, not capability. Guardrails carry forward unchanged: stay
static and zero-cost (URL + `localStorage`, no user database, no behavioural
personalisation or server-saved state); keep the answer first and the evidence
trail intact; stay United-coded, not United-branded; and invest the Red Thread
motif only where it does real work. Each phase opens an **exploration** — user
stories and flow prototypes come before committed build, per "earn the right to
abstract." Sequencing is deliberate: discovery first (you can't share or pocket
what you can't find), sharing second (the answer travels), mobile last and
largest (it touches every surface and depends on the first two being settled).

## Phase 18 — Discovery: easy *and* delightful

The hardest bar in the product: a stranger with a half-formed thought should reach
a satisfying answer fast, and a regular should keep stumbling into things worth
finding. The engine can answer almost anything; the gap is that you still largely
have to *know to look*. This is a multi-phase exploration, not a single build —
it starts with who we're serving and how they move, and only then commits to
flows.

**Who we're serving (seed user stories — to be validated and expanded in 18.1):**

- *The settler* — "I'm mid-argument and need to win it." Arrives with a sharp
      question, wants the verdict + the evidence grade in one screen, now.
- *The wanderer* — "Show me something I didn't know." No query, wants
      serendipity that still feels curated, not random noise.
- *The nostalgic* — "I half-remember a match / a player / that season." Needs
      memory-jog routes (an era, a name, an opponent) more than a search box.
- *The researcher* — "Give me the complete record of X." Already served well;
      must not be slowed down by newcomer scaffolding.
- *The newcomer* — "What can I even ask here?" Needs orientation to the range
      without the site collapsing into a portal/directory feel.

### 18.1 — User stories and flow prototypes (the exploration) ✅ (complete)

- [x] Write the user stories above into real personas with entry context
      (channel, intent, device) and name the one "first delightful moment" each
      should hit.
- [x] Map the current cold-start flows for each persona end to end; mark where
      they stall, dead-end, or demand prior knowledge.
- [x] Prototype 2–3 candidate discovery flows (not full builds) and decide
      before committing, per the "decide before building" rule.

Phase 18.1 is complete as the exploration deliverable, captured in
`docs/DISCOVERY.md`: the five seed personas written up with entry context and a
named first-delightful-moment; each persona's cold-start flow mapped against the
real surfaces (homepage, `/explore`, `SearchCommand`/`HeaderSearch`, the shaped
parser, `/search`, on-this-day, detail trails) with stalls and dead-ends marked;
and three candidate discovery flows sketched — **A** answer-box/search-led, **B**
living-entry/serendipity-led, **C** subject-led orientation. **Decision:** lead
with **A** (the answer box, = 18.2) as the spine — it fixes the one surface every
persona touches and de-risks the others without adding any object above the
answer-first hero — then keep the roadmap order, folding B's content into 18.3 as
a *demoted* living strip + answer-foot related-rail (not a hero object) and C into
18.4's subject entry. Rejected as the lead: a feed-first hero (Phase 11
regression risk), a personalised/behavioural feed (guardrail), and fuzzy
describe-the-match memory search (parked; the nostalgic is served by cheap jogs).
`docs/DISCOVERY.md` §5 records the NLP stance for the answer box — a tier ladder
(deterministic → classical → LLM-as-parser → generative) with the decision that
18.2 builds Tier 0 and instruments the misses, defers Tier 1/2, and rejects
generative answers outright (NLP routes the question; the answer stays computed,
grounded, and testable). The build sub-phases inherit the carry-forward checklist
in `docs/DISCOVERY.md` §6.

### 18.2 — Search as the front door

- [ ] Live typeahead that previews **answers**, not just entity links — a shaped
      query should show its verdict-in-waiting as you type.
- [ ] Zero-result and low-confidence recovery: never a blank — suggest the
      nearest shaped cut or a reshape ("no exact match; try late goals under
      Ferguson").
- [ ] "Did you mean" and scope hints (player vs opponent vs season) so ambiguous
      names resolve gracefully.
- [ ] Surface what's askable from the field itself — rotating example prompts
      that teach the query grammar without a manual.

### 18.3 — Serendipity and guided wandering

- [ ] A "surprise me" / random-but-good route that only ever lands on a real,
      curated-quality cut.
- [ ] Related-answers rail at the foot of every answer ("if this interested you
      …") — deterministic and curated, never behavioural, to honour the static
      guardrail.
- [ ] Trails that lead one answer to the next, turning a single question into a
      session.
- [ ] A "what's interesting right now" feed weaving the existing
      recently-changed strip, on-this-day, and a rotating curated cut into one
      living entry point.

### 18.4 — Orientation and personal entry points

- [ ] Let people enter through what they care about — a favourite player, an
      era, a rivalry — and branch outward, rather than starting from a blank
      query.
- [ ] Show the *range* of the product to a newcomer without a directory grid
      (the lesson from the Phase 11 peek-carousel: tease breadth, don't enumerate
      it).
- [ ] A lightweight, dismissable orientation for first visits that never gets in
      a returning user's way.

## Phase 19 — Sharing: compelling, seamless, a habit

Phase 10 built the plumbing — `ShareCite` (copy-link / citation / image), OG
cards, embeds, collections. This phase makes sharing *irresistible at the moment
of discovery* and turns it into a reflex. The core United-fan use case is sharing
an answer to **win an argument**, mostly in a group chat, mostly on a phone — so
the card has to be a mic-drop and the path to sending it has to be one tap.

### 19.1 — The share moment

- [ ] Make share the obvious next action the instant an answer lands — present
      at the point of discovery, not hunted for in a footer.
- [ ] Drive friction toward one tap: lean on the native share sheet on mobile,
      with copy-link / copy-image / copy-citation as the desktop fallback.
- [ ] Confirm the share fired (the small delight) without a heavy modal.

### 19.2 — The card as mic-drop

- [ ] Per-surface OG card design pass: every card must read at thumbnail size —
      the **verdict**, the **coverage grade**, and the **source** legible before
      anyone clicks.
- [ ] Audit which surfaces still ship a generic card and give each its own answer
      card (extends the Phase 10 set: history-changed, questions, entities — now
      compare, cut, on-this-day).
- [ ] Carry the Red Thread mark and provenance strip so a shared card is an ad
      that cites itself (the Phase 14 "source, not casualty" flywheel).

### 19.3 — Channel-native

- [ ] Optimise the preview for where United fans actually argue — WhatsApp /
      iMessage previews first (the dominant fan channel, especially on mobile),
      then X and Reddit (r/reddevils).
- [ ] Frame the affordance as "settle this" / "share the receipt", not a generic
      "share" — speak to the argument-winning intent.
- [ ] Make citations paste cleanly into a Reddit/forum reply (the verifiable
      footnote a chatbot answer can't provide).

### 19.4 — Habit loops

- [ ] Turn the freshness surfaces into recurring shareable content — the
      history-changed digest after a match, on-this-day each morning — so there's
      a fresh, share-worthy thing without the user hunting.
- [ ] Make embeds discoverable to creators (the capability exists from Phase 16;
      the gap is that no one knows it's there).

## Phase 20 — Mobile: trim, transform, delight

The largest and last phase, touching every surface. Red Thread was designed
desktop-first and the power-user base will stay there, but the majority of any
audience is casual and on a phone. The goal is a mobile experience that is
*delightful in its own right*, which requires hard editorial decisions — what to
**cut**, what to **transform**, and what survives intact — rather than a
responsive shrink of the desktop layout. Phases 16–17 began this (mobile nav,
pinned tabs, the answer-thread spine on narrow screens); this phase finishes the
job system-wide.

### 20.1 — Audit and the mobile information diet

- [ ] Surface-by-surface mobile audit (in the lineage of `INVENTORY.md` /
      `VISUAL-AUDIT.md`): for each route, decide **keep / transform / cut on
      mobile**, with the rationale recorded so the cuts are deliberate.
- [ ] Make the hard calls explicitly — e.g. a dense analytics table may become a
      mobile summary with "open the full table on desktop" rather than a
      pinch-to-read grid. Decide per surface; don't default to showing everything.
- [ ] Define the mobile information diet: what a casual phone user needs from
      each surface vs. what is power-user depth that can be demoted or deferred.

### 20.2 — Transform patterns

- [ ] Establish reusable mobile transforms so surfaces converge instead of each
      reinventing: dense table → card/list; mirrored "versus" bars (compare) →
      stacked; wide chart (Elo timeline, league skyline, body map) →
      scroll-or-simplify with an honest reduced view.
- [ ] Apply the patterns to the heaviest offenders first — match browser, season
      tables, `/compare`, the `/cut` ladder.

### 20.3 — Touch ergonomics

- [ ] Thumb-zone actions: the primary action on each surface (re-cut, filter,
      share) reachable without a stretch, building on the proven `/matches`
      sticky-filter and `/cut` "Re-cut" bar patterns.
- [ ] Tap-target and spacing audit; kill anything that depends on hover.
- [ ] Keep it zero-JS server components where possible (sticky bars, scroll-snap)
      to hold the static/zero-cost line — the Phase 11/12 mobile decisions are the
      template.

### 20.4 — The answer surfaces on mobile

- [ ] Extend the Phase 17 answer-thread treatment from `/questions/[slug]` to the
      other answer surfaces (compare, cut, match) so the evidence trail reads as
      one continuous thread on a narrow screen everywhere, not just on the
      question page.
- [ ] Verify the OG/share cards (Phase 19) and the answer pages feel native when
      a link is opened from a chat on a phone — the most common real-world entry.

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
