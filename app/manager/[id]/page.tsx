import Link from "next/link";
import { notFound } from "next/navigation";
import { managerById, managerTenures } from "@/lib/queries";
import { managerFirstMatches, managerSplits } from "@/lib/trails";
import { MatchList } from "@/components/MatchList";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { IdentityPlate, type SpanSegment } from "@/components/IdentityPlate";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { Pager } from "@/components/Pager";
import { fmtDate, fmtNum, pct, tallyWdl } from "@/lib/format";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Date → a fractional year ("1999-08-01" → 1999.58) for placing span bands. */
const dnum = (date: string | null | undefined) => {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(5, 7)) || 1;
  return Number.isFinite(y) ? y + (mo - 1) / 12 : null;
};

export default async function ManagerPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const m = managerById(id);
  if (!m) notFound();
  const tenures = managerTenures(id);
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PAGE = 50;

  const total = m.p;
  const rows = getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, NULL AS stadium_name, NULL AS manager_name
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? ORDER BY m.date DESC LIMIT ? OFFSET ?`,
    )
    .all(id, PAGE, (page - 1) * PAGE) as Parameters<typeof MatchList>[0]["matches"];

  const comps = getDb()
    .prepare(
      `SELECT c.name, COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? GROUP BY c.id ORDER BY p DESC`,
    )
    .all(id) as { name: string; p: number; w: number; d: number; l: number }[];

  const pages = Math.ceil(total / PAGE);
  const first10 = m.p >= 10 ? managerFirstMatches(id, 10) : [];
  const splits = managerSplits(id);
  const first10W = tallyWdl(first10).w;
  const bendRows: [label: string, rec: typeof splits.home][] = [
    ["Home", splits.home],
    ["Away", splits.away],
    ["League", splits.league],
    ["Cups", splits.cup],
  ];

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
    .map((t) => `${fmtDate(t.date_from)} – ${t.date_to ? fmtDate(t.date_to) : "present"}${t.note ? ` (${t.note})` : ""}`)
    .join(" · ");

  return (
    <div className="space-y-8">
      <IdentityPlate
        eyebrow={m.role ?? "Manager"}
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

      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <SectionHead title="Where the record bends" aside="venue · competition" />
          <div className="space-y-3 rounded-xl border border-line bg-panel p-4 sm:p-5">
            {bendRows
              .filter(([, r]) => r.p > 0)
              .map(([label, r]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-ink-dim">{label}</span>
                    <span className="stat-num text-xs text-ink-faint">
                      {fmtNum(r.p)} P · <span className="text-ink">{pct(r.w, r.p)}</span> W
                    </span>
                  </div>
                  <WdlBar w={r.w} d={r.d} l={r.l} />
                </div>
              ))}
            <p className="text-[11px] leading-4 text-ink-faint">
              All matches managed, split by venue and by league v cup competition.
            </p>
          </div>
        </div>
        {first10.length === 10 && (
          <div>
            <SectionHead title="The first ten matches" aside={`${first10W} of 10 won`} />
            <MatchList matches={first10} showSeason />
            <p className="mt-2 text-xs text-ink-faint">
              {first10W} of the first 10 won.{" "}
              <Link href="/questions#manager-bounce" className="text-devil-bright hover:underline">
                Is the new-manager bounce real? →
              </Link>
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="By competition" aside={`${fmtNum(comps.length)} competitions`} />
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
        <MatchList matches={rows} showSeason />
        <Pager page={page} pages={pages} hrefFor={(p) => `/manager/${id}?page=${p}`} className="mt-3" />
        <CoverageNote
          slice="every competitive match under this manager, all competitions"
          coverage={`${fmtNum(total)} matches; caretaker and interim spells are attributed to whoever picked the team on the day.`}
        />
      </section>
    </div>
  );
}
