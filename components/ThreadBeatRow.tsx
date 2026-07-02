import Link from "next/link";
import type { ReactNode } from "react";

export type ThreadBeat = {
  id: string;
  href?: string;
  /** Short anchor on the thread — usually a date. */
  label: string;
  /** What happened — competition, opponent, etc. */
  title: string;
  /** Scoreline or one-line gloss. */
  detail?: string;
  /** CSS color for the knot bead and glyph. */
  tone?: string;
  /** Emphasise the decisive beat (e.g. stoppage-time final). */
  highlight?: boolean;
  glyph?: ReactNode;
  note?: string;
};

/**
 * A horizontal red thread with beats tied along it — the brand filament laid flat
 * for question-page intros. Each beat is a knot on the cord; the prose above weaves
 * the answer through {@link lead} with optional {@link thread-underline} marks on
 * key phrases. Lighter than TonightHero's vertical slipknot clock, but the same
 * vocabulary: trace animation, gold for the decisive beat, devil-red for the cord.
 */
export function ThreadBeatRow({
  beats,
  lead,
  caption,
  className = "",
}: {
  beats: ThreadBeat[];
  lead?: ReactNode;
  caption?: string;
  className?: string;
}) {
  if (beats.length === 0) return null;

  const VB_W = 400;
  const VB_H = 56;
  const Y = 28;
  const R = 7;
  const AMP = 3;
  const PAD = 28;

  const wx = (x: number) => {
    const t = (x - PAD) / (VB_W - PAD * 2);
    return x + AMP * Math.sin(t * Math.PI * 2.2 + 0.4);
  };

  const positions = beats.map((_, i) => {
    if (beats.length === 1) return VB_W / 2;
    return PAD + ((VB_W - PAD * 2) * i) / (beats.length - 1);
  });

  let d = `M ${wx(PAD * 0.4).toFixed(1)} ${Y}`;
  for (let x = PAD * 0.4 + 6; x <= VB_W - PAD * 0.4; x += 6) {
    d += ` L ${wx(x).toFixed(1)} ${Y}`;
  }

  const gradId = `thread-beat-${beats.map((b) => b.id).join("-")}`;

  return (
    <div className={`space-y-5 ${className}`}>
      {lead && (
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-ink-dim sm:text-lg">
          {lead}
        </p>
      )}

      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="pointer-events-none mb-1 w-full overflow-visible"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.35" />
              <stop offset="18%" stopColor="rgb(255 59 31)" stopOpacity="0.85" />
              <stop offset="82%" stopColor="rgb(255 59 31)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="rgb(245 197 24)" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d={d}
            stroke="rgb(255 59 31)"
            strokeOpacity="0.18"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={1}
            className="thread-path"
            style={{ filter: "blur(2px)" }}
          />
          <path
            d={d}
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            className="thread-path"
          />
          {positions.map((x, i) => {
            const cx = wx(x);
            const beat = beats[i];
            const tone = beat.tone ?? "var(--color-devil-bright)";
            const delay = 280 + i * 220;
            return (
              <g key={beat.id} style={{ animationDelay: `${delay}ms` }}>
                {beat.highlight && (
                  <circle
                    cx={cx}
                    cy={Y}
                    r={R * 2.2}
                    fill="rgb(245 197 24)"
                    fillOpacity="0.12"
                    className="thread-knot"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                )}
                <circle
                  cx={cx}
                  cy={Y}
                  r={R}
                  fill="var(--color-pitch)"
                  stroke={tone}
                  strokeWidth="2"
                  className="thread-knot"
                  style={{ animationDelay: `${delay}ms` }}
                />
                <circle
                  cx={cx}
                  cy={Y}
                  r={2.5}
                  fill={tone}
                  className="thread-bead"
                  style={{ animationDelay: `${delay + 80}ms` }}
                />
              </g>
            );
          })}
        </svg>

        <ol className="grid gap-4 sm:grid-cols-3 sm:gap-3">
          {beats.map((beat, i) => {
            const body = (
              <>
                <span className="stat-num text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {beat.label}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  {beat.glyph && (
                    <span aria-hidden className="inline-flex shrink-0" style={{ color: beat.tone }}>
                      {beat.glyph}
                    </span>
                  )}
                  <span className={`text-sm font-medium ${beat.highlight ? "text-gold" : "text-ink"}`}>
                    {beat.title}
                  </span>
                </span>
                {beat.detail && (
                  <span className={`stat-num mt-0.5 block text-sm tabular-nums ${beat.highlight ? "text-gold/90" : "text-ink-dim"}`}>
                    {beat.detail}
                  </span>
                )}
                {beat.note && (
                  <span className="mt-1.5 block text-xs leading-snug text-ink-faint text-pretty">
                    {beat.note}
                  </span>
                )}
              </>
            );

            const cardClass = [
              "relative rounded-lg border bg-panel-2 px-3.5 py-3 transition-colors",
              beat.highlight
                ? "border-gold/35 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)] hover:border-gold/55"
                : "border-line hover:border-devil/50",
            ].join(" ");

            return (
              <li key={beat.id} className={cardClass} style={{ animationDelay: `${320 + i * 180}ms` }}>
                {beat.href ? (
                  <Link href={beat.href} className="block rounded-md focus-ring">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {caption && (
        <p className="text-xs text-ink-faint text-pretty">{caption}</p>
      )}
    </div>
  );
}

/** Inline mark — a single filament underline on a key phrase in thread intro prose. */
export function ThreadUnderline({ children }: { children: ReactNode }) {
  return <span className="thread-underline text-ink">{children}</span>;
}
