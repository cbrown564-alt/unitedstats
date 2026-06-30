<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CI: knip

CI runs `npm run knip`, which fails on unused files. Standalone scripts under `scripts/` are treated as entry points via a glob in `knip.json`, so adding a new one-off script there won't break the build. Put new operational/ingest scripts under `scripts/` (not elsewhere) so this coverage applies.

# UI changes: confirm with a screenshot

Any UI change should be verified visually before the agent marks the work done. Run the
dev server (or use a preview URL), capture a screenshot at the relevant viewport with
`node scripts/shot.mjs <url> <outfile> [width] [height]`, and **show the image to the
user** in the response. Match the viewport to the surface (e.g. 390×844 for phone, 1280
for desktop). Save artifacts under `/opt/cursor/artifacts/screenshots/` when available.
