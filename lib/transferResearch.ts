import type Database from "better-sqlite3";
import {
  adjustFeeGbp,
  transferSeason,
  type InflationIndices,
} from "@/lib/inflation";

type SpellState = "completed" | "active_candidate" | "unclosed_record" | "unresolved";

interface SigningSourceRow {
  transfer_id: string;
  player_id: string | null;
  player_name: string;
  signing_date: string | null;
  date_precision: string | null;
  season: string | null;
  source_club_id: string | null;
  source_club: string | null;
  fee_gbp: number | null;
  fee_kind: string;
  market_value_eur: number | null;
  transfer_sources: string | null;
  position_group: string | null;
  career_apps: number | null;
  career_starts: number | null;
  career_goals: number | null;
  last_appearance: string | null;
  manager_id: string | null;
  manager_name: string | null;
}

interface ExitRow {
  id: string;
  player_id: string;
  date: string | null;
  date_precision: string | null;
  season: string | null;
  club_id: string | null;
  club: string | null;
  fee_gbp: number | null;
  fee_kind: string;
  type: string;
}

interface SpellStats {
  apps: number;
  starts: number;
  goals: number;
  assistsRecorded: number;
  teamMatches: number;
  observationSeasons: number;
}

export interface TransferResearchCandidate {
  transfer_id: string;
  spell_id: string;
  player_id: string | null;
  player_name: string;
  signing_date: string | null;
  date_precision: string | null;
  season: string | null;
  manager_id: string | null;
  manager_name: string | null;
  age_at_signing: null;
  position_group: string | null;
  source_club_id: string | null;
  source_club: string | null;
  prior_pl_experience: null;
  fee_gbp: number | null;
  fee_kind: string;
  fee_cpi_gbp: number | null;
  fee_football_gbp: number | null;
  fee_pl_mean_multiple: number | null;
  fee_pl_percentile: null;
  market_value_eur: number | null;
  repeat_signing: boolean;
  spell_state: SpellState;
  exit_transfer_id: string | null;
  exit_date: string | null;
  exit_fee_gbp: number | null;
  exit_fee_kind: string | null;
  observation_seasons: number | null;
  apps: number | null;
  starts: number | null;
  goals: number | null;
  assists_recorded: number | null;
  team_matches_in_window: number | null;
  appearance_share: number | null;
  honour_seasons_involved: string[];
  transfer_sources: string[];
}

interface CoverageAuditRow {
  field: string;
  covered: number;
  denominator: number;
  source: string;
  missingMeaning: string;
  activeCensoring: string;
  precision: string;
  redistribution: string;
}

export interface TransferA0Audit {
  generatedAt: string;
  databaseBuiltAt: string | null;
  latestMatchDate: string;
  latestMatchSeason: string;
  cohortDefinition: string;
  summary: {
    candidateSignings: number;
    knownFeeSignings: number;
    knownFeeWithSpellAppearances: number;
    knownFeeWithPosition: number;
    activeCandidates: number;
    repeatedPlayers: number;
    repeatedSigningRows: number;
  };
  feeByEra: Array<{
    era: string;
    candidateSignings: number;
    knownFeeSignings: number;
    knownFeeWithAppearances: number;
    knownFeeWithPosition: number;
  }>;
  plComparisonCorpus: {
    source: string;
    seasons: number;
    corpusSize: number;
    earliestSeason: string;
    baseSeason: string;
    supportsMeanRelativeCost: true;
    supportsPercentiles: false;
    decision: string;
  };
  coverage: CoverageAuditRow[];
  conclusion: {
    descriptiveStudy: "supported_with_limits";
    probabilityModel: "closed";
    bestValueRanking: "closed";
    reason: string;
  };
  candidates: TransferResearchCandidate[];
}

function eraFor(season: string | null, date: string | null): string {
  const year = Number.parseInt((date ?? season ?? "").slice(0, 4), 10);
  if (!Number.isFinite(year)) return "Unknown date";
  if (year < 1945) return "Pre-1945";
  if (year < 1992) return "1945–91";
  return "1992–present";
}

function sourceIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      if (entry && typeof entry === "object" && "source_id" in entry) {
        const value = (entry as { source_id?: unknown }).source_id;
        return typeof value === "string" ? [value] : [];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function seasonStart(season: string): string {
  return `${season.slice(0, 4)}-07-01`;
}

function spellStats(
  db: Database.Database,
  playerId: string | null,
  start: string | null,
  end: string | null,
): SpellStats | null {
  if (!playerId || !start) return null;
  const upper = end ?? "9999-12-31";
  const appearances = db
    .prepare(
      `SELECT COUNT(*) apps,
              COALESCE(SUM(l.started = 1), 0) starts,
              COUNT(DISTINCT m.season) observation_seasons
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       WHERE l.player_id = ?
         AND l.player_side = 'united'
         AND l.bench = 0
         AND m.date >= ?
         AND m.date <= ?`,
    )
    .get(playerId, start, upper) as { apps: number; starts: number; observation_seasons: number };
  const events = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE
           WHEN e.player_id = ?
             AND ((e.player_side = 'united' AND e.type IN ('goal','pen-goal')) OR e.type = 'own-goal-for')
           THEN 1 ELSE 0 END), 0) goals,
         COALESCE(SUM(CASE
           WHEN e.assist_player_id = ?
             AND e.assist_side = 'united'
             AND e.type IN ('goal','pen-goal')
           THEN 1 ELSE 0 END), 0) assists
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       WHERE m.date >= ? AND m.date <= ?`,
    )
    .get(playerId, playerId, start, upper) as { goals: number; assists: number };
  const teamMatches = (
    db.prepare("SELECT COUNT(*) n FROM matches WHERE date >= ? AND date <= ?").get(start, upper) as { n: number }
  ).n;
  return {
    apps: appearances.apps,
    starts: appearances.starts,
    goals: events.goals,
    assistsRecorded: events.assists,
    teamMatches,
    observationSeasons: appearances.observation_seasons,
  };
}

function honourSeasonsByPlayer(db: Database.Database): Map<string, string[]> {
  const rows = db
    .prepare(
      `WITH honours AS (
         SELECT ss.competition_id, ss.season, 'league' cat
         FROM season_summaries ss
         JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league'
           AND ss.position = 1
           AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT m.competition_id, m.season, c.type cat
         FROM matches m
         JOIN competitions c ON c.id = m.competition_id
         WHERE c.type IN ('domestic-cup','league-cup','european','super-cup','world')
           AND m.outcome = 'W'
           AND m.date = (
             SELECT MAX(m2.date) FROM matches m2
             WHERE m2.season = m.season AND m2.competition_id = m.competition_id
           )
           AND (
             (m.round LIKE '%final%' AND m.round NOT LIKE '%semi%' AND m.round NOT LIKE '%quarter%')
             OR (c.type IN ('super-cup','world') AND m.round IS NULL)
           )
       )
       SELECT l.player_id, h.season
       FROM honours h
       JOIN matches m ON m.competition_id = h.competition_id AND m.season = h.season
       JOIN match_lineups l ON l.match_id = m.id
       WHERE l.player_id IS NOT NULL AND l.player_side = 'united' AND l.bench = 0
       GROUP BY l.player_id, h.competition_id, h.season, h.cat
       HAVING COUNT(*) >= CASE WHEN h.cat = 'league' THEN 5 ELSE 1 END
       ORDER BY h.season`,
    )
    .all() as Array<{ player_id: string; season: string }>;
  const byPlayer = new Map<string, string[]>();
  for (const row of rows) {
    const seasons = byPlayer.get(row.player_id) ?? [];
    if (!seasons.includes(row.season)) seasons.push(row.season);
    byPlayer.set(row.player_id, seasons);
  }
  return byPlayer;
}

function coverageRow(
  field: string,
  covered: number,
  denominator: number,
  source: string,
  missingMeaning: string,
  activeCensoring: string,
  precision: string,
  redistribution: string,
): CoverageAuditRow {
  return { field, covered, denominator, source, missingMeaning, activeCensoring, precision, redistribution };
}

export function buildTransferA0Audit(
  db: Database.Database,
  indices: InflationIndices,
  generatedAt = new Date().toISOString(),
): TransferA0Audit {
  const latestMatch = db
    .prepare("SELECT date, season FROM matches ORDER BY date DESC LIMIT 1")
    .get() as { date: string; season: string };
  const databaseBuiltAt = (
    db.prepare("SELECT value FROM meta WHERE key = 'built_at'").get() as { value: string } | undefined
  )?.value ?? null;
  const activeThreshold = seasonStart(latestMatch.season);

  const signings = db
    .prepare(
      `SELECT
         t.id transfer_id,
         t.player_id,
         COALESCE(p.name, t.player_name) player_name,
         t.date signing_date,
         t.date_precision,
         t.season,
         t.club_id source_club_id,
         t.club source_club,
         t.fee_gbp,
         t.fee_kind,
         t.market_value_eur,
         t.sources transfer_sources,
         pp.bucket position_group,
         pr.apps career_apps,
         pr.starts career_starts,
         pr.goals career_goals,
         pt.last_date last_appearance,
         (
           SELECT mt.manager_id
           FROM manager_tenures mt
           WHERE t.date IS NOT NULL
             AND t.date >= mt.date_from
             AND (mt.date_to IS NULL OR t.date <= mt.date_to)
           ORDER BY mt.date_from DESC
           LIMIT 1
         ) manager_id,
         (
           SELECT m.name
           FROM manager_tenures mt
           JOIN managers m ON m.id = mt.manager_id
           WHERE t.date IS NOT NULL
             AND t.date >= mt.date_from
             AND (mt.date_to IS NULL OR t.date <= mt.date_to)
           ORDER BY mt.date_from DESC
           LIMIT 1
         ) manager_name
       FROM transfers t
       LEFT JOIN players p ON p.id = t.player_id
       LEFT JOIN player_positions pp ON pp.player_id = t.player_id
       LEFT JOIN player_records pr ON pr.player_id = t.player_id
       LEFT JOIN player_totals pt ON pt.player_id = t.player_id AND pt.scope = 'all'
       WHERE t.direction = 'in' AND t.type = 'permanent'
       ORDER BY t.date IS NULL, t.date, t.id`,
    )
    .all() as SigningSourceRow[];

  const exits = db
    .prepare(
      `SELECT id, player_id, date, date_precision, season, club_id, club, fee_gbp, fee_kind, type
       FROM transfers
       WHERE direction = 'out' AND player_id IS NOT NULL
       ORDER BY date IS NULL, date, id`,
    )
    .all() as ExitRow[];
  const exitsByPlayer = new Map<string, ExitRow[]>();
  for (const exit of exits) {
    const rows = exitsByPlayer.get(exit.player_id) ?? [];
    rows.push(exit);
    exitsByPlayer.set(exit.player_id, rows);
  }

  const signingsByPlayer = new Map<string, SigningSourceRow[]>();
  for (const signing of signings) {
    if (!signing.player_id) continue;
    const rows = signingsByPlayer.get(signing.player_id) ?? [];
    rows.push(signing);
    signingsByPlayer.set(signing.player_id, rows);
  }
  const honours = honourSeasonsByPlayer(db);

  const candidates = signings.map((signing): TransferResearchCandidate => {
    const playerSignings = signing.player_id ? signingsByPlayer.get(signing.player_id) ?? [] : [];
    const spellIndex = playerSignings.findIndex((row) => row.transfer_id === signing.transfer_id);
    const nextSigning = spellIndex >= 0 ? playerSignings[spellIndex + 1] : undefined;
    const exit =
      signing.player_id && signing.signing_date
        ? (exitsByPlayer.get(signing.player_id) ?? []).find(
            (row) =>
              row.date != null &&
              row.date >= signing.signing_date! &&
              (!nextSigning?.signing_date || row.date < nextSigning.signing_date) &&
              row.type !== "loan",
          ) ?? null
        : null;
    const endDate = exit?.date ?? nextSigning?.signing_date ?? null;
    const stats = spellStats(db, signing.player_id, signing.signing_date, endDate);
    const resolvedSeason = transferSeason(signing.signing_date, signing.season);
    const footballSeason = resolvedSeason ? indices.football.seasons[resolvedSeason] : undefined;
    const feePlMeanMultiple =
      signing.fee_kind === "fee" && signing.fee_gbp != null && footballSeason
        ? signing.fee_gbp / footballSeason.meanGbp
        : null;
    const spellState: SpellState =
      !signing.player_id || !signing.signing_date
        ? "unresolved"
        : exit
          ? "completed"
          : signing.last_appearance && signing.last_appearance >= activeThreshold
            ? "active_candidate"
            : "unclosed_record";
    const startSeason = resolvedSeason;
    const endSeason = exit?.season ?? nextSigning?.season ?? latestMatch.season;
    const honourSeasons = signing.player_id
      ? (honours.get(signing.player_id) ?? []).filter(
          (season) => (!startSeason || season >= startSeason) && (!endSeason || season <= endSeason),
        )
      : [];

    return {
      transfer_id: signing.transfer_id,
      spell_id:
        signing.player_id && spellIndex >= 0
          ? `${signing.player_id}:${spellIndex + 1}`
          : `transfer:${signing.transfer_id}`,
      player_id: signing.player_id,
      player_name: signing.player_name,
      signing_date: signing.signing_date,
      date_precision: signing.date_precision,
      season: resolvedSeason,
      manager_id: signing.manager_id,
      manager_name: signing.manager_name,
      age_at_signing: null,
      position_group: signing.position_group,
      source_club_id: signing.source_club_id,
      source_club: signing.source_club,
      prior_pl_experience: null,
      fee_gbp: signing.fee_gbp,
      fee_kind: signing.fee_kind,
      fee_cpi_gbp: adjustFeeGbp(
        signing.fee_gbp,
        signing.fee_kind,
        signing.signing_date,
        signing.season,
        "cpi",
        indices,
      ),
      fee_football_gbp: adjustFeeGbp(
        signing.fee_gbp,
        signing.fee_kind,
        signing.signing_date,
        signing.season,
        "football",
        indices,
      ),
      fee_pl_mean_multiple: feePlMeanMultiple,
      fee_pl_percentile: null,
      market_value_eur: signing.market_value_eur,
      repeat_signing: playerSignings.length > 1,
      spell_state: spellState,
      exit_transfer_id: exit?.id ?? null,
      exit_date: exit?.date ?? null,
      exit_fee_gbp: exit?.fee_kind === "fee" ? exit.fee_gbp : null,
      exit_fee_kind: exit?.fee_kind ?? null,
      observation_seasons: stats?.observationSeasons ?? null,
      apps: stats?.apps ?? null,
      starts: stats?.starts ?? null,
      goals: stats?.goals ?? null,
      assists_recorded: stats?.assistsRecorded ?? null,
      team_matches_in_window: stats?.teamMatches ?? null,
      appearance_share:
        stats && stats.teamMatches > 0 ? Number((stats.apps / stats.teamMatches).toFixed(4)) : null,
      honour_seasons_involved: honourSeasons,
      transfer_sources: sourceIds(signing.transfer_sources),
    };
  });

  const knownFee = candidates.filter((row) => row.fee_kind === "fee" && row.fee_gbp != null);
  const repeatedPlayerIds = new Set(
    candidates.filter((row) => row.repeat_signing && row.player_id).map((row) => row.player_id!),
  );
  const eraNames = ["Unknown date", "Pre-1945", "1945–91", "1992–present"];
  const feeByEra = eraNames
    .map((era) => {
      const rows = candidates.filter((row) => eraFor(row.season, row.signing_date) === era);
      const feeRows = rows.filter((row) => row.fee_kind === "fee" && row.fee_gbp != null);
      return {
        era,
        candidateSignings: rows.length,
        knownFeeSignings: feeRows.length,
        knownFeeWithAppearances: feeRows.filter((row) => row.apps != null).length,
        knownFeeWithPosition: feeRows.filter((row) => row.position_group != null).length,
      };
    })
    .filter((row) => row.candidateSignings > 0);

  const completed = candidates.filter((row) => row.spell_state === "completed");
  const redistributionReference =
    "Internal derived use is permitted by the project source policy; review source terms before redistributing a frozen row-level research dataset.";
  const openRedistribution =
    "Derived from the project fixture record and CC BY-SA/CC0-attributed enrichments; retain source attribution.";
  const coverage = [
    coverageRow("signing_date", candidates.filter((row) => row.signing_date).length, candidates.length, "MUFCInfo transfer archive", "Unknown, not zero", "No", "Day/month/year precision is retained", redistributionReference),
    coverageRow("manager_id", candidates.filter((row) => row.manager_id).length, candidates.length, "Transfer date × canonical manager tenures", "Unknown when the signing date or tenure boundary is unavailable", "No", "Inherits transfer-date precision", openRedistribution),
    coverageRow("age_at_signing", 0, candidates.length, "No canonical birth-date field", "Unavailable", "No", "Not calculated", "No source selected"),
    coverageRow("position_group", candidates.filter((row) => row.position_group).length, candidates.length, "Wikidata P413", "Unknown; never inferred", "No", "Broad primary-position bucket", "Wikidata attribution required"),
    coverageRow("prior_pl_experience", 0, candidates.length, "No licensed prior-club appearance history", "Unavailable", "No", "Not calculated", "No source selected"),
    coverageRow("fee_gbp", knownFee.length, candidates.length, "MUFCInfo transfer archive", "Unknown, free, or undisclosed is distinct from zero", "No", "Published nominal GBP amount", redistributionReference),
    coverageRow("fee_pl_mean_multiple", candidates.filter((row) => row.fee_pl_mean_multiple != null).length, candidates.length, "PL season mean index", "Unavailable before 1992 or without a published fee", "No", "Relative to season mean, not a percentile", "Aggregated comparison corpus; do not redistribute raw scraped rows"),
    coverageRow("fee_pl_percentile", 0, candidates.length, "Row-level PL comparison corpus not retained", "Unavailable", "No", "Cannot reconstruct from season means", "Requires a licensed/reusable row-level corpus"),
    coverageRow("market_value_eur", candidates.filter((row) => row.market_value_eur != null).length, candidates.length, "transfermarkt-datasets", "Unknown, not zero", "No", "Nearest recorded estimate at transfer time", "CC0 dataset attribution retained"),
    coverageRow("spell_appearances", candidates.filter((row) => row.apps != null).length, candidates.length, "Canonical match lineups", "Unavailable without player/date linkage", "Ongoing spells accumulate", "Bounded by recorded signing/exit dates; imprecise dates remain flagged", openRedistribution),
    coverageRow("honour_seasons_involved", candidates.filter((row) => row.apps != null).length, candidates.length, "Canonical match participation and trophy rules", "Empty means no qualifying involvement only when spell stats are covered", "Ongoing spells accumulate", "Five league appearances or one cup appearance in a winning campaign", openRedistribution),
    coverageRow("exit_event", completed.length, candidates.length, "MUFCInfo transfer archive", "No recorded exit is not proof of an active spell", "Yes", "First non-loan departure before a repeat signing", redistributionReference),
    coverageRow("known_exit_fee_gbp", completed.filter((row) => row.exit_fee_gbp != null).length, completed.length, "MUFCInfo transfer archive", "Unknown/free/undisclosed is distinct from zero", "Active candidates excluded from denominator", "Published nominal GBP amount", redistributionReference),
  ];

  return {
    generatedAt,
    databaseBuiltAt,
    latestMatchDate: latestMatch.date,
    latestMatchSeason: latestMatch.season,
    cohortDefinition: "All recorded permanent incoming transfers; academy promotions and loans are excluded.",
    summary: {
      candidateSignings: candidates.length,
      knownFeeSignings: knownFee.length,
      knownFeeWithSpellAppearances: knownFee.filter((row) => row.apps != null).length,
      knownFeeWithPosition: knownFee.filter((row) => row.position_group != null).length,
      activeCandidates: candidates.filter((row) => row.spell_state === "active_candidate").length,
      repeatedPlayers: repeatedPlayerIds.size,
      repeatedSigningRows: candidates.filter((row) => row.repeat_signing).length,
    },
    feeByEra,
    plComparisonCorpus: {
      source: indices.football.source,
      seasons: Object.keys(indices.football.seasons).length,
      corpusSize: indices.football.corpusSize ?? 0,
      earliestSeason: indices.football.earliestSeason,
      baseSeason: indices.football.baseSeason,
      supportsMeanRelativeCost: true,
      supportsPercentiles: false,
      decision:
        "Use the index for descriptive mean-relative cost only. Do not publish percentile bands until a licensed row-level comparison corpus is retained and audited.",
    },
    coverage,
    conclusion: {
      descriptiveStudy: "supported_with_limits",
      probabilityModel: "closed",
      bestValueRanking: "closed",
      reason:
        "The 239 known-fee signings support descriptive cost-versus-career views, but signing age and prior league experience are absent, active/completed status is partly inferred, and PL fee percentiles cannot be reconstructed.",
    },
    candidates,
  };
}

function percent(covered: number, denominator: number): string {
  return denominator === 0 ? "—" : `${((covered / denominator) * 100).toFixed(1)}%`;
}

export function renderTransferA0Markdown(audit: TransferA0Audit): string {
  const coverageRows = audit.coverage
    .map(
      (row) =>
        `| ${row.field} | ${row.covered}/${row.denominator} (${percent(row.covered, row.denominator)}) | ${row.source} | ${row.missingMeaning} | ${row.precision} | ${row.redistribution} |`,
    )
    .join("\n");
  const eraRows = audit.feeByEra
    .map(
      (row) =>
        `| ${row.era} | ${row.candidateSignings} | ${row.knownFeeSignings} | ${row.knownFeeWithAppearances} | ${row.knownFeeWithPosition} |`,
    )
    .join("\n");
  return `# Transfer history A0 — evidence and feasibility audit

Generated ${audit.generatedAt.slice(0, 10)} from the bundled database built ${audit.databaseBuiltAt ?? "at an unknown time"}.

## Decision

**Pass for a descriptive study with limits. Probability modelling and a best-value ranking remain closed.**

The candidate cohort contains **${audit.summary.candidateSignings} permanent incoming transfers**. **${audit.summary.knownFeeSignings}** carry a published fee; **${audit.summary.knownFeeWithSpellAppearances}** of those can be joined to match-attributed spell appearances and **${audit.summary.knownFeeWithPosition}** have a broad position.

The present record does not contain signing age or prior Premier League experience. The Premier League comparison asset retains season counts, means, and adjustment factors across **${audit.plComparisonCorpus.corpusSize}** deals, but not the row-level corpus needed to reconstruct percentiles. No success label or composite score has been created.

## Cohort

${audit.cohortDefinition}

- Latest match in the audited database: ${audit.latestMatchDate} (${audit.latestMatchSeason}).
- Active candidates: ${audit.summary.activeCandidates}. This is an inference from no recorded exit plus an appearance in the latest match season; it is not a canonical squad-status field.
- Repeat signings: ${audit.summary.repeatedPlayers} players across ${audit.summary.repeatedSigningRows} signing rows.
- The generated candidate table is \`a0-candidate-cohort.csv\`.

## Published-fee permanent signings by era

| Era | Candidate signings | Published fee | Fee + spell appearances | Fee + position |
| --- | ---: | ---: | ---: | ---: |
${eraRows}

## Coverage matrix

| Field | Covered | Source | Missing means | Precision | Redistribution position |
| --- | ---: | --- | --- | --- | --- |
${coverageRows}

Active censoring applies to \`spell_appearances\`, \`honour_seasons_involved\`, and exit fields even where the compact table above does not repeat the note. See the machine-readable audit JSON for each field's explicit \`activeCensoring\` value.

## Premier League comparison corpus

- Source: ${audit.plComparisonCorpus.source}
- Range: ${audit.plComparisonCorpus.earliestSeason} to ${audit.plComparisonCorpus.baseSeason}
- Seasons: ${audit.plComparisonCorpus.seasons}
- Retained corpus count: ${audit.plComparisonCorpus.corpusSize}
- Mean-relative cost: supported for descriptive use.
- Percentile bands: not supported from the retained aggregate.

${audit.plComparisonCorpus.decision}

## Gate result

- Coverage matrix: complete for the proposed A0 fields.
- Missingness: explicit; unknown, free, undisclosed, zero, and not applicable are not collapsed.
- Descriptive feasibility: supported for the known-fee cohort, with era and position stratification.
- Probability model: closed.
- Best-value ranking: closed.
- Success label: not created.

The next research action is A1 only after real transfer receipts exist for review. The next experience action is the three season/window exemplars.
`;
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join("|")
    : value == null
      ? ""
      : typeof value === "boolean"
        ? value
          ? "true"
          : "false"
        : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function renderTransferCandidateCsv(candidates: TransferResearchCandidate[]): string {
  const columns: Array<keyof TransferResearchCandidate> = [
    "transfer_id",
    "spell_id",
    "player_id",
    "player_name",
    "signing_date",
    "date_precision",
    "season",
    "manager_id",
    "manager_name",
    "age_at_signing",
    "position_group",
    "source_club_id",
    "source_club",
    "prior_pl_experience",
    "fee_gbp",
    "fee_kind",
    "fee_cpi_gbp",
    "fee_football_gbp",
    "fee_pl_mean_multiple",
    "fee_pl_percentile",
    "market_value_eur",
    "repeat_signing",
    "spell_state",
    "exit_transfer_id",
    "exit_date",
    "exit_fee_gbp",
    "exit_fee_kind",
    "observation_seasons",
    "apps",
    "starts",
    "goals",
    "assists_recorded",
    "team_matches_in_window",
    "appearance_share",
    "honour_seasons_involved",
    "transfer_sources",
  ];
  return [
    columns.join(","),
    ...candidates.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n") + "\n";
}
