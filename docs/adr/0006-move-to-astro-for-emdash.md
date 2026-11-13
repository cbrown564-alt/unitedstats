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

## Phase 1 approach: keep the App Router pages, replace the runtime (2026-11-13)

The plan budgeted Phase 1 as island splits: every React server tree that nests a client
component would be cut around it, and async server components would move into `.astro`
frontmatter. We did not do that. The pages in `app/` stay as they are, and a small runtime in
`src/rt/` does the job Next's RSC renderer did:

- `src/rt/flight.ts` walks the page tree on the server, calling server components (and
  awaiting async ones) until only host elements and client components remain. Server
  components get a dispatcher with the hooks RSC allows (`useId`, `useMemo`, `use`, …).
- The `rt-client-refs` Vite plugin tags each export of a `"use client"` module, which is where
  the walk stops, and generates the browser's lazy-import table.
- The resolved tree is rendered to HTML and also encoded into the page as JSON. The browser
  (`src/rt/client.tsx`) decodes it and hydrates **one** React root. Context providers that wrap
  server children (`MatchCorrection`, `MatchesCatalog`) keep working, which island splits
  would have broken.
- `src/rt/metadata.ts` reproduces Next's metadata merge (title templates, openGraph
  replacement, own-segment OG images, twitter inheritance), so heads match byte for byte.
- `next/link`, `next/navigation`, `next/dynamic`, `next/image`, `next/og` and
  `next/web-vitals` are aliased to shims in `src/shims/`. Navigation is a plain MPA with
  speculation-rules prefetch and a CSS cross-document view transition. Same-path query
  changes (`/matches` filters, sorts) stay in the page.
- `scripts/astro/generate-routes.mjs` writes `src/pages/` from `app/`: one thin `.astro`
  wrapper per page, and an endpoint per route handler, OG image, sitemap, robots and icon.

Why: it turned an 87-file audit into about 1,400 lines of runtime, shims and route generator, and parity became
something a script can check (path set, head tags, visible text), not a judgement call. The
cost is that the shims and the runtime are ours to maintain. Pages can still move to native
`.astro` one at a time where that pays, starting with the EmDash-backed pages in Phase 2.

Measured on the preview profile: the home page ships 368 KB against Next's 418 KB, and the
only text or head differences are accepted ones (the dev pages now render the not-found page,
`/questions` is an Astro redirect page, and `/surprise` picks at random).

## Consequences

- EmDash owns editorial content only. Facts stay in `data/canonical/`.
- Every publish is mirrored to `content/emdash/seed.json` in git; that file feeds prerendered
  pages and tests.
- The Next runtime, `next/font`, `next/og` and the `.next` manifest guards are replaced
  (Phase 1).
- The live editorial routes run on a Worker with no SQLite. They replay the record queries
  their prerendered twins made at build time. A render that needs anything else serves the
  twin, so a live page never shows a guessed record (Phase 2; details in the plan).
- The EmDash Worker is 5.5 MB gzipped, nearly all of it EmDash. That is over the Workers
  Free 3 MB limit, so going live with the CMS means Workers Paid.
