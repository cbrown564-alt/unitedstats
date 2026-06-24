"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/MainNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader";
import { WebVitals } from "@/components/WebVitals";

/**
 * The site chrome — header, nav, search, footer — wrapped so it can be dropped
 * for embeds. `/embed/*` renders bare and full-bleed so an iframe shows only the
 * card, not the whole site. Pages stay server components (passed as children);
 * only this visibility decision is client-side.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/embed/")) return <>{children}</>;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-pitch/95 backdrop-blur">
        <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <Link
            href="/"
            className="display text-lg tracking-tight whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-devil-bright"
          >
            <span className="text-devil-bright">United</span>Stats
          </Link>
          <MainNav />
          <HeaderSearch />
        </div>
      </header>
      <CommandPaletteLoader />
      <WebVitals />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="mt-16 border-t border-line">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 text-xs text-ink-faint sm:px-6">
          <p className="max-w-xl">
            UnitedStats — the open history of Manchester United, from Newton Heath (1886) to today. Result data:
            engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
          </p>
          <p className="max-w-xl">Data is plain JSON in the repository — corrections welcome by pull request.</p>
        </div>
      </footer>
    </>
  );
}
