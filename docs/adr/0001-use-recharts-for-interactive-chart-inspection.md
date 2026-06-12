# Use Recharts for interactive chart inspection

UnitedStats originally used tiny server-rendered SVG charts to avoid client chart-library weight. We decided to introduce Recharts for the Interactive Chart Layer because chart inspection is now a first-class part of the Chart System, and using a mature charting library gives us accessible hover/focus behavior, scales, axes, tooltips, and responsive rendering without hand-rolling a parallel chart engine.
