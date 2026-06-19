import Link from "next/link";
import { WdlBar } from "./WdlBar";
import { fmtNum, pct } from "@/lib/format";

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
  sub,
  w,
  d,
  l,
}: {
  href: string;
  rank?: number;
  leading: React.ReactNode;
  name: string;
  sub: React.ReactNode;
  w: number;
  d: number;
  l: number;
}) {
  const p = w + d + l;
  return (
    <Link
      href={href}
      className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1.5 px-4 py-3 transition-colors hover:bg-panel sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto]"
    >
      <span className="flex min-w-0 items-center gap-3">
        {rank != null && (
          <span className="stat-num w-6 shrink-0 text-right text-xs text-ink-faint">{rank}</span>
        )}
        {leading}
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          <span className="stat-num block text-xs text-ink-faint">{sub}</span>
        </span>
      </span>
      <WdlBar w={w} d={d} l={l} size="sm" tooltip={false} className="hidden sm:block" />
      <span className="stat-num whitespace-nowrap text-right text-xs text-ink-dim">
        {fmtNum(p)} P · <span className="text-ink">{pct(w, p)}</span> W
      </span>
    </Link>
  );
}
