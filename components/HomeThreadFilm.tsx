"use client";

import { useEffect, useRef, useState } from "react";

type PlaybackState = "playing" | "ended" | "reduced";

export function HomeThreadFilm() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("playing");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => {
      if (query.matches) {
        videoRef.current?.pause();
        setPlaybackState("reduced");
      } else {
        if (videoRef.current) videoRef.current.currentTime = 0;
        setPlaybackState("playing");
        void videoRef.current?.play();
      }
    };

    applyPreference();
    query.addEventListener("change", applyPreference);
    return () => query.removeEventListener("change", applyPreference);
  }, []);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setPlaybackState("playing");
    void video.play();
  };

  return (
    <div className="home-thread-film">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/video/home-thread-poster.jpg"
        aria-label="George Best and Cristiano Ronaldo: one connection across forty years. Muted animation that plays once."
        onEnded={() => setPlaybackState("ended")}
      >
        <source src="/video/home-thread.mp4" type="video/mp4" />
      </video>

      {playbackState === "playing" && (
        <span className="home-thread-film__status" aria-hidden>
          <i /> Muted
        </span>
      )}
      {playbackState === "ended" && (
        <button type="button" className="home-thread-film__replay" onClick={replay}>
          <span aria-hidden>↻</span>
          Play again
        </button>
      )}
    </div>
  );
}
