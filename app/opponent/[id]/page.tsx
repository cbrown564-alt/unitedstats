import Link from "next/link";
import { notFound } from "next/navigation";
import { opponentById, findMatches } from "@/lib/queries";
import {
  longestStreak, opponentCupRecord, opponentResultSequence, opponentVenueSplits,
} from "@/lib/trails";
import { oddsFor } from "@/lib/predict";
import { MatchList } from "@/components/MatchList";
import { Pager } from "@/components/Pager";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
import { EvidenceLink } from "@/components/EvidenceLink";
import { fmtDate, fmtNum, pct, venueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OpponentPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const o = opponentById(id);
  if (!o) notFound();
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PAGE = 50;
  const { rows, total } = findMatches({ opponent: id, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.ceil(total / PAGE);
  const venues = opponentVenueSplits(id);
  const cup = opponentCupRecord(id);
  const sequence = opponentResultSequence(id);
  const unbeaten = longestStreak(sequence, "unbeaten");
  const winless = longestStreak(sequence, "winless");
  const oddsHome = oddsFor(id, "H");
  const oddsAway = oddsFor(id, "A");
  const oddsPanels =
    oddsHome && oddsAway
      ? [
          { label: "At home", odds: oddsHome },
          { label: "Away", odds: oddsAway },
        ]
      : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Head to head"
        title={`United v ${o.name}`}
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-96">
            <StatTile label="Played" value={fmtNum(o.p)} tone="red" />
            <StatTile label="Record" value={`${o.w}–${o.d}–${o.l}`} />
            <StatTile label="Win rate" value={pct(o.w, o.p)} tone="green" />
            <StatTile label="Goals" value={`${fmtNum(o.gf)}–${fmtNum(o.ga)}`} />
          </div>
        }
      >
        <span className="stat-num">First met {o.first} · last met {o.last}</span>
      </PageHeader>
      <WdlBar w={o.w} d={o.d} l={o.l} size="md" className="max-w-2xl" />

      <section className="grid lg:grid-cols-3 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Home and away</h2>
          <div className="space-y-3">
            {venues.map((v) => (
              <div key={v.venue}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-dim">{venueLabel(v.venue)}</span>
                  <span className="stat-num text-xs text-ink-faint">
                    {v.p} P · {pct(v.w, v.p)} W
                  </span>
                </div>
                <WdlBar w={v.w} d={v.d} l={v.l} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <EvidenceLink href={`/matches?opponent=${id}&venue=A`} label="Away meetings only →" />
          </div>
        </div>
        <div>
          <h2 className="display text-xl mb-3">Cup meetings</h2>
          {cup.p > 0 ? (
            <>
              <div className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="stat-num text-2xl font-semibold">
                  {cup.w}–{cup.d}–{cup.l}
                </div>
                <div className="text-xs text-ink-faint mt-1">
                  {cup.p} cup ties · {pct(cup.w, cup.p)} won
                  {cup.first ? ` · ${cup.first.slice(0, 4)}–${cup.last?.slice(0, 4)}` : ""}
                </div>
              </div>
              <div className="mt-3">
                <EvidenceLink href={`/matches?opponent=${id}&type=cup`} label="Show the cup ties →" />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-faint">League meetings only — no cup tie on record.</p>
          )}
        </div>
        <div>
          <h2 className="display text-xl mb-3">Longest runs</h2>
          <div className="space-y-2 text-sm">
            {unbeaten && unbeaten.length >= 3 && (
              <div className="border border-line rounded-lg bg-panel px-4 py-3">
                <span className="stat-num text-win text-lg font-semibold">{unbeaten.length}</span>
                <span className="text-ink-dim"> unbeaten</span>
                <div className="text-xs text-ink-faint mt-0.5 stat-num">
                  {fmtDate(unbeaten.from)} – {fmtDate(unbeaten.to)}
                </div>
              </div>
            )}
            {winless && winless.length >= 3 && (
              <div className="border border-line rounded-lg bg-panel px-4 py-3">
                <span className="stat-num text-loss text-lg font-semibold">{winless.length}</span>
                <span className="text-ink-dim"> without a win</span>
                <div className="text-xs text-ink-faint mt-0.5 stat-num">
                  {fmtDate(winless.from)} – {fmtDate(winless.to)}
                </div>
              </div>
            )}
            {(!unbeaten || unbeaten.length < 3) && (!winless || winless.length < 3) && (
              <p className="text-sm text-ink-faint">No run of 3+ meetings either way.</p>
            )}
          </div>
          <p className="text-xs text-ink-faint mt-2">
            Consecutive meetings in this fixture, all competitions.
          </p>
        </div>
      </section>

      {oddsPanels.length > 0 && (
        <section>
          <h2 className="display text-xl mb-3">If they met tomorrow</h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {oddsPanels.map(({ label, odds }) => (
              <div key={label} className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="text-xs text-ink-faint uppercase tracking-wider mb-1">{label}</div>
                <div className="stat-num text-lg font-semibold">
                  <span className="text-win">{(100 * odds.pW).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> W · </span>
                  <span className="text-draw">{(100 * odds.pD).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> D · </span>
                  <span className="text-loss">{(100 * odds.pL).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> L</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint mt-2 max-w-2xl">
            Closed-universe Elo at today&apos;s ratings, split by the historical record at that
            expectancy; {o.name}&apos;s rating last moved when the sides last met ({o.last}).{" "}
            <Link href={`/analytics/odds?opponent=${id}`} className="text-devil-bright hover:underline">
              How this is computed →
            </Link>
          </p>
        </section>
      )}

      <section>
        <h2 className="display text-xl mb-3">All meetings</h2>
        <MatchList matches={rows} showSeason />
        <Pager page={page} pages={pages} hrefFor={(p) => `/opponent/${id}?page=${p}`} className="mt-3" />
      </section>

      <section>
        <h2 className="display mb-3 text-xl">Keep exploring</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TrailLink href={`/matches?opponent=${id}&venue=A`} title="Away record">
            Every meeting at their ground, where bogey records usually live.
          </TrailLink>
          {cup.p > 0 && (
            <TrailLink href={`/matches?opponent=${id}&type=cup`} title="Cup ties">
              The {cup.p} knockout meeting{cup.p === 1 ? "" : "s"} between the sides.
            </TrailLink>
          )}
          <TrailLink href="/opponents" title="All opponents">
            Compare this head-to-head against every other side United have faced.
          </TrailLink>
        </div>
      </section>
    </div>
  );
}
