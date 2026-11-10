# Hand-drawn charts replace Recharts

Supersedes [0001](0001-use-recharts-for-interactive-chart-inspection.md).

Recharts gave the Interactive Chart Layer scales, axes and tooltips quickly, but on a static
export it cost more than it gave: a ~94 KB chunk on every chart route, `ssr: false` wrappers so
charts were blank until hydration, and a parallel visual language that had to be bent back into
the house "cord" style. The architecture audit (`docs/reviews/architecture-audit-2026-11-10.md`)
named it the largest avoidable client weight after the framework itself.

We now draw every inspectable chart ourselves:

- `components/charts/plot.ts` — scales, d3-equivalent nice ticks, monotone-X and area paths.
- `components/charts/PlotShell.tsx` — server-rendered frame: y-label gutter, grid, HTML x labels.
- `components/charts/ChartInspector.tsx` — the one client island: hover, keyboard (arrows, Home,
  End, Enter, Escape), tap-to-pin then tap-to-open on touch, tip card, live region, evidence link.

Marks are SVG in a stretched `0 0 100 100` viewBox with non-scaling strokes; dots, bars and labels
are percentage-positioned HTML so they stay crisp at any width. Charts render on the server, so they
are readable before (and without) JavaScript.

Consequences: no chart dependency; the evidence-link and Quiet Analyst tooltip contracts are
unchanged; page code still imports UnitedStats chart components only. Labels cannot measure
themselves on the server, so dense axes thin by count (`labelEvery`, slanted-axis cap, fewer
ticks) rather than by collision detection.
