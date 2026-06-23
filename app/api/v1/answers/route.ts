import { apiJson } from "@/lib/api";
import { answerIndex } from "@/lib/machineAnswers";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiJson(answerIndex());
}
