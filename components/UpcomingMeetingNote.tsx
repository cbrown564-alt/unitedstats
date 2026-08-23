import { fmtDateLong, homeAwayLabel } from "@/lib/format";
import { isNextOpponent, upcomingMeeting } from "@/lib/upcoming";

export function UpcomingMeetingNote({ opponentId }: { opponentId: string }) {
  const meeting = upcomingMeeting(opponentId);
  if (!meeting) return null;

  const label = isNextOpponent(opponentId) ? "Next up" : "Next meeting";
  const venue = homeAwayLabel(meeting.venue).toLowerCase();
  const round = meeting.round ? ` · ${meeting.round}` : "";

  return (
    <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink-dim">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-devil-bright">
        {label}
      </span>
      <span aria-hidden className="text-ink-faint">
        {" "}
        ·{" "}
      </span>
      <span className="text-ink">
        {fmtDateLong(meeting.date)} · {meeting.competitionName}
        {round} · {venue}
      </span>
    </p>
  );
}
