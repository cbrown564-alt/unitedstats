# UnitedStats Visual Audit

Browser review date: 2026-06-12

Scope: in-app Browser pass over desktop default viewport and mobile 390 x 844. Reviewed top-level pages, analytics subpages, and representative detail pages:

- `/`
- `/questions`
- `/matches`
- `/seasons`
- `/players`
- `/managers`
- `/opponents`
- `/analytics`
- `/analytics/odds`
- `/analytics/travel`
- `/data`
- `/match/2026-05-17-nottingham-forest-h`
- `/seasons/2024-25`
- `/player/wayne-rooney`
- `/manager/alex-ferguson`
- `/opponent/liverpool`

The current app has a good base: clear dark identity, compact data components, strong typography, and believable subject matter. The biggest gap is not feature completeness. It is visual system discipline: uneven spacing, repeated card/table treatments, weak mobile navigation, under-designed controls, and too many pages that become long stacks without section rhythm.

## Global Findings

### G-01. Mobile header exposes a raw horizontal scrollbar

Severity: high

Evidence: every mobile route shows the top nav clipped after `Seasons`, with a visible browser scrollbar under the nav. Links from `Players` onward sit off-screen without an affordance or active-route indicator.

Impact: the first persistent UI element looks unfinished, and users may not discover half the app.

Suggested direction: replace mobile header with a compact nav pattern: segmented horizontal tabs with hidden scrollbar styling and fade edges, or a menu button plus primary section tabs. Add active state on all breakpoints.

### G-02. No active navigation state

Severity: medium

Evidence: desktop and mobile nav links have hover styling but no current-route treatment. On dense pages the user has no stable location marker.

Impact: route-to-route exploration feels less grounded, especially across `Analytics`, `Odds`, and `Travel`.

Suggested direction: use pathname-aware nav styling. Current section should be brighter, accented, or underlined.

### G-03. Page rhythm is inconsistent

Severity: high

Evidence: pages alternate between large empty dark space, tight forms, large cards, and dense tables with little shared spacing logic. `/analytics` uses `space-y-12`, `/matches` uses `space-y-6`, `/questions` stacks large modules, and indexes often start dense lists immediately below short headers.

Impact: the app feels assembled route by route instead of designed as one product.

Suggested direction: define page shell primitives: page header, intro deck, toolbar, section band, dense list, chart panel, stats strip. Reuse spacing tokens across routes.

### G-04. Card language is overused and visually flat

Severity: high

Evidence: desktop DOM counts show hundreds of panel/card-like surfaces on `/seasons` and `/players`; many repeated items share the same border, radius, background, padding, and hover. The result is a wall of identical panels.

Impact: visual hierarchy collapses. Important modules and simple rows compete for the same weight.

Suggested direction: reserve cards for framed modules and repeated feature items. Use table/list rhythm for records, section dividers for eras, and lighter row treatments for dense archive content.

### G-05. Tiny muted text is doing too much work

Severity: medium

Evidence: captions, percentages, labels, coverage text, and supporting metadata often use `text-xs text-ink-faint`. On dark panels this can fall below comfortable reading contrast, especially in `/data` table percentages and chart notes.

Impact: trust/coverage information exists but is visually de-emphasized at exactly the points where it matters.

Suggested direction: raise contrast for data caveats, use fewer all-caps micro-labels, and distinguish captions from secondary metrics with layout instead of only smaller text.

### G-06. The app lacks visual assets or subject-specific imagery

Severity: medium

Evidence: the product relies entirely on typography, dark panels, SVG charts, and simple grid texture. The design thesis calls for atmosphere and historical tension, but most pages feel like a generic dark stats app.

Impact: visual quality plateaus despite solid data. The United/history context is present in copy, not in the interface texture.

Suggested direction: introduce restrained, data-relevant visual assets: stadium map snippets, historical timeline bands, competition color chips, trophy/era glyph system, or photo-like generated/curated atmospheric headers used sparingly.

### G-07. Focus and hover treatments are uneven

Severity: medium

Evidence: some links use hover underline, some use hover color, some panels use hover border, form inputs vary between `focus:border-devil` and `focus:outline-2`.

Impact: interactivity feels inconsistent and keyboard affordance is not reliably visible.

Suggested direction: establish component-level focus styles for nav, links, row links, cards, inputs, selects, and buttons.

### G-08. Match row composition repeats text in the accessibility tree and feels cramped on mobile

Severity: medium

Evidence: mobile route metrics show rows reading like `24 May 2026W@Brighton...24 May 20263-0...`; visually, the row is compact and usable, but date/opponent/score alignment gets tight with long opponent names.

Impact: rows remain functional but can feel like a compressed feed rather than a polished fixture component.

Suggested direction: refine `MatchList` with stronger columns, date stack, score block, and optional metadata row. Consider a mobile-specific row layout with fewer competing text anchors.

## Page Findings

### `/` Home

Severity: medium-high

Findings:

- Desktop hero is strongly left-weighted, leaving a large empty right side with only faint grid texture.
- Search is the intended first interaction but is visually subdued compared with the huge headline and stat strip.
- The hero stat strip is solid, but it lands low and the transition into `Test a myth` feels abrupt.
- On mobile, the stat strip is not visible in the first viewport; the page jumps from search hint into `Test a myth`, weakening the scope claim.
- The same card treatment is used for myth prompts, route prompts, fullest match sheets, and top scorers, flattening hierarchy.

Suggested direction: make search and curiosity prompts the first-class hero object. Reduce H1 dominance, add a right-side live evidence/fixture/timeline panel on desktop, and vary repeated cards by purpose.

### `/questions`

Severity: high

Findings:

- The concept is strong, but each module is a large bordered card with similar structure. Six modules become a long monotone stack.
- Charts, tables, match lists, evidence links, slice notes, and coverage notes all live inside the same visual frame with weak hierarchy.
- On mobile, modules become very tall. The first question consumes much of the journey before the user understands the set of available questions.
- The page lacks an in-page question index or sticky anchor trail, despite using section IDs.
- Some tables use `overflow-x-auto`, which avoids breaking layout but does not feel intentionally designed on mobile.

Suggested direction: add a question index/rail at top, turn each module into a more editorial evidence block, and separate "finding", "chart", "evidence", and "coverage" visually.

### `/matches`

Severity: high

Findings:

- Filter controls wrap unevenly on desktop and mobile. Desktop puts most controls in one long row, then drops `to` and `Filter` to a second row at 1280 width.
- Mobile filters form a jagged set of different widths with no labels. The button sits beside `To year`, giving the toolbar an accidental layout.
- Controls use default select rendering and do not feel like polished product controls.
- The page jumps directly from filters to a long match list with no summary chips, applied filters, or visual grouping.
- Pagination is plain text links and does not match the rest of the app's component language.

Suggested direction: redesign filter toolbar as a responsive grid with labels or compact chips. Add applied filter summary, reset action, and stronger pagination controls.

### `/seasons`

Severity: high

Findings:

- Desktop renders 126 campaign cards in decade sections. The grid is readable, but visually repetitive and very long.
- Mobile page height is extreme. The same card shape repeats for every season, making scanning slow.
- Decade summaries are useful but understated. They do not anchor the huge list strongly enough.
- Cup badges inside season cards create uneven heights and busy micro-text.
- The trophy emoji in league positions clashes with the otherwise restrained visual system.

Suggested direction: make decade sections stronger and more compact. Consider a timeline/list hybrid with one row per season, expanded detail on hover/click, and a consistent non-emoji honors marker.

### `/players`

Severity: high

Findings:

- A 981-row table starts immediately after the intro. There is no search, filter, grouping, or scannable summary.
- Mobile hides starts, assists, and span, leaving `Apps` and `Goals` but no indication that the hidden context exists.
- Table row density is acceptable, but the page feels like a raw database export.
- Header text and coverage link run together on mobile: `matches.Coverage details`.
- The table lacks sticky headers or section anchors for a very long scroll.

Suggested direction: add player search, era/position/coverage filters if available, sticky table header, and a richer top scorer/record summary before the full table.

### `/managers`

Severity: medium

Findings:

- The list is more successful than players/opponents because it is short and each row has a meaningful WDL bar.
- Rows still share the same generic panel treatment as many other lists.
- On mobile, manager name, tenure, role, WDL bar, and record stack clearly, but repeated green/red bars become visually loud.
- The intro copy is charming but unsupported by any visual grouping for eras or roles.

Suggested direction: group by era or role, reduce repeated card weight, and give long-tenure managers slightly more visual prominence.

### `/opponents`

Severity: high

Findings:

- The page is a 237-item list with no search or grouping, despite being a natural lookup page.
- Desktop WDL bars help, but mobile hides them, leaving a plain long list of names and small record text.
- The most-played order is useful but there is no way to browse by competition, country, bogey teams, recent opponents, or alphabet.
- Repetition and page length make it feel less polished than the data deserves.

Suggested direction: add search and segmented grouping: most played, alphabet, country/region, current league, bogey sides. Preserve WDL cues on mobile in a smaller form.

### `/analytics`

Severity: high

Findings:

- The opening chart is visually strong but framed as a heavy full-width card after a sparse header. The header leaves unused desktop space.
- Chart labels are minimal and low-contrast. It is hard to read exact values or understand scale without captions.
- The page stacks many chart panels with similar borders/padding. Individual insights do not get enough hierarchy.
- Deep-link cards for Odds and Travel look like ordinary cards, not high-value analytics tools.
- Mobile first viewport shows the chart area and note but not much interpretation. The page feels like a chart dump before it feels like an analytical story.

Suggested direction: create an analytics overview with 3-4 hero insights, stronger chart headers, value callouts, and a consistent chart panel component with visible legends/axis support.

### `/analytics/odds`

Severity: high

Findings:

- The form is functional but plain. On mobile, `Opponent`, `Venue`, and `Work it out` stack in uneven positions.
- The opponent select is a huge native dropdown with hundreds of options. Browser text extraction confirms it is effectively a giant unstructured list.
- The probability cards are useful but visually small relative to the conceptual weight of the page.
- Calibration table overflows slightly on mobile: table right edge measured beyond the 375 px viewport.
- The page needs clearer language separating "rating signal" from betting odds, visually as well as in copy.

Suggested direction: replace opponent select with searchable combobox, make the probability result the hero component, and redesign calibration as mobile cards or a horizontally intentional table.

### `/analytics/travel`

Severity: medium-high

Findings:

- The page concept is strong and distinct, but first viewport is text-heavy before the map/geo payoff appears.
- Mobile copy has a visible spacing issue: `2,926official`.
- Charts and maps sit in the same generic panel treatment as other analytics.
- The geographic maps need stronger visual polish: map frame, labels, legend, and affordance explaining dot size/color.
- Longest trips table follows the same DataTable styling and could be more evocative.

Suggested direction: make the map the first visual hero, add metric chips for total miles/grounds/continents, fix copy spacing, and improve map legends.

### `/data`

Severity: high

Findings:

- The top stat strip is strong, but the following desktop grid squeezes a wide coverage table beside a correction contract card.
- Coverage percentages are low-contrast and small.
- On mobile, the page becomes very long because many sections use card grids and tables without progressive disclosure.
- `Correction contract` is important operational content but appears as an aside competing with the coverage table.
- API and dataset download cards repeat the same visual pattern and lack distinct grouping.

Suggested direction: split coverage and correction into separate full-width sections, improve table contrast, and turn API/downloads into compact endpoint/download lists with clearer hierarchy.

### `/match/[id]`

Severity: medium-high

Findings:

- The page contains a lot of valuable match-sheet detail, but the first viewport is dominated by stacked text and goal sections rather than a polished match header.
- Mobile H1 wraps acceptably, but score, opponent, date, half-time, and competition do not feel like a designed match summary block.
- Event lists, cards, lineups, source trail, and context modules all share similar section headers.
- The detail page title metadata appears generic in browser title for sampled match.

Suggested direction: build a dedicated match header component with teams, score, venue, date, competition, result badge, and quick facts. Then use tabs or grouped sections for Goals, Lineups, Sources, and Context.

### `/seasons/[season]`

Severity: medium-high

Findings:

- Season navigation links at top are useful but visually plain.
- `Season in brief` is one of the better content ideas, but it appears as a small card-like text block instead of a designed narrative summary.
- Long competition match lists repeat the same component rhythm as everywhere else.
- Mobile page is long and would benefit from a competition jump list.

Suggested direction: make season pages feel like campaign dossiers: summary strip, league finish, manager timeline, top scorers, competition tabs, and match evidence.

### `/player/[id]`

Severity: high

Findings:

- Player detail pages are very long. Sampled `/player/wayne-rooney` measured over 16,000 px tall on mobile.
- First viewport shows name and caveat, then immediately chart sections. There is no compact career identity block, rank, record, era span, or hero stat treatment.
- Goals by season, appearances by season, goals by competition, scoring run, minute distribution, matches scored in, lineup appearances, and assist partnerships become a long sequence with similar styling.
- The page inherits the global issue where coverage caveats are visually small compared with the claims.

Suggested direction: introduce a player profile header with core stats/ranks, then organize analysis into tabs or grouped panels. Keep coverage caveats attached to the relevant stat.

### `/manager/[id]`

Severity: medium

Findings:

- Sampled `/manager/alex-ferguson` is one of the stronger pages. The stat grid and WDL bar are clear.
- Mobile still suffers from the header scrollbar and generic section rhythm.
- `Where the record bends` is promising but could be more visual and less repetitive.
- First ten matches list starts abruptly after summary sections.

Suggested direction: keep the stat-led header, add era/tenure context, and make venue/competition splits a designed comparison module.

### `/opponent/[id]`

Severity: medium-high

Findings:

- Head-to-head pages have good content, but the first viewport is text/card heavy.
- Home/Away/Neutral split is useful yet visually plain.
- `If they met tomorrow` links analytics into the page, but it does not look like a distinctive predictive widget.
- All meetings list repeats the same match-row pattern and dominates the lower page.

Suggested direction: create a head-to-head summary component with record, streaks, recent meetings, and a compact predictive card.

## Recommended Fix Order

1. Fix global mobile header, active nav, focus states, and shared spacing scale.
2. Redesign `/matches` filters and `MatchList`, since they appear across the product.
3. Redesign index pages: `/players`, `/opponents`, `/seasons`.
4. Redesign analytics panel system and chart labels.
5. Polish detail headers for match, player, season, manager, and opponent pages.
6. Revisit `/questions` as an editorial evidence experience after shared components improve.

## Browser Notes

- Desktop default viewport did not show broad document-level horizontal overflow.
- Mobile document width remained 375 px, but nav items and one odds table visibly extend inside scrollable/clipped regions.
- Development server was already active on `http://localhost:3000`.
- No app source code was changed as part of this audit.
