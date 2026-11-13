/**
 * The `opengraph-image` routes, as metadata needs them (see metadata.ts). Kept
 * as data so page renders never import the image renderer. The `hash` cache
 * busters are the ones Next printed, so shared links keep their cached cards.
 */
import type { OgFile } from "./metadata";

const SIZE = { width: 1200, height: 630 };

const OG_ROUTES: Record<string, { hash: string; alt: string }> = {
  "/": { hash: "bc692bda073fcd7c", alt: "Red Thread — the open evidence engine for Manchester United history" },
  "/data": { hash: "e9d3ec19b1a352e0", alt: "Red Thread open dataset and coverage ledger" },
  "/managers": { hash: "037eef3e8d4f2eb0", alt: "Manchester United manager archive — Red Thread" },
  "/match/[id]": { hash: "892bd56df84f4ab4", alt: "Manchester United match — Red Thread" },
  "/matches": { hash: "1dade5cab477b6da", alt: "Manchester United match archive — Red Thread" },
  "/players": { hash: "5084a0e7e59a80d8", alt: "Manchester United player archive — Red Thread" },
  "/questions/[slug]": { hash: "7fadb5338f46d58a", alt: "Red Thread question — a sourced answer about Manchester United history" },
  "/seasons": { hash: "679319d39fe3eca8", alt: "Manchester United season archive — Red Thread" },
  "/stories": { hash: "765f3ca8d69d6fb3", alt: "Manchester United stories — Red Thread" },
  "/stories/[slug]": { hash: "c3eccacf1cd3e3fd", alt: "Red Thread story — Manchester United history, evidenced" },
};


const file = (route: string, path: string): OgFile => ({
  path: path === "/" ? "/opengraph-image" : `${path}/opengraph-image`,
  hash: OG_ROUTES[route]!.hash,
  alt: OG_ROUTES[route]!.alt,
  size: SIZE,
  contentType: "image/png",
});

/** The image in this page's own segment, if any, and the inherited root one. */
export function ogFilesFor(route: string, pathname: string): { own?: OgFile; inherited?: OgFile } {
  if (route === "/") return { own: file("/", "/") };
  if (OG_ROUTES[route]) return { own: file(route, pathname) };
  return { inherited: file("/", "/") };
}
