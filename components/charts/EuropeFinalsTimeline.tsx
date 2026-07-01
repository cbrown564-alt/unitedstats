import Link from "next/link";
import { fmtMonthYear, scoreline } from "@/lib/format";
import type { SequenceMatch } from "@/lib/trails";

export type EuropeFinal = SequenceMatch & { won: boolean };

function shortCompetition(name: string): string {
  return name.replace(/^UEFA /, "").replace(/^European /, "");
}

function FinalCallout({
  final: f,
  won,
  align,
}: {
  final: EuropeFinal;
  won: boolean;
  align: "left" | "right";
}) {
  const pens = f.pen_gf != null ? [f.pen_gf, f.pen_ga] as const : null;
  const aet = !!f.aet;

  return (
    <Link
      href={`/match/${f.id}`}
      className={`group block max-w-[15.5rem] text-[11px] leading-snug transition-colors focus-ring ${
        align === "right" ? "text-left" : "text-right"
      }`}
    >
      <span className={`block truncate ${won ? "text-ink-dim group-hover:text-gold/90" : "text-ink-faint group-hover:text-ink-dim"}`}>
        {shortCompetition(f.competition_name)}
      </span>
      <span className="stat-num mt-0.5 block truncate text-[10px] text-ink-faint">
        {fmtMonthYear(f.date)} · v {f.opponent_name}
      </span>
      <span className={`stat-num mt-0.5 block text-xs ${won ? "text-gold/75 group-hover:text-gold" : "text-ink-faint"}`}>
        {scoreline(f.gf, f.ga)}
        {aet ? <span className="ml-1 text-[10px] font-normal text-ink-faint">(a.e.t)</span> : null}
        {pens?.[0] != null ? (
          <span className="ml-1 text-[10px] font-normal text-ink-faint">
            ({pens[0]}–{pens[1]} pens)
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function EuropeFinalsTimeline({ finals }: { finals: EuropeFinal[] }) {
  if (finals.length === 0) return null;

  const sorted = [...finals].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;

  return (
    <figure className="m-0">
      <ol className="relative m-0 list-none p-0">
        {sorted.map((f, i) => {
          const won = f.won;
          const isFirst = i === 0;
          const isLast = i === n - 1;

          return (
            <li
              key={f.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-4"
              style={{ minHeight: isLast ? undefined : "3.75rem" }}
            >
              {/* Losses branch left */}
              <div className="flex items-center justify-end gap-2">
                {!won && (
                  <>
                    <FinalCallout final={f} won={false} align="left" />
                    <span className="hidden h-px w-4 shrink-0 bg-line/50 sm:block" aria-hidden />
                  </>
                )}
              </div>

              {/* Spine */}
              <div className="flex flex-col items-center self-stretch py-0.5">
                <span
                  className={`w-px flex-1 min-h-2 ${isFirst ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
                <span
                  className={`relative z-10 shrink-0 rounded-full shadow-[0_0_0_2px_var(--color-pitch)] ${
                    won
                      ? "h-2 w-2 bg-gold/90 ring-1 ring-gold/30"
                      : "h-1.5 w-1.5 bg-ink-faint/80 ring-1 ring-line/80"
                  }`}
                  title={`${fmtMonthYear(f.date)} — ${won ? "won" : "lost"}`}
                />
                <span
                  className={`w-px flex-1 min-h-2 ${isLast ? "bg-transparent" : "bg-line/55"}`}
                  aria-hidden
                />
              </div>

              {/* Wins branch right */}
              <div className="flex items-center gap-2">
                {won && (
                  <>
                    <span className="hidden h-px w-4 shrink-0 bg-line/50 sm:block" aria-hidden />
                    <FinalCallout final={f} won align="right" />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/50 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold/90 ring-1 ring-gold/30" aria-hidden />
          Won the final
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-faint/80 ring-1 ring-line/80" aria-hidden />
          Lost the final
        </span>
        <span className="text-ink-dim">Wins to the right, losses to the left · each opens the full match</span>
      </figcaption>
    </figure>
  );
}
