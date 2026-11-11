import Link from "next/link";
import { matchHref, seasonHref } from "@/lib/publishedHref";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { normalizePortraitSrc } from "@/lib/portraitSrc";
import { ShirtBadge } from "@/components/ShirtBadge";
import { PeakSeasonLink, PlateShell, PlateStats, type PlateCell } from "@/components/IdentityPlate";
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
  statProfile?: "attacking" | "defensive";
  stats: {
    goals: number;
    apps: number;
    starts: number;
    subs: number;
    goalsPerApp: number | null;
    multiGoalGames: number;
    hatTricks: number;
    assists: number;
    cleanSheets?: number;
    goalsConceded?: number;
    concededPerGame?: number | null;
    cleanSheetPct?: number | null;
  };
  span: {
    debut: MatchRef | null;
    latest: MatchRef | null;
    peakSeason: { season: string; goals: number } | null;
    peakDefensiveSeason?: { season: string; cleanSheets: number } | null;
    /** A drawn career (CareerCord) in place of the plain first-to-latest bar. */
    rail?: React.ReactNode;
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
  name, portrait, primaryShirt, position, careerYears, rank, statProfile = "attacking", stats, span, shirts, caveatBrief, correctionHref, share,
}: PlayerPlateProps) {
  const defensive = statProfile === "defensive";
  // Tint the corner kit to the era the player wore that number most.
  const primaryDecade =
    primaryShirt != null
      ? [...shirts].filter((s) => s.shirt === primaryShirt).sort((a, b) => b.apps - a.apps)[0]?.decade ?? null
      : null;

  // Supporting cells, built only where the number means something — no "—" filler.
  const secondary: PlateCell[] = [
    {
      value: stats.apps ? fmtNum(stats.apps) : "—",
      label: "apps",
      detail: stats.subs ? `${fmtNum(stats.subs)} off the bench` : undefined,
    },
  ];
  if (defensive) {
    if (stats.concededPerGame != null) {
      secondary.push({ value: stats.concededPerGame.toFixed(2), label: "conceded / game" });
    }
    if (stats.cleanSheetPct != null) {
      secondary.push({ value: `${stats.cleanSheetPct.toFixed(0)}%`, label: "clean sheet rate" });
    }
    if (stats.goals) {
      secondary.push({ value: fmtNum(stats.goals), label: "goals" });
    }
  } else {
    if (stats.goalsPerApp != null) {
      secondary.push({ value: stats.goalsPerApp.toFixed(2), label: "goals / app" });
    }
    if (stats.multiGoalGames) {
      secondary.push({
        value: fmtNum(stats.multiGoalGames),
        label: "2+ goal games",
        detail: stats.hatTricks ? `${fmtNum(stats.hatTricks)} hat-trick${stats.hatTricks === 1 ? "" : "s"}` : undefined,
        tone: stats.hatTricks ? "text-gold" : undefined,
      });
    }
    if (stats.assists) {
      secondary.push({ value: fmtNum(stats.assists), label: "assists" });
    }
  }

  const peakForArc = (defensive ? span.peakDefensiveSeason : span.peakSeason) ?? null;

  return (
    <PlateShell
      mediaKind="portrait"
      mediaBackdrop={normalizePortraitSrc(portrait.src)}
      media={
        <>
          <PlayerPortrait name={name} src={portrait.src} size="lg" priority />
          {primaryShirt != null && (
            <span className="absolute bottom-2 left-2 z-10 rounded-md bg-pitch/90 p-1 shadow-lg shadow-black/50 ring-1 ring-line">
              <ShirtBadge number={primaryShirt} decade={primaryDecade} compact />
            </span>
          )}
        </>
      }
      mediaNote={
        portrait.pageUrl ? (
          <a href={portrait.pageUrl} className="inline-flex min-h-11 items-center hover:text-devil-bright focus-ring md:min-h-0">
            Wikimedia Commons{portrait.license ? ` · ${portrait.license}` : ""}
          </a>
        ) : undefined
      }
      share={share}
      eyebrow="Player"
      title={name}
      subtitle={
        <>
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
        </>
      }
      footer={
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-line bg-pitch/40 px-4 py-2.5 md:px-6">
          <p className="min-w-0 flex-1 text-[11px] leading-4 text-ink-faint">
            {caveatBrief ?? "Verified competitive record"}
          </p>
          {correctionHref && (
            <Link
              href={correctionHref}
              className="inline-flex min-h-11 shrink-0 items-center text-[11px] font-medium text-devil-bright hover:underline focus-ring sm:min-h-0"
            >
              Suggest correction →
            </Link>
          )}
        </div>
      }
    >
      <PlateStats
        headline={{
          value: defensive ? fmtNum(stats.cleanSheets ?? 0) : fmtNum(stats.goals),
          label: defensive ? "clean sheets" : "goals",
          sub: !defensive && rank ? <>#{fmtNum(rank.goalRank)} of {fmtNum(rank.total)} United goalscorers</> : undefined,
        }}
        cells={secondary}
      />

      {(span.debut || span.latest) && (
        <CareerArc debut={span.debut} latest={span.latest} peakSeason={peakForArc} defensive={defensive} rail={span.rail} />
      )}
    </PlateShell>
  );
}

/**
 * The recorded career as one span: first recorded match on the left, latest on
 * the right, the most prolific season marked along the track. Position carries
 * time, so the whole arc reads before any of the labels do.
 */
function CareerArc({
  debut, latest, peakSeason, defensive = false, rail,
}: {
  debut: MatchRef | null;
  latest: MatchRef | null;
  peakSeason: { season: string; goals?: number; cleanSheets?: number } | null;
  defensive?: boolean;
  rail?: React.ReactNode;
}) {
  const y0 = debut ? yearOf(debut) : latest ? yearOf(latest) : null;
  const y1 = latest ? yearOf(latest) : debut ? yearOf(debut) : null;
  const span = y0 != null && y1 != null ? Math.max(1, y1 - y0) : 1;
  const peakYear = peakSeason ? yearOf(peakSeason) : null;
  const peakPct =
    peakYear != null && y0 != null ? Math.min(96, Math.max(4, ((peakYear - y0) / span) * 100)) : null;

  const endpoint = (m: MatchRef) =>
    `${venuePrefix(m.venue)} ${m.opponent_name} ${scoreline(m.gf, m.ga)} · ${fmtDate(m.date)}`;

  const peakTitle = peakSeason
    ? defensive
      ? `Best clean-sheet season: ${fmtNum(peakSeason.cleanSheets ?? 0)} clean sheets`
      : `Most prolific season: ${fmtNum(peakSeason.goals ?? 0)} goals`
    : "";

  const end = (m: MatchRef, label: string, align: "left" | "right") => (
    <Link
      href={matchHref(m.id)}
      prefetch={false}
      className={`group flex min-w-0 flex-col ${align === "right" ? "items-end text-right" : ""}`}
      title={endpoint(m)}
    >
      <span className="plate-span-label">{label}</span>
      <span className="stat-num text-ink group-hover:text-devil-bright">{m.season}</span>
      <span className="mt-0.5 max-w-full truncate leading-4 text-ink-faint group-hover:text-devil-bright">v {m.opponent_name}</span>
    </Link>
  );

  return (
    <div className="plate-span">
      {rail ? (
        <div>{rail}</div>
      ) : (
        <div className="relative mt-1 h-1.5 rounded-full bg-panel-2 ring-1 ring-inset ring-line">
          <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-devil/45 via-devil/60 to-devil-bright/70" />
          <span className="absolute -left-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch bg-devil-bright" aria-hidden />
          <span className="absolute -right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-pitch bg-devil-bright" aria-hidden />
          {peakPct != null && peakSeason && (
            <Link
              href={seasonHref(peakSeason.season)}
              prefetch={false}
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-ring"
              style={{ left: `${peakPct}%` }}
              title={peakTitle}
              aria-label={`Peak season ${peakSeason.season}: ${peakTitle}`}
            >
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-pitch bg-gold shadow-[0_0_0_3px_rgb(245_197_24_/0.18)]" aria-hidden />
            </Link>
          )}
        </div>
      )}

      <div className="plate-span-ends">
        {debut ? end(debut, "First match", "left") : <span />}
        {peakSeason ? (
          <PeakSeasonLink
            season={peakSeason.season}
            title={peakTitle}
            label={defensive ? "Best clean-sheet season" : "Most prolific"}
          />
        ) : (
          <span />
        )}
        {latest ? end(latest, "Latest", "right") : <span />}
      </div>
    </div>
  );
}
