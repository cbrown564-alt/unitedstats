/**
 * Next's metadata API, reduced to the subset Red Thread uses, so page modules
 * keep their `metadata` / `generateMetadata` exports and the head stays the same.
 *
 * Merge rules copied from Next's output:
 * - A page `title` string goes through the root `title.template`; no page title
 *   falls back to `title.default`.
 * - A page `openGraph` replaces the root one wholesale. Its `title` goes through
 *   the root openGraph template, and a missing title or description is filled
 *   from the page's own. A page without `openGraph` keeps the root one as it is.
 * - The nearest `opengraph-image` (page segment first, then ancestors) supplies
 *   og:image. The root image is lost when the page replaces `openGraph`.
 * - Twitter keeps the root `card` and copies title, description and images from
 *   the resolved openGraph.
 */
import { SITE_URL } from "@/lib/site";

type Title = string | { default?: string; template?: string; absolute?: string } | null | undefined;
type OgImage = { url: string; type?: string; width?: number; height?: number; alt?: string };

export type Metadata = {
  metadataBase?: URL | null;
  title?: Title;
  description?: string | null;
  robots?: string | { index?: boolean; follow?: boolean; [k: string]: unknown } | null;
  alternates?: { canonical?: string | URL | null } | null;
  openGraph?: {
    title?: Title;
    description?: string | null;
    url?: string | URL | null;
    siteName?: string;
    locale?: string;
    type?: string;
    images?: OgImage | OgImage[] | string | string[];
    [k: string]: unknown;
  } | null;
  twitter?: { card?: string; title?: string; description?: string; images?: unknown; [k: string]: unknown } | null;
  other?: Record<string, string>;
  [k: string]: unknown;
};


export type OgFile = { path: string; hash: string; alt?: string; size?: { width: number; height: number }; contentType?: string };

type ResolvedOg = {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  type?: string;
  images: OgImage[];
};

export type ResolvedHead = {
  /** Next adds a bare noindex ahead of the metadata on not-found renders. */
  notFound?: boolean;
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
  og?: ResolvedOg;
  twitter?: { card?: string; title?: string; description?: string; images: OgImage[] };
  themeColor?: string;
};

function applyTemplate(title: Title, template: string | undefined, fallback: string | undefined): string | undefined {
  if (title == null) return fallback;
  if (typeof title === "string") return template ? template.replace("%s", title) : title;
  if (title.absolute) return title.absolute;
  return title.default ?? fallback;
}

function absoluteUrl(u: string | URL): string {
  const url = new URL(String(u), SITE_URL);
  const s = url.href;
  // Next prints the bare origin for the root path.
  return url.pathname === "/" && !url.search && !url.hash ? s.replace(/\/$/, "") : s;
}

function robotsString(r: Metadata["robots"]): string | undefined {
  if (r == null) return undefined;
  if (typeof r === "string") return r;
  const parts: string[] = [];
  if (r.index !== undefined) parts.push(r.index ? "index" : "noindex");
  if (r.follow !== undefined) parts.push(r.follow ? "follow" : "nofollow");
  return parts.join(", ") || undefined;
}

function ogImages(images: unknown): OgImage[] {
  if (images == null) return [];
  const list = Array.isArray(images) ? images : [images];
  return list.map((i) => (typeof i === "string" ? { url: i } : (i as OgImage)));
}

function templateOf(t: Title): string | undefined {
  return t && typeof t === "object" ? t.template : undefined;
}

function defaultOf(t: Title): string | undefined {
  return t && typeof t === "object" ? t.default : typeof t === "string" ? t : undefined;
}

/**
 * `ogFiles.own` is an image in the page's own segment (for "/", the root one);
 * `ogFiles.inherited` is the nearest ancestor's. `rootSegment` marks app/page.tsx:
 * a layout's title templates apply to child segments only, so not to it.
 */
export function resolveHead(
  root: Metadata,
  page: Metadata,
  ogFiles: { own?: OgFile; inherited?: OgFile },
  opts: { rootSegment?: boolean; notFound?: boolean } = {},
): ResolvedHead {
  const titleTemplate = opts.rootSegment ? undefined : templateOf(root.title);
  const ogTemplate = opts.rootSegment ? undefined : templateOf(root.openGraph?.title);
  const title = applyTemplate(page.title, titleTemplate, defaultOf(root.title));
  const description = (page.description ?? root.description) || undefined;

  const ogFile = (f: OgFile): OgImage => ({
    url: absoluteUrl(`${f.path}?${f.hash}`),
    type: f.contentType ?? "image/png",
    width: f.size?.width,
    height: f.size?.height,
    alt: f.alt,
  });

  let og: ResolvedOg | undefined;
  if (page.openGraph) {
    const p = page.openGraph;
    og = {
      title: applyTemplate(p.title ?? (typeof page.title === "string" ? page.title : undefined), ogTemplate, title),
      description: (p.description ?? description) || undefined,
      url: p.url ? absoluteUrl(p.url) : undefined,
      siteName: p.siteName,
      locale: p.locale,
      type: p.type,
      images: ogImages(p.images),
    };
    // An image file in the page's own segment applies after its openGraph.
    if (ogFiles.own) og.images = [ogFile(ogFiles.own)];
  } else if (root.openGraph) {
    const r = root.openGraph;
    og = {
      title: defaultOf(r.title),
      description: r.description ?? undefined,
      url: r.url ? absoluteUrl(r.url) : undefined,
      siteName: r.siteName,
      locale: r.locale,
      type: r.type,
      images: ogImages(r.images),
    };
    const file = ogFiles.own ?? ogFiles.inherited;
    if (file) og.images = [ogFile(file)];
  }

  const tw = page.twitter ?? root.twitter ?? undefined;
  const twitter = tw
    ? {
        card: tw.card,
        title: tw.title ?? og?.title,
        description: tw.description ?? og?.description,
        images: tw.images ? ogImages(tw.images) : (og?.images ?? []),
      }
    : undefined;

  const canonicalSrc = page.alternates?.canonical ?? (page.alternates === undefined ? root.alternates?.canonical : undefined);

  return {
    notFound: opts.notFound,
    title,
    description,
    robots: robotsString(page.robots ?? root.robots),
    canonical: canonicalSrc ? absoluteUrl(canonicalSrc) : undefined,
    og,
    twitter,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const meta = (attr: "name" | "property", key: string, content: string | number | undefined) =>
  content === undefined || content === "" ? "" : `<meta ${attr}="${key}" content="${esc(String(content))}"/>`;

/** Icons, as Next printed them for the files in app/. */
const ICONS = [
  '<link rel="icon" href="/favicon.ico?d62d624d418737fa" type="image/x-icon" sizes="16x16"/>',
  '<link rel="icon" href="/icon.svg?bbda0c97678a6e1a" type="image/svg+xml" sizes="any"/>',
  '<link rel="apple-touch-icon" href="/apple-icon.png?40bba22f345b8be8" type="image/png" sizes="180x180"/>',
].join("");

export function renderHead(h: ResolvedHead): string {
  const out: string[] = [];
  if (h.notFound) out.push('<meta name="robots" content="noindex"/>');
  if (h.themeColor) out.push(meta("name", "theme-color", h.themeColor));
  if (h.title !== undefined) out.push(`<title>${esc(h.title)}</title>`);
  out.push(meta("name", "description", h.description));
  out.push(meta("name", "robots", h.robots));
  if (h.canonical) out.push(`<link rel="canonical" href="${esc(h.canonical)}"/>`);
  if (h.og) {
    const o = h.og;
    out.push(meta("property", "og:title", o.title), meta("property", "og:description", o.description));
    out.push(meta("property", "og:url", o.url), meta("property", "og:site_name", o.siteName), meta("property", "og:locale", o.locale));
    for (const i of o.images) {
      out.push(
        meta("property", "og:image", i.url),
        meta("property", "og:image:type", i.type),
        meta("property", "og:image:width", i.width),
        meta("property", "og:image:height", i.height),
        meta("property", "og:image:alt", i.alt),
      );
    }
    out.push(meta("property", "og:type", o.type));
  }
  if (h.twitter) {
    const t = h.twitter;
    out.push(meta("name", "twitter:card", t.card), meta("name", "twitter:title", t.title), meta("name", "twitter:description", t.description));
    for (const i of t.images) {
      out.push(
        meta("name", "twitter:image", i.url),
        meta("name", "twitter:image:alt", i.alt),
        meta("name", "twitter:image:type", i.type),
        meta("name", "twitter:image:width", i.width),
        meta("name", "twitter:image:height", i.height),
      );
    }
  }
  out.push(ICONS);
  return out.join("");
}
