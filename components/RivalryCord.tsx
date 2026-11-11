import { RivalryKey } from "@/components/glyphs/cord/KeyGlyphs";
/**
 * A rivalry as one cord: it steps up for every United win and down for every
 * defeat, and holds for a draw, laid along real time from the first meeting
 * to the latest. Its height at any date is the head-to-head balance then, so
 * the reader sees who held the upper hand in which era, and where it changed
 * hands (pale beads). The knot at the end is the balance today.
 *
 * Results are the scoreline after play (a shootout counts as the draw it was).
 * Server-rendered; drawn in a stretched 100-wide viewBox with strokes that keep
 * their pixel weight, like the match flow.
 */

export interface RivalryMeeting {
  date: string;
  result: string;
}

const H = 64;

function yearFrac(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return y + ((m - 1) * 30.4 + (d - 1)) / 365.25;
}

export function RivalryCord({ meetings, opponent }: { meetings: RivalryMeeting[]; opponent: string }) {
  if (meetings.length < 4) return null;
  const t0 = yearFrac(meetings[0].date);
  const t1 = yearFrac(meetings[meetings.length - 1].date);
  const span = Math.max(0.5, t1 - t0);
  const KNOT = 2;
  const xOf = (date: string) => ((yearFrac(date) - t0) / span) * (100 - KNOT);

  let bal = 0;
  let hi = 0;
  let lo = 0;
  const pts: { x: number; v: number; date: string }[] = [];
  const swaps: { x: number; date: string; to: number }[] = [];
  let lastSign = 0;
  for (const m of meetings) {
    bal += m.result === "W" ? 1 : m.result === "L" ? -1 : 0;
    hi = Math.max(hi, bal);
    lo = Math.min(lo, bal);
    const x = xOf(m.date);
    pts.push({ x, v: bal, date: m.date });
    const sign = Math.sign(bal);
    if (sign !== 0 && lastSign !== 0 && sign !== lastSign) swaps.push({ x, date: m.date, to: sign });
    if (sign !== 0) lastSign = sign;
  }
  const range = Math.max(1, hi - lo);
  const pad = 9;
  const y = (v: number) => pad + ((hi - v) / range) * (H - pad * 2);
  const zero = y(0);

  let d = `M0 ${zero.toFixed(2)}`;
  let prev = 0;
  for (const p of pts) {
    if (p.v !== prev) {
      d += `L${p.x.toFixed(2)} ${y(prev).toFixed(2)}L${p.x.toFixed(2)} ${y(p.v).toFixed(2)}`;
      prev = p.v;
    }
  }
  const endX = 100 - KNOT / 2;
  d += `L${endX} ${y(bal).toFixed(2)}`;
  const plate = `${d}L${endX} ${zero.toFixed(2)}Z`;

  // Round-year ticks so eras can be read off the cord.
  const step = span > 90 ? 25 : span > 40 ? 10 : span > 15 ? 5 : span > 6 ? 2 : 1;
  const years: number[] = [];
  for (let yr = Math.ceil(t0 / step) * step; yr <= t1; yr += step) {
    const fx = ((yr - t0) / span) * (100 - KNOT);
    if (fx > 4 && fx < 94) years.push(yr);
  }

  const hiAt = pts.find((p) => p.v === hi);
  const loAt = pts.find((p) => p.v === lo);
  const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "level");
  const tone = bal > 0 ? "rc-knot--up" : bal < 0 ? "rc-knot--down" : "rc-knot--level";
  const summary =
    `Head-to-head balance over time: United ${signed(bal)} today` +
    (hi > 0 && hiAt ? `, at most ${signed(hi)} (${hiAt.date.slice(0, 4)})` : "") +
    (lo < 0 && loAt ? `, at worst ${signed(lo)} (${loAt.date.slice(0, 4)})` : "") +
    (swaps.length ? `; the upper hand changed ${swaps.length} time${swaps.length === 1 ? "" : "s"}` : "");

  return (
    <figure className="rc">
      <div className="relative" style={{ height: H }} role="img" aria-label={summary}>
        <svg className="rc-svg cd cd-lit absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          <path className="cd-plate rc-plate" d={plate} />
          <path className="cd-strand rc-ns rc-zero" d={`M0 ${zero.toFixed(2)}H${endX}`} />
          <path
            className="cd-strand rc-ns rc-tick"
            d={years.map((yr) => `M${(((yr - t0) / span) * (100 - KNOT)).toFixed(2)} ${H - 3}V${H}`).join("")}
          />
          <path className="cd-cord rc-ns" d={d} />
        </svg>
        {swaps.map((s) => (
          <span
            key={s.date}
            className="rc-swap absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, top: zero }}
            title={`${s.date.slice(0, 4)}: the upper hand passed to ${s.to > 0 ? "United" : opponent}`}
          />
        ))}
        <span
          aria-hidden
          className={`rc-knot ${tone} absolute -translate-x-1/2 -translate-y-1/2`}
          style={{ left: `${endX}%`, top: y(bal) }}
        />
        {hi > 0 && hiAt && (
          <span className="rc-note stat-num absolute -translate-x-1/2" style={{ left: `${Math.min(92, Math.max(6, hiAt.x))}%`, top: y(hi) - 17 }}>
            {signed(hi)}
          </span>
        )}
        {lo < 0 && loAt && (
          <span className="rc-note stat-num absolute -translate-x-1/2" style={{ left: `${Math.min(92, Math.max(6, loAt.x))}%`, top: y(lo) + 5 }}>
            {signed(lo)}
          </span>
        )}
      </div>
      <div className="relative h-3.5" aria-hidden>
        {years.map((yr) => (
          <span
            key={yr}
            className="stat-num absolute -translate-x-1/2 text-[9.5px] text-ink-faint"
            style={{ left: `${((yr - t0) / span) * (100 - KNOT)}%` }}
          >
            {yr}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <RivalryKey swaps={swaps.length} />
        <span className="stat-num text-[11px] text-ink-dim">
          Today: {bal === 0 ? "level" : `${bal > 0 ? "United" : opponent} ${signed(Math.abs(bal))}`}
        </span>
      </figcaption>
    </figure>
  );
}
