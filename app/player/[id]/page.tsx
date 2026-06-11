import Link from "next/link";
import { notFound } from "next/navigation";
import {
  playerById, playerGoalsBySeason, playerGoalMatches, playerGoalMinutes,
} from "@/lib/queries";
import { Bars } from "@/components/charts";
import { MatchList } from "@/components/MatchList";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  if (!p) notFound();
  const bySeason = playerGoalsBySeason(id);
  const matches = playerGoalMatches(id);
  const minutes = playerGoalMinutes(id);

  const buckets = [0, 0, 0, 0, 0, 0];
  for (const m of minutes) buckets[Math.min(Math.floor((m - 1) / 15), 5)]++;
  const bucketLabels = ["1–15", "16–30", "31–45", "46–60", "61–75", "76–90+"];

  const braces = matches.filter((m) => m.goals === 2).length;
  const hatTricks = matches.filter((m) => m.goals >= 3).length;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">Player</p>
        <h1 className="display text-4xl">{p.name}</h1>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-2xl">
          {[
            ["Goals", String(p.goals)],
            ["In matches", String(matches.length)],
            ["Braces", String(braces)],
            ["Hat-tricks+", String(hatTricks)],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel px-4 py-3">
              <div className="stat-num text-2xl font-semibold">{v}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{k}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-3 max-w-xl">
          Totals reflect recorded goal events only — coverage is deepest in cup and European matches and
          grows continuously. Appearances will appear when lineup data lands.
        </p>
      </header>

      {bySeason.length > 1 && (
        <section>
          <h2 className="display text-xl mb-3">Goals by season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <Bars
              data={bySeason.map((s) => ({ label: s.season.slice(0, 4), value: s.goals }))}
              labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
            />
          </div>
        </section>
      )}

      {minutes.length > 3 && (
        <section>
          <h2 className="display text-xl mb-3">When in the match</h2>
          <div className="border border-line rounded-lg bg-panel p-4 max-w-xl">
            <Bars
              data={buckets.map((n, i) => ({ label: bucketLabels[i], value: n }))}
              height={140}
              color="var(--color-gold)"
            />
            <p className="text-xs text-ink-faint mt-1">
              Distribution of {minutes.length} goals with recorded minutes.
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="display text-xl mb-3">Matches scored in</h2>
        <MatchList matches={matches} showSeason />
      </section>

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline">← All players</Link>
      </p>
    </div>
  );
}
