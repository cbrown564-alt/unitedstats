"use client";
import { useEffect, useRef } from "react";
import { trackProductEvent } from "@/lib/analytics";

/** Completion means the end marker was visible for one second, not proof of reading. */
export function StoryProgress({ slug }: { slug: string }) {
  const end = useRef<HTMLDivElement>(null);
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (started.current !== slug) { trackProductEvent("story_start", { story: slug }); started.current = slug; }
    let sent = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry.isIntersecting && !sent) timer = setTimeout(() => {
        if (document.visibilityState !== "visible") return;
        sent = true;
        trackProductEvent("story_complete", { story: slug });
        observer.disconnect();
      }, 1000);
    }, { threshold: 0.5 });
    if (end.current) observer.observe(end.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [slug]);
  return <div ref={end} className="h-4" aria-hidden />;
}
