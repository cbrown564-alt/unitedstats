import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CordGallery, type GalleryLap, type GalleryMatch } from "@/components/dev/CordGallery";
import type { ThreadGoal } from "@/components/glyphs/cord/DataGlyphs";
import { eventsForMatch, formBefore, matchById, seasonMatches, seasonsIndex } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Cord glyphs",
  robots: { index: false, follow: false },
};

const US = new Set(["goal", "pen-goal", "own-goal-for"]);
const THEM = new Set(["opp-goal", "own-goal-against"]);

const NIGHTS: { id: string; title: string }[] = [
  { id: "1999-05-26-bayern-munich-n", title: "Bayern Munich, Barcelona 1999" },
  { id: "1968-05-29-benfica-n", title: "Benfica, Wembley 1968" },
  { id: "2011-08-28-arsenal-h", title: "Arsenal, Old Trafford 2011" },
];
const LAPS = ["1998-99", "1973-74", "2012-13"];

function matchesFromRecord(): GalleryMatch[] {
  return NIGHTS.flatMap(({ id, title }) => {
    const m = matchById(id);
    if (!m) return [];
    const goals: ThreadGoal[] = eventsForMatch(id)
      .filter((e) => (US.has(e.type) || THEM.has(e.type)) && e.minute !== null)
      .map((e) => ({ minute: e.minute as number, added: e.added_time, side: US.has(e.type) ? "us" : "them" }));
    const form = formBefore(m.date, 8)
      .reverse()
      .map((r) => r.result);
    return [{ id, title, gf: m.gf, ga: m.ga, aet: m.aet === 1, result: m.result, goals, form }];
  });
}

function lapsFromRecord(): GalleryLap[] {
  const index = seasonsIndex();
  return LAPS.flatMap((season) => {
    const league = seasonMatches(season).filter((m) => m.competition_type === "league");
    if (league.length === 0) return [];
    const summary = index.find((s) => s.season === season && s.type === "league");
    const results = league.map((m) => m.result);
    return [
      {
        season,
        results,
        position: summary?.position ?? null,
        competition: league[0].competition_name,
        w: results.filter((r) => r === "W").length,
        d: results.filter((r) => r === "D").length,
        l: results.filter((r) => r === "L").length,
      },
    ];
  });
}

/** Dev-only gallery of the cord glyphs and the motion library. 404 in production. */
export default function CordGalleryPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CordGallery matches={matchesFromRecord()} laps={lapsFromRecord()} />;
}
