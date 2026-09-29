import Link from "next/link";
import { recordStories } from "@/lib/recordStories";

export function RecordNext({ kind, id, season }: { kind: "match" | "player" | "opponent"; id: string; season?: string }) {
  return <section aria-label="Continue through United history" className="space-y-2">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Where this record takes you</h2>
    {recordStories(kind, id, season).map(story => <Link key={story.href} href={story.href} data-analytics-event="related_content_click" className="block rounded-lg border border-line bg-panel p-4 hover:border-devil focus-ring">
      <h3 className="font-semibold text-devil-bright">{story.title} →</h3><p className="mt-2 text-sm text-ink-dim">{story.reason}</p>
    </Link>)}
  </section>;
}
