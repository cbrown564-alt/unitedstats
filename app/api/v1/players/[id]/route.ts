import { apiError, apiJson } from "@/lib/api";
import { playerById, playerSplitsBySeason } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = playerById(id);
  if (!player) return apiError(404, `no player with id "${id}"`);
  return apiJson({ player, seasons: playerSplitsBySeason(id) });
}
