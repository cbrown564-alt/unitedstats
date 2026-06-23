import Link from "next/link";
import type { Metadata } from "next";
import {
  competitionsList, allSeasons, managerById, opponentsIndex,
} from "@/lib/queries";
import {
  cutFromParams, runCut, cutHref, curatedFor, dimensionLabel, metricLabel,
  type Cut,
} from "@/lib/cut";
import { COMPETITION_TYPE_LABELS, fmtNum, resultLabel, venueLabel } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { CoverageNote } from "@/components/CoverageNote";
import { CutControls } from "@/components/cut/CutControls";
import { CutBoard } from "@/components/cut/CutBoard";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

/** Title for the cut: a curated entry's own headline, or a generated one for a fork. */
function cutTitle(cut: Cut): string {
  const c = curatedFor(cut);
  if (c) return c.title;
  return `United by ${dimensionLabel(cut.dimension).toLowerCase()}, ranked by ${metricLabel(cut.metric).toLowerCase()}`;
}

function cutDescription(cut: Cut): string {
  const c = curatedFor(cut);
  if (c) return c.blurb;
  return `United's record grouped by ${dimensionLabel(cut.dimension).toLowerCase()} and ranked by ${metricLabel(cut.metric).toLowerCase()}, every group linking to the matches behind it.`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const cut = cutFromParams(sp);
  const title = cutTitle(cut);
  const description = cutDescription(cut);

  // SEO guardrail: only curated cuts earn an indexable canonical page. Every other
  // parameter combination is a fork — a real shareable URL, but noindex, so forking
  // is unbounded without spawning infinite thin-content pages.
  if (!cut.curated) {
    return { title, description, robots: { index: false, follow: true } };
  }
  return {
    title,
    description,
    alternates: { canonical: cutHref(cut) },
    openGraph: { type: "article", title: `${title} · UnitedStats`, description, url: cutHref(cut) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CutPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cut = cutFromParams(sp);
  const result = runCut(cut);
  const { groups, headline, coverage, total, played } = result;

  const competitions = competitionsList();
  const seasons = allSeasons();
  const chips = filterChips(cut);
  const dimLabel = dimensionLabel(cut.dimension);

  return (
    <div className="space-y-7">
      <nav className="text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-devil-bright">Explore</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-dim">Cut</span>
      </nav>

      <PageHeader eyebrow={cut.curated ? "Curated cut" : "Your cut"} title={cutTitle(cut)}>
        Group the whole record your own way, then rank it by the lens that answers your question. Every
        row reproduces exactly the matches it counts; change the dimension or the metric to fork a new,
        shareable cut.
      </PageHeader>

      {/* Active slice, as removable chips — each links to the same cut minus that filter. */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Slice</span>
          {chips.map((c) => (
            <Link
              key={c.key}
              href={c.removeHref}
              className="group inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 py-0.5 pl-2.5 pr-1.5 text-xs text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
            >
              {c.label}
              <span className="text-ink-faint group-hover:text-devil-bright" aria-label="remove filter">×</span>
            </Link>
          ))}
          <Link
            href={cutHref({ dimension: cut.dimension, metric: cut.metric })}
            className="rounded-full px-2 py-0.5 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-ring"
          >
            Clear slice
          </Link>
        </div>
      )}

      {/* The answer first: the standout group for the active lens, writ large. Over an
          empty slice (a fork whose filters intersect to nothing) the cut degrades to
          its own unsupported state rather than showing a clean total over a hole. */}
      {coverage.grade === "empty" || !headline ? (
        <section className="rounded-lg border border-line bg-panel p-6">
          <p className="text-sm text-ink-dim">{coverage.basis}</p>
        </section>
      ) : (
        <section className="rounded-lg border border-line bg-panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
            Standout {dimLabel.toLowerCase()}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
            <span className="stat-num text-5xl font-semibold leading-none text-gold sm:text-6xl">{headline.figure}</span>
            <div className="leading-tight">
              <p className="display text-2xl text-ink">{headline.subject}</p>
              <p className="mt-1 text-sm text-ink-dim">
                {headline.metric} — {headline.gloss}.
              </p>
            </div>
          </div>
          <Link
            href={headline.href}
            className="mt-4 inline-block text-xs font-semibold text-devil-bright hover:underline focus-ring"
          >
            See the matches behind {headline.subject} →
          </Link>
        </section>
      )}

      <CutControls cut={cut} competitions={competitions} seasons={seasons} />

      {/* Mobile: a sticky bar pinning under the header so the fork dials are one tap
          away deep in a long ladder, rather than a scroll back to the top. Pure
          sticky anchor — no JS, no extra fetch (the proven /matches pattern). */}
      {groups.length > 6 && (
        <div className="sticky top-14 z-30 -mx-4 border-y border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="stat-num text-xs text-ink-dim">
              {fmtNum(total)} {dimLabel.toLowerCase()} groups · {fmtNum(played)} matches
            </span>
            <a
              href="#cut-controls"
              className="tap-target rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
            >
              Re-cut
            </a>
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {dimLabel} · ranked by {metricLabel(cut.metric).toLowerCase()}
            </h2>
            <span className="stat-num text-xs text-ink-faint">
              {total > groups.length ? `top ${fmtNum(groups.length)} of ${fmtNum(total)}` : `${fmtNum(total)} groups`}
            </span>
          </div>
          <CutBoard groups={groups} metric={cut.metric} dimLabel={dimLabel} />
          <CoverageNote slice={`${dimLabel} groups across ${fmtNum(played)} matches`} coverage={coverage.basis} />
        </section>
      )}
    </div>
  );
}

interface FilterChip {
  key: string;
  label: string;
  removeHref: string;
}

/** Active slice filters as chips, each linking to the cut with that filter removed. */
function filterChips(cut: Cut): FilterChip[] {
  const f = cut.filters;
  const comps = f.competition ? competitionsList() : [];
  const opps = f.opponent ? opponentsIndex() : [];
  const out: FilterChip[] = [];
  const without = (key: keyof Cut["filters"]): string => {
    const next = { ...f };
    delete next[key];
    return cutHref({ dimension: cut.dimension, metric: cut.metric, filters: next });
  };
  const push = (key: keyof Cut["filters"], label: string) =>
    out.push({ key, label, removeHref: without(key) });

  if (f.q) push("q", `Opponent: ${f.q}`);
  if (f.opponent) push("opponent", opps.find((o) => o.id === f.opponent)?.name ?? "Opponent");
  if (f.competition) push("competition", comps.find((c) => c.id === f.competition)?.name ?? f.competition);
  if (f.manager) push("manager", managerById(f.manager)?.name ?? "Manager");
  if (f.season) push("season", `Season ${f.season}`);
  if (f.type) push("type", COMPETITION_TYPE_LABELS[f.type] ?? f.type);
  if (f.venue) push("venue", venueLabel(f.venue));
  if (f.result) push("result", resultLabel(f.result));
  if (f.from) push("from", `From ${f.from}`);
  if (f.to) push("to", `To ${f.to}`);
  return out;
}
