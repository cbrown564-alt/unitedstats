import type { Metadata } from "@/src/rt/metadata";
import { SITE_URL } from "@/lib/site";

// The site-wide metadata every page inherits (src/rt/render.tsx). The document
// itself, with fonts, analytics and JSON-LD, is src/rt/Document.astro.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Red Thread — every Manchester United match since 1886", template: "%s · Red Thread" },
  description:
    "Evidence-backed Manchester United history: every match, every competition, every goal — from Newton Heath to today.",
  openGraph: {
    type: "website",
    siteName: "Red Thread",
    locale: "en_GB",
    title: { default: "Red Thread — every Manchester United match since 1886", template: "%s · Red Thread" },
    description:
      "Evidence-backed Manchester United history: every match, every competition, every goal — from Newton Heath to today.",
  },
  twitter: {
    card: "summary_large_image",
  },
};
