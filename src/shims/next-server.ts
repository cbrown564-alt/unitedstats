/** `next/server` for the Astro build: only `NextResponse.json` is used. */
export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): Response {
    return Response.json(body, init);
  }
}
