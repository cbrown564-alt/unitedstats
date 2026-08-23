import { apiError, apiJson } from "@/lib/api";
import { playerById, playerSplitsBySeason, playersIndex } from "@/lib/queries";
import { sampleStaticIds } from "@/lib/static-build";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return sampleStaticIds(playersIndex().map((player) => player.player_id)).map((id) => ({ id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = playerById(id);
  if (!player) return apiError(404, `no player with id "${id}"`);
  return apiJson({ player, seasons: playerSplitsBySeason(id) });
}
