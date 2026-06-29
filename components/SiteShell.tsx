/// <reference types="react/canary" />
"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { MainNav } from "@/components/MainNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader";
import { WebVitals } from "@/components/WebVitals";
import { RedThreadWordmark } from "@/components/Brand";

/**
 * The site chrome — header, nav, search, footer — wrapping every page. Pages
 * stay server components (passed as children); this shell is the one client
 * boundary, owning the cross-fade ViewTransition on navigation.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Anchor the sticky chrome so it stays put while the content crossfades.
          The name is applied by React's <ViewTransition> rather than a raw CSS
          `view-transition-name`: React owns the name for exactly the one live
          header across the old/new trees, so it can never collide with itself
          mid-navigation (a raw CSS name on a persistent element does, and the
          browser aborts the transition with "multiple elements found"). */}
      <ViewTransition name="site-header">
        <header className="site-header sticky top-0 z-50 border-b border-line bg-pitch/95 backdrop-blur">
          <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
            <Link
              href="/"
              className="whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-devil-bright"
            >
              <RedThreadWordmark compactOnMobile markSize={32} />
            </Link>
            <MainNav />
            <HeaderSearch />
          </div>
        </header>
      </ViewTransition>
      <CommandPaletteLoader />
      <WebVitals />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Cross-fade the content area on navigation. Unnamed so only a change to
            this subtree (a route change) animates it — not unrelated transitions
            elsewhere on the page. The header above is anchored by its own named
            ViewTransition so it stays put while this content fades. */}
        <ViewTransition>{children}</ViewTransition>
      </main>
      <footer className="mt-16 border-t border-line">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 text-xs text-ink-faint sm:px-6">
          <p className="max-w-xl">
            Red Thread — evidence-backed Manchester United history, from Newton Heath (1886) to today. Result data:
            engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
          </p>
          <p className="max-w-xl">Data is plain JSON in the repository — corrections welcome by pull request.</p>
        </div>
      </footer>
    </>
  );
}
