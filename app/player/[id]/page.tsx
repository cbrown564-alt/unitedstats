import Link from "next/link";
import { notFound } from "next/navigation";
import {
  playerAssistPartnerships, playerById, playerGoalMatches, playerGoalMinutes,
  playerLineupMatches, playerShirtNumbersByDecade, playerSplitsBySeason,
} from "@/lib/queries";
import { playerBestScoringRun, playerGoalsByCompetitionType } from "@/lib/trails";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { MatchList } from "@/components/MatchList";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ShirtBadge } from "@/components/ShirtBadge";
import { fmtDate, fmtNum } from "@/lib/format";

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
  const shirts = playerShirtNumbersByDecade(id);
  const minutes = playerGoalMinutes(id);
  const partnerships = playerAssistPartnerships(id);
  const compSplits = playerGoalsByCompetitionType(id);
  const bestRun = p.goals >= 5 ? playerBestScoringRun(id) : null;

  const buckets = [0, 0, 0, 0, 0, 0];
  for (const m of minutes) buckets[Math.min(Math.floor((m - 1) / 15), 5)]++;
  const bucketLabels = ["1–15", "16–30", "31–45", "46–60", "61–75", "76–90+"];

  return (
    <div className="space-y-10">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">Player</p>
          <h1 className="display text-4xl">{p.name}</h1>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-xl">
            {[
              ["Apps", p.apps ? String(p.apps) : "—"],
              ["Starts", p.starts ? String(p.starts) : "—"],
              ["Sub apps", p.subs ? String(p.subs) : "—"],
              ["Goals", String(p.goals)],
              ["Lineup rows", String(p.lineup_apps)],
              ["Recorded goals", String(p.recorded_goals)],
            ].map(([k, v]) => (
              <div key={k} className="bg-panel px-4 py-3">
                <div className="stat-num text-2xl font-semibold">{v}</div>
                <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{k}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint mt-3 max-w-xl">
            Headline apps and goals use verified competitive player records where available.
            Match lists and assist counts reflect local scorer and lineup coverage.
          </p>
          {shirts.length > 0 && (
            <div className="mt-4 flex max-w-3xl flex-wrap gap-2">
              {shirts.map((shirt) => (
                <div key={`${shirt.decade}-${shirt.shirt}`} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2">
                  <ShirtBadge number={shirt.shirt} decade={shirt.decade} apps={shirt.apps} />
                  <span className="text-xs leading-4 text-ink-faint">
                    <span className="stat-num text-ink">{fmtNum(shirt.apps)}</span> covered apps
                    {shirt.starts ? `, ${fmtNum(shirt.starts)} starts` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:justify-self-end">
          <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} size="lg" />
          {p.player_image_page_url && (
            <a
              href={p.player_image_page_url}
              className="mt-2 block max-w-40 text-xs text-ink-faint hover:text-devil-bright"
            >
              Wikimedia Commons{p.player_image_license ? ` · ${p.player_image_license}` : ""}
            </a>
          )}
        </div>
      </header>

      {bySeason.length > 1 && (
        <section>
          <h2 className="display text-xl mb-3">Goals by season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <InspectableBarChart
              data={bySeason.map((s) => ({
                label: s.season.slice(0, 4),
                value: s.goals,
                valueLabel: `${fmtNum(s.goals)} goals`,
                meta: s.season,
                href: `/seasons/${s.season}`,
              }))}
              labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
              chartLabel={`${p.name} goals by season`}
            />
          </div>
        </section>
      )}

      {bySeason.some((s) => s.apps > 0) && (
        <section>
          <h2 className="display text-xl mb-3">Appearances by season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <InspectableBarChart
              data={bySeason.map((s) => ({
                label: s.season.slice(0, 4),
                value: s.apps,
                valueLabel: `${fmtNum(s.apps)} appearances`,
                meta: s.season,
                href: `/seasons/${s.season}`,
              }))}
              labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
              height={160}
              color="var(--color-ink-dim)"
              chartLabel={`${p.name} appearances by season`}
            />
            <p className="text-xs text-ink-faint mt-1">
              From the {appearances.length} covered lineup rows where {p.name} appears.
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
            <InspectableBarChart
              data={buckets.map((n, i) => ({
                label: bucketLabels[i],
                value: n,
                valueLabel: `${fmtNum(n)} goals`,
                meta: "Recorded goal minutes",
              }))}
              height={140}
              color="var(--color-gold)"
              chartLabel={`${p.name} goals by match-minute bucket`}
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
