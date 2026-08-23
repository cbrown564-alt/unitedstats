import { apiJson } from "@/lib/api";
import { seasonsIndex } from "@/lib/queries";

export const dynamic = "force-static";


export async function GET() {
  return apiJson(seasonsIndex());
}
