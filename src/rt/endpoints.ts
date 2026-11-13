/**
 * App Router route handlers, `opengraph-image`, sitemap and robots as Astro
 * endpoints. All prerender to files in out/, at the paths Next exported.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute } from "astro";
import { createElement, type ReactElement } from "react";
import { nextParams } from "./routes";

export { staticPaths } from "./routes";

// `P` is the route's own params shape; Astro's params for the same pattern fill it.
type Handler<P> = (
  request: Request,
  ctx: { params: Promise<P> },
) => Response | Promise<Response>;

export function routeHandler<P>(mod: { GET?: Handler<P> }): APIRoute {
  return async ({ request, params }) => {
    if (!mod.GET) return new Response(null, { status: 405 });
    return mod.GET(request, { params: Promise.resolve(nextParams(params) as P) });
  };
}

type OgModule<P> = {
  default: (props: {
    params: Promise<P>;
  }) => Promise<Response | ReactElement> | Response | ReactElement;
};

export function ogImageHandler<P>(mod: OgModule<P>): APIRoute {
  return async ({ params }) => {
    const out = await mod.default({
      params: Promise.resolve(nextParams(params) as P),
    });
    if (out instanceof Response) return out;
    const { ImageResponse } = await import("@/src/shims/next-og");
    return new ImageResponse(createElement("div", null, out));
  };
}

/** Icons stay in app/ until Next is removed; served at the root as before. */
export function appFileHandler(name: string, type: string): APIRoute {
  return () =>
    new Response(readFileSync(join(process.cwd(), "app", name)), {
      headers: { "content-type": type },
    });
}

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: string;
  priority?: number;
};

const iso = (d: string | Date) =>
  (d instanceof Date ? d : new Date(d)).toISOString();

/** Same XML Next's MetadataRoute.Sitemap serialiser writes. */
export function sitemapXml(entries: SitemapEntry[]): string {
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const e of entries) {
    xml += "<url>\n";
    xml += `<loc>${e.url}</loc>\n`;
    if (e.lastModified) xml += `<lastmod>${iso(e.lastModified)}</lastmod>\n`;
    if (e.changeFrequency)
      xml += `<changefreq>${e.changeFrequency}</changefreq>\n`;
    if (typeof e.priority === "number")
      xml += `<priority>${e.priority}</priority>\n`;
    xml += "</url>\n";
  }
  xml += "</urlset>\n";
  return xml;
}

export function sitemapHandler(
  build: () => SitemapEntry[] | Promise<SitemapEntry[]>,
): APIRoute {
  return async () =>
    new Response(sitemapXml(await build()), {
      headers: { "content-type": "application/xml" },
    });
}

type RobotsRule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
};
type Robots = {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string | string[];
  host?: string;
};

const list = (v: string | string[] | undefined) =>
  v == null ? [] : Array.isArray(v) ? v : [v];

/** Same text Next's MetadataRoute.Robots serialiser writes. */
export function robotsHandler(build: () => Robots): APIRoute {
  return () => {
    const r = build();
    let txt = "";
    for (const rule of Array.isArray(r.rules) ? r.rules : [r.rules]) {
      for (const ua of list(rule.userAgent ?? "*"))
        txt += `User-Agent: ${ua}\n`;
      for (const a of list(rule.allow)) txt += `Allow: ${a}\n`;
      for (const d of list(rule.disallow)) txt += `Disallow: ${d}\n`;
      if (rule.crawlDelay) txt += `Crawl-delay: ${rule.crawlDelay}\n`;
      txt += "\n";
    }
    if (r.host) txt += `Host: ${r.host}\n`;
    for (const s of list(r.sitemap)) txt += `Sitemap: ${s}\n`;
    return new Response(txt, { headers: { "content-type": "text/plain" } });
  };
}
