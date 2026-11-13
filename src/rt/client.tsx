/**
 * Browser entry: hydrate the page from the payload the server embedded
 * (see src/rt/flight.ts). Client component modules load on demand from the
 * manifest the `rt-client-refs` Vite plugin generates.
 */
import { Fragment, Suspense, createElement, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { clientModules } from "virtual:rt-client-modules";
import { CSR_BAILOUT, NavContext, navigate, type NavState } from "./nav";

type Encoded = unknown;
type Payload = { nav: NavState; tree: Encoded };

const loaded = new Map<string, unknown>();

function collectIds(v: Encoded, out: Set<string>): void {
  if (!Array.isArray(v)) {
    if (v && typeof v === "object") for (const x of Object.values(v)) collectIds(x, out);
    return;
  }
  if (v[0] === "$e") {
    if (Array.isArray(v[1]) && v[1][0] === "$c") out.add(v[1][1] as string);
    collectIds(v[3], out);
    return;
  }
  if (v[0] === "$r") {
    out.add(v[1] as string);
    return;
  }
  for (const x of v) collectIds(x, out);
}

async function load(id: string): Promise<void> {
  const hash = id.lastIndexOf("#");
  const file = id.slice(0, hash);
  const name = id.slice(hash + 1);
  const importer = clientModules[file];
  if (!importer) throw new Error(`No client module registered for ${file}`);
  const mod = (await importer()) as Record<string, unknown>;
  loaded.set(id, mod[name]);
}

function ref(id: string): unknown {
  const c = loaded.get(id);
  if (!c) throw new Error(`Client reference ${id} did not load`);
  return c;
}

function decode(v: Encoded): unknown {
  if (!Array.isArray(v)) {
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = decode(x);
      return out;
    }
    return v;
  }
  switch (v[0]) {
    case "$e": {
      const [, t, key, rawProps] = v as [string, unknown, string | null, Record<string, Encoded>];
      const type = t === "$F" ? Fragment : t === "$S" ? Suspense : Array.isArray(t) ? ref(t[1] as string) : (t as string);
      const props = decode(rawProps) as Record<string, unknown>;
      if (key != null) props.key = key;
      return createElement(type as never, props);
    }
    case "$r":
      return ref(v[1] as string);
    case "$u":
      return undefined;
    case "$D":
      return new Date(v[1] as string);
    case "$n":
      return v[1] === "-0" ? -0 : Number(v[1]);
    case "$M":
      return new Map((v[1] as Encoded[][]).map(([k, x]) => [decode(k), decode(x)]));
    case "$T":
      return new Set((v[1] as Encoded[]).map(decode));
    case "$a":
      return v.slice(1).map(decode);
    default:
      return v.map(decode);
  }
}

/** Same-path query links stay in the page, like Next's soft navigation did. */
function interceptSamePathLinks(): void {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    if (url.search === location.search) return; // hash-only: let the browser scroll
    e.preventDefault();
    navigate(url.href, a.hasAttribute("data-rt-replace") ? "replace" : "push", a.dataset.rtScroll !== "false");
  });
}

async function main(): Promise<void> {
  const script = document.getElementById("rt-payload");
  const root = document.getElementById("rt-root");
  if (!script || !root) return;
  const payload = JSON.parse(script.textContent ?? "null") as Payload;
  const ids = new Set<string>();
  collectIds(payload.tree, ids);
  await Promise.all([...ids].map(load));
  const tree = decode(payload.tree) as ReactNode;
  interceptSamePathLinks();
  hydrateRoot(root, createElement(NavContext, { value: payload.nav }, tree), {
    onRecoverableError(error, info) {
      const digest = (error as { digest?: string })?.digest ?? (info as { digest?: string })?.digest;
      if (digest === CSR_BAILOUT) return;
      const cause = (error as { cause?: { digest?: string } })?.cause;
      if (cause?.digest === CSR_BAILOUT) return;
      reportError(error);
    },
  });
}

void main();
