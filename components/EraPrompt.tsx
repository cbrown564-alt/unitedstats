"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "rt-since-year";

const YEARS = Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => new Date().getFullYear() - i);

/**
 * Optional era unlock (Phase 3a): one value — "Following United since ___?" —
 * stored in localStorage and mirrored to a `?since=` URL param. No account, no
 * tracking; biases rediscovery rolls into the reader's own living memory.
 */
export function EraPrompt({ initialSince }: { initialSince: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [since, setSince] = useState<number | null>(initialSince);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (initialSince != null) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const y = Number(stored);
        if (Number.isInteger(y) && y >= 1960 && y <= new Date().getFullYear()) {
          const params = new URLSearchParams(searchParams.toString());
          if (!params.has("since")) {
            params.set("since", String(y));
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }
        }
      }
    } catch {
      // localStorage unavailable — URL param only
    }
  }, [initialSince, pathname, router, searchParams]);

  const apply = useCallback(
    (year: number | null) => {
      setSince(year);
      setOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      if (year) {
        params.set("since", String(year));
        try {
          localStorage.setItem(STORAGE_KEY, String(year));
        } catch {
          // ignore
        }
      } else {
        params.delete("since");
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="relative text-xs text-ink-faint">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-panel/60 px-3 py-1.5 text-ink-dim transition-colors hover:border-devil/40 hover:text-ink focus-ring"
      >
        <span aria-hidden>◎</span>
        {since ? `Following since ${since}` : "Following United since…?"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-line bg-panel p-2 shadow-[0_12px_28px_rgb(0_0_0_/0.35)]">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-ink-faint">Bias rediscovery into your era</p>
          <ul className="max-h-52 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => apply(null)}
                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-panel-2 focus-ring"
              >
                Any era
              </button>
            </li>
            {YEARS.map((y) => (
              <li key={y}>
                <button
                  type="button"
                  onClick={() => apply(y)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-panel-2 focus-ring ${since === y ? "text-devil-bright" : ""}`}
                >
                  {y}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
