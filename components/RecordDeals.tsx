import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { transferEditorialLine } from "@/lib/transferEditorial";
import { fmtFee } from "@/lib/format";
import type { TransferRow } from "@/lib/queries";

function dealSub(t: TransferRow): string {
  return `${t.club ?? "—"} · ${t.date ? t.date.slice(0, 4) : "—"}`;
}

function FeaturedDeal({
  t,
  rank,
  figureTone,
}: {
  t: TransferRow;
  rank: number;
  figureTone: string;
}) {
  const href = t.player_id ? `/player/${t.player_id}` : undefined;
  const inner = (
    <>
      <span className="stat-num absolute left-3.5 top-3.5 text-xs text-ink-faint">{rank}</span>
      <PlayerPortrait name={t.player_name} src={t.thumb_url} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight">{t.player_name}</p>
        <p className={`stat-num mt-1 text-2xl font-semibold leading-none ${figureTone}`}>{fmtFee(t.fee_gbp)}</p>
        <p className="stat-num mt-1 text-[11px] text-ink-faint">{dealSub(t)}</p>
        <p className="mt-2 text-sm leading-5 text-ink-dim">{transferEditorialLine(t)}</p>
      </div>
    </>
  );

  const cls =
    "relative flex items-start gap-3.5 border-b border-line/70 px-3.5 py-4 transition-colors hover:bg-panel-2";

  if (href) {
    return (
      <Link href={href} className={`${cls} focus-ring`}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}

function CompactDeal({
  t,
  rank,
  figureTone,
}: {
  t: TransferRow;
  rank: number;
  figureTone: string;
}) {
  const href = t.player_id ? `/player/${t.player_id}` : undefined;
  const inner = (
    <>
      <span className="stat-num w-4 shrink-0 text-right text-xs text-ink-faint">{rank}</span>
      <PlayerPortrait name={t.player_name} src={t.thumb_url} size="xs" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight">{t.player_name}</span>
        <span className="stat-num block truncate text-[11px] leading-tight text-ink-faint">{dealSub(t)}</span>
      </span>
      <span className={`stat-num shrink-0 text-base font-semibold tabular-nums ${figureTone}`}>
        {fmtFee(t.fee_gbp)}
      </span>
    </>
  );
  const cls = "flex items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-panel-2";

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}

function DealBoard({
  title,
  unit,
  deals,
  figureTone,
}: {
  title: string;
  unit: string;
  deals: TransferRow[];
  figureTone: string;
}) {
  const [featured, ...rest] = deals;
  if (!featured) return null;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
      <header className="flex items-baseline justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
        <h3 className="display text-base leading-none">{title}</h3>
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{unit}</span>
      </header>
      <FeaturedDeal t={featured} rank={1} figureTone={figureTone} />
      {rest.length > 0 && (
        <ol className="divide-y divide-line/50">
          {rest.map((t, i) => (
            <li key={t.id}>
              <CompactDeal t={t} rank={i + 2} figureTone={figureTone} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Record deals by fee — #1 featured with editorial line, ranks 2–6 compact. */
export function RecordDeals({
  signings,
  sales,
}: {
  signings: TransferRow[];
  sales: TransferRow[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DealBoard title="Most expensive signings" unit="fee in" deals={signings} figureTone="text-devil-bright" />
      <DealBoard title="Most expensive sales" unit="fee out" deals={sales} figureTone="text-gold" />
    </div>
  );
}
