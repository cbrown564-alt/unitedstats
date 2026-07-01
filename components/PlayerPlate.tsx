import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ShirtBadge } from "@/components/ShirtBadge";
import { ShareCite } from "@/components/ShareCite";
import { fmtDate, fmtNum, scoreline, venuePrefix } from "@/lib/format";

/** A recorded match we can pin a player to — debut, latest, or any endpoint. */
interface MatchRef {
  id: string;
  date: string;
  season: string;
  opponent_name: string;
  venue: string;
  gf: number;
  ga: number;
}

interface Shirt {
  decade: string;
  shirt: number;
  apps: number;
  starts: number;
}

interface PlayerPlateProps {
  name: string;
  portrait: { src?: string | null; pageUrl?: string | null; license?: string | null };
  primaryShirt?: number | null;
  /** Readable primary position, e.g. "Forward" or "Centre-back"; omitted when unknown. */
  position?: string | null;
  careerYears?: string | null;
  rank?: { goalRank: number; total: number } | null;
  stats: {
    goals: number;
    apps: number;
    starts: number;
    subs: number;
    goalsPerApp: number | null;
    multiGoalGames: number;
    hatTricks: number;
    assists: number;
  };
  span: {
    debut: MatchRef | null;
    latest: MatchRef | null;
    peakSeason: { season: string; goals: number } | null;
  };
  shirts: Shirt[];
  /** One-line trust note shown in the footer band. */
  caveatBrief?: React.ReactNode;
  /** Compact correction affordance, rendered in the footer beside the caveat. */
  correctionHref?: string;
  /** Copy-link / cite affordance, rendered top-right of the plate. */
  share?: { path: string; title: string };
}

const yearOf = (m: { season?: string; date?: string }) =>
  Number((m.season ?? m.date ?? "").slice(0, 4)) || null;

/**
 * The team-sheet plate: a player's whole identity as one composed object rather
 * than a header, a tile grid, and two endpoint cards. The portrait carries the
 * kit number sewn into its corner; one dominant Goals figure is the answer; the
 * recorded career resolves into a single span with the peak season marked on it.
 */
export function PlayerPlate({
  name, portrait, primaryShirt, position, careerYears, rank, stats, span, shirts, caveatBrief, correctionHref, share,
}: PlayerPlateProps) {
  // Tint the corner kit to the era the player wore that number most.
  const primaryDecade =
    primaryShirt != null
      ? [...shirts].filter((s) => s.shirt === primaryShirt).sort((a, b) => b.apps - a.apps)[0]?.decade ?? null
      : null;

  // Secondary readouts, built only where the number means something — no "—" filler.
  const secondary: { value: string; label: string; detail?: string; tone?: string }[] = [
    {
      value: stats.apps ? fmtNum(stats.apps) : "—",
      label: "apps",
      detail: stats.subs ? `${fmtNum(stats.subs)} sub` : undefined,
    },
  ];
  if (stats.goalsPerApp != null) {
    secondary.push({ value: stats.goalsPerApp.toFixed(2), label: "goals / app" });
  }
  if (stats.multiGoalGames) {
    secondary.push({
      value: fmtNum(stats.multiGoalGames),
      label: "multi-goal apps",
      detail: stats.hatTricks ? `${fmtNum(stats.hatTricks)} hat-trick${stats.hatTricks === 1 ? "" : "s"}` : undefined,
      tone: stats.hatTricks ? "text-gold" : undefined,
    });
  }
  if (stats.assists) {
    secondary.push({
      value: fmtNum(stats.assists),
      label: "assists",
    });
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
      {/* pitch-line texture + a single restrained floodlight wash from the stand side */}
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full bg-devil/12 blur-3xl"
        aria-hidden
      />

      {share && (
        <div className="absolute right-4 top-4 z-10">
          <ShareCite path={share.path} title={share.title} />
        </div>
      )}

      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
        {/* Portrait, with the kit number patched onto the corner. */}
        <div className="flex flex-col items-start gap-2">
          <div className="relative">
            <PlayerPortrait name={name} src={portrait.src} size="lg" priority />
            {primaryShirt != null && (
              <span className="absolute -bottom-2.5 -left-2.5 rounded-md bg-pitch p-1 shadow-lg shadow-black/50 ring-1 ring-line">
                <ShirtBadge number={primaryShirt} decade={primaryDecade} compact />
              </span>
            )}
          </div>
          {portrait.pageUrl && (
            <a href={portrait.pageUrl} className="max-w-44 text-[11px] leading-4 text-ink-faint hover:text-devil-bright focus-ring">
              Wikimedia Commons{portrait.license ? ` · ${portrait.license}` : ""}
            </a>
          )}
        </div>

        {/* Identity + the headline answer + the career arc. */}
        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Player</p>
          <h1 className="display mt-1 text-3xl text-balance sm:text-4xl">{name}</h1>
          <p className="stat-num mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-dim">
            {careerYears && <span>United {careerYears}</span>}
            {primaryShirt != null && (
              <>
                <span aria-hidden className="text-ink-faint">·</span>
                <span>#{primaryShirt}</span>
              </>
            )}
            {position && (
              <>
                <span aria-hidden className="text-ink-faint">·</span>
                <span>{position}</span>
              </>
            )}
          </p>

          {/* One dominant figure — goals — beside a hairline ribbon of supporting stats. */}
          <div className="mt-5 flex flex-wrap items-end gap-x-7 gap-y-4 sm:mt-6">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="stat-num text-5xl font-semibold text-devil-bright sm:text-6xl">{fmtNum(stats.goals)}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-faint">goals</span>
              </div>
              {rank && (
                <p className="stat-num mt-2 text-xs text-ink-faint">
                  #{fmtNum(rank.goalRank)} of {fmtNum(rank.total)} goalscorers
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-7 gap-y-3.5 border-l border-line pl-6 sm:flex sm:flex-wrap sm:items-end">
              {secondary.map((s) => (
                <div key={s.label} className="leading-none">
                  <dd className={`stat-num text-xl font-semibold ${s.tone ?? "text-ink"}`}>{s.value}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">
                    {s.label}
                    {s.detail && <span className="ml-1 normal-case tracking-normal text-ink-dim">{s.detail}</span>}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          {(span.debut || span.latest) && (
            <CareerArc debut={span.debut} latest={span.latest} peakSeason={span.peakSeason} />
          )}
        </div>
      </div>

      {/* Footer band: trust note and correction link share one compact row. */}
      <div className="relative border-t border-line bg-pitch/40 px-5 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <p className="min-w-0 flex-1 text-[11px] leading-4 text-ink-faint">
            {caveatBrief ?? "Verified competitive record"}
          </p>
          {correctionHref && (
            <Link
              href={correctionHref}
              className="shrink-0 text-[11px] font-medium text-devil-bright hover:underline focus-ring"
            >
              Suggest correction →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The recorded career as one span: first recorded match on the left, latest on
 * the right, the most prolific season marked along the track. Position carries
 * time, so the whole arc reads before any of the labels do.
 */
function CareerArc({
  debut, latest, peakSeason,
}: {
  debut: MatchRef | null;
  latest: MatchRef | null;
  peakSeason: { season: string; goals: number } | null;
}) {
  const y0 = debut ? yearOf(debut) : latest ? yearOf(latest) : null;
  const y1 = latest ? yearOf(latest) : debut ? yearOf(debut) : null;
  const span = y0 != null && y1 != null ? Math.max(1, y1 - y0) : 1;
  const peakYear = peakSeason ? yearOf(peakSeason) : null;
  const peakPct =
    peakYear != null && y0 != null ? Math.min(96, Math.max(4, ((peakYear - y0) / span) * 100)) : null;

  const endpoint = (m: MatchRef) =>
    `${venuePrefix(m.venue)} ${m.opponent_name} ${scoreline(m.gf, m.ga)} · ${fmtDate(m.date)}`;

  return (
    <div className="mt-7 border-t border-line/80 pt-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <span>First</span>
        <span className="text-ink-dim">Career</span>
        <span>Latest</span>
      </div>

      <div className="relative mt-3 h-1.5 rounded-full bg-panel-2 ring-1 ring-inset ring-line">
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-devil/45 via-devil/60 to-devil-bright/70" />
        <span className="absolute -left-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch bg-devil-bright" aria-hidden />
        <span className="absolute -right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch bg-devil-bright" aria-hidden />
        {peakPct != null && peakSeason && (
          <Link
            href={`/seasons/${peakSeason.season}`}
            className="group/peak absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-ring"
            style={{ left: `${peakPct}%` }}
            title={`Most prolific season: ${fmtNum(peakSeason.goals)} goals`}
            aria-label={`Peak season ${peakSeason.season}: ${fmtNum(peakSeason.goals)} goals`}
          >
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-pitch bg-gold shadow-[0_0_0_3px_rgb(245_197_24_/0.18)]" aria-hidden />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded-md border border-line bg-panel-2 px-2 py-1 text-[11px] text-ink shadow-xl shadow-black/40 group-hover/peak:block">
              Peak: {fmtNum(peakSeason.goals)} goals in {peakSeason.season}
            </span>
          </Link>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        {debut ? (
          <Link href={`/match/${debut.id}`} className="group min-w-0 truncate text-ink-dim hover:text-devil-bright" title={endpoint(debut)}>
            <span className="stat-num text-ink">{debut.season}</span>{" "}
            <span className="text-ink-faint group-hover:text-devil-bright">v {debut.opponent_name}</span>
          </Link>
        ) : <span />}
        {peakSeason && (
          <Link
            href={`/seasons/${peakSeason.season}`}
            className="stat-num shrink-0 text-gold/90 hover:text-gold"
            title={`Most prolific season: ${fmtNum(peakSeason.goals)} goals`}
          >
            ★ {peakSeason.season}
            <span className="hidden sm:inline">: Most Prolific Season</span>
          </Link>
        )}
        {latest ? (
          <Link href={`/match/${latest.id}`} className="group min-w-0 truncate text-right text-ink-dim hover:text-devil-bright" title={endpoint(latest)}>
            <span className="text-ink-faint group-hover:text-devil-bright">v {latest.opponent_name}</span>{" "}
            <span className="stat-num text-ink">{latest.season}</span>
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
