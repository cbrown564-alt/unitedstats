import Link from "next/link";
import {
  comparePlayers, compareManagers, compareEras, ERA_CATALOGUE, CURATED_DEBATES,
  type CompareMode, type Comparison, type CuratedDebate,
} from "@/lib/compare";
import { managerById, managersIndex, playerById, playersIndex, type ManagerRecord } from "@/lib/queries";
import { resolveEntity } from "@/lib/search/resolve";
import { PageHeader } from "@/components/PageHeader";
import { CompareTable } from "@/components/CompareTable";
import { cutHref } from "@/lib/cut";
import { queryString } from "@/lib/url";

import { PAGE_REVALIDATE_SECONDS } from "@/lib/pageRevalidate";

export const revalidate = PAGE_REVALIDATE_SECONDS;
export const metadata = {
  title: "Compare",
  description:
    "Compare two Manchester United careers, managerial tenures, or historical eras side by side on shared, coverage-aware metrics.",
  alternates: { canonical: "/compare" },
};

const MODES: { key: CompareMode; label: string; blurb: string }[] = [
  { key: "players", label: "Players", blurb: "two careers, appearance for appearance" },
  { key: "managers", label: "Managers", blurb: "two reigns on win rate, points, and trophies" },
  { key: "eras", label: "Eras", blurb: "two stretches of the club’s history side by side" },
];

// Curated head-to-heads live in lib/compare.ts (CURATED_DEBATES) so /compare and
// the /explore discovery home draw from one list and never drift.

// Every picker is the same text input + <datalist> autocomplete, so the three
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
function resolveEraKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const lc = raw.toLowerCase();
  return (
    ERA_CATALOGUE.find((e) => e.key === raw) ??
    ERA_CATALOGUE.find((e) => e.label.toLowerCase() === lc) ??
    ERA_CATALOGUE.find((e) => e.label.toLowerCase().includes(lc))
  )?.key;
}

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint";
const sectionHead = "text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright";

interface PickerConfig {
  listId: string;
  options: string[];
  noun: string;
  placeholders: [string, string];
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const mode: CompareMode = MODES.some((m) => m.key === sp.mode) ? (sp.mode as CompareMode) : "players";
  const rawA = sp.a;
  const rawB = sp.b;

  const managers = mode === "managers" ? [...managersIndex()].sort((a, b) => b.p - a.p) : [];

  // Resolve the chosen pair for the active mode and build the comparison.
  let comparison: Comparison | null = null;
  let unresolved: string | null = null;
  let displayA = "";
  let displayB = "";
  let cfg: PickerConfig;

  if (mode === "players") {
    const idA = resolvePlayerId(rawA);
    const idB = resolvePlayerId(rawB);
    if (rawA && !idA) unresolved = rawA;
    else if (rawB && !idB) unresolved = rawB;
    else if (idA && idB) comparison = comparePlayers(idA, idB);
    displayA = rawA ? playerById(rawA)?.name ?? rawA : "";
    displayB = rawB ? playerById(rawB)?.name ?? rawB : "";
    // Notable record set by appearances — keeps the markup lean; anyone outside it
    // still resolves by free text.
    const names = [...playersIndex()]
      .filter((p) => p.player_id !== "own-goal")
      .sort((a, b) => b.apps - a.apps)
      .slice(0, 300)
      .map((p) => p.name);
    cfg = { listId: "compare-players", options: names, noun: "player", placeholders: ["Rooney", "Charlton"] };
  } else if (mode === "managers") {
    const idA = resolveManagerId(rawA, managers);
    const idB = resolveManagerId(rawB, managers);
    if (rawA && !idA) unresolved = rawA;
    else if (rawB && !idB) unresolved = rawB;
    else if (idA && idB) comparison = compareManagers(idA, idB);
    displayA = rawA ? managers.find((m) => m.id === rawA)?.name ?? rawA : "";
    displayB = rawB ? managers.find((m) => m.id === rawB)?.name ?? rawB : "";
    cfg = { listId: "compare-managers", options: managers.map((m) => m.name), noun: "manager", placeholders: ["Ferguson", "Busby"] };
  } else {
    const keyA = resolveEraKey(rawA);
    const keyB = resolveEraKey(rawB);
    if (rawA && !keyA) unresolved = rawA;
    else if (rawB && !keyB) unresolved = rawB;
    else if (keyA && keyB) comparison = compareEras(keyA, keyB);
    displayA = rawA ? ERA_CATALOGUE.find((e) => e.key === rawA)?.label ?? rawA : "";
    displayB = rawB ? ERA_CATALOGUE.find((e) => e.key === rawB)?.label ?? rawB : "";
    cfg = { listId: "compare-eras", options: ERA_CATALOGUE.map((e) => e.label), noun: "era", placeholders: ["Ferguson era", "1990s"] };
  }

  const suggestions = CURATED_DEBATES[mode];
  const picker = <Picker mode={mode} displayA={displayA} displayB={displayB} cfg={cfg} />;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Discovery" title="Compare">
        Compare two careers, reigns, or eras side by side on shared, coverage-aware metrics. Every
        comparison highlights the bounds of the historical data, ensuring you never assume a fairer like-for-like than the record supports, and every figure links directly to the matches behind it.
      </PageHeader>

      <ModePills mode={mode} />

      {comparison ? (
        <>
          <CompareTable comparison={comparison} />
          <CutLinks comparison={comparison} />
          <section>
            <h2 className={sectionHead}>Compare another</h2>
            <div className="mt-3">{picker}</div>
            <Suggestions mode={mode} suggestions={suggestions} compact />
          </section>
        </>
      ) : (
        <div className="space-y-7">
          <section>
            <h2 className={sectionHead}>Curated debates</h2>
            <p className="mt-1 mb-3 text-sm text-ink-dim">
              Open a curated head-to-head comparison, or build a custom matchup below — {MODES.find((m) => m.key === mode)?.blurb}.
            </p>
            <Suggestions mode={mode} suggestions={suggestions} />
          </section>

          <section>
            <h2 className={sectionHead}>Build a custom matchup</h2>
            {unresolved && (
              <p className="mt-2 text-sm text-ink-dim">
                Couldn’t find a {cfg.noun} matching &ldquo;{unresolved}&rdquo;. Try another name, or pick a curated debate above.
              </p>
            )}
            <div className="mt-3">{picker}</div>
          </section>
        </div>
      )}
    </div>
  );
}

/**
 * Downstream of the comparison answer: a fork into the Cut engine, where the
 * comparison maps to a real grouped match-filter. Eras map to a date-range cut and
 * managers to a manager-filtered one (both grouped season by season); players have
 * no single grouped cut, so the section is absent for them. This is "a comparison
 * is a Cut" made tangible — the reader leaves the answer and twists it themselves.
 */
function sideCut(mode: CompareMode, side: { id: string; label: string }): { label: string; href: string } | null {
  if (mode === "managers") {
    return { label: side.label, href: cutHref({ dimension: "season", metric: "ppg", filters: { manager: side.id } }) };
  }
  if (mode === "eras") {
    const era = ERA_CATALOGUE.find((e) => e.key === side.id);
    if (!era) return null;
    return {
      label: side.label,
      href: cutHref({ dimension: "season", metric: "ppg", filters: { from: String(era.from), to: String(era.to - 1) } }),
    };
  }
  return null;
}

function CutLinks({ comparison }: { comparison: Comparison }) {
  const links = [sideCut(comparison.mode, comparison.a), sideCut(comparison.mode, comparison.b)].filter(
    (l): l is { label: string; href: string } => l !== null,
  );
  if (links.length === 0) return null;
  return (
    <section>
      <h2 className={sectionHead}>Explore as a cut</h2>
      <p className="mt-1 mb-3 text-sm text-ink-dim">
        Group either record season by season, then change the dimension or lens to build a custom cut.
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:bg-panel-2 hover:text-ink focus-ring"
          >
            {l.label}, season by season →
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Mode switch — changing mode resets the pair so the picker stays valid. */
function ModePills({ mode }: { mode: CompareMode }) {
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
  mode: CompareMode;
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

/**
 * The build-your-own picker — two text inputs with native `<datalist>`
 * autocomplete, identical across all three modes. The submitted value can be a
 * friendly name or a canonical id; the page resolves either.
 */
function Picker({
  mode,
  displayA,
  displayB,
  cfg,
}: {
  mode: CompareMode;
  displayA: string;
  displayB: string;
  cfg: PickerConfig;
}) {
  return (
    <form className="rounded-lg border border-line bg-panel p-3 text-sm" method="get" action="/compare">
      <input type="hidden" name="mode" value={mode} />
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label>
          <span className={labelClass}>First {cfg.noun}</span>
          <input type="search" name="a" defaultValue={displayA} placeholder={cfg.placeholders[0]} list={cfg.listId} className="control w-full" />
        </label>
        <label>
          <span className={labelClass}>Second {cfg.noun}</span>
          <input type="search" name="b" defaultValue={displayB} placeholder={cfg.placeholders[1]} list={cfg.listId} className="control w-full" />
        </label>
        <datalist id={cfg.listId}>
          {cfg.options.map((o, i) => (
            <option key={`${o}-${i}`} value={o} />
          ))}
        </datalist>
        <button className="min-h-[2.375rem] rounded-md bg-devil px-5 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
          Compare
        </button>
      </div>
    </form>
  );
}
