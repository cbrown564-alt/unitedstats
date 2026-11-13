/**
 * `next/link` for the Astro build: a plain anchor. Cross-page navigation is a
 * document load (prefetched by speculation rules, cross-faded by CSS view
 * transitions). The client runtime keeps same-path query changes in the page
 * (src/rt/client.tsx), honouring `scroll={false}` through `data-rt-scroll`.
 */
import type { AnchorHTMLAttributes, Ref } from "react";

type UrlObject = { pathname?: string | null; query?: Record<string, string | number | readonly string[] | undefined> | string | null; hash?: string | null };

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | UrlObject;
  prefetch?: boolean | null | "auto";
  scroll?: boolean;
  replace?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
  onNavigate?: unknown;
  ref?: Ref<HTMLAnchorElement>;
};

export function hrefString(href: string | UrlObject): string {
  if (typeof href === "string") return href;
  let out = href.pathname ?? "";
  const q = href.query;
  if (q && typeof q === "object") {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v == null) continue;
      if (Array.isArray(v)) for (const x of v) sp.append(k, String(x));
      else sp.append(k, String(v));
    }
    const s = sp.toString();
    if (s) out += `?${s}`;
  } else if (typeof q === "string" && q) {
    out += q.startsWith("?") ? q : `?${q}`;
  }
  if (href.hash) out += href.hash.startsWith("#") ? href.hash : `#${href.hash}`;
  return out;
}

export default function Link({
  href,
  prefetch: _prefetch,
  scroll,
  replace,
  shallow: _shallow,
  passHref: _passHref,
  legacyBehavior: _legacy,
  locale: _locale,
  onNavigate: _onNavigate,
  ...rest
}: LinkProps) {
  return (
    <a
      {...rest}
      href={hrefString(href)}
      {...(scroll === false ? { "data-rt-scroll": "false" } : {})}
      {...(replace ? { "data-rt-replace": "" } : {})}
    />
  );
}
