/// <reference types="react/canary" />
"use client";

import { ViewTransition } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader";
import { WebVitals } from "@/components/WebVitals";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

/**
 * The site chrome — sidebar, search, footer — wrapping every page. Pages stay
 * server components (passed as children); this shell is the one client boundary,
 * owning the cross-fade ViewTransition on navigation.
 *
 * Below lg, the sidebar is hidden and a floating bottom pill provides section
 * picker, search, and menu — an app-like mobile shell. Between sm and lg the
 * pill and sheets cap to phone width (narrow-shell rules in globals.css).
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="lg:flex lg:min-h-full">
        <ViewTransition name="site-header">
          <SidebarNav />
        </ViewTransition>
        <div className="flex min-w-0 flex-1 flex-col">
          <CommandPaletteLoader />
          <WebVitals />
          <main className="site-main mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
            <ViewTransition>{children}</ViewTransition>
          </main>
          <footer className="site-footer mt-10 border-t border-line lg:mt-16">
            <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-xs text-ink-faint sm:px-6 lg:py-8">
              <p className="max-w-xl">
                Red Thread — evidence-backed Manchester United history, from Newton Heath (1886) to today. Result data:
                engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
              </p>
              <p className="max-w-xl hidden sm:block">Data is plain JSON in the repository — corrections welcome by pull request.</p>
            </div>
          </footer>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
