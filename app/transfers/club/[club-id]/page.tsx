import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allTransfers, opponentById } from "@/lib/queries";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { ClubTransferLensPanel } from "@/components/transfers/ClubTransferLens";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { CoverageNote } from "@/components/CoverageNote";
import { ClubBadge } from "@/components/ClubBadge";
import {
  buildClubTransferLens,
  clubDisplayName,
  gatedClubIds,
  passesClubEvidenceGate,
} from "@/lib/transferClubs";
import { sampleStaticIds } from "@/lib/static-build";
import { clubTransferSeoDescription, clubTransferSeoTitle, seoMetadata } from "@/lib/seo";
import { fmtNum } from "@/lib/format";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "club-id": string }>;
}): Promise<Metadata> {
  const { "club-id": clubId } = await params;
  const transfers = allTransfers();
  if (!passesClubEvidenceGate(clubId, transfers)) {
    return { robots: { index: false, follow: false } };
  }
  const name = clubDisplayName(transfers, clubId);
  return seoMetadata(clubTransferSeoTitle(name), clubTransferSeoDescription(name, transfers, clubId));
}

export function generateStaticParams() {
  return sampleStaticIds(gatedClubIds(allTransfers())).map((clubId) => ({ "club-id": clubId }));
}

export default async function ClubTransferPage({
  params,
}: {
  params: Promise<{ "club-id": string }>;
}) {
  const { "club-id": clubId } = await params;
  const transfers = allTransfers();
  if (!passesClubEvidenceGate(clubId, transfers)) notFound();

  const indices = loadInflationIndices();
  const lens = buildClubTransferLens(clubId, transfers, "nominal", indices);
  if (!lens) notFound();

  const opponent = opponentById(clubId);

  return (
    <div className="space-y-10">
      <DetailBreadcrumb
        segments={[
          { label: "Transfer history", href: "/transfers" },
          { label: lens.clubName },
        ]}
      />

      <header className="space-y-4 rounded-xl border border-line bg-panel p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <ClubBadge id={clubId} name={lens.clubName} size="lg" />
          <div className="min-w-0 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Counterparty relationship
            </p>
            <h1 className="display text-2xl sm:text-3xl">{lens.clubName} and Manchester United</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
              {fmtNum(lens.marketCount)} recorded market transfers between the clubs — arrivals, departures, known fees,
              and the players who moved both ways.
            </p>
          </div>
        </div>
        {opponent && (
          <p className="text-xs text-ink-faint">
            Match record also available on the{" "}
            <Link href={`/opponent/${clubId}`} className="text-devil-bright hover:underline">
              {lens.clubName} head-to-head page
            </Link>
            .
          </p>
        )}
      </header>

      <ClubTransferLensPanel clubId={clubId} transfers={transfers} indices={indices} />

      <CoverageNote
        slice="club transfer lens"
        coverage="this route is generated only when at least three market transfers involve the counterparty, or two transfers plus an authored historical connection; thinner relationships stay in the filtered archive only."
        evidenceHref="/transfers"
        evidenceLabel="Canonical transfer archive →"
      />

      <p className="text-sm">
        <Link href="/transfers" className="text-devil-bright hover:underline focus-ring">
          ← Transfer history
        </Link>
      </p>
    </div>
  );
}
