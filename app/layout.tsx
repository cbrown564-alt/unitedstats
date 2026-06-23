import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { MainNav } from "@/components/MainNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader";
import { WebVitals } from "@/components/WebVitals";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "UnitedStats — every Manchester United match since 1886", template: "%s · UnitedStats" },
  description:
    "The exhaustive history of Manchester United: every match, every competition, every goal — from Newton Heath to today.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning: browser extensions inject data-* attributes onto
  // <html> before React hydrates (e.g. content filters), which the server HTML
  // can't match. Scoped to this element's own attributes only — real mismatches
  // inside the app still surface.
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
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
        <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-xs text-ink-faint space-y-1">
            <p className="max-w-xl">
              UnitedStats — the open history of Manchester United, from Newton Heath (1886) to today.
              Result data: engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
            </p>
            <p className="max-w-xl">
              Data is plain JSON in the repository — corrections welcome by pull request.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
