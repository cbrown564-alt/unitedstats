/**
 * Pre-match Elo expectancy bar.
 *
 * `expected` is United's Elo expected score (0–1): a single rating-implied
 * scalar with draws split into it, NOT a separate win/draw/loss forecast. It is
 * surfaced as a two-team split so "favourite or underdog, and by how much" reads
 * at a glance, paired with the rating movement the result actually produced.
 *
 * Colour encodes team identity (United red); length encodes expectancy.
 */
export function EloWinBar({
  club,
  opponentName,
  eloPre,
  oppEloPre,
  expected,
  eloPost,
}: {
  club: string;
  opponentName: string;
  eloPre: number;
  oppEloPre: number;
  expected: number;
  eloPost: number;
}) {
  const unitedPct = Math.round(expected * 100);
  const oppPct = 100 - unitedPct;
  const delta = Math.round(eloPost - eloPre);
  const deltaTone = delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-draw";
  const deltaSign = delta > 0 ? "+" : "";
  const favourite = expected >= 0.5;

  return (
    <div className="max-w-3xl rounded-lg border border-line bg-panel px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Pre-match Elo</span>
        <span className="stat-num text-xs text-ink-dim">
          {Math.round(eloPre)}
          <span className="text-ink-faint"> &rarr; </span>
          {Math.round(eloPost)}
          <span className={`ml-1 ${deltaTone}`}>
            ({deltaSign}
            {delta})
          </span>
        </span>
      </div>

      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="font-medium text-devil-bright">{club}</span>{" "}
          <span className="stat-num font-semibold text-ink">{unitedPct}%</span>
        </span>
        <span className="text-right">
          <span className="stat-num font-semibold text-ink">{oppPct}%</span>{" "}
          <span className="font-medium text-ink">{opponentName}</span>
        </span>
      </div>

      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-panel-2"
        role="img"
        aria-label={`Elo expectancy: ${club} ${unitedPct}%, ${opponentName} ${oppPct}%`}
        title={`${club} ${unitedPct}% · ${opponentName} ${oppPct}%`}
      >
        <div className="h-full bg-devil" style={{ width: `${unitedPct}%` }} />
      </div>

      <div className="mt-1 flex items-baseline justify-between stat-num text-[11px] text-ink-faint">
        <span>Elo {Math.round(eloPre)}</span>
        <span>Elo {Math.round(oppEloPre)}</span>
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        {club} went in the {favourite ? "favourite" : "underdog"} by rating. Elo expectancy splits draws
        into the figure, so it is one rating-implied number, not a separate win/draw/loss forecast.
      </p>
    </div>
  );
}
