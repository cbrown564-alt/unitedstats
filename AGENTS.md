# Astro + EmDash

The site is Astro 7 with EmDash 1.5 on one Cloudflare Worker (`docs/EMDASH-MIGRATION-PLAN.md`). Page code still lives in `app/`. Its `next/*` imports resolve to the shims in `src/shims/` until Phase 3b removes Next. Before changing framework APIs, read the installed source and types in `node_modules/astro`, `node_modules/@astrojs/cloudflare` and `node_modules/emdash`. Do not rely on remembered conventions. `wrangler.jsonc` defaults to the preview; only `.github/workflows/deploy.yml` builds and deploys production.

# Red Thread

Build a nostalgia-first Manchester United history product on a complete, traceable fixture record. Create an emotional spark, deepen it with an authored perspective, then let the user inspect the record. Avoid official-club mimicry, a generic statistics dashboard, or an unrestricted chart builder.

`PRODUCT.md` owns product behavior, `DESIGN.md` the interface system, and `docs/README.md` document authority. `data/canonical/` owns source data; SQLite files and exports are generated artifacts. Keep coverage limits and provenance visible, and never infer missing history.

Put operational and ingest scripts under `scripts/` so `knip` treats them as entry points. Inspect any command that can rewrite canonical data or cached media before running it.

Verify UI changes at the relevant viewport and show the resulting screenshot. For audio or video, inspect the rendered composition and listen to the mix; keep working renders outside `output/video/releases/`. Run focused checks while iterating and the applicable parts of `npm test`, `npm run lint`, `npm run knip`, `npm run validate`, and `npm run build` before a broad completion claim.
