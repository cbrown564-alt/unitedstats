import Link from "next/link";
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
 * Academy promotions, releases and retirements are not market business — no fee,
 * no counterparty club — so they stay out of the two money columns and live in a
 * quiet off-market lane beneath them, hidden until the section-level toggle folds
 * them in. The toggle is a pure-CSS checkbox (`:has` on the `group/arch` root), so
 * the section keeps the native-`<details>`, zero-JS shape of the {@link MatchArchive}.
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
  const offmarketTotal = groups.reduce((s, g) => s + g.offmarketCount, 0);

  return (
    // Named group so the off-market reveal keys off this checkbox without touching
    // the unnamed `group` each <details> uses for its chevron.
    <div className="group/arch">
      <OffMarketToggle total={offmarketTotal} />
      <div className="space-y-2">
        {modern.map((g, i) => (
          <SeasonRow key={g.season} group={g} open={i === 0} />
        ))}
        {legacy.length > 0 && <LegacySummary groups={legacy} since={since} />}
      </div>
    </div>
  );
}

const OFFMARKET_TYPES = new Set(["youth", "released", "retired"]);

interface SeasonGroup {
  season: string;
  startYear: number;
  /** Real market business — permanent deals and loans — split by direction. */
  marketIn: TransferRow[];
  marketOut: TransferRow[];
  /** Off-market roster events: promotions in, releases and retirements out. */
  academy: TransferRow[];
  released: TransferRow[];
  retired: TransferRow[];
  offmarketCount: number;
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
        marketIn: [],
        marketOut: [],
        academy: [],
        released: [],
        retired: [],
        offmarketCount: 0,
        spend: 0,
        received: 0,
        net: 0,
      };
      groups.push(g);
    }
    if (OFFMARKET_TYPES.has(t.type)) {
      if (t.type === "youth") g.academy.push(t);
      else if (t.type === "released") g.released.push(t);
      else g.retired.push(t);
      g.offmarketCount++;
      continue;
    }
    if (t.direction === "in") g.marketIn.push(t);
    else g.marketOut.push(t);
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

/**
 * Section-level switch that folds the off-market lanes in. A real checkbox kept
 * `sr-only` for accessibility; the visual track/thumb ride its `:checked` state,
 * and the lanes below reveal via `group-has-[:checked]/arch`. No JavaScript.
 */
function OffMarketToggle({ total }: { total: number }) {
  if (total === 0) return null;
  return (
    <div className="mb-3 flex items-center justify-end">
      <label className="inline-flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs transition-colors hover:bg-panel-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-devil-bright">
        <input type="checkbox" className="peer sr-only" />
        <span className="relative h-4 w-7 shrink-0 rounded-full bg-line transition-colors duration-200 peer-checked:bg-devil peer-checked:[&>span]:translate-x-3 peer-checked:[&>span]:bg-ink">
          <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-ink-dim transition-transform duration-200" />
        </span>
        <span className="text-ink-dim">
          <span className="font-medium text-ink">Academy, releases &amp; retirements</span>
          <span className="stat-num ml-1.5 text-ink-faint">{fmtNum(total)}</span>
        </span>
      </label>
    </div>
  );
}

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

/* Subtle 14px glyphs for the off-market kinds — a promotion rising over a line,
   a departure arrow leaving a frame, a flag run up for a career closed out. */
const glyph = "h-3.5 w-3.5 shrink-0 text-ink-faint";
const AcademyGlyph = () => (
  <svg className={glyph} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 3v7" />
    <path d="M5 6l3-3 3 3" />
    <path d="M3.5 13h9" />
  </svg>
);
const ReleasedGlyph = () => (
  <svg className={glyph} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 3H4v10h5" />
    <path d="M7 8h6" />
    <path d="M10.5 5.5L13 8l-2.5 2.5" />
  </svg>
);
const RetiredGlyph = () => (
  <svg className={glyph} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 13V3" />
    <path d="M5 3.5h7l-2 2.25L12 8H5" />
  </svg>
);

/** Newest first, by best available date. */
function byDateDesc(rows: TransferRow[]): TransferRow[] {
  return [...rows].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** One off-market kind: glyph, label, count, then the names as a wrapping run. */
function OffGroup({
  label,
  Glyph,
  rows,
}: {
  label: string;
  Glyph: () => React.ReactElement;
  rows: TransferRow[];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5">
        <Glyph />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</span>
        <span className="stat-num text-[10px] text-ink-faint">{rows.length}</span>
      </div>
      <p className="text-xs leading-relaxed">
        {byDateDesc(rows).map((r, i) => (
          <span key={r.id}>
            {i > 0 && <span className="text-ink-faint">, </span>}
            {r.player_id ? (
              <Link href={`/player/${r.player_id}`} className="text-ink-dim hover:text-ink">
                {r.player_name}
              </Link>
            ) : (
              <span className="text-ink-faint">{r.player_name}</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * The quiet stratum beneath the money columns. Hidden until the section toggle is
 * checked; reveals as a dashed-topped band grouping the season's promotions,
 * releases and retirements — the roster moves with no fee and no market.
 */
function OffMarketLane({ group: g }: { group: SeasonGroup }) {
  if (g.offmarketCount === 0) return null;
  const kinds = [
    { label: "Academy", Glyph: AcademyGlyph, rows: g.academy },
    { label: "Released", Glyph: ReleasedGlyph, rows: g.released },
    { label: "Retired", Glyph: RetiredGlyph, rows: g.retired },
  ].filter((k) => k.rows.length > 0);

  return (
    <div className="hidden border-t border-dashed border-line pt-3 group-has-[:checked]/arch:block">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        Off the market <span className="text-ink-faint/70">· no fee changed hands</span>
      </p>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {kinds.map((k) => (
          <OffGroup key={k.label} label={k.label} Glyph={k.Glyph} rows={k.rows} />
        ))}
      </div>
    </div>
  );
}

function SeasonRow({ group: g, open = false }: { group: SeasonGroup; open?: boolean }) {
  const hasFee = g.spend > 0 || g.received > 0;
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
          {g.marketIn.length} in · {g.marketOut.length} out
          {g.offmarketCount > 0 && (
            <span className="hidden text-ink-dim group-has-[:checked]/arch:inline"> · {g.offmarketCount} off-market</span>
          )}
        </span>
        <span className="ml-auto pl-3">
          <NetFigure net={g.net} hasFee={hasFee} />
        </span>
      </summary>
      <div className="space-y-3 border-t border-line p-3 sm:p-4">
        {/* Stacked on mobile (divider between), side-by-side from lg up. Each side is
            pinned to its column so a lone section keeps its place — incoming left,
            outgoing right — and reads straight down against the seasons around it. */}
        <div className="grid items-start gap-x-6 gap-y-3 lg:grid-cols-2">
          {g.marketIn.length > 0 && (
            <div className="lg:col-start-1 lg:row-start-1">
              <DirectionSection kind="in" rows={g.marketIn} />
            </div>
          )}
          {g.marketIn.length > 0 && g.marketOut.length > 0 && <div className="border-t border-line/60 lg:hidden" />}
          {g.marketOut.length > 0 && (
            <div className="lg:col-start-2 lg:row-start-1">
              <DirectionSection kind="out" rows={g.marketOut} />
            </div>
          )}
        </div>
        <OffMarketLane group={g} />
      </div>
    </details>
  );
}

function LegacySummary({ groups, since }: { groups: SeasonGroup[]; since: number }) {
  const signings = groups.reduce((s, g) => s + g.marketIn.length, 0);
  const departures = groups.reduce((s, g) => s + g.marketOut.length, 0);
  const offmarket = groups.reduce((s, g) => s + g.offmarketCount, 0);
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
          {offmarket > 0 && (
            <span className="hidden text-ink-dim group-has-[:checked]/arch:inline"> · {fmtNum(offmarket)} off-market</span>
          )}
        </span>
        <span className="ml-auto pl-3">
          <NetFigure net={net} hasFee={spend > 0 || received > 0} />
        </span>
      </summary>
      <div className="border-t border-line p-3 sm:p-4">
        <p className="mb-3 max-w-2xl text-xs text-ink-dim">
          From {oldest} to {newest}, transfer fees were almost never published, so this era is summarised by
          the volume of business — every season’s arrivals and departures, the money lost to the record.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-px sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.season} className="flex items-baseline justify-between border-b border-line/40 py-1">
              <span className="stat-num text-xs text-ink-dim">{g.season}</span>
              <span className="stat-num text-[11px] text-ink-faint">
                {g.marketIn.length} in · {g.marketOut.length} out
                {g.offmarketCount > 0 && (
                  <span className="hidden text-ink-dim group-has-[:checked]/arch:inline"> · {g.offmarketCount}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
