import Link from "next/link";
import {
  ownGoalForEvents, ownGoalScorers, ownGoalSummary, playersIndex,
} from "@/lib/queries";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { fmtDate, fmtNum, scoreline, venuePrefix } from "@/lib/format";

/**
 * The synthetic "Own Goal" scorer's profile. Stands in for a player page at
 * /player/own-goal: instead of a career, it shows how the 200-odd own goals
 * gifted to United break down by the opposition players who scored them — the
 * per-event detail behind the aggregate that ranks among United's top scorers.
 */
export function OwnGoalProfile() {
  const summary = ownGoalSummary();
  const scorers = ownGoalScorers();
  const events = ownGoalForEvents();
  const rank = playersIndex().findIndex((p) => p.player_id === "own-goal") + 1;
  const repeat = scorers.filter((s) => s.n > 1);
  const portraitByScorer = new Map(
    scorers.map((s) => [s.name, s.thumb_url ?? s.image_url] as const),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Scorer"
        title="Own Goal"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-80">
            <StatTile label="Own goals for United" value={fmtNum(summary.total)} tone="red" />
            <StatTile label="All-time rank" value={rank ? `#${rank}` : "—"} tone="gold" detail="among United scorers" />
            <StatTile label="Different scorers" value={fmtNum(summary.scorers)} />
            <StatTile label="Span" value={`${summary.first.slice(0, 4)}–${summary.last.slice(0, 4)}`} />
          </div>
        }
      >
        Not a person — a tally. Every goal an opponent has turned into his own net in United&apos;s favour,
        gathered under one name. Counted together they have been gifted to United {fmtNum(summary.total)} times,
        enough to rank{rank ? ` #${rank}` : ""} among the club&apos;s all-time scorers — by {fmtNum(summary.scorers)}{" "}
        different opposition players, no one of them more than {repeat[0]?.n ?? 1} times.
        {summary.unknown > 0 && (
          <span className="text-ink-faint">
            {" "}({fmtNum(summary.unknown)} older own goals carry no recorded scorer.)
          </span>
        )}
      </PageHeader>

      {repeat.length > 0 && (
        <section className="space-y-3">
          <h2 className="display text-xl">Done it more than once</h2>
          <p className="max-w-2xl text-sm text-ink-dim">
            The handful of players who have put through their own net against United on more than one occasion.
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel text-sm">
            {repeat.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <PlayerPortrait name={s.name} src={s.thumb_url ?? s.image_url} size="xs" />
                  <span className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <Link href={`/opponent/${s.recent_opponent_id}`} className="ml-2 text-ink-faint hover:text-devil-bright">
                      {s.recent_opponent}
                    </Link>
                  </span>
                </span>
                <span className="stat-num shrink-0 text-ink-faint">
                  <span className="text-devil-bright">{fmtNum(s.n)}</span> · last{" "}
                  <Link href={`/match/${s.recent_match_id}`} className="hover:text-devil-bright">{s.last.slice(0, 4)}</Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-xl">Every own goal for United</h2>
          <span className="stat-num text-xs text-ink-faint">{fmtNum(events.length)} goals, newest first</span>
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-pitch/35">
          {events.map((e, i) => (
            <li key={`${e.match_id}-${i}`}>
              <Link
                href={`/match/${e.match_id}`}
                className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel sm:px-4"
              >
                <span className="stat-num w-20 shrink-0 text-xs text-ink-dim">{fmtDate(e.date)}</span>
                <PlayerPortrait
                  name={e.scorer ?? "Unknown"}
                  src={e.scorer ? portraitByScorer.get(e.scorer) : null}
                  size="xs"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    <span className="font-medium">{e.scorer ?? "Unknown"}</span>
                    <span className="text-ink-faint"> · {venuePrefix(e.venue)} {e.opponent_name}</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {e.minute != null && <span className="stat-num text-xs text-ink-faint">{e.minute}&prime;</span>}
                  <span className="stat-num rounded bg-panel-2 px-2 py-1 text-xs font-semibold">{scoreline(e.gf, e.ga)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline">← All players</Link>
      </p>
    </div>
  );
}
