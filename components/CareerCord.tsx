import Link from "next/link";
import { seasonHref } from "@/lib/publishedHref";

/**
 * A United career as one cord laid along real time, season by season. The
 * plate swells with the matches played that season, so the reader sees where
 * a career was carried and where it thinned; a bead on the cord grows with the
 * goals (or clean sheets) that season; gold beads above mark medal seasons.
 * Seasons inside the span with no United appearance leave the cord open
 * (dashed): marked "War" when the club played no competitive football, "Away"
 * when it did. Nothing is drawn that the match record does not hold.
 *
 * Server-rendered in a stretched 100-wide viewBox with strokes that keep
 * their pixel weight (like the match flow and the rivalry cord).
 */
export interface CareerSeason {
  season: string;
  apps: number;
  /** Goals, or clean sheets for a goalkeeper or defender. */
  marks: number;
}

const H = 58;
const MID = 31;
const HALF = 17;

const yearOf = (season: string) => Number(season.slice(0, 4));

function shortSeason(season: string) {
  return `${season.slice(2, 4)}–${season.slice(-2)}`;
}

export function CareerCord({
  seasons,
  medals,
  clubSeasons,
  limitedMarks,
  markLabel,
}: {
  /** Every season with a recorded appearance, oldest first. */
  seasons: CareerSeason[];
  medals: string[];
  /** Every season in which United played a recorded competitive match. */
  clubSeasons: Set<string>;
  /** Seasons whose marks are a floor because scorers are only partly recorded. */
  limitedMarks: Set<string>;
  markLabel: "goals" | "clean sheets";
}) {
  const played = seasons.filter((s) => s.apps > 0);
  if (played.length < 2) return null;

  const y0 = yearOf(played[0].season);
  const y1 = yearOf(played[played.length - 1].season) + 1;
  const span = y1 - y0;
  const xOf = (yr: number) => ((yr - y0) / span) * 100;
  const pct = (n: number) => `${n.toFixed(2)}%`;

  const maxApps = Math.max(...played.map((s) => s.apps));
  const maxMarks = Math.max(0, ...played.map((s) => s.marks));
  const medalSet = new Set(medals);

  // Contiguous runs of seasons with appearances; between them the cord opens.
  const runs: CareerSeason[][] = [];
  for (const s of played) {
    const last = runs[runs.length - 1];
    if (last && yearOf(last[last.length - 1].season) === yearOf(s.season) - 1) last.push(s);
    else runs.push([s]);
  }

  const gaps: { from: number; to: number; war: boolean }[] = [];
  for (let i = 1; i < runs.length; i++) {
    const from = yearOf(runs[i - 1][runs[i - 1].length - 1].season) + 1;
    const to = yearOf(runs[i][0].season);
    let war = true;
    for (let yr = from; yr < to; yr++) {
      const label = `${yr}-${String((yr + 1) % 100).padStart(2, "0")}`;
      if (clubSeasons.has(label)) war = false;
    }
    gaps.push({ from, to, war });
  }

  // The plate: a smooth swell per run, closed to the cord at each run's ends.
  const half = (s: CareerSeason) => Math.max(1.6, (s.apps / maxApps) * HALF);
  const f = (n: number) => n.toFixed(2);
  const plate = runs
    .map((run) => {
      const pts = [
        { x: xOf(yearOf(run[0].season)), h: 0 },
        ...run.map((s) => ({ x: xOf(yearOf(s.season) + 0.5), h: half(s) })),
        { x: xOf(yearOf(run[run.length - 1].season) + 1), h: 0 },
      ];
      const edge = (sign: 1 | -1, list: typeof pts) => {
        let d = "";
        for (let i = 1; i < list.length; i++) {
          const a = list[i - 1];
          const b = list[i];
          const cx = (a.x + b.x) / 2;
          d += `C${f(cx)} ${f(MID - sign * a.h)} ${f(cx)} ${f(MID - sign * b.h)} ${f(b.x)} ${f(MID - sign * b.h)}`;
        }
        return d;
      };
      const back = [...pts].reverse();
      return `M${f(pts[0].x)} ${MID}${edge(1, pts)}${edge(-1, back)}Z`;
    })
    .join("");

  const cord = runs
    .map((run) => `M${f(xOf(yearOf(run[0].season)))} ${MID}H${f(xOf(yearOf(run[run.length - 1].season) + 1))}`)
    .join("");
  const open = gaps.map((g) => `M${f(xOf(g.from))} ${MID}H${f(xOf(g.to))}`).join("");

  // Year ticks at round intervals, kept clear of the two ends.
  const step = span > 18 ? 5 : span > 8 ? 2 : 1;
  const ticks: number[] = [];
  for (let yr = Math.ceil(y0 / step) * step; yr <= y1; yr += step) {
    const x = xOf(yr);
    if (x > 9 && x < 91) ticks.push(yr);
  }

  const peak = played.reduce((a, b) => (b.apps > a.apps ? b : a));
  const medalCount = played.filter((s) => medalSet.has(s.season)).length;
  const limitedHere = played.some((s) => limitedMarks.has(s.season) && s.marks > 0);
  const summary =
    `${played.length} seasons with United between ${y0} and ${y1}; most matches in ${peak.season} (${peak.apps})` +
    (medalCount ? `; medals in ${medalCount} season${medalCount === 1 ? "" : "s"}` : "") +
    (gaps.length ? `; ${gaps.length} break${gaps.length === 1 ? "" : "s"} in the record` : "");

  return (
    <figure className="cc">
      <div className="relative" style={{ height: H }} role="img" aria-label={summary}>
        <svg className="cc-svg cd cd-lit absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          <path className="cd-plate cc-plate" d={plate} />
          {open && <path className="cd-strand cc-ns cc-open" d={open} />}
          {ticks.length > 0 && (
            <path className="cd-strand cc-ns cc-tick" d={ticks.map((yr) => `M${f(xOf(yr))} ${H - 3}V${H}`).join("")} />
          )}
          <path className="cd-cord cc-ns" d={cord} />
        </svg>

        {gaps.map((g) =>
          xOf(g.to) - xOf(g.from) > 7 ? (
            <span
              key={g.from}
              className="cc-gap absolute -translate-x-1/2"
              style={{ left: pct((xOf(g.from) + xOf(g.to)) / 2), top: MID - 15 }}
              title={g.war ? `${g.from}–${g.to}: no competitive football` : `${g.from}–${g.to}: no United appearances`}
            >
              {g.war ? "War" : "Away"}
            </span>
          ) : null,
        )}

        {played.map((s) => {
          const yr = yearOf(s.season);
          const x = xOf(yr + 0.5);
          const medal = medalSet.has(s.season);
          const limited = limitedMarks.has(s.season);
          const size = s.marks > 0 && maxMarks > 0 ? 3 + Math.sqrt(s.marks / maxMarks) * 12 : 0;
          const title =
            `${s.season}: ${s.apps} match${s.apps === 1 ? "" : "es"}` +
            (s.marks > 0 ? `, ${s.marks}${limited ? "+" : ""} ${markLabel}` : "") +
            (medal ? ", medal season" : "");
          return (
            <Link
              key={s.season}
              href={seasonHref(s.season)}
              prefetch={false}
              tabIndex={-1}
              aria-hidden
              title={title}
              className="cc-slot absolute top-0 bottom-0 -translate-x-1/2"
              style={{ left: pct(x), width: pct(100 / span) }}
            >
              {size > 0 && (
                <span
                  className={`cc-bead absolute left-1/2 -translate-x-1/2 -translate-y-1/2 ${limited ? "cc-bead--floor" : ""}`}
                  style={{ top: MID, width: size, height: size }}
                />
              )}
              {medal && <span className="cc-medal absolute left-1/2 -translate-x-1/2" style={{ top: 2 }} />}
            </Link>
          );
        })}

        <span className="cc-end absolute -translate-x-1/2 -translate-y-1/2" style={{ left: 0, top: MID }} />
        <span className="cc-end absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "100%", top: MID }} />
      </div>
      <div className="relative h-3.5" aria-hidden>
        {ticks.map((yr) => (
          <span key={yr} className="stat-num absolute -translate-x-1/2 text-[9.5px] text-ink-faint" style={{ left: pct(xOf(yr)) }}>
            {yr}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 text-[11px] leading-4 text-ink-faint">
        Thicker in seasons with more matches; each bead grows with that season&rsquo;s {markLabel}
        {medalCount > 0 ? <>; <span className="cc-medal cc-medal--inline" aria-hidden /> a medal season</> : null}.
        {limitedHere ? " Hollow beads: scorers only partly recorded that season, so a floor." : null}
        {" "}Busiest: <span className="stat-num text-ink-dim">{shortSeason(peak.season)}</span>, {peak.apps} matches.
      </figcaption>
    </figure>
  );
}
