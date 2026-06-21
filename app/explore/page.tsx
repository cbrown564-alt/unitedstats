import Link from "next/link";
import { exploreGroups, GROUP_DIMS, type ExploreSort, type GroupDim } from "@/lib/explore";
import type { MatchFilter } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
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

// Worked-example cuts so the page is never a blank form — each a real question.
const EXAMPLES: { label: string; params: Record<string, string> }[] = [
  { label: "Win rate by decade", params: { gdim: "decade" } },
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

  const tally = rows.reduce(
    (a, r) => ({ p: a.p + r.p, w: a.w + r.w }),
    { p: 0, w: 0 },
  );

  // A spoken description of the active cut for the summary line.
  const filterBits: string[] = [];
  if (sp.venue) filterBits.push(sp.venue === "H" ? "at home" : sp.venue === "A" ? "away" : "on neutral grounds");
  if (sp.type) filterBits.push(`in ${(COMPETITION_TYPE_LABELS[sp.type] ?? sp.type).toLowerCase()}`);
  if (sp.from) filterBits.push(`from ${sp.from}`);
  if (sp.to) filterBits.push(`to ${sp.to}`);
  const filterDesc = filterBits.length ? ` ${filterBits.join(" ")}` : "";

  const sortHref = (s: ExploreSort) => `/explore${queryString({ ...sp, sort: s, page: undefined })}`;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Discovery" title="Explore">
        Build your own cut of the record: pick a dimension to break it down by, narrow the universe with the
        same filters the match browser uses, and read the aggregate per group. Every row links back to exactly
        the matches it counts.
      </PageHeader>

      <form className="rounded-lg border border-line bg-panel p-3 text-sm" method="get" action="/explore">
        <div className="grid gap-3 md:grid-cols-12">
          <label className="md:col-span-3">
            <span className={labelClass}>Break down by</span>
            <select name="gdim" defaultValue={dim} className="control w-full">
              {GROUP_DIMS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Venue</span>
            <select name="venue" defaultValue={sp.venue ?? ""} className="control w-full">
              <option value="">Any venue</option>
              <option value="H">Home</option>
              <option value="A">Away</option>
              <option value="N">Neutral</option>
            </select>
          </label>
          <label className="md:col-span-3">
            <span className={labelClass}>Match type</span>
            <select name="type" defaultValue={sp.type ?? ""} className="control w-full">
              <option value="">Any type</option>
              {TYPE_FILTER_KEYS.map((t) => (
                <option key={t} value={t}>{COMPETITION_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>From</span>
            <input type="text" name="from" defaultValue={sp.from ?? ""} placeholder="1886" className="control w-full" />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>To</span>
            <input type="text" name="to" defaultValue={sp.to ?? ""} placeholder="2026" className="control w-full" />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
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
            Explore
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm text-ink-dim">
            United&apos;s record{filterDesc}, by {dimLabel.toLowerCase()} —{" "}
            <span className="text-ink">{fmtNum(total)} {total === 1 ? "group" : "groups"}</span>,{" "}
            <span className="stat-num">{fmtNum(tally.p)}</span> matches, {pct(tally.w, tally.p)} won overall.
          </h2>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Sort</span>
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

        <div className="mt-3">
          <DataTable
            caption={`United record by ${dimLabel.toLowerCase()}`}
            rows={rows}
            rowKey={(r) => r.key}
            density="compact"
            emptyState="No matches fit this filter. Loosen a control or pick another breakdown."
            columns={[
              {
                label: dimLabel,
                key: "group",
                render: (r) => (
                  <Link href={r.href} className="font-medium hover:text-devil-bright">{r.label}</Link>
                ),
              },
              { label: "Played", key: "p", numeric: true, render: (r) => fmtNum(r.p) },
              {
                label: "W·D·L", key: "wdl", numeric: true,
                render: (r) => <WdlRecord w={r.w} d={r.d} l={r.l} />,
              },
              {
                label: "Form", key: "form", hideBelow: "hidden md:table-cell",
                render: (r) => (
                  <div className="w-32"><WdlBar w={r.w} d={r.d} l={r.l} size="sm" /></div>
                ),
              },
              {
                label: "Win %", key: "win", numeric: true,
                render: (r) => <span className="text-ink">{pct(r.w, r.p)}</span>,
              },
              {
                label: "GD", key: "gd", numeric: true, hideBelow: "hidden sm:table-cell",
                render: (r) => {
                  const gd = r.gf - r.ga;
                  return (
                    <span className={gd > 0 ? "text-win" : gd < 0 ? "text-loss" : "text-ink-dim"}>
                      {gd > 0 ? `+${fmtNum(gd)}` : fmtNum(gd)}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>

        {rows.length < total && (
          <p className="mt-2 text-xs text-ink-faint">
            Showing the top {fmtNum(rows.length)} of {fmtNum(total)} groups for this sort — narrow the filter to surface the rest.
          </p>
        )}

        <CoverageNote
          className="mt-3"
          slice={`every official and unofficial match, grouped by ${dimLabel.toLowerCase()}; win rate is wins over matches played in each group.`}
          coverage="Records are complete for every match; goal, scorer, and lineup facets vary by era — see the data ledger."
          evidenceHref="/data"
          evidenceLabel="Coverage ledger →"
        />
      </section>

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
