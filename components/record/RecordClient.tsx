"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { EventRow, LineupRow, MatchRow, MatchSourceRecord, OpponentRecord, PlayerTotals } from "@/lib/queries";
import { fmtDateLong, fmtNum, homeAwayLabel } from "@/lib/format";

type Kind = "match" | "player" | "opponent";
type MatchRecord = {
  match: MatchRow;
  events: EventRow[];
  lineup: LineupRow[];
  elo: { elo_pre: number; elo_post: number; opp_elo_pre: number; expected: number } | null;
  sources: MatchSourceRecord[];
};
type PlayerRecord = {
  player: PlayerTotals;
  seasons: { season: string; apps: number; starts: number; goals: number; assists: number; minutes: number }[];
};
type RecordData = MatchRecord | PlayerRecord | OpponentRecord;

function recordUrl(kind: Kind, id: string): string {
  if (kind === "opponent") return "/api/v1/opponents";
  return `/api/v1/${kind === "match" ? "matches" : "players"}/${encodeURIComponent(id)}`;
}

const subscribeToLegacyPath = () => () => {};
const legacyPathOnServer = () => "";
const legacyPathInBrowser = () => window.location.pathname;

export function RecordClient() {
  const params = useSearchParams();
  const legacyPath = useSyncExternalStore(subscribeToLegacyPath, legacyPathInBrowser, legacyPathOnServer);
  const legacyMatch = legacyPath.match(/^\/(match|player|opponent)\/([^/]+)\/?$/);
  const legacy = legacyMatch ? { kind: legacyMatch[1] as Kind, id: decodeURIComponent(legacyMatch[2]!) } : null;
  const kind = (params.get("kind") as Kind | null) ?? legacy?.kind ?? null;
  const id = params.get("id") ?? legacy?.id ?? "";
  const [state, setState] = useState<{ key: string; data?: RecordData; error?: string }>({ key: "" });
  const key = `${kind}:${id}`;

  useEffect(() => {
    if (!id || !kind || !["match", "player", "opponent"].includes(kind)) return;
    const controller = new AbortController();
    fetch(recordUrl(kind, id), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This record was not found." : "The record could not be loaded.");
        const envelope = await response.json() as { data: RecordData | OpponentRecord[] };
        const value = envelope.data;
        if (kind === "opponent") {
          const opponent = (value as OpponentRecord[]).find((row) => row.id === id);
          if (!opponent) throw new Error("This record was not found.");
          return opponent;
        }
        return value as RecordData;
      })
      .then((data) => setState({ key, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : "The record could not be loaded." });
      });
    return () => controller.abort();
  }, [id, kind, key]);

  if (!id || !kind || !["match", "player", "opponent"].includes(kind)) {
    return <RecordFrame title="Archive record"><p>Choose a match from <Link href="/matches" className="text-devil-bright hover:underline">the fixture record</Link>.</p></RecordFrame>;
  }
  if (state.key !== key) return <RecordFrame title="Archive record"><p role="status">Opening the record…</p></RecordFrame>;
  if (state.error) return <RecordFrame title="Record unavailable"><p role="alert">{state.error}</p><p className="mt-4"><Link href="/matches" className="text-devil-bright hover:underline">Search the fixture record</Link></p></RecordFrame>;
  if (!state.data) return <RecordFrame title="Archive record"><p role="status">Opening the record…</p></RecordFrame>;

  if (kind === "match") return <MatchRecordView data={state.data as MatchRecord} />;
  if (kind === "player") return <PlayerRecordView data={state.data as PlayerRecord} />;
  return <OpponentRecordView data={state.data as OpponentRecord} />;
}

function RecordFrame({ title, eyebrow = "Fixture record", children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-4xl space-y-7 pb-16">
      <header className="border-b border-line pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">{eyebrow}</p>
        <h1 className="display text-2xl sm:text-4xl">{title}</h1>
      </header>
      {children}
    </section>
  );
}

function MatchRecordView({ data }: { data: MatchRecord }) {
  const { match, events, lineup, elo, sources } = data;
  const starters = lineup.filter((row) => row.player_side === "united" && row.started === 1);
  const sourceGroups = new Map<string, { source: MatchSourceRecord; facets: Set<string> }>();
  for (const source of sources) {
    const key = `${source.id}:${source.url ?? ""}`;
    const group = sourceGroups.get(key) ?? { source, facets: new Set<string>() };
    group.facets.add(`${source.facet} (${source.confidence})`);
    sourceGroups.set(key, group);
  }
  return (
    <RecordFrame title={`United ${match.gf}–${match.ga} ${match.opponent_name}`} eyebrow="Match record">
      <div className="grid gap-4 rounded-lg border border-line bg-panel p-5 sm:grid-cols-3">
        <Fact label="Date" value={fmtDateLong(match.date)} />
        <Fact label="Competition" value={match.competition_name} />
        <Fact label="Venue" value={`${homeAwayLabel(match.venue)}${match.stadium_name ? ` · ${match.stadium_name}` : ""}`} />
        <Fact label="Season" value={<Link href={`/matches?season=${encodeURIComponent(match.season)}`} className="text-devil-bright hover:underline">{match.season}</Link>} />
        <Fact label="Round" value={match.round ?? "Not recorded"} />
        <Fact label="Attendance" value={match.attendance == null ? "Not recorded" : fmtNum(match.attendance)} />
      </div>

      {match.notes && <section className="rounded-lg border border-line bg-pitch/40 p-5"><h2 className="mb-2 text-lg font-semibold">Match notes</h2><p className="text-ink-dim">{match.notes}</p></section>}

      <section className="rounded-lg border border-line bg-pitch/40 p-5">
        <h2 className="mb-3 text-lg font-semibold">Recorded events</h2>
        {events.length ? (
          <ol className="divide-y divide-line text-sm">
            {events.map((event, index) => (
              <li key={`${event.seq}-${index}`} className="flex gap-4 py-2.5">
                <span className="stat-num w-12 shrink-0 text-ink-faint">{event.minute == null ? "—" : `${event.minute}${event.added_time ? `+${event.added_time}` : ""}′`}</span>
                <span><span className="font-medium">{event.player_display_name ?? "Unknown scorer"}</span> <span className="text-ink-dim">· {event.type.replaceAll("-", " ")} · {event.player_side === "united" ? "United" : "Opposition"}</span>{event.assist_display_name && <span className="block text-ink-faint">Assist: {event.assist_display_name}</span>}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-ink-dim">No event detail is recorded for this match. The result itself remains in the complete fixture record.</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-line bg-pitch/40 p-5">
          <h2 className="mb-3 text-lg font-semibold">United starters</h2>
          {starters.length ? <ol className="grid grid-cols-2 gap-2 text-sm">{starters.map((player, index) => <li key={`${player.player_id ?? player.player_display_name}-${index}`}>{player.shirt != null && <span className="stat-num mr-2 text-ink-faint">{player.shirt}</span>}{player.player_display_name}</li>)}</ol> : <p className="text-sm text-ink-dim">A starting XI is not recorded for this match.</p>}
        </section>
        <section className="rounded-lg border border-line bg-pitch/40 p-5">
          <h2 className="mb-3 text-lg font-semibold">Record context</h2>
          <dl className="space-y-2 text-sm"><Fact label="Manager" value={match.manager_name ?? "Not recorded"} /><Fact label="Half time" value={match.ht_gf == null ? "Not recorded" : `${match.ht_gf}–${match.ht_ga}`} /><Fact label="Elo movement" value={elo ? `${Math.round(elo.elo_pre)} → ${Math.round(elo.elo_post)}` : "Not recorded"} /></dl>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-pitch/40 p-5">
        <h2 className="mb-2 text-lg font-semibold">Sources and coverage</h2>
        <p className="mb-3 text-sm text-ink-dim">Result data is complete; event and lineup detail varies by match and era.</p>
        {sourceGroups.size ? <ul className="space-y-3 text-sm">{[...sourceGroups.values()].map(({ source, facets }) => <li key={`${source.id}:${source.url ?? ""}`}><span className="font-medium">{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="text-devil-bright hover:underline">{source.label}</a> : source.label}</span><span className="block text-ink-faint">{[...facets].join(" · ")}</span>{source.source_note && <span className="block text-ink-dim">{source.source_note}</span>}</li>)}</ul> : <p className="text-sm text-ink-dim">No source detail is attached to this match record.</p>}
      </section>
      <p className="text-xs text-ink-faint">Stable match ID: <span className="stat-num">{match.id}</span> · <Link href="/data" className="text-devil-bright hover:underline">Download the complete dataset</Link></p>
    </RecordFrame>
  );
}

function PlayerRecordView({ data }: { data: PlayerRecord }) {
  const { player, seasons } = data;
  return <RecordFrame title={player.name} eyebrow="Player record">
    <div className="grid gap-4 rounded-lg border border-line bg-panel p-5 sm:grid-cols-3"><Fact label="Appearances" value={fmtNum(player.apps)} /><Fact label="Goals" value={fmtNum(player.goals)} /><Fact label="Recorded assists" value={fmtNum(player.assists)} /></div>
    <p className="text-sm text-ink-dim">Career totals can include verified player records beyond the match sheets. Season detail below reflects available lineup, scorer, and assist coverage.</p>
    {player.record_source_url && <p className="text-sm"><a href={player.record_source_url} target="_blank" rel="noreferrer" className="text-devil-bright hover:underline">Source for career totals</a></p>}
    <section className="overflow-x-auto rounded-lg border border-line bg-pitch/40 p-5"><h2 className="mb-3 text-lg font-semibold">Recorded seasons</h2>{seasons.length ? <table className="w-full text-left text-sm"><thead className="text-ink-faint"><tr><th className="pb-2">Season</th><th className="pb-2 text-right">Apps</th><th className="pb-2 text-right">Goals</th><th className="pb-2 text-right">Assists</th></tr></thead><tbody>{seasons.map((season) => <tr key={season.season} className="border-t border-line"><td className="py-2"><Link href={`/seasons/${season.season}`} className="text-devil-bright hover:underline">{season.season}</Link></td><td className="stat-num text-right">{season.apps}</td><td className="stat-num text-right">{season.goals}</td><td className="stat-num text-right">{season.assists}</td></tr>)}</tbody></table> : <p className="text-ink-dim">No season breakdown is recorded.</p>}</section>
    <p className="text-xs text-ink-faint">Stable player ID: <span className="stat-num">{player.player_id}</span> · <Link href="/data" className="text-devil-bright hover:underline">Download the complete dataset</Link></p>
  </RecordFrame>;
}

function OpponentRecordView({ data }: { data: OpponentRecord }) {
  return <RecordFrame title={data.name} eyebrow="Opponent record">
    <div className="grid gap-4 rounded-lg border border-line bg-panel p-5 sm:grid-cols-3"><Fact label="Meetings" value={fmtNum(data.p)} /><Fact label="United wins" value={fmtNum(data.w)} /><Fact label="Draws / losses" value={`${data.d} / ${data.l}`} /></div>
    <p className="text-sm text-ink-dim">Recorded meetings from {data.first} to {data.last}. United scored {data.gf} and conceded {data.ga}.</p>
    <Link href={`/matches?opponent=${encodeURIComponent(data.id)}`} className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-devil-bright hover:bg-panel">See every meeting →</Link>
    <p className="text-xs text-ink-faint">Stable opponent ID: <span className="stat-num">{data.id}</span> · <Link href="/data" className="text-devil-bright hover:underline">Download the complete dataset</Link></p>
  </RecordFrame>;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</dt><dd className="mt-1 text-sm font-medium text-ink">{value}</dd></div>;
}
