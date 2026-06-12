import { apiError, apiJson } from "@/lib/api";
import { eloForMatch, eventsForMatch, lineupForMatch, matchById, sourcesForMatch } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = matchById(id);
  if (!match) return apiError(404, `no match with id "${id}"`);
  return apiJson({
    match,
    events: eventsForMatch(id),
    lineup: lineupForMatch(id),
    elo: eloForMatch(id) ?? null,
    sources: sourcesForMatch(id),
  });
}
