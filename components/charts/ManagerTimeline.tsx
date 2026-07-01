import Image from "next/image";
import Link from "next/link";
import { familyName } from "@/lib/names";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import type { ManagerRecord } from "@/lib/queries";

/**
 * The whole managerial succession as one object: every manager since 1892 a
 * segment in chronological order, its *width* the share of all matches he took
 * charge of, filled bottom-up with his win/draw/loss proportions (red
 * foundation → slate roof, like {@link HistorySkyline}). Two segments dwarf the
 * rest — Busby and Ferguson took charge of more than four in every ten United
 * matches between them — so "two dynasties and a lot of scaffolding" is the
 * literal shape of the bar, and the red-heavy giants vs the slate-topped
 * scaffolding between them read the eras' fortunes without a word. Every segment
 * links to its man.
 *
 * Width encodes matches, not calendar years, on purpose: the bar then tiles edge
 * to edge with no gaps and no overlaps — a mid-reign caretaker (Murphy in 1958,
 * Giggs in 2014) is an honest sliver, never a split through a giant's reign — and
 * the inked length is, exactly, every match the club has played. A few year marks
 * ride above to anchor the chronology onto the match-proportional axis.
 *
 * Pure CSS/flex, server-rendered: each segment is a positioned column, crisp at
 * any width with no SVG scaling.
 */
export function ManagerTimeline({ managers }: { managers: ManagerRecord[] }) {
  const rows = managers.filter((m) => m.p > 0 && m.first);
  if (rows.length === 0) return null;
  const totalP = rows.reduce((a, m) => a + m.p, 0);

  // Cumulative left edge (%) per segment along the match-proportional axis.
  // A prefix sum, written without a mutable accumulator (n is tiny).
  const segs = rows.map((m, i) => {
    const before = rows.slice(0, i).reduce((a, x) => a + x.p, 0);
    return { m, left: (before / totalP) * 100, width: (m.p / totalP) * 100 };
  });

  // The two giants anchor the chronology: label their start year at their left
  // edge, alongside the first manager's start and the present day at the ends.
  const giants = [...rows].sort((a, b) => b.p - a.p).slice(0, 2);
  const giantIds = new Set(giants.map((g) => g.id));
  const marks = segs
    .filter((s) => giantIds.has(s.m.id))
    .map((s) => ({ left: s.left, label: s.m.first!.slice(0, 4) }));
  const firstYear = rows[0].first!.slice(0, 4);
  const lastYear = (rows[rows.length - 1].last ?? rows[rows.length - 1].first)!.slice(0, 4);

  // Surname only where the segment is wide enough to hold it; portrait on wider spans.
  const LABEL_MIN_WIDTH = 4.5;
  const PORTRAIT_MIN_WIDTH = 9;

  return (
    <figure className="m-0">
      {/* year anchors above the bar */}
      <div className="relative mb-1 h-3.5">
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint">{firstYear}</span>
        {marks.map((mk) => (
          <span
            key={mk.label}
            className="stat-num absolute -translate-x-1/2 text-[10px] text-gold/80"
            style={{ left: `${mk.left}%` }}
          >
            {mk.label}
          </span>
        ))}
        <span className="stat-num absolute right-0 text-[10px] text-ink-faint">{lastYear}</span>
      </div>

      <div className="relative h-40 w-full sm:h-48">
        <div className="absolute inset-x-0 bottom-0 border-t border-line/70" aria-hidden />
        {/* giant-handover guides, tying the year marks down through the bar */}
        {marks.map((mk) => (
          <div key={mk.label} className="absolute bottom-0 top-0 w-px bg-gold/25" style={{ left: `${mk.left}%` }} aria-hidden />
        ))}

        <div className="absolute inset-0">
          {segs.map(({ m, left, width }) => {
            const p = m.p;
            const winRate = Math.round((100 * m.w) / p);
            const title = `${m.name} · ${m.first?.slice(0, 4)}–${m.last?.slice(0, 4)} · ${p} matches · ${winRate}% win`;
            const surname = familyName(m.name);
            return (
              <Link
                key={m.id}
                href={`/manager/${m.id}`}
                title={title}
                aria-label={title}
                className="group absolute bottom-0 top-0 focus-ring"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <div className="absolute inset-x-px bottom-0 top-0 flex flex-col-reverse overflow-hidden rounded-t-sm ring-0 ring-inset ring-ink/0 transition-[filter,box-shadow] duration-150 group-hover:z-10 group-hover:brightness-125 group-hover:ring-2 group-hover:ring-ink/25">
                  <div className="bg-win/80" style={{ height: `${(m.w / p) * 100}%` }} />
                  <div className="bg-draw/55" style={{ height: `${(m.d / p) * 100}%` }} />
                  <div className="bg-loss/75" style={{ height: `${(m.l / p) * 100}%` }} />
                </div>
                {giantIds.has(m.id) && (m.image_url ?? m.thumb_url) ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-t-sm [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_top,transparent_4%,#000_38%),linear-gradient(to_bottom,transparent_10%,#000_55%)]"
                    aria-hidden
                  >
                    <Image
                      src={m.image_url ?? m.thumb_url!}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 28vw, 320px"
                      className="object-cover object-[center_12%] opacity-[0.28] grayscale contrast-110 transition-opacity duration-150 group-hover:opacity-[0.38]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.35),transparent_45%,rgba(0,0,0,0.12))]" />
                  </div>
                ) : (
                  width >= PORTRAIT_MIN_WIDTH && (
                    <span className="pointer-events-none absolute bottom-2 left-1/2 z-[1] -translate-x-1/2">
                      <PlayerPortrait name={m.name} src={m.thumb_url ?? m.image_url} size="xs" />
                    </span>
                  )
                )}
                {width >= LABEL_MIN_WIDTH && (
                  <span className="pointer-events-none absolute inset-x-0 top-2 z-[2] truncate px-1 text-center text-[10px] font-medium uppercase tracking-wide text-ink/90 [text-shadow:0_1px_2px_rgb(0_0_0_/0.65)]">
                    {surname}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-win/80" />Won</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-draw/45" />Drawn</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-loss/75" />Lost</span>
        <span className="text-ink-dim">Segment width is the share of all matches managed · every segment opens his tenure</span>
      </figcaption>
    </figure>
  );
}
