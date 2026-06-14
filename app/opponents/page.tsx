import Link from "next/link";
import { opponentsIndex } from "@/lib/queries";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
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
        {opponents.map((o) => (
          <li key={o.id} className="border-b border-line last:border-b-0">
            <Link
              href={`/opponent/${o.id}`}
              className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1.5 px-4 py-3 transition-colors hover:bg-panel sm:grid-cols-[16rem_1fr_auto]"
            >
              <span>
                <span className="font-medium">{o.name}</span>
                <span className="block text-xs text-ink-dim stat-num">
                  {o.first.slice(0, 4)}-{o.last.slice(0, 4)}
                </span>
              </span>
              <WdlBar w={o.w} d={o.d} l={o.l} tooltip={false} className="hidden sm:block" />
              <span className="stat-num text-right text-xs text-ink-dim whitespace-nowrap">
                {fmtNum(o.p)} P · {pct(o.w, o.p)} W
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
