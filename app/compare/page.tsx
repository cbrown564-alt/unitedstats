import Link from "next/link";
import {
  comparePlayers, compareManagers, compareEras, ERA_CATALOGUE, type CompareMode, type Comparison,
} from "@/lib/compare";
import { managersIndex, playerById, playersIndex } from "@/lib/queries";
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

// Curated head-to-heads per mode — the empty state leads with these rather than a
// blank form, so the page opens as an invitation to pick a fixture. Ids/keys
// resolve exactly (players by canonical id, eras by ERA_CATALOGUE key), so a
// suggestion is never a dead end. Each carries a one-line hook.
const SUGGESTIONS: Record<CompareMode, { label: string; a: string; b: string; hook: string }[]> = {
  players: [
    { label: "Rooney vs Charlton", a: "wayne-rooney", b: "bobby-charlton", hook: "The two men at the top of the all-time scoring charts." },
    { label: "Ronaldo vs Best", a: "cristiano-ronaldo", b: "george-best", hook: "Two No. 7s, two icons — a generation apart." },
    { label: "Giggs vs Scholes", a: "ryan-giggs", b: "paul-scholes", hook: "The academy spine that ran through every Ferguson side." },
    { label: "Cantona vs Van Persie", a: "eric-cantona", b: "robin-van-persie", hook: "Two imports who arrived and tilted a title race." },
  ],
  managers: [
    { label: "Ferguson vs Busby", a: "alex-ferguson", b: "matt-busby", hook: "The two architects, a quarter-century each in charge." },
    { label: "Ferguson vs Mourinho", a: "alex-ferguson", b: "jose-mourinho", hook: "A 27-year reign against a stormy three." },
    { label: "Busby vs Mangnall", a: "matt-busby", b: "ernest-mangnall", hook: "The club's first two dynasty-builders." },
  ],
  eras: [
    { label: "Busby era vs Ferguson era", a: "busby", b: "ferguson", hook: "The two golden ages, side by side." },
    { label: "1990s vs 2010s", a: "1990s", b: "2010s", hook: "The title machine against the post-Ferguson rebuild." },
    { label: "1950s vs 2000s", a: "1950s", b: "2000s", hook: "The Busby Babes against the Ronaldo-era champions." },
  ],
};

const PLAYER_LIST_ID = "compare-player-names";

/** Resolve a picker value to a player id: an exact id first, then a fuzzy name match. */
function resolvePlayerId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (playerById(raw)) return raw;
  return resolveEntity(raw, "player")?.entity_id;
}

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint";
const sectionHead = "text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright";

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
  // Native autocomplete for the player pickers: the notable record set by
  // appearances, so typing a surname suggests the canonical name the resolver
  // expects. Capped to keep the markup lean; anyone outside it still resolves
  // by free text.
  const playerNames =
    mode === "players"
      ? [...playersIndex()]
          .filter((p) => p.player_id !== "own-goal")
          .sort((a, b) => b.apps - a.apps)
          .slice(0, 300)
          .map((p) => p.name)
      : [];
  const suggestions = SUGGESTIONS[mode];

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Discovery" title="Compare">
        Put two careers, reigns, or eras side by side on shared metrics — each one coverage-aware, so a
        comparison never claims a fairer like-for-like than the record supports, and every figure links
        back to the matches behind it.
      </PageHeader>

      <ModePills mode={mode} />

      {comparison ? (
        <>
          <CompareTable comparison={comparison} />
          <section className="rounded-lg border border-line bg-panel/60 p-4">
            <h2 className={sectionHead}>Compare another</h2>
            <div className="mt-3">
              <Picker mode={mode} rawA={rawA} rawB={rawB} managers={managers} playerNames={playerNames} />
            </div>
            <Suggestions mode={mode} suggestions={suggestions} compact />
          </section>
        </>
      ) : (
        <div className="space-y-7">
          <section>
            <h2 className={sectionHead}>Great debates</h2>
            <p className="mt-1 mb-3 text-sm text-ink-dim">
              Open one of these, or build your own below — {MODES.find((m) => m.key === mode)?.blurb}.
            </p>
            <Suggestions mode={mode} suggestions={suggestions} />
          </section>

          <section>
            <h2 className={sectionHead}>Or build your own</h2>
            {unresolved && (
              <p className="mt-2 text-sm text-ink-dim">
                Couldn&apos;t find a player matching &ldquo;{unresolved}&rdquo;. Try a surname, or pick a debate above.
              </p>
            )}
            <div className="mt-3">
              <Picker mode={mode} rawA={rawA} rawB={rawB} managers={managers} playerNames={playerNames} />
            </div>
          </section>
        </div>
      )}
    </div>
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
  suggestions: (typeof SUGGESTIONS)[CompareMode];
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

/** The build-your-own picker — a server-rendered GET form, secondary to the debates. */
function Picker({
  mode,
  rawA,
  rawB,
  managers,
  playerNames,
}: {
  mode: CompareMode;
  rawA: string | undefined;
  rawB: string | undefined;
  managers: { id: string; name: string }[];
  playerNames: string[];
}) {
  const control = "control w-full";
  return (
    <form className="rounded-lg border border-line bg-panel p-3 text-sm" method="get" action="/compare">
      <input type="hidden" name="mode" value={mode} />
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        {mode === "players" ? (
          <>
            <label>
              <span className={labelClass}>First player</span>
              <input type="search" name="a" defaultValue={rawA ?? ""} placeholder="Rooney" list={PLAYER_LIST_ID} className={control} />
            </label>
            <label>
              <span className={labelClass}>Second player</span>
              <input type="search" name="b" defaultValue={rawB ?? ""} placeholder="Charlton" list={PLAYER_LIST_ID} className={control} />
            </label>
            <datalist id={PLAYER_LIST_ID}>
              {playerNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </>
        ) : mode === "managers" ? (
          <>
            <label>
              <span className={labelClass}>First manager</span>
              <select name="a" defaultValue={rawA ?? ""} className={control}>
                <option value="">Choose a manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Second manager</span>
              <select name="b" defaultValue={rawB ?? ""} className={control}>
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
              <EraSelect name="a" value={rawA} />
            </label>
            <label>
              <span className={labelClass}>Second era</span>
              <EraSelect name="b" value={rawB} />
            </label>
          </>
        )}
        <button className="min-h-[2.375rem] rounded-md bg-devil px-5 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
          Compare
        </button>
      </div>
    </form>
  );
}

/** Era picker, grouped into named eras and decades so the long list scans. */
function EraSelect({ name, value }: { name: string; value: string | undefined }) {
  const named = ERA_CATALOGUE.filter((e) => !/^\d{4}s$/.test(e.key));
  const decades = ERA_CATALOGUE.filter((e) => /^\d{4}s$/.test(e.key));
  return (
    <select name={name} defaultValue={value ?? ""} className="control w-full">
      <option value="">Choose an era</option>
      <optgroup label="Eras">
        {named.map((e) => (
          <option key={e.key} value={e.key}>{e.label}</option>
        ))}
      </optgroup>
      <optgroup label="Decades">
        {decades.map((e) => (
          <option key={e.key} value={e.key}>{e.label}</option>
        ))}
      </optgroup>
    </select>
  );
}
