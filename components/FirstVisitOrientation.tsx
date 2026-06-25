"use client";

import { useSyncExternalStore } from "react";

// One flag, set once, in the same namespace as the other client niceties
// (recent searches, collections). Best-effort: any storage error is swallowed —
// the orientation is a courtesy, never a dependency.
const KEY = "unitedstats:oriented";

// A tiny external store over the dismiss flag, read through useSyncExternalStore
// (the project's recents.ts pattern): the server snapshot is always "dismissed",
// so the strip renders nothing during SSR and is revealed only after hydration
// for a true first visit — no setState-in-effect, no hydration mismatch.
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function read(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) != null;
  } catch {
    return true; // storage unavailable — stay quiet rather than nag.
  }
}

function getSnapshot(): boolean {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function dismissOrientation(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore — a dismissed-but-unsaved banner is a no-op next load at worst.
  }
  cache = true;
  for (const l of listeners) l();
}

/**
 * A lightweight, dismissable first-visit orientation (Phase 18.4) for the
 * newcomer who doesn't yet know what the box can do. It answers "what can I even
 * ask here?" in one line and then stays gone.
 *
 * It honours the researcher guardrail by *never* rendering on the server and only
 * appearing once: the strip is hidden until hydration, shown only if the dismiss
 * flag is unset, and removed the instant it is. A returning or expert visitor —
 * who has dismissed it, or who arrives through the header search and bypasses the
 * homepage — never sees it and is never slowed. Plain opacity reveal (reused
 * `pop-in`, neutralised under reduced-motion), no modal, no overlay, no focus trap.
 */
export function FirstVisitOrientation() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (dismissed) return null;

  return (
    <div
      role="note"
      className="pop-in flex items-start gap-3 rounded-xl border border-devil/30 bg-devil/5 px-4 py-3 text-sm"
    >
      <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-devil-bright" />
      <p className="flex-1 text-pretty text-ink-dim">
        <span className="font-medium text-ink">New here?</span> Red Thread holds every match Manchester
        United have played, back to 1886. Ask a question, start from a name, or just pull a thread — every
        figure links to the matches behind it.
      </p>
      <button
        type="button"
        onClick={dismissOrientation}
        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink focus-ring"
      >
        Got it <span aria-hidden>✕</span>
      </button>
    </div>
  );
}
