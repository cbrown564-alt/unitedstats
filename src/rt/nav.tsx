/**
 * Navigation state shared by the server render and the client root. Pages are
 * separate documents (MPA). Only same-path query changes (filters, sort) stay in
 * the page: they go through history and notify subscribers, as Next's soft
 * navigation did for these static pages.
 */
import { createContext, useContext } from "react";

export type NavState = { pathname: string; params: Record<string, string | string[]> };

export const NavContext = createContext<NavState>({ pathname: "/", params: {} });

export function useNav(): NavState {
  return useContext(NavContext);
}

/** Thrown by `useSearchParams` while prerendering, inside a Suspense boundary. */
export const CSR_BAILOUT = "RT_CSR_BAILOUT";

export class BailoutToClient extends Error {
  digest = CSR_BAILOUT;
  constructor() {
    super("useSearchParams() reads the URL, so this Suspense boundary renders in the browser.");
  }
}

export class NotFoundSignal extends Error {
  digest = "RT_NOT_FOUND";
  constructor() {
    super("notFound()");
  }
}

export class RedirectSignal extends Error {
  digest = "RT_REDIRECT";
  constructor(readonly location: string, readonly status: 307 | 308 = 307) {
    super(`redirect(${location})`);
  }
}

// --- client-side history notifications --------------------------------------

const listeners = new Set<() => void>();

export function subscribeLocation(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("popstate", notifyLocation);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("popstate", notifyLocation);
  };
}

function notifyLocation(): void {
  for (const cb of listeners) cb();
}

/** Navigate. Same-path URLs update history in place; anything else loads. */
export function navigate(href: string, mode: "push" | "replace", scroll = true): void {
  const url = new URL(href, location.href);
  if (url.origin === location.origin && url.pathname === location.pathname) {
    history[mode === "push" ? "pushState" : "replaceState"](history.state, "", url.pathname + url.search + url.hash);
    notifyLocation();
    if (scroll && !url.hash) window.scrollTo(0, 0);
    return;
  }
  if (mode === "replace") location.replace(url.href);
  else location.assign(url.href);
}
