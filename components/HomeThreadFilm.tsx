"use client";
import { useRef, useState } from "react";

/** Playback is a deliberate choice; the still and adjacent text carry the story. */
export function HomeThreadFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  return <div className="home-thread-film">
    <video ref={ref} controls muted playsInline preload="none" poster="/video/home-thread-poster.jpg" aria-label="Best and Ronaldo: highest-scoring United seasons, forty years apart" onError={() => setFailed(true)}>
      <source src="/video/home-thread.mp4" type="video/mp4" />
    </video>
    {failed && <p role="status" className="p-3 text-sm">The film could not load. Read the complete story using the link below.</p>}
  </div>;
}
