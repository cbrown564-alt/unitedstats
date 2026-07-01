import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Pager } from "@/components/Pager";
import { AnswerCoverageTag } from "@/components/AnswerCoverageTag";
import { ShareCite } from "@/components/ShareCite";
import { searchPage, entityResults, type SearchEntity } from "@/lib/search";
import { highlight } from "@/lib/search/highlight";
import { KIND_LABELS, KIND_HEADINGS, POPULAR_SEARCHES, RESHAPE_PROMPTS, SEARCH_HINTS, SEARCH_PLACEHOLDER } from "@/lib/search/examples";
import { queryString } from "@/lib/url";

export const revalidate = 86400;
export const metadata = { title: "Search" };

const PAGE_SIZE = 25;

const pillTone = (active: boolean) =>
  active
    ? "border-devil/60 bg-devil/15 text-devil-bright"
    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink";

function EntityRow({ e, q }: { e: SearchEntity; q: string }) {
  return (
    <Link
      href={e.href}
      className="tap-target flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-panel-2"
    >
      <span className="truncate">
        <span className="mr-2 inline-block w-20 text-[10px] uppercase tracking-wider text-ink-faint">
          {KIND_LABELS[e.kind] ?? e.kind}
        </span>
        <span className="font-medium">{highlight(e.label, q)}</span>
      </span>
      <span className="stat-num shrink-0 text-xs text-ink-faint">{e.detail}</span>
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kind = sp.kind || undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // ---- empty state: no query yet ----
  if (q.length < 2) {
    return (
      <div className="space-y-7">
        <PageHeader eyebrow="Search" title="Search the archive">
          Players, managers, opponents, seasons, and shaped questions that compute an answer.
        </PageHeader>
        <SearchForm q="" />
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Try a question</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {POPULAR_SEARCHES.map((p) => (
              <Link
                key={p.q}
                href={`/search${queryString({ q: p.q })}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm transition-colors hover:border-devil/60"
              >
                <span className="font-medium">{p.q}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">{p.hint}</span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Operators</h2>
          <ul className="space-y-1">
            {SEARCH_HINTS.map((h) => (
              <li key={h} className="stat-num text-sm text-ink-dim">{h}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const result = searchPage(q, { kind, page, pageSize: PAGE_SIZE });
  const { shaped, groups, counts, total } = result;
  // Nothing matched — offer fuzzy "did you mean" suggestions from the whole index.
  const suggestions = total === 0 && shaped.length === 0 ? entityResults(q, { limit: 8 }).entities : [];

  const facetHref = (k: string | undefined) => `/search${queryString({ q, kind: k })}`;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Search" title={`Results for “${q}”`}>
        {total > 0
          ? `${total} match${total === 1 ? "" : "es"}${shaped.length ? " plus a shaped answer" : ""}.`
          : shaped.length
            ? "A computed answer for your question."
            : "No matches — try one of the suggestions below."}
      </PageHeader>
      <SearchForm q={q} />

      {shaped.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Answers</h2>
          {shaped.map((s) => (
            <div key={s.title} className="relative rounded-lg border border-line bg-panel transition-colors hover:border-devil/60">
              <Link href={s.href} className="tap-target block px-4 py-3 pr-24">
                {s.tentative && (
                  <div className="text-[10px] uppercase tracking-wider text-ink-faint">Did you mean</div>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{s.title}</span>
                  <span className="shrink-0 text-xs text-devil-bright">{s.hrefLabel}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="stat-num text-xs text-ink-dim">{s.summary}</span>
                  {s.coverage && <AnswerCoverageTag coverage={s.coverage} />}
                </div>
              </Link>
              <div className="absolute right-3 top-3 z-10">
                <ShareCite path={s.href} title={s.title} />
              </div>
            </div>
          ))}
        </section>
      )}

      {counts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={facetHref(undefined)}
            aria-current={!kind ? "true" : undefined}
            className={`rounded-full border px-3 py-1 text-sm transition-colors focus-ring ${pillTone(!kind)}`}
          >
            All {total}
          </Link>
          {counts.map((c) => (
            <Link
              key={c.kind}
              href={facetHref(c.kind)}
              aria-current={kind === c.kind ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-sm transition-colors focus-ring ${pillTone(kind === c.kind)}`}
            >
              {KIND_HEADINGS[c.kind] ?? c.kind} {c.n}
            </Link>
          ))}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.kind}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {KIND_HEADINGS[g.kind] ?? g.kind}
            </h2>
            {!kind && g.total > g.entities.length && (
              <Link href={facetHref(g.kind)} className="text-xs text-devil-bright hover:underline">
                See all {g.total} →
              </Link>
            )}
          </div>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {g.entities.map((e) => (
              <EntityRow key={`${e.kind}-${e.href}`} e={e} q={q} />
            ))}
          </div>
        </section>
      ))}

      {kind && result.pages > 1 && (
        <Pager page={result.page} pages={result.pages} hrefFor={(p) => `/search${queryString({ q, kind, page: String(p) })}`} />
      )}

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Did you mean</h2>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {suggestions.map((e) => (
              <EntityRow key={`${e.kind}-${e.href}`} e={e} q={q} />
            ))}
          </div>
        </section>
      )}

      {total === 0 && shaped.length === 0 && suggestions.length === 0 && (
        <section className="space-y-3">
          <p className="text-sm text-ink-dim">
            Nothing close enough to suggest. Try a surname, a season like 1998-99, or an operator such as{" "}
            <code className="stat-num">player:rooney</code> — or one of these shaped questions:
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {RESHAPE_PROMPTS.map((p) => (
              <Link
                key={p}
                href={`/search${queryString({ q: p })}`}
                className="rounded-lg border border-line bg-panel px-4 py-3 text-sm font-medium transition-colors hover:border-devil/60"
              >
                {p}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** A plain GET form so the results page works without JS and is shareable by URL. */
function SearchForm({ q }: { q: string }) {
  return (
    <form method="get" action="/search" role="search">
      <input
        type="search"
        name="q"
        defaultValue={q}
        autoFocus={q.length < 2}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label="Search the archive"
        className="w-full rounded-lg border border-line bg-panel px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-devil focus:outline-none"
      />
    </form>
  );
}
