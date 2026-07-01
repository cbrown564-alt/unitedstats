import { correctionPrefillHref, type CorrectionPrefill } from "@/lib/corrections";
import { clubName } from "@/lib/format";

export type DataGapRow = {
  id: string;
  date: string;
  season: string;
  opponent_name: string;
  competition_name: string;
  gf: number;
  ga: number;
  gap: string;
  contributeHref: string;
};

const GAP_TYPE_META: Record<string, { label: string; description: string }> = {
  "United goalscorers": {
    label: "United goalscorers",
    description: "United scored here but the goal-by-goal row isn't complete yet.",
  },
  "opposition goals": {
    label: "Opposition goals",
    description: "They scored but the opposition scorers aren't on file.",
  },
  lineup: {
    label: "Lineups",
    description: "No starting XI recorded for this fixture.",
  },
  attendance: {
    label: "Attendance",
    description: "Crowd figure missing — still open if you have a cited source.",
  },
  "source note": {
    label: "Source notes",
    description: "A source note is flagged on this match.",
  },
};

export function gapTypeMeta(gap: string): { label: string; description: string } {
  return (
    GAP_TYPE_META[gap] ?? {
      label: gap,
      description: "Coverage is incomplete on this fixture.",
    }
  );
}

/** Contribute link — correction prefill when the contract supports it, otherwise the match page. */
function gapContributeHref(g: Omit<DataGapRow, "contributeHref">): string {
  const pagePath = `/match/${g.id}`;
  const label = `${clubName(g.date)} ${g.gf}-${g.ga} ${g.opponent_name}`;
  const citableId = `us:match:${encodeURIComponent(g.id)}`;
  const matchPrefill = (field: string, current: string | number | null | undefined): CorrectionPrefill => ({
    targetKind: "match",
    targetId: g.id,
    targetLabel: label,
    fieldPath: `matches[id=${g.id}].${field}`,
    currentValue: current,
    pagePath,
    citableId,
  });

  switch (g.gap) {
    case "attendance":
      return correctionPrefillHref(matchPrefill("attendance", null));
    case "lineup":
      return `/match/${g.id}#lineup`;
    case "United goalscorers":
    case "opposition goals":
      return `/match/${g.id}#goals`;
    default:
      return `/match/${g.id}`;
  }
}

export function enrichDataGaps(
  gaps: Omit<DataGapRow, "contributeHref">[],
): DataGapRow[] {
  return gaps.map((g) => ({ ...g, contributeHref: gapContributeHref(g) }));
}
