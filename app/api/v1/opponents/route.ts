import { apiJson } from "@/lib/api";
import { opponentsIndex } from "@/lib/queries";

export const dynamic = "force-static";


export async function GET() {
  return apiJson(opponentsIndex());
}
