import { apiError, apiJson } from "@/lib/api";
import { cutAnswer } from "@/lib/machineAnswers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const answer = cutAnswer(slug);
  if (!answer) return apiError(404, `no curated Cut answer with slug "${slug}"`);
  return apiJson(answer);
}
