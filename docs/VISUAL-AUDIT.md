# UnitedStats Visual Audit

Last refreshed: 2026-06-13 (supersedes the 2026-06-12 pass)

This audit reflects the current state of the app after the repo-polish work
(global header search, page systematization, the competition-identity system,
Elo era annotations, analytics tiering, and the question rail). Items the code
now addresses are recorded as resolved so the audit stays an honest map of what
is left rather than a list of already-fixed problems.

Scope of the original review: desktop default viewport and mobile 390 x 844,
across `/`, `/questions`, `/matches`, `/seasons`, `/players`, `/managers`,
`/opponents`, `/analytics`, `/analytics/odds`, `/analytics/travel`, `/data`, and
representative detail pages.

## Resolved since the last audit

- **Mobile header navigation.** `MainNav` now uses a hidden-scrollbar overflow
  row with a fade edge and pathname-aware active states on all breakpoints
  (was G-01, G-02).
- **Global search reachability.** Search lives in the header on every route
  (`HeaderSearch`): a persistent compact input on desktop that owns the `/`
  shortcut, and a toggle that opens a full-width search row on mobile. It is no
  longer homepage-only.
- **Match scoreline semantics.** The score followed brand red regardless of
  result; it now follows win/draw/loss tone and the header carries an explicit
  result word.
- **Competition identity.** Fixtures used to read as identical grey text.
  `CompetitionChip`/`CompetitionDot` add three restrained colour categories
  (league, cup, Europe) across match-list rows, the match header, season-index
  chips, and season-detail headers (addresses much of G-06's "no subject cue").
- **Component consistency.** The opponent page now uses the shared
  `PageHeader`/`StatTile` system; analytics chart panels use the shared
  `ChartPanel` frame instead of hand-rolled panel divs.
- **Progressive disclosure.** The match page collapses the low-priority Bench
  and Source trail sections. The player page already used `details` for
  season-by-season and lineup appearances.
- **Filters and indexes.** `/matches` has a labelled, responsive filter grid
  with a reset action; `/players` and `/opponents` have search; `/seasons` uses
  decade-grouped list rows rather than a wall of cards.
- **Question wayfinding.** `/questions` has a sticky in-page rail indexing the
  six modules.
- **Analytics rhythm.** `/analytics` is grouped into chapters (Trends over
  time, Goals and grounds, Records, Data coverage), and the Elo timeline is
  shaded by managerial era with the longest tenures labelled.

## Global findings still open

### G-05. Tiny muted text is doing too much work

Severity: medium

`text-xs text-ink-faint` still carries a lot of meaning — coverage notes, table
percentages, chart captions. On dark panels this falls below comfortable
reading contrast at exactly the interpretation points where trust matters most
(`/data` coverage percentages, chart slice/coverage notes). Raise contrast for
caveat text and lean less on the faintest ink for information the reader is
meant to act on.

### G-06. Atmosphere beyond competition colour

Severity: medium

Competition chips add the first real subject-specific cue, but the product is
still typography + dark panels + charts. There is no era/trophy glyph system,
no historical timeline texture, and no restrained imagery. The design thesis
("floodlit match-night ledger") is carried more in copy than in interface
texture. Candidate, low-noise additions: a trophy/honours marker system reused
on seasons, managers, and the Elo timeline; subtle era banding on more
surfaces than just the Elo chart.

### G-07. Focus and hover treatments

Severity: low-medium

The shared `.control` class and `focus-visible` outlines cover most inputs and
links now, but hover affordances still vary (some links underline, some shift
colour, some panels shift border). Worth a final consistency pass so row links,
card links, and inline links share one vocabulary.

## Page findings still open

### `/analytics/odds`

Severity: high

Not touched in the polish passes. The opponent picker is still a large native
`select` of hundreds of options where the `SearchCommand` combobox pattern
already exists. The probability result deserves to be the hero component, and
the calibration table overflows on narrow mobile. Language separating "rating
signal" from betting odds should be reinforced visually as well as in copy.

### `/analytics/travel`

Severity: medium-high

Not touched. The map should be the first visual payoff rather than appearing
below text; metric chips (total miles, grounds, continents) would anchor it,
and the maps need clearer legends explaining dot size and colour.

### `/data`

Severity: medium-high

Not touched. Coverage and correction content compete in one dense grid;
coverage percentages are low-contrast (see G-05). Splitting coverage and
correction into full-width sections and turning API/download blocks into
clearer endpoint lists would help.

### `/match/[id]`

Severity: medium

Much improved (result-toned scoreline, competition chip, collapsed
Bench/Sources). Remaining: the venue/attendance/manager/competition facts are
still a bespoke `dl` rather than the shared `StatTile`, and the teamsheet
(XI / subs / bench) could be grouped as one block rather than three stacked
sections. A tabbed or grouped layout for Goals / Teamsheet / Provenance /
Trails would tighten a long page further.

### `/player/[id]`

Severity: medium

The header, stat tiles, and `details`-based disclosure are strong, but the
mid-page chart sequence (goals by season, minute, competition, opponent, best
run) is still a long single-column stack. Consider grouping the analysis
panels or making more of them collapsible on mobile.

### `/managers`, `/opponents`

Severity: medium

Both now use the shared header and (for opponents) search, but neither offers
segmented grouping — managers by era/role, opponents by alphabet, country, or
bogey-side cut. The data supports these cuts; they would turn long lists into
browsable indexes.

### Charts: comparison and annotation depth

Severity: medium

Charts remain largely univariate. The Elo timeline now carries manager eras,
but the win-rate-by-season chart does not, and there is still no side-by-side
comparison mode (two managers, players, opponents, or eras). The myth-testing
modules are fixed rather than parameterised.

## Recommended next order

1. `/analytics/odds`: searchable opponent combobox, hero probability result,
   mobile-safe calibration.
2. Contrast pass for coverage/caveat text (G-05) and a focus/hover consistency
   sweep (G-07).
3. A reusable trophy/honours marker system across seasons, managers, and the
   Elo timeline (extends G-06 and the era annotations).
4. Segmented grouping on `/managers` and `/opponents`.
5. `/data` and `/analytics/travel` layout passes.

## Notes

- Development and verification used `next build` plus a local production server;
  `tsc` and `eslint` pass.
- No measurement of document-level horizontal overflow was repeated in this
  refresh; the original pass found none on desktop and a contained overflow on
  the odds calibration table on mobile, which remains open.
