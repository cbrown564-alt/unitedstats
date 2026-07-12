type FilmFormat = {
  width: number;
  height: number;
  fps: number;
};

type MatchSignature =
  | "first-xi"
  | "score-storm"
  | "extra-time-burst"
  | "bench-reversal"
  | "penalty-constellation";

export type OpeningMatchEdit = {
  matchId: string;
  year: number;
  start: number;
  x: number;
  visualMode: MatchSignature;
  eyebrow: string;
  headline: string;
};

type AudioClip = {
  asset: string;
  timelineFrom: number;
  sourceFrom?: number;
  duration: number;
  gain?: number;
  fadeIn?: number;
  fadeOut?: number;
};

export type AudioPlan = {
  id: string;
  clips: readonly AudioClip[];
};

export type FilmEdition = {
  id: string;
  title: string;
  durationInFrames: number;
  format: FilmFormat;
  openingDurationInFrames: number;
  openingMatches: readonly OpeningMatchEdit[];
  acts: {
    rhyme: boolean;
    treble: boolean;
    fergie: boolean;
    fortress: boolean;
    receipt: boolean;
  };
  audioPlanId: string;
};

export type RedThreadFilmProps = {
  editionId?: string;
  withAudio?: boolean;
  withCaptions?: boolean;
};
