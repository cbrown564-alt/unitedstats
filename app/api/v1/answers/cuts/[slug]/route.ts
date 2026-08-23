import { apiError, apiJson } from "@/lib/api";
import { CURATED_CUTS } from "@/lib/cut";
import { cutAnswer } from "@/lib/machineAnswers";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return CURATED_CUTS.map((cut) => ({ slug: cut.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const answer = cutAnswer(slug);
  if (!answer) return apiError(404, `no curated Cut answer with slug "${slug}"`);
  return apiJson(answer);
}
