"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type QueryLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch" | "onNavigate"> & { href: string };

/** Query changes over an already-loaded browser catalog need no route fetch. */
export function QueryLink({ href, scroll = true, ...props }: QueryLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      scroll={scroll}
      onNavigate={(event) => {
        const next = new URL(href, window.location.href);
        if (next.origin !== window.location.origin || next.pathname !== window.location.pathname) return;
        event.preventDefault();
        if (next.href !== window.location.href) window.history.pushState(null, "", next.href);
        if (scroll) window.scrollTo(0, 0);
      }}
    />
  );
}
