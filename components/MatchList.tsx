import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import { MatchListClient } from "@/components/MatchListClient";

export function MatchList<T extends MatchRow>({
  matches,
  showSeason = false,
  showAttendance = false,
  accentResult = false,
  renderExtra,
  previewOnMobile = true,
}: {
  matches: T[];
  showSeason?: boolean;
  showAttendance?: boolean;
  accentResult?: boolean;
  renderExtra?: (m: T) => ReactNode;
  /** Sheet preview below lg when true (Phase B). Default on. */
  previewOnMobile?: boolean;
}) {
  const extraById = renderExtra
    ? Object.fromEntries(matches.map((m) => [m.id, renderExtra(m)]))
    : undefined;

  return (
    <MatchListClient
      matches={matches}
      showSeason={showSeason}
      showAttendance={showAttendance}
      accentResult={accentResult}
      extraById={extraById}
      previewOnMobile={previewOnMobile}
    />
  );
}
