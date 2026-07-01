import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { managerById, managerMatches, managerTenures, managerTransferSummary, managersIndex } from "@/lib/queries";
import {
  longestStreak, managerFirstMatches, managerResultSequence, managerSplits, notableMatches,
} from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { MatchArchive } from "@/components/MatchArchive";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { NotableMatches } from "@/components/NotableMatches";
import { RunCallouts, type Run } from "@/components/RunCallouts";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { IdentityPlate, type SpanSegment } from "@/components/IdentityPlate";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { ManagerHonoursPanel } from "@/components/ManagerHonoursPanel";
import { StatTile } from "@/components/PageHeader";
import { managerTrophyHaul } from "@/lib/compare";
import { fmtDate, fmtFee, fmtNum, pct, tallyWdl } from "@/lib/format";
import { getDb } from "@/lib/db";
import { queryString } from "@/lib/url";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = managerById(id);
  if (!m) return {};
  const title = `${m.name}`;
  const description = `${m.name} — Manchester United managerial record. ${fmtNum(m.p)} matches managed: ${pct(m.w, m.p)} win rate.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
    },
  };
}

export function generateStaticParams() {
  return sampleStaticIds(managersIndex().map((m) => m.id)).map((id) => ({ id }));
}

/** Date → a fractional year ("1999-08-01" → 1999.58) for placing span bands. */
const dnum = (date: string | null | undefined) => {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(5, 7)) || 1;
  return Number.isFinite(y) ? y + (mo - 1) / 12 : null;
};

export default async function ManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = managerById(id);
  if (!m) notFound();
  const tenures = managerTenures(id);

  const total = m.p;
  const allMatches = managerMatches(id);
  const market = managerTransferSummary(id);

  const comps = getDb()
    .prepare(
      `SELECT c.name, COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? GROUP BY c.id ORDER BY p DESC`,
    )
    .all(id) as { name: string; p: number; w: number; d: number; l: number }[];

  const first10 = m.p >= 10 ? managerFirstMatches(id, 10) : [];
  const splits = managerSplits(id);
  const first10W = tallyWdl(first10).w;
  const bendRows: [label: string, rec: typeof splits.home][] = [
    ["Home", splits.home],
    ["Away", splits.away],
    ["League", splits.league],
    ["Domestic cup", splits.domesticCup],
    ["European cup", splits.europeanCup],
  ];
  // Most-played split, shared across *all* the split bars so their volume lanes are
  // comparable across both groups: the √-scaled rule under each bar runs to its games
  // played, the busiest split reaching the lane's end.
  const liveSplits = bendRows.filter(([, r]) => r.p > 0);
  const splitPMax = Math.max(1, ...liveSplits.map(([, r]) => r.p));
  // Venue and competition are two different cuts of the same matches; group them so
  // that reads clearly rather than as one flat list of five.
  const splitGroups: [label: string, rows: typeof bendRows][] = [
    ["Home and away", bendRows.slice(0, 2)],
    ["By competition", bendRows.slice(2)],
  ];

  // Best streaks under this manager — a winning run and the longer unbeaten run
  // it sits inside. Both appear only when real, and the unbeaten card is dropped
  // when it would just restate the winning one (same length = the same streak).
  const sequence = managerResultSequence(id);
  const winning = longestStreak(sequence, "winning");
  const unbeaten = longestStreak(sequence, "unbeaten");
  const runs: Run[] = [];
  if (winning && winning.length >= 3)
    runs.push({ n: winning.length, label: "wins in a row", tone: "text-win", from: winning.from, to: winning.to });
  if (unbeaten && unbeaten.length >= 3 && (!winning || unbeaten.length > winning.length))
    runs.push({ n: unbeaten.length, label: "unbeaten", tone: "text-win", from: unbeaten.from, to: unbeaten.to });

  // Standout matches: biggest win / heaviest defeat under the tenure, plus the
  // match that ended the longest unbeaten run (placed next to the run callout).
  const notable = notableMatches(sequence, [{ streak: unbeaten, noun: "unbeaten run" }]);

  // The tenure(s) as bands on the plate rail. Bounds run from the earliest spell
  // (or first match) to the latest end (or last match); an open spell runs to the end.
  const y0 = Math.min(...[dnum(m.first), ...tenures.map((t) => dnum(t.date_from))].filter((n): n is number => n != null));
  const y1 = Math.max(...[dnum(m.last), ...tenures.map((t) => dnum(t.date_to) ?? dnum(m.last))].filter((n): n is number => n != null));
  const span = Math.max(0.5, y1 - y0);
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const tenureBands: SpanSegment[] = tenures
    .map((t): SpanSegment | null => {
      const a = dnum(t.date_from);
      const b = dnum(t.date_to) ?? y1;
      if (a == null) return null;
      return { from: clamp01((a - y0) / span), to: clamp01((b - y0) / span), title: t.note ?? undefined };
    })
    .filter((s): s is SpanSegment => s != null);
  const tenureCaption = tenures
    .map((t) => `${fmtDate(t.date_from)}–${t.date_to ? fmtDate(t.date_to) : "present"}${t.note ? ` (${t.note})` : ""}`)
    .join(" · ");

  return (
    <div className="space-y-8">
      <DetailBreadcrumb
        segments={[
          { label: "Managers", href: "/managers" },
          { label: m.name },
        ]}
      />
      <IdentityPlate
        eyebrow={m.role ?? "Manager"}
        share={{ path: `/manager/${m.id}`, title: `${m.name} — Manchester United record` }}
        leading={<PlayerPortrait name={m.name} src={m.thumb_url ?? m.image_url} size="lg" />}
        title={m.name}
        subtitle={
          <>
            {m.nationality && <span>{m.nationality}</span>}
            {m.nationality && <span aria-hidden className="text-ink-faint">·</span>}
            <span>{m.first?.slice(0, 4)}–{tenures.some((t) => !t.date_to) ? "present" : m.last?.slice(0, 4)}</span>
          </>
        }
        record={m}
        span={{
          leftLabel: "Took charge",
          left: <span className="stat-num text-ink">{m.first?.slice(0, 4)}</span>,
          rightLabel: tenures.some((t) => !t.date_to) ? "Present" : "Last match",
          right: <span className="stat-num text-ink">{m.last?.slice(0, 4)}</span>,
          segments: tenureBands,
          caption: tenureCaption,
        }}
      />

      <section>
        <SectionHead title="Trophy cabinet" aside="major honours won in charge" />
        <ManagerHonoursPanel haul={managerTrophyHaul(id)} winPct={total > 0 ? (m.w / total) * 100 : null} />
        <CoverageNote slice="league titles and knockout cups won, attributed to the manager of the decisive match." />
      </section>

      {runs.length > 0 && (
        <section>
          <SectionHead title="Longest runs" aside="under this manager" />
          <RunCallouts runs={runs} empty="" className="flex flex-wrap gap-3" />
          <CoverageNote slice="consecutive competitive matches under this manager." />
        </section>
      )}

      {market && (market.signings > 0 || market.departures > 0) && (
        <section>
          <SectionHead title="In the market" aside="known fees, during the tenure" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label="Net spend"
              value={market.net >= 0 ? fmtFee(market.net) : `+${fmtFee(-market.net)}`}
              detail={market.net >= 0 ? undefined : "net gain"}
              tone={market.net >= 0 ? "red" : "default"}
            />
            <StatTile label="Spent" value={fmtFee(market.spend)} detail={`${fmtNum(market.signings)} signings`} tone="red" />
            <StatTile label="Received" value={fmtFee(market.received)} detail={`${fmtNum(market.departures)} departures`} tone="gold" />
            <StatTile label="Transfers" value={fmtNum(market.signings + market.departures)} detail="signings and departures" />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Fees for arrivals and departures dated within the tenure, known fees only.{" "}
            <Link href="/transfers" className="text-devil-bright hover:underline">
              All transfers →
            </Link>
          </p>
        </section>
      )}

      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <SectionHead title="Match splits" aside="venue · competition" />
          <div className="space-y-5 rounded-xl border border-line bg-panel p-4 sm:p-5">
            {splitGroups.map(([groupLabel, rows], gi) => {
              const live = rows.filter(([, r]) => r.p > 0);
              if (live.length === 0) return null;
              return (
                <div key={groupLabel} className={gi > 0 ? "space-y-3 border-t border-line/60 pt-4" : "space-y-3"}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    {groupLabel}
                  </p>
                  {live.map(([label, r]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-ink-dim">{label}</span>
                        <span className="stat-num text-xs text-ink-faint">
                          <span className="text-ink">{pct(r.w, r.p)}</span> W
                        </span>
                      </div>
                      <WdlBar
                        w={r.w}
                        d={r.d}
                        l={r.l}
                        size="md"
                        showLabels
                        volume={{ fraction: Math.sqrt(r.p / splitPMax), games: r.p }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
            <CoverageNote slice="every match managed, cut by venue and by competition." />
          </div>
        </div>
        {first10.length === 10 && (
          <div>
            <SectionHead title="The first ten matches" aside={`${first10W} of 10 won`} />
            <MatchList matches={first10} showSeason />
            <p className="mt-2 text-xs text-ink-faint">
              {first10W} of the first 10 won.{" "}
              <Link href="/questions/ferguson-era" className="text-devil-bright hover:underline">
                Where did the title floor go? →
              </Link>
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Every competition" aside={`${fmtNum(comps.length)} competitions`} />
        <div className="grid sm:grid-cols-2 gap-2 max-w-3xl text-sm">
          {comps.map((c) => (
            <div key={c.name} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-2.5">
              <span className="truncate">{c.name}</span>
              <span className="stat-num whitespace-nowrap text-xs text-ink-faint">
                <WdlRecord w={c.w} d={c.d} l={c.l} /> ({pct(c.w, c.p)})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Matches" aside={`${fmtNum(total)} managed`} />
        {notable.length > 0 && <NotableMatches matches={notable} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" />}
        {sequence.length >= 20 && (
          <div className="mb-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
            <ResultSpine
              matches={sequence}
              markers={notable.map((m) => ({ id: m.id, label: m.reason }))}
              subject={m.name}
            />
            <p className="mt-2 text-[11px] leading-4 text-ink-faint">
              Every match in order — wins above the line, losses below, bar height the goal margin.
              Gold pips mark the standout matches above.
            </p>
          </div>
        )}
        <div className="mb-3 flex justify-end">
          <EvidenceLink href={`/matches?manager=${id}`} label="Filter these in the match browser →" />
        </div>
        <MatchArchive
          matches={allMatches}
          accentResult
          hrefForSeason={(season) => `/matches${queryString({ manager: id, season })}`}
        />
        <CoverageNote slice="every competitive match under this manager, all competitions" />
      </section>
    </div>
  );
}
