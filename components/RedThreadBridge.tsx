"use client";

import { useEffect, useRef } from "react";

const MEDIA = {
  "evidence-handoff": {
    video: "/media/red-thread/evidence-handoff.mp4",
    poster: "/media/red-thread/evidence-handoff.jpg",
  },
  "loop-fold": {
    video: "/media/red-thread/loop-fold.mp4",
    poster: "/media/red-thread/loop-fold.jpg",
  },
  "receipt-pass": {
    video: "/media/red-thread/receipt-pass.mp4",
    poster: "/media/red-thread/receipt-pass.jpg",
  },
} as const;

type RedThreadBridgeVariant = keyof typeof MEDIA;

/** A decorative, non-documentary transition between verified story sections. */
export function RedThreadBridge({
  variant,
  className = "",
}: {
  variant: RedThreadBridgeVariant;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = MEDIA[variant];

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => undefined);
      else video.pause();
    }, { threshold: 0.2 });

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`red-thread-bridge ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- poster remains visible if video cannot play */}
      <img className="red-thread-bridge__poster" src={media.poster} alt="" />
      <video
        ref={videoRef}
        className="red-thread-bridge__video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={media.poster}
      >
        <source src={media.video} type="video/mp4" />
      </video>
    </div>
  );
}
