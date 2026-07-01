import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  cutFromParams, runCut, cutHref, curatedFor, dimensionLabel, metricLabel, isChronological,
  type Cut,
} from "@/lib/cut";
import { fmtNum } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { CoverageNote } from "@/components/CoverageNote";
import { CutChart } from "@/components/cut/CutChart";

export const revalidate = 86400;

type SP = Record<string, string | undefined>;

/** Title for a curated cut — its own headline. */
function cutTitle(cut: Cut): string {
  const c = curatedFor(cut);
  if (c) return c.title;
  return `United by ${dimensionLabel(cut.dimension).toLowerCase()}, ranked by ${metricLabel(cut.metric).toLowerCase()}`;
}

function cutDescription(cut: Cut): string {
  const c = curatedFor(cut);
  if (c) return c.blurb;
  return `United’s record grouped by ${dimensionLabel(cut.dimension).toLowerCase()} and ranked by ${metricLabel(cut.metric).toLowerCase()}, every group linking to the matches behind it.`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const cut = cutFromParams(sp);
  const title = cutTitle(cut);
  const description = cutDescription(cut);

  // Only curated cuts are real pages now. Any other parameter combination is a
  // retired fork — the page redirects it to /explore, so it stays noindex.
  if (!cut.curated) {
    return { title, description, robots: { index: false, follow: true } };
  }
  return {
    title,
    description,
    alternates: { canonical: cutHref(cut) },
    openGraph: { type: "article", title: `${title} · Red Thread`, description, url: cutHref(cut) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CutPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cut = cutFromParams(sp);
  const curatedEntry = curatedFor(cut);

  // The group-by-anything fork builder is retired: a cut is only ever a curated
  // entry now. Any hand-built fork URL falls back to Discover, where the curated
  // cuts live.
  if (!curatedEntry) redirect("/explore");

  const result = runCut(cut);
  const { groups, headline, coverage, total, played, baseline } = result;

  const dimLabel = dimensionLabel(cut.dimension);
  const volNoun = cut.subject === "player" ? "appearances" : "matches";

  return (
    <div className="space-y-7">
      <nav className="text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-devil-bright">Discover</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-dim">Cut</span>
      </nav>

      <PageHeader eyebrow="Curated cut" title={cutTitle(cut)} deferOnMobile>
        The whole record reordered as a standings ladder — every group links to its matches.
      </PageHeader>

      {/* The answer first: the standout group for this cut's lens as a single
          confident band (not a near-empty card). */}
      {coverage.grade === "empty" || !headline ? (
        <section className="rounded-xl border border-line bg-panel px-5 py-6">
          <p className="text-sm text-ink-dim">{coverage.basis}</p>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/_0.22)]">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-2/3 rounded-full opacity-[0.10] blur-3xl"
            style={{ backgroundColor: "var(--color-gold)" }}
            aria-hidden
          />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
                Top {dimLabel.toLowerCase()}
              </p>
              <Link
                href={headline.href}
                className="text-sm font-semibold text-devil-bright hover:underline focus-ring"
              >
                View the matches →
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h2 className="display text-2xl leading-tight text-ink sm:text-3xl">{headline.subject}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink-dim">
                  {headline.gloss.charAt(0).toUpperCase() + headline.gloss.slice(1)}.
                </p>
              </div>
              <div className="shrink-0 leading-none sm:text-right">
                <span className="stat-num text-5xl font-semibold text-gold sm:text-6xl">
                  {headline.figure}
                </span>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {headline.metric}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {dimLabel} ·{" "}
              {isChronological(cut.dimension) ? "over time, by" : "ranked by"}{" "}
              {metricLabel(cut.metric).toLowerCase()}
            </h2>
            <span className="stat-num text-xs text-ink-faint">
              {total > groups.length ? `top ${fmtNum(groups.length)} of ${fmtNum(total)}` : `${fmtNum(total)} groups`}
            </span>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset] sm:p-5">
            <CutChart
              groups={groups}
              metric={cut.metric}
              dimension={cut.dimension}
              baseline={baseline}
              standoutKey={headline?.key}
            />
          </div>
          <CoverageNote slice={`${dimLabel} groups across ${fmtNum(played)} ${volNoun}`} coverage={coverage.basis} />
        </section>
      )}
    </div>
  );
}
