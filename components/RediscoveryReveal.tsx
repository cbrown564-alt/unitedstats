"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ERA_OPTIONS, ERA_STORAGE_KEY, type RevealPick } from "@/lib/eras";

// A tiny external store for the "your era" preference. Reading it through
// useSyncExternalStore (rather than a setState-in-effect) is the idiomatic,
// hydration-safe path: the server snapshot is null, so SSR and first client paint
// agree on the warm pool, and the reader's saved era is adopted right after.
const eraListeners = new Set<() => void>();

function readEra(): string | null {
  try {
    return window.localStorage.getItem(ERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeEra(key: string | null): void {
  try {
    if (key) window.localStorage.setItem(ERA_STORAGE_KEY, key);
    else window.localStorage.removeItem(ERA_STORAGE_KEY);
  } catch {
    /* private mode — the reveal still works, it just won't persist */
  }
  eraListeners.forEach((l) => l());
}

function subscribeEra(cb: () => void): () => void {
  eraListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    eraListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function useEra(): string | null {
  return useSyncExternalStore(subscribeEra, readEra, () => null);
}

/**
 * The homepage rediscovery beat (RESTRAINT-PASS Phase 3a · CONTEXT.md §6) — a
 * second, *personal* spark below the warm curated hero. It runs the curiosity-gap
 * mechanic: a recognition prompt with the **result withheld**, a reveal that closes
 * the loop, and a door on into the full match (the deepening).
 *
 * Two sources, switched by one guardrail-safe knob:
 *  - **Ungated (default):** a warm, forgotten *win* — the first experience stays
 *    warm, and the raw engine's defeat-skew is kept off first contact.
 *  - **After the era ask:** nights from the reader's *formative window*, where the
 *    engine is free to lean bittersweet — defeats that have aged into the good kind.
 *
 * The era choice is a single `localStorage` value (no account, no tracking). Server
 * render is always the warm pool, so a no-JS / first paint shows a working warm
 * reveal; the era swap is the only client layer.
 */

export interface EraBucket {
  key: string;
  label: string;
  picks: RevealPick[];
}

export function RediscoveryReveal({ warm, eras }: { warm: RevealPick[]; eras: EraBucket[] }) {
  const eraKey = useEra();
  const [picking, setPicking] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const activeEra = eraKey ? eras.find((e) => e.key === eraKey) ?? null : null;
  const pool = activeEra && activeEra.picks.length > 0 ? activeEra.picks : warm;
  if (pool.length === 0) return null;

  const pick = pool[index % pool.length];

  function chooseEra(key: string) {
    writeEra(key); // external store → useEra() re-reads on the next render
    setPicking(false);
    setIndex(0);
    setRevealed(false);
  }

  function another() {
    setIndex((i) => (i + 1) % pool.length);
    setRevealed(false);
  }

  const eyebrow = activeEra ? `From ${activeEra.label}` : "A forgotten night";

  return (
    <section aria-labelledby="rediscover-heading">
      <div className="relative overflow-hidden rounded-xl border border-line bg-pitch p-6 sm:p-9">
        {/* Floodlight from above and a red wash by the thread — the hero's atmosphere,
            dialled down for a secondary beat. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-15%,rgba(255,238,210,0.07),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-devil-bright/60 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-devil-bright">
            {eyebrow}
          </p>

          {/* Sentence-case editorial — the warm, intimate voice of the hero's
              authored line, not the foundation's uppercase section heads. A
              recognition prompt should murmur, not shout. */}
          <h2
            id="rediscover-heading"
            className="mt-4 max-w-3xl text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem] sm:leading-[1.06]"
          >
            {pick.prompt}
          </h2>

          {!revealed ? (
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-devil-bright/40 bg-devil/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-devil-bright transition-colors hover:bg-devil/20"
              >
                Reveal the night
                <span aria-hidden>▸</span>
              </button>
              <button
                type="button"
                onClick={another}
                className="focus-ring text-sm text-ink-faint transition-colors hover:text-ink-dim"
              >
                or another ↺
              </button>
            </div>
          ) : (
            <div className="surprise-in mt-7">
              <p className="flex flex-wrap items-baseline gap-x-3 text-lg font-medium sm:text-xl">
                <span className="text-ink">Manchester United</span>
                <span className={`stat-num text-3xl font-bold sm:text-4xl ${pick.toneClass}`}>
                  {pick.scoreText}
                </span>
                <span className="text-ink">{pick.opponent}</span>
              </p>
              <p className="stat-num mt-2 text-xs text-ink-faint">
                {pick.competition}
                {pick.round ? ` · ${pick.round}` : ""} ·{" "}
                {pick.venue === "H" ? "home" : pick.venue === "A" ? "away" : "neutral"} · {pick.year}
              </p>
              <p className="mt-4 text-base text-ink-dim">{pick.caption}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={pick.href}
                  className="focus-ring inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-devil-bright hover:underline"
                >
                  See the night
                  <span aria-hidden>→</span>
                </Link>
                <button
                  type="button"
                  onClick={another}
                  className="focus-ring text-sm text-ink-faint transition-colors hover:text-ink-dim"
                >
                  Show me another ↺
                </button>
              </div>
            </div>
          )}

          {/* The era knob — the reminiscence-bump unlock, asked only after the reader
              has had a (warm) spark. One value, no account. */}
          <div className="mt-8 border-t border-line/60 pt-5">
            {activeEra && !picking ? (
              <p className="text-xs text-ink-faint">
                Pulled from {activeEra.label}.{" "}
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="focus-ring text-devil-bright hover:underline"
                >
                  change
                </button>
              </p>
            ) : (
              <div>
                <p className="text-xs text-ink-faint">
                  Pull these from your own years — when did you start following United?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ERA_OPTIONS.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => chooseEra(e.key)}
                      className={`focus-ring rounded-full border px-3 py-1 text-sm transition-colors ${
                        eraKey === e.key
                          ? "border-devil-bright/60 bg-devil/15 text-devil-bright"
                          : "border-line text-ink-dim hover:border-devil-bright/40 hover:text-ink"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
