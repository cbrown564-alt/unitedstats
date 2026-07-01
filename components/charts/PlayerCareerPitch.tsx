import { fmtNum } from "@/lib/format";
import {
  PITCH_BAND_ORDER,
  type CareerAppearanceInput,
  summarizeCareerAppearances,
  type PitchBand,
} from "@/lib/placement";

const BAND_LABEL: Record<PitchBand, string> = {
  GK: "Goalkeeper",
  DEF: "Defence",
  MID: "Midfield",
  FWD: "Forward",
};

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
      aria-hidden
    >
      <g fill="none" stroke="var(--color-line)" vectorEffect="non-scaling-stroke">
        <line x1="0" y1="75" x2="100" y2="75" />
        <ellipse cx="50" cy="75" rx="13" ry="9" />
        <rect x="28" y="132" width="44" height="18" />
        <rect x="40" y="144" width="20" height="6" />
        <rect x="28" y="0" width="44" height="18" />
        <rect x="40" y="0" width="20" height="6" />
      </g>
    </svg>
  );
}

function SlotCount({ count, peak }: { count: number; peak: boolean }) {
  return (
    <span
      className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border text-center sm:h-12 sm:w-12 ${
        peak
          ? "border-gold/50 bg-gold/15 text-gold shadow-[0_0_0_3px_rgb(245_197_24_/0.12)]"
          : "border-line bg-panel/90 text-ink"
      }`}
    >
      <span className="stat-num text-lg font-semibold leading-none">{fmtNum(count)}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-faint">apps</span>
    </span>
  );
}

/**
 * Career-wide appearance counts on the same pitch grid as the match teamsheet —
 * each bubble is how often the player was placed in that band and lane across
 * recorded lineup coverage.
 */
export function PlayerCareerPitch({
  appearances,
  playerName,
}: {
  appearances: CareerAppearanceInput[];
  playerName: string;
}) {
  const summary = summarizeCareerAppearances(appearances);
  if (summary.total === 0) return null;

  const bands = PITCH_BAND_ORDER.map((band) => ({
    band,
    slots: summary.slots.filter((s) => s.band === band),
  })).filter((b) => b.slots.length > 0);

  const viaParts: string[] = [];
  if (summary.byVia.role) viaParts.push(`${fmtNum(summary.byVia.role)} from recorded role`);
  if (summary.byVia.shirt) viaParts.push(`${fmtNum(summary.byVia.shirt)} from shirt number`);
  if (summary.byVia.career) viaParts.push(`${fmtNum(summary.byVia.career)} from career position`);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="display text-xl">Where he played</h2>
        <span className="stat-num text-xs text-ink-dim">
          {fmtNum(summary.placed)} of {fmtNum(summary.total)} appearances placed
          {summary.unplaced > 0 && (
            <span className="text-ink-faint"> · {fmtNum(summary.unplaced)} unplaced</span>
          )}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--color-pitch)" }}
        role="img"
        aria-label={`${playerName} appearance counts by pitch position`}
      >
        <PitchMarkings />
        <div className="relative flex flex-col justify-between gap-2 px-3 py-4 sm:gap-2.5 sm:py-5" style={{ minHeight: 320 }}>
          {bands.map(({ band, slots }) => (
            <div key={band} className="flex min-h-[4rem] items-center justify-around gap-1 sm:min-h-[4.5rem]">
              {slots.map((slot) => (
                <div key={`${band}-${slot.lat}`} className="flex flex-col items-center gap-1">
                  <SlotCount count={slot.count} peak={slot.count === summary.maxSlotCount && summary.maxSlotCount > 0} />
                  <span className="text-[10px] uppercase tracking-wider text-ink-faint">{BAND_LABEL[band]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-dim">
        Counts use the same placement rules as match teamsheets — recorded role first, then classic shirt numbering
        before 1993, then career position when nothing else is recorded.
        {viaParts.length > 0 && <> {viaParts.join("; ")}.</>}
      </p>

      {summary.topRoles.length > 0 && (
        <div className="rounded-xl border border-line bg-panel px-4 py-3 sm:px-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Recorded roles in lineups</p>
          <ul className="stat-num mt-2 space-y-1 text-sm">
            {summary.topRoles.map(({ role, count }) => (
              <li key={role} className="flex items-baseline justify-between gap-3">
                <span className="text-ink">{role}</span>
                <span className="shrink-0 text-ink-dim">{fmtNum(count)} apps</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
