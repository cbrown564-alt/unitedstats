import { fmtFee } from "@/lib/format";
import type { SpendYear } from "@/lib/queries";

/**
 * The whole transfer record as one object: a diverging money tide, every year a
 * column on a single shared £ scale — spend rising in devil-red above the £0 line,
 * receipts falling in gold below. So the *shape* is the story the page is about:
 * nearly a century pinned flat to the line (fees went largely unpublished before
 * the 1970s), then the modern explosion swelling up the right, gold sale-years
 * notching down through it. The peak spend and peak sales years ride as pips in
 * their own colour at the tallest bars' crests.
 *
 * Beneath the tide, a thin neutral strip carries what the fees can't — the raw
 * count of players moved each year, recorded right back to Newton Heath — so the
 * pre-fee century reads as *busy with unrecorded business*, not empty. Two units,
 * two clearly separated registers, one timeline.
 *
 * Built like {@link FinishTimeline}/{@link HistorySkyline}: an honest linear time
 * axis with absolutely-positioned bars (a missing year is a real gap), pure
 * positioned HTML so the bars stay crisp at any width.
 */

// Vertical layout of the tide box (% of its height): headroom above the tallest
// spend bar for its label, and a deeper footroom below so the receipts-peak label
// drops clear of the bars rather than overlapping them.
const TOP_M = 6;
const BOT_M = 17;
const USABLE = 100 - TOP_M - BOT_M;

export function SpendTide({ years }: { years: SpendYear[] }) {
  if (years.length === 0) return null;
  const rows = [...years].sort((a, b) => a.year - b.year);
  const minY = rows[0].year;
  const maxY = rows[rows.length - 1].year;
  const span = Math.max(1, maxY - minY);

  const maxSpend = Math.max(1, ...rows.map((r) => r.spend));
  const maxRecv = Math.max(1, ...rows.map((r) => r.received));
  const maxVol = Math.max(1, ...rows.map((r) => r.signings + r.departures));

  // The aggregate peaks: the years United spent and banked the most. These are
  // the tide's tallest bars, so they *are* its climax — annotate them rather than
  // a single record deal whose bar sits lower (the leaderboards below name those).
  const peakSpend = rows.reduce((a, b) => (b.spend > a.spend ? b : a));
  const peakRecv = rows.reduce((a, b) => (b.received > a.received ? b : a));

  // £0 line: split the usable band so spend and receipts share one pixels-per-pound
  // scale (spend dwarfs receipts, so it gets the larger upper band).
  const C = TOP_M + (maxSpend / (maxSpend + maxRecv)) * USABLE; // centre line, % from top
  const K = (0.95 * USABLE) / (maxSpend + maxRecv); // % of box per £
  const spendH = (v: number) => v * K;
  const recvH = (v: number) => v * K;

  const X_PAD = 1.5;
  const x = (year: number) => X_PAD + ((year - minY) / span) * (100 - 2 * X_PAD);
  const barW = ((100 - 2 * X_PAD) / span) * 0.82;

  // The fee era proper begins when annual published fees first cross seven figures
  // (~1972). Earlier years carry only scattered, tiny recorded fees, so the whole
  // stretch before it is shaded as "largely undisclosed" — not just the 1800s.
  const feeEraStart = (rows.find((r) => r.spend + r.received >= 1_000_000) ?? rows[rows.length - 1]).year;

  // 20-year guides, dropped near the pinned edge labels (the HistorySkyline rule).
  const ticks: { year: number; left: number; label: string }[] = [];
  for (let y = Math.ceil(minY / 20) * 20; y <= maxY; y += 20) {
    const left = x(y);
    if (left < 8 || left > 92) continue;
    ticks.push({ year: y, left, label: y % 100 === 0 ? String(y) : `’${String(y).slice(2)}` });
  }

  return (
    <figure className="m-0">
      {/* the money tide */}
      <div className="relative h-48 w-full sm:h-60">
        {/* pre-fee era: shaded across to the fee era + labelled, so the flat early
            line reads as "no published fees", not "no business" */}
        <div
          className="absolute inset-y-0 left-0 flex items-start justify-center bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.03)_0,rgb(255_255_255/0.03)_2px,transparent_2px,transparent_7px)]"
          style={{ width: `${x(feeEraStart)}%` }}
          aria-hidden
        >
          <span className="mt-2 max-w-[14rem] text-center text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-ink-faint">
            Fees largely undisclosed before the 1970s
          </span>
        </div>

        {/* 20-year guides */}
        {ticks.map((t) => (
          <div key={t.year} className="absolute inset-y-0 w-px bg-line/30" style={{ left: `${t.left}%` }} aria-hidden />
        ))}

        {/* the £0 line the tide diverges from */}
        <div className="absolute inset-x-0 border-t border-line/70" style={{ top: `${C}%` }} aria-hidden />
        <span className="stat-num absolute right-0 -translate-y-1/2 text-[10px] text-ink-faint" style={{ top: `${C}%` }}>
          £0
        </span>

        {/* bars */}
        {rows.map((r) => {
          const net = r.spend - r.received;
          const title = `${r.year} · spent ${fmtFee(r.spend)} · received ${fmtFee(r.received)} · net ${
            net >= 0 ? fmtFee(net) : `−${fmtFee(-net)}`
          } · ${r.signings} in, ${r.departures} out`;
          return (
            <div
              key={r.year}
              className="absolute inset-y-0 -translate-x-1/2"
              style={{ left: `${x(r.year)}%`, width: `${barW}%` }}
              title={title}
            >
              {r.spend > 0 && (
                <div
                  className="absolute inset-x-0 rounded-t-[1px] bg-devil"
                  style={{ bottom: `${100 - C}%`, height: `${spendH(r.spend)}%` }}
                />
              )}
              {r.received > 0 && (
                <div
                  className="absolute inset-x-0 rounded-b-[1px] bg-gold"
                  style={{ top: `${C}%`, height: `${recvH(r.received)}%` }}
                />
              )}
            </div>
          );
        })}

        {/* peak-year pips — the most spent and the most banked in a single year,
            each in its bar's colour, label nudged clear of the bars */}
        <PeakPip
          kind="spend"
          top={C - spendH(peakSpend.spend)}
          left={x(peakSpend.year)}
          figure={fmtFee(peakSpend.spend)}
          label={`biggest spend, ${peakSpend.year}`}
        />
        <PeakPip
          kind="recv"
          top={C + recvH(peakRecv.received)}
          left={x(peakRecv.year)}
          figure={fmtFee(peakRecv.received)}
          label={`biggest sales, ${peakRecv.year}`}
        />
      </div>

      {/* the people-flow strip — every year's business by count, the whole timeline.
          Title sits above its own band so it never collides with the bars. */}
      <div className="mt-3 w-full">
        <div className="mb-1 flex justify-end">
          <span className="text-[9px] uppercase tracking-[0.12em] text-ink-faint">players moved / year</span>
        </div>
        <div className="relative h-12 border-t border-line/40">
          {rows.map((r) => (
            <div
              key={r.year}
              className="absolute bottom-0 -translate-x-1/2 rounded-t-[1px] bg-ink-faint/45"
              style={{ left: `${x(r.year)}%`, width: `${barW}%`, height: `${((r.signings + r.departures) / maxVol) * 88}%` }}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* decade axis */}
      <div className="relative mt-1 h-3.5">
        {ticks.map((t) => (
          <span key={t.year} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${t.left}%` }}>
            {t.label}
          </span>
        ))}
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint">{minY}</span>
        <span className="stat-num absolute right-0 text-[10px] text-ink-faint">{maxY}</span>
      </div>

      {/* legend — encoding stated once, where colour carries meaning */}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-devil" />Spent</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" />Received</span>
        <span className="text-ink-dim">Bar height is the year&rsquo;s known fees on one shared scale · spend up, receipts down · pips mark the peak years</span>
      </figcaption>
    </figure>
  );
}

/**
 * A pip + hairline label marking a peak year on the tide, in the bar's own colour
 * (red for spend, gold for receipts). The dot sits at the bar's crest; the label
 * is nudged away from the bars — up into the headroom for spend, down into the
 * footroom for receipts — and flips to the pip's left near the right edge so it
 * never spills out of the box.
 */
function PeakPip({
  kind,
  top,
  left,
  figure,
  label,
}: {
  kind: "spend" | "recv";
  top: number;
  left: number;
  figure: string;
  label: string;
}) {
  const onLeft = left > 55;
  const isSpend = kind === "spend";
  const figureCls = isSpend ? "text-devil-bright" : "text-gold";
  const dotCls = isSpend ? "bg-devil ring-devil/30" : "bg-gold ring-gold/30";
  return (
    <>
      <span
        className={`absolute z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_var(--color-panel)] ring-2 ${dotCls}`}
        style={{ top: `${top}%`, left: `${left}%` }}
        aria-hidden
      />
      <div
        className="absolute z-10 flex items-baseline gap-1 whitespace-nowrap"
        style={{
          top: `${isSpend ? top - 1.5 : top + 2.5}%`,
          left: `${left}%`,
          transform: `translate(${onLeft ? "-100%" : "0"}, ${isSpend ? "-100%" : "0"})`,
        }}
        title={`${label}: ${figure}`}
      >
        <span className={`text-[11px] font-semibold tracking-tight ${figureCls}`}>
          {isSpend ? "▲" : "▼"} {figure}
        </span>
        <span className="text-[10px] text-ink-dim">{label}</span>
      </div>
    </>
  );
}
