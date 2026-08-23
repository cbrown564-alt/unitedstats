/**
 * Curated compare fixtures. Kept off `lib/compare.ts` so client pages can list
 * debates without pulling SQLite into the browser bundle.
 */

export type CompareMode = "players" | "managers" | "eras";

export function curatedComparisonKey(
  mode: Extract<CompareMode, "players" | "managers">,
  a: string,
  b: string,
): string {
  return `${mode}:${a}:${b}`;
}

/** A curated head-to-head: a labelled fixture between two resolvable subjects. */
export interface CuratedDebate {
  label: string;
  /** Subject ids/keys that resolve exactly: player ids, manager ids, era keys. */
  a: string;
  b: string;
  hook: string;
}

/**
 * Curated head-to-heads per mode — the "great debates". The /compare empty state
 * leads with these rather than a blank form, and the /explore discovery home pulls
 * its Compare launcher from the same list, so the two surfaces never drift.
 */
export const CURATED_DEBATES: Record<CompareMode, CuratedDebate[]> = {
  players: [
    { label: "Rooney vs Charlton", a: "wayne-rooney", b: "bobby-charlton", hook: "All-time scoring charts — goals, apps, and the years between them." },
    { label: "Schmeichel vs Van der Sar", a: "peter-schmeichel", b: "edwin-van-der-sar", hook: "Two European Cup winners in goal — clean sheets and goals conceded per game." },
    { label: "Vidic vs Pallister", a: "nemanja-vidic", b: "gary-pallister", hook: "Centre-backs a generation apart — defensive record and silverware." },
    { label: "Ronaldo vs Best", a: "cristiano-ronaldo", b: "george-best", hook: "Two No. 7s — goals, apps, and the eras they defined." },
    { label: "Giggs vs Scholes", a: "ryan-giggs", b: "paul-scholes", hook: "Academy spine of the Ferguson years, season by season." },
    { label: "Cantona vs Van Persie", a: "eric-cantona", b: "robin-van-persie", hook: "Two arrivals that shifted a title race in their first seasons." },
  ],
  managers: [
    { label: "Ferguson vs Busby", a: "alex-ferguson", b: "matt-busby", hook: "Two long reigns — trophies, win rate, and tenure side by side." },
    { label: "Ferguson vs Mourinho", a: "alex-ferguson", b: "jose-mourinho", hook: "Twenty-seven years against three — points, cups, and exits." },
    { label: "Busby vs Mangnall", a: "matt-busby", b: "ernest-mangnall", hook: "The club's first two long title-winning tenures." },
  ],
  eras: [
    { label: "Busby era vs Ferguson era", a: "busby", b: "ferguson", hook: "Two defining reigns — trophy haul and league finishes." },
    { label: "1990s vs 2010s", a: "1990s", b: "2010s", hook: "Title years of the nineties against the post-Ferguson decade." },
    { label: "1950s vs 2000s", a: "1950s", b: "2000s", hook: "Busby Babes decade against the Ronaldo-era peak." },
  ],
};
