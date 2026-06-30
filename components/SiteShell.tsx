/// <reference types="react/canary" />
"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { MainNav } from "@/components/MainNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader";
import { WebVitals } from "@/components/WebVitals";
import { RedThreadWordmark } from "@/components/Brand";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

/**
 * The site chrome — header, nav, search, footer — wrapping every page. Pages
 * stay server components (passed as children); this shell is the one client
 * boundary, owning the cross-fade ViewTransition on navigation.
 *
 * Below lg, the sticky top header is replaced by a floating bottom pill with
 * section picker, search, and menu — an app-like mobile shell.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewTransition name="site-header">
        <header className="site-header sticky top-0 z-50 hidden border-b border-line bg-pitch/95 backdrop-blur lg:block">
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
      <main className="site-main mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <ViewTransition>{children}</ViewTransition>
      </main>
      <MobileBottomNav />
      <footer className="site-footer mt-10 border-t border-line lg:mt-16">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-xs text-ink-faint sm:px-6 lg:py-8">
          <p className="max-w-xl">
            Red Thread — evidence-backed Manchester United history, from Newton Heath (1886) to today. Result data:
            engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
          </p>
          <p className="max-w-xl hidden sm:block">Data is plain JSON in the repository — corrections welcome by pull request.</p>
        </div>
      </footer>
    </>
  );
}
