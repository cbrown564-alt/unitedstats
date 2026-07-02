import Link from "next/link";
import { WdlBar } from "@/components/WdlBar";
import { GoalDiff } from "@/components/GoalDiff";
import { ShareCite } from "@/components/ShareCite";
import { fmtNum, pct } from "@/lib/format";

interface Readout {
  value: React.ReactNode;
  label: string;
  detail?: string;
  tone?: string;
}

/**
 * The dominant figure — the answer the plate leads with. Defaults to win rate
 * ("63% won, from N matches") for the head-to-head / tenure pages; a season
 * overrides it with its league finish, since *that* is the season's verdict.
 */
export interface PlateHeadline {
  value: React.ReactNode;
  /** Short uppercase qualifier after the figure ("won", "league finish"). */
  label: string;
  /** Context line beneath ("from N matches", "Champions of the …"). */
  sub?: React.ReactNode;
  /** Figure colour class; defaults to devil-bright. */
  tone?: string;
}

/** One band on the span track: positions are 0..1 along the rail. */
export interface SpanSegment {
  from: number;
  to: number;
  title?: string;
}

/** Best season marker on the span rail — same gold pip idiom as {@link PlayerPlate}. */
interface SpanPeakSeason {
  season: string;
  /** Fraction 0..1 along the span rail */
  at: number;
  title: string;
}

interface SpanProps {
  leftLabel: string;
  left: React.ReactNode;
  rightLabel: string;
  right: React.ReactNode;
  caption?: React.ReactNode;
  /** Tenure-style bands; omit for a single continuous span. */
  segments?: SpanSegment[];
  peakSeason?: SpanPeakSeason;
}

interface IdentityPlateProps {
  eyebrow: string;
  /** A `ClubBadge` or `PlayerPortrait`, already sized `lg`. Omit for a season (no portrait). */
  leading?: React.ReactNode;
  /** Optional caption under the leading visual (e.g. an attribution link). */
  leadingNote?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  record: { w: number; d: number; l: number; p: number; gf: number; ga: number };
  /** Overrides the default win-rate headline; see {@link PlateHeadline}. */
  headline?: PlateHeadline;
  /** Extra readouts in the hairline ribbon; goals for/against are always shown. */
  secondary?: Readout[];
  /** Floodlight wash colour — the club's colour for an opponent, else devil red. */
  accent?: string;
  span?: SpanProps;
  /** Copy-link / cite affordance, rendered top-right of the plate. */
  share?: { path: string; title: string };
}

/**
 * The head-to-head / tenure plate. Shared by `/opponent/[id]` and `/manager/[id]`:
 * a leading crest or portrait, one dominant win-rate figure that *is* the answer
 * to "how does this record read", the diverging W-D-L bar full width beneath it,
 * and an optional span track where the relationship's life reads as position —
 * first meeting left, latest right, tenure bands marked along the rail.
 *
 * Sibling to `PlayerPlate`, which stays bespoke (kit number, goals-led, peak
 * season); the two share the floodlit-plate look but answer different questions.
 */
export function IdentityPlate({
  eyebrow, leading, leadingNote, title, subtitle, record, headline, secondary = [], accent, span, share,
}: IdentityPlateProps) {
  const { w, d, l, p, gf, ga } = record;
  const wash = accent ?? "var(--color-devil)";
  const head: PlateHeadline = headline ?? {
    value: pct(w, p),
    label: "won",
    sub: <>from {fmtNum(p)} {p === 1 ? "match" : "matches"}</>,
    // The default headline is the win rate, so it wears the win colour, not brand
    // red (which now reads as the loss pole). Overrides set their own tone.
    tone: "text-win",
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
      {/* pitch-line texture + a single floodlight wash, tinted to the subject */}
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: wash }}
        aria-hidden
      />

      {share && (
        <div className="absolute right-4 top-4 z-10">
          <ShareCite path={share.path} title={share.title} />
        </div>
      )}

      <div className={`relative grid gap-6 p-5 sm:p-6 ${leading ? "lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8" : ""}`}>
        {leading && (
          <div className="flex flex-col items-start gap-2">
            {leading}
            {leadingNote}
          </div>
        )}

        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{eyebrow}</p>
          <h1 className="display mt-1 text-3xl text-balance sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="stat-num mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-dim">
              {subtitle}
            </p>
          )}

          {/* The headline figure is the answer; goals and any extra readouts sit beside it as a ribbon. */}
          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3.5 sm:mt-6">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className={`stat-num text-5xl font-semibold sm:text-6xl ${head.tone ?? "text-devil-bright"}`}>
                  {head.value}
                </span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">{head.label}</span>
              </div>
              {head.sub && <p className="stat-num mt-1.5 text-xs text-ink-faint">{head.sub}</p>}
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-l border-line pl-5 sm:pl-6">
              <GoalDiff gf={gf} ga={ga} played={p} />
              {secondary.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-end">
                  {secondary.map((s) => (
                    <div key={s.label} className="leading-none">
                      <dd className={`stat-num text-xl font-semibold ${s.tone ?? "text-ink"}`}>{s.value}</dd>
                      <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                        {s.label}
                        {s.detail && <span className="ml-1 normal-case tracking-normal text-ink-dim">{s.detail}</span>}
                      </dt>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {/* The record as one edge-to-edge stacked bar — win | draw | loss with the
              counts seated inside each segment, so it states itself without a caption. */}
          <div className="mt-4 sm:mt-5">
            <WdlBar w={w} d={d} l={l} size="lg" variant="stacked" showLabels />
          </div>

          {span && <SpanTrack {...span} accent={wash} />}
        </div>
      </div>
    </section>
  );
}

/**
 * The relationship as one span: earliest point on the left, latest on the right.
 * Tenure bands (a manager's separate spells) render as discrete coloured segments;
 * a single continuous fixture history fills the whole rail.
 */
function SpanTrack({
  leftLabel, left, rightLabel, right, caption, segments, peakSeason, accent,
}: SpanProps & { accent: string }) {
  const bands = segments && segments.length > 0 ? segments : [{ from: 0, to: 1 }];
  const peakAt =
    peakSeason != null ? Math.min(96, Math.max(4, peakSeason.at * 100)) : null;

  return (
    <div className="mt-7 border-t border-line/80 pt-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <span>{leftLabel}</span>
        {peakSeason && <span className="text-gold/80">Best season</span>}
        <span>{rightLabel}</span>
      </div>

      <div className="relative mt-3 h-1.5 rounded-full bg-panel-2 ring-1 ring-inset ring-line">
        {bands.map((b, i) => (
          <div
            key={i}
            className="absolute inset-y-0 rounded-full opacity-80"
            style={{ left: `${b.from * 100}%`, width: `${Math.max(1.5, (b.to - b.from) * 100)}%`, backgroundColor: accent }}
            title={b.title}
          />
        ))}
        <span className="absolute -left-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch" style={{ backgroundColor: accent }} aria-hidden />
        <span className="absolute -right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch" style={{ backgroundColor: accent }} aria-hidden />
        {peakAt != null && peakSeason && (
          <Link
            href={`/seasons/${peakSeason.season}`}
            className="group/peak absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-ring"
            style={{ left: `${peakAt}%` }}
            title={peakSeason.title}
            aria-label={peakSeason.title}
          >
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-pitch bg-gold shadow-[0_0_0_3px_rgb(245_197_24_/0.18)]" aria-hidden />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded-md border border-line bg-panel-2 px-2 py-1 text-[11px] text-ink shadow-xl shadow-black/40 group-hover/peak:block">
              {peakSeason.title}
            </span>
          </Link>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0 truncate text-ink-dim">{left}</div>
        {peakSeason && (
          <Link
            href={`/seasons/${peakSeason.season}`}
            className="stat-num shrink-0 text-gold/90 hover:text-gold"
            title={peakSeason.title}
          >
            ★ {peakSeason.season}
            <span className="hidden sm:inline">: Best season</span>
          </Link>
        )}
        <div className="min-w-0 truncate text-right text-ink-dim">{right}</div>
      </div>
      {caption && <p className="mt-1 text-[11px] leading-4 text-ink-faint">{caption}</p>}
    </div>
  );
}
