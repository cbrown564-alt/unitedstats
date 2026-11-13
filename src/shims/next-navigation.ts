/** `next/navigation` for the Astro build. See src/rt/nav.tsx. */
import { useMemo, useSyncExternalStore } from "react";
import { BailoutToClient, NotFoundSignal, RedirectSignal, navigate, subscribeLocation, useNav } from "@/src/rt/nav";

export { NotFoundSignal, RedirectSignal };

const isServer = typeof window === "undefined";

export function usePathname(): string {
  return useNav().pathname;
}

export function useParams<T extends Record<string, string | string[]>>(): T {
  return useNav().params as T;
}

const getSearch = () => location.search;

export function useSearchParams(): URLSearchParams {
  if (isServer) throw new BailoutToClient();
  const search = useSyncExternalStore(subscribeLocation, getSearch, getSearch);
  return useMemo(() => new URLSearchParams(search), [search]);
}

type NavOptions = { scroll?: boolean };

const router = {
  push: (href: string, opts?: NavOptions) => navigate(href, "push", opts?.scroll ?? true),
  replace: (href: string, opts?: NavOptions) => navigate(href, "replace", opts?.scroll ?? true),
  back: () => history.back(),
  forward: () => history.forward(),
  refresh: () => location.reload(),
  prefetch: () => {},
};

export function useRouter() {
  return router;
}

export function notFound(): never {
  throw new NotFoundSignal();
}

export function redirect(location: string): never {
  throw new RedirectSignal(location, 307);
}

export function permanentRedirect(location: string): never {
  throw new RedirectSignal(location, 308);
}
