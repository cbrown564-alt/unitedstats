# Transfer history — implementation plan

**Status:** proposed  
**Date:** 2026-07-28  
**Owner:** transfer-history experience and analysis  
**Product role:** strong supporting feature, not Red Thread's flagship

## Decision

Transfer history will become a deeper, more distinctive supporting feature
without replacing Red Thread's core spark → deepening → evidence sequence.

The work has two connected tracks:

1. **Experience:** make the existing transfer record easier to discover, explore,
   understand, and share through a bounded set of authored views.
2. **Analysis:** investigate cost versus transfer success, including which kinds
   of signings tend to succeed and how success likelihood changes across relative
   cost levels.

The experience track may ship incrementally. The analysis track is research
gated: no "best value" ranking or probability claim ships until the definition,
coverage, modelling, and sensitivity gates in this plan pass.

The transfer surface remains subordinate to the main Red Thread experience. It
should lead back into players, seasons, managers, defining matches, and the
traceable record rather than becoming a parallel product or a transfer-news
destination.

---

## Why this work now

Search Console shows that **Manchester United Transfer History** is the current
query family most consistently placing the site in search results. Transfer
interest also rises naturally during active windows. This is useful evidence
about an entry point, not a reason to reposition the whole product.

The repository already holds unusually strong foundations:

- 1,967 recorded transfers from 1883 to the present;
- known fees, fee kind, date precision, direction, counterparty club, and type;
- player identities linking transfers to the career and match record;
- manager attribution by transfer date;
- nominal, UK CPI, and Premier League football-inflation views;
- Premier League transfer-price indices and selected market-value enrichment;
- 6,028 matches, 6,022 validated starting lineups, player career records,
  seasons, honours, and defining-night rediscovery.

The gap is not another transfer database. It is the connection between the deal
and what followed.

---

## Product boundaries

### In scope

- Improve `/transfers` as the canonical Manchester United transfer-history hub.
- Add meaningful season/window views.
- Add a reusable transfer receipt for significant and context-rich deals.
- Prototype a squad-build timeline with a deliberately bounded initial era.
- Add manager and counterparty-club transfer lenses where the frame guarantees
  meaning.
- Give the current confirmed window historical context.
- Generate transfer-specific share cards.
- Research cost, context, success, and value using transparent definitions.
- Link all transfer aggregates to their underlying deals and coverage notes.

### Not in scope

- Making transfers the homepage, primary product, or dominant navigation item.
- Rumours, probability-of-completion trackers, live blogs, or news aggregation.
- Scraping or republishing unlicensed reporting.
- A general transfer dashboard with unrestricted filters.
- A universal black-box "transfer score."
- Causal claims that a signing produced a team result.
- Ranking active players as successes or failures before their observation
  windows are mature.
- Thousands of new static deal pages before search demand and build cost justify
  them.
- Premier League-wide conclusions from Manchester United data alone.

### Product bar

Every addition must remain a **lens, not a loom**:

- one or two meaning-preserving controls are acceptable;
- an unrestricted multi-filter analysis builder is not;
- every headline conclusion must expose the deals behind it;
- coverage and uncertainty appear where they affect interpretation;
- the transfer route should send a reader into a player, manager, season, or
  match thread rather than stop at a financial total.

---

## Experience architecture

The canonical journey is:

1. A reader arrives at **Manchester United Transfer History**.
2. The hub offers a concise historical answer and a small number of clear ways
   deeper: a season, a managerial era, a record deal, or the current window.
3. A window or transfer receipt explains the context and outcome of the deal.
4. The reader can inspect the player career, season, manager, and defining
   matches behind the summary.
5. Related transfer threads provide a route across eras without turning the
   page into a generic recommendation feed.

### Proposed route map

| Route | Role | Initial disposition |
| --- | --- | --- |
| `/transfers` | Canonical history hub | Rework existing route |
| `/transfers/[season]` | One season/window in context | Add, statically generated |
| `/manager/[id]` | Manager transfer lens within existing page | Extend existing route |
| `/transfers/club/[club-id]` | Authored counterparty relationship | Add only when minimum evidence gate passes |
| `/player/[id]` | Player transfer receipt and career outcome | Extend existing route |
| `/on-this-day` | Transfer anniversaries | Retain existing behavior |

Do not add one route per transfer in the first release. A receipt can be
addressable within the player or season page. Reconsider dedicated deal routes
only after query-level Search Console evidence shows demand that existing
canonical pages cannot satisfy.

---

## Recommendation 1 — Reframe `/transfers` as transfer history

### User promise

> Every recorded Manchester United arrival and departure, from 1883 to today —
> what it cost, who sanctioned it, and what followed.

This is a clearer search landing page than a page titled only "Transfers," while
remaining honest about fee and outcome coverage.

### Experience

Keep the strongest current elements:

- nominal / UK CPI / football-inflation toggle;
- spend tide;
- record deals;
- manager spend;
- season-by-season ledger;
- explicit fee-coverage caveats.

Recompose them into this order:

1. **Answer plate:** record range, recorded deals, known-fee coverage, gross
   spend/receipts, and one plain-language caveat.
2. **Current confirmed window:** visible only when the current season contains
   business.
3. **The historical money tide:** the existing trend with era and manager
   context.
4. **Ways into the record:** latest window, selected historical window, record
   deals, managers.
5. **Record deals:** receipts rather than fee-only cards.
6. **Manager view:** link each bar to the manager's transfer lens.
7. **Season ledger:** the full audit surface.

### SEO and metadata

- Title: `Manchester United Transfer History — Every Signing and Sale`
- H1: `Manchester United transfer history`
- Description must state the date range and distinguish confirmed records from
  unknown or undisclosed fees.
- Add `BreadcrumbList` and an `ItemList` only where the rendered page actually
  presents the corresponding items.
- Keep one canonical route. Avoid alias pages targeting small query variations.
- Server-render the core answer, current window, and latest seasons so the page
  remains useful without client JavaScript.

### Likely files

- `app/transfers/page.tsx`
- `components/transfers/TransfersLedger.tsx`
- `components/transfers/*`
- `lib/seo.ts`
- `lib/transferAggregates.ts`
- focused transfer and SEO tests

### Exit gate

- The first viewport states what the record contains and gives one obvious next
  action.
- Existing controls and season detail remain reachable.
- No homepage or primary-navigation hierarchy changes.
- Search metadata describes the actual page rather than anticipated features.

---

## Recommendation 2 — Season and transfer-window pages

### Purpose

A season page should answer more than "who moved." It should show how the squad
changed and what season followed.

### Page structure

1. Season and manager context.
2. Arrivals, departures, loans, releases, and academy promotions in clearly
   separated lanes.
3. Known spend, receipts, and net, with the selected money mode.
4. Position balance before and after the window where player-position coverage
   supports it.
5. The subsequent campaign: finish, honours, record, and three authored or
   computed defining nights.
6. Transfer receipts for the most consequential or expensive deals.
7. Full transfer ledger and evidence note.

### Important semantics

- Treat a **season** as the stable route key. Do not imply that every historical
  move belonged to a modern formal summer/winter window.
- Label loans, academy promotions, releases, retirements, free transfers,
  undisclosed fees, and unknown fees distinctly.
- A season's later performance is context, not proof that its signings caused
  the result.
- When managers change within a season, attribute individual deals by date and
  show the managerial transition explicitly.

### Initial exemplars

Build and review three deliberately different cases before generating every
route:

- `1998-99`: a successful, coherent squad addition;
- `2013-14`: a managerial transition and difficult post-title rebuild;
- the current season: an active, potentially right-censored window.

### Generation and performance

- Generate only seasons with at least one recorded transfer.
- Reuse existing season and match aggregates rather than duplicating queries.
- Keep charts server-fed and bounded.
- Add the route count and representative payload sizes to the existing
  performance review before full rollout.

### Exit gate

- The three exemplars remain meaningful despite having very different data
  shapes.
- A reader can move from window → player → defining match and back.
- The language never assigns causal credit from team performance alone.
- Route generation does not materially breach existing build budgets.

---

## Recommendation 3 — Transfer receipts

### Purpose

The receipt is the reusable bridge from transaction to football outcome. It is a
scorecard, not a verdict.

### Receipt anatomy

#### Deal

- player, direction, date and precision;
- from/to club;
- permanent, loan, free, academy, release, or retirement;
- nominal fee and available adjusted views;
- relative fee band for the season when the benchmark is defensible;
- manager at the transaction date;
- sources and fee confidence.

#### United spell

- verified appearances, starts, substitute appearances, and goals;
- assists only in a clearly labelled coverage lane;
- seasons at the club;
- position;
- debut, final appearance, and peak recorded season;
- defining nights already available through the rediscovery system.

#### Team context

- honours during the player's spell;
- league finishes during the spell;
- squad role or share of available matches where coverage supports it;
- careful wording: "during the spell" or "involved in," never "delivered."

#### Exit

- date and destination;
- exit fee and fee kind;
- nominal and comparable adjusted return where possible;
- subsequent return to United as a distinct spell.

### Multiple-spell rule

The unit is a **United signing spell**, not a person. Paul Pogba's 2016 return is
not merged into his academy departure. Loans and permanent returns remain
separate deals but may be connected visually.

### Selection

Receipts initially appear for:

- record fees in and out;
- deals featured on window pages;
- players with sufficient career linkage;
- a small authored set whose story adds meaning.

Do not make every fee-less nineteenth-century record carry an empty receipt.

### Exit gate

- Every field traces to a canonical source or tested aggregate.
- Missing fee, appearance, assist, and exit data degrade explicitly.
- The component works for a major signing, a free transfer, a sale, a loan, and
  a multi-spell player.
- No single success badge appears in this phase.

---

## Recommendation 4 — Squad-build timeline

### Purpose

Show how United squads were assembled and dismantled across time. This should be
the most visually distinctive part of the supporting feature, but it must remain
bounded and legible.

### Initial frame

Start with **1992 to the present** because fee benchmarking, position data, and
public familiarity are strongest. Extend backwards only after the interaction
and historical semantics work.

### Visual grammar

- horizontal time axis by season;
- managerial eras as background bands;
- incoming and outgoing player threads;
- lanes grouped by broad position;
- transfer fee encoded by length or a clearly labelled secondary mark, not
  colour alone;
- honours and league finishes as contextual markers;
- selection reveals a compact receipt and links to the player;
- one control: era/manager selection;
- optional second control: position lane.

Avoid a freeform Sankey with hundreds of crossings. If the full-squad view does
not remain readable, use one manager or one position as the default lens and
summarise the rest.

### Accessibility and mobile

- Provide an ordered ledger representing the same information.
- Keyboard selection must follow chronological order.
- Do not rely on hover.
- On phone, use manager/era chapters rather than shrinking the desktop
  timeline.
- Respect reduced motion.

### Prototype gate

Prototype Ferguson 1992–2002, Ferguson 2003–2013, and post-Ferguson as separate
datasets. Test density before building the universal renderer.

### Exit gate

- A reader can explain one squad transition after using it.
- The visualization remains a lens: manager/era and position are the only
  controls.
- The phone representation is intentionally composed, not a compressed desktop
  chart.
- The ledger exposes all underlying transfers.

---

## Recommendation 5 — Manager and club relationship lenses

### Manager lens

Extend existing manager pages with:

- signings and departures by season;
- spend, receipts, and net in the selected money mode;
- cost bands and position mix;
- squad churn;
- verified career outcomes of completed signing spells;
- authored links to defining seasons and nights.

Do not rank managers on gross or net spend alone. Tenure length, transfer-market
inflation, squad inheritance, and active-player censoring make that comparison
misleading.

### Counterparty-club lens

Create a club relationship only when it has enough material to tell a story.
Candidate questions include:

- which clubs supplied the most United players;
- repeated movement between United and a specific club;
- total known fees exchanged;
- players who moved in both directions;
- defining matches involving those players.

### Minimum evidence gate

A public club route requires at least:

- three recorded market transfers involving the counterparty; or
- two transfers plus one strong authored historical connection.

Thin club pages remain filtered ledger states and should not be indexed.

### Exit gate

- Manager and club lenses offer context beyond a list.
- Every aggregate links to its deals.
- No thin programmatic route is indexed.

---

## Recommendation 6 — Current confirmed window

### Purpose

Use seasonal interest without becoming a rumours product.

### Content

- confirmed arrivals and departures only;
- known spend, receipts, and net;
- academy, release, retirement, loan, and permanent lanes;
- historical fee rank and relative cost band;
- comparison with selected previous United windows;
- existing players in the same broad position;
- data timestamp and source state;
- explicit separation between completed business and unrecorded/unknown fees.

### Update behavior

- Reuse the existing canonical ingest and deployment pipeline.
- Do not create a parallel editorial database for current deals.
- If current data cannot be refreshed reliably, show the last verified date
  rather than suggesting live coverage.
- A pending or reported deal does not enter canonical data.

### Exit gate

- Every visible deal is confirmed by the source policy.
- The page has an honest verified-at timestamp.
- A quiet window still looks intentional.
- No rumour vocabulary, completion probabilities, or news feed appears.

---

## Recommendation 7 — Transfer share cards

### Purpose

Make a transfer receipt, window, or analytical finding legible when shared
without manufacturing virality.

### Card families

1. **Deal receipt:** player, fee, adjusted comparison, United career outcome.
2. **Window receipt:** arrivals, departures, known net, what followed.
3. **Manager era:** deals, known spend, completed-spell outcomes.
4. **Analytical finding:** only after the analysis publication gate passes.

### Rules

- One headline, three supporting facts, one evidence/coverage cue.
- No "flop," "disaster," "genius," or "proved" language.
- Active players carry an `ongoing` marker.
- Unknown and undisclosed fees must not silently become zero.
- Use the existing OG lab and renderer rather than adding a second card system.

### Exit gate

- Cards remain understandable at social-preview size.
- The linked page shows the evidence behind every visible number.
- Real payloads for a signing, sale, free transfer, and active player pass visual
  review.

---

# Analytical research track — cost versus success

## Research question

The motivating observation is that transfer price and transfer success do not
move together cleanly. Many historically expensive deals underperform
expectations, while lower-cost signings can produce exceptional careers.

The Red Thread question is:

> Within the evidence available, how are relative cost, age, position, prior
> experience, and transfer context associated with the likelihood and shape of a
> successful Manchester United signing?

The aim is not to find one magic formula. It is to identify robust patterns,
show where the evidence is weak, and give a fan a better frame for interpreting
transfer cost and outcome.

## Claims boundary

The first study is **Manchester United-only**. It can describe associations
within United's historical signings. It cannot establish what works across
football or estimate a general Premier League recruitment law.

A later league-wide study would require:

- licensed or openly reusable transfer records across clubs;
- comparable player appearances and performance at the destination club;
- stable player, club, competition, and position identities;
- a documented observation window;
- a separate source and redistribution assessment.

Do not broaden the public claim until that evidence exists.

---

## Unit of analysis

The primary row is a **permanent incoming first-team signing spell**.

Separate cohorts:

- permanent known-fee signings;
- permanent free transfers;
- permanent unknown/undisclosed-fee signings;
- loans;
- academy promotions;
- returning players / repeat spells;
- active or otherwise right-censored spells.

The core cost analysis uses known-fee permanent signings only. Other cohorts can
be described but must not be assigned a fictional zero cost.

### Observation windows

Produce at least two views:

1. **Completed spell:** observed from signing to final departure.
2. **Fixed horizon:** first three United seasons after signing.

The completed-spell view is richer but excludes or censors active players. The
fixed-horizon view makes eras and active players more comparable but misses
late-blooming value. Both are required as a sensitivity check.

---

## Cost definition

No single cost field is sufficient.

### Required cost views

1. **Nominal fee:** what was reported at the time.
2. **UK CPI-adjusted fee:** household-price comparison.
3. **Football-inflation-adjusted fee:** purchasing power within the Premier
   League transfer market.
4. **Relative cost percentile:** the signing's position within the distribution
   of Premier League fees in that season, if the comparison corpus passes its
   coverage gate.
5. **Fee relative to contemporaneous market value:** exploratory only, where
   point-in-time market value exists and its source can be redistributed.

### Preferred public axis

Use **relative cost percentile or cost band** as the primary cross-era analytical
axis:

- low;
- lower-middle;
- upper-middle;
- high;
- extreme / record-level.

Exact thresholds must be chosen from the observed benchmark distribution before
outcomes are inspected. This reduces hindsight-driven band selection.

### Cost limitations

- Add-ons, exchange deals, agent fees, wages, and contract length are generally
  absent.
- A reported headline fee may not equal cash paid.
- Unknown and undisclosed fees create non-random missingness.
- Football inflation based on an annual transfer corpus is an index, not a
  precise revaluation of a unique player.
- Market-value estimates are opinions and should not be presented as audited
  values.

---

## Defining success

Success is multi-dimensional. The research must begin with a scorecard, not a
single ranked number.

### Dimension A — availability and trust

Candidate measures:

- verified appearances;
- starts;
- share of United matches for which the player was available to be selected,
  where reliable arrival/departure dates exist;
- seasons with meaningful first-team involvement;
- three-season retention.

This captures whether United received a sustained first-team player, but it does
not measure quality by itself.

### Dimension B — role-adjusted football contribution

Candidate measures by broad position:

- forwards / attacking midfielders: goals, goals per appearance, recorded
  assists where covered;
- midfielders: appearances, starts, goals, recorded assists where covered;
- defenders / goalkeepers: appearances, starts, team clean-sheet involvement
  only if match participation and clean-sheet derivation are complete.

Do not compare every position on goals. Do not use historical assists as a
universal axis because coverage is partial.

The first public model may use position primarily as a stratification variable
rather than attempting a fragile all-position contribution score.

### Dimension C — achievement involvement

Candidate measures:

- appearances or starts in trophy-winning seasons;
- appearances in decisive cup matches or title run-ins;
- number and level of major honours during the spell.

This is **involvement in successful teams**, not a causal estimate of individual
impact. A player should not receive equal achievement credit merely for being
registered during a successful season; require a documented participation
threshold.

### Dimension D — longevity

Candidate measures:

- seasons at United;
- appearances across multiple seasons;
- completed-spell length;
- survival to a second and third season.

Longevity is meaningful but can also reflect contract difficulty or failure to
sell. It must not dominate the scorecard.

### Dimension E — financial recovery

Candidate measures:

- known exit fee;
- exit fee as a share of comparable entry cost;
- football-inflation-adjusted gain or loss;
- value recovered after accounting for years of service.

Free exits and unknown exit fees need their own state. Do not treat them as
confirmed zero receipts unless the source explicitly records a free transfer.

### Dimension F — historical significance

Iconic moments, fan attachment, captaincy, and cultural importance are genuine
parts of transfer success but are not safely inferable from the structured
record.

Keep this as an authored layer:

- reviewed defining-night links;
- explicit editorial notes;
- no automated sentiment score.

---

## From scorecard to outcome

### Stage 1 — no composite

Publish exploratory receipts showing the dimensions side by side. Conduct fan
review to learn which dimensions match ordinary United judgments and where the
record produces absurd conclusions.

### Stage 2 — predeclared outcome tiers

If a compact outcome is still useful, define an ordinal target such as:

- did not establish a sustained first-team role;
- established contributor;
- major contributor;
- exceptional United career.

The thresholds must be written before inspecting cost correlations and validated
against a balanced review set across eras, positions, costs, and outcomes.

### Stage 3 — value as performance above expectation

If the outcome model passes validation, define **value** as the difference
between observed outcome and the outcome expected for a signing with comparable
cost and context.

This is preferable to:

> success points ÷ fee

Ratio metrics explode for cheap or free transfers and can make a modest
low-cost squad player outrank an expensive transformative signing for purely
mathematical reasons.

The public "best value" list should therefore be based on positive residuals or
well-explained cost-band comparisons, with uncertainty, rather than a raw
division.

---

## Context variables

### Required or high-priority

- age at signing;
- broad position;
- season and football era;
- manager at signing;
- nominal and relative cost;
- permanent / loan / free status;
- prior Premier League experience;
- prior senior first-team experience, if sourced consistently;
- source league or country;
- repeat United spell;
- current/completed spell;
- squad congestion in the same broad position;
- club performance in the preceding season.

### Desirable but evidence-dependent

- European competition experience;
- international experience;
- selling-club strength;
- contract length;
- injury history before signing;
- wages;
- fee add-ons;
- recruitment decision-maker;
- tactical role fit.

Do not include a variable merely because it would be interesting. Each field
needs a documented source, temporal meaning at the moment of signing, coverage
rate, and redistribution position.

---

## Data audit and model table

Create a derived, reproducible analysis table rather than writing analytical
labels back into canonical transfer JSON.

### Proposed derived row

```text
transfer_id
player_id
spell_id
signing_date
season
manager_id
age_at_signing
position_group
source_club_id
source_country_or_league
prior_pl_experience
fee_gbp
fee_kind
fee_cpi_gbp
fee_football_gbp
fee_pl_percentile
market_value_eur
spell_complete
observation_seasons
apps
starts
goals
assists_recorded
team_matches_in_window
appearance_share
honours_involved
known_exit_fee_gbp
exit_fee_football_gbp
success_dimension_*
coverage_*
```

### Storage rule

- Canonical source facts remain in `data/canonical/`.
- Reproducible derived features belong in SQLite build output or a generated
  analysis fixture.
- Authored review labels belong in a small, versioned manifest with reviewer
  notes and rubric version.
- Model outputs are generated artifacts with a model/version identifier.

### Required audit

For every candidate field record:

- source;
- earliest and latest covered season;
- coverage percentage;
- missingness by era and cost band;
- whether missing means zero, unknown, or not applicable;
- whether active players are censored;
- confidence or precision limits;
- license and redistribution status.

---

## Statistical analysis plan

### Descriptive first

Before modelling, report:

- cohort counts by era, position, fee kind, and completion state;
- fee coverage by era;
- outcome distributions by cost band;
- age distribution by cost band and position;
- missingness patterns;
- completed versus active-spell differences;
- scatter and ordered-strip views with individual deals visible.

If the usable sample is too small or historically biased, stop at descriptive
analysis.

### Candidate models

For an ordinal success target:

- regularised ordinal logistic regression; or
- a Bayesian hierarchical ordinal model when partial pooling by era/position is
  justified and diagnostics can be made reproducible.

For a binary threshold used only as a secondary sensitivity analysis:

- regularised logistic regression.

For time to established contributor or departure:

- exploratory survival analysis, with clear competing-event limitations.

### Functional form

- Model age and relative cost non-linearly where sample size permits.
- Treat position and broad era as core adjustment variables.
- Consider manager/era as a random or grouped effect only if there are enough
  observations per group.
- Limit interactions to predeclared football questions, for example:
  - cost × age;
  - cost × position;
  - prior Premier League experience × age.
- Do not data-mine dozens of interactions and publish the most dramatic.

### Validation

- time-aware holdout where feasible, not random rows alone;
- bootstrap uncertainty for descriptive estimates;
- cross-validation appropriate to the sample size;
- calibration plot for any published probability;
- sensitivity to:
  - success definition;
  - fixed versus completed-spell horizon;
  - nominal versus football-relative cost;
  - active-player exclusion;
  - free-transfer handling;
  - minimum appearance threshold;
  - era boundaries;
  - unknown-fee exclusion.

### Interpretation

Use:

- "associated with";
- "in this United sample";
- "estimated";
- "the interval is wide";
- "the pattern changes by era."

Do not use:

- "caused";
- "proves";
- "guarantees";
- "United should sign";
- a probability without the target, horizon, and cohort.

---

## Analytical public experience

### Default authored question

> Does paying more make a Manchester United transfer more likely to succeed?

The first screen should answer with:

- an observed success rate or outcome distribution by **relative cost band**;
- uncertainty and cohort size;
- one sentence explaining whether the relationship is monotonic, weak, or
  era-dependent;
- the deals behind each band.

### Follow-on lenses

Only after the main result passes:

1. **Best value:** which completed signings most exceeded the outcome expected
   for their relative cost?
2. **Age:** how does the shape change for younger, peak-age, and older signings?
3. **Prior Premier League experience:** is there a detectable difference after
   accounting for era and cost?
4. **Position:** do cost and outcome behave differently across broad roles?
5. **Era:** does the relationship differ before and after major transfer-market
   shifts?

### Controls

At most two public controls:

- broad era;
- position.

Cost band is the primary axis, not another free filter. The default view must
still deliver meaning without interaction.

### Ranking rules

- Completed spells only in the default "best value" ranking.
- Active players appear in a separate ongoing section.
- Show uncertainty or stability band.
- Show the scorecard beneath any compact outcome.
- Allow the reader to inspect all included and excluded deals.
- Publish the rubric and model version.

---

## Analytical research phases

### A0 — Evidence and feasibility audit

**Work**

- Build the candidate cohort table.
- Audit fee, age, position, prior-experience, appearance, honour, and exit
  coverage.
- Quantify known-fee permanent signings by era.
- Identify active and repeated spells.
- Review the PL comparison corpus behind relative cost.
- Decide whether relative cost percentiles are adequately covered.

**Exit gate**

- A coverage matrix exists.
- Missingness is explicit.
- The usable sample supports at least descriptive analysis.
- No success label has been created yet.

### A1 — Success-definition workshop

**Work**

- Draft scorecard dimensions and candidate tier thresholds.
- Assemble a stratified review deck across:
  - eras;
  - positions;
  - low to extreme cost;
  - obvious successes, mixed cases, and obvious disappointments;
  - free transfers and repeat spells.
- Collect judgments from representative United fans.
- Record disagreement and the reasons for it.
- Revise the rubric without looking at model coefficients.

**Exit gate**

- The rubric produces no systematic position or era absurdities in review.
- Disputed cases remain visible rather than forced into false consensus.
- Thresholds and exclusions are versioned before modelling.

### A2 — Reproducible descriptive study

**Work**

- Generate the analysis table from canonical data.
- Produce cohort and missingness tables.
- Plot outcomes against cost, age, position, prior experience, and era.
- Run fixed-horizon and completed-spell views.
- Write a short internal findings note including null and contradictory results.

**Exit gate**

- Every chart can expose its included transfer ids.
- Descriptive conclusions survive the declared sensitivity variants.
- If not, the public output is a scorecard explorer rather than a ranking.

### A3 — Probability model

**Work**

- Fit the simplest adequate regularised or hierarchical model.
- Validate discrimination and calibration.
- Compare against a base-rate-only model.
- Inspect residuals and influential deals.
- Quantify uncertainty by relative cost band.
- Test only predeclared interactions.

**Exit gate**

- The model improves meaningfully on base rates.
- Calibration is acceptable for the published grouping.
- No conclusion depends on one or two famous transfers.
- Limitations are readable in football language.

### A4 — Best-value lens

**Work**

- Calculate observed-versus-expected outcome for completed spells.
- Test rank stability across reasonable success definitions.
- Select a public form: ranked set, tiers, or authored examples.
- Write receipt-level explanations for the leading and counterexample deals.
- Add a clear ongoing-player exclusion lane.

**Exit gate**

- The leading cases are stable enough to defend.
- The output passes fan face-validity review without merely reproducing the
  reviewers' opinions.
- Every ranking row exposes cost, outcome dimensions, expected outcome, and
  evidence.

### A5 — Publication review

**Work**

- Run source, coverage, statistics, copy, accessibility, and mobile review.
- Freeze the analysis dataset and model version used by the page.
- Add tests for canonical exemplar deals and cohort counts.
- Prepare transfer-specific share cards only after the page is approved.

**Exit gate**

- A reviewer can reproduce the cohort and headline finding.
- Search and social copy do not overstate the result.
- Active-player and missing-fee treatment is visible.
- The page links back into the relevant players, seasons, and matches.

---

## Delivery sequence

The experience and analytical tracks should interleave:

| Order | Delivery | Reason |
| --- | --- | --- |
| 1 | Instrument and audit current `/transfers` search landing behavior | Establish the baseline |
| 2 | A0 evidence audit | Learn what analysis is actually possible |
| 3 | Recommendation 1 hub reframe | Improve the proven entry point with low data risk |
| 4 | Recommendation 2 three window exemplars | Establish contextual page grammar |
| 5 | Recommendation 3 transfer receipts | Create the shared evidence object |
| 6 | A1 success-definition workshop | Review real receipts rather than abstractions |
| 7 | Recommendations 5 and 6 manager/current-window lenses | Reuse the new grammar |
| 8 | Recommendation 4 bounded squad-build prototype | Add the distinctive visual layer |
| 9 | A2 descriptive study | Publish internally before modelling |
| 10 | A3–A4 model and best-value lens, only if gates pass | Prevent premature rankings |
| 11 | Recommendation 7 share cards | Share approved receipts and findings |
| 12 | Full season rollout and optional club lenses | Expand only after exemplar validation |

---

## Measurement

### Experience

Use the smallest instrumentation that answers:

- Does the transfer-history landing page send readers to a season, player,
  manager, or match?
- Do window pages lead into receipts and defining nights?
- Which transfer query families land on which canonical routes?
- Do users reach the full evidence ledger?

Search Console measures discovery; Vercel/path analytics and small named events
measure depth. Do not create a general analytics framework.

### Analysis

Measure research quality, not engagement:

- cohort coverage;
- reviewer agreement and disagreement;
- model calibration;
- sensitivity stability;
- percentage of ranking rows with complete cost and outcome evidence;
- reproducibility from canonical data.

---

## Testing and quality gates

### Data and unit tests

- transfer season and manager attribution;
- multiple-spell identity;
- fee-kind semantics;
- CPI and football-inflation adjustment;
- relative cost band assignment;
- active/completed spell classification;
- position grouping;
- success-dimension derivation;
- cohort inclusion/exclusion;
- canonical exemplar receipts.

### Experience tests

- server-rendered metadata and first answer;
- season route generation;
- keyboard order and disclosure;
- no-JavaScript core ledger;
- phone and desktop composition;
- reduced motion;
- OG payloads;
- internal links and canonical URLs.

### Representative fixtures

Include at minimum:

- Eric Cantona — low relative cost, exceptional career;
- Cristiano Ronaldo — high-value arrival and record sale;
- Paul Pogba — repeat spell and free/record-fee/free sequence;
- a goalkeeper;
- a defender;
- a loan;
- a free transfer;
- an undisclosed fee;
- an active current signing;
- a pre-Premier League record with low date/fee precision.

### Repository checks

Run the applicable parts of:

- `npm test`
- `npm run lint`
- `npm run knip`
- `npm run validate`
- `npm run build`
- performance and static-render checks

UI phases require screenshots at the repository-standard phone and desktop
viewports.

---

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Transfers overwhelm the core product | Preserve navigation and homepage hierarchy; treat transfers as an entry route |
| SEO work produces thin pages | Generate only pages with a complete contextual job and minimum evidence |
| Success becomes a hot-take score | Start with dimensions; predeclare rubric; retain receipts and uncertainty |
| Expensive signings are penalised mechanically | Model outcome conditional on relative cost; avoid success/fee ratios |
| Cheap signings dominate value rankings | Use observed-versus-expected outcome and stability checks |
| Position bias | Stratify or adjust by broad position; never use goals universally |
| Era bias | Use relative cost, era adjustment, and fixed-horizon sensitivity |
| Active-player bias | Separate ongoing spells; default rankings to completed spells |
| Unknown fees treated as free | Preserve fee kind and exclude from known-cost modelling |
| Team success mistaken for player impact | Label achievement as involvement and avoid causal language |
| Small United-only sample | Prefer descriptive outputs; regularise models; do not generalise league-wide |
| Historical data gaps | Coverage matrix, era-specific caveats, and suppressed unsupported dimensions |
| Build growth | Exemplar routes first; avoid per-deal static pages; measure route/payload budgets |

---

## Definition of done

The transfer-history supporting feature is complete when:

1. `/transfers` is a clear canonical history landing page.
2. Season/window pages connect deals to squad change and the season that
   followed.
3. Transfer receipts connect transaction facts to a transparent career
   scorecard and evidence trail.
4. The bounded squad-build timeline makes at least one era transition easier to
   understand than a ledger does.
5. Manager, club, and current-window lenses exist only where they offer genuine
