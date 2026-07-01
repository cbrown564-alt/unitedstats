import Link from "next/link";
import { WdlBar } from "./WdlBar";
import { fmtNum, pct } from "@/lib/format";

const gdSign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : ""); // U+2212 minus
const gdTone = (n: number) => (n > 0 ? "text-win" : n < 0 ? "text-loss" : "text-ink-dim");

/**
 * The shared scan-and-drill row for the record index pages (`/managers`,
 * `/opponents`): a leading identity (portrait or badge), a name with a quiet
 * sub-line, the diverging W/D/L bar, and the played/win-rate readout — one
 * rhythm so the two surfaces read identically. An optional `rank` reinforces a
 * ranked list (opponents are ordered by meetings); chronological lists (managers
 * grouped into eras) omit it.
 */
export function IndexRow({
  href,
  rank,
  leading,
  name,
  compactName,
  title,
  badge,
  sub,
  w,
  d,
  l,
  gf,
  ga,
  chart,
}: {
  href: string;
  rank?: number;
  leading: React.ReactNode;
  name: string;
  /** Shorter label for narrow viewports (e.g. broadcast opponent short name). */
  compactName?: string;
  /** Full name for native tooltip when `compactName` is shown on narrow screens. */
  title?: string;
  /** Small marker shown immediately after the name (e.g. a gold honours count). */
  badge?: React.ReactNode;
  sub: React.ReactNode;
  w: number;
  d: number;
  l: number;
  /** Goals for/against over the slice — surfaces a signed, per-game goal
   *  difference in the readout (dominance at a glance). Omitted → played + win%. */
  gf?: number;
  ga?: number;
  /** Replace the default diverging W/D/L bar in the middle slot with a richer
   *  per-row visual (e.g. the manager tenure sparkbar on a shared timeline).
   *  Omitted → the diverging `WdlBar` (opponents). */
  chart?: React.ReactNode;
}) {
  const p = w + d + l;
  const gdPerGame = gf != null && ga != null && p > 0 ? (gf - ga) / p : null;
  return (
    <Link
      href={href}
      title={title ?? (compactName ? name : undefined)}
      className="group grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1.5 px-4 py-3 transition-colors hover:bg-panel focus-ring sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto]"
    >
      <span className="flex min-w-0 items-center gap-3">
        {rank != null && (
          <span className="stat-num w-6 shrink-0 text-right text-xs text-ink-faint">{rank}</span>
        )}
        {leading}
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="break-words font-medium leading-tight line-clamp-2 transition-colors group-hover:text-devil-bright sm:line-clamp-1 sm:truncate">
              {compactName ? (
                <>
                  <span className="sm:hidden">{compactName}</span>
                  <span className="hidden sm:inline">{name}</span>
                </>
              ) : (
                name
              )}
            </span>
            {badge}
          </span>
          <span className="stat-num block text-xs text-ink-faint">{sub}</span>
        </span>
      </span>
      {chart ? (
        <div className="hidden w-full sm:block">{chart}</div>
      ) : (
        <WdlBar w={w} d={d} l={l} size="sm" tooltip={false} className="mx-auto hidden w-full max-w-[13rem] sm:block" />
      )}
      <span className="stat-num min-w-[6.5rem] whitespace-nowrap pl-3 text-right leading-snug sm:pl-4">
        <span className="block text-sm font-semibold text-ink">
          {pct(w, p)} <span className="text-[10px] font-normal text-ink-faint">win</span>
        </span>
        {gdPerGame != null && (
          <span className={`block text-xs font-medium ${gdTone(gdPerGame)}`}>
            {gdSign(gdPerGame)}
            {Math.abs(gdPerGame).toFixed(1)} <span className="text-ink-faint">gd/game</span>
          </span>
        )}
        <span className="block text-[11px] text-ink-faint">{fmtNum(p)} played</span>
      </span>
    </Link>
  );
}
