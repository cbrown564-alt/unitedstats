import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverageWeave, RecordGlyph, type RecordGlyphId } from "@/components/glyphs/RecordGlyph";
import { UtilGlyph, type UtilGlyphId } from "@/components/glyphs/UtilGlyph";
import { NavIcon, type NavIconId } from "@/components/nav/NavIcons";

export const metadata: Metadata = {
  title: "Glyph specimen",
  robots: { index: false, follow: false },
};

const NAV: NavIconId[] = [
  "journey", "discover", "matches", "seasons", "players", "managers", "opponents", "analytics", "transfers", "data", "more",
];
const UTIL: UtilGlyphId[] = ["search", "home", "filter", "close"];
const RECORD: RecordGlyphId[] = ["darn", "spiral", "tangle", "stitch"];
const FRACTIONS = [0, 0.1, 0.35, 0.5, 0.8, 0.999, 1];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{title}</h2>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="tg-host grid w-24 justify-items-center gap-2 rounded-lg border border-line bg-panel px-2 py-3 text-ink-faint">
      <div className="flex items-center gap-2">{children}</div>
      <figcaption className="text-[10px] text-ink-dim">{label}</figcaption>
    </figure>
  );
}

/** Dev-only specimen of every shipped thread glyph, idle and lit. 404 in production. */
export default function GlyphSpecimenPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="space-y-8 py-6">
      <header>
        <h1 className="display text-2xl">Glyph specimen</h1>
        <p className="text-sm text-ink-dim">Idle, then lit. Hover a cell to sew it in. Grammar: docs/GLYPHS.md.</p>
      </header>
      <Row title="Sections">
        {NAV.map((id) => (
          <Cell key={id} label={id}>
            <NavIcon id={id} />
            <span className="tg-lit"><NavIcon id={id} /></span>
          </Cell>
        ))}
      </Row>
      <Row title="Chrome">
        {UTIL.map((id) => (
          <Cell key={id} label={id}>
            <UtilGlyph id={id} />
            <UtilGlyph id={id} className="tg-lit" />
          </Cell>
        ))}
      </Row>
      <Row title="Record">
        {RECORD.map((id) => (
          <Cell key={id} label={id}>
            <RecordGlyph id={id} size={20} />
            <RecordGlyph id={id} size={20} className="tg-lit" />
          </Cell>
        ))}
      </Row>
      <Row title="Coverage weave">
        {FRACTIONS.map((f) => (
          <Cell key={f} label={`${Math.round(f * 1000) / 10}%`}>
            <CoverageWeave fraction={f} className="tg-lit" />
            <CoverageWeave fraction={f} size={28} className="tg-lit" />
          </Cell>
        ))}
      </Row>
    </div>
  );
}
