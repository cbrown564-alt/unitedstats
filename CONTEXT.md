# UnitedStats Context

UnitedStats is a pattern-discovery product for Manchester United history. This glossary defines the project language used to discuss its data, evidence, and analytical interface.

## Language

**Chart System**: The complete analytical charting experience: chart primitives, chart framing, and page-level chart usage working together to make a pattern readable, trustworthy, and traceable.
_Avoid_: Charting primitives, chart widgets, dashboard charts

**Interactive Chart Layer**: The client-side part of the Chart System that supports direct exploration of a chart, such as hover inspection, selection, toggled series, or focused comparison.
_Avoid_: Chart animations, dashboard interactivity

**Chart Inspection**: Direct reading support inside a chart, where the user can focus a point, bar, or range to see the exact value and surrounding context without leaving the chart.
_Avoid_: Chart filtering, chart editing

**Quiet Analyst Tooltip**: The compact inspection surface used by interactive charts, with precise labels, tabular values, restrained accent color, and no decorative dashboard styling.
_Avoid_: Glossy dashboard popover, glass tooltip
