<!-- BEGIN:nextjs-agent-rules -->
# Next.js

Read the relevant installed guide in `node_modules/next/dist/docs/` before changing framework APIs. Do not rely on remembered conventions; this version has breaking changes.
<!-- END:nextjs-agent-rules -->

# Red Thread

Build a nostalgia-first Manchester United history product on a complete, traceable fixture record. Create an emotional spark, deepen it with an authored perspective, then let the user inspect the record. Avoid official-club mimicry, a generic statistics dashboard, or an unrestricted chart builder.

`PRODUCT.md` owns product behavior, `DESIGN.md` the interface system, and `docs/README.md` document authority. `data/canonical/` owns source data; SQLite files and exports are generated artifacts. Keep coverage limits and provenance visible, and never infer missing history.

Put operational and ingest scripts under `scripts/` so `knip` treats them as entry points. Inspect any command that can rewrite canonical data or cached media before running it.

Verify UI changes at the relevant viewport and show the resulting screenshot. Save screenshots in a repository-local ignored directory or the host's temporary directory; do not assume a Unix-only artifact path. For audio or video, inspect the rendered composition and listen to the mix; keep working renders outside `output/video/releases/`. Run focused checks while iterating and the applicable parts of `npm test`, `npm run lint`, `npm run knip`, `npm run validate`, and `npm run build` before a broad completion claim.
