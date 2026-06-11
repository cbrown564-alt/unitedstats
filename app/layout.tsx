import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
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
  title: { default: "UnitedStats — every Manchester United match since 1886", template: "%s · UnitedStats" },
  description:
    "The exhaustive history of Manchester United: every match, every competition, every goal — from Newton Heath to today.",
};

const NAV = [
  ["Matches", "/matches"],
  ["Seasons", "/seasons"],
  ["Players", "/players"],
  ["Managers", "/managers"],
  ["Opponents", "/opponents"],
  ["Analytics", "/analytics"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line sticky top-0 z-50 bg-pitch/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center gap-6 h-14">
            <Link href="/" className="display text-lg tracking-tight whitespace-nowrap">
              <span className="text-devil-bright">United</span>Stats
            </Link>
            <nav className="flex gap-1 sm:gap-2 overflow-x-auto text-sm">
              {NAV.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2 py-1 text-ink-dim hover:text-ink hover:bg-panel-2 rounded transition-colors whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-8">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-xs text-ink-faint space-y-1">
            <p>
              UnitedStats — the open history of Manchester United, from Newton Heath (1886) to today.
              Result data: engsoccerdata, openfootball, Wikipedia. Not affiliated with Manchester United FC.
            </p>
            <p>
              Data is plain JSON in the repository — corrections welcome by pull request.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
