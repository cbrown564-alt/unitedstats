import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ShareCite } from "@/components/ShareCite";
import {
  digestSummary,
  digestTitle,
  historyDigestIds,
  rankedClaims,
  readHistoryDigest,
  type HistoryDigestClaimKind,
} from "@/lib/historyDigests";
import { fmtDateLong, venueLabel } from "@/lib/format";
import { groupProvenanceBySource } from "@/lib/citations";
import { historyDigestJsonLd, jsonLdHtml } from "@/lib/structuredData";

/** Human labels for the canonical match-source facet codes. */
const FACET_LABEL: Record<string, string> = {
  result: "result",
  "united-scorers": "United scorers",
  "opposition-goals": "opposition goals",
  assists: "assists",
  "starting-lineup": "starting lineup",
  "used-substitutes": "substitutes used",
  bench: "bench",
  cards: "cards",
  attendance: "attendance",
};

function facetLabel(facet: string): string {
  return FACET_LABEL[facet] ?? facet.replace(/-/g, " ");
}

/** Confidence tiers, strongest first, with a colour cue that reinforces (not
 *  replaces) the label — complete reads as solid, partial as provisional. */
const CONFIDENCE_TIERS = [
  { key: "complete", label: "Complete", tone: "text-win" },
  { key: "supporting", label: "Supporting", tone: "text-ink-dim" },
  { key: "partial", label: "Partial", tone: "text-draw" },
  { key: "other", label: "Recorded", tone: "text-ink-faint" },
] as const;

/** Human labels for the detector kinds — the raw kind strings read like plumbing. */
const KIND_LABEL: Record<HistoryDigestClaimKind, string> = {
  result: "Result",
  "ledger-entry": "Ledger",
  record: "All-time record",
  "streak-started": "Run started",
  "streak-ended": "Run ended",
  "rank-change": "All-time rank",
  "manager-milestone": "Manager milestone",
  "opponent-milestone": "Head-to-head milestone",
  "unusual-scoreline": "Scoreline",
  "venue-fact": "Venue",
  "elo-movement": "Elo swing",
  "historical-percentile": "Elo percentile",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return historyDigestIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const digest = readHistoryDigest(id);
  if (!digest) return {};
  const title = digestTitle(digest);
  const description = digestSummary(digest);
  return {
    title,
    description,
    alternates: { canonical: digest.ref.path },
    openGraph: {
      type: "article",
      title: `${title} · Red Thread`,
      description,
      url: digest.ref.path,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HistoryChangedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = readHistoryDigest(id);
  if (!digest) notFound();
  const jsonLd = historyDigestJsonLd(digest);
  const ranked = rankedClaims(digest.claims);
  const lead = ranked[0];
  const supporting = ranked.slice(1);
  const sourceGroups = groupProvenanceBySource(digest.provenance);

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <nav className="text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/matches" className="hover:text-devil-bright">Matches</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/match/${digest.matchId}`} className="hover:text-devil-bright">{digest.match.score}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-dim">History changed</span>
      </nav>

      <PageHeader
        eyebrow="History changed"
        title={digestTitle(digest)}
        aside={<ShareCite path={digest.ref.path} title={digestTitle(digest)} />}
      >
        United {digest.match.score} {digest.match.opponent}, {fmtDateLong(digest.match.date)}. Every result nudges the
        all-time record — here is what this one moved, read straight from the canonical data.
      </PageHeader>

      {/* The single change that mattered most, then the rest. */}
      {lead && (
        <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0/0.22)]">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-2/3 rounded-full opacity-[0.10] blur-3xl"
            style={{ backgroundColor: "var(--color-gold)" }}
            aria-hidden
          />
          <div className="relative space-y-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
                {lead.kind === "result" ? "The match" : `The biggest change · ${KIND_LABEL[lead.kind]}`}
              </p>
              <Link href={lead.evidencePath} className="text-sm font-semibold text-devil-bright hover:underline focus-ring">
                See the match →
              </Link>
            </div>
            <h2 className="display text-2xl leading-tight sm:text-3xl">{lead.title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-ink-dim">{lead.text}</p>
          </div>
        </section>
      )}

      {supporting.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Also shifted</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {supporting.map((claim) => (
              <article key={claim.id} className="border border-line bg-panel p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{KIND_LABEL[claim.kind]}</p>
                <h3 className="mt-1.5 font-semibold text-ink">{claim.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-dim">{claim.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="border border-line bg-panel p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">Evidence trail</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Every claim is read straight from the canonical record — follow it to the source.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {digest.evidenceLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-panel-2/40 px-3.5 py-2.5 transition-colors hover:border-devil/60 hover:bg-panel-2/70 focus-ring"
            >
              <span className="text-sm font-semibold text-ink group-hover:text-devil-bright">{link.label}</span>
              <span className="text-devil-bright transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
            </Link>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line/60 pt-4 text-xs leading-5">
          <dt className="font-medium text-ink-faint">Slice</dt>
          <dd className="text-ink-dim">
            {digest.match.competition} · {venueLabel(digest.match.venue)} · {digest.match.season}
          </dd>
          <dt className="font-medium text-ink-faint">Digest ID</dt>
          <dd className="stat-num break-all text-ink-dim">{digest.ref.id}</dd>
          <dt className="font-medium text-ink-faint">Claim version</dt>
          <dd className="stat-num break-all text-ink-dim">{digest.claimVersion}</dd>
        </dl>
      </section>

      {sourceGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Sources for this match
          </h2>
          <p className="text-xs text-ink-faint">
            What each source recorded for United {digest.match.score} {digest.match.opponent} — the data
            these changes are read from.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {sourceGroups.map((g) => (
              <div key={g.sourceId} className="border border-line bg-panel p-3">
                <div className="flex items-baseline justify-between gap-2">
                  {g.sourceUrl ? (
                    <a
                      href={g.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-ink hover:text-devil-bright focus-ring"
                    >
                      {g.sourceName}
                    </a>
                  ) : (
                    <span className="font-semibold text-ink">{g.sourceName}</span>
                  )}
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {g.facets.length} {g.facets.length === 1 ? "facet" : "facets"}
                  </span>
                </div>
                <dl className="mt-2 space-y-1">
                  {CONFIDENCE_TIERS.map((tier) => {
                    const facets = g.facets.filter((f) => (f.confidence ?? "other") === tier.key);
                    if (facets.length === 0) return null;
                    return (
                      <div key={tier.key} className="flex gap-2 text-xs leading-5">
                        <dt className={`shrink-0 font-semibold uppercase tracking-[0.1em] ${tier.tone}`}>
                          {tier.label}
                        </dt>
                        <dd className="text-ink-dim">{facets.map((f) => facetLabel(f.facet)).join(", ")}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
