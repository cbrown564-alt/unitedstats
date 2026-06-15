# UnitedStats Context

UnitedStats is a pattern-discovery product for Manchester United history. This glossary defines the project language used to discuss its data, evidence, and analytical interface.

## Language

### Product shape

**The Record**: The complete, filterable fixture spine — every match, sortable and groupable. It is the canonical home of match-level data; other surfaces reference it rather than restating it.
_Avoid_: The archive, the database, the match list (as a synonym for the whole)

**Surface**: A top-level place with its own URL and a distinct one-sentence job no other place states. The unit this product has too many of.
_Avoid_: Page (when the distinction from a View matters), route (when speaking about purpose rather than the URL)

**View**: A saved sort, grouping, or filter *of The Record* — not a separate place. Managers, opponents, records, and most ranked lists are Views, surfaced inside The Record rather than as their own Surfaces.
_Avoid_: Tab, mode, report

**Front Door**: The curated, question-led entry point (`/questions`) that routes a reader into The Record. Interpretation lives here as argument; The Record holds the evidence.
_Avoid_: Landing page, dashboard, hub

**Canonical Home**: The single Surface that owns a given piece of data. Every datum has exactly one. A reader is shown it here, in full, with its coverage; everywhere else only links to it.
_Avoid_: Source of truth (reserved for the data pipeline, not the UI), primary page

**Second Rendering**: Any display of data whose Canonical Home is elsewhere. Under the kill criterion, a Second Rendering is always replaced by a link — never a re-display. The main thing this product currently has too much of.
_Avoid_: Duplicate, copy, mirror

**Primary Answer**: The single thing a Surface exists to deliver, shown first and unmissable. Every page template has exactly one; everything else on the page is depth-on-demand beneath it. The rule that resolves "what leads this page?"
_Avoid_: Hero (visual-design sense), headline, key metric

**Ten-Second Test**: The success bar for a Surface — a new reader can state what it is for within ten seconds of landing on it. A Surface that fails it is either mis-sequenced or shouldn't exist.
_Avoid_: Clarity (too vague), usability

**Coverage Note**: A trust signal at an interpretation point stating how complete the underlying data is for the cut shown. Graded by nature: rendered loud (with real counts) only where the facet is less than complete for that range, and silent where the data is whole. Its absence means complete data, never forgotten data — so it is computed from coverage, not authored per module.
_Avoid_: Caveat, disclaimer, footnote

**Slice Line**: The companion note stating *what cut* a chart or module shows. Distinct from a Coverage Note (which states completeness); kept only where the cut genuinely constrains interpretation.
_Avoid_: Caption, filter description

**Chart System**: The complete analytical charting experience: chart primitives, chart framing, and page-level chart usage working together to make a pattern readable, trustworthy, and traceable.
_Avoid_: Charting primitives, chart widgets, dashboard charts

**Interactive Chart Layer**: The client-side part of the Chart System that supports direct exploration of a chart, such as hover inspection, selection, toggled series, or focused comparison.
_Avoid_: Chart animations, dashboard interactivity

**Chart Inspection**: Direct reading support inside a chart, where the user can focus a point, bar, or range to see the exact value and surrounding context without leaving the chart.
_Avoid_: Chart filtering, chart editing

**Quiet Analyst Tooltip**: The compact inspection surface used by interactive charts, with precise labels, tabular values, restrained accent color, and no decorative dashboard styling.
_Avoid_: Glossy dashboard popover, glass tooltip
