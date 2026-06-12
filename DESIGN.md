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

Use tinted near-black and warm charcoal surfaces, with United red as the primary accent. Gold is a secondary historical or attention color, used sparingly. Green/draw/red result colors should remain semantic and should not be the only way to understand a result.

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
--color-win: #3ecf6a;
--color-draw: #b9aa9f;
--color-loss: #e34234;
```

Future palette work should translate these into OKLCH tokens, keeping the same relationships:

- Pitch: warm near-black, not pure black.
- Panel: one step above pitch.
- Panel 2: active or nested surface, used with restraint.
- Line: visible enough for dense tables on dark surfaces.
- Ink: warm off-white, never pure white.
- Red: primary action, current selection, important link, United identity.
- Gold: rare highlight for attendance, historic note, or selected secondary chart.
- Win/draw/loss: semantic state, always paired with text, position, or shape.

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
- Detail page: primary fact first, then context, then pattern trails.
- Analytics page: one question per module, with chart, interpretation, coverage, and link to underlying matches where possible.
- Index pages: compact lists or tables with enough metadata to choose the next drill-down.

Cards:

- Use cards for repeated items, chart panels, and framed tools.
- Avoid nested cards.
- Do not put every section into a card by default.
- Prefer table/list rhythm for records, not identical decorative card grids.

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

Avoid:

- Pie, donut, gauge, radar, 3D, and decorative chart forms.
- Color-only encoding.
- Overloaded dashboards where every chart competes equally.
- Unlabeled axes or unlabeled time ranges when the reader must compare eras.

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

Avoid leading with a generic hero-metric block. A scope statement is useful, but the first interaction should be a trail.

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

Curious guide, not pundit.

Voice traits:

- Precise.
- A little romantic about football history.
- Transparent about coverage.
- Confident in structure, cautious in claims.

Good:

- "There is a signal here, but it changes by era."
- "Recorded goal minutes show the late surge most clearly after..."
- "Result data is complete; lineup coverage is still growing."

Avoid:

- "Ultimate", "definitive", "insane", "unbelievable".
- Restating headings in body copy.
- Verdict-heavy claims where coverage is partial.
- Em dashes in product copy.

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
