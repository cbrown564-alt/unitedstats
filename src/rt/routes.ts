/** Route helpers shared by generated pages and endpoints (src/pages/**). */
type Params = Record<string, string | string[] | undefined>;

/** Next's `generateStaticParams` as Astro's `getStaticPaths`. */
export async function staticPaths(mod: { generateStaticParams?: () => unknown }) {
  const list = ((await mod.generateStaticParams?.()) ?? []) as Record<string, string | number | string[]>[];
  return list.map((p) => ({
    params: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Array.isArray(v) ? v.join("/") : String(v)])),
  }));
}

/** The URL path for an app/ route pattern and its params ("/match/[id]" -> "/match/x"). */
export function pathFor(route: string, params: Params): string {
  return route.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (_, name: string) => {
    const v = params[name];
    return Array.isArray(v) ? v.join("/") : String(v ?? "");
  });
}

/** Astro params as Next passed them: plain strings, never undefined. */
export function nextParams(params: Params): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
}
