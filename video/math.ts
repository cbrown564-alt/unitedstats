export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function smoothstep(start: number, end: number, value: number): number {
  const t = clamp01((value - start) / Math.max(0.0001, end - start));
  return t * t * (3 - 2 * t);
}

export function windowed(
  value: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number,
): number {
  return smoothstep(fadeInStart, fadeInEnd, value) * (1 - smoothstep(fadeOutStart, fadeOutEnd, value));
}

