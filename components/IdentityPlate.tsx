import Link from "next/link";
import { seasonHref } from "@/lib/publishedHref";
import { WdlBar } from "@/components/WdlBar";
import { GoalDiff } from "@/components/GoalDiff";
import { ShareCite } from "@/components/ShareCite";
import { fmtNum, pct } from "@/lib/format";

/**
 * One cell of the plate's stat strip: a figure, its label, an optional line of
 * support. Every cell has the same three rows, so the strip reads on one
 * baseline however many cells a subject earns.
 */
export interface PlateCell {
  value: React.ReactNode;
  label: string;
  detail?: React.ReactNode;
  tone?: string;
  /** A small glyph seated before the figure (a trophy for silverware). */
  icon?: React.ReactNode;
  /** Hover text, for a cell whose detail is too long to print. */
  title?: string;
}

/**
 * The dominant figure — the answer the plate leads with. Defaults to win rate
 * ("63% won, from N matches") for the head-to-head / tenure pages; a season
 * overrides it with its league finish, since *that* is the season's verdict.
 */
export interface PlateHeadline {
  value: React.ReactNode;
  /** Short uppercase qualifier after the figure ("won", "league finish"). */
  label: string;
  /** Context line beneath ("from N matches", "Champions of the …"). */
  sub?: React.ReactNode;
  /** Figure colour class; defaults to devil-bright. */
  tone?: string;
}

/** One band on the span track: positions are 0..1 along the rail. */
export interface SpanSegment {
  from: number;
  to: number;
  title?: string;
}

/** Best season marker on the span rail — same gold pip idiom as {@link PlayerPlate}. */
interface SpanPeakSeason {
  season: string;
  /** Fraction 0..1 along the span rail */
  at: number;
  title: string;
  /** Visible label after the season ("Best season", "Most prolific"). */
  label?: string;
}

interface SpanProps {
  leftLabel: string;
  left: React.ReactNode;
  rightLabel: string;
  right: React.ReactNode;
  caption?: React.ReactNode;
  /** Tenure-style bands; omit for a single continuous span. */
  segments?: SpanSegment[];
  /** A drawn chart that replaces the plain rail (e.g. the rivalry cord). */
  rail?: React.ReactNode;
  peakSeason?: SpanPeakSeason;
}

// ------------------------------------------------------------------ shell

/**
 * The floodlit plate's frame, shared by `IdentityPlate` and `PlayerPlate`.
 *
 * Desktop: a full-height media rail on the left (a portrait bleeds to its edges;
 * an emblem — crest, season lap — sits centred on the tinted ground), and the
 * identity header and body to its right. Phone: the media drops to a compact
 * tile beside the header, and the body runs the full width beneath.
 */
export function PlateShell({
  media,
  mediaKind = "emblem",
  mediaNote,
  mediaBackdrop,
  accent,
  share,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  media?: React.ReactNode;
  /** `portrait` bleeds the image to the rail's edges; `emblem` centres it. */
  mediaKind?: "portrait" | "emblem";
  /** Small print or a legend under the media (attribution, a chart key). */
  mediaNote?: React.ReactNode;
  /** A portrait's image URL, blurred behind the rail so it runs the full height. */
  mediaBackdrop?: string | null;
  /** Floodlight wash colour — the club's colour for an opponent, else devil red. */
  accent?: string;
  share?: { path: string; title: string };
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const wash = accent ?? "var(--color-devil)";
  return (
    <section
      className={`plate ${media ? "" : "plate--bare"}`}
      style={{ "--plate-accent": wash } as React.CSSProperties}
    >
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="plate-wash" aria-hidden />

      {media && (
        <div className={`plate-media plate-media--${mediaKind}`}>
          {mediaBackdrop && (
            <div
              className="plate-media-backdrop"
              style={{ "--plate-backdrop": `url("${mediaBackdrop}")` } as React.CSSProperties}
              aria-hidden
            />
          )}
          <div className="plate-media-figure">{media}</div>
          {mediaNote && <div className="plate-media-note">{mediaNote}</div>}
        </div>
      )}

      <header className="plate-head">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{eyebrow}</p>
          <h1 className="plate-title display text-balance">{title}</h1>
          {subtitle && (
            <p className="plate-subtitle stat-num mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-dim">
              {subtitle}
            </p>
          )}
        </div>
        {share && (
          <div className="plate-share">
            <ShareCite path={share.path} title={share.title} />
          </div>
        )}
      </header>

      <div className="plate-body">{children}</div>

      {footer && <div className="plate-foot">{footer}</div>}
    </section>
  );
}

/**
 * The stat strip: one dominant figure, then equal cells divided by hairlines.
 * `lead` is an optional cell that renders first in the strip (goal difference,
 * which brings its own unit toggle).
 */
export function PlateStats({
  headline,
  lead,
  cells,
}: {
  headline: PlateHeadline;
  lead?: React.ReactNode;
  cells: PlateCell[];
}) {
  const count = cells.length + (lead ? 1 : 0);
  return (
    <div className="plate-stats" style={{ "--plate-cells": Math.max(1, count) } as React.CSSProperties}>
      <div className="plate-headline">
        <span className={`plate-figure stat-num font-semibold ${headline.tone ?? "text-devil-bright"}`}>
          {headline.value}
        </span>
        <span className="plate-headline-label">{headline.label}</span>
        {headline.sub && <p className="plate-headline-sub stat-num">{headline.sub}</p>}
      </div>
      {count > 0 && (
        <dl className="plate-cells">
          {lead && <div className="plate-cell">{lead}</div>}
          {cells.map((c) => (
            <div key={c.label} className="plate-cell" title={c.title}>
              <dd className={`plate-cell-value stat-num ${c.tone ?? "text-ink"}`}>
                {c.icon}
                {c.value}
              </dd>
              <dt className="plate-cell-label">{c.label}</dt>
              {c.detail && <dd className="plate-cell-detail">{c.detail}</dd>}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ identity plate

interface IdentityPlateProps {
  eyebrow: string;
  /** A `ClubBadge` or `PlayerPortrait`, or a drawn emblem (the season lap). */
  leading?: React.ReactNode;
  /** How the leading visual sits in the rail; portraits bleed, emblems centre. */
  leadingKind?: "portrait" | "emblem";
  /** Small print or a key under the leading visual. */
  leadingNote?: React.ReactNode;
  /** Portrait URL for the rail's blurred backdrop. */
  leadingBackdrop?: string | null;
  title: string;
  subtitle?: React.ReactNode;
  record: { w: number; d: number; l: number; p: number; gf: number; ga: number };
  /** Overrides the default win-rate headline; see {@link PlateHeadline}. */
  headline?: PlateHeadline;
  /** Extra cells in the stat strip; goal difference is always the first. */
  secondary?: PlateCell[];
  /** Floodlight wash colour — the club's colour for an opponent, else devil red. */
  accent?: string;
  span?: SpanProps;
  /** Copy-link / cite affordance, rendered in the header row. */
  share?: { path: string; title: string };
}

/**
 * The head-to-head / tenure / season plate. Shared by `/opponent/[id]`,
 * `/manager/[id]` and `/seasons/[season]`: the subject in the media rail, one
 * dominant figure that *is* the answer, a strip of supporting cells on one
 * baseline, the W-D-L record edge to edge, and an optional span track where the
 * relationship's life reads as position.
 *
 * Sibling to `PlayerPlate`, which shares the frame but leads with goals.
 */
export function IdentityPlate({
  eyebrow, leading, leadingKind = "emblem", leadingNote, leadingBackdrop, title, subtitle, record, headline, secondary = [], accent, span, share,
}: IdentityPlateProps) {
  const { w, d, l, p, gf, ga } = record;
  const head: PlateHeadline = headline ?? {
    value: pct(w, p),
    label: "won",
    sub: <>from {fmtNum(p)} {p === 1 ? "match" : "matches"}</>,
    // The default headline is the win rate, so it wears the win colour, not brand
    // red (which now reads as the loss pole). Overrides set their own tone.
    tone: "text-win",
  };

  return (
    <PlateShell
      media={leading}
      mediaKind={leadingKind}
      mediaNote={leadingNote}
      mediaBackdrop={leadingBackdrop}
      accent={accent}
      share={share}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
    >
      <PlateStats headline={head} lead={<GoalDiff gf={gf} ga={ga} played={p} variant="cell" />} cells={secondary} />

      {/* The record as one edge-to-edge stacked bar — win | draw | loss with the
          counts seated inside each segment, so it states itself without a caption. */}
      <div className="mt-5">
        <WdlBar w={w} d={d} l={l} size="lg" variant="stacked" showLabels />
      </div>

      {span && <SpanTrack {...span} accent={accent ?? "var(--color-devil)"} />}
    </PlateShell>
  );
}

/** The gold best-season link, shared by the span tracks of both plates. */
export function PeakSeasonLink({
  season, title, label,
}: { season: string; title: string; label: string }) {
  return (
    <Link
      href={seasonHref(season)}
      prefetch={false}
      className="stat-num inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-gold/90 hover:text-gold focus-ring"
      title={title}
    >
      <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2.5px_rgb(245_197_24_/0.18)]" />
      {season}
      <span className="hidden font-sans text-[11px] uppercase tracking-[0.12em] text-gold/70 sm:inline">{label}</span>
    </Link>
  );
}

/**
 * The relationship as one span: earliest point on the left, latest on the right.
 * Tenure bands (a manager's separate spells) render as discrete coloured segments;
 * a single continuous fixture history fills the whole rail.
 */
function SpanTrack({
  leftLabel, left, rightLabel, right, caption, segments, peakSeason, rail, accent,
}: SpanProps & { accent: string }) {
  const bands = segments && segments.length > 0 ? segments : [{ from: 0, to: 1 }];
  const peakAt =
    peakSeason != null ? Math.min(96, Math.max(4, peakSeason.at * 100)) : null;

  return (
    <div className="plate-span">
      {rail ? (
        <div>{rail}</div>
      ) : (
        <div className="relative mt-1 h-1.5 rounded-full bg-panel-2 ring-1 ring-inset ring-line">
          {bands.map((b, i) => (
            <div
              key={i}
              className="absolute inset-y-0 rounded-full opacity-80"
              style={{ left: `${b.from * 100}%`, width: `${Math.max(1.5, (b.to - b.from) * 100)}%`, backgroundColor: accent }}
              title={b.title}
            />
          ))}
          <span className="absolute -left-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch" style={{ backgroundColor: accent }} aria-hidden />
          <span className="absolute -right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch" style={{ backgroundColor: accent }} aria-hidden />
          {peakAt != null && peakSeason && (
            <Link
              href={seasonHref(peakSeason.season)}
              prefetch={false}
              className="group/peak absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-ring"
              style={{ left: `${peakAt}%` }}
              title={peakSeason.title}
              aria-label={peakSeason.title}
            >
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-pitch bg-gold shadow-[0_0_0_3px_rgb(245_197_24_/0.18)]" aria-hidden />
            </Link>
          )}
        </div>
      )}

      <div className="plate-span-ends">
        <div className="min-w-0">
          <span className="plate-span-label">{leftLabel}</span>
          <div className="truncate text-ink-dim">{left}</div>
        </div>
        {peakSeason ? (
          <PeakSeasonLink season={peakSeason.season} title={peakSeason.title} label={peakSeason.label ?? "Best season"} />
        ) : (
          <span />
        )}
        <div className="min-w-0 text-right">
          <span className="plate-span-label">{rightLabel}</span>
          <div className="truncate text-ink-dim">{right}</div>
        </div>
      </div>
      {caption && <p className="mt-2 text-[11px] leading-4 text-ink-faint">{caption}</p>}
    </div>
  );
}
