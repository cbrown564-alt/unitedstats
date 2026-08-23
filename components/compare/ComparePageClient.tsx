"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CompareTable } from "@/components/CompareTable";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { PageHeader } from "@/components/PageHeader";
import type { Comparison } from "@/lib/compare";
import { CURATED_DEBATES, curatedComparisonKey, type CompareMode, type CuratedDebate } from "@/lib/curatedDebates";
import { queryString } from "@/lib/url";

type ComparePageMode = Extract<CompareMode, "players" | "managers">;

const MODES: { key: ComparePageMode; label: string; blurb: string }[] = [
  { key: "players", label: "Players", blurb: "two careers, appearance for appearance" },
  { key: "managers", label: "Managers", blurb: "two reigns on win rate, points, and trophies" },
];

const sectionHead = "text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright";

function compareKey(mode: ComparePageMode, a: string, b: string): string {
  return curatedComparisonKey(mode, a, b);
}

function ModePills({ mode }: { mode: ComparePageMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((item) => {
        const active = item.key === mode;
        return (
          <Link
            key={item.key}
            href={`/compare?mode=${item.key}`}
            aria-current={active ? "true" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-ring ${
              active
                ? "border-devil/60 bg-devil/15 text-devil-bright"
                : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function Suggestions({
  mode,
  suggestions,
  compact = false,
}: {
  mode: ComparePageMode;
  suggestions: CuratedDebate[];
  compact?: boolean;
}) {
  const href = (item: { a: string; b: string }) => `/compare${queryString({ mode, a: item.a, b: item.b })}`;
  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <Link
            key={item.label}
            href={href(item)}
            className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {suggestions.map((item) => (
        <Link
          key={item.label}
          href={href(item)}
          className="group block rounded-lg border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/70 focus-ring"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="display text-sm text-ink group-hover:text-devil-bright">{item.label}</span>
            <span className="stat-num text-devil-bright transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </span>
          <span className="mt-1.5 block text-sm leading-5 text-ink-dim">{item.hook}</span>
        </Link>
      ))}
    </div>
  );
}

export function ComparePageView({
  curated,
  mode = "players",
  a,
  b,
  rate = true,
}: {
  curated: Record<string, Comparison>;
  mode?: ComparePageMode;
  a?: string;
  b?: string;
  rate?: boolean;
}) {
  const comparison =
    a && b ? (curated[compareKey(mode, a, b)] ?? curated[compareKey(mode, b, a)] ?? null) : null;
  const unresolved = a && b && !comparison ? a : null;
  const suggestions = CURATED_DEBATES[mode];
  const rateToggleHref = {
    total: `/compare${queryString({ mode, a, b, rate: "total" })}`,
    rate: `/compare${queryString({ mode, a, b })}`,
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Side by side" title="Compare" deferOnMobile={!!comparison}>
        Authored player and manager debates on shared measures. Coverage gaps stay visible.
      </PageHeader>

      <ModePills mode={mode} />

      {comparison ? (
        <>
          <DetailBreadcrumb
            segments={[
              { label: "Discover", href: "/explore" },
              { label: "Compare", href: "/compare" },
              { label: `${comparison.a.label} vs ${comparison.b.label}` },
            ]}
          />
          <CompareTable
            comparison={comparison}
            rate={rate}
            rateHref={rateToggleHref}
            share={{
              path: `/compare${queryString({ mode, a, b, rate: rate ? undefined : "total" })}`,
              title: `${comparison.a.label} vs ${comparison.b.label} — Compare`,
            }}
          />
          <section>
            <h2 className={sectionHead}>Another curated debate</h2>
            <Suggestions mode={mode} suggestions={suggestions} compact />
          </section>
        </>
      ) : (
        <div className="space-y-7">
          <section>
            <h2 className={sectionHead}>Curated debates</h2>
            <p className="mt-1 mb-3 text-sm text-ink-dim">
              Open a reviewed head-to-head — {MODES.find((item) => item.key === mode)?.blurb}.
            </p>
            <Suggestions mode={mode} suggestions={suggestions} />
          </section>
          {unresolved && (
            <p className="text-sm text-ink-dim">
              That saved comparison no longer resolves. Choose one of the curated debates above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ComparePageClient({ curated }: { curated: Record<string, Comparison> }) {
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const mode: ComparePageMode = MODES.some((item) => item.key === rawMode) ? (rawMode as ComparePageMode) : "players";
  const a = searchParams.get("a") ?? undefined;
  const b = searchParams.get("b") ?? undefined;
  const rate = searchParams.get("rate") !== "total";
  return <ComparePageView curated={curated} mode={mode} a={a} b={b} rate={rate} />;
}
