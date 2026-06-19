import { opponentsIndex } from "@/lib/queries";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { ClubBadge } from "@/components/ClubBadge";
import { IndexRow } from "@/components/IndexRow";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opponents" };

export default async function OpponentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const allOpponents = opponentsIndex();
  const opponents = q ? allOpponents.filter((o) => o.name.toLowerCase().includes(q)) : allOpponents;
  const mostPlayed = allOpponents[0];
  const bestRecord = [...allOpponents]
    .filter((o) => o.p >= 10)
    .sort((a, b) => b.w / b.p - a.w / a.p)[0];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Head to head"
        title="Opponents"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-80">
            <StatTile label={q ? "Shown" : "Faced"} value={fmtNum(opponents.length)} tone="red" />
            <StatTile label="Most played" value={mostPlayed ? fmtNum(mostPlayed.p) : "0"} />
            <StatTile label="Best W%" value={bestRecord ? pct(bestRecord.w, bestRecord.p) : "0%"} tone="green" />
            <StatTile label="Since" value="1886" />
          </div>
        }
      >
        Browse rivals, regular league opponents, cup one-offs, and historical oddities. Each row opens the
        meetings behind the record.
      </PageHeader>

      <form action="/opponents" className="rounded-lg border border-line bg-panel p-3">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Find an opponent</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Liverpool, Leeds, Bayern"
            className="control w-full"
          />
        </label>
      </form>

      <ul className="overflow-hidden rounded-lg border border-line bg-pitch/35">
        {opponents.map((o, i) => (
          <li key={o.id} className="border-b border-line last:border-b-0">
            <IndexRow
              href={`/opponent/${o.id}`}
              rank={q ? undefined : i + 1}
              leading={<ClubBadge id={o.id} name={o.name} size="md" />}
              name={o.name}
              sub={`${o.first.slice(0, 4)}–${o.last.slice(0, 4)}`}
              w={o.w}
              d={o.d}
              l={o.l}
            />
          </li>
        ))}
      </ul>

      <CoverageNote slice="every recorded meeting, league and cup, since 1886">
        Ranked by matches played, so the great rivalries sit at the top. The bar pivots on its centre,
        wins right, losses left; each row opens the meetings behind the record.
      </CoverageNote>
    </div>
  );
}
