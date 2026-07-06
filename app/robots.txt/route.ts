import { robotsTxt } from "@/lib/robotsPolicy";

export function GET() {
  return new Response(robotsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
