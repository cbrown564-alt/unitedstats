import Link from "next/link";
import type { Metadata } from "next";
import { QUESTIONS } from "@/lib/questions";
import { QUESTION_COMPONENTS } from "@/components/QuestionModules";

export const metadata: Metadata = {
  title: "Questions",
  description:
    "Myths United fans repeat, tested against the canonical record — each with its slice, coverage, and the matches behind it.",
  alternates: { canonical: "/questions" },
};

export default function QuestionsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="display text-3xl">Questions</h1>
        <p className="text-sm text-ink-dim mt-1 text-pretty">
          Myths fans repeat, tested against the canonical record. Each module states the slice it is
          computed from, the coverage behind it, and a route to the matches that produced it — the
          conclusion is yours to draw.
        </p>
      </header>

      <nav
        aria-label="Jump to a question"
        className="sticky top-14 z-30 -mx-4 border-b border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <ul className="scrollbar-none flex gap-2 overflow-x-auto text-xs">
          {QUESTIONS.map((q) => (
            <li key={q.slug}>
              <a
                href={`#${q.slug}`}
                className="inline-block whitespace-nowrap rounded-md border border-line px-2.5 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring"
              >
                {q.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {QUESTIONS.map((q) => {
        const Module = QUESTION_COMPONENTS[q.slug];
        return <Module key={q.slug} variant="index" />;
      })}

      <p className="text-sm text-ink-dim">
        Have a question these don&apos;t answer? Slice the full record in the{" "}
        <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link> or
        start from a{" "}
        <Link href="/players" className="text-devil-bright hover:underline">player</Link>,{" "}
        <Link href="/managers" className="text-devil-bright hover:underline">manager</Link>, or{" "}
        <Link href="/opponents" className="text-devil-bright hover:underline">opponent</Link>.
      </p>
    </div>
  );
}
