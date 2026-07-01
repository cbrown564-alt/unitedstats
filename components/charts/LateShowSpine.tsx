import Link from "next/link";
import { fmtDate, venuePrefix } from "@/lib/format";
import type { IconicLateMoment } from "@/lib/trails";

/**
 * The late-show mythology on one axis: six curated nights that built "Fergie time",
 * plotted chronologically with the decisive goal's minute on the vertical scale.
 * Gold band = the last five regulation minutes (86–90); red band = stoppage.
 * The eye reads the cluster — every myth moment lands in the closing window.
 *
 * Server-rendered SVG; marker labels sit in HTML for legibility at any width.
 */
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 28;
const PAD_B = 28;
const MIN_Y = 85;
const MAX_Y = 97;

function clock(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}′`;
}

function surname(name: string): string {
  const parts = name.replace(/^(Sir|Dr\.?|Mr\.?)\s+/, "").split(" ");
  return parts[parts.length - 1] ?? name;
}

export function LateShowSpine({ moments }: { moments: IconicLateMoment[] }) {
  if (moments.length === 0) return null;

  const dates = moments.map((m) => Date.parse(m.date));
  const xMin = Math.min(...dates);
  const xMax = Math.max(...dates);
  const span = xMax - xMin || 1;

  const width = 1000;
  const plotH = 200;
  const height = PAD_T + plotH + PAD_B;

  const xFor = (date: string) => {
    const pad = 0.06;
    return PAD_L + (pad + ((Date.parse(date) - xMin) / span) * (1 - 2 * pad)) * (width - PAD_L - PAD_R);
  };

  const yFor = (minute: number, added: number | null) => {
    const clock = minute + (added ?? 0) / 10;
    const t = (Math.min(MAX_Y, Math.max(MIN_Y, clock)) - MIN_Y) / (MAX_Y - MIN_Y);
    return PAD_T + plotH - t * plotH;
  };

  // 86–90 regulation band and stoppage band
  const y86 = yFor(86, 0);
  const y90 = yFor(90, 0);
  const yStop = yFor(90.1, 0);

  const positions = moments.map((m) => ({
    m,
    x: xFor(m.date),
    y: yFor(m.minute, m.added),
  }));

  return (
    <figure className="m-0">
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`${moments.length} iconic late winners from ${fmtDate(moments[0]!.date)} to ${fmtDate(moments[moments.length - 1]!.date)}, all scored in the closing minutes`}
        >
          {/* Closing-minute bands */}
          <rect
            x={PAD_L}
            y={y86}
            width={width - PAD_L - PAD_R}
            height={y90 - y86}
            fill="var(--color-gold)"
            opacity={0.08}
          />
          <rect
            x={PAD_L}
            y={PAD_T}
            width={width - PAD_L - PAD_R}
            height={yStop - PAD_T}
            fill="var(--color-devil-bright)"
            opacity={0.06}
          />

          {/* Y-axis minute ticks */}
          {[86, 90, 93, 96].map((min) => {
            const y = yFor(min, min === 96 ? 0 : null);
            return (
              <g key={min}>
                <line x1={PAD_L - 4} x2={width - PAD_R} y1={y} y2={y} stroke="var(--color-line)" strokeWidth={0.5} strokeDasharray={min === 90 ? "none" : "3 3"} opacity={0.5} />
                <text x={PAD_L - 8} y={y + 3} textAnchor="end" className="fill-ink-faint text-[10px]" style={{ fontSize: 10 }}>
                  {min === 96 ? "90+" : `${min}′`}
                </text>
              </g>
            );
          })}

          {/* Connective thread through the mythology */}
          <polyline
            points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth={1}
            strokeOpacity={0.35}
          />

          {/* Moment markers */}
          {positions.map(({ m, x, y }) => (
            <g key={m.id}>
              <circle
                cx={x}
                cy={y}
                r={m.stoppage ? 7 : 6}
                fill={m.stoppage ? "var(--color-devil-bright)" : "var(--color-gold)"}
                stroke="var(--color-panel)"
                strokeWidth={1.5}
              >
                <title>{`${fmtDate(m.date)} — ${clock(m.minute, m.added)} ${surname(m.scorer)} v ${m.opponent_name}`}</title>
              </circle>
            </g>
          ))}

          {/* X-axis year labels */}
          {[...new Set(moments.map((m) => m.date.slice(0, 4)))].map((year) => {
            const first = moments.find((m) => m.date.startsWith(year))!;
            const x = xFor(first.date);
            return (
              <text key={year} x={x} y={height - 6} textAnchor="middle" className="fill-ink-faint" style={{ fontSize: 10 }}>
                {year}
              </text>
            );
          })}
        </svg>

        {/* HTML labels for scorers — positioned absolutely */}
        <div className="pointer-events-none absolute inset-0">
          {positions.map(({ m, x, y }) => {
            const leftPct = (x / width) * 100;
            const topPct = (y / height) * 100;
            const above = y < height * 0.35;
            return (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="pointer-events-auto absolute -translate-x-1/2 text-[10px] leading-tight transition-colors hover:text-devil-bright focus-ring"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: `translate(-50%, ${above ? "-130%" : "70%"})`,
                }}
                title={`${m.tag} — ${fmtDate(m.date)}`}
              >
                <span className={`block font-medium ${m.stoppage ? "text-devil-bright" : "text-gold"}`}>
                  {surname(m.scorer)}
                </span>
                <span className="stat-num block text-ink-faint">{clock(m.minute, m.added)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
          Last five minutes (86–90)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-devil-bright" aria-hidden />
          Stoppage time
        </span>
        <span className="text-ink-dim">
          Six nights that built the myth — {venuePrefix(moments[0]!.venue)} {moments[0]!.opponent_name} to {venuePrefix(moments[moments.length - 1]!.venue)} {moments[moments.length - 1]!.opponent_name}
        </span>
      </figcaption>
    </figure>
  );
}
