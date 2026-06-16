import Link from "next/link";
import type { LineupRow } from "@/lib/queries";
import { ShirtBadge } from "@/components/ShirtBadge";

/**
 * Banded teamsheet: the Starting XI laid out as GK/DEF/MID/FWD rows on a quiet
 * pitch, so the team's *shape* reads at a glance. This is an approximation: the
 * archive stores a positional *label* per player (e.g. "Left-Back"), not pitch
 * coordinates, so players are bucketed into four bands and ordered left→right by
 * the side their role implies. Matches without role data fall back to the list.
 */

type Band = "GK" | "DEF" | "MID" | "FWD";
const BAND_ORDER: Band[] = ["FWD", "MID", "DEF", "GK"]; // top (attacking) → bottom

/** Map a positional label to one of four bands; null if it cannot be placed. */
export function roleBand(role: string | null | undefined): Band | null {
  if (!role) return null;
  const r = role.trim().toLowerCase();
  if (/goalkeep|^gk$/.test(r)) return "GK";
  if (/back|defender|^[crl]b$|^df$|^ch$/.test(r)) return "DEF";
  if (/forward|wing|strik|second|^cf$|^ss$|^fw$|^[rl]w$|^[rl]f$|^or$|^ol$|^ir$|^il$/.test(r)) return "FWD";
  if (/midfield|half|^[crl]m$|^mf$|^am$|^dm$|^[rl]h$/.test(r)) return "MID";
  return null;
}

/** Lateral hint so a band reads left → right: 0 left, 1 central, 2 right. */
function lateral(role: string | null | undefined): number {
  const r = (role ?? "").toLowerCase();
  if (/left|^l[bmwfh]$|^ol$|^il$/.test(r)) return 0;
  if (/right|^r[bmwfh]$|^or$|^ir$/.test(r)) return 2;
  return 1;
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

export function FormationPitch({
  starters,
  decade,
}: {
  starters: LineupRow[];
  decade: string | null;
}) {
  const bands = BAND_ORDER.map((band) => ({
    band,
    players: starters
      .filter((p) => roleBand(p.role) === band)
      .sort((a, b) => lateral(a.role) - lateral(b.role) || (a.shirt ?? 99) - (b.shirt ?? 99)),
  })).filter((b) => b.players.length > 0);

  // Formation shorthand, outfield only, back → front (e.g. 4-2-3-1).
  const shape = [...bands]
    .reverse()
    .filter((b) => b.band !== "GK")
    .map((b) => b.players.length)
    .join("-");

  return (
    <div className="max-w-md">
      <div
        className="relative overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--color-pitch)" }}
      >
        {/* quiet pitch markings */}
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

        <div className="relative flex flex-col justify-between gap-3 px-3 py-5" style={{ minHeight: 440 }}>
          {bands.map(({ band, players }) => (
            <div key={band} className="flex items-start justify-around gap-1">
              {players.map((p) => {
                const name = p.player_display_name;
                const node = (
                  <>
                    <ShirtBadge number={p.shirt} decade={decade} compact />
                    <span className="max-w-full truncate text-[11px] leading-tight text-ink group-hover:text-devil-bright">
                      {surname(name)}
                    </span>
                    {p.sub_off != null && (
                      <span className="stat-num text-[9px] leading-none text-ink-faint">&darr; {p.sub_off}&prime;</span>
                    )}
                  </>
                );
                return p.player_id ? (
                  <Link
                    key={p.player_id}
                    href={`/player/${p.player_id}`}
                    title={p.role ?? undefined}
                    className="group flex w-16 flex-col items-center gap-1 text-center"
                  >
                    {node}
                  </Link>
                ) : (
                  <span
                    key={`${p.provider_id}-${name}`}
                    title={p.role ?? undefined}
                    className="group flex w-16 flex-col items-center gap-1 text-center"
                  >
                    {node}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {shape && (
        <p className="mt-2 stat-num text-xs text-ink-faint">
          {shape} <span className="font-sans normal-case tracking-normal">— shape from recorded positions, not coordinates</span>
        </p>
      )}
    </div>
  );
}
