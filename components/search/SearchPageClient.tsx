"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Pager } from "@/components/Pager";
import { highlight } from "@/lib/search/highlight";
import {
  KIND_LABELS,
  KIND_HEADINGS,
  POPULAR_SEARCHES,
  RESHAPE_PROMPTS,
  SEARCH_HINTS,
  SEARCH_PLACEHOLDER,
} from "@/lib/search/examples";
import type { SearchIndex } from "@/lib/search/clientIndex";
import { runClientSearch, searchPageClient } from "@/lib/search/clientSearch";
import type { SearchEntity } from "@/lib/search";
import { queryString } from "@/lib/url";

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

function EmptySearch() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Search" title="Search the archive">
        Players, managers, opponents, seasons, and shaped questions that compute an answer.
      </PageHeader>
      <SearchForm q="" />
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Try a question</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {POPULAR_SEARCHES.map((popular) => (
            <Link
              key={popular.q}
              href={`/search${queryString({ q: popular.q })}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm transition-colors hover:border-devil/60"
            >
              <span className="font-medium">{popular.q}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">{popular.hint}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Operators</h2>
        <ul className="space-y-1">
          {SEARCH_HINTS.map((hint) => (
            <li key={hint} className="stat-num text-sm text-ink-dim">
              {hint}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const kind = searchParams.get("kind") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`search index ${res.status}`);
        return res.json() as Promise<SearchIndex>;
      })
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (q.length < 2) return <EmptySearch />;
  if (!index) {
    return (
      <div className="space-y-7">
        <PageHeader eyebrow="Search" title={`Results for “${q}”`}>
          Searching the archive…
        </PageHeader>
        <SearchForm q={q} />
      </div>
    );
  }

  const result = searchPageClient(q, index, { kind, page, pageSize: PAGE_SIZE });
  const { questions, groups, counts, total } = result;
  const hasAnswers = questions.length > 0;
  const suggestions = total === 0 && !hasAnswers ? runClientSearch(q, index, 8).entities : [];
  const facetHref = (nextKind: string | undefined) => `/search${queryString({ q, kind: nextKind })}`;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Search" title={`Results for “${q}”`}>
        {total > 0
          ? `${total} match${total === 1 ? "" : "es"}${hasAnswers ? " plus curated answers" : ""}.`
          : hasAnswers
            ? "A curated or computed answer for your question."
            : "No matches — try one of the suggestions below."}
      </PageHeader>
      <SearchForm q={q} />

      {questions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{KIND_HEADINGS.question}</h2>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {questions.map((entity) => (
              <EntityRow key={entity.href} e={entity} q={q} />
            ))}
          </div>
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
          {counts.map((count) => (
            <Link
              key={count.kind}
              href={facetHref(count.kind)}
              aria-current={kind === count.kind ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-sm transition-colors focus-ring ${pillTone(kind === count.kind)}`}
            >
              {KIND_HEADINGS[count.kind] ?? count.kind} {count.n}
            </Link>
          ))}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.kind}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {KIND_HEADINGS[group.kind] ?? group.kind}
            </h2>
            {!kind && group.total > group.entities.length && (
              <Link href={facetHref(group.kind)} className="text-xs text-devil-bright hover:underline">
                See all {group.total} →
              </Link>
            )}
          </div>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {group.entities.map((entity) => (
              <EntityRow key={`${entity.kind}-${entity.href}`} e={entity} q={q} />
            ))}
          </div>
        </section>
      ))}

      {kind && result.pages > 1 && (
        <Pager
          page={result.page}
          pages={result.pages}
          hrefFor={(nextPage) => `/search${queryString({ q, kind, page: String(nextPage) })}`}
        />
      )}

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Did you mean</h2>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {suggestions.map((entity) => (
              <EntityRow key={`${entity.kind}-${entity.href}`} e={entity} q={q} />
            ))}
          </div>
        </section>
      )}

      {total === 0 && !hasAnswers && suggestions.length === 0 && (
        <section className="space-y-3">
          <p className="text-sm text-ink-dim">
            Nothing close enough to suggest. Try a surname, a season like 1998-99, or an operator such as{" "}
            <code className="stat-num">player:rooney</code> — or one of these shaped questions:
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {RESHAPE_PROMPTS.map((prompt) => (
              <Link
                key={prompt}
                href={`/search${queryString({ q: prompt })}`}
                className="rounded-lg border border-line bg-panel px-4 py-3 text-sm font-medium transition-colors hover:border-devil/60"
              >
                {prompt}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
