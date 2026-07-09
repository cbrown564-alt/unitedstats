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

function BeatKnot({ beat }: { beat: ThreadBeat }) {
  const tone = beat.tone ?? "var(--color-devil-bright)";
  return (
    <span
      className={`relative z-10 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-pitch ${
        beat.highlight ? "ring-[3px] ring-gold/20" : ""
      }`}
      style={{ boxShadow: `inset 0 0 0 1.5px ${tone}` }}
      aria-hidden
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
    </span>
  );
}

function BeatCopy({ beat, linked }: { beat: ThreadBeat; linked: boolean }) {
  return (
    <>
      <span className="flex items-center gap-1.5">
        {beat.glyph && (
          <span aria-hidden className="inline-flex shrink-0" style={{ color: beat.tone }}>
            {beat.glyph}
          </span>
        )}
        <span
          className={`text-sm font-medium leading-snug ${
            beat.highlight
              ? "text-gold"
              : linked
                ? "text-ink group-hover:text-devil-bright"
                : "text-ink"
          }`}
        >
          {beat.title}
        </span>
      </span>
      {beat.detail && (
        <span
          className={`stat-num mt-0.5 block text-xs tabular-nums leading-snug ${
            beat.highlight
              ? "text-gold/85"
              : linked
                ? "text-ink-dim group-hover:text-ink"
                : "text-ink-dim"
          }`}
        >
          {beat.detail}
        </span>
      )}
      {beat.note && (
        <span className="mt-1.5 block text-xs leading-snug text-pretty text-ink-faint">
          {beat.note}
        </span>
      )}
    </>
  );
}

function BeatShell({
  beat,
  children,
}: {
  beat: ThreadBeat;
  children: ReactNode;
}) {
  if (beat.href) {
    return (
      <Link href={beat.href} className="group block min-w-0 rounded-sm transition-colors focus-ring">
        {children}
      </Link>
    );
  }
  return <div className="block min-w-0">{children}</div>;
}

/**
 * A horizontal red thread with beats tied along it — the brand filament laid flat
 * for question-page intros. Each beat is a knot on the cord; the prose above weaves
 * the answer through {@link lead} with optional {@link thread-underline} marks on
 * key phrases. Callouts hang under the knots with no card chrome — same quiet grammar
 * as {@link EuropeFinalsTimeline}. On narrow viewports the cord stands up as a spine.
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

  const n = beats.length;

  return (
    <div className={`space-y-5 ${className}`}>
      {lead && (
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-ink-dim sm:text-lg">
          {lead}
        </p>
      )}

      {/* Narrow: vertical spine — knot sits on the title line under the date. */}
      <ol className="relative m-0 list-none p-0 sm:hidden">
        {beats.map((beat, i) => {
          const linked = Boolean(beat.href);
          const isFirst = i === 0;
          const isLast = i === n - 1;
          return (
            <li key={beat.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
              <div className="flex w-3 flex-col items-center self-stretch">
                {/* Spacer matches the date line so the knot lands on the title. */}
                <span
                  className={`w-px h-[1.375rem] ${isFirst ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
                <BeatKnot beat={beat} />
                <span
                  className={`w-px flex-1 min-h-4 ${isLast ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
              </div>
              <div className={`min-w-0 ${isLast ? "pb-1" : "pb-5"}`}>
                <BeatShell beat={beat}>
                  <span className="stat-num block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    {beat.label}
                  </span>
                  <span className="mt-1 block">
                    <BeatCopy beat={beat} linked={linked} />
                  </span>
                </BeatShell>
              </div>
            </li>
          );
        })}
      </ol>

      {/* sm+: horizontal cord — each segment bridges this knot to the next across the gap. */}
      <ol
        className="relative m-0 hidden list-none gap-x-6 p-0 sm:grid"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {beats.map((beat, i) => {
          const linked = Boolean(beat.href);
          const next = beats[i + 1];
          const fromTone = beat.tone ?? "var(--color-devil-bright)";
          const toTone = next?.tone ?? "var(--color-gold)";
          return (
            <li key={beat.id} className="relative flex min-w-0 flex-col items-start">
              <div className="relative flex h-3 w-full items-center">
                <BeatKnot beat={beat} />
                {next && (
                  <span
                    className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 opacity-75"
                    style={{
                      left: "0.75rem",
                      right: "-1.5rem",
                      background: `linear-gradient(to right, ${fromTone}, ${toTone})`,
                    }}
                    aria-hidden
                  />
                )}
              </div>
              <span className="ml-[5px] h-2.5 w-px bg-line/55" aria-hidden />
              <div className="mt-1 w-full min-w-0">
                <BeatShell beat={beat}>
                  <span className="stat-num block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    {beat.label}
                  </span>
                  <span className="mt-1 block">
                    <BeatCopy beat={beat} linked={linked} />
                  </span>
                </BeatShell>
              </div>
            </li>
          );
        })}
      </ol>

      {caption && (
        <p className="text-xs text-pretty text-ink-faint">{caption}</p>
      )}
    </div>
  );
}

/** Inline mark — a single filament underline on a key phrase in thread intro prose. */
export function ThreadUnderline({ children }: { children: ReactNode }) {
  return <span className="thread-underline text-ink">{children}</span>;
}
