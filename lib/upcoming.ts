import fs from "node:fs";
import path from "node:path";
import {
  nextOpponent,
  upcomingVsOpponent,
  type UpcomingOverlay,
} from "@/pipeline/upcoming";

const UPCOMING_PATH = path.join(process.cwd(), "data", "canonical", "upcoming.json");

const EMPTY: UpcomingOverlay = {
  season: "",
  source: "openfootball",
  updatedAt: "",
  competitions: [],
  fixtures: [],
};

function loadUpcoming(): UpcomingOverlay {
  if (!fs.existsSync(UPCOMING_PATH)) return EMPTY;
  return JSON.parse(fs.readFileSync(UPCOMING_PATH, "utf8")) as UpcomingOverlay;
}

export function upcomingMeeting(opponentId: string) {
  return upcomingVsOpponent(loadUpcoming(), opponentId);
}

export function isNextOpponent(opponentId: string): boolean {
  return nextOpponent(loadUpcoming())?.opponentId === opponentId;
}
