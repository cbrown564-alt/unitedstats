<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Product and documentation

Red Thread is a nostalgia-first Manchester United history product built on a complete, traceable fixture record. Preserve the sequence: create an emotional spark, deepen it with an authored perspective, and let the user inspect the record behind it. Do not turn the product into official-club mimicry, a generic statistics dashboard, or an unrestricted chart builder.

Read `PRODUCT.md`, `DESIGN.md`, and `docs/README.md` before product work. `data/canonical/` owns source data; generated SQLite and dataset exports are build artifacts. Keep coverage limits and source provenance visible, and never fill historical gaps by inference.

Use `docs/README.md` to update the document that owns a concern. Current code and tests own implemented behavior; product documents own intended behavior.

# CI: knip

CI runs `npm run knip`, which fails on unused files. Standalone scripts under `scripts/` are treated as entry points via a glob in `knip.json`, so adding a new one-off script there won't break the build. Put new operational/ingest scripts under `scripts/` (not elsewhere) so this coverage applies.

# UI changes: confirm with a screenshot

Any UI change should be verified visually before the agent marks the work done. Run the
dev server (or use a preview URL), capture a screenshot at the relevant viewport with
`node scripts/shot.mjs <url> <outfile> [width] [height]`, and **show the image to the
user** in the response. Match the viewport to the surface (e.g. 390×844 for phone, 1280
for desktop). Save artifacts under `/opt/cursor/artifacts/screenshots/` when available.

For video or audio work, visual inspection of a web page is insufficient. Render the affected composition or representative segment, inspect frames at the intended aspect ratio, and listen to the mixed output. Keep working renders separate from canonical releases under `output/video/releases/`.

# Checks and data safety

Run the narrow relevant checks while iterating. Before a broad completion claim, run the applicable set from `npm test`, `npm run lint`, `npm run knip`, `npm run validate`, and `npm run build`. Run media, static-render, performance, or video validation when those areas change.

Historical ingest and network-backed media commands can change large canonical datasets or cached assets. Inspect their write modes and provenance rules before running them; do not treat a successful fetch as validated data.
