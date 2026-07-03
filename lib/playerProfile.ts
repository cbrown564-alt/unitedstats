/** Whether the player profile should emphasise defensive record over goals and assists. */
export function playerUsesDefensiveProfile(positionBucket: string | null): boolean {
  return positionBucket === "DEF" || positionBucket === "GK";
}

export const DEFENSIVE_CLEAN_SHEET_NOTE =
  "United didn't concede in matches the player started. Team goals against are shared across every starter in the side.";

export const DEFENSIVE_CONCEDED_NOTE =
  "Team goals against in matches started — lower is better.";
