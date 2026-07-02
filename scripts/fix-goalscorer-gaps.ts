/**
 * One-off backfill for post-1946 United goalscorer gaps:
 *  - Liverpool 1999: second Carragher own goal (Wikipedia partial)
 *  - 1986 FA Cup West Ham: Stapleton (no Wikipedia cache in repo)
 *  - legacy rows where events reconcile but eventsComplete was never set
 *
 * Usage: tsx scripts/fix-goalscorer-gaps.ts
 */
import {
  Match,
  MatchEvent,
  SeasonFile,
  loadSeasonFile,
  saveSeasonFile,
} from "./lib";

const UNITED_GOAL_TYPES = new Set(["goal", "pen-goal", "own-goal-for"]);

function unitedGoals(events: MatchEvent[] | undefined): MatchEvent[] {
  return (events ?? []).filter((e) => UNITED_GOAL_TYPES.has(e.type));
}

function addSource(m: Match, source: string) {
  if (!m.sources.includes(source)) m.sources.push(source);
}

function setComplete(m: Match) {
  m.eventsComplete = unitedGoals(m.events).length === m.score.ft[0];
}

const CURATED_FIXES: { season: string; id: string; patch: (m: Match) => void }[] = [
  {
    season: "1999-00",
    id: "1999-09-11-liverpool-a",
    patch(m) {
      m.events = m.events ?? [];
      const insertAt = m.events.findIndex((e) => e.type === "opp-goal");
      const idx = insertAt >= 0 ? insertAt : m.events.length;
      m.events.splice(idx, 0, {
        type: "own-goal-for",
        player: "own-goal",
        minute: 44,
        detail: "Jamie Carragher (og)",
        playerName: "Jamie Carragher",
        playerSide: "opponent",
      });
      addSource(m, "curated");
      setComplete(m);
    },
  },
  {
    season: "1985-86",
    id: "1986-03-05-west-ham-united-a",
    patch(m) {
      m.events = [
        {
          type: "goal",
          player: "frank-stapleton",
          minute: 73,
        },
        ...(m.events ?? []),
      ];
      addSource(m, "curated");
      setComplete(m);
    },
  },
];

const UNFLAGGED_COMPLETE = [
  { season: "1967-68", id: "1968-02-24-arsenal-a" },
  { season: "1966-67", id: "1967-02-25-blackpool-h" },
  { season: "1963-64", id: "1964-02-29-sunderland-h" },
  { season: "1962-63", id: "1963-05-18-leyton-orient-h" },
  { season: "1958-59", id: "1959-03-27-portsmouth-h" },
  { season: "1958-59", id: "1958-12-20-chelsea-a" },
  { season: "1957-58", id: "1957-10-05-aston-villa-h" },
  { season: "1957-58", id: "1957-08-28-everton-h" },
  { season: "1956-57", id: "1956-10-13-sunderland-a" },
  { season: "1951-52", id: "1952-01-26-tottenham-hotspur-h" },
  { season: "1951-52", id: "1951-12-08-arsenal-a" },
];

function main() {
  const seasons = new Map<string, SeasonFile>();

  for (const fix of CURATED_FIXES) {
    const sf = seasons.get(fix.season) ?? loadSeasonFile(fix.season);
    const m = sf.matches.find((x) => x.id === fix.id);
    if (!m) throw new Error(`missing match ${fix.id}`);
    fix.patch(m);
    seasons.set(fix.season, sf);
    console.log(`curated: ${fix.id}`);
  }

  for (const row of UNFLAGGED_COMPLETE) {
    const sf = seasons.get(row.season) ?? loadSeasonFile(row.season);
    const m = sf.matches.find((x) => x.id === row.id);
    if (!m) throw new Error(`missing match ${row.id}`);
    if (unitedGoals(m.events).length !== m.score.ft[0]) {
      throw new Error(`${row.id}: events still do not reconcile`);
    }
    m.eventsComplete = true;
    seasons.set(row.season, sf);
    console.log(`unflagged: ${row.id}`);
  }

  for (const sf of seasons.values()) saveSeasonFile(sf);
  console.log(`done: ${CURATED_FIXES.length} curated, ${UNFLAGGED_COMPLETE.length} unflagged`);
}

main();
