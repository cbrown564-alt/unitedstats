import Link from "next/link";
import { notFound } from "next/navigation";
import { opponentById, findMatches } from "@/lib/queries";
import {
  longestStreak, opponentCupRecord, opponentResultSequence, opponentVenueSplits,
} from "@/lib/trails";
import { oddsFor } from "@/lib/predict";
import { MatchList } from "@/components/MatchList";
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
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">Head to head</p>
        <h1 className="display text-4xl">United v {o.name}</h1>
        <p className="text-sm text-ink-dim mt-2 stat-num">
          First met {o.first} · last met {o.last}
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-2xl">
          {[
            ["Played", fmtNum(o.p)],
            ["Record", `${o.w}–${o.d}–${o.l}`],
            ["Win rate", pct(o.w, o.p)],
            ["Goals", `${fmtNum(o.gf)}–${fmtNum(o.ga)}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel px-4 py-3">
              <div className="stat-num text-xl font-semibold">{v}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{k}</div>
            </div>
          ))}
        </div>
        <WdlBar w={o.w} d={o.d} l={o.l} size="md" showLabels className="max-w-2xl mt-3" />
      </header>

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
        {pages > 1 && (
          <nav className="flex items-center gap-3 text-sm mt-3">
            {page > 1 && (
              <Link href={`/opponent/${id}?page=${page - 1}`} className="text-devil-bright hover:underline">← Newer</Link>
            )}
            <span className="text-ink-faint stat-num">page {page} / {pages}</span>
            {page < pages && (
              <Link href={`/opponent/${id}?page=${page + 1}`} className="text-devil-bright hover:underline">Older →</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
