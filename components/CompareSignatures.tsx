import Link from "next/link";
import type { CareerSeason, EraFinish, TrophyEntry, TrophyHaul } from "@/lib/compare";
import { TROPHY_CAT_TONE, TrophyGlyphFilled } from "@/components/CampaignIcons";

// The two sides carry identity colours across every signature: A is United red,
// B a cool blue — warm vs cool so the pair is always separable, with gold left
// free for silverware.
const A_COLOR = "var(--color-devil-bright)";
const B_COLOR = "var(--color-europe)";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} aria-hidden />
      <span className="font-medium text-ink">{label}</span>
    </span>
  );
}

// ----------------------------------------------------------- career arc (preview)

/**
 * Static, dependency-free career-arc visual for the /explore preview slide — two
 * goal curves on a shared career-season axis. The full /compare page uses the
 * interactive CareerDuelChart (recharts, hover/peaks/click); this lighter SVG is
 * right for a server-rendered preview where a client chart would flash blank.
 */
export function CareerArcDuel({
  a,
  b,
  labelA,
  labelB,
}: {
  a: CareerSeason[];
  b: CareerSeason[];
  labelA: string;
  labelB: string;
}) {
  const W = 640;
  const H = 210;
  const padL = 30;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxN = Math.max(a.at(-1)?.n ?? 1, b.at(-1)?.n ?? 1, 1);
  const maxGoals = Math.max(1, ...a.map((s) => s.goals), ...b.map((s) => s.goals));
  const xOf = (n: number) => padL + (maxN <= 1 ? 0 : (n - 1) / (maxN - 1)) * plotW;
  const yOf = (g: number) => padT + (1 - g / maxGoals) * plotH;
  const baseY = padT + plotH;

  const build = (s: CareerSeason[], color: string, gid: string) => {
    if (!s.length) return null;
    const pts = s.map((p) => `${xOf(p.n).toFixed(1)},${yOf(p.goals).toFixed(1)}`);
    const area = `M ${xOf(s[0].n).toFixed(1)},${baseY.toFixed(1)} L ${pts.join(" L ")} L ${xOf(
      s[s.length - 1].n,
    ).toFixed(1)},${baseY.toFixed(1)} Z`;
    const peak = s.reduce((m, p) => (p.goals > m.goals ? p : m), s[0]);
    return { line: pts.join(" "), area, peak, color, gid };
  };
  const sa = build(a, A_COLOR, "arcA");
  const sb = build(b, B_COLOR, "arcB");

  return (
    <figure className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ink-dim">
        <span className="font-semibold uppercase tracking-[0.12em] text-ink-faint">Goals per season</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={A_COLOR} label={labelA} />
            <span className="stat-num text-ink-faint">· {a.length} seasons</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={B_COLOR} label={labelB} />
            <span className="stat-num text-ink-faint">· {b.length} seasons</span>
          </span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Goals per season: ${labelA} vs ${labelB}`}>
        <defs>
          <linearGradient id="arcA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={A_COLOR} stopOpacity="0.28" />
            <stop offset="100%" stopColor={A_COLOR} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="arcB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={B_COLOR} stopOpacity="0.24" />
            <stop offset="100%" stopColor={B_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT} x2={W - padR} y2={padT} stroke="var(--color-line)" strokeDasharray="2 4" />
        <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="var(--color-line)" />
        <text x={padL - 6} y={padT + 4} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 10 }}>
          {maxGoals}
        </text>
        <text x={padL - 6} y={baseY} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 10 }}>
          0
        </text>
        <text x={padL} y={H - 6} textAnchor="start" className="fill-ink-faint" style={{ fontSize: 10 }}>
          Season 1
        </text>
        <text x={W - padR} y={H - 6} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 10 }}>
          {maxN}
        </text>
        {[sa, sb].map(
          (s) =>
            s && (
              <g key={s.gid}>
                <path d={s.area} fill={`url(#${s.gid})`} />
                <polyline points={s.line} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
                <circle cx={xOf(s.peak.n)} cy={yOf(s.peak.goals)} r="3" fill={s.color} />
                <text
                  x={xOf(s.peak.n)}
                  y={yOf(s.peak.goals) - 6}
                  textAnchor="middle"
                  className="fill-ink"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {s.peak.goals}
                </text>
              </g>
            ),
        )}
      </svg>
    </figure>
  );
}

// ----------------------------------------------------------- trophy cabinet (managers)

function Cabinet({ label, haul, color, win }: { label: string; haul: TrophyHaul; color: string; win: number | null }) {
  // Match each glyph to its season-granular entry. Entries are chronological
  // globally; grouped by category here (in display order) so the glyph wall reads
  // "all the leagues, then all the cups" while each one still carries its season.
  const entriesByCat = new Map<string, TrophyEntry[]>();
  for (const e of haul.entries ?? []) {
    const list = entriesByCat.get(e.cat);
    if (list) list.push(e);
    else entriesByCat.set(e.cat, [e]);
  }
  const glyphs = haul.categories.flatMap((c) => {
    const catEntries = entriesByCat.get(c.key) ?? [];
    return Array.from({ length: c.n }, (_, i) => ({
      key: `${c.key}-${i}`,
      tone: TROPHY_CAT_TONE[c.key] ?? "var(--color-gold)",
      entry: catEntries[i],
    }));
  });
  return (
    <div className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Swatch color={color} label={label} />
        <span className="flex items-baseline gap-1.5">
          <span className="stat-num text-3xl font-semibold leading-none text-gold">{haul.total}</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{haul.total === 1 ? "trophy" : "trophies"}</span>
        </span>
      </div>

      <div className="mt-3 flex min-h-[2.25rem] flex-wrap content-start gap-1">
        {glyphs.length ? (
          glyphs.map((g) => {
            const glyph = <TrophyGlyphFilled style={{ color: g.tone }} />;
            // Each trophy opens how it was won — a league title's season page
            // (league table) or a cup's deciding final. The native title surfaces
            // the season.
            return g.entry ? (
              <Link
                key={g.key}
                href={g.entry.href}
                title={`${g.entry.competition}, ${g.entry.season}`}
                className="rounded transition-transform hover:scale-110 focus-ring"
              >
                {glyph}
              </Link>
            ) : (
              <span key={g.key}>{glyph}</span>
            );
          })
        ) : (
          <span className="text-sm text-ink-faint">No major honours in this span.</span>
        )}
      </div>

      {haul.categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-dim">
          {haul.categories.map((c) => (
            <li key={c.key} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: TROPHY_CAT_TONE[c.key] }} aria-hidden />
              {c.label} <span className="stat-num text-ink">{c.n}</span>
            </li>
          ))}
        </ul>
      )}

      {win != null && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            <span>Win rate</span>
            <span className="stat-num text-ink">{win.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, win))}%`, background: color }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function TrophyCabinet({
  a,
  b,
  labelA,
  labelB,
  winA,
  winB,
}: {
  a: TrophyHaul;
  b: TrophyHaul;
  labelA: string;
  labelB: string;
  winA: number | null;
  winB: number | null;
}) {
  const hasEntries = !!(a.entries?.length || b.entries?.length);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Cabinet label={labelA} haul={a} color={A_COLOR} win={winA} />
        <Cabinet label={labelB} haul={b} color={B_COLOR} win={winB} />
      </div>
      {hasEntries && (
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Hover a trophy for the season; click to open how it was won
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------- era skyline (eras)

function Skyline({ label, finishes, color }: { label: string; finishes: EraFinish[]; color: string }) {
  const topPositions = finishes.filter((f) => f.topFlight && f.position != null).map((f) => f.position as number);
  const maxPos = Math.max(20, ...topPositions);
  const titles = finishes.filter((f) => f.champion).length;
  const inTop = finishes.length || 1;

  const W = 640;
  const H = 120;
  const padT = 8;
  const padB = 16;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;
  const slot = W / inTop;
  const barW = Math.max(1.5, Math.min(14, slot * 0.7));

  return (
    <figure className="rounded-lg border border-line bg-pitch/40 p-3 sm:p-4">
      <figcaption className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <Swatch color={color} label={label} />
        <span className="text-ink-faint">
          <span className="stat-num text-gold">{titles}</span> {titles === 1 ? "title" : "titles"} ·{" "}
          <span className="stat-num text-ink-dim">{finishes.length}</span> seasons
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`League finishes, ${label}: ${titles} titles`}>
        {/* champions line (top) and relegation baseline */}
        <line x1="0" y1={padT} x2={W} y2={padT} stroke="var(--color-line)" strokeDasharray="2 4" />
        <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="var(--color-line)" />
        {finishes.map((f, i) => {
          const cx = slot * (i + 0.5);
          const x = cx - barW / 2;
          if (!f.topFlight) {
            // Dropped out of the top flight: a short stub below the line.
            return <rect key={f.season} x={x} y={baseY} width={barW} height="6" rx="1" fill="var(--color-loss)" opacity="0.8" />;
          }
          if (f.position == null) return null;
          const h = Math.max(2, ((maxPos - f.position + 1) / maxPos) * plotH);
          // Height carries the finish; colour only flags the extremes — gold for a
          // title (the one gold on the chart, kept clear of win-yellow), deep red
          // for a bottom-three scrape, neutral for everything between.
          const fill = f.champion
            ? "var(--color-gold)"
            : f.position >= maxPos - 2
              ? "var(--color-loss)"
              : "var(--color-ink-dim)";
          return (
            <g key={f.season}>
              <rect x={x} y={baseY - h} width={barW} height={h} rx="1" fill={fill} />
              {f.champion && <circle cx={cx} cy={baseY - h - 4} r="2.4" fill="var(--color-gold)" />}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * Two eras as league-finish skylines on a shared scale: titles in gold at the top,
 * top-four bright, mid-table dim, lower finishes deep red, and seasons outside the
 * top flight as stubs below the line. Sustained dominance vs jagged struggle is
 * immediate.
 */
export function EraSkyline({
  a,
  b,
  labelA,
  labelB,
}: {
  a: EraFinish[];
  b: EraFinish[];
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="space-y-3">
      <Skyline label={labelA} finishes={a} color={A_COLOR} />
      <Skyline label={labelB} finishes={b} color={B_COLOR} />
    </div>
  );
}
