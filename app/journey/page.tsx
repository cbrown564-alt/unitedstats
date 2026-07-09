import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RhymeMorph } from "@/components/journey/RhymeMorph";
import { comparePlayers, type CareerSeason } from "@/lib/compare";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — Ronaldo vs Best",
  description: "Two No. 7s. Both peaked in their fifth United season — forty years apart.",
  robots: { index: false, follow: false },
};

function peakGoals(arc: CareerSeason[]): { n: number; season: string; goals: number } | null {
  if (!arc.length) return null;
  const peak = arc.reduce((m, s) => (s.goals > m.goals ? s : m), arc[0]);
  return peak.goals > 0 ? { n: peak.n, season: peak.season, goals: peak.goals } : null;
}

/** Calendar year for a season label like 1967-68 → 1968 (the year the campaign ends). */
function seasonEndYear(season: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return Number(season.slice(0, 4)) || 0;
  const century = Number(m[1].slice(0, 2));
  return century * 100 + Number(m[2]);
}

/**
 * Throwaway journey lab — Ronaldo ↔ Best morph pilot.
 * Scoped in docs/JOURNEY.md; not linked from nav; noindex.
 */
export default function JourneyPage() {
  const c = comparePlayers("cristiano-ronaldo", "george-best");
  if (!c || c.signature?.kind !== "career") notFound();

  const best = c.b;
  const ronaldo = c.a;
  const bestPeak = peakGoals(c.signature.b);
  const ronaldoPeak = peakGoals(c.signature.a);
  if (!bestPeak || !ronaldoPeak) notFound();

  const compareHref = "/compare?mode=players&a=cristiano-ronaldo&b=george-best";

  return (
    <div className="-mt-6 space-y-0 sm:-mt-8 lg:-mt-10">
      <RhymeMorph
        a={{
          id: best.id,
          name: best.label,
          peakYear: seasonEndYear(bestPeak.season),
          peakSeason: bestPeak.season,
          peakGoals: bestPeak.goals,
        }}
        b={{
          id: ronaldo.id,
          name: ronaldo.label,
          peakYear: seasonEndYear(ronaldoPeak.season),
          peakSeason: ronaldoPeak.season,
          peakGoals: ronaldoPeak.goals,
        }}
        compareHref={compareHref}
      />

      <p className="mx-auto max-w-xl px-4 py-10 text-center text-xs text-ink-faint sm:px-6">
        Prototype chapter — see <code className="text-ink-dim">docs/JOURNEY.md</code>.{" "}
        <Link href={compareHref} className="text-devil-bright hover:underline focus-ring">
          Full compare
        </Link>
        .
      </p>
    </div>
  );
}
