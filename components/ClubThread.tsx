import Link from "next/link";
import { familyName } from "@/lib/names";
import { seasonHref } from "@/lib/publishedHref";

/**
 * The club's whole league life as one red cord. Height is where United
 * finished: champions hard against the top, the top flight above the divider,
 * the second tier below it, so the relegations read as the valleys they were.
 * Gold beads are league titles (proof); a hollow gold ring is a Second
 * Division title, which is not the same thing; a loss-red bead is a season
 * that ended in relegation. Where the league stopped (the wars) the cord opens
 * into a dashed strand rather than drawing a finish across a gap.
 *
 * Under the cord, the managers' reigns run as one banded strand, laid on the
 * same calendar so an era can be read straight up into the finishes it
 * produced.
 *
 * Stretched 100×100 viewBox with strokes that keep their pixel weight; beads
 * and labels are HTML so they stay round and crisp. Every season is a link.
 */
export interface FinishPoint {
  season: string; // "1998-99"
  year: number; // start year, 1998
  competition: string;
  tier: "top" | "second";
  position: number;
  size: number;
}

export interface Reign {
  managerId: string;
  name: string;
  from: string; // ISO date
  to: string | null;
}

// Depth: the top flight spans 0..1, the second tier opens at SECOND_TOP.
const SECOND_TOP = 1.28;
const MAX_DEPTH = SECOND_TOP + 1;
const Y_TOP = 11;
const Y_BOT = 94;
const X_PAD = 1.6;

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function depthOf(p: FinishPoint): number {
  const within = p.size > 1 ? (p.position - 1) / (p.size - 1) : 0;
  return p.tier === "top" ? within : SECOND_TOP + within;
}

function yearFrac(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return y + ((m - 1) * 30.4 + (d - 1)) / 365.25;
}

/** Monotone cubic through the points: smooth, passes through every finish, never overshoots. */
function monotonePath(pts: { x: number; y: number }[]): string {
  const f = (n: number) => n.toFixed(2);
  if (pts.length === 1) return `M${f(pts[0].x - 0.15)} ${f(pts[0].y)}H${f(pts[0].x + 0.15)}`;
  const n = pts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
  const m: number[] = pts.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    const a = d[i - 1];
    const b = d[i];
    return a * b <= 0 ? 0 : 2 / (1 / a + 1 / b);
  });
  let path = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (pts[i + 1].x - pts[i].x) / 3;
    path += `C${f(pts[i].x + h)} ${f(pts[i].y + m[i] * h)} ${f(pts[i + 1].x - h)} ${f(pts[i + 1].y - m[i + 1] * h)} ${f(pts[i + 1].x)} ${f(pts[i + 1].y)}`;
  }
  return path;
}

export function ClubThread({ points, reigns }: { points: FinishPoint[]; reigns: Reign[] }) {
  if (points.length === 0) return null;
  const pts = [...points].sort((a, b) => a.year - b.year);
  const yMin = pts[0].year;
  const yMax = pts[pts.length - 1].year;
  const span = Math.max(1, yMax - yMin);
  const x = (year: number) => X_PAD + ((year - yMin) / span) * (100 - 2 * X_PAD);
  const y = (depth: number) => Y_TOP + (depth / MAX_DEPTH) * (Y_BOT - Y_TOP);
  // A season's point sits at its start year; 1 August of year Y falls midway
  // between seasons Y-1 and Y, so calendar dates map half a slot back.
  const dateX = (date: string) =>
    x(Math.min(yMax + 0.5, Math.max(yMin - 0.5, yearFrac(date) - 1.08)));

  const decorated = pts.map((p, i) => {
    const next = pts[i + 1];
    return {
      p,
      relegated: p.tier === "top" && !!next && next.tier === "second" && next.year === p.year + 1,
      topChamp: p.tier === "top" && p.position === 1,
      secondChamp: p.tier === "second" && p.position === 1,
      cx: x(p.year),
      cy: y(depthOf(p)),
    };
  });

  // Unbroken runs of league seasons; the cord opens between them.
  const runs: (typeof decorated)[] = [];
  for (const dp of decorated) {
    const last = runs[runs.length - 1];
    if (last && dp.p.year - last[last.length - 1].p.year === 1) last.push(dp);
    else runs.push([dp]);
  }
  const cord = runs.map((r) => monotonePath(r.map((dp) => ({ x: dp.cx, y: dp.cy })))).join("");
  const plate = runs
    .map((r) => {
      const a = r[0];
      const b = r[r.length - 1];
      const body = monotonePath(r.map((dp) => ({ x: dp.cx, y: dp.cy })));
      return `${body}L${b.cx.toFixed(2)} ${Y_BOT}L${a.cx.toFixed(2)} ${Y_BOT}Z`;
    })
    .join("");
  const gaps = runs.slice(1).map((r, i) => {
    const before = runs[i][runs[i].length - 1];
    const after = r[0];
    const from = before.p.year + 1;
    const to = after.p.year;
    const label = from <= 1918 && to >= 1915 ? "WWI" : from <= 1945 && to >= 1939 ? "WWII" : null;
    return { before, after, label };
  });
  const open = gaps
    .map((g) => `M${g.before.cx.toFixed(2)} ${g.before.cy.toFixed(2)}L${g.after.cx.toFixed(2)} ${g.after.cy.toFixed(2)}`)
    .join("");

  const dividerY = y((1 + SECOND_TOP) / 2);
  const decades: number[] = [];
  for (let dYear = Math.ceil(yMin / 20) * 20; dYear <= yMax; dYear += 20) decades.push(dYear);

  // Reigns on the same calendar; only the long ones are named.
  const bands = reigns
    .map((r, i) => {
      const l = dateX(r.from);
      const rr = r.to ? dateX(r.to) : x(yMax + 0.5);
      return { ...r, i, left: l, width: Math.max(0.15, rr - l) };
    })
    .filter((b) => b.width > 0);
  // Only reigns wide enough get a name; named ones alternate rows so a long
  // surname can run past a short reign without meeting the next name.
  let named = 0;
  const rowOf = new Map(bands.filter((b) => b.width > 3.2).map((b) => [b.i, named++ % 2]));

  const titles = decorated.filter((d) => d.topChamp).length;
  const relegations = decorated.filter((d) => d.relegated).length;
  const summary =
    `League finishes from ${pts[0].season} to ${pts[pts.length - 1].season}: ` +
    `${titles} league titles, ${relegations} relegations, broken by the two world wars.`;

  return (
    <figure className="ct m-0">
      <div className="relative h-64 w-full sm:h-72" role="group" aria-label={summary}>
        {/* tier bands: a faint lift for the top flight, a deeper shadow below */}
        <div className="absolute inset-x-0 bg-ink/[0.025]" style={{ top: `${Y_TOP}%`, height: `${dividerY - Y_TOP}%` }} aria-hidden />
        <div className="absolute inset-x-0 bg-pitch/45" style={{ top: `${dividerY}%`, height: `${Y_BOT - dividerY}%` }} aria-hidden />

        {decades.map((dYear) => (
          <div key={dYear} className="absolute top-0 w-px bg-line/40" style={{ left: `${x(dYear)}%`, bottom: `${100 - Y_BOT}%` }} aria-hidden />
        ))}

        <div className="absolute inset-x-0 border-t border-dashed border-gold/35" style={{ top: `${Y_TOP}%` }} aria-hidden />
        <span className="absolute left-0 -translate-y-[130%] text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/75" style={{ top: `${Y_TOP}%` }}>
          Champions
        </span>
        <div className="absolute inset-x-0 border-t border-dotted border-line" style={{ top: `${dividerY}%` }} aria-hidden />
        <span className="absolute right-0 -translate-y-[140%] text-[10px] uppercase tracking-[0.14em] text-ink-faint" style={{ top: `${dividerY}%` }}>
          Second tier
        </span>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ct-svg cd cd-lit absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path className="cd-plate ct-plate" d={plate} />
          <path className="cd-strand ct-ns ct-open" d={open} />
          <path className="cd-cord ct-ns" d={cord} />
        </svg>

        {gaps.map((g) =>
          g.label ? (
            <span
              key={g.before.p.year}
              className="ct-war absolute -translate-x-1/2"
              style={{ left: `${(g.before.cx + g.after.cx) / 2}%`, top: `${Math.min(g.before.cy, g.after.cy) - 9}%` }}
              aria-hidden
            >
              {g.label}
            </span>
          ) : null,
        )}

        {decorated.map((d) => {
          const tone = d.topChamp ? "ct-bead--title" : d.secondChamp ? "ct-bead--second" : d.relegated ? "ct-bead--down" : "";
          const title = `${d.p.season} · ${d.p.competition} · ${ord(d.p.position)} of ${d.p.size}${
            d.topChamp ? " · Champions" : d.secondChamp ? " · Second Division winners" : d.relegated ? " · relegated" : ""
          }`;
          return (
            <Link
              key={d.p.season}
              href={seasonHref(d.p.season)}
              prefetch={false}
              title={title}
              aria-label={title}
              className="ct-hit group absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-ring"
              style={{ left: `${d.cx}%`, top: `${d.cy}%` }}
            >
              <span className={`ct-bead ${tone}`} />
            </Link>
          );
        })}
      </div>

      {/* the managers' reigns, one banded strand on the same calendar */}
      <div className="relative mt-1 h-10" aria-label="Managers' reigns on the same timeline">
        {bands.map((b) => (
          <Link
            key={`${b.managerId}-${b.from}`}
            href={`/manager/${b.managerId}`}
            prefetch={false}
            title={`${b.name}: ${b.from.slice(0, 4)}–${b.to ? b.to.slice(0, 4) : "now"}`}
            className={`ct-reign absolute top-0 ${b.i % 2 ? "ct-reign--alt" : ""}`}
            style={{ left: `${b.left}%`, width: `${b.width}%` }}
          >
            {rowOf.has(b.i) && (
              <span className={`ct-reign-name ${rowOf.get(b.i) ? "ct-reign-name--low" : ""} ${b.width > 7.5 ? "" : "hidden sm:block"}`}>{familyName(b.name)}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="relative mt-0.5 h-3.5" aria-hidden>
        {decades.map((dYear) => (
          <span key={dYear} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${x(dYear)}%` }}>
            {dYear % 100 === 0 ? dYear : `'${String(dYear).slice(2)}`}
          </span>
        ))}
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="ct-bead ct-bead--title" aria-hidden />
          League champions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="ct-bead ct-bead--second" aria-hidden />
          Won the Second Division
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="ct-bead ct-bead--down" aria-hidden />
          Relegated
        </span>
        <span className="text-ink-dim">The cord opens where there was no league · managers&rsquo; reigns run beneath · every point opens its season</span>
      </figcaption>
    </figure>
  );
}
