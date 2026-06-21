import Link from "next/link";
import {
  netSpendByDecade, netSpendByManager, recentTransfers,
  topTransfersByFee, transferTotals,
} from "@/lib/queries";
import { SectionHead } from "@/components/SectionHead";
import { Leaderboard, type LeaderboardItem } from "@/components/Leaderboard";
import { SpendBars } from "@/components/SpendBars";
import { TransferList } from "@/components/TransferList";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtFee, fmtNum } from "@/lib/format";

export const metadata = { title: "Transfers" };

export default async function TransfersPage() {
  const totals = transferTotals();
  const net = totals.gross_spend - totals.gross_received;
  const topIn = topTransfersByFee("in", 6);
  const topOut = topTransfersByFee("out", 6);
  const byManager = netSpendByManager();
  const byDecade = netSpendByDecade().filter((d) => d.spend > 0 || d.received > 0);
  const recent = recentTransfers(12);

  const recordSign = topIn[0];
  const recordSale = topOut[0];
  const topSpender = byManager[0];

  const toItem = (
    t: (typeof topIn)[number],
  ): LeaderboardItem => ({
    id: t.player_id ?? t.id,
    name: t.player_name,
    src: t.thumb_url,
    figure: fmtFee(t.fee_gbp),
    sub: `${t.club ?? "—"} · ${t.date ? t.date.slice(0, 4) : "—"}`,
  });

  return (
    <div className="space-y-8">
      {/* The whole transfer ledger as one frontier: a century and a half of money
          in and out, leading with the net and the two record deals. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
            People · the ledger
          </p>
          <h1 className="display max-w-3xl text-4xl leading-[0.95] sm:text-5xl">
            {fmtFee(net)} net, in and out since 1883
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-dim sm:text-base">
            Every recorded arrival and departure, Newton Heath to now — {fmtNum(totals.signings)} in,{" "}
            {fmtNum(totals.departures)} out. The club&rsquo;s record buy is{" "}
            {recordSign && (
              <Link href={`/player/${recordSign.player_id}`} className="font-semibold text-ink hover:text-devil-bright">
                {recordSign.player_name}
              </Link>
            )}{" "}
            at {recordSign && fmtFee(recordSign.fee_gbp)}; its record sale,{" "}
            {recordSale && (
              <Link href={`/player/${recordSale.player_id}`} className="font-semibold text-ink hover:text-devil-bright">
                {recordSale.player_name}
              </Link>
            )}{" "}
            at {recordSale && fmtFee(recordSale.fee_gbp)}.
          </p>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Gross spend</dt>
              <dd className="stat-num text-lg font-semibold text-devil-bright">{fmtFee(totals.gross_spend)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Gross received</dt>
              <dd className="stat-num text-lg font-semibold text-gold">{fmtFee(totals.gross_received)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Net spend</dt>
              <dd className="stat-num text-lg font-semibold text-ink">{fmtFee(net)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Biggest spender</dt>
              <dd className="stat-num text-lg font-semibold text-ink">
                {topSpender ? fmtFee(topSpender.net) : "—"}{" "}
                <span className="text-sm font-normal text-ink-dim">{topSpender?.bucket}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Movement 1 — the record deals, both ways. */}
      <section className="space-y-3">
        <SectionHead title="The record deals" aside="by fee" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Leaderboard
            title="Most expensive signings"
            unit="fee in"
            items={topIn.map(toItem)}
            figureTone="text-devil-bright"
          />
          <Leaderboard
            title="Most expensive sales"
            unit="fee out"
            items={topOut.map(toItem)}
            figureTone="text-gold"
          />
        </div>
      </section>

      {/* Movement 2 — who spent it: net spend by the manager in charge. */}
      <section className="space-y-3">
        <SectionHead title="Who spent it" aside="net, by manager" />
        <SpendBars buckets={byManager} hrefFor={(b) => `/manager/${b.bucket_id}`} />
        <CoverageNote slice="known-fee transfers, attributed to the manager in charge on the transfer date.">
          The red bar is spend, the gold receipts, on one shared scale; the figure is the net. Free,
          undisclosed and historically unrecorded fees carry no amount, so totals are a floor.
        </CoverageNote>
      </section>

      {/* Movement 3 — the long arc, by decade. */}
      <section className="space-y-3">
        <SectionHead title="The long arc" aside="net, by decade" />
        <SpendBars buckets={byDecade} />
      </section>

      {/* Movement 4 — recent business. */}
      <section className="space-y-3">
        <SectionHead title="Recent business" aside={`latest ${recent.length}`} />
        <TransferList transfers={recent} showPlayer />
        <CoverageNote
          slice="all recorded transfers, 1883–present"
          evidenceHref="/data"
          evidenceLabel="Coverage details"
        >
          Spend and receipts count only the{" "}
          <span className="stat-num text-ink">{fmtNum(totals.spend_rows + totals.received_rows)}</span> deals with a
          known fee, of {fmtNum(totals.signings + totals.departures)} total; many historical fees were never
          published and are shown as undisclosed, never as £0.
        </CoverageNote>
      </section>
    </div>
  );
}
