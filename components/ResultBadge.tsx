export function ResultBadge({ result, outcome }: { result: string; outcome?: string }) {
  const r = outcome ?? result;
  const color =
    r === "W" ? "bg-win/15 text-win border-win/40"
    : r === "L" ? "bg-loss/15 text-loss border-loss/40"
    : "bg-draw/10 text-draw border-draw/30";
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded border text-xs font-bold ${color}`}
    >
      {r}
    </span>
  );
}
