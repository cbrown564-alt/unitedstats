import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverageNote } from "@/components/CoverageNote";
import { PageHeader } from "@/components/PageHeader";
import { ShareCite } from "@/components/ShareCite";
import {
  digestSummary,
  digestTitle,
  historyDigestIds,
  readHistoryDigest,
} from "@/lib/historyDigests";
import { fmtDateLong } from "@/lib/format";
import { historyDigestJsonLd, jsonLdHtml } from "@/lib/structuredData";

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
      title: `${title} · UnitedStats`,
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
        United {digest.match.score} {digest.match.opponent}, {fmtDateLong(digest.match.date)}. The notes below
        are generated from the canonical record and keep links back to the match evidence.
      </PageHeader>

      <section className="grid gap-3 md:grid-cols-2">
        {digest.claims.map((claim, index) => (
          <article key={claim.id} className="border border-line bg-panel p-4">
            <p className="stat-num text-xs text-ink-faint">#{index + 1} · {claim.kind}</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">{claim.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-dim">{claim.text}</p>
            <Link href={claim.evidencePath} className="mt-3 inline-block text-sm font-semibold text-devil-bright hover:underline focus-ring">
              Match evidence →
            </Link>
          </article>
        ))}
      </section>

      <section className="border border-line bg-panel p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">Evidence trail</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {digest.evidenceLinks.map((link) => (
            <li key={link.path}>
              <Link href={link.path} className="font-semibold text-devil-bright hover:underline focus-ring">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <CoverageNote
          slice={`${digest.match.competition}; ${digest.match.venue} venue; ${digest.match.season}`}
          coverage={`Digest ${digest.ref.id}; claim version ${digest.claimVersion}.`}
          evidenceHref={`/api/v1/matches/${digest.matchId}`}
          evidenceLabel="API evidence →"
        />
      </section>

      {digest.provenance.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">Sources</h2>
          <div className="grid gap-2">
            {digest.provenance.map((p, i) => (
              <div key={`${p.sourceId}-${p.facet}-${i}`} className="border border-line bg-panel px-3 py-2 text-sm text-ink-dim">
                <span className="font-semibold text-ink">{p.sourceName}</span>
                {p.facet && <span> · {p.facet}</span>}
                {p.confidence && <span> · {p.confidence}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
