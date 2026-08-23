import { apiJson } from "@/lib/api";
import { competitionsList } from "@/lib/queries";

export const dynamic = "force-static";


export async function GET() {
  return apiJson(competitionsList());
}
