import { feedbackFormEmbedSrc } from "@/lib/feedback";

type FeedbackFormEmbedProps = {
  fromPath?: string | null;
};

export function FeedbackFormEmbed({ fromPath }: FeedbackFormEmbedProps) {
  const src = feedbackFormEmbedSrc(fromPath);

  if (!src) {
    return (
      <div className="rounded-lg border border-line bg-panel px-5 py-8 text-sm text-ink-dim">
        <p className="max-w-xl leading-6">
          Feedback form is not configured yet. Add{" "}
          <code className="rounded bg-ink/10 px-1 py-0.5 font-mono text-xs text-ink">NEXT_PUBLIC_FEEDBACK_FORM_EMBED_URL</code>{" "}
          in your deployment environment with the Google Form embed URL.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <iframe
        title="Red Thread feedback form"
        src={src}
        width="100%"
        height={920}
        className="block min-h-[640px] w-full border-0"
        loading="lazy"
      >
        Loading feedback form…
      </iframe>
    </div>
  );
}
