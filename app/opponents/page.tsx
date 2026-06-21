import { opponentsIndex } from "@/lib/queries";
import { ClubBadge } from "@/components/ClubBadge";
import { OpponentRivalryMap } from "@/components/charts/OpponentRivalryMap";
import { IndexRow } from "@/components/IndexRow";
import { FilterableList } from "@/components/FilterableList";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum } from "@/lib/format";

export const metadata = { title: "Opponents" };

export default function OpponentsPage() {
  const allOpponents = opponentsIndex();

  const mostPlayed = allOpponents[0];
  // The finding lives among the most-played rivalries: who we master, who we fear.
  const regulars = allOpponents.filter((o) => o.p >= 100);
  const dominated = [...regulars].sort((a, b) => b.w / b.p - a.w / a.p)[0];
  const nemesis = [...regulars].sort((a, b) => a.w / a.p - b.w / b.p)[0];

  // Rows are built on the server so IndexRow/ClubBadge/WdlBar stay off the client
  // bundle; the FilterableList island only chooses which pre-rendered rows to show.
  const rows = allOpponents.map((o, i) => ({
    key: o.id,
    text: o.name.toLowerCase(),
    node: (
      <IndexRow
        href={`/opponent/${o.id}`}
        rank={i + 1}
        leading={<ClubBadge id={o.id} name={o.name} size="md" />}
        name={o.name}
        sub={`${o.first.slice(0, 4)}–${o.last.slice(0, 4)}`}
        w={o.w}
        d={o.d}
        l={o.l}
      />
    ),
  }));

  return (
    <div className="space-y-10">
      {/* The fixture landscape as one object: how often we've met every club,
          and how we fare — the rivalries clustered near break-even, the nemesis low. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
            Head to head · the landscape
          </p>
          <h1 className="display max-w-3xl text-4xl leading-[0.95] sm:text-5xl">
            {fmtNum(allOpponents.length)} opponents, one nemesis
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-dim sm:text-base">
            Every club United have faced since 1886, placed by how often we&apos;ve met and how we fare.
            Against almost everyone we play a lot the record hovers near break-even — but{" "}
            {dominated && (
              <>
                <span className="font-semibold text-win">{dominated.name}</span> we genuinely master
                {nemesis ? ", and " : "."}
              </>
            )}
            {nemesis && (
              <>
                <span className="font-semibold text-loss">{nemesis.name}</span>, the rival we&apos;ve met
                most, we beat least.
              </>
            )}
          </p>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Opponents faced</dt>
              <dd className="stat-num text-lg font-semibold text-ink">{fmtNum(allOpponents.length)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Most played</dt>
              <dd className="stat-num text-lg font-semibold text-devil-bright">
                {fmtNum(mostPlayed?.p ?? 0)}{" "}
                <span className="text-sm font-normal text-ink-dim">{mostPlayed?.name}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Since</dt>
              <dd className="stat-num text-lg font-semibold text-ink">1886</dd>
            </div>
          </dl>

          <div className="mt-7">
            <OpponentRivalryMap opponents={allOpponents} />
          </div>
        </div>
      </section>

      {/* The detail layer: the full ranked ledger, the auditable filter target. */}
      <div className="space-y-3">
        <FilterableList
          items={rows}
          label="Find an opponent"
          placeholder="Liverpool, Leeds, Bayern"
          emptyText="No opponent matches that name."
        />

        <CoverageNote slice="every recorded meeting, league and cup, since 1886">
          Ranked by matches played, so the great rivalries sit at the top. The bar pivots on its centre,
          wins right, losses left; each row opens the meetings behind the record.
        </CoverageNote>
      </div>
    </div>
  );
}
