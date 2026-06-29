import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Paginated match lists are utility views — keep them out of the index. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/matches") return NextResponse.next();
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  if (page <= 1) return NextResponse.next();
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, follow");
  return response;
}

export const config = {
  matcher: "/matches",
};
