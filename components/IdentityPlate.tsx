import { WdlBar, WdlColumns } from "@/components/WdlBar";
import { fmtNum, pct } from "@/lib/format";

interface Readout {
  value: React.ReactNode;
  label: string;
  detail?: string;
  tone?: string;
}

/** One band on the span track: positions are 0..1 along the rail. */
export interface SpanSegment {
  from: number;
  to: number;
  title?: string;
}

interface SpanProps {
  leftLabel: string;
  left: React.ReactNode;
  rightLabel: string;
  right: React.ReactNode;
  caption?: React.ReactNode;
  /** Tenure-style bands; omit for a single continuous span. */
  segments?: SpanSegment[];
}

interface IdentityPlateProps {
  eyebrow: string;
  /** A `ClubBadge` or `PlayerPortrait`, already sized `lg`. */
  leading: React.ReactNode;
  /** Optional caption under the leading visual (e.g. an attribution link). */
  leadingNote?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  record: { w: number; d: number; l: number; p: number; gf: number; ga: number };
  /** Extra readouts in the hairline ribbon; goals for/against are always shown. */
  secondary?: Readout[];
  /** Floodlight wash colour — the club's colour for an opponent, else devil red. */
  accent?: string;
  span?: SpanProps;
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
  eyebrow, leading, leadingNote, title, subtitle, record, secondary = [], accent, span,
}: IdentityPlateProps) {
  const { w, d, l, p, gf, ga } = record;
  const wash = accent ?? "var(--color-devil)";

  const readouts: Readout[] = [
    { value: `${fmtNum(gf)}–${fmtNum(ga)}`, label: "goals", detail: "for / against" },
    ...secondary,
  ];

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
      {/* pitch-line texture + a single floodlight wash, tinted to the subject */}
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: wash }}
        aria-hidden
      />

      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col items-start gap-2">
          {leading}
          {leadingNote}
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{eyebrow}</p>
          <h1 className="display mt-1 text-3xl text-balance sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="stat-num mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-dim">
              {subtitle}
            </p>
          )}

          {/* Win rate is the answer; goals and any extra readouts sit beside it as a ribbon. */}
          <div className="mt-5 flex flex-wrap items-end gap-x-7 gap-y-4 sm:mt-6">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="stat-num text-5xl font-semibold text-devil-bright sm:text-6xl">{pct(w, p)}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">won</span>
              </div>
              <p className="stat-num mt-2 text-xs text-ink-faint">
                from {fmtNum(p)} {p === 1 ? "match" : "matches"}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-7 gap-y-3.5 border-l border-line pl-6 sm:flex sm:flex-wrap sm:items-end">
              {readouts.map((s) => (
                <div key={s.label} className="leading-none">
                  <dd className={`stat-num text-xl font-semibold ${s.tone ?? "text-ink"}`}>{s.value}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    {s.label}
                    {s.detail && <span className="ml-1 normal-case tracking-normal text-ink-dim">{s.detail}</span>}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          {/* W-D-L counts sit directly above the diverging bar (L · D · W echoes the
              bar's losses-left / wins-right axis), as on the season pages. */}
          <div className="mt-5 space-y-2">
            <WdlColumns w={w} d={d} l={l} />
            <WdlBar w={w} d={d} l={l} size="lg" />
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
function SpanTrack({ leftLabel, left, rightLabel, right, caption, segments, accent }: SpanProps & { accent: string }) {
  const bands = segments && segments.length > 0 ? segments : [{ from: 0, to: 1 }];

  return (
    <div className="mt-7 border-t border-line/80 pt-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <span>{leftLabel}</span>
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
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0 truncate text-ink-dim">{left}</div>
        <div className="min-w-0 truncate text-right text-ink-dim">{right}</div>
      </div>
      {caption && <p className="mt-1 text-[11px] leading-4 text-ink-faint">{caption}</p>}
    </div>
  );
}
