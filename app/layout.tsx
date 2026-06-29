import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteShell } from "@/components/SiteShell";
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
  title: { default: "Red Thread — every Manchester United match since 1886", template: "%s · Red Thread" },
  description:
    "Evidence-backed Manchester United history: every match, every competition, every goal — from Newton Heath to today.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning: browser extensions inject data-* attributes onto
  // <html> before React hydrates (e.g. content filters), which the server HTML
  // can't match. Scoped to this element's own attributes only — real mismatches
  // inside the app still surface.
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
