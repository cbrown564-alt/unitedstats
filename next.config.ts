import type { NextConfig } from "next";
import { IMMUTABLE_DATA_CACHE_CONTROL } from "./lib/cache";
import { EMBED_FRAME_HEADERS } from "./lib/embeds";

const immutablePageCacheHeader = [
  { key: "Cache-Control", value: IMMUTABLE_DATA_CACHE_CONTROL },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_VERIFY_DIST ?? ".next",
  turbopack: {
    root: process.cwd(),
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
      { source: "/embed/:path*", headers: EMBED_FRAME_HEADERS },
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
