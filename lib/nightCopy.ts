/**
 * Reads a thread night's tokens against the record (see lib/threadOfNights.ts
 * for the vocabulary) and gathers its receipts. Throws on any bad reference.
 */
import { matchReceipt, type MatchReceipt } from "./journey";
import { familyName } from "./names";
import type { EventRow } from "./queries";
import { fail, type Motif, type NightBlock } from "./threadOfNights";

const TOKEN = /\{([a-z]+)(?::([^{}]*))?\}/g;
const TOKEN_KINDS = new Set(["goal", "name", "minute", "goals", "count", "score"]);
const SIDES = new Set(["united", "opponent"]);


function clock(goal: EventRow | undefined): string {
  if (!goal?.minute) return "";
  return `${goal.minute}${goal.added_time ? `+${goal.added_time}` : ""}′`;
}

function scorer(goal: EventRow | undefined): string {
  return familyName(goal?.player_display_name ?? goal?.player_name ?? "");
}

function goalPhrase(goal: EventRow | undefined): string {
  return [scorer(goal), clock(goal)].filter(Boolean).join(" ");
}

/** The first goal in the match by a scorer whose name contains `name`, on either side. */
function goalBy(night: { key: string }, receipt: MatchReceipt, name: string): EventRow {
  const matches = (goals: EventRow[]) => goals.find((goal) => (goal.player_display_name ?? goal.player_name ?? "").includes(name));
  const united = matches(receipt.unitedGoals);
  const opponent = matches(receipt.opponentGoals);
  if (united && opponent) fail(night, `"${name}" scored for both sides in ${receipt.id}; use a fuller name`);
  const goal = united ?? opponent;
  if (!goal) fail(night, `no goal by "${name}" in ${receipt.id}`);
  return goal;
}

function receiptFor(night: { key: string }, matchId: string): MatchReceipt {
  const receipt = matchReceipt(matchId);
  if (!receipt) fail(night, `unknown match "${matchId}"`);
  return receipt;
}

/** Copy with every token replaced by its value from the record. */
function resolveCopy(night: { key: string }, receipt: MatchReceipt, copy: string): string {
  const out = copy.replace(TOKEN, (token, kind: string, arg: string | undefined) => {
    if (!TOKEN_KINDS.has(kind)) fail(night, `unknown token ${token}`);
    switch (kind) {
      case "goal":
      case "name":
      case "minute": {
        if (!arg) fail(night, `${token} needs a scorer's name`);
        const goal = goalBy(night, receipt, arg);
        if (kind === "minute") {
          if (!goal.minute) fail(night, `${token}: the record has no minute for that goal`);
          return clock(goal);
        }
        return kind === "goal" ? goalPhrase(goal) : scorer(goal);
      }
      case "goals":
      case "count": {
        if (!arg || !SIDES.has(arg)) fail(night, `${token} needs united or opponent`);
        const goals = arg === "united" ? receipt.unitedGoals : receipt.opponentGoals;
        return kind === "count" ? String(goals.length) : goals.map(goalPhrase).join(". ");
      }
      default:
        return arg ? receiptFor(night, arg).score : receipt.score;
    }
  });
  if (/[{}]/.test(out)) fail(night, `unclosed or malformed token in "${copy}"`);
  return out;
}

interface ResolvedReceipt {
  receipt: MatchReceipt;
  caption: string;
  label: string;
  link_label?: string;
}

export interface ResolvedNight {
  key: string;
  id: string;
  side: "left" | "right";
  label: string;
  motif: Motif;
  title: string;
  titleAnchor: string;
  detail: string;
  memory?: { src: string; position: string };
  focusPlayerIds?: string[];
  /** Receipts in page order; the night's own is last. */
  receipts: ResolvedReceipt[];
}

/** One night with its copy and receipts read from the record. Throws on any bad reference. */
export function resolveNight(night: NightBlock): ResolvedNight {
  const receipt = receiptFor(night, night.match_id);
  const copy = (value: string) => resolveCopy(night, receipt, value);
  const focus = (night.focus ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => goalBy(night, receipt, name).player_id)
    .filter((id): id is string => !!id);
  return {
    key: night.key,
    id: night.match_id,
    side: night.side,
    label: night.label,
    motif: night.motif,
    title: copy(night.title),
    titleAnchor: copy(night.title_anchor),
    detail: copy(night.detail),
    memory: night.memory_src ? { src: night.memory_src, position: night.memory_position ?? "50% 25%" } : undefined,
    focusPlayerIds: focus.length > 0 ? focus : undefined,
    receipts: [
      ...(night.earlier ?? []).map((r) => ({ receipt: receiptFor(night, r.match_id), caption: r.caption, label: r.label, link_label: r.link_label })),
      { receipt, caption: night.caption, label: night.label },
    ],
  };
}

/** A goal's minute from the record, as "22′", or undefined when the match or goal is missing. */
export function goalMinute(matchId: string, name: string): string | undefined {
  const receipt = matchReceipt(matchId);
  if (!receipt) return undefined;
  const goal = [...receipt.unitedGoals, ...receipt.opponentGoals].find((g) => (g.player_display_name ?? g.player_name ?? "").includes(name));
  return goal?.minute ? clock(goal) : undefined;
}
