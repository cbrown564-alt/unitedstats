import type { TransferRow } from "@/lib/queries";
import { fmtFee, fmtNum } from "@/lib/format";
import { TransferList } from "./TransferList";

/**
 * The whole transfer record as a season-by-season archive. Every window since the
 * `since` cutoff (default 1980-81, where published fees become the norm) is one
 * collapsed row — season, the year's in/out count, and the net spend — that opens
 * to the full {@link TransferList} for that season. Everything before the cutoff,
 * where fees were almost never disclosed, folds into a single summary row that
 * expands to a compact per-season count grid rather than a wall of fee-less rows.
 *
 * Native `<details>`, zero JS — the {@link MatchArchive} collapse pattern, here
 * carrying money and counts instead of W-D-L.
 */
export function TransferArchive({
  transfers,
  since = 1980,
}: {
  transfers: TransferRow[];
  since?: number;
}) {
  const groups = groupBySeason(transfers);
  const modern = groups.filter((g) => g.startYear >= since);
  const legacy = groups.filter((g) => g.startYear > 0 && g.startYear < since);

  return (
    <div className="space-y-2">
      {modern.map((g, i) => (
        <SeasonRow key={g.season} group={g} open={i === 0} />
      ))}
      {legacy.length > 0 && <LegacySummary groups={legacy} since={since} />}
    </div>
  );
}

interface SeasonGroup {
  season: string;
  startYear: number;
  rows: TransferRow[];
  signings: number;
  departures: number;
  spend: number;
  received: number;
  net: number;
}

/** Rows arrive date-ordered, so seasons fall into consecutive runs. */
function groupBySeason(transfers: TransferRow[]): SeasonGroup[] {
  const groups: SeasonGroup[] = [];
  for (const t of transfers) {
    const season = t.season ?? "—";
    let g = groups[groups.length - 1];
    if (!g || g.season !== season) {
      g = {
        season,
        startYear: Number(season.slice(0, 4)) || 0,
        rows: [],
        signings: 0,
        departures: 0,
        spend: 0,
        received: 0,
        net: 0,
      };
      groups.push(g);
    }
    g.rows.push(t);
    if (t.direction === "in") g.signings++;
    else g.departures++;
    if (t.fee_kind === "fee" && t.fee_gbp != null) {
      if (t.direction === "in") {
        g.spend += t.fee_gbp;
        g.net += t.fee_gbp;
      } else {
        g.received += t.fee_gbp;
        g.net -= t.fee_gbp;
      }
    }
  }
  return groups;
}

const chevron =
  "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90";

const summaryCls =
  "flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright sm:px-4 [&::-webkit-details-marker]:hidden";

const Chevron = () => (
  <svg className={chevron} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Net figure, coloured by direction: red when the club spent, green when it banked. */
function NetFigure({ net, hasFee }: { net: number; hasFee: boolean }) {
  if (!hasFee) {
    return <span className="stat-num text-[11px] uppercase tracking-[0.1em] text-ink-faint">undisclosed</span>;
  }
  const gain = net < 0;
  return (
    <span className="text-right leading-none">
      <span className={`stat-num text-sm font-semibold tabular-nums ${gain ? "text-win" : "text-devil-bright"}`}>
        {gain ? `+${fmtFee(-net)}` : fmtFee(net)}
      </span>{" "}
      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">{gain ? "net gain" : "net spend"}</span>
    </span>
  );
}

/** Fee'd moves first, biggest fee at the top; fee-less moves sink, newest first. */
function byValue(rows: TransferRow[]): TransferRow[] {
  return [...rows].sort((a, b) => {
    const fa = a.fee_kind === "fee" && a.fee_gbp != null ? a.fee_gbp : -1;
    const fb = b.fee_kind === "fee" && b.fee_gbp != null ? b.fee_gbp : -1;
    if (fa !== fb) return fb - fa;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });
}

/** One direction's moves, ranked by fee, behind a coloured rail and label. */
function DirectionSection({ kind, rows }: { kind: "in" | "out"; rows: TransferRow[] }) {
  const isIn = kind === "in";
  const fees = rows.reduce((s, r) => s + (r.fee_kind === "fee" && r.fee_gbp != null ? r.fee_gbp : 0), 0);
  return (
    <div className={`border-l-2 pl-3 ${isIn ? "border-devil/70" : "border-gold/70"}`}>
      <div className="mb-2 flex items-baseline gap-2">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isIn ? "text-devil-bright" : "text-gold"}`}>
          {isIn ? "↓ Incoming" : "↑ Outgoing"}
        </span>
        <span className="stat-num text-[11px] text-ink-faint">
          {rows.length}
          {fees > 0 && <span className="text-ink-dim"> · {fmtFee(fees)}</span>}
        </span>
      </div>
      <TransferList transfers={byValue(rows)} showPlayer showDirection={false} />
    </div>
  );
}

function SeasonRow({ group: g, open = false }: { group: SeasonGroup; open?: boolean }) {
  const hasFee = g.spend > 0 || g.received > 0;
  const incoming = g.rows.filter((t) => t.direction === "in");
  const outgoing = g.rows.filter((t) => t.direction === "out");
  return (
    <details
      id={`txseason-${g.season}`}
      open={open}
      className="group scroll-mt-28 overflow-hidden rounded-lg border border-line bg-panel"
    >
      <summary className={summaryCls}>
        <Chevron />
        <h3 className="display w-[5rem] shrink-0 text-base leading-none">{g.season}</h3>
        <span className="stat-num text-xs text-ink-faint">
          {g.signings} in · {g.departures} out
        </span>
        <span className="ml-auto pl-3">
          <NetFigure net={g.net} hasFee={hasFee} />
        </span>
      </summary>
      {/* Stacked on mobile (divider between), side-by-side from lg up. */}
      <div className="grid items-start gap-x-6 gap-y-3 border-t border-line p-3 sm:p-4 lg:grid-cols-2">
        {incoming.length > 0 && <DirectionSection kind="in" rows={incoming} />}
        {incoming.length > 0 && outgoing.length > 0 && <div className="border-t border-line/60 lg:hidden" />}
        {outgoing.length > 0 && <DirectionSection kind="out" rows={outgoing} />}
      </div>
    </details>
  );
}

function LegacySummary({ groups, since }: { groups: SeasonGroup[]; since: number }) {
  const signings = groups.reduce((s, g) => s + g.signings, 0);
  const departures = groups.reduce((s, g) => s + g.departures, 0);
  const spend = groups.reduce((s, g) => s + g.spend, 0);
  const received = groups.reduce((s, g) => s + g.received, 0);
  const net = spend - received;
  const oldest = groups[groups.length - 1]?.season;
  const newest = groups[0]?.season;

  return (
    <details className="group overflow-hidden rounded-lg border border-line bg-panel">
      <summary className={summaryCls}>
        <Chevron />
        <h3 className="display shrink-0 text-base leading-none">Before {since}</h3>
        <span className="stat-num hidden text-xs text-ink-faint sm:inline">
          {fmtNum(signings)} in · {fmtNum(departures)} out · {groups.length} seasons
        </span>
        <span className="ml-auto pl-3">
          <NetFigure net={net} hasFee={spend > 0 || received > 0} />
        </span>
      </summary>
      <div className="border-t border-line p-3 sm:p-4">
        <p className="mb-3 max-w-2xl text-xs text-ink-dim">
          From {oldest} to {newest}, transfer fees were almost never published, so this era is summarised by
          the volume of business — every season&rsquo;s arrivals and departures, the money lost to the record.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-px sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.season} className="flex items-baseline justify-between border-b border-line/40 py-1">
              <span className="stat-num text-xs text-ink-dim">{g.season}</span>
              <span className="stat-num text-[11px] text-ink-faint">
                {g.signings} in · {g.departures} out
              </span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
