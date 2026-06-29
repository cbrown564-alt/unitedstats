import type { ReactNode } from "react";
import { fmtDate, venuePrefix } from "@/lib/format";
import type { SequenceMatch } from "@/lib/trails";
import { WdlBar } from "@/components/WdlBar";

/**
 * A whole tenure or head-to-head as one diverging skyline: every match is a bar
 * in date order, wins spiking up (red), losses down (slate), draws a neutral tick
 * on the line. Bar height tracks the goal margin, so a 9–0 towers and a 1–0 barely
 * lifts — the eye reads runs of form as ridges of colour and bad patches as slate
 * valleys, the *shape* of a record that a reverse-chron list can never show.
 *
 * The matches flagged by `markers` (the page's NotableMatches) get a gold pip, so
 * the header cards and this spine are visibly the same matches. Server-rendered
 * SVG that stretches to its container; the x-axis is non-uniformly scaled, so the
 * pips ride an HTML overlay to stay circular.
 *
 * Pass `markerGlyph` to replace the default gold dot+line with a custom glyph
 * (e.g. a trophy icon), with extra headroom to fit it.
 *
 * With `showRecord`, the same W/D/L the skyline plots is summarised above it as a
 * `WdlColumns` caption over a diverging `WdlBar` — the totals and proportion, then
 * their timing. Off by default: surfaces that already lead with the record (the
 * detail-page `IdentityPlate`) leave it off to avoid restating it.
 */
const PAD_B = 16; // room for the year axis

export function ResultSpine({
  matches,
  markers = [],
  height = 88,
  subject = "United",
  showRecord = false,
  markerGlyph,
  xLabel,
}: {
  /** Date-ordered match sequence. */
  matches: SequenceMatch[];
  /** Matches to flag above the spine, with the reason for the hover label. */
  markers?: { id: string; label?: string; tone?: string }[];
  height?: number;
  subject?: string;
  /** Render a WdlColumns + WdlBar record summary above the skyline. */
  showRecord?: boolean;
  /** Custom marker glyph (e.g. `<TrophyIcon/>`) instead of the default gold pip. */
  markerGlyph?: ReactNode;
  /** X-axis labels: "year" (default) or "month" for single-season spans. */
  xLabel?: "year" | "month";
}) {
  const n = matches.length;
  if (n === 0) return null;

  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const PAD_T = markerGlyph ? 26 : 12; // headroom for glyph vs dot
  const W = n; // one virtual unit per match; the SVG stretches to its container
  const plotH = height - PAD_T - PAD_B;
  const mid = PAD_T + plotH / 2;
  const half = plotH / 2;
  // sqrt keeps a lone rout from dwarfing every 1–0; +1 floor guards an all-draws run.
  const maxMargin = Math.max(1, ...matches.map((m) => Math.abs(m.gf - m.ga)));
  const scale = half / Math.sqrt(maxMargin);
  const MIN = 1.5; // a decisive result always shows, even a 1–0 or a shoot-out
  // Sparse records get a hairline gap between bars for legibility; dense ones tile
  // seamlessly so sub-pixel bars blend into bands rather than aliasing into gaps.
  const barW = n > 150 ? 1 : 0.82;
  const xOff = (1 - barW) / 2;

  const w = matches.filter((m) => m.result === "W").length;
  const d = matches.filter((m) => m.result === "D").length;
  const l = matches.length - w - d;

  const labelById = new Map(markers.map((mk) => [mk.id, mk.label]));
  const toneById = new Map(markers.map((mk) => [mk.id, mk.tone]));
  const pips = matches
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => labelById.has(m.id))
    .map(({ m, i }) => ({ id: m.id, left: ((i + 0.5) / n) * 100, label: labelById.get(m.id), tone: toneById.get(m.id) }));

  // A handful of anchors across the span; ends are edge-aligned so they fit.
  const anchorCount = Math.min(6, n);
  const xLabelMode = xLabel ?? "year";
  const anchors = Array.from({ length: anchorCount }, (_, k) => {
    const i = Math.round((k / Math.max(1, anchorCount - 1)) * (n - 1));
    const d = matches[i].date;
    const label = xLabelMode === "month"
      ? `${MONTHS[Number(d.slice(5, 7))]} '${d.slice(2, 4)}`
      : d.slice(0, 4);
    return { i, label, first: k === 0, last: k === anchorCount - 1 };
  });

  return (
    <div>
      {showRecord && (
        <div className="mb-3">
          <WdlBar w={w} d={d} l={l} size="md" variant="stacked" showLabels />
        </div>
      )}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height }}
          role="img"
          aria-label={`${subject} result by match over time — ${w} wins, ${d} draws, ${l} losses; wins above the line, losses below, bar height the goal margin`}
        >
          {matches.map((m, i) => {
            const a = Math.abs(m.gf - m.ga);
            if (m.result === "D") {
              return (
                <rect key={m.id} x={i + xOff} y={mid - 1} width={barW} height={2} fill="var(--color-draw)" opacity={0.65}>
                  <title>{`${fmtDate(m.date)} ${venuePrefix(m.venue)} ${m.opponent_name}: ${m.gf}–${m.ga}`}</title>
                </rect>
              );
            }
            const h = Math.max(MIN, scale * Math.sqrt(a));
            const up = m.result === "W";
            return (
              <rect
                key={m.id}
                x={i + xOff}
                y={up ? mid - h : mid}
                width={barW}
                height={h}
                fill={up ? "var(--color-win)" : "var(--color-loss)"}
              >
                <title>{`${fmtDate(m.date)} ${venuePrefix(m.venue)} ${m.opponent_name}: ${m.gf}–${m.ga}`}</title>
              </rect>
            );
          })}
          {/* baseline drawn last so it sits over the bars; non-scaling keeps it 1px */}
          <line x1={0} x2={W} y1={mid} y2={mid} stroke="var(--color-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>

        {pips.map((p) => (
          <div
            key={p.id}
            className="group pointer-events-none absolute inset-y-0"
            style={{ left: `${p.left}%` }}
            title={p.label}
          >
            {markerGlyph ? (
              <div className="absolute top-0 -translate-x-1/2" style={{ color: p.tone ?? "var(--color-gold)" }}>{markerGlyph}</div>
            ) : (
              <>
                <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-gold/35" />
                <div className="absolute top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold" />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="relative mt-1.5 h-3">
        {anchors.map((a) => (
          <span
            key={a.i}
            className={`stat-num absolute text-[10px] text-ink-faint ${a.first ? "left-0" : a.last ? "right-0" : "-translate-x-1/2"}`}
            style={a.first || a.last ? undefined : { left: `${((a.i + 0.5) / n) * 100}%` }}
          >
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}
