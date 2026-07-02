import Link from "next/link";
import type { EraFinish, TrophyEntry, TrophyHaul } from "@/lib/compare";
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

// ----------------------------------------------------------- trophy cabinet (managers)

function Cabinet({
  label,
  haul,
  color,
  win,
  compact = false,
}: {
  label: string;
  haul: TrophyHaul;
  color: string;
  win: number | null;
  compact?: boolean;
}) {
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
    <div className={`rounded-lg border border-line bg-pitch/40 ${compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Swatch color={color} label={label} />
        <span className="flex items-baseline gap-1.5">
          <span className={`stat-num font-semibold leading-none text-gold ${compact ? "text-2xl" : "text-3xl"}`}>{haul.total}</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{haul.total === 1 ? "trophy" : "trophies"}</span>
        </span>
      </div>

      <div className={`flex flex-wrap content-start gap-1 ${compact ? "mt-2 min-h-[1.75rem]" : "mt-3 min-h-[2.25rem]"}`}>
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
  compact = false,
}: {
  a: TrophyHaul;
  b: TrophyHaul;
  labelA: string;
  labelB: string;
  winA: number | null;
  winB: number | null;
  /** Explore signature — tighter cabinets, no interaction hint. */
  compact?: boolean;
}) {
  const hasEntries = !!(a.entries?.length || b.entries?.length);
  return (
    <div>
      <div className={`grid gap-3 sm:grid-cols-2 ${compact ? "gap-2" : ""}`}>
        <Cabinet label={labelA} haul={a} color={A_COLOR} win={winA} compact={compact} />
        <Cabinet label={labelB} haul={b} color={B_COLOR} win={winB} compact={compact} />
      </div>
      {hasEntries && !compact && (
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
