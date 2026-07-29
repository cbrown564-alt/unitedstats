import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import { fmtDate, fmtFee, fmtMonthYear, fmtNum, fmtSeasonShort, feeLabel } from "@/lib/format";
import type { InflationIndices, MoneyMode } from "@/lib/inflation";
import { moneyModeLabel } from "@/lib/inflation";
import {
  displayReceiptFee,
  type TransferReceipt,
  type TransferReceiptDeal,
  type TransferReceiptExit,
  type TransferReceiptSpell,
} from "@/lib/transferReceiptTypes";
import { transferMoveLabel } from "@/lib/transferTaxonomy";

function transferWhen(date: string | null, precision: TransferReceiptDeal["datePrecision"]): string {
  if (!date) return "—";
  if (precision === "day") return fmtDate(date);
  if (precision === "month") return fmtMonthYear(date);
  return date.slice(0, 4);
}

function typeLabel(type: string): string {
  if (type === "permanent") return "Permanent";
  if (type === "loan") return "Loan";
  if (type === "youth") return "Academy";
  if (type === "released") return "Released";
  if (type === "retired") return "Retired";
  return type;
}

function spellStateLabel(state: TransferReceiptSpell["state"]): string {
  if (state === "ongoing") return "Ongoing spell";
  if (state === "completed") return "Completed spell";
  if (state === "unclosed") return "No recorded exit yet";
  return "Spell unresolved in the record";
}

function assistCoverageNote(coverage: TransferReceiptSpell["assistCoverage"]): string | null {
  if (coverage === "match-attributed") return "Assists from match events.";
  if (coverage === "curated-lane") return "Assists from the curated Tableau lane only.";
  if (coverage === "partial") return "Assists mix curated seasons with later match events.";
  return null;
}

function ReceiptField({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</dt>
      <dd className={`stat-num mt-0.5 text-sm ${muted ? "text-ink-faint" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function DealSection({
  deal,
  moneyMode,
  indices,
}: {
  deal: TransferReceiptDeal;
  moneyMode: MoneyMode;
  indices?: InflationIndices;
}) {
  const nominal = feeLabel(deal.feeKind, deal.feeGbp);
  const adjusted =
    indices && moneyMode !== "nominal"
      ? displayReceiptFee(deal.feeGbp, deal.feeKind, deal.date, deal.season, moneyMode, indices)
      : null;

  return (
    <section aria-labelledby={`receipt-deal-${deal.transferId}`}>
      <h3 id={`receipt-deal-${deal.transferId}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
        Deal
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ReceiptField
          label={deal.direction === "in" ? "Arrival" : "Departure"}
          value={
            <>
              {transferWhen(deal.date, deal.datePrecision)}
              {deal.season ? ` · ${fmtSeasonShort(deal.season)}` : ""}
            </>
          }
        />
        <ReceiptField label="Club" value={deal.club ?? "—"} />
        <ReceiptField label="Move type" value={typeLabel(deal.type)} />
        <ReceiptField label="Fee" value={nominal} />
        {adjusted != null && (
          <ReceiptField label={moneyModeLabel(moneyMode)} value={fmtFee(adjusted)} muted />
        )}
        {deal.feeBandLabel && <ReceiptField label="Relative cost" value={deal.feeBandLabel} muted />}
        <ReceiptField label="Manager" value={deal.managerName ?? "—"} muted />
      </dl>
      {deal.editorialNote && (
        <p className="mt-3 border-l-2 border-devil-bright/50 pl-3 text-sm leading-6 text-ink-dim">
          {deal.editorialNote}
        </p>
      )}
      {deal.sources.length > 0 && (
        <p className="mt-3 text-xs text-ink-faint">
          Sources: {deal.sources.join(", ")}
        </p>
      )}
    </section>
  );
}

function SpellSection({ spell }: { spell: TransferReceiptSpell }) {
  const assistNote = assistCoverageNote(spell.assistCoverage);
  return (
    <section aria-labelledby={`receipt-spell-${spell.spellId}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`receipt-spell-${spell.spellId}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
          United spell
        </h3>
        <span className="text-[11px] text-ink-faint">
          {spell.repeatPlayer && spell.spellCount > 1
            ? `Spell ${spell.spellIndex} of ${spell.spellCount}`
            : spellStateLabel(spell.state)}
        </span>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReceiptField label="Appearances" value={spell.apps ?? "—"} />
        <ReceiptField
          label="Starts / subs"
          value={
            spell.starts != null && spell.subs != null
              ? `${fmtNum(spell.starts)} / ${fmtNum(spell.subs)}`
              : "—"
          }
        />
        <ReceiptField label="Goals" value={spell.goals ?? "—"} />
        <ReceiptField
          label="Assists"
          value={spell.assists != null ? fmtNum(spell.assists) : "—"}
          muted={spell.assistCoverage !== "match-attributed"}
        />
        <ReceiptField label="Seasons" value={spell.seasons.length > 0 ? spell.seasons.map(fmtSeasonShort).join(", ") : "—"} />
        <ReceiptField label="Position" value={spell.position ?? "—"} muted />
        <ReceiptField
          label="Debut → last"
          value={
            spell.debutDate && spell.finalAppearanceDate
              ? `${transferWhen(spell.debutDate, "day")} → ${transferWhen(spell.finalAppearanceDate, "day")}`
              : "—"
          }
          muted
        />
        <ReceiptField
          label="Peak season"
          value={
            spell.peakSeason
              ? `${fmtSeasonShort(spell.peakSeason)} (${fmtNum(spell.peakSeasonApps)} apps)`
              : "—"
          }
          muted
        />
      </dl>
      {assistNote && <p className="mt-2 text-xs text-ink-faint">{assistNote}</p>}
    </section>
  );
}

function TeamContextSection({
  teamContext,
}: {
  teamContext: NonNullable<TransferReceipt["teamContext"]>;
}) {
  const honours = teamContext.honourSeasons;
  const finishes = teamContext.leagueFinishes.filter((row) => row.topFlight);
  return (
    <section aria-labelledby="receipt-team-context">
      <h3 id="receipt-team-context" className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
        Team context
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <ReceiptField
          label="Honours during the spell"
          value={
            honours.length > 0
              ? honours.map(fmtSeasonShort).join(", ")
              : "No documented medal involvement in the record"
          }
          muted={honours.length === 0}
        />
        <ReceiptField
          label="League finishes during the spell"
          value={
            finishes.length > 0
              ? finishes
                  .map((row) =>
                    row.champion
                      ? `${fmtSeasonShort(row.season)} champions`
                      : `${fmtSeasonShort(row.season)}: ${row.position ?? "—"}`,
                  )
                  .join(" · ")
              : "—"
          }
          muted={finishes.length === 0}
        />
      </dl>
      {teamContext.roleNote && (
        <p className="mt-3 text-sm leading-6 text-ink-dim">{teamContext.roleNote}</p>
      )}
      <p className="mt-2 text-xs text-ink-faint">
        Honours and league finishes describe teams the player was involved in during the spell — not individual impact.
      </p>
    </section>
  );
}

function ExitSection({
  exit,
  deal,
  moneyMode,
  indices,
}: {
  exit: TransferReceiptExit;
  deal: TransferReceiptDeal;
  moneyMode: MoneyMode;
  indices?: InflationIndices;
}) {
  const isSameAsDeal = exit.transferId === deal.transferId;
  const nominal = exit.feeKind ? feeLabel(exit.feeKind, exit.feeGbp) : "—";
  const adjusted =
    indices && moneyMode !== "nominal" && exit.feeKind
      ? displayReceiptFee(exit.feeGbp, exit.feeKind, exit.date, deal.season, moneyMode, indices)
      : null;

  return (
    <section aria-labelledby={`receipt-exit-${exit.transferId ?? "none"}`}>
      <h3 id={`receipt-exit-${exit.transferId ?? "none"}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
        Exit
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!isSameAsDeal && (
          <ReceiptField label="Date" value={transferWhen(exit.date, exit.datePrecision)} />
        )}
        <ReceiptField label="Destination" value={exit.destination ?? "—"} />
        <ReceiptField label="Exit fee" value={nominal} />
        {adjusted != null && (
          <ReceiptField label={`Exit · ${moneyModeLabel(moneyMode)}`} value={fmtFee(adjusted)} muted />
        )}
      </dl>
      {exit.subsequentSigningId && (
        <p className="mt-3 text-sm text-ink-dim">
          Later returned to United —{" "}
          <Link href={`/player/${deal.playerId}#transfers`} className="font-medium text-devil-bright hover:underline focus-ring">
            see the later spell
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function DefiningNights({ receipt }: { receipt: TransferReceipt }) {
  if (receipt.definingNights.length === 0) return null;
  return (
    <section aria-labelledby={`receipt-nights-${receipt.deal.transferId}`}>
      <h3 id={`receipt-nights-${receipt.deal.transferId}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
        Defining nights
      </h3>
      <ul className="mt-3 space-y-2">
        {receipt.definingNights.map((night) => (
          <li key={night.matchId}>
            <Link
              href={`/match/${night.matchId}`}
              className="group block rounded-lg border border-line/70 bg-panel-2/40 px-3 py-2.5 transition-colors hover:border-line hover:bg-panel-2 focus-ring"
            >
              <span className="text-sm leading-5 text-ink-dim group-hover:text-ink">{night.stakes}</span>
              <span className="stat-num mt-1 block text-xs text-ink-faint">
                {night.score} v {night.opponent} · {transferWhen(night.date, "day")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Scorecard bridging a deal to United career outcome — not a verdict. */
export function TransferReceiptCard({
  receipt,
  moneyMode = "nominal",
  indices,
  compact = false,
  rank,
  className = "",
}: {
  receipt: TransferReceipt;
  moneyMode?: MoneyMode;
  indices?: InflationIndices;
  compact?: boolean;
  rank?: number;
  className?: string;
}) {
  const { deal, spell, teamContext, exit } = receipt;
  const playerHref = deal.playerId ? `/player/${deal.playerId}` : undefined;

  if (compact) {
    return (
      <article
        className={`rounded-lg border border-line bg-panel px-3.5 py-3 ${className}`}
        aria-label={`Transfer receipt for ${deal.playerName}`}
      >
        <div className="flex items-start gap-3">
          {rank != null && (
            <span className="stat-num shrink-0 text-xs text-ink-faint">{rank}</span>
          )}
          <PlayerPortrait name={deal.playerName} src={deal.thumbUrl} size="xs" />
          <div className="min-w-0 flex-1">
            {playerHref ? (
              <TransferHistoryLink
                href={playerHref}
                prefetch={false}
                destination="player"
                source="record_deals"
                className="truncate text-sm font-semibold text-ink hover:text-devil-bright focus-ring"
              >
                {deal.playerName}
              </TransferHistoryLink>
            ) : (
              <p className="truncate text-sm font-semibold">{deal.playerName}</p>
            )}
            <p className="stat-num mt-0.5 text-base font-semibold text-ink">
              {feeLabel(deal.feeKind, deal.feeGbp)}
            </p>
            {spell && (
              <p className="mt-1 text-xs leading-5 text-ink-dim">
                {fmtNum(spell.apps ?? 0)} apps
                {(spell.goals ?? 0) > 0 ? ` · ${fmtNum(spell.goals!)} goals` : ""}
                {teamContext && teamContext.honourSeasons.length > 0
                  ? ` · involved in ${teamContext.honourSeasons.length} honour${teamContext.honourSeasons.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`overflow-hidden rounded-xl border border-line bg-panel ${className}`}
      aria-label={`Transfer receipt for ${deal.playerName}`}
    >
      <header className="relative flex items-start gap-3.5 border-b border-line/70 px-4 py-4 sm:px-5">
        {rank != null && (
          <span className="stat-num absolute left-3.5 top-3.5 text-xs text-ink-faint">{rank}</span>
        )}
        <PlayerPortrait name={deal.playerName} src={deal.thumbUrl} size="md" />
        <div className="min-w-0 flex-1">
          {playerHref ? (
            <TransferHistoryLink
              href={playerHref}
              prefetch={false}
              destination="player"
              source="record_deals"
              className="display text-xl leading-tight text-ink hover:text-devil-bright focus-ring"
            >
              {deal.playerName}
            </TransferHistoryLink>
          ) : (
            <h2 className="display text-xl leading-tight">{deal.playerName}</h2>
          )}
          <p className="mt-1 text-sm text-ink-dim">
            {transferMoveLabel(deal, deal.direction)}
            {deal.club ? ` · ${deal.direction === "in" ? "from" : "to"} ${deal.club}` : ""}
            {deal.date ? ` · ${transferWhen(deal.date, deal.datePrecision)}` : ""}
          </p>
          {spell?.repeatPlayer && spell.spellCount > 1 && (
            <p className="mt-1 text-xs text-ink-faint">
              United spell {spell.spellIndex} of {spell.spellCount} — not merged with earlier moves.
            </p>
          )}
        </div>
      </header>

      <div className="space-y-6 px-4 py-5 sm:px-5">
        <DealSection deal={deal} moneyMode={moneyMode} indices={indices} />
        {spell && <SpellSection spell={spell} />}
        {teamContext && <TeamContextSection teamContext={teamContext} />}
        {exit && <ExitSection exit={exit} deal={deal} moneyMode={moneyMode} indices={indices} />}
        <DefiningNights receipt={receipt} />
      </div>

      <CoverageNote
        className="border-t border-line/70 px-4 py-3 sm:px-5"
        slice={`Transfer receipt · ${deal.transferId}`}
        coverage="Unknown or undisclosed fees stay labelled; missing appearance or exit data is shown as unavailable, not zero."
      />
    </article>
  );
}
