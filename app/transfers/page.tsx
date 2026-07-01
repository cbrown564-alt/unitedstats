import {
  datedTransfers, managersIndex, netSpendByManager, spendTideByYear,
  topTransfersByFee, transferTotals,
} from "@/lib/queries";
import { SectionHead } from "@/components/SectionHead";
import { RecordDeals } from "@/components/RecordDeals";
import { SpendBars } from "@/components/SpendBars";
import { SpendTide } from "@/components/charts/SpendTide";
import { TransferArchive } from "@/components/TransferArchive";
import { CoverageNote } from "@/components/CoverageNote";
import { PageHeader } from "@/components/PageHeader";
import { fmtFee, fmtNum } from "@/lib/format";

export const metadata = {
  title: "Transfers",
  description: "A century and a half of Manchester United transfer business — record fees, signings, sales, and net spend by manager since 1883.",
};

export default async function TransfersPage() {
  const totals = transferTotals();
  const net = totals.gross_spend - totals.gross_received;
  const topIn = topTransfersByFee("in", 6);
  const topOut = topTransfersByFee("out", 6);
  // Only the biggest spenders: below the top 10 every manager sits at ~£0 net, an
  // artefact of undisclosed historical fees rather than a real spending story.
  const byManager = netSpendByManager().slice(0, 10);
  const managerPortrait = new Map(
    managersIndex().map((m) => [m.id, { name: m.name, src: m.thumb_url ?? m.image_url }]),
  );
  const tide = spendTideByYear();
  const archive = datedTransfers();

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="People · the ledger" title="Transfers" deferOnMobile>
        Known fees since 1883. Many early deals were never disclosed.
      </PageHeader>

      {/* The whole transfer record as one floodlit object: the money tide across a
          century and a half, leading with the running net total. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-4 sm:p-5 lg:p-7">
          <div className="mt-2 space-y-3 border-b border-line/60 pb-4 lg:hidden">
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Net</dt>
                <dd className="stat-num text-lg font-semibold leading-tight text-ink">{fmtFee(net)}</dd>
              </div>
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Spent</dt>
                <dd className="stat-num text-lg font-semibold leading-tight text-devil-bright">
                  {fmtFee(totals.gross_spend)}
                  {topIn[0] && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                      {topIn[0].player_name}
                    </span>
                  )}
                </dd>
              </div>
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Received</dt>
                <dd className="stat-num text-lg font-semibold leading-tight text-gold">
                  {fmtFee(totals.gross_received)}
                  {topOut[0] && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                      {topOut[0].player_name}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="hidden lg:block">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div className="leading-none">
                <div className="flex items-baseline gap-2">
                  <span className="stat-num text-4xl font-semibold text-ink sm:text-5xl">{fmtFee(net)}</span>
                  <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">net since 1883</span>
                </div>
              </div>
              <dl className="flex flex-wrap items-end gap-x-7 gap-y-3.5 border-l border-line pl-6">
                <div className="leading-none">
                  <dd className="stat-num text-xl font-semibold text-devil-bright">{fmtFee(totals.gross_spend)}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    Spent <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtNum(totals.signings)} signings</span>
                  </dt>
                </div>
                <div className="leading-none">
                  <dd className="stat-num text-xl font-semibold text-gold">{fmtFee(totals.gross_received)}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    Received <span className="ml-1 normal-case tracking-normal text-ink-dim">{fmtNum(totals.departures)} departures</span>
                  </dt>
                </div>
              </dl>
            </div>
          </div>

          <details className="group mt-4 lg:hidden">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim hover:text-ink focus-ring">
              The money tide
            </summary>
            <div className="mt-3">
              <SpendTide years={tide} />
            </div>
            <p className="mt-4 max-w-xl text-xs text-ink-faint">
              <span className="text-ink-dim">Slice:</span> every recorded arrival and departure, Newton Heath to now.
              Spend and receipts count only the{" "}
              <span className="stat-num text-ink-dim">{fmtNum(totals.spend_rows + totals.received_rows)}</span> deals with a
              published fee, of {fmtNum(totals.signings + totals.departures)} total movements — many historical fees were
              never disclosed, so the money is a floor and the early years sit flat on the line.
            </p>
          </details>
          <div className="mt-6 hidden lg:block">
            <SpendTide years={tide} />
          </div>

          <p className="mt-4 hidden max-w-xl text-xs text-ink-faint lg:block">
            <span className="text-ink-dim">Slice:</span> every recorded arrival and departure, Newton Heath to now.
            Spend and receipts count only the{" "}
            <span className="stat-num text-ink-dim">{fmtNum(totals.spend_rows + totals.received_rows)}</span> deals with a
            published fee, of {fmtNum(totals.signings + totals.departures)} total movements — many historical fees were
            never disclosed, so the money is a floor and the early years sit flat on the line.
          </p>
        </div>
      </section>

      {/* The record deals, both ways — the individual deals behind the tide's
          peak years (the hero foregrounds the peak years; these name the records). */}
      <section className="space-y-3">
        <SectionHead title="The record deals" aside="by fee" />
        <RecordDeals signings={topIn} sales={topOut} />
      </section>

      {/* Who spent it: net spend by the manager in charge — the same money cut by
          person rather than by year. */}
      <section className="space-y-3">
        <SectionHead title="Who spent it" aside="top 10 by net" />
        <SpendBars
          buckets={byManager}
          hrefFor={(b) => `/manager/${b.bucket_id}`}
          portraitFor={(b) => managerPortrait.get(b.bucket_id) ?? null}
        />
        <CoverageNote slice="known-fee transfers, attributed to the manager in charge on the transfer date.">
          The red bar is spend, the gold receipts, on one shared scale; the figure is the net. Only the ten
          biggest net spenders are shown — every manager below them sits near £0, an artefact of undisclosed
          historical fees, not a real spend. Free and unrecorded fees carry no amount, so totals are a floor.
        </CoverageNote>
      </section>

      {/* The full record, season by season — every window since 1980 expandable,
          the fee-less era before it folded into one summary. */}
      <section className="space-y-3">
        <SectionHead title="Season by season" aside="every window, newest first" />
        <TransferArchive transfers={archive} since={1980} />
        <CoverageNote
          slice="all recorded transfers, 1883–present"
          evidenceHref="/data"
          evidenceLabel="Coverage details"
        >
          Each season opens to its full list of transfers; net spend counts only the deals with a known fee.
          Academy promotions, releases and retirements carry no fee and no market, so they sit out of the
          two money columns — use the toggle to fold them into a quiet lane beneath each season. Before 1980
          fees were almost never published, so that era is summarised by the volume of business, never shown as £0.
        </CoverageNote>
      </section>
    </div>
  );
}
