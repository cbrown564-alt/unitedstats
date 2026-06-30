import type { NextConfig } from "next";
import { IMMUTABLE_DATA_CACHE_CONTROL } from "./lib/cache";

const immutablePageCacheHeader = [
  { key: "Cache-Control", value: IMMUTABLE_DATA_CACHE_CONTROL },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_VERIFY_DIST ?? ".next",
  // The runtime db path (path.join(process.cwd(), …)) makes the file tracer pull
  // the whole project into every server function, including build-only source
  // data. data/canonical (~42MB) and data/history-digests are consumed by
  // build-db at build time and never read at runtime, so exclude them — otherwise
  // function bundles blow past Vercel's 250MB limit. data/united.db stays bundled
  // for preview deploys (no blob), where dynamic routes read it directly.
  outputFileTracingExcludes: {
    "/*": ["data/canonical/**", "data/history-digests/**"],
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
