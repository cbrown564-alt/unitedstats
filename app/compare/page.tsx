import Link from "next/link";
import {
  comparePlayers, compareManagers, compareEras, ERA_CATALOGUE, type CompareMode, type Comparison,
} from "@/lib/compare";
import { managersIndex, playerById } from "@/lib/queries";
import { resolveEntity } from "@/lib/search/resolve";
import { PageHeader } from "@/components/PageHeader";
import { CompareTable } from "@/components/CompareTable";
import { queryString } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compare" };

const MODES: { key: CompareMode; label: string; blurb: string }[] = [
  { key: "players", label: "Players", blurb: "two careers, appearance for appearance" },
  { key: "managers", label: "Managers", blurb: "two reigns on win rate, points, and trophies" },
  { key: "eras", label: "Eras", blurb: "two stretches of the club's history side by side" },
];

// Suggested comparisons per mode — ids/keys that resolve exactly, so the page is
// never a dead end. Players use canonical ids; eras use ERA_CATALOGUE keys.
const SUGGESTIONS: Record<CompareMode, { label: string; a: string; b: string }[]> = {
  players: [
    { label: "Rooney vs Charlton", a: "wayne-rooney", b: "bobby-charlton" },
    { label: "Ronaldo vs Best", a: "cristiano-ronaldo", b: "george-best" },
    { label: "Giggs vs Scholes", a: "ryan-giggs", b: "paul-scholes" },
    { label: "Cantona vs Van Persie", a: "eric-cantona", b: "robin-van-persie" },
  ],
  managers: [
    { label: "Ferguson vs Busby", a: "alex-ferguson", b: "matt-busby" },
    { label: "Ferguson vs Mourinho", a: "alex-ferguson", b: "jose-mourinho" },
    { label: "Busby vs Mangnall", a: "matt-busby", b: "ernest-mangnall" },
  ],
  eras: [
    { label: "Busby era vs Ferguson era", a: "busby", b: "ferguson" },
    { label: "1990s vs 2010s", a: "1990s", b: "2010s" },
    { label: "1950s vs 2000s", a: "1950s", b: "2000s" },
  ],
};

/** Resolve a picker value to a player id: an exact id first, then a fuzzy name match. */
function resolvePlayerId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (playerById(raw)) return raw;
  return resolveEntity(raw, "player")?.entity_id;
}

const controlClass = "control w-full";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const mode: CompareMode = MODES.some((m) => m.key === sp.mode) ? (sp.mode as CompareMode) : "players";
  const rawA = sp.a;
  const rawB = sp.b;

  // Resolve the chosen pair for the active mode and build the comparison.
  let comparison: Comparison | null = null;
  let unresolved: string | null = null;
  if (mode === "players") {
    const idA = resolvePlayerId(rawA);
    const idB = resolvePlayerId(rawB);
    if (rawA && !idA) unresolved = rawA;
    else if (rawB && !idB) unresolved = rawB;
    else if (idA && idB) comparison = comparePlayers(idA, idB);
  } else if (mode === "managers") {
    if (rawA && rawB) comparison = compareManagers(rawA, rawB);
  } else if (rawA && rawB) {
    comparison = compareEras(rawA, rawB);
  }

  const managers = mode === "managers" ? [...managersIndex()].sort((a, b) => b.p - a.p) : [];
  const suggestions = SUGGESTIONS[mode];
  const suggestHref = (s: { a: string; b: string }) =>
    `/compare${queryString({ mode, a: s.a, b: s.b })}`;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Discovery" title="Compare">
        Put two careers, reigns, or eras side by side on shared metrics — each one coverage-aware, so a
        comparison never claims a fairer like-for-like than the record supports, and every figure links
        back to the matches behind it.
      </PageHeader>

      {/* Mode switch — changing mode resets the pair so the picker stays valid. */}
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

      <form className="rounded-lg border border-line bg-panel p-3 text-sm" method="get" action="/compare">
        <input type="hidden" name="mode" value={mode} />
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          {mode === "players" ? (
            <>
              <label>
                <span className={labelClass}>First player</span>
                <input type="search" name="a" defaultValue={rawA ?? ""} placeholder="Rooney" className={controlClass} />
              </label>
              <label>
                <span className={labelClass}>Second player</span>
                <input type="search" name="b" defaultValue={rawB ?? ""} placeholder="Charlton" className={controlClass} />
              </label>
            </>
          ) : mode === "managers" ? (
            <>
              <label>
                <span className={labelClass}>First manager</span>
                <select name="a" defaultValue={rawA ?? ""} className={controlClass}>
                  <option value="">Choose a manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Second manager</span>
                <select name="b" defaultValue={rawB ?? ""} className={controlClass}>
                  <option value="">Choose a manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                <span className={labelClass}>First era</span>
                <select name="a" defaultValue={rawA ?? ""} className={controlClass}>
                  <option value="">Choose an era</option>
                  {ERA_CATALOGUE.map((e) => (
                    <option key={e.key} value={e.key}>{e.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Second era</span>
                <select name="b" defaultValue={rawB ?? ""} className={controlClass}>
                  <option value="">Choose an era</option>
                  {ERA_CATALOGUE.map((e) => (
                    <option key={e.key} value={e.key}>{e.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <button className="min-h-[2.375rem] rounded-md bg-devil px-5 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
            Compare
          </button>
        </div>
      </form>

      {comparison ? (
        <CompareTable comparison={comparison} />
      ) : (
        <div className="rounded-lg border border-line bg-panel p-5">
          {unresolved ? (
            <p className="text-sm text-ink-dim">
              Couldn&apos;t find a player matching &ldquo;{unresolved}&rdquo;. Try a surname, or pick a suggestion below.
            </p>
          ) : (
            <p className="text-sm text-ink-dim">
              Pick two {mode === "eras" ? "eras" : mode} to compare — {MODES.find((m) => m.key === mode)?.blurb}.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.label}
                href={suggestHref(s)}
                className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
