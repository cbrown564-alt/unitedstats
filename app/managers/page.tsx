import { managersIndex } from "@/lib/queries";
import { groupManagersByEra } from "@/lib/managerEras";
import { WdlBar, WdlColumns } from "@/components/WdlBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ManagerTimeline } from "@/components/charts/ManagerTimeline";
import { IndexRow } from "@/components/IndexRow";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Managers" };

export default function ManagersPage() {
  const managers = managersIndex().filter((m) => m.p > 0);
  const eras = groupManagersByEra(managers);
  const totalP = managers.reduce((a, m) => a + m.p, 0);
  const totalW = managers.reduce((a, m) => a + m.w, 0);
  const giants = [...managers].sort((a, b) => b.p - a.p).slice(0, 2);
  const giantShare = pct(giants.reduce((a, m) => a + m.p, 0), totalP);
  const giantNames = [...giants]
    .sort((a, b) => (a.first ?? "").localeCompare(b.first ?? ""))
    .map((g) => g.name.replace(/^Sir /, "").split(" ").pop())
    .join(" and ");

  return (
    <div className="space-y-10">
      {/* The succession as one object: every manager a match-proportional segment,
          the two giants dwarfing the scaffolding between and after them. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
            People · the succession
          </p>
          <h1 className="display max-w-3xl text-4xl leading-[0.95] sm:text-5xl">
            {fmtNum(managers.length)} managers, two cathedrals
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-dim sm:text-base">
            Everyone to pick the team since 1892 — secretaries, caretakers, and knights of the realm.
            {giantNames} alone took charge of <span className="font-semibold text-ink">{giantShare}</span> of
            every match the club has played; the rest is the scaffolding between and after the two long reigns.
          </p>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Matches</dt>
              <dd className="stat-num text-lg font-semibold text-ink">{fmtNum(totalP)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Overall win rate</dt>
              <dd className="stat-num text-lg font-semibold text-win">{pct(totalW, totalP)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Longest reign</dt>
              <dd className="stat-num text-lg font-semibold text-gold">
                {fmtNum(giants[0]?.p ?? 0)}{" "}
                <span className="text-sm font-normal text-ink-dim">{giants[0]?.name.split(" ").pop()}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            <ManagerTimeline managers={managers} />
          </div>
        </div>
      </section>

      {/* The detail layer: read each man, grouped into the eras the hero shades. */}
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
