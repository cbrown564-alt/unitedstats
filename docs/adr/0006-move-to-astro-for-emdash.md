# Move to Astro so EmDash can own editorial content

Supersedes the conclusion of [0005](0005-stay-on-next-after-astro-seasons-spike.md). Its
measurements stand.

ADR 0005 judged Astro on performance and stayed on Next. The question now is different: we
want EmDash as the CMS for editorial content, and EmDash is an Astro integration. We move to
Astro 7 on the Cloudflare adapter, with EmDash on D1 and R2 in the same Worker.

## Phase 0 findings (2026-11-13, `emdash@1.5.0`, `astro@7.4.11`, `@astrojs/cloudflare@14.4.7`)

1. **Hybrid build at scale works.** `output: "server"` built 10,500 prerendered pages next to
   EmDash's server routes in 43 s. The pages read our SQLite with better-sqlite3 at build time.
   This needs `prerenderEnvironment: "node"`. It also needs a pre-resolve Vite plugin that
   points `cloudflare:*` imports at a stub, in the prerender environment only. Without the
   stub, EmDash's D1 dialect imports `cloudflare:workers` at the top level and Node refuses
   it. Prerendered requests never touch bindings: EmDash's middleware checks
   `context.isPrerendered`.
2. **The git snapshot works, with one constraint.** `emdash export-seed` reads a local SQLite
   file, not remote D1. The publish workflow therefore runs `wrangler d1 export --remote`,
   loads the SQL into SQLite, and runs `export-seed --with-content=all` on it. A
   round-tripped seed passes `emdash seed --validate`. **D1 export refuses FTS5 virtual
   tables, so no Red Thread collection may enable EmDash's `search` support.** Site search
   stays our own client index. As a fallback, `emdash site export --url` produces a tar of
   NDJSON records over HTTP.
3. **The record guard works in-process.** A native plugin's `content:beforeSave` throws
   `ContentSaveRejectedError`; an unknown match ID was refused with our message. A valid ID
   was saved, and `content:afterPublish` fired with `{ content, collection }`. Hooks need
   declared capabilities (`content:write`, plus `network:request` with `allowedHosts` for
   the GitHub dispatch), or EmDash skips them with a warning. A native plugin needs no
   Worker Loader, so this runs on the free plan.
4. **Custom Portable Text blocks are a native-plugin feature.** They are declared in
   `admin.portableTextBlocks` and rendered by Astro components from the plugin's
   `componentsEntry` (`blockComponents` export). Those Astro components can host our React
   islands.
5. **Cache invalidation is on a path, not yet proven.** `@astrojs/cloudflare` ships
   `cacheCloudflare()`, which sets `Cloudflare-CDN-Cache-Control` and `Cache-Tag` and purges
   by tag through the Workers cache API. EmDash tags responses through `Astro.cache.set()`.
   The real purge can only be proven on a deployed Worker, so it is checked on the preview
   Worker in Phase 2.
6. **Passkeys need the maintainer.** Passkeys are bound to the hostname. Local work uses
   EmDash's dev bypass, and the first visitor to `/_emdash/admin/setup` becomes admin. Setup
   on the preview and production hostnames happens with the maintainer present, before
   either URL is shared (Phase 3).

## Consequences

- EmDash owns editorial content only. Facts stay in `data/canonical/`.
- Every publish is mirrored to `content/emdash/seed.json` in git; that file feeds prerendered
  pages and tests.
- The Next runtime, `next/font`, `next/og` and the `.next` manifest guards are replaced
  (Phase 1).
