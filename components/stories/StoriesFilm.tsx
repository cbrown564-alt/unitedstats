"use client";

import { useState } from "react";

const VIDEO_ID = "BNEzcXI_zXE";
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

export default function StoriesFilm() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`stories-film-player${isPlaying ? " is-playing" : ""}`}>
      {isPlaying ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
          title="Red Thread: 140 years of Manchester United history"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="stories-film-play focus-ring"
          aria-label="Play Red Thread: 140 years of Manchester United history, 1 minute 30 seconds"
          onClick={() => setIsPlaying(true)}
        >
          <span className="stories-film-poster" aria-hidden />
          <span className="stories-film-shade" aria-hidden />
          <span className="stories-film-duration" aria-hidden>01:30</span>
          <span className="stories-film-playmark" aria-hidden><i /></span>
          <span className="stories-film-playcopy">
            <b>Play the film</b>
            <small>Sound on</small>
          </span>
        </button>
      )}
      <noscript>
        <a href={WATCH_URL}>Watch the Red Thread film on YouTube</a>
      </noscript>
    </div>
  );
}
