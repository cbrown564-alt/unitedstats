import { matchRef } from "./citations";
import { clubName, venueLabel } from "./format";
import { matchById, eventsForMatch, lineupForMatch, type EventRow, type LineupRow } from "./queries";
import type { CorrectionPrefill } from "./corrections";

/** One pickable field on the "what's wrong?" step: enough to render a row and to
 *  seed the claim flow once chosen. */
interface CorrectableField {
  /** Primary label — the fact in context, e.g. "Attendance", "23' Højlund", "#9 Højlund". */
  label: string;
  /** Short field tag rendered as a chip when a fact has more than one editable field. */
  field?: string;
  /** Current value, shown as a muted preview. */
  current: string;
  prefill: CorrectionPrefill;
}

interface CorrectionGroup {
  name: string;
  fields: CorrectableField[];
}

export interface CorrectionInventory {
  kind: "match" | "player";
  id: string;
  label: string;
  pagePath: string;
  groups: CorrectionGroup[];
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const SCORING_TYPES = new Set(["goal", "pen-goal", "own-goal-for", "opp-goal", "own-goal-against"]);

export function matchCorrectionInventory(id: string): CorrectionInventory | null {
  const m = matchById(id);
  if (!m) return null;

  const pagePath = `/match/${id}`;
  const citableId = matchRef(id).id;
  const label = `${clubName(m.date)} ${m.gf}-${m.ga} ${m.opponent_name}`;

  const matchPrefill = (field: string, current: string | number | null | undefined): CorrectionPrefill => ({
    targetKind: "match",
    targetId: id,
    targetLabel: label,
    fieldPath: `matches[id=${id}].${field}`,
    currentValue: current,
    pagePath,
    citableId,
  });

  // --- This match ---------------------------------------------------------
  const matchFields: CorrectableField[] = [
    { label: "Date", current: m.date, prefill: matchPrefill("date", m.date) },
    { label: "Venue", current: venueLabel(m.venue), prefill: matchPrefill("venue", m.venue) },
    { label: "Score", current: `${m.gf}-${m.ga}`, prefill: matchPrefill("score", `${m.gf}-${m.ga}`) },
    { label: "Competition", current: m.competition_name, prefill: matchPrefill("competition", m.competition_name) },
  ];
  if (m.round) matchFields.push({ label: "Round", current: m.round, prefill: matchPrefill("round", m.round) });
  matchFields.push({
    label: "Attendance",
    current: m.attendance != null ? String(m.attendance) : "—",
    prefill: matchPrefill("attendance", m.attendance),
  });

  // --- Goals --------------------------------------------------------------
  const events = eventsForMatch(id);
  const eventPrefill = (index: number, field: string, current: string | number | null | undefined): CorrectionPrefill => ({
    targetKind: "event",
    targetId: `${id}:events[${index}]`,
    targetLabel: `${label} event ${index + 1}`,
    fieldPath: `matches[id=${id}].events[${index}].${field}`,
    currentValue: current,
    pagePath,
    citableId,
  });

  const goalFields: CorrectableField[] = [];
  events.forEach((e: EventRow, index) => {
    if (!SCORING_TYPES.has(e.type)) return;
    const who = e.player_display_name ?? "Goal";
    const moment = e.minute != null ? `${e.minute}'` : "—";
    const ctx = `${moment} ${who}`;
    goalFields.push({ label: ctx, field: "scorer", current: who, prefill: eventPrefill(index, "player", e.player_display_name) });
    goalFields.push({
      label: ctx,
      field: "minute",
      current: e.minute != null ? `${e.minute}'` : "not recorded",
      prefill: eventPrefill(index, "minute", e.minute),
    });
    if (e.assist_display_name) {
      goalFields.push({
        label: ctx,
        field: "assist",
        current: e.assist_display_name,
        prefill: eventPrefill(index, "assist", e.assist_display_name),
      });
    }
  });

  // --- Team sheet ---------------------------------------------------------
  const lineup = lineupForMatch(id).filter((p: LineupRow) => p.player_side === "united");
  const sheetFields: CorrectableField[] = [];
  for (const p of lineup) {
    const selector = p.player_id ?? p.provider_id ?? slug(p.player_display_name);
    const ctx = p.shirt != null ? `#${p.shirt} ${p.player_display_name}` : p.player_display_name;
    const lineupPrefill = (field: string, current: string | number | null | undefined): CorrectionPrefill => ({
      targetKind: "match",
      targetId: id,
      targetLabel: label,
      fieldPath: `matches[id=${id}].lineup[player=${selector}].${field}`,
      currentValue: current,
      pagePath,
      citableId,
    });
    sheetFields.push({ label: ctx, field: "shirt", current: p.shirt != null ? String(p.shirt) : "—", prefill: lineupPrefill("shirt", p.shirt) });
    sheetFields.push({ label: ctx, field: "name", current: p.player_display_name, prefill: lineupPrefill("playerName", p.player_display_name) });
  }

  const groups: CorrectionGroup[] = [{ name: "This match", fields: matchFields }];
  if (goalFields.length > 0) groups.push({ name: "Goals", fields: goalFields });
  if (sheetFields.length > 0) groups.push({ name: "Team sheet", fields: sheetFields });

  return { kind: "match", id, label, pagePath, groups };
}
