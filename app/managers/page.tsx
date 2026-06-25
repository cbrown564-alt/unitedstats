import { familyName } from "@/lib/names";
import { managersIndex, managerCareerSparks, managerHonours } from "@/lib/queries";
import { groupManagersByEra } from "@/lib/managerEras";
import { WdlBar } from "@/components/WdlBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ManagerTimeline } from "@/components/charts/ManagerTimeline";
import { ManagerSparkbar, type ManagerSparkSeason } from "@/components/charts/ManagerSparkbar";
import { IndexRow } from "@/components/IndexRow";
import { TrophyIcon } from "@/components/CampaignIcons";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct } from "@/lib/format";

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
    .map((g) => familyName(g.name))
    .join(" and ");

  // Each row's tenure drawn as a season-by-season W/D/L sparkbar on a timeline
  // *shared* by every row — so the column builds into the succession as you scan
  // down, each man's block landing at his real years. Scale (axis span + tallest
  // season) is global, computed once here and handed to every row.
  const sparks = managerCareerSparks();
  const byManager = new Map<string, ManagerSparkSeason[]>();
  for (const s of sparks) {
    const arr = byManager.get(s.manager_id);
    if (arr) arr.push(s);
    else byManager.set(s.manager_id, [s]);
  }
  const sparkYears = sparks.map((s) => Number(s.season.slice(0, 4)));
  const axisStart = sparkYears.length ? Math.min(...sparkYears) : 1892;
  const axisEnd = (sparkYears.length ? Math.max(...sparkYears) : 2026) + 1;
  const maxSeason = sparks.reduce((mx, s) => Math.max(mx, s.w + s.d + s.l), 1);

  // Trophies, attributed to the manager of the decisive match — gold pips on the
  // winning seasons of each sparkbar and an honours count beside the name, so the
  // decorated reigns glow gold and the verdict that win-rate hides reads at a glance.
  const honours = managerHonours();
  const trophySeasonsBy = new Map<string, Set<string>>();
  const trophyCount = new Map<string, number>();
  for (const h of honours) {
    (trophySeasonsBy.get(h.manager_id) ?? trophySeasonsBy.set(h.manager_id, new Set()).get(h.manager_id)!).add(
      h.season,
    );
    trophyCount.set(h.manager_id, (trophyCount.get(h.manager_id) ?? 0) + h.n);
  }

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
              {/* Red, not gold: win rate now wears the win-yellow, so the second hero
                  figure takes the identity red — matching the record-holder figures on
                  the other index heroes (most played, most appearances). */}
              <dd className="stat-num text-lg font-semibold text-devil-bright">
                {fmtNum(giants[0]?.p ?? 0)}{" "}
                <span className="text-sm font-normal text-ink-dim">{familyName(giants[0]?.name ?? "")}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            <ManagerTimeline managers={managers} />
          </div>
        </div>
      </section>

      {/* The detail layer: read each man, grouped into the eras the hero shades.
          The two cathedrals (Busby, Ferguson) get a floodlit gold verdict plate;
          the scaffolding eras between and around them stay quiet and compressed,
          so the body's pacing rises and falls with the hero's story. */}
      <div>
        {eras.map((g, i) => {
          const isCathedral = (k: string) => k === "busby" || k === "ferguson";
          const cathedral = isCathedral(g.era.key);
          // Breathe wider around a monument (on either side); tighter elsewhere.
          const prevCathedral = i > 0 && isCathedral(eras[i - 1].era.key);
          const gap = i === 0 ? "" : cathedral || prevCathedral ? "mt-14" : "mt-10";
          const span = `${g.from?.slice(0, 4)}–${g.to?.slice(0, 4)}`;
          const count = `${g.managers.length} ${g.managers.length === 1 ? "manager" : "managers"}`;
          return (
            <section key={g.era.key} className={`${gap} ${cathedral ? "space-y-3" : "space-y-2"}`}>
              {cathedral ? (
                <div className="relative overflow-hidden rounded-xl border border-gold/25 bg-panel shadow-[0_16px_32px_rgb(0_0_0_/0.2)]">
                  <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
                  <div
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-1/2 rounded-full opacity-[0.10] blur-3xl"
                    style={{ backgroundColor: "var(--color-gold)" }}
                    aria-hidden
                  />
                  <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 p-4 sm:p-5">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/80">
                        The dominant reign
                      </p>
                      <h2 className="display text-2xl leading-none sm:text-3xl">{g.era.label}</h2>
                      <p className="stat-num mt-2 text-xs text-ink-faint">
                        {span} · {count} · {fmtNum(g.p)} matches
                      </p>
                    </div>
                    <div className="flex items-end gap-5">
                      <div className="text-right">
                        <div className="stat-num text-3xl font-semibold leading-none text-win sm:text-4xl">
                          {pct(g.w, g.p)}
                        </div>
                        <div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">win rate</div>
                      </div>
                      <div className="w-44 pb-1">
                        <WdlBar w={g.w} d={g.d} l={g.l} size="md" showLabels tooltip={false} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1 border-b border-line/40 pb-1.5">
                  <h2 className="display text-base leading-none text-ink-dim">{g.era.label}</h2>
                  <span className="stat-num text-[11px] leading-none text-ink-faint">
                    {span} · {count}
                  </span>
                  <div className="ml-auto flex items-end gap-3">
                    <span className="stat-num text-xs leading-none text-ink-dim">{pct(g.w, g.p)} W</span>
                    <div className="w-36">
                      <WdlBar w={g.w} d={g.d} l={g.l} size="md" showLabels tooltip={false} />
                    </div>
                  </div>
                </div>
              )}
              <ul
                className={`overflow-hidden rounded-lg border bg-pitch/35 ${
                  cathedral ? "border-gold/20" : "border-line"
                }`}
              >
                {g.managers.map((m) => (
                  <li key={m.id} className="border-b border-line last:border-b-0">
                    <IndexRow
                      href={`/manager/${m.id}`}
                      leading={<PlayerPortrait name={m.name} src={m.thumb_url ?? m.image_url} size="sm" />}
                      name={m.name}
                      compactName={familyName(m.name)}
                      badge={
                        (trophyCount.get(m.id) ?? 0) > 0 ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 text-gold"
                            title={`${trophyCount.get(m.id)} trophies won`}
                          >
                            <TrophyIcon className="h-3 w-3" />
                            <span className="stat-num text-[11px] font-semibold leading-none">
                              {trophyCount.get(m.id)}
                            </span>
                          </span>
                        ) : undefined
                      }
                      sub={`${m.first?.slice(0, 4)}–${m.last?.slice(0, 4)} · ${m.role}`}
                      w={m.w}
                      d={m.d}
                      l={m.l}
                      gf={m.gf}
                      ga={m.ga}
                      chart={
                        <ManagerSparkbar
                          seasons={byManager.get(m.id) ?? []}
                          axisStart={axisStart}
                          axisEnd={axisEnd}
                          maxScale={maxSeason}
                          trophySeasons={trophySeasonsBy.get(m.id)}
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
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
