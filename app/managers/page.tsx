import { managersIndex } from "@/lib/queries";
import { groupManagersByEra } from "@/lib/managerEras";
import { WdlBar, WdlColumns } from "@/components/WdlBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { IndexRow } from "@/components/IndexRow";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Managers" };

export default function ManagersPage() {
  const managers = managersIndex().filter((m) => m.p > 0);
  const eras = groupManagersByEra(managers);
  const longest = [...managers].sort((a, b) => b.p - a.p)[0];
  const total = managers.reduce((a, m) => ({ p: a.p + m.p, w: a.w + m.w }), { p: 0, w: 0 });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="People"
        title="Managers"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-80">
            <StatTile label="Managers" value={fmtNum(managers.length)} tone="red" />
            <StatTile
              label="Most matches"
              value={longest ? fmtNum(longest.p) : "0"}
              detail={longest?.name.split(" ").pop()}
              tone="gold"
            />
            <StatTile label="Win rate" value={pct(total.w, total.p)} tone="green" />
            <StatTile label="Since" value="1892" />
          </div>
        }
      >
        Every man to pick the team since 1892: secretaries, caretakers, and knights of the realm,
        grouped into the eras the club&apos;s history actually turns on.
      </PageHeader>

      <div className="space-y-8">
        {eras.map((g) => (
          <section key={g.era.key} className="space-y-2">
            <div className="flex items-end gap-3 border-b border-line/60 pb-1.5">
              <h2 className="display text-lg leading-none">{g.era.label}</h2>
              <span className="stat-num text-xs leading-none text-ink-faint">
                {g.from?.slice(0, 4)}–{g.to?.slice(0, 4)} · {g.managers.length}{" "}
                {g.managers.length === 1 ? "manager" : "managers"}
              </span>
              <div className="ml-auto w-32 space-y-1">
                <WdlColumns w={g.w} d={g.d} l={g.l} compact />
                <WdlBar w={g.w} d={g.d} l={g.l} size="xs" tooltip={false} />
              </div>
            </div>
            <ul className="overflow-hidden rounded-lg border border-line bg-pitch/35">
              {g.managers.map((m) => (
                <li key={m.id} className="border-b border-line last:border-b-0">
                  <IndexRow
                    href={`/manager/${m.id}`}
                    leading={<PlayerPortrait name={m.name} src={m.thumb_url ?? m.image_url} size="sm" />}
                    name={m.name}
                    sub={`${m.first?.slice(0, 4)}–${m.last?.slice(0, 4)} · ${m.role}`}
                    w={m.w}
                    d={m.d}
                    l={m.l}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <CoverageNote slice="every match under each man, league and cup, since 1892">
        Eras are bounded by the two longest tenures — Sir Matt Busby (1,141 matches) and Sir Alex
        Ferguson (1,497), the only managers past a thousand games — and each man is placed by the year
        of his first match in charge. Within an era, managers run in that order; the bar pivots on its
        centre, wins right, losses left.
      </CoverageNote>
    </div>
  );
}
