/** Canonical field paths for match-page point-and-pick correction targets. */
export function matchFieldPath(matchId: string, field: string): string {
  return `matches[id=${matchId}].${field}`;
}

export function eventFieldPath(matchId: string, eventIndex: number, field: string): string {
  return `matches[id=${matchId}].events[${eventIndex}].${field}`;
}

export function lineupFieldPath(matchId: string, playerSelector: string, field: string): string {
  return `matches[id=${matchId}].lineup[player=${playerSelector}].${field}`;
}

export function lineupPlayerSelector(playerId: string | null, providerId: string | null, displayName: string): string {
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return playerId ?? providerId ?? slug;
}
