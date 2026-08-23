import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_VERIFY_DIST ?? ".next",
  output: "export",
  turbopack: {
    root: process.cwd(),
  },
  // Wrap client navigations in the View Transitions API so route changes
  // cross-fade instead of hard-cutting. The animation is styled in globals.css
  // (a fast fade, fully disabled under prefers-reduced-motion).
  experimental: {
    viewTransition: true,
  },
  images: {
    // Static export cannot use the default image optimizer. Portraits are
    // already cached WebPs; editorial images ship at authoring size.
    unoptimized: true,
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
