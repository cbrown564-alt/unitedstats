// @ts-check
/**
 * Astro build for Red Thread (docs/EMDASH-MIGRATION-PLAN.md).
 * Pages are the App Router modules in app/, rendered through src/rt/: server
 * components resolve on the server, the client hydrates one React root from an
 * embedded payload, and next/* imports resolve to the shims in src/shims/.
 *
 * Hybrid output on the Cloudflare adapter. Every route is prerendered on Node
 * (it reads data/united.db) except the live editorial routes in
 * src/rt/live-routes.json and EmDash's admin, which run on the Worker. The
 * Worker has no SQLite: lib/db.ts resolves to lib/dbReplay.ts there.
 */
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import emdash from "emdash/astro";
import { rtClientRefs } from "./src/rt/vite-plugin.mjs";

const shim = (name) => fileURLToPath(new URL(`./src/shims/${name}`, import.meta.url));
const local = (file) => fileURLToPath(new URL(file, import.meta.url));

/**
 * Environment-specific module swaps. Prerendering runs on Node, where EmDash's
 * D1 dialect cannot import `cloudflare:workers` and prerendered pages never use
 * EmDash (they read the seed), so its middleware is a pass-through there. The
 * Worker has no SQLite, so lib/db.ts becomes the query replay.
 */
function environmentSwaps() {
  const dbModule = local("./lib/db.ts");
  return {
    name: "redthread:environment-swaps",
    enforce: "pre",
    async resolveId(id, importer, options) {
      const env = this.environment?.name;
      if (env === "prerender" && id.startsWith("cloudflare:")) return local("./src/shims/cloudflare-workers.mjs");
      if (env === "prerender" && (id === "emdash/middleware" || id.startsWith("emdash/internal/middleware/"))) {
        return local("./src/shims/emdash-prerender-middleware.mjs");
      }
      if (env !== "ssr" || !/(^|\/)db$/.test(id)) return null;
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true });
      return resolved?.id === dbModule ? local("./lib/dbReplay.ts") : null;
    },
  };
}

/** Next inlined NEXT_PUBLIC_* into client code; Vite needs them defined. */
const publicEnv = Object.fromEntries(
  ["NEXT_PUBLIC_DEBUG_WEB_VITALS", "NEXT_PUBLIC_FEEDBACK_FORM_EMBED_URL", "NEXT_PUBLIC_FEEDBACK_FORM_PAGE_ENTRY", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_WEB_VITALS_ENDPOINT"].map(
    (k) => [`process.env.${k}`, JSON.stringify(process.env[k] ?? "")],
  ),
);

export default defineConfig({
  site: "https://utdred.com",
  output: "server",
  adapter: cloudflare({ prerenderEnvironment: "node", configPath: "./wrangler.jsonc" }),
  // Static files land in out/ (what the guards and deploy read); the Worker in dist/server.
  outDir: "./dist",
  build: { format: "file", assets: "_astro", concurrency: 4, client: "../out", server: "./server" },
  trailingSlash: "never",
  devToolbar: { enabled: false },
  integrations: [
    react(),
    emdash({
      // Deployment verifies the schema before upload. Visitor requests must
      // never compete to run migrations on a fresh production database.
      migrations: { runtime: "check", dev: "auto" },
      database: d1({ binding: "DB", session: "auto", coalesce: true }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [{ id: "record-guard", version: "0.1.0", entrypoint: "@redthread/record-guard", format: "native" }],
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Archivo",
      cssVariable: "--font-archivo",
      weights: [400, 500, 600, 700, 800, 900],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],
  vite: {
    define: publicEnv,
    resolve: {
      alias: [
        { find: /^next\/link$/, replacement: shim("next-link.tsx") },
        { find: /^next\/navigation$/, replacement: shim("next-navigation.ts") },
        { find: /^next\/image$/, replacement: shim("next-image.tsx") },
        { find: /^next\/dynamic$/, replacement: shim("next-dynamic.tsx") },
        { find: /^next\/server$/, replacement: shim("next-server.ts") },
        { find: /^next\/og$/, replacement: shim("next-og.tsx") },
        { find: /^next\/font\/google$/, replacement: shim("next-font-google.ts") },
        { find: /^next\/script$/, replacement: shim("next-script.tsx") },
        { find: /^next\/web-vitals$/, replacement: shim("next-web-vitals.ts") },
      ],
    },
    ssr: { external: ["better-sqlite3", "sharp", "@resvg/resvg-js"] },
    environments: { prerender: { resolve: { external: ["better-sqlite3", "sharp", "@resvg/resvg-js"] } } },
    // Tailwind runs as a Vite plugin; postcss.config.mjs stays Next-only.
    css: { postcss: { plugins: [] } },
    plugins: [environmentSwaps(), tailwindcss(), rtClientRefs()],
  },
});
