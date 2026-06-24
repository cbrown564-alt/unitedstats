import { immutableDataHeaders } from "@/lib/cache";
import {
  digestTitle,
  rankedClaims,
  readHistoryDigest,
  type HistoryDigestClaimKind,
} from "@/lib/historyDigests";
import { fmtDateLong, venueLabel } from "@/lib/format";
import { OG_CONTENT_TYPE, OG_SIZE, type DigestTile, digestCard, entityCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Manchester United history changed digest — UnitedStats";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** A moved record as a figure-over-label tile. Returns null when a claim carries
 *  no figure worth a tile (those stay in the prose, off the card). */
function claimTile(claim: { kind: HistoryDigestClaimKind; title: string; value?: number | string }): DigestTile | null {
  const v = claim.value;
  const num = typeof v === "number" ? v : undefined;
  // The run type (unbeaten / winning / scoring / clean-sheet) lives only in the
  // claim prose, so two concurrent runs don't collapse to the same tile label.
  const runType = /-match ([a-z-]+) run/i.exec(claim.title)?.[1] ?? "match";
  switch (claim.kind) {
    case "elo-movement":
      if (num === undefined) return null;
      return { figure: `${num > 0 ? "+" : "−"}${Math.abs(num).toFixed(1)}`, label: "Elo points", tone: num >= 0 ? "up" : "down" };
    case "streak-started":
      if (num === undefined) return null;
      return { figure: String(num), label: `${runType} run began`, tone: "up" };
    case "streak-ended":
      if (num === undefined) return null;
      return { figure: String(num), label: `${runType} run ended`, tone: "down" };
    case "rank-change":
      if (num === undefined) return null;
      return num === 1
        ? { figure: "#1", label: "all-time Elo peak", tone: "up" }
        : { figure: `#${num}`, label: "best-ever Elo", tone: "up" };
    case "historical-percentile":
      if (num === undefined) return null;
      return { figure: `${Math.round(num)}th`, label: "Elo percentile", tone: "up" };
    case "unusual-scoreline":
      if (v == null) return null;
      return { figure: String(v).replace("-", "–"), label: "first-ever scoreline", tone: "neutral" };
    case "record":
      if (num === undefined) return null;
      return { figure: String(num), label: "all-time record", tone: "up" };
    case "manager-milestone":
      if (num === undefined) return null;
      return { figure: String(num), label: "manager milestone", tone: "up" };
    case "opponent-milestone":
      if (num === undefined) return null;
      return { figure: String(num), label: "against this side", tone: "up" };
    default:
      return num === undefined ? null : { figure: String(num), label: claim.kind.replace(/-/g, " "), tone: "neutral" };
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = readHistoryDigest(id);
  if (!digest) {
    return entityCard(
      { eyebrow: "HISTORY CHANGED", title: "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }

  const ranked = rankedClaims(digest.claims);
  // The result is shown in its own strip; the headline leads with the biggest
  // *change* instead, falling back to the evergreen "what changed" framing for a
  // match that only added a result to the ledger.
  const substantive = ranked.find((c) => c.kind !== "result");
  const tiles = ranked
    .filter((c) => c.kind !== "result")
    .map(claimTile)
    .filter((t): t is DigestTile => t !== null)
    .slice(0, 3);

  const m = digest.match;
  return digestCard(
    {
      date: fmtDateLong(m.date),
      headline: substantive?.title ?? digestTitle(digest),
      result: {
        team: "United",
        score: m.score.replace("-", "–"),
        opponent: m.opponent,
        meta: `${m.competition} · ${venueLabel(m.venue)}`,
        outcome: m.result,
      },
      tiles,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
