import type { TrophyHaul } from "@/lib/compare";
import { TROPHY_CAT_TONE, TrophyGlyphFilled } from "@/components/CampaignIcons";

function Cabinet({
  haul,
  winPct,
}: {
  haul: TrophyHaul;
  winPct?: number | null;
}) {
  const glyphs = haul.categories.flatMap((c) =>
    Array.from({ length: c.n }, (_, i) => ({
      key: `${c.key}-${i}`,
      tone: TROPHY_CAT_TONE[c.key] ?? "var(--color-gold)",
    })),
  );

  return (
    <div className="rounded-lg border border-line bg-pitch/40 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim">Major honours</p>
        <span className="flex items-baseline gap-1.5">
          <span className="stat-num text-3xl font-semibold leading-none text-gold">{haul.total}</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            {haul.total === 1 ? "trophy" : "trophies"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex min-h-[2.25rem] flex-wrap content-start gap-1">
        {glyphs.length ? (
          glyphs.map((g) => <TrophyGlyphFilled key={g.key} style={{ color: g.tone }} />)
        ) : (
          <span className="text-sm text-ink-dim">No major honours in this span.</span>
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

      {winPct != null && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            <span>Win rate</span>
            <span className="stat-num text-ink">{winPct.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-devil-bright"
              style={{ width: `${Math.max(0, Math.min(100, winPct))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Single-manager trophy cabinet for `/manager/[id]`. */
export function ManagerHonoursPanel({
  haul,
  winPct,
}: {
  haul: TrophyHaul;
  winPct?: number | null;
}) {
  return <Cabinet haul={haul} winPct={winPct} />;
}
