/**
 * The Worker entry: EmDash's handler (Astro's SSR routes, the admin, cron),
 * behind the redirects the static site needs. Static files are served before
 * the Worker runs, so this only sees paths with no prerendered file.
 */
import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

/** Entity pages not prerendered in this build open in the browser-backed record reader. */
function recordReaderRedirect(url: URL): Response | null {
  const entity = url.pathname.match(/^\/(match|player|opponent)\/([^/]+)\/?$/);
  const season = url.pathname.match(/^\/seasons\/([^/]+)\/?$/);
  if (!entity && !season) return null;
  const destination = new URL(entity ? "/record" : "/matches", url);
  if (entity) {
    destination.searchParams.set("kind", entity[1]);
    destination.searchParams.set("id", decodeURIComponent(entity[2]));
  } else if (season) {
    destination.searchParams.set("season", decodeURIComponent(season[1]));
  }
  return Response.redirect(destination.toString(), 307);
}

type Fetch = typeof handler.fetch;

export default {
  async fetch(...[request, env, ctx]: Parameters<Fetch>) {
    if (request.method === "GET" || request.method === "HEAD") {
      const redirect = recordReaderRedirect(new URL(request.url));
      if (redirect) return redirect;
    }
    return handler.fetch(request, env, ctx);
  },
  scheduled: createScheduledHandler(),
};
