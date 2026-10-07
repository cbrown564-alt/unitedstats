// Static files take precedence, matching Vercel's filesystem-first routes.
// Unprerendered entity IDs open the existing browser-backed record reader.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const entity = url.pathname.match(/^\/(match|player|opponent)\/([^/]+)\/?$/);
      const season = url.pathname.match(/^\/seasons\/([^/]+)\/?$/);
      if (entity || season) {
        const destination = new URL(entity ? "/record" : "/matches", url);
        if (entity) {
          destination.searchParams.set("kind", entity[1]);
          destination.searchParams.set("id", decodeURIComponent(entity[2]));
        } else if (season) {
          destination.searchParams.set("season", decodeURIComponent(season[1]));
        }
        return Response.redirect(destination.toString(), 307);
      }
    }
    const missing = new URL("/404.html", url);
    const response = await env.ASSETS.fetch(new Request(missing, request));
    return new Response(response.body, { status: 404, headers: response.headers });
  },
} satisfies ExportedHandler<Env>;
