import Link from "next/link";
import {
  comparePlayers, compareManagers, CURATED_DEBATES,
  type CompareMode, type Comparison, type CuratedDebate,
} from "@/lib/compare";
import { managerById, managersIndex, playerById, type ManagerRecord } from "@/lib/queries";
import { resolveEntity } from "@/lib/search/resolve";
import { PageHeader } from "@/components/PageHeader";
import { CompareTable } from "@/components/CompareTable";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { queryString } from "@/lib/url";
import { listSeo, seoMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const metadata = seoMetadata(listSeo.compare.title, listSeo.compare.description, {
  alternates: { canonical: "/compare" },
});

type ComparePageMode = Extract<CompareMode, "players" | "managers">;

const MODES: { key: ComparePageMode; label: string; blurb: string }[] = [
  { key: "players", label: "Players", blurb: "two careers, appearance for appearance" },
  { key: "managers", label: "Managers", blurb: "two reigns on win rate, points, and trophies" },
];

// Curated head-to-heads live in lib/compare.ts (CURATED_DEBATES) so /compare and
// the /explore discovery home draw from one list and never drift.

// Every picker is the same text input + <datalist> autocomplete, so both
// modes look identical (no native-select chrome). The raw value can be a friendly
// name typed/picked from the list, or a canonical id/key from a suggestion link;
// these resolvers accept either, and the display helpers turn an id/key back into
// the friendly name for the box.
function resolvePlayerId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (playerById(raw)) return raw;
  return resolveEntity(raw, "player")?.entity_id;
}
function resolveManagerId(raw: string | undefined, managers: ManagerRecord[]): string | undefined {
  if (!raw) return undefined;
  if (managerById(raw)) return raw;
  const lc = raw.toLowerCase();
  return (managers.find((m) => m.name.toLowerCase() === lc) ?? managers.find((m) => m.name.toLowerCase().includes(lc)))?.id;
}
const sectionHead = "text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const mode: ComparePageMode = MODES.some((m) => m.key === sp.mode) ? (sp.mode as ComparePageMode) : "players";
  const rawA = sp.a;
  const rawB = sp.b;
  // The rate view (per 90 for players, per game for managers) is the
  // default — it compares honestly across careers and tenures of different
  // lengths. Totals are the opt-out via `?rate=total`.
  const rate = sp.rate !== "total";
  const rateToggleHref = {
    total: `/compare${queryString({ mode, a: rawA, b: rawB, rate: "total" })}`,
    rate: `/compare${queryString({ mode, a: rawA, b: rawB })}`,
  };

  const managers = mode === "managers" ? [...managersIndex()].sort((a, b) => b.p - a.p) : [];

  // Resolve the chosen pair for the active mode and build the comparison.
  let comparison: Comparison | null = null;
  let unresolved: string | null = null;

  if (mode === "players") {
    const idA = resolvePlayerId(rawA);
    const idB = resolvePlayerId(rawB);
    if (rawA && !idA) unresolved = rawA;
    else if (rawB && !idB) unresolved = rawB;
    else if (idA && idB) comparison = comparePlayers(idA, idB);
  } else {
    const idA = resolveManagerId(rawA, managers);
    const idB = resolveManagerId(rawB, managers);
    if (rawA && !idA) unresolved = rawA;
    else if (rawB && !idB) unresolved = rawB;
    else if (idA && idB) comparison = compareManagers(idA, idB);
  }

  const suggestions = CURATED_DEBATES[mode];

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
              path: `/compare${queryString({ mode, a: rawA, b: rawB, rate: rate ? undefined : "total" })}`,
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
              Open a reviewed head-to-head — {MODES.find((m) => m.key === mode)?.blurb}.
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

/** Mode switch — changing mode resets the pair so the picker stays valid. */
function ModePills({ mode }: { mode: ComparePageMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => {
        const active = m.key === mode;
        return (
          <Link
            key={m.key}
            href={`/compare?mode=${m.key}`}
            aria-current={active ? "true" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-ring ${
              active
                ? "border-devil/60 bg-devil/15 text-devil-bright"
                : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Curated head-to-heads as fixture cards (full) or chips (compact, post-result). */
function Suggestions({
  mode,
  suggestions,
  compact = false,
}: {
  mode: ComparePageMode;
  suggestions: CuratedDebate[];
  compact?: boolean;
}) {
  const href = (s: { a: string; b: string }) => `/compare${queryString({ mode, a: s.a, b: s.b })}`;
  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Link
            key={s.label}
            href={href(s)}
            className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
          >
            {s.label}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {suggestions.map((s) => (
        <Link
          key={s.label}
          href={href(s)}
          className="group block rounded-lg border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/70 focus-ring"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="display text-sm text-ink group-hover:text-devil-bright">{s.label}</span>
            <span className="stat-num text-devil-bright transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </span>
          <span className="mt-1.5 block text-sm leading-5 text-ink-dim">{s.hook}</span>
        </Link>
      ))}
    </div>
  );
}
