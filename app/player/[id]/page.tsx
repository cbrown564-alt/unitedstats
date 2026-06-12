import Link from "next/link";
import { notFound } from "next/navigation";
import {
  playerAssistPartnerships, playerById, playerGoalMatches, playerGoalMinutes,
  playerLineupMatches, playerSplitsBySeason,
} from "@/lib/queries";
import { playerBestScoringRun, playerGoalsByCompetitionType } from "@/lib/trails";
import { Bars } from "@/components/charts";
import { MatchList } from "@/components/MatchList";
import { fmtDate } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  league: "League",
  "domestic-cup": "FA Cup",
  "league-cup": "League Cup",
  european: "Europe",
  "super-cup": "Shields & Super Cups",
  world: "World",
  playoff: "Test Matches",
  unofficial: "Wartime & friendlies",
};

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  if (!p) notFound();
  const bySeason = playerSplitsBySeason(id);
  const matches = playerGoalMatches(id);
  const appearances = playerLineupMatches(id);
  const minutes = playerGoalMinutes(id);
  const partnerships = playerAssistPartnerships(id);
  const compSplits = playerGoalsByCompetitionType(id);
  const bestRun = p.goals >= 5 ? playerBestScoringRun(id) : null;

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
            ["Apps", p.apps ? String(p.apps) : "—"],
            ["Starts", p.starts ? String(p.starts) : "—"],
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
          Goals reflect recorded scoring events. Appearance totals reflect matches with lineup coverage.
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

      {bySeason.some((s) => s.apps > 0) && (
        <section>
          <h2 className="display text-xl mb-3">Appearances by season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <Bars
              data={bySeason.map((s) => ({ label: s.season.slice(0, 4), value: s.apps }))}
              labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
              height={160}
              color="var(--color-ink-dim)"
            />
            <p className="text-xs text-ink-faint mt-1">
              From the {appearances.length} covered lineups where {p.name} appears.
            </p>
          </div>
        </section>
      )}

      {(compSplits.length > 1 || bestRun) && (
        <section className="grid sm:grid-cols-2 gap-8 max-w-3xl">
          {compSplits.length > 1 && (
            <div>
              <h2 className="display text-xl mb-3">Goals by competition</h2>
              <div className="space-y-1.5 text-sm">
                {compSplits.map((c) => (
                  <div key={c.type} className="flex justify-between border border-line rounded-lg bg-panel px-4 py-2">
                    <span className="text-ink-dim">{TYPE_LABELS[c.type] ?? c.type}</span>
                    <span className="stat-num text-devil-bright">{c.goals}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-faint mt-2">
                Recorded goals only — cup splits depend on scorer coverage for those competitions.
              </p>
            </div>
          )}
          {bestRun && (
            <div>
              <h2 className="display text-xl mb-3">Best scoring run</h2>
              <div className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="stat-num text-3xl font-semibold text-devil-bright">{bestRun.length}</div>
                <div className="text-sm text-ink-dim mt-1">
                  consecutive United matches scored in, {fmtDate(bestRun.from)} – {fmtDate(bestRun.to)}
                </div>
                <p className="text-xs text-ink-faint mt-2">
                  Counted across matches with complete scorer records; gaps in coverage break a run
                  rather than extend it.
                </p>
              </div>
            </div>
          )}
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

      {appearances.length > 0 && (
        <section>
          <h2 className="display text-xl mb-3">Lineup appearances</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm max-w-3xl">
            {appearances.slice(0, 16).map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="border border-line rounded-lg bg-panel px-4 py-2.5 hover:border-devil/60"
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium truncate">{m.opponent_name}</span>
                  <span className="stat-num text-ink-faint">{m.gf}–{m.ga}</span>
                </div>
                <div className="text-xs text-ink-faint mt-1">
                  {fmtDate(m.date)} · {m.started ? "started" : `sub ${m.sub_on != null ? `${m.sub_on}'` : ""}`}
                  {m.role ? ` · ${m.role}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {partnerships.length > 0 && (
        <section>
          <h2 className="display text-xl mb-3">Assist partnerships</h2>
          <div className="space-y-2 max-w-2xl text-sm">
            {partnerships.map((row) => (
              <div key={`${row.assister_id}-${row.scorer_id}`} className="border border-line rounded-lg bg-panel px-4 py-2.5">
                <span className="font-medium">{row.assister_name}</span>
                <span className="text-ink-faint"> assisted </span>
                <span className="font-medium">{row.scorer_name}</span>
                <span className="stat-num text-devil-bright float-right">{row.goals}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline">← All players</Link>
      </p>
    </div>
  );
}
