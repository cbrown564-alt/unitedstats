# UnitedStats Design Context

## Design Thesis

UnitedStats should feel like a floodlit match-night ledger: dark, precise, atmospheric, and built for exploration.

The interface should carry subtle Manchester United identity through red accents, pitch-dark surfaces, football vocabulary, and historical tension. It should not imitate official club media. It should not become a generic sports dashboard. Most importantly, it should not become a dry database table site.

The design goal is balanced tension: the product should feel distinctive, but data readability always wins at the point of reading.

## Scene

A stats-heavy United fan is on a laptop or tablet in the evening, half-watching football discourse unfold, chasing a question from memory: "Were late goals actually more common under Ferguson?" The room is dim, the task is exploratory, and the user is willing to follow a trail if the interface keeps the numbers legible and trustworthy.

This scene supports a dark interface, but only if contrast, tables, charts, forms, and focus states remain clear.

## Visual Register

Product UI with atmosphere.

The UI should feel like a serious tool that happens to have a strong sense of place. It should retain familiar web-app affordances: clear navigation, predictable filters, readable tables, standard form controls, visible focus states, and compact link paths.

## Color Strategy

Restrained identity palette.

Use tinted near-black and warm charcoal surfaces, with United red as the primary accent. Gold is a secondary historical or attention color, used sparingly. Result colors are semantic and must never be the only way to understand a result.

> **Result palette: win = United yellow, loss = United red.** This is the current
> encoding. It replaced the earlier red-win / slate-loss pairing (git `fecc1c7`)
> in response to feedback that an all-red record "looks like terrible form": the
> fix spends United's *two* identity colours on the result poles and re-uses
> gold/yellow for success as the app already does for trophies. The change to the
> opposite, slate-blue loss is recorded below for the rationale it carried.

United's two identity colours carry the two result poles, separated from their
neighbours by **lightness** (the channel that survives greyscale and every
colourblindness type): wins are **yellow**, losses are **red**, draws a neutral
grey. The two unavoidable tensions this creates — and how each is compensated:

- **Win-yellow vs honours-gold.** Gold already means trophy / champion / "the
  peak", and that accent constantly shares a surface with win bars. So win is a
  *brighter, lighter* yellow than the deeper honours gold: a win reads yellow,
  silverware the richer gold — a **win → trophy hierarchy**, not a collision.
- **Loss-red vs identity-red.** Red is United's pervasive brand accent (links,
  eyebrows, buttons, selection) and also encodes goals-for in some charts. So
  loss is a *deeper, heavier* red than the hot identity `devil-bright`: bright
  red stays "United / positive / goals / identity", the heavy red reads
  "defeat". Loss must therefore always appear as a bar, badge or shape paired
  with an "L"/label — never as bare red text that could be mistaken for a link.

The interim slate-loss palette retired the older win-green / loss-red pairing
because green/red is the canonical colourblindness failure and red was
overloaded; this palette keeps that colourblindness-safe lightness separation
while accepting red's overload as a deliberate, compensated trade for the
two-colour identity story.

Current implementation palette:

```css
--color-pitch: #0c0b0a;
--color-panel: #161312;
--color-panel-2: #1f1a18;
--color-line: #2c2522;
--color-ink: #f3ede8;
--color-ink-dim: #a89c94;
--color-ink-faint: #6f645d;
--color-devil: #d8210d;
--color-devil-bright: #ff3b1f;
--color-gold: #f5c518;
--color-win: #ffd94a;   /* United yellow: wins (lighter than honours gold, so the two don't merge) */
--color-draw: #9a8d83;  /* neutral mid-grey */
--color-loss: #a52218;  /* deep brick red: losses (darker than identity devil-bright, greyscale-separable) */
```

Future palette work should translate these into OKLCH tokens, keeping the same relationships:

- Pitch: warm near-black, not pure black.
- Panel: one step above pitch.
- Panel 2: active or nested surface, used with restraint.
- Line: visible enough for dense tables on dark surfaces.
- Ink: warm off-white, never pure white.
- Red: primary action, current selection, important link, United identity.
- Gold: rare highlight for attendance, historic note, selected secondary chart, and the trophy/champion accent — kept *deeper* than win-yellow so honours never read as a mere win.
- Win/draw/loss: semantic state, always paired with text, position, or shape. Win is the bright United yellow; loss is the deep United red; draw is neutral grey. Separated from their identity neighbours (honours-gold, identity-red) by *lightness* so the encoding survives colourblindness and greyscale. Loss in particular must stay a bar/badge/shape with an "L"/label, never bare red text.
- A two-series chart must not borrow the win token for mere series-distinction. Reach for gold/silver/europe-blue instead (see `ReliabilityCurve`, where win-rate is gold against the devil-red points-share).

## Identity Rules

Subtle identity, not club mimicry.

Use:

- United red as an accent.
- Match-night darkness.
- Pitch-line or ledger-like textures where quiet.
- Historical labels such as Newton Heath, eras, grounds, competitions.
- Football shorthand when it improves scan speed: W-D-L, H/A/N, FT, HT, AET.

Avoid:

- Official crests or marks.
- Red-and-gold saturation across whole surfaces.
- Chants, memorabilia textures, or heritage props as decoration.
- Betting-app neon, glossy live-score styling, or sports-broadcast spectacle.

## Typography

Current typography uses Archivo for UI and display, plus IBM Plex Mono for tabular numbers. This is a good base.

Rules:

- Keep one main sans family for interface consistency.
- Use the display treatment for page titles, key section headers, and brand text only.
- Do not let uppercase headings dominate dense reading surfaces.
- Use mono numerals for scores, counts, records, dates, percentages, Elo, and pagination.
- Avoid fluid type scales in product surfaces.
- Body and explanatory copy should stay comfortable, roughly 65-75 characters when prose-like.

Prose measure (one convention, two tiers):

- **Lead prose** — hero subtitles, `PageHeader` subtitles, page/section intros, body explanation, match notes — wraps at `max-w-2xl`.
- **Fine print** — slice/coverage notes (`CoverageNote`), footnotes, the site footer — wraps at `max-w-xl`.
- These are the only two measures for running prose. Do not introduce `max-w-xl`/`max-w-3xl`/full-width one-offs for a paragraph; reach for the matching tier. Page *titles* (`h1`/`.display`) keep their own `max-w-3xl` and are not prose. `max-w-2xl`/`max-w-3xl` on grids and cards are layout, not prose, and are unaffected.

Current caution:

The `.display` class uses negative letter spacing and all-caps. It creates character, but can become noisy in dense panels. Future work should consider a less compressed variant for secondary headings and table-adjacent labels.

## Density

Adaptive medium density.

Use compact layouts where users scan records:

- Match lists.
- Player tables.
- Opponent and manager indexes.
- Filter rows.
- W-D-L summaries.

Use more breathing room where users interpret patterns:

- Myth-testing modules.
- Analytics explanations.
- Chart panels.
- Data coverage notes.
- First screen exploration prompts.

Do not make the whole product spacious. The audience likes density. Do not make the whole product compact either. Pattern discovery needs enough room to breathe.

## Layout Principles

The fixture record is the spine, so layouts should make evidence trails obvious.

Patterns:

- Page header: identity, scope, key summary, then routes into evidence.
- Detail page: lead with the computed answer as an object, then context, then the auditable record as appendix.
- Analytics page: one question per module, with chart, interpretation, coverage, and link to underlying matches where possible.
- Index pages: an authored hero that depicts the whole subject, over a compact list or table with enough metadata to choose the next drill-down.

Front-door surfaces want an authored hero. The home page, the section indexes (players,
managers, opponents, seasons), and the analytics and data landings each lead with a single
bold, bespoke object that depicts the whole of their subject at once — the entire match
history as a breathing wall (`HistorySkyline`), 135 years of league finishes
(`FinishTimeline`), the succession as one match-proportional bar (`ManagerTimeline`),
coverage as a facet × decade heatmap (`CoverageMatrix`). The body below then *quotes* the
existing answer-object vocabulary; the hero is the part you author. This is the one place a
generic metric grid is most tempting and most wrong — a front door is the surface that most
needs an object no quoted component can provide. The older "index pages are compact lists"
guidance still holds for the list, now demoted to the supporting detail beneath the hero.

Cards:

- Use cards for repeated items, chart panels, and framed tools.
- Avoid nested cards.
- Do not put every section into a card by default.
- Prefer table/list rhythm for records, not identical decorative card grids.

## Composition Principles

These principles were distilled from the match-detail redesign (June 2026) but apply
across the product. They favour a few dense, self-explanatory objects over stacks of
labelled panels.

**One element per fact.** If two elements derive from the same underlying events, they
are one element. The match page had a goal timeline and a score ribbon that were two
views of the same timed goals; they became a single `MatchFlow` bar. The header score
and Elo rating row were de-duplicated the same way. Before adding a panel, check whether
an existing one already carries the same data.

**Encode meaning in the object, not a legend.** Prefer colour, position, and shape over
captions and keys. `MatchFlow` colours the bar by United's lead — red ahead, neutral grey
at level, near-black behind, deepening with the margin — so the shape of the result reads
at a glance with no numbers. This extends the color-semantic rule from Charts: encoding is
fine when it is intrinsic to the object and still text-backed on inspection.

**Position carries category.** Use spatial placement to distinguish groups instead of a
legend. `MatchFlow` puts United scorers above the bar and opponent scorers below; the side
is the team. Labels only stagger into a second lane when same-side events cluster in time,
because opposite sides can never collide.

**Events live on the object they belong to.** Put a fact where the reader would look for
it. Goals, assists, and bookings render onto the player shirts on the teamsheet pitch (a
football for a scorer, a boot for an assister, a card marker for a booking) rather than in
stacked boxes below. The bench sits beside the pitch, unused subs drained of shirt colour.

**Share one content column.** Sibling sections should align to the same width. The venue
strip, Elo bar, and timeline span the content column together rather than floating at mixed
`max-w` values. Fixture meta splits into aligned sub-columns. Use a fixed-column grid for
anything that must never wrap, such as the scoreboard score.

**Responsive by swapping content, not scrolling.** Long labels swap tier by viewport
rather than forcing horizontal scroll: hero team names render as full name → broadcast
short → 3-letter code (`lib/clubNames.ts`), with `min-w-0` grid cells and the full name
preserved in the tooltip.

**Subtract aggressively.** Delete context that does not earn its place. The redesign
removed two whole components and a "late goals that season" section outright. Fewer, denser
objects beat more, thinner ones.

The principles above came from the match-detail redesign; the four below were distilled from
the page-by-page refresh that carried it across every surface (mid-2026). See
`docs/DESIGN-REFRESH.md` for the per-surface working.

**Lead with the computed answer; keep the raw ledger as an auditable appendix.** A detail or
index list should resolve into the reader's intent, not present a ledger ordered by recency.
Readers arrive to verify a record, see the notable cases, locate a remembered item, or feel
the shape over time — reverse-chron pagination serves almost none of these. So the strongest
surfaces lead with a curated answer-object computed from signals the page already owns
(`NotableMatches`, `HaulCards`, `RecordCards`, `Leaderboard`), put the shape next
(`ResultSpine`, `ContributionSpine`), and keep the complete record as the last, auditable
section (`MatchArchive`, the sortable register). Filters are not the answer: they make the
reader discover what is notable when the page already knows.

**Render only the facets the data can fill.** Let coverage shape the layout. A module's
secondary readouts, facet columns, and sub-lanes should appear only when their number means
something — no "—" filler cells, no fixed grid of mostly-empty tiles. An honest page about
partial data grows and shrinks with the evidence (per-card gating on `RunCallouts` and
`NotableMatches`, the single-spine `CupRun` that asserts only United's side, volume gates on
every spine). This is the slice/coverage contract expressed in the layout itself — "Subtract
aggressively" applied per-facet, not just per-module.

**Encode the baseline into the geometry.** When the finding is "X beats the normal rate",
draw the normal rate *as a line through the visual* so clearing it is literally visible
rather than asserted in prose: the perfect-forecast diagonal in `ReliabilityCurve`, the
break-even line through `OpponentRivalryMap`, the centre fulcrum of a diverging `WdlBar`. The
corollary, learned the hard way: the only honest baseline for a split is break-even (does it
win more than it loses?), because a subject's deviation from its *own* average can only ever
redraw the same shape — home > away is league-wide physics, true of every manager. A visual
that draws the same shape regardless of subject is decoration, not analysis; kill it even
when it is pretty.

## Charts And Data Visualization

Charts should make patterns readable before they look impressive.

The Chart System includes three layers:

- Chart primitives: the reusable chart types and static SVG fallbacks.
- Interactive chart layer: Recharts-based client-side inspection for direct reading support.
- Chart frame: title, legend, value callouts, slice, coverage, and evidence trail.

Inspectable chart data should carry reader-facing context, not only coordinates. Time-series
data should include `x` and `y` for plotting, `label` for the human-readable x value,
`valueLabel` for the formatted value, optional `meta` for one short contextual line, and
optional `href` when the datum maps cleanly to evidence. Bar data should follow the same
reader-facing contract with `label`, `value`, `valueLabel`, and optional `meta` or `href`.

Use:

- Line and area charts for time series, especially Elo and seasonal trends.
- Bars for comparison, distribution, and records.
- Ordered tables when exact values matter.
- Small multiples only when labels and scale remain clear.
- Coverage notes near any chart whose interpretation depends on partial data.
- Inspection interactions for dense or meaningful charts where exact values matter.
- Hybrid render for any labelled chart: shape in SVG, labels in HTML (see below).

Avoid:

- Pie, donut, gauge, radar, 3D, and decorative chart forms.
- Color-only encoding.
- Overloaded dashboards where every chart competes equally.
- Unlabeled axes or unlabeled time ranges when the reader must compare eras.

**Draw the shape in SVG, the labels in HTML.** A chart whose SVG has a wide `viewBox`
shrinks its own text into illegibility at narrow container widths — a `fontSize="10"` label
on a 1000-unit viewBox renders at roughly 5px in a 560px column. So a labelled chart should
draw *shape only* in the SVG (ridges, bars, lines, hover targets), stretching to fill a fixed
box (`preserveAspectRatio="none"` with `vectorEffect="non-scaling-stroke"` so strokes stay
crisp at any width), while every label is real HTML positioned by percentage and rendered at
true rem sizes. When the chart is purely dots-and-labels (scatters, heatmaps), drop the SVG
entirely and position everything in HTML — a non-uniformly scaled SVG squashes round dots and
portraits into ellipses. This is already the render for `MinuteRidge`, `HistorySkyline`,
`FinishTimeline`, `CoverageMatrix`, the index scatters, and the career sparklines; it is the
default for any new labelled chart, not a per-surface trick.

Research rationale: NN/g recommends length and 2D position for quick quantitative interpretation, and treats color as a supporting cue rather than a primary magnitude encoding: https://www.nngroup.com/articles/dashboards-preattentive/

## Components

Core components should feel consistent across pages:

- Match list rows: compact, linked, score-forward, with opponent, date, competition, and result.
- Result badge: small, stable, text-backed state.
- W-D-L bar: compact distribution cue, never the only record.
- Stat panel: used for primary summary only, not as decoration.
- Filter controls: standard inputs and selects, clear focus, compact spacing.
- Tables: dense, sortable when needed, numeric columns right-aligned.
- Coverage note: short, low-noise, placed at interpretation points.
- Pattern prompt: a linked question or trail, not a marketing tile.
- Floodlit plate: the shared hero atmosphere — the `hero-grid` pitch-line texture, a single red floodlight wash, deep shadow — worn by the `IdentityPlate` family and every front-door hero (`HistorySkyline`, `EloHero`, the index heroes, `CoverageMatrix`). A reusable motif, defined in `app/globals.css`, not a one-off.

Every interactive control should have visible hover and focus states. Links should remain visibly links through color, underline on hover, or placement conventions.

## Guided Prompt Design

Guided prompts should feel like curious trails.

Good pattern prompt structure:

- Ask a concrete question.
- Show one supporting signal or short reason.
- Link to the evidence set.
- Include coverage if the prompt depends on partial scorer, minute, assist, or lineup data.

Examples:

- "Were late goals really an era trait?"
- "Which opponents stayed awkward away from home?"
- "Did European weeks change league form?"
- "Where did this manager's record bend: home, away, or cups?"

Avoid:

- "Discover insights" generic copy.
- Hot-take labels.
- Claims that do not expose their fixture set.

## Trust And Coverage UI

Coverage appears at decision points.

Show trust context when a user is about to interpret:

- Player goal totals: recorded goal-event coverage.
- Appearance totals: lineup coverage.
- Goal-minute charts: number of goals with recorded minutes.
- Assist partnerships: assist coverage.
- Myth-testing: coverage and slice definition.
- Records: competition scope, official vs unofficial, date range if relevant.

Keep notes short in the main flow. Deeper methodology belongs on supporting pages or expandable details.

## Homepage Direction

The homepage should start exploration immediately.

Priority order:

- Curiosity prompts and hybrid search.
- Latest or recently changed evidence.
- A few high-signal summaries that explain the archive's scope.
- Routes into matches, seasons, players, managers, opponents, analytics.

Avoid leading with a generic hero-metric block (Matches / Wins / Goals tiles). A scope statement is useful, but the first interaction should be a trail — and the hero itself should be an authored, bespoke object that depicts the whole archive (see Layout Principles, front-door surfaces), not a metric grid. The `HistorySkyline` plate is the canonical example: it carries the atmosphere a search box alone could not, and the body below quotes the answer-objects.

## Navigation

Top-level navigation should stay predictable:

- Matches
- Seasons
- Players
- Managers
- Opponents
- Analytics

Future additions can include:

- Search
- Questions or Trails
- Data / Sources

Do not hide canonical sections behind novelty navigation. Exploration depends on users trusting where they are.

## Motion

Motion should be quiet and state-based.

Use:

- 150-250 ms transitions.
- Color, opacity, and transform transitions for hover/reveal.
- Chart highlight or row focus when a user interacts.

Avoid:

- Decorative page-load choreography.
- Bounce or elastic easing.
- Motion that delays reading.

## Copy Voice

Curious guide, not pundit. The finalized copy direction is **Floodlit Guide**: refine the
existing voice rather than pivot — precise about the record, romantic only about its reach,
and silent where a number speaks for itself. The full working — the per-surface register map,
worked rewrites, and the process for the copy pass — lives in `docs/COPY-VOICE.md`. This
section is the canonical short form.

Voice traits:

- Precise.
- A little romantic about football history.
- Transparent about coverage.
- Confident in structure, cautious in claims.

One voice is wrong; assign a register per surface (full map in `docs/COPY-VOICE.md`):

- **Authored heroes** — Floodlit Guide: one true, evocative line, earned from place and span,
  never hype. ("A century and a half of business, in and out"; "managers, two cathedrals".)
- **Questions / myths** — Knowing Companion: dry wit allowed, a point of view about the
  *question* but never the *answer*. ("Do United really score late?")
- **Records** — Opta framing: scope, reach, and comparison do the work; no adjectives.
- **Result reporting** (scorelines, W-D-L, tables) — Instrument: neutral labels; the objects
  carry the meaning.
- **Coverage / slices / labels / hints** — Archivist: clinical, exact, no romance, no filler.
  Absence of voice *is* the trust signal.

**Wit is quarantined.** Personality and any point of view appear only on heroes and
questions/myths. They never touch a scoreline, a record, a win-rate, or a coverage note —
our credibility is that the numbers are not spun.

Good:

- "There is a signal here, but it changes by era."
- "Recorded goal minutes show the late surge most clearly after..."
- "Result data is complete; lineup coverage is still growing."

Avoid:

- "Ultimate", "definitive", "insane", "unbelievable", and the rest of the hype lexicon.
- Restating headings or visible figures in body copy.
- Verdict-heavy claims where coverage is partial.
- Wit or adjectives anywhere near a result, record, or coverage note.
- List-shaped or instruction-shaped hints ("Elo, eras, records") where a specific,
  record-anchored line would say what the reader will actually find.

Punctuation convention: the **spaced em dash** ` — ` is the house connective break and is
load-bearing in the best sentences — use it, sparingly. Ranges take an **unspaced en dash**
(`1886–87`, `2022–24`). Never an unspaced em dash mid-word. (This supersedes the earlier
"avoid em dashes" guidance, which contradicted the live copy.)

## Accessibility And Readability

Data readability wins.

Rules:

- Maintain strong text contrast on dark surfaces.
- Do not use color alone for W/D/L or chart categories.
- Keep focus states visible against pitch and panel surfaces.
- Preserve numeric alignment for tables.
- Ensure compact rows still have adequate tap targets on mobile.
- Keep labels visible where a chart needs interpretation.

## Implementation Alignment

Current code already establishes useful conventions:

- `app/globals.css` defines the dark match-night palette and typography.
- `components/MatchList.tsx` provides the canonical compact match row.
- `components/WdlBar.tsx` and `components/ResultBadge.tsx` provide reusable record/state vocabulary.
- `components/charts.tsx` contains the existing server-rendered SVG charts and should evolve into shared chart types plus static fallbacks.
- `/analytics` includes a data-depth ledger, which should become a core trust pattern.
- Player and match pages already include coverage caveats in the flow.

Future UI work should formalize these conventions into reusable components before inventing new one-off surfaces.

But generalise the *pattern*, not the component. Share an object only when the subject's unit
of meaning is identical — win rate for a manager, an opponent, and a season all flow through
one `IdentityPlate` via a `headline` override — and keep it bespoke when that unit changes: a
player's goals-led `PlayerPlate`, a record card whose figure is an attendance or a goal tally
(`RecordCards`), `ManagerSparkbar` versus `CareerSparkline`. Forcing a shared component to
almost-fit a different unit of meaning is worse than an honest one-off. The durable thing is
usually the intent — answer → figure → evidence — not the markup.

Chart System implementation should keep `components/charts.tsx` as the shared primitive/type layer and static fallback home, add Recharts-based client-side inspection components beside it, and evolve `components/ChartPanel.tsx` as the reusable server-compatible frame for legends, value callouts, coverage, and evidence links. The first inspection target should be the Elo rating chart on `/analytics`, followed by homepage Elo and season trend charts after the API settles. See `docs/adr/0001-use-recharts-for-interactive-chart-inspection.md` for the dependency decision.

Page code should import UnitedStats chart components, not Recharts primitives directly. Recharts is the rendering engine behind the Interactive Chart Layer; UnitedStats components own the visual language, tooltip behavior, evidence affordances, color semantics, and data contracts.

The first interactive components are `InspectableTimeSeriesChart`, `InspectableBarChart`, and `EloRatingChart`. `InspectableTimeSeriesChart` is the reusable Recharts-backed line/area primitive with Quiet Analyst Tooltip, baseline, axes, highlights, and responsive behavior. `InspectableBarChart` is the reusable Recharts-backed bar primitive for comparisons, distributions, and records. `EloRatingChart` is the domain wrapper that formats Elo labels, applies the 1500 baseline, and carries peak, trough, and current rating context.

When an inspectable bar datum has a real evidence URL, the bar may navigate to that evidence route
and the Quiet Analyst Tooltip should say so. Do not add chart links unless the datum maps cleanly
to a season, match set, player, opponent, manager, or source-backed evidence page.

For Elo inspection, the Quiet Analyst Tooltip should show a reader-facing date or season label,
the formatted rating, and the movement from the previous point when available. If a chart datum
also maps to a fixture, the tooltip may add opponent/result context and an evidence affordance,
but the first pass can stay with date, rating, and movement while the query contract is extended.

Migration should be incremental. Keep `AreaChart`, `Bars`, and `Sparkline` intact as static
fallbacks and migration scaffolding while Recharts-backed components are introduced. The
homepage, analytics, questions, odds, travel, and player chart modules now use the interactive
layer where inspection improves reading. Revisit whether static primitives should be retired
after the interactive coverage is broad enough; `Sparkline` may remain useful as a tiny no-JS
primitive for dense tables.
