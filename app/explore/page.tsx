import Link from "next/link";
import { exploreGroups, GROUP_DIMS, type ExploreSort, type GroupDim } from "@/lib/explore";
import type { MatchFilter } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { ExploreBoard } from "@/components/ExploreBoard";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct, COMPETITION_TYPE_LABELS } from "@/lib/format";
import { queryString } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore" };

const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const SORTS: { key: ExploreSort; label: string }[] = [
  { key: "matches", label: "Most matches" },
  { key: "winrate", label: "Highest win rate" },
  { key: "label", label: "By group" },
];
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint";
const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint";

// Worked-example cuts so the page is never a blank form — each a real question.
const EXAMPLES: { label: string; params: Record<string, string> }[] = [
  { label: "Win rate by decade", params: { gdim: "decade", sort: "winrate" } },
  { label: "Home league form by decade", params: { gdim: "decade", venue: "H", type: "league" } },
  { label: "Record by opponent", params: { gdim: "opponent", sort: "winrate" } },
  { label: "Europe by manager", params: { gdim: "manager", type: "european" } },
  { label: "Cup record by competition", params: { gdim: "competition", type: "cup" } },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const dim: GroupDim = GROUP_DIMS.some((d) => d.key === sp.gdim) ? (sp.gdim as GroupDim) : "decade";
  const sort = (["matches", "winrate", "label"].includes(sp.sort ?? "") ? sp.sort : undefined) as
    | ExploreSort
    | undefined;
  const year = (v: string | undefined, edge: "from" | "to") =>
    v ? (/^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v) : undefined;

  const filter: MatchFilter = {
    venue: sp.venue || undefined,
    type: sp.type || undefined,
    from: year(sp.from, "from"),
    to: year(sp.to, "to"),
  };
  const { rows, total, defaultSort } = exploreGroups(dim, filter, sort);
  const activeSort: ExploreSort = sort ?? defaultSort;
  const dimLabel = GROUP_DIMS.find((d) => d.key === dim)!.label;
  const dl = dimLabel.toLowerCase();

  const tally = rows.reduce((a, r) => ({ p: a.p + r.p, w: a.w + r.w }), { p: 0, w: 0 });

  // A spoken description of the active filters, reused in the heading and coverage.
  const filterBits: string[] = [];
  if (sp.venue) filterBits.push(sp.venue === "H" ? "at home" : sp.venue === "A" ? "away" : "on neutral grounds");
  if (sp.type) filterBits.push(`in ${(COMPETITION_TYPE_LABELS[sp.type] ?? sp.type).toLowerCase()}`);
  if (sp.from) filterBits.push(`from ${sp.from}`);
  if (sp.to) filterBits.push(`to ${sp.to}`);
  const filterDesc = filterBits.length ? ` ${filterBits.join(" ")}` : "";

  const headline = buildHeadline(rows, activeSort, dl, tally, total);

  const dimHref = (key: GroupDim) => `/explore${queryString({ ...sp, gdim: key, page: undefined })}`;
  const sortHref = (s: ExploreSort) => `/explore${queryString({ ...sp, sort: s, page: undefined })}`;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Discovery" title="Explore">
        Cut the whole 140-year record any way you like: choose what to break it down by, narrow the universe
        with the match browser&apos;s filters, and read the record per group. Every row opens exactly the
        matches it counts.
      </PageHeader>

      {/* The dimension dial — switching the breakdown is one click, no submit. */}
      <div>
        <span className={eyebrowClass}>Break it down by</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {GROUP_DIMS.map((d) => {
            const active = d.key === dim;
            return (
              <Link
                key={d.key}
                href={dimHref(d.key)}
                aria-current={active ? "true" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-ring ${
                  active
                    ? "border-devil/60 bg-devil/15 text-devil-bright"
                    : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
                }`}
              >
                {d.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Refine — secondary filters over the chosen breakdown. */}
      <form className="rounded-lg border border-line bg-panel p-3 text-sm" method="get" action="/explore">
        <input type="hidden" name="gdim" value={dim} />
        {sort && <input type="hidden" name="sort" value={sort} />}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label>
            <span className={labelClass}>Venue</span>
            <select name="venue" defaultValue={sp.venue ?? ""} className="control w-full">
              <option value="">Any venue</option>
              <option value="H">Home</option>
              <option value="A">Away</option>
              <option value="N">Neutral</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Match type</span>
            <select name="type" defaultValue={sp.type ?? ""} className="control w-full">
              <option value="">Any type</option>
              {TYPE_FILTER_KEYS.map((t) => (
                <option key={t} value={t}>{COMPETITION_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>From</span>
            <input type="text" name="from" defaultValue={sp.from ?? ""} placeholder="1886" className="control w-full" />
          </label>
          <label>
            <span className={labelClass}>To</span>
            <input type="text" name="to" defaultValue={sp.to ?? ""} placeholder="2026" className="control w-full" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.label}
                href={`/explore${queryString(ex.params)}`}
                className="rounded-full border border-line bg-panel-2 px-2.5 py-1 text-xs text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
              >
                {ex.label}
              </Link>
            ))}
          </div>
          <button className="min-h-[2.375rem] rounded-md bg-devil px-5 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring">
            Apply filters
          </button>
        </div>
      </form>

      {total === 0 ? (
        <div className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-ink-dim">
          No matches fit this filter. Loosen a control or pick another breakdown.
        </div>
      ) : (
        <>
          {/* Lead with the answer: the standout of the active cut. */}
          <div className="rounded-lg border border-line bg-panel-2/40 p-4 sm:p-5">
            <p className={eyebrowClass}>
              {headline.eyebrow}
              {filterDesc}
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`stat-num text-4xl font-semibold leading-none ${headline.tone}`}>{headline.figure}</span>
              <span className="text-base text-ink">{headline.lead}</span>
            </div>
            {headline.sub && <p className="mt-2 stat-num text-xs text-ink-faint">{headline.sub}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
            <span className={eyebrowClass}>Sort</span>
            {SORTS.map((s) => {
              const active = activeSort === s.key;
              return (
                <Link
                  key={s.key}
                  href={sortHref(s.key)}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-md px-2 py-1 transition-colors focus-ring ${
                    active ? "bg-devil/15 font-semibold text-devil-bright" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          <ExploreBoard rows={rows} dimLabel={dimLabel} />

          {rows.length < total && (
            <p className="text-xs text-ink-faint">
              Showing the top {fmtNum(rows.length)} of {fmtNum(total)} groups for this sort — narrow the filter to surface the rest.
            </p>
          )}

          <CoverageNote
            slice={`every official and unofficial match, grouped by ${dl}; win rate is wins over matches played in each group.`}
            coverage="Records are complete for every match; goal, scorer, and lineup facets vary by era — see the data ledger."
            evidenceHref="/data"
            evidenceLabel="Coverage ledger →"
          />
        </>
      )}

      {/* A nod to its sibling tools so the discovery cluster reads as one. */}
      <p className="text-sm text-ink-dim">
        Looking for a single slice instead? Use the{" "}
        <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link>. Putting two things
        head to head? Try{" "}
        <Link href="/compare" className="text-devil-bright hover:underline">Compare</Link>.
      </p>
    </div>
  );
}

interface Headline {
  eyebrow: string;
  figure: string;
  tone: string;
  lead: React.ReactNode;
  sub?: string;
}

/**
 * The spoken answer to the active cut, shaped by the sort: the strongest group by
 * win rate (with a sample floor so a one-game 100% never headlines), the biggest
 * by volume, or — sorting by group — the overall record across the cut.
 */
function buildHeadline(
  rows: { label: string; p: number; w: number; d: number; l: number }[],
  sort: ExploreSort,
  dl: string,
  tally: { p: number; w: number },
  total: number,
): Headline {
  const record = (r: { w: number; d: number; l: number }) => `${r.w}–${r.d}–${r.l}`;

  if (sort === "winrate") {
    const floor = Math.max(10, Math.round(tally.p * 0.01));
    const best = rows.find((r) => r.p >= floor) ?? rows[0];
    return {
      eyebrow: `Strongest ${dl}`,
      figure: pct(best.w, best.p),
      tone: "text-win",
      lead: (
        <>
          won by <span className="font-semibold">{best.label}</span>
        </>
      ),
      sub: `${fmtNum(best.p)} matches · ${record(best)}${best === rows[0] ? "" : ` · best with ${fmtNum(floor)}+ played`}`,
    };
  }

  if (sort === "matches") {
    const top = rows[0];
    return {
      eyebrow: `Most-played ${dl}`,
      figure: fmtNum(top.p),
      tone: "text-ink",
      lead: (
        <>
          matches — <span className="font-semibold">{top.label}</span>, {pct(top.w, top.p)} won
        </>
      ),
      sub: record(top),
    };
  }

  return {
    eyebrow: `By ${dl}`,
    figure: fmtNum(total),
    tone: "text-ink",
    lead: <>{total === 1 ? "group" : "groups"} across the cut</>,
    sub: `${fmtNum(tally.p)} matches · ${pct(tally.w, tally.p)} won overall`,
  };
}
