import type { Metadata } from "next";
import Link from "next/link";
import { LooseThread } from "@/components/LooseThread";
import { PageHeader } from "@/components/PageHeader";
import { RecordGlyph } from "@/components/glyphs/RecordGlyph";
import { NavIcon, type NavIconId } from "@/components/nav/NavIcons";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const WAYS_BACK: { href: string; label: string; icon: NavIconId }[] = [
  { href: "/matches", label: "Every match", icon: "matches" },
  { href: "/seasons", label: "Seasons", icon: "seasons" },
  { href: "/players", label: "Players", icon: "players" },
  { href: "/stories", label: "Stories", icon: "journey" },
];

const wayClass =
  "tg-host inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-4 py-2 text-sm font-semibold text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring";

/** Unmatched routes and notFound() calls: the thread frays where the address stops matching. */
export default function NotFound() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not found" title="This address isn’t in the record">
        The link may be old or mistyped. Nothing is missing from United’s history; this page just
        doesn’t exist.
      </PageHeader>

      <figure className="overflow-hidden rounded-xl border border-line bg-panel">
        <LooseThread />
        <figcaption className="border-t border-line/70 px-4 py-2.5 text-xs text-ink-faint">
          The thread runs to here, then frays.<span className="motion-reduce:hidden"> Pull the loose end.</span>
        </figcaption>
      </figure>

      <nav aria-label="Ways back into the record" className="flex flex-wrap gap-2.5">
        <Link href="/surprise" className={`${wayClass} border-devil-bright/60 text-ink`}>
          <RecordGlyph id="tangle" size={16} className="tg-lit" />
          Pull another night
        </Link>
        {WAYS_BACK.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={wayClass}>
            <NavIcon id={icon} className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
