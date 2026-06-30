import type { NextConfig } from "next";
import { IMMUTABLE_DATA_CACHE_CONTROL } from "./lib/cache";

const immutablePageCacheHeader = [
  { key: "Cache-Control", value: IMMUTABLE_DATA_CACHE_CONTROL },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_VERIFY_DIST ?? ".next",
  // united.db (~49MB) is the runtime source of truth, read by better-sqlite3 (a
  // native open the tracer can't follow), so include it explicitly in every
  // server function. Production may serve a fresher /tmp copy downloaded from
  // Vercel Blob, but the bundled copy is the floor so the site never 500s on a
  // missing blob (see lib/db.ts).
  outputFileTracingIncludes: {
    "/*": ["data/united.db"],
  },
  // Build-only sources consumed by build-db and never read at runtime. Excluded
  // as belt-and-suspenders so they can't be traced into function bundles and
  // push them past Vercel's 250MB limit. data/canonical is ~40MB.
  outputFileTracingExcludes: {
    "/*": [
      "data/canonical/**",
      "data/history-digests/**",
      // Build/dev-only trees that must never ship in serverless bundles.
      "design-mocks/**",
      "output/**",
      "docs/**",
      "research/**",
      "tests/**",
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  // Wrap client navigations in the View Transitions API so route changes
  // cross-fade instead of hard-cutting. The animation is styled in globals.css
  // (a fast fade, fully disabled under prefers-reduced-motion).
  experimental: {
    viewTransition: true,
  },
  async redirects() {
    return [
      // Odds folded into /analytics as the strength layer's prospective half;
      // travel folded into /questions as the away-days question (ADR 0002).
      { source: "/analytics/odds", destination: "/analytics", permanent: true },
      { source: "/analytics/travel", destination: "/questions/away-days", permanent: true },
      // The /questions index is subsumed into the Explore Answering strip (Phase
      // 11.5); the per-question /questions/[slug] depth pages remain the jump target.
      { source: "/questions", destination: "/explore", permanent: true },
    ];
  },
  async headers() {
    return [
      ...["/matches", "/players", "/seasons", "/search", "/compare"].map((source) => ({
        source,
        headers: immutablePageCacheHeader,
      })),
    ];
  },
  images: {
    // Player/manager portraits are immutable, so let the optimizer hold each
    // optimized variant for a year. Wikimedia (which rate-limits / 429s) is then
    // hit at most once per image, not on every cache expiry.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
