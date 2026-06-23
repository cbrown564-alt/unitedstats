import { apiError, apiJson } from "@/lib/api";
import { historyDigestAnswer } from "@/lib/machineAnswers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answer = historyDigestAnswer(id);
  if (!answer) return apiError(404, `no history-digest answer with id "${id}"`);
  return apiJson(answer);
}
