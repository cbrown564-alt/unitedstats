# UnitedStats Mobile UI Review

Captured with a 390 x 844 mobile viewport on the local Next dev server.

Screenshots live in this folder as `*-viewport.png` and `*-full.png`. Automated route audit lives in `audit.json`.

## Review Blocker

The current dev server hits a build error after compiling `app/match/[id]/page.tsx`:

- `app/match/[id]/page.tsx:455:1` unexpected token
- Later log also reports `app/match/[id]/page.tsx:357:9` expression expected

This caused `/opponents`, `/opponent/arsenal`, `/analytics`, and `/data` screenshots in this run to show the Next error overlay rather than the real pages. Earlier visual screenshots from the preceding pass still inform the comments, but a clean rerun is needed after the syntax issue is fixed.

## Global Mobile Notes

### 1. Mobile Navigation Is Too Narrow

The header only visibly exposes `Questions`, `Matches`, and search at 390px. The remaining primary routes are technically off to the right in the nav strip, but there is no strong affordance that the header is horizontally scrollable.

Improvement:

- Use a clearer mobile nav model: a compact menu button, a horizontally scrollable tab rail with edge fade, or a two-row route drawer.
- Keep search prominent, but do not make search the only obvious path to `Seasons`, `Players`, `Managers`, `Opponents`, `Analytics`, and `Data`.

### 2. Flagship Visual Labels Need Mobile-Specific Rules

Several of the strongest bespoke objects lose polish because labels collide or crowd:

- Home `HistorySkyline`: earliest x-axis labels overlap (`1886` / `1900`).
- Match detail `MatchFlow`: clustered goal labels collide (`Cunha` / `Casemiro`, stoppage-time labels), and the object creates horizontal overflow.
- Players `PlayerGreatnessMap`: portrait labels overlap around the top cluster, and the bottom axis label is cramped.

Improvement:

- Add mobile label tiers: show fewer labels by default, prioritise named outliers, and move secondary detail to tap/tooltip or a compact list below.
- For timeline labels, switch to stacked lanes or abbreviated event chips under 480px.
- Add screenshot tests for `MatchFlow` on high-event matches.

### 3. Long-Scroll Pages Need Pacing Aids

The longest mobile routes become dense vertical walls:

- `/questions`: about 9,900px high.
- `/seasons`: about 11,700px high.
- `/players`: about 6,300px high.
- Player detail pages: about 6,400px high.

The content is good, but the reader needs orientation and stronger rest beats.

Improvement:

- Add a small sticky section rail or jump menu for long pages.
- Consider collapsing secondary modules on `/questions` after the first two, or adding a top "choose a question" index.
- On `/seasons`, make decade navigation sticky or more prominent before the long decade register.
- Vary long repeated rows with clearer section breaks and summary moments.

## Page Notes

### Home

What works:

- The hero is memorable and genuinely specific to the product.
- Search is in the right place and the page starts with exploration rather than a brochure block.
- The page has a clear mobile rhythm: hero, records, myth, latest, record, scorers, routes.

Issues:

- The H1 consumes most of the first viewport. It is dramatic, but the chart starts low and the search hint is easy to miss.
- Keyboard copy, `Press / to search`, is desktop-centric on mobile.
- The skyline x-axis labels collide at the left edge.
- The floating Next dev indicator overlaps the visual field in screenshots. Dev-only, but it makes UI review harder.

Improvements:

- Use mobile-specific helper copy for search: "Tap to search names, seasons, or questions."
- Tighten the hero vertical stack slightly on mobile so the chart arrives sooner.
- Simplify early x-axis labels on `HistorySkyline` under 480px.

### Questions

What works:

- Each question has a bespoke visual. The page does not feel like a generic chart list.
- The section copy generally stays concrete and evidence-led.

Issues:

- The full page is very long, and every module carries similar visual weight.
- There is no mobile jump index after the intro, so the user must scroll through the whole essay.
- Some dense charts and tables become small, especially in the later modules.

Improvements:

- Add a compact question picker near the top.
- Consider default-collapsing deeper evidence below each question, keeping the answer object visible.
- Use more aggressive mobile chart simplification for secondary evidence.

### Matches

What works:

- The filter form is readable and uses standard controls.
- Quick views are helpful and touch-friendly.
- The match rows remain scannable despite density.

Issues:

- The first useful result list starts after a large filter block and a stat panel, so the archive feels heavy before it becomes useful.
- Decade chips and sort controls are small and dense.
- Match rows are close to the minimum comfortable tap height.
- The result-spine panel is visually rich but small; it may not justify its vertical cost for every filter state.
- Console reported a hydration mismatch on this route.

Improvements:

- Make the filter block collapsible after a query is applied, with a concise active-filter summary.
- Increase tap height or row spacing slightly for match rows.
- Turn decade chips into a horizontally scrollable rail with stronger active state and larger touch area.
- Investigate the hydration mismatch.

### Match Detail

What works:

- The abbreviated scoreboard works well on mobile.
- The metadata card and Elo block are readable.
- The page has the right priority: result, flow, facts, then deeper sections.

Issues:

- `MatchFlow` is the biggest mobile defect: event labels collide, late labels clip/offscreen, and the route has horizontal overflow (`scrollWidth` 417 on a 390px viewport).
- The summary rows for `Teamsheet`, `Context`, and `Provenance` can wrap awkwardly beside the section title.
- Current file syntax error blocks clean reruns.

Improvements:

- Give `MatchFlow` a dedicated mobile renderer: fewer always-visible names, stacked event chips, or a scroll-free compact timeline plus event list.
- Put section metadata below the section title on mobile instead of beside it.
- Fix the syntax error before further visual QA.

### Seasons

What works:

- The finish timeline hero gives the index a distinct identity.
- Decade sections make historical browsing understandable.
- The small season rows are compact and expressive.

Issues:

- The page is extremely long on mobile.
- Repeated season rows become monotonous after several decades.
- Some season-row text and tiny bars are near the edge of legibility.
- Console reported a hydration mismatch on this route.

Improvements:

- Add sticky decade navigation.
- Consider decade summaries that can expand into full season rows.
- Increase the legibility of the mini record bars or reserve them for selected/expanded rows.
- Investigate the hydration mismatch.

### Season Detail

What works:

- This is one of the cleanest mobile pages: strong plate, brief, match shape, competitions.
- The information density feels appropriate.

Issues:

- Competition names truncate too aggressively (`FA CHARITY/CO...`, `UEFA CHAMPION...`), hiding important meaning.
- Competition rows have several simultaneous signals in a tight space: chevron, badge, name, verdict, W-D-L, mini bar.

Improvements:

- Allow two-line competition names on mobile.
- Move W-D-L detail into an expanded state or reduce visual weight in the closed row.

### Players

What works:

- The scatter hero is one of the most novel visual ideas in the product.
- Leaderboards give quick answers before the register.
- The register is usable and fast to scan.

Issues:

- Hero scatter labels overlap and compete with portraits in the dense upper cluster.
- The scatter axis and labels crowd the bottom edge.
- The full register loses much of the desktop sparkline/career-object charm on mobile and becomes a simpler ranked list.
- The register is still long, with many low-information rows after the first screen.

Improvements:

- Label only top outliers by default on mobile; expose the rest on tap.
- Add a small "why these points" legend closer to the chart.
- Consider preserving a tiny career cue in mobile register rows, or group lower-ranked rows behind "show more."

### Player Detail

What works:

- The player plate is distinctive and compact.
- The scoring shape, body map, hauls, appearances, and assist partnerships tell a rich story.
- The page uses coverage notes in the right places.

Issues:

- The `Season by season` chart area is visually blank in screenshots even though the Recharts wrapper exists.
- The page is long and module-heavy; after the first few objects, the pattern becomes card after card.
- Dense footnotes are very small and can feel like legal text.

Improvements:

- Fix or restyle the `SeasonContributionChart` so bars/axes visibly render on mobile.
- Collapse full tables by default after a clear summary.
- Give coverage notes a consistent compact component with better mobile contrast and line-height.

### Managers

What works:

- The manager index has one of the best mobile narratives: succession hero, era sections, dominant reign panels.
- Rows are compact and portraits help scanability.
- The Busby/Ferguson emphasis creates real pacing.

Issues:

- Some manager names and metadata truncate too hard in rows.
- The dense rows require careful reading; touch targets are likely marginal.
- The Ferguson detail screenshot was contaminated by the Next build overlay, so it needs rerun.

Improvements:

- Let names wrap to two lines in manager rows.
- Increase row tap target height slightly.
- Rerun detail-page review after build repair.

### Opponents, Analytics, Data

The current run could not cleanly capture these because the dev server returned the Next build error overlay after `app/match/[id]/page.tsx` failed to compile.

From the earlier visual pass:

- `/analytics` has the strongest overall mobile pacing, but still benefits from a compact act/jump rail.
- `/data` has a strong `CoverageMatrix`, but the source lineage grid becomes a long wall on mobile.
- `/opponents` should be rerun after the build is clean; no reliable current mobile screenshot was available in this pass.

## Highest-Leverage Improvements

1. Fix the current build error, then rerun the mobile screenshot pass.
2. Build a mobile-specific `MatchFlow` label strategy.
3. Add a real mobile nav affordance for routes hidden beyond `Questions` and `Matches`.
4. Add jump/section navigation to the long analytical pages.
5. Review all flagship chart labels under 390px and 430px widths.
6. Fix the visually blank player season contribution chart.
7. Make repeated long card/row sections calmer with collapses, summaries, or stronger section breaks.

