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

/**
 * EmDash's setup wizard makes its first visitor the admin, and it is open until
 * someone finishes it. While the `SETUP_TOKEN` secret is set, the wizard and its
 * API answer 404 unless the browser first opened
 * `/_emdash/admin/setup?setup_token=<token>`. That visit sets an HttpOnly cookie
 * for /_emdash/. The read-only status endpoint stays open because the admin
 * calls it on every load. Once setup is done, EmDash refuses to run it again,
 * and the secret can be deleted.
 */
const SETUP_PATH = /^\/_emdash\/(admin\/setup|api\/setup)(\/|$)/;
const SETUP_COOKIE = "rt_setup";

function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function setupGate(request: Request, token: string | undefined): Response | null {
  const url = new URL(request.url);
  if (!token || !SETUP_PATH.test(url.pathname) || url.pathname === "/_emdash/api/setup/status") return null;
  const given = url.searchParams.get("setup_token");
  if (given !== null && sameSecret(given, token)) {
    url.searchParams.delete("setup_token");
    return new Response(null, {
      status: 303,
      headers: {
        location: url.pathname + url.search,
        "set-cookie": `${SETUP_COOKIE}=${token}; Path=/_emdash/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
      },
    });
  }
  const cookie = (request.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith(`${SETUP_COOKIE}=`));
  if (cookie && sameSecret(cookie.slice(SETUP_COOKIE.length + 1), token)) return null;
  return new Response("Not found", { status: 404 });
}

type Fetch = typeof handler.fetch;

export default {
  async fetch(...[request, env, ctx]: Parameters<Fetch>) {
    const gate = setupGate(request, (env as { SETUP_TOKEN?: string }).SETUP_TOKEN);
    if (gate) return gate;
    if (request.method === "GET" || request.method === "HEAD") {
      const redirect = recordReaderRedirect(new URL(request.url));
      if (redirect) return redirect;
    }
    return handler.fetch(request, env, ctx);
  },
  scheduled: createScheduledHandler(),
};
