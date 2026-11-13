// @ts-check
/**
 * Astro build for Red Thread (Phase 1 of docs/EMDASH-MIGRATION-PLAN.md).
 * Pages are the App Router modules in app/, rendered through src/rt/: server
 * components resolve on the server, the client hydrates one React root from an
 * embedded payload, and next/* imports resolve to the shims in src/shims/.
 */
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { rtClientRefs } from "./src/rt/vite-plugin.mjs";

const shim = (name) => fileURLToPath(new URL(`./src/shims/${name}`, import.meta.url));

/** Next inlined NEXT_PUBLIC_* into client code; Vite needs them defined. */
const publicEnv = Object.fromEntries(
  ["NEXT_PUBLIC_DEBUG_WEB_VITALS", "NEXT_PUBLIC_FEEDBACK_FORM_EMBED_URL", "NEXT_PUBLIC_FEEDBACK_FORM_PAGE_ENTRY", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_WEB_VITALS_ENDPOINT"].map(
    (k) => [`process.env.${k}`, JSON.stringify(process.env[k] ?? "")],
  ),
);

export default defineConfig({
  site: "https://utdred.com",
  output: "static",
  outDir: "./out",
  build: { format: "file", assets: "_astro", concurrency: 4 },
  trailingSlash: "never",
  devToolbar: { enabled: false },
  integrations: [react()],
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
    // Tailwind runs as a Vite plugin; postcss.config.mjs stays Next-only.
    css: { postcss: { plugins: [] } },
    plugins: [tailwindcss(), rtClientRefs()],
  },
});
